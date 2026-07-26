import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareRatioCatalog } from '../../worker/src/ratio-dsl.js';
import {
  assignItemsToTemplate,
  buildPlannerAllergenAliases,
  buildPotCandidates,
  normalizePlannerItems,
  normalizePlannerRequest,
  planMeal,
  rankPotCandidates,
} from '../../worker/src/planner-v2.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const readJson = name => JSON.parse(fs.readFileSync(path.join(here, '../data', name), 'utf8'));
const assets = Object.freeze({
  taxonomy: readJson('ingredient-taxonomy.v1.json'),
  templates: readJson('meal-templates.v2.json'),
  ratios: readJson('ratio-rules.v1.json'),
  recipes: readJson('recipe-library.json'),
});
const activeTemplate = id => assets.templates.templates.find(template => template.template_id === id);
const request = ({ mode = 'pantry', intent = 'normal', must = [], prefer = [], dislikes = [], servings = 2 } = {}) => normalizePlannerRequest({
  schema_version: 2,
  planner_version: 'pantry-planner-v2',
  constraints: { mode, intent, servings, must_use: must, prefer_use: prefer, dislikes },
});
const context = (normalizedItems, overrides = {}) => {
  const prepared = prepareRatioCatalog(assets.ratios, {
    taxonomy: assets.taxonomy,
    templates: assets.templates,
    recipes: assets.recipes,
  });
  assert.equal(prepared.ok, true);
  return {
    taxonomy: assets.taxonomy,
    ratioCatalog: prepared.catalog,
    mode: 'pantry',
    intent: 'normal',
    servings: 2,
    ...overrides,
  };
};

test('four-item pantry never presents a one-item pot and computes coverage against all four', () => {
  const result = planMeal(assets, request({ must: ['番茄', '金针菇', '鸡蛋', '西兰花'] }));
  assert.equal(result.status, 'complete');
  assert.ok(result.plan.pots.every(pot => pot.planned_must_use.length >= 2));
  assert.equal(result.plan.pots[0].coverage_ratio, 1);
  assert.equal(result.plan.pots[0].planned_must_use.length, 4);
});

test('the same pantry enters a composable template without selecting a fixed recipe', () => {
  const candidates = buildPotCandidates(assets, request({ must: ['番茄', '金针菇', '鸡蛋', '西兰花'] }));
  const highCoverage = candidates.find(candidate => candidate.coverage_ratio === 1);
  assert.equal(highCoverage?.template_id, 'acid-staple-pot');
  assert.equal('recipe_id' in highCoverage, false);
  assert.deepEqual(highCoverage.planned_must_use.map(item => item.canonical).sort(), ['番茄', '金针菇', '鸡蛋', '西兰花'].sort());
});

test('recommend chooses a coherent non-empty subset and explains every unused input honestly', () => {
  const result = planMeal(assets, request({
    mode: 'recommend',
    must: [],
    prefer: ['牛里脊', '番茄', '鸡蛋', '西兰花'],
  }));
  assert.equal(result.status, 'ready');
  assert.ok(result.plan.planned_prefer_use.length >= 1);
  assert.ok(result.plan.unused_prefer_use.every(item => item.reason_code && item.reason));
  assert.doesNotMatch(result.commitment, /全部|全都|清空/);
});

test('generic beef accepts tenderloin while preserving the raw cut and rejects brisket or ground forms', () => {
  const tenderloin = normalizePlannerItems([
    { raw: '牛里脊', role: 'must_use' }, { raw: '熟米饭', role: 'must_use' },
  ], assets.taxonomy);
  const accepted = assignItemsToTemplate(activeTemplate('beef-staple-pot'), tenderloin, context(tenderloin));
  assert.equal(accepted.ok, true);
  const beef = accepted.slot_assignment.protein[0];
  assert.equal(beef.raw, '牛里脊');
  assert.equal(beef.canonical, '牛肉');
  assert.equal(beef.shape_or_cut, 'tenderloin');

  const generic = normalizePlannerItems([
    { raw: '牛肉', role: 'must_use' }, { raw: '熟米饭', role: 'must_use' },
  ], assets.taxonomy);
  assert.equal(assignItemsToTemplate(activeTemplate('beef-staple-pot'), generic, context(generic)).ok, true);

  const beefOnly = normalizePlannerItems([{ raw: '牛里脊', role: 'must_use' }], assets.taxonomy);
  const insufficient = assignItemsToTemplate(activeTemplate('beef-staple-pot'), beefOnly, context(beefOnly));
  assert.equal(insufficient.ok, false);
  assert.equal(insufficient.rejection_reason.reason_code, 'no_compatible_slot');

  for (const raw of ['牛腩', '牛肉末']) {
    const normalized = normalizePlannerItems([
      { raw, role: 'must_use' }, { raw: '熟米饭', role: 'must_use' },
    ], assets.taxonomy);
    const rejected = assignItemsToTemplate(activeTemplate('beef-staple-pot'), normalized, context(normalized));
    assert.equal(rejected.ok, false, raw);
    assert.equal(rejected.rejection_reason.reason_code, 'unsupported_shape_or_cut', raw);
  }
});

test('豆腐 and 老豆腐 share one canonical identity that is used once and never also shown unused', () => {
  const result = planMeal(assets, request({ must: ['豆腐', '老豆腐', '青菜'] }));
  const used = result.plan.planned_must_use.filter(item => item.canonical === '老豆腐');
  const unused = result.plan.unplanned_must_use.filter(item => item.canonical === '老豆腐');
  assert.equal(used.length, 1);
  assert.equal(unused.length, 0);
  const tofuRows = result.normalized_items.filter(item => item.canonical === '老豆腐');
  assert.equal(tofuRows.length, 2);
  assert.equal(tofuRows.filter(item => item.duplicate_of !== null).length, 1);
});

test('pantry single-pot display floors are exact for 2, 3, 4-6, and 7+ submitted items', () => {
  const two = buildPotCandidates(assets, request({ must: ['番茄', '未知A'] })).find(pot => pot.template_id === 'acid-staple-pot');
  assert.equal(two.coverage_ratio, 0.5);
  assert.equal(two.single_pot_eligible, false);

  const three = buildPotCandidates(assets, request({ must: ['番茄', '鸡蛋', '未知A'] })).find(pot => pot.template_id === 'acid-staple-pot');
  assert.equal(three.coverage_ratio, 2 / 3);
  assert.equal(three.single_pot_eligible, true);

  const four = buildPotCandidates(assets, request({ must: ['番茄', '未知A', '未知B', '未知C'] })).find(pot => pot.template_id === 'acid-staple-pot');
  assert.equal(four.coverage_ratio, 0.25);
  assert.equal(four.single_pot_eligible, false);

  const seven = buildPotCandidates(assets, request({ must: ['番茄', '金针菇', '鸡蛋', '西兰花', '青菜', '胡萝卜', '土豆'] }));
  assert.ok(seven.length > 0);
  assert.ok(seven.every(pot => pot.single_pot_eligible === false));

  const lowCoverageFinal = planMeal(assets, request({ must: ['牛腩', '大米'] }));
  assert.equal(lowCoverageFinal.status, 'no_valid_plan');
  assert.equal(lowCoverageFinal.plan.pots.length, 0);
  assert.equal(lowCoverageFinal.plan.planned_must_use.length, 0);
  assert.deepEqual(
    lowCoverageFinal.plan.unplanned_must_use.map(item => item.raw).sort(),
    ['大米', '牛腩'].sort(),
  );
});

test('unknown must-use remains in the denominator and unplanned list and blocks complete', () => {
  const result = planMeal(assets, request({ must: ['番茄', '鸡蛋', '神秘叶子'] }));
  assert.notEqual(result.status, 'complete');
  assert.equal(result.generation_allowed, false);
  assert.equal(result.plan.coverage_ratio, 2 / 3);
  assert.equal(result.plan.recognition_ratio, 2 / 3);
  assert.deepEqual(result.plan.unplanned_must_use.map(item => item.reason_code), ['unrecognized_ingredient']);
});

test('semantic duplicates never inflate coverage denominators or planned counts', () => {
  const candidates = buildPotCandidates(assets, request({ must: ['豆腐', '老豆腐', '青菜'] }));
  const pot = candidates.find(candidate => candidate.template_id === 'egg-tofu-vegetable-pot');
  assert.equal(pot.coverage_ratio, 1);
  assert.equal(pot.planned_must_use.length, 2);
  assert.equal(pot.recognized_coverage_ratio, 1);
});

test('quick is a hard limit and never admits templates over 30 minutes', () => {
  for (const mode of ['recommend', 'pantry']) {
    const candidates = buildPotCandidates(assets, request({
      mode,
      intent: 'quick',
      must: mode === 'pantry' ? ['番茄', '鸡蛋'] : [],
      prefer: mode === 'recommend' ? ['番茄', '鸡蛋'] : [],
    }));
    assert.ok(candidates.every(candidate => candidate.time_range.max_minutes <= 30));
    assert.ok(candidates.every(candidate => activeTemplate(candidate.template_id).supported_intents.includes('quick')));
  }
});

test('cooked rice, egg, and cabbage form one complete broth-rice meal with executable two-serving amounts', () => {
  const result = planMeal(assets, request({ must: ['熟米饭', '鸡蛋', '白菜'], servings: 2 }));

  assert.equal(result.status, 'complete');
  assert.equal(result.plan.pots.length, 1);
  const pot = result.plan.pots[0];
  assert.equal(pot.template_id, 'broth-rice-pot');
  assert.equal(pot.coverage_ratio, 1);
  assert.deepEqual(pot.planned_must_use.map(item => item.raw).sort(), ['熟米饭', '鸡蛋', '白菜'].sort());
  const amounts = new Map(pot.ingredient_amounts.map(item => [item.name, item.grams]));
  assert.equal(amounts.get('熟米饭'), 360);
  assert.equal(amounts.get('鸡蛋'), 130);
  assert.equal(amounts.get('白菜'), 220);
  assert.equal(amounts.get('水'), 650);
});

test('Jiangnan M1 menu cores become complete single-pot plans without losing regional names', () => {
  for (const [title, must] of [
    ['上海咸肉菜饭', ['大米', '咸五花肉', '小白菜']],
    ['苏州青菜咸肉饭', ['大米', '咸五花肉', '小白菜']],
    ['南京腊肉菜饭', ['大米', '腊五花肉', '矮脚黄']],
    ['南京香肠菜饭', ['大米', '广式腊肠', '矮脚黄']],
    ['金山菜饭', ['大米', '小白菜']],
    ['家常平菇焖饭', ['大米', '平菇']],
  ]) {
    const result = planMeal(assets, request({ must }));
    assert.equal(result.status, 'complete', title);
    assert.equal(result.plan.plan_kind, 'single_pot', title);
    assert.equal(result.plan.pots.length, 1, title);
    const pot = result.plan.pots[0];
    assert.equal(pot.template_id, 'savory-mixed-rice-pot', title);
    assert.deepEqual(new Set(pot.planned_must_use.map(item => item.raw)), new Set(must), title);
    assert.deepEqual(result.plan.unplanned_must_use, [], title);
    assert.equal(pot.coverage_ratio, 1, title);
  }
});

test('Fujian Taiwan M1 menu cores become complete single-pot generic rice plans', () => {
  for (const [title, must] of [
    ['高丽菜香菇炊饭', ['大米', '卷心菜', '鲜香菇']],
    ['福建盖菜肉末咸饭', ['大米', '芥菜', '猪肉末']],
  ]) {
    const result = planMeal(assets, request({ must }));
    assert.equal(result.status, 'complete', title);
    assert.equal(result.plan.plan_kind, 'single_pot', title);
    assert.equal(result.plan.pots[0].template_id, 'savory-mixed-rice-pot', title);
    assert.deepEqual(new Set(result.plan.pots[0].planned_must_use.map(item => item.raw)), new Set(must), title);
    assert.deepEqual(result.plan.unplanned_must_use, [], title);
    assert.equal(result.plan.pots[0].coverage_ratio, 1, title);
  }
});

test('ground pork compatibility never leaks to ribs or ambiguous Fujian staples', () => {
  const ribs = planMeal(assets, request({ must: ['大米', '猪肋排', '芥菜'] }));
  assert.notEqual(ribs.status, 'complete');
  assert.equal(ribs.plan.unplanned_must_use.find(item => item.raw === '猪肋排')?.reason_code, 'unsupported_shape_or_cut');
  for (const must of [
    ['大米', '扁豆'],
    ['泡发糯米', '猪肉末', '鲜香菇'],
    ['糯米', '猪肉末', '食品级干荷叶'],
  ]) assert.notEqual(planMeal(assets, request({ must })).status, 'complete');
});

test('Lingnan M1 menu cores become complete generic rice plans without claiming claypot technique', () => {
  for (const [title, must] of [
    ['广式腊味煲仔饭食材', ['大米', '广式腊肠', '菜心']],
    ['广式香菇滑鸡煲仔饭食材', ['大米', '去皮鸡腿肉', '鲜香菇']],
  ]) {
    const result = planMeal(assets, request({ must }));
    assert.equal(result.status, 'complete', title);
    assert.equal(result.plan.plan_kind, 'single_pot', title);
    const pot = result.plan.pots[0];
    assert.equal(pot.template_id, 'savory-mixed-rice-pot', title);
    assert.deepEqual(new Set(pot.planned_must_use.map(item => item.raw)), new Set(must), title);
    assert.deepEqual(result.plan.unplanned_must_use, [], title);
    assert.equal(pot.coverage_ratio, 1, title);
    assert.doesNotMatch(JSON.stringify(result), /煲仔饭|瓦煲|锅巴/);
  }
});

test('Lingnan cured sausage rice omits preset oil and salt', () => {
  const result = planMeal(assets, request({ must: ['大米', '广式腊肠', '菜心'] }));
  assert.equal(result.status, 'complete');
  assert.deepEqual(result.plan.pots[0].required_extra_items.map(item => item.name), ['水']);
});

test('skinless chicken leg keeps poultry safety and is blocked by chicken dislike', () => {
  const safe = planMeal(assets, request({ must: ['大米', '去皮鸡腿肉', '菜心'] }));
  assert.equal(safe.status, 'complete');
  const leg = safe.normalized_items.find(item => item.raw === '去皮鸡腿肉');
  assert.deepEqual(
    [leg.canonical, leg.shape_or_cut, leg.cooking_risk, leg.required_endpoint_codes],
    ['鸡肉', 'leg', 'raw_poultry', ['poultry_fully_cooked']],
  );
  assert.ok(safe.plan.pots[0].safety_endpoints.some(row => row.endpoint_code === 'poultry_fully_cooked_no_pink'));

  const conflict = planMeal(assets, request({
    must: ['大米', '去皮鸡腿肉', '鲜香菇'],
    dislikes: ['鸡肉'],
  }));
  assert.notEqual(conflict.status, 'complete');
  assert.equal(conflict.generation_allowed, false);
  assert.equal(
    conflict.plan.unplanned_must_use.find(item => item.raw === '去皮鸡腿肉')?.reason_code,
    'allergen_conflict',
  );
});

test('Lingnan unresolved structures never become complete generic raw-rice pots', () => {
  for (const must of [
    ['大米', '生菜', '胡萝卜'],
    ['大米', '猪肋排', '豆豉'],
    ['糯米', '食品级紫薯粉', '食品级甜菜粉', '食品级菠菜粉', '食品级南瓜粉'],
  ]) {
    const result = planMeal(assets, request({ must }));
    assert.notEqual(result.status, 'complete', must.join('+'));
    assert.equal(result.generation_allowed, false, must.join('+'));
  }
  const overloaded = planMeal(assets, request({
    must: ['大米', '广式腊肠', '菜心', '卷心菜'],
  }));
  assert.equal(
    overloaded.status === 'complete' && overloaded.plan.plan_kind === 'single_pot',
    false,
  );
});

test('Jiangnan cured rice plans omit preset oil and salt but retain measured water', () => {
  for (const must of [
    ['大米', '咸五花肉', '小白菜'],
    ['大米', '腊五花肉', '矮脚黄'],
    ['大米', '广式腊肠', '矮脚黄'],
  ]) {
    const result = planMeal(assets, request({ must }));
    assert.equal(result.status, 'complete');
    const extras = result.plan.pots[0].required_extra_items.map(item => item.name);
    assert.deepEqual(extras, ['水']);
    const skipped = result.plan.pots[0].ratio_trace
      .filter(row => ['食用油', '盐'].includes(row.name));
    assert.deepEqual(skipped.map(row => [row.name, row.applied]), [
      ['食用油', false],
      ['盐', false],
    ]);
  }
});

test('Jiangnan M1 leaves cooked duck glutinous rice and color source explicitly unresolved', () => {
  const duck = planMeal(assets, request({ must: ['大米', '包装熟制板鸭（去骨）', '矮脚黄'] }));
  assert.notEqual(duck.status, 'complete');
  assert.equal(duck.generation_allowed, false);
  assert.equal(
    duck.plan.unplanned_must_use.find(item => item.raw === '包装熟制板鸭（去骨）')?.reason_code,
    'unrecognized_ingredient',
  );

  const blackRice = planMeal(assets, request({ must: ['糯米', '食品级黑米色粉'] }));
  assert.notEqual(blackRice.status, 'complete');
  assert.equal(blackRice.generation_allowed, false);
  assert.deepEqual(
    blackRice.plan.unplanned_must_use.map(item => item.raw).sort(),
    ['糯米', '食品级黑米色粉'].sort(),
  );
});

test('two high-moisture Jiangnan items never fabricate a complete single-pot rice plan', () => {
  const result = planMeal(assets, request({
    must: ['大米', '咸五花肉', '小白菜', '平菇'],
  }));
  assert.equal(
    result.status === 'complete' && result.plan.plan_kind === 'single_pot',
    false,
  );
});

test('leftover rice, chicken leg, and potato preserve the real cut and receive chicken-specific broth amounts', () => {
  const result = planMeal(assets, request({ must: ['剩米饭', '鸡腿肉', '土豆'], servings: 2 }));

  assert.equal(result.status, 'complete');
  const pot = result.plan.pots.find(candidate => candidate.template_id === 'broth-rice-pot');
  assert.ok(pot);
  assert.equal(pot.coverage_ratio, 1);
  const chicken = pot.slot_assignment.protein[0];
  assert.equal(chicken.raw, '鸡腿肉');
  assert.equal(chicken.canonical, '鸡肉');
  assert.equal(chicken.shape_or_cut, 'leg');
  const amounts = new Map(pot.ingredient_amounts.map(item => [item.name, item.grams]));
  assert.equal(amounts.get('熟米饭'), 360);
  assert.equal(amounts.get('鸡腿肉'), 180);
  assert.equal(amounts.get('土豆'), 160);
  assert.equal(amounts.get('水'), 650);
});

test('broth-rice can add a basic cooked-rice staple without pretending it came from the pantry', () => {
  const pot = buildPotCandidates(assets, request({ must: ['鸡蛋', '白菜'], servings: 2 }))
    .find(candidate => candidate.template_id === 'broth-rice-pot');

  assert.ok(pot);
  assert.equal(pot.coverage_ratio, 1);
  assert.deepEqual(pot.planned_must_use.map(item => item.raw).sort(), ['鸡蛋', '白菜'].sort());
  assert.ok(pot.required_extra_items.some(item => item.name === '熟米饭' && item.grams === 360));
  assert.ok(pot.required_extra_items.some(item => item.name === '水' && item.grams === 650));
});

test('broth-rice keeps raw rice and incompatible proteins outside its slots and is unavailable for quick intent', () => {
  const rawRice = buildPotCandidates(assets, request({ must: ['大米', '鸡蛋', '白菜'] }))
    .filter(candidate => candidate.template_id === 'broth-rice-pot');
  assert.ok(rawRice.length > 0);
  assert.ok(rawRice.every(candidate => Object.values(candidate.slot_assignment).flat()
    .every(item => item.raw !== '大米')));

  const incompatible = buildPotCandidates(assets, request({ must: ['熟米饭', '豆腐', '西兰花'] }))
    .filter(candidate => candidate.template_id === 'broth-rice-pot');
  assert.equal(incompatible.length, 0);

  const quick = buildPotCandidates(assets, request({ intent: 'quick', must: ['熟米饭', '鸡蛋', '白菜'] }));
  assert.equal(quick.some(candidate => candidate.template_id === 'broth-rice-pot'), false);
});

test('broth-rice protein slot never combines egg and chicken in the same pot', () => {
  const pots = buildPotCandidates(assets, request({ must: ['熟米饭', '鸡蛋', '鸡腿肉', '白菜'] }))
    .filter(candidate => candidate.template_id === 'broth-rice-pot');

  assert.ok(pots.length > 0);
  assert.ok(pots.every(pot => (pot.slot_assignment.protein || []).length <= 1));
  assert.ok(pots.every(pot => !((pot.slot_assignment.protein || []).some(item => item.category === 'egg')
    && (pot.slot_assignment.protein || []).some(item => item.category === 'chicken'))));
});

test('面条、豆角、猪里脊进入独立焖面模板并完整覆盖，quick 不会误选它', () => {
  const normal = planMeal(assets, request({ must: ['面条', '豆角', '猪里脊'] }));
  assert.equal(normal.status, 'complete');
  assert.equal(normal.plan.pots.length, 1);
  assert.equal(normal.plan.pots[0].template_id, 'braised-noodle-pot');
  assert.deepEqual(normal.plan.pots[0].planned_must_use.map(item => item.raw).sort(), ['面条', '豆角', '猪里脊'].sort());
  assert.equal(normal.plan.pots[0].coverage_ratio, 1);

  const quick = buildPotCandidates(assets, request({ intent: 'quick', must: ['面条', '豆角', '猪里脊'] }));
  assert.equal(quick.some(candidate => candidate.template_id === 'braised-noodle-pot'), false);
});

test('slow rib cuts cannot enter a quick cooked-rice stir pot', () => {
  const normalized = normalizePlannerItems([
    { raw: '排骨', role: 'must_use' },
    { raw: '熟米饭', role: 'must_use' },
  ], assets.taxonomy);
  const assigned = assignItemsToTemplate(
    activeTemplate('cooked-rice-stir-pot'),
    normalized,
    context(normalized, { intent: 'quick', collect_valid_variants: true }),
  );

  assert.equal(assigned.ok, true);
  assert.ok(assigned.variants.length > 0);
  assert.ok(assigned.variants.every(variant => Object.values(variant.slot_assignment).flat()
    .every(item => item.raw !== '排骨')));

  const journey = planMeal(assets, request({
    intent: 'quick', must: ['排骨', '豆角', '大米'],
  }));
  assert.ok(journey.plan.pots.every(pot => pot.planned_must_use.every(item => item.raw !== '排骨')));
});

test('generic savory rice rejects pork ribs without an explicit compatible cut rule', () => {
  const result = planMeal(assets, request({ must: ['排骨', '土豆'] }));
  assert.notEqual(result.status, 'complete');
  assert.equal(result.plan.planned_must_use.some(item => item.raw === '排骨'), false);
  assert.equal(
    result.plan.unplanned_must_use.find(item => item.raw === '排骨')?.reason_code,
    'unsupported_shape_or_cut',
  );
});

test('forbidden cuts and declared moisture or cook-speed combinations are hard structured rejections', () => {
  const wet = normalizePlannerItems([
    { raw: '番茄', role: 'must_use' },
    { raw: '白菜', role: 'must_use' },
  ], assets.taxonomy);
  const forcedWetTemplate = structuredClone(activeTemplate('acid-staple-pot'));
  const vegetable = forcedWetTemplate.optional_slots.find(slot => slot.slot_id === 'vegetable');
  forcedWetTemplate.optional_slots = forcedWetTemplate.optional_slots.filter(slot => slot.slot_id !== 'vegetable');
  forcedWetTemplate.required_slots = [
    forcedWetTemplate.required_slots[0],
    { ...forcedWetTemplate.required_slots[1], source_policy: ['basic_extra'], accepts_categories: ['raw_rice'] },
    { ...vegetable, min_items: 1, max_items: 1 },
  ];
  const wetRejected = assignItemsToTemplate(forcedWetTemplate, wet, context(wet));
  assert.equal(wetRejected.ok, false);
  assert.equal(wetRejected.rejection_reason.reason_code, 'incompatible_combination');

  const brisket = normalizePlannerItems([{ raw: '牛腩', role: 'must_use' }], assets.taxonomy);
  const cutRejected = assignItemsToTemplate(activeTemplate('beef-staple-pot'), brisket, context(brisket));
  assert.equal(cutRejected.rejection_reason.reason_code, 'unsupported_shape_or_cut');
});

test('an incompatible optional item is left out instead of displacing a compatible must-use staple', () => {
  const pot = buildPotCandidates(assets, request({ must: ['大米', '番茄', '白菜'] }))
    .find(candidate => candidate.template_id === 'acid-staple-pot');
  assert.ok(pot);
  assert.deepEqual(pot.planned_must_use.map(item => item.canonical).sort(), ['大米', '番茄'].sort());
  assert.equal(pot.unplanned_must_use.find(item => item.canonical === '白菜')?.reason_code, 'incompatible_combination');
  assert.equal(pot.required_extra_items.some(item => item.name === '大米'), false);
});

test('unknown-only pantry remains explainable even when there is no valid pot candidate', () => {
  const result = planMeal(assets, request({ must: ['神秘叶子'] }));
  assert.equal(result.status, 'no_valid_plan');
  assert.equal(result.plan.coverage_ratio, 0);
  assert.equal(result.plan.recognition_ratio, 0);
  assert.deepEqual(result.plan.unplanned_must_use.map(item => item.reason_code), ['unrecognized_ingredient']);
});

test('required basic staple and liquid have positive grams but never increase pantry coverage', () => {
  const pot = buildPotCandidates(assets, request({ must: ['番茄'] })).find(candidate => candidate.template_id === 'acid-staple-pot');
  assert.equal(pot.coverage_ratio, 1);
  assert.equal(pot.planned_must_use.length, 1);
  assert.ok(pot.required_extra_items.some(item => ['大米', '熟米饭', '面条'].includes(item.name) && item.grams > 0));
  assert.ok(pot.required_extra_items.some(item => item.name === '水' && item.grams > 0));
});

test('every assigned optional item receives positive grams and is not silently dropped', () => {
  const pot = buildPotCandidates(assets, request({ must: ['番茄', '鸡蛋', '西兰花', '金针菇'] }))
    .find(candidate => candidate.template_id === 'acid-staple-pot');
  const amounts = new Map(pot.ingredient_amounts.map(item => [item.name, item.grams]));
  for (const item of Object.values(pot.slot_assignment).flat().filter(item => item.source === 'user')) {
    assert.ok(amounts.get(item.display_name) > 0, item.raw);
  }
});

test('ranking is deterministic, input-order independent, stable, and non-mutating', () => {
  const forward = buildPotCandidates(assets, request({ must: ['番茄', '鸡蛋', '西兰花'] }));
  const reverse = buildPotCandidates(assets, request({ must: ['西兰花', '鸡蛋', '番茄'] }));
  const snapshot = structuredClone(forward);
  const rankedForward = rankPotCandidates(forward, request({ must: ['番茄', '鸡蛋', '西兰花'] }));
  const rankedReverse = rankPotCandidates(reverse, request({ must: ['西兰花', '鸡蛋', '番茄'] }));
  assert.deepEqual(forward, snapshot);
  assert.deepEqual(rankedForward.map(item => [item.template_id, item.assignment_key]), rankedReverse.map(item => [item.template_id, item.assignment_key]));
  assert.deepEqual(rankPotCandidates(forward, request({ must: ['番茄', '鸡蛋', '西兰花'] })), rankedForward);
});

test('planned templates are never emitted as runtime candidates', () => {
  const candidates = buildPotCandidates(assets, request({ must: ['番茄', '鸡蛋', '西兰花', '金针菇'] }));
  assert.ok(candidates.length > 0);
  assert.ok(candidates.every(candidate => activeTemplate(candidate.template_id)));
  assert.ok(candidates.every(candidate => candidate.template_id !== 'quick-breakfast-pot'));
});

test('Task-5 planner is pure and cannot make a network or DeepSeek call', () => {
  const before = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('network must not be called'); };
  try {
    assert.doesNotThrow(() => planMeal(assets, request({ must: ['番茄', '鸡蛋'] })));
  } finally {
    globalThis.fetch = before;
  }
});

test('planner enforces controlled allergy semantics for exact, category, and generic-meat dislikes', () => {
  for (const dislike of ['鸡蛋', '蛋']) {
    const result = planMeal(assets, request({ must: ['鸡蛋', '西兰花'], dislikes: [dislike], intent: 'quick' }));
    assert.notEqual(result.status, 'complete', dislike);
    assert.equal(result.plan.unplanned_must_use.find(item => item.canonical === '鸡蛋')?.reason_code, 'allergen_conflict', dislike);
  }
  const onlyEgg = planMeal(assets, request({ must: ['鸡蛋'], dislikes: ['蛋'], intent: 'quick' }));
  assert.equal(onlyEgg.status, 'no_valid_plan');
  assert.equal(onlyEgg.plan.unplanned_must_use[0]?.reason_code, 'allergen_conflict');

  const beef = planMeal(assets, request({ must: ['牛里脊', '熟米饭'], dislikes: ['牛肉'], intent: 'quick' }));
  assert.notEqual(beef.status, 'complete');
  assert.equal(beef.plan.unplanned_must_use.find(item => item.canonical === '牛肉')?.reason_code, 'allergen_conflict');
});

test('disliked basic extras are excluded, safe alternatives are tried, and all-conflict produces no pot', () => {
  const safeAlternate = buildPotCandidates(assets, request({ must: ['番茄'], dislikes: ['大米'] }))
    .find(candidate => candidate.template_id === 'acid-staple-pot');
  assert.ok(safeAlternate);
  assert.equal(safeAlternate.required_extra_items.some(item => item.name === '大米'), false);
  assert.ok(safeAlternate.required_extra_items.some(item => ['熟米饭', '面条'].includes(item.name)));

  const noStaple = buildPotCandidates(assets, request({
    must: ['番茄'], dislikes: ['大米', '熟米饭', '面条'],
  }));
  assert.equal(noStaple.length, 0);

  const eggTofu = normalizePlannerItems([
    { raw: '鸡蛋', role: 'must_use' }, { raw: '西兰花', role: 'must_use' },
  ], assets.taxonomy);
  const compiledExtraConflict = assignItemsToTemplate(activeTemplate('egg-tofu-vegetable-pot'), eggTofu, context(eggTofu, { dislikes: ['水'] }));
  assert.equal(compiledExtraConflict.ok, false);
  assert.equal(compiledExtraConflict.rejection_reason.reason_code, 'allergen_conflict');
});

test('pantry must-use wins required-slot contention against a lexically earlier prefer item', () => {
  const result = planMeal(assets, request({
    mode: 'pantry', intent: 'quick', must: ['老豆腐', '青菜'], prefer: ['鸡蛋'],
  }));
  assert.equal(result.status, 'complete');
  assert.deepEqual(result.plan.planned_must_use.map(item => item.canonical).sort(), ['老豆腐', '青菜'].sort());
  assert.equal(result.plan.planned_prefer_use.length, 0);
  assert.equal(result.plan.unused_prefer_use.find(item => item.canonical === '鸡蛋')?.reason_code, 'exceeds_slot_limit');
});

test('forbidden beef shapes retain unsupported_shape_or_cut in unplanned explanations', () => {
  for (const raw of ['牛腩', '牛肉末']) {
    const result = planMeal(assets, request({ must: [raw, '熟米饭'], intent: 'quick' }));
    assert.notEqual(result.status, 'complete', raw);
    assert.equal(result.plan.unplanned_must_use.find(item => item.raw === raw)?.reason_code, 'unsupported_shape_or_cut', raw);
  }
});

test('recognition ratio uses the active product promise denominator, not unrelated-role inputs', () => {
  const pantry = planMeal(assets, request({ must: ['番茄'], prefer: ['未知香草'] }));
  assert.equal(pantry.plan.recognition_ratio, 1);
  assert.equal(pantry.plan.unused_prefer_use.find(item => item.raw === '未知香草')?.reason_code, 'unrecognized_ingredient');

  const recommend = planMeal(assets, request({ mode: 'recommend', prefer: ['番茄', '未知香草'] }));
  assert.equal(recommend.plan.recognition_ratio, 0.5);

  const noCandidate = planMeal(assets, request({ must: ['未知根茎'], prefer: ['黄瓜'] }));
  assert.equal(noCandidate.status, 'no_valid_plan');
  assert.equal(noCandidate.plan.recognition_ratio, 0);
});

test('assignment and plan outputs deeply detach nested taxonomy metadata from caller input', () => {
  const normalized = normalizePlannerItems([
    { raw: '鸡蛋', role: 'must_use' }, { raw: '西兰花', role: 'must_use' },
  ], assets.taxonomy);
  const original = structuredClone(normalized);
  const assigned = assignItemsToTemplate(activeTemplate('egg-tofu-vegetable-pot'), normalized, context(normalized));
  assert.equal(assigned.ok, true);
  assigned.slot_assignment.protein[0].required_endpoint_codes.push('forged_endpoint');
  assigned.slot_assignment.protein[0].compatible_slot_codes.push('forged_slot');
  assert.deepEqual(normalized, original);

  const plannerRequest = request({ must: ['鸡蛋', '西兰花'], intent: 'quick' });
  const requestBefore = structuredClone(plannerRequest);
  const templateSafetyBefore = structuredClone(activeTemplate('egg-tofu-vegetable-pot').safety_endpoints);
  const result = planMeal(assets, plannerRequest);
  result.plan.pots[0].slot_assignment.protein[0].required_endpoint_codes.push('forged_endpoint');
  result.plan.pots[0].safety_endpoints[0].endpoint_code = 'forged_endpoint';
  assert.deepEqual(plannerRequest, requestBefore);
  assert.deepEqual(activeTemplate('egg-tofu-vegetable-pot').safety_endpoints, templateSafetyBefore);
  const second = planMeal(assets, request({ must: ['鸡蛋', '西兰花'], intent: 'quick' }));
  assert.equal(second.plan.pots[0].slot_assignment.protein[0].required_endpoint_codes.includes('forged_endpoint'), false);
});

test('planner allergy checks resolve taxonomy and recipe-library aliases in every planning layer', () => {
  const taxonomyBefore = structuredClone(assets.taxonomy);
  const recipeAliases = { ...assets.recipes.ingredient_aliases, 西红柿: '黄瓜', 补充别名: '番茄' };
  const aliases = buildPlannerAllergenAliases(assets.taxonomy, { ...assets.recipes, ingredient_aliases: recipeAliases });
  assert.equal(Object.getPrototypeOf(aliases), Object.prototype);
  assert.equal(aliases.西红柿, '番茄');
  assert.equal(aliases.补充别名, '番茄');
  assert.deepEqual(assets.taxonomy, taxonomyBefore);
  assert.deepEqual(aliases, buildPlannerAllergenAliases(assets.taxonomy, { ...assets.recipes, ingredient_aliases: recipeAliases }));

  const tomato = planMeal(assets, request({ must: ['番茄'], dislikes: ['西红柿'] }));
  assert.notEqual(tomato.status, 'complete');
  assert.equal(tomato.plan.unplanned_must_use.find(item => item.canonical === '番茄')?.reason_code, 'allergen_conflict');

  const tofu = planMeal(assets, request({ must: ['老豆腐', '青菜'], dislikes: ['北豆腐'], intent: 'quick' }));
  assert.notEqual(tofu.status, 'complete');
  assert.equal(tofu.plan.unplanned_must_use.find(item => item.canonical === '老豆腐')?.reason_code, 'allergen_conflict');

  const riceAlias = buildPotCandidates(assets, request({ must: ['番茄'], dislikes: ['白米'] }))
    .find(candidate => candidate.template_id === 'acid-staple-pot');
  assert.ok(riceAlias);
  assert.equal(riceAlias.required_extra_items.some(item => item.name === '大米'), false);
  assert.ok(riceAlias.required_extra_items.some(item => ['熟米饭', '面条'].includes(item.name)));
});
