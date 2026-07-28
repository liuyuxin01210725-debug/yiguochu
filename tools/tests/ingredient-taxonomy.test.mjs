import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertIngredientTaxonomy,
  normalizeIngredientTaxonomyKey,
  validateIngredientTaxonomy,
} from '../lib/ingredient-taxonomy-validator.mjs';
import { normalizePlannerItems, normalizePlannerTaxonomyKey } from '../../worker/src/planner-v2.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(fs.readFileSync(
  path.join(here, '../data/ingredient-taxonomy.v1.json'),
  'utf8',
));

test('taxonomy is versioned, unique, and covers the first planner vocabulary', () => {
  assert.equal(catalog.taxonomy_version, 'taxonomy-v1-20260728-r10');
  assert.deepEqual(validateIngredientTaxonomy(catalog), []);
  assert.doesNotThrow(() => assertIngredientTaxonomy(catalog));

  const canonicalIds = catalog.items.map(item => item.canonical_id);
  assert.equal(new Set(canonicalIds).size, canonicalIds.length);
  const aliases = catalog.items.flatMap(item => item.aliases);
  assert.equal(new Set(aliases).size, aliases.length);

  const names = new Set(catalog.items.map(item => item.display_name));
  for (const name of [
    '大米', '熟米饭', '面条', '鲜小麦面条', '番茄', '鸡蛋', '嫩豆腐', '老豆腐',
    '牛肉', '牛肉末', '鸡肉', '鸡胸肉', '鸡腿肉', '猪肉', '排骨',
    '白菜', '西兰花', '青菜', '豆角', '黄瓜', '洋葱', '胡萝卜', '土豆',
    '金针菇', '香菇', '咸肉', '腊肠', '玉米面', '和好的玉米面团',
    '锅边玉米饼', '现成玉米饼', '油豆角', '小麦面团',
    '卷心菜', '芥菜', '猪肉末', '菜心', '羊腿肉', '小米', '干鹰嘴豆', '熟鹰嘴豆',
    '虾仁', '玉米',
    '水', '食用油', '盐', '酱油',
  ]) assert.ok(names.has(name), `missing ${name}`);
});

test('shrimp and sweet corn aliases preserve controlled cooking identities', () => {
  const rows = normalizePlannerItems(
    ['虾仁', '鲜虾仁', '冷冻虾仁', '玉米', '玉米粒', '甜玉米'],
    catalog,
  );
  assert.ok(rows.every(row => row.recognized), JSON.stringify(rows));
  assert.deepEqual(
    rows.map(row => [row.canonical_id, row.category, row.state, row.shape_or_cut]),
    [
      ['shrimp', 'seafood', 'raw', 'whole'],
      ['shrimp', 'seafood', 'raw', 'whole'],
      ['shrimp', 'seafood', 'raw', 'whole'],
      ['sweet-corn', 'starchy_vegetable', 'raw', 'whole_seed'],
      ['sweet-corn', 'starchy_vegetable', 'raw', 'whole_seed'],
      ['sweet-corn', 'starchy_vegetable', 'raw', 'whole_seed'],
    ],
  );
  const shrimp = catalog.items.find(item => item.canonical_id === 'shrimp');
  assert.equal(shrimp.cooking_risk.risk_code, 'raw_seafood');
  assert.deepEqual(shrimp.cooking_risk.required_endpoint_codes, ['seafood_fully_cooked']);
  assert.ok(shrimp.compatible_slot_codes.includes('quick_cook_protein'));
  const corn = catalog.items.find(item => item.canonical_id === 'sweet-corn');
  assert.equal(corn.cooking_risk.risk_code, 'none');
  assert.deepEqual(corn.cooking_risk.required_endpoint_codes, []);
  assert.ok(corn.compatible_slot_codes.includes('vegetable'));
});

test('millet and chickpea states remain explicit and non-interchangeable', () => {
  const rows = normalizePlannerItems(
    ['小米', '黄小米', '干鹰嘴豆', '熟鹰嘴豆', '煮熟鹰嘴豆', '罐装鹰嘴豆（沥干）', '鹰嘴豆'],
    catalog,
  );
  assert.deepEqual(
    rows.slice(0, 6).map(row => [
      row.canonical_id, row.category, row.state, row.shape_or_cut, row.recognized,
    ]),
    [
      ['raw-millet', 'raw_millet', 'raw', 'whole_grain', true],
      ['raw-millet', 'raw_millet', 'raw', 'whole_grain', true],
      ['dry-chickpea-seed', 'dry_legume', 'dry', 'whole_seed', true],
      ['cooked-chickpea-seed', 'cooked_legume', 'cooked', 'whole_seed', true],
      ['cooked-chickpea-seed', 'cooked_legume', 'cooked', 'whole_seed', true],
      ['cooked-chickpea-seed', 'cooked_legume', 'cooked', 'whole_seed', true],
    ],
  );

  const generic = rows[6];
  assert.equal(generic.recognized, false);
  assert.equal(generic.ambiguity_id, 'chickpea-state');
  assert.equal(generic.ambiguity_code, 'ambiguous_ingredient_state');
  assert.deepEqual(generic.eligible_items, ['干鹰嘴豆', '熟鹰嘴豆']);

  const millet = catalog.items.find(row => row.canonical_id === 'raw-millet');
  assert.ok(millet);
  assert.equal(millet.texture_behavior.behavior_code, 'absorbs_liquid_and_thickens');
  assert.deepEqual(millet.texture_behavior.best_method_codes, ['soak', 'simmer']);
  assert.deepEqual(millet.cooking_risk.required_endpoint_codes, ['grain_tender_no_hard_center']);
  assert.deepEqual(millet.compatible_slot_codes, ['soft_grain_staple']);
  assert.deepEqual(
    millet.incompatible_slot_codes,
    ['raw_rice_required', 'cooked_rice_required', 'noodle_required'],
  );
});

test('chickpea ambiguity aliases deduplicate without inflating the pantry denominator', () => {
  const [first, duplicate] = normalizePlannerItems(['鹰嘴豆', '鹰嘴豆'], catalog);
  assert.equal(first.duplicate_of, null);
  assert.equal(duplicate.duplicate_of, '鹰嘴豆');
});

test('cowpea pod dry seed cooked seed and generic term never collapse', () => {
  const rows = normalizePlannerItems(
    ['鲜豇豆', '长豇豆', '豆角', '干豇豆', '熟豇豆', '豇豆'],
    catalog,
  );
  assert.deepEqual(
    rows.slice(0, 5).map(row => [row.canonical_id, row.category, row.recognized]),
    [
      ['fresh-cowpea-pod', 'pod_vegetable', true],
      ['fresh-cowpea-pod', 'pod_vegetable', true],
      ['green-beans', 'pod_vegetable', true],
      ['dry-cowpea-seed', 'dry_legume', true],
      ['cooked-cowpea-seed', 'cooked_legume', true],
    ],
  );
  assert.equal(rows[5].recognized, false);
  assert.equal(rows[5].ambiguity_id, 'cowpea-state');
  assert.equal(rows[5].ambiguity_code, 'ambiguous_ingredient_state');
  assert.deepEqual(rows[5].eligible_items, ['鲜豇豆', '干豇豆', '熟豇豆']);
});

test('pitted jujube is explicit while red date and jujube remain ambiguous', () => {
  const [pitted, alias, redDate, jujube] = normalizePlannerItems(
    ['去核红枣', '去核大枣', '红枣', '大枣'], catalog,
  );
  for (const row of [pitted, alias]) {
    assert.deepEqual(
      [row.canonical_id, row.category, row.shape_or_cut, row.cooking_risk],
      ['pitted-dried-jujube', 'dried_fruit', 'pitted', 'pit_hazard'],
    );
    assert.deepEqual(row.required_endpoint_codes, ['pit_absent_verified']);
  }
  for (const row of [redDate, jujube]) {
    assert.equal(row.recognized, false);
    assert.equal(row.ambiguity_id, 'jujube-pit-state');
    assert.equal(row.ambiguity_code, 'ambiguous_ingredient_state');
    assert.deepEqual(row.eligible_items, ['去核红枣']);
  }
});

test('ambiguity aliases deduplicate without inflating the pantry denominator', () => {
  const [first, alias] = normalizePlannerItems(['红枣', '大枣'], catalog);
  assert.equal(first.duplicate_of, null);
  assert.equal(alias.duplicate_of, '红枣');
});

test('fresh wheat noodles and dried noodles keep independent canonical identities', () => {
  const rows = normalizePlannerItems(
    ['鲜小麦面条', '鲜面条', '鲜面', '生鲜面', '面条', '挂面', '干面条', '预蒸面'],
    catalog,
  );
  for (const row of rows.slice(0, 4)) {
    assert.equal(row.canonical_id, 'fresh-wheat-noodle');
    assert.equal(row.canonical, '鲜小麦面条');
    assert.equal(row.category, 'noodle');
    assert.equal(row.ratio_rule_policy, 'canonical_required');
  }
  for (const row of rows.slice(4, 7)) {
    assert.equal(row.canonical_id, 'noodle');
    assert.equal(row.category, 'noodle');
    assert.equal(row.ratio_rule_policy, 'category_fallback');
  }
  assert.deepEqual(rows.map(row => row.raw),
    ['鲜小麦面条', '鲜面条', '鲜面', '生鲜面', '面条', '挂面', '干面条', '预蒸面']);
  assert.equal(rows[7].recognized, false);
  assert.equal(rows[7].canonical_id, null);
  assert.equal(rows[7].ratio_rule_policy, null);
});

test('fresh and dried noodle identities do not deduplicate each other', () => {
  const [fresh, freshAlias, dried] = normalizePlannerItems(
    ['鲜小麦面条', '鲜面条', '挂面'], catalog,
  );
  assert.equal(fresh.duplicate_of, null);
  assert.equal(freshAlias.duplicate_of, '鲜小麦面条');
  assert.equal(dried.duplicate_of, null);
});

test('only fresh wheat noodles require a canonical ratio rule', () => {
  const strict = catalog.items.filter(item => item.ratio_rule_policy === 'canonical_required');
  assert.deepEqual(strict.map(item => item.canonical_id), ['fresh-wheat-noodle']);
});

test('cornmeal identities preserve raw prepared derived and ready states', () => {
  const byId = new Map(catalog.items.map(item => [item.canonical_id, item]));
  assert.deepEqual(
    ['cornmeal-flour', 'cornmeal-dough', 'pot-edge-corn-cake', 'ready-corn-cake']
      .map(id => [id, byId.get(id)?.states, byId.get(id)?.input_scope]),
    [
      ['cornmeal-flour', ['raw'], 'pantry_input'],
      ['cornmeal-dough', ['prepared'], 'pantry_input'],
      ['pot-edge-corn-cake', ['derived_plan_output'], 'derived_only'],
      ['ready-corn-cake', ['cooked'], 'pantry_input'],
    ],
  );
});

test('cornmeal aliases preserve coarseness and never collapse cooked or derived forms', () => {
  const [fine, coarse, unspecified, dough, ready, forgedDerived] = normalizePlannerItems(
    ['细玉米面', '粗玉米面', '玉米面', '玉米面团', '现成玉米饼', '锅边玉米饼'],
    catalog,
  );
  assert.deepEqual([fine.canonical, fine.shape_or_cut], ['玉米面', 'fine']);
  assert.deepEqual([coarse.canonical, coarse.shape_or_cut], ['玉米面', 'coarse']);
  assert.deepEqual([unspecified.canonical, unspecified.shape_or_cut], ['玉米面', 'unspecified']);
  assert.deepEqual([dough.category, dough.shape_or_cut], ['cornmeal_dough', 'dough_piece']);
  assert.deepEqual([ready.category, ready.cooking_risk], ['ready_staple', 'none']);
  assert.equal(forgedDerived.recognized, false);
});

test('oil beans remain distinct from generic green beans', () => {
  const [oilBeans, generic] = normalizePlannerItems(['油豆角', '普通豆角'], catalog);
  assert.equal(oilBeans.display_name, '油豆角');
  assert.equal(oilBeans.canonical, '油豆角');
  assert.equal(generic.display_name, '豆角');
  assert.equal(generic.canonical, '豆角');
  assert.notEqual(oilBeans.canonical, generic.canonical);
  assert.deepEqual(oilBeans.required_endpoint_codes, ['bean_fully_cooked']);
  assert.deepEqual(generic.required_endpoint_codes, ['bean_fully_cooked']);
});

test('derived-only identities cannot advertise pantry aliases or the wrong state', () => {
  const aliasLeak = structuredClone(catalog);
  const aliasLeakItem = aliasLeak.items.find(item => item.canonical_id === 'pot-edge-corn-cake');
  assert.ok(aliasLeakItem);
  aliasLeakItem.aliases = ['贴饼子'];
  assert.match(validateIngredientTaxonomy(aliasLeak).join('\n'), /derived_only identities must not define aliases/);

  const wrongState = structuredClone(catalog);
  const wrongStateItem = wrongState.items.find(item => item.canonical_id === 'pot-edge-corn-cake');
  assert.ok(wrongStateItem);
  wrongStateItem.states = ['cooked'];
  assert.match(validateIngredientTaxonomy(wrongState).join('\n'), /derived_only identity must use derived_plan_output/);

  const indirectAlias = structuredClone(catalog);
  const pantryItem = indirectAlias.items.find(item => item.canonical_id === 'ready-corn-cake');
  pantryItem.canonical_name = '锅边玉米饼';
  assert.match(
    validateIngredientTaxonomy(indirectAlias).join('\n'),
    /canonical_name must not target a derived_only identity/,
  );
});

test('regional ingredients preserve cured-meat and dough cooking identities', () => {
  const [salted, sausage, cornDough, wheatDough, bacon] = normalizePlannerItems(
    ['咸肉', '腊肠', '玉米面团', '小麦面团', '腊肉'],
    catalog,
  );
  assert.deepEqual(
    [salted.canonical, salted.category, salted.shape_or_cut, salted.cooking_risk],
    ['咸肉', 'pork', 'cured_slice', 'raw_pork'],
  );
  assert.deepEqual(
    [sausage.canonical, sausage.category, sausage.shape_or_cut, sausage.cooking_risk],
    ['腊肠', 'pork', 'sausage', 'raw_pork'],
  );
  assert.deepEqual(
    [cornDough.category, cornDough.shape_or_cut, cornDough.cooking_risk],
    ['cornmeal_dough', 'dough_piece', 'raw_dough'],
  );
  assert.deepEqual(
    [wheatDough.category, wheatDough.shape_or_cut, wheatDough.cooking_risk],
    ['wheat_dough', 'dough_piece', 'raw_dough'],
  );
  assert.equal(bacon.recognized, false, '咸肉不能无依据扩成腊肉同义词');
});

test('Jiangnan M1 identities preserve regional names and controlled compatibility', () => {
  const rows = normalizePlannerItems(
    ['小白菜', '矮脚黄', '咸五花肉', '腊五花肉', '平菇'],
    catalog,
  );
  assert.deepEqual(rows.map(row => [
    row.raw,
    row.canonical,
    row.display_name,
    row.category,
    row.shape_or_cut,
    row.cooking_risk,
  ]), [
    ['小白菜', '青菜', '小白菜', 'leafy_vegetable', 'whole', 'none'],
    ['矮脚黄', '青菜', '矮脚黄', 'leafy_vegetable', 'whole', 'none'],
    ['咸五花肉', '咸肉', '咸五花肉', 'pork', 'cured_slice', 'raw_pork'],
    ['腊五花肉', '咸肉', '腊五花肉', 'pork', 'cured_slice', 'raw_pork'],
    ['平菇', '平菇', '平菇', 'mushroom', 'whole', 'none'],
  ]);
  assert.ok(rows[2].compatible_slot_codes.includes('cured_pork'));
  assert.ok(rows[3].compatible_slot_codes.includes('cured_pork'));
  assert.deepEqual(rows[2].texture_failure_modes, ['salty_when_overseasoned']);
  assert.deepEqual(rows[3].texture_failure_modes, ['salty_when_overseasoned']);
});

test('Jiangnan M1 keeps cooked duck glutinous rice and color source unresolved', () => {
  const rows = normalizePlannerItems(
    ['包装熟制板鸭（去骨）', '糯米', '食品级黑米色粉'],
    catalog,
  );
  assert.ok(rows.every(row => row.recognized === false));
});

test('Fujian Taiwan M1 identities preserve names cuts and controlled aliases', () => {
  const rows = normalizePlannerItems(
    ['卷心菜', '高丽菜', '白菜', '芥菜', '盖菜', '猪肉末', '猪绞肉', '猪肉片'],
    catalog,
  );
  assert.deepEqual(rows.map(row => [row.raw, row.canonical, row.category, row.shape_or_cut]), [
    ['卷心菜', '卷心菜', 'leafy_vegetable', 'whole'],
    ['高丽菜', '卷心菜', 'leafy_vegetable', 'whole'],
    ['白菜', '白菜', 'leafy_vegetable', null],
    ['芥菜', '芥菜', 'leafy_vegetable', 'whole'],
    ['盖菜', '芥菜', 'leafy_vegetable', 'whole'],
    ['猪肉末', '猪肉', 'pork', 'ground'],
    ['猪绞肉', '猪肉', 'pork', 'ground'],
    ['猪肉片', '猪肉', 'pork', 'slice'],
  ]);
  assert.equal(rows[1].display_name, '卷心菜');
  assert.equal(rows[6].display_name, '猪肉末');
  assert.deepEqual(rows[5].required_endpoint_codes, ['pork_fully_cooked']);
});

test('Fujian Taiwan M1 retains ambiguous beans glutinous rice leaf and color gaps', () => {
  const rows = normalizePlannerItems(
    ['扁豆', '糯米', '泡发糯米', '食品级干荷叶', '食品级黑米色粉'],
    catalog,
  );
  assert.ok(rows.every(row => row.recognized === false));
});

test('Lingnan M1 preserves choy sum and skinless chicken leg identity boundaries', () => {
  const rows = normalizePlannerItems(
    ['菜心', '青菜', '小白菜', '卷心菜', '芥菜', '去皮鸡腿肉', '鸡腿肉', '鸡胸肉'],
    catalog,
  );
  assert.deepEqual(rows.map(row => [
    row.raw, row.canonical, row.display_name, row.category, row.shape_or_cut,
  ]), [
    ['菜心', '菜心', '菜心', 'leafy_vegetable', 'whole'],
    ['青菜', '青菜', '青菜', 'leafy_vegetable', 'whole'],
    ['小白菜', '青菜', '小白菜', 'leafy_vegetable', 'whole'],
    ['卷心菜', '卷心菜', '卷心菜', 'leafy_vegetable', 'whole'],
    ['芥菜', '芥菜', '芥菜', 'leafy_vegetable', 'whole'],
    ['去皮鸡腿肉', '鸡肉', '鸡腿肉', 'chicken', 'leg'],
    ['鸡腿肉', '鸡肉', '鸡腿肉', 'chicken', 'leg'],
    ['鸡胸肉', '鸡肉', '鸡胸肉', 'chicken', 'breast'],
  ]);
  assert.equal(rows[0].moisture_release, 'high');
  assert.equal(rows[5].cooking_risk, 'raw_poultry');
  assert.deepEqual(rows[5].required_endpoint_codes, ['poultry_fully_cooked']);
  assert.notEqual(rows[0].canonical, rows[1].canonical);
  assert.notEqual(rows[5].shape_or_cut, rows[7].shape_or_cut);
});

test('Lingnan M1 retains lettuce fermented black beans glutinous rice and color gaps', () => {
  const rows = normalizePlannerItems(
    ['生菜', '豆豉', '糯米', '食品级紫薯粉', '食品级甜菜粉', '食品级菠菜粉', '食品级南瓜粉'],
    catalog,
  );
  assert.ok(rows.every(row => row.recognized === false));
});

test('taxonomy carries culinary behavior, not category alone', () => {
  const beef = catalog.items.find(item => item.canonical_id === 'beef-generic');
  assert.equal(beef.category, 'beef');
  assert.ok(beef.shapes_or_cuts.includes('tenderloin'));
  assert.equal(beef.cook_speed, 'fast');
  assert.equal(beef.moisture_release, 'low');
  assert.equal(beef.texture_behavior.behavior_code, 'tender_when_quick_cooked');
  assert.equal(beef.cooking_risk.risk_code, 'raw_beef');
  assert.deepEqual(beef.incompatible_slot_codes, ['brisket_required', 'ground_meat_required']);
});

test('validator rejects duplicate IDs and aliases plus incomplete cooking attributes', () => {
  const invalid = structuredClone(catalog);
  invalid.items[1].canonical_id = invalid.items[0].canonical_id;
  invalid.items[2].aliases = [invalid.items[0].aliases[0]];
  delete invalid.items[3].cooking_risk;
  const errors = validateIngredientTaxonomy(invalid);
  assert.ok(errors.some(error => error.includes('duplicate canonical_id')));
  assert.ok(errors.some(error => error.includes('duplicate normalized alias')));
  assert.ok(errors.some(error => error.includes('cooking_risk')));
});

test('ambiguity schema is finite referenced and collision free', () => {
  assert.deepEqual(validateIngredientTaxonomy(catalog), []);

  const unknownTarget = structuredClone(catalog);
  unknownTarget.ambiguous_inputs[0].eligible_items = ['不存在的食材'];
  assert.match(
    validateIngredientTaxonomy(unknownTarget).join('\n'),
    /eligible_items.*existing display_name/,
  );

  const aliasCollision = structuredClone(catalog);
  aliasCollision.items.find(item => item.canonical_id === 'green-beans').aliases.push('豇豆');
  assert.match(validateIngredientTaxonomy(aliasCollision).join('\n'), /ambiguity.*conflict/);

  const unknownRoot = structuredClone(catalog);
  unknownRoot.extra_prompt = 'guess';
  assert.match(validateIngredientTaxonomy(unknownRoot).join('\n'), /unknown taxonomy field: extra_prompt/);
});

test('ambiguity validator rejects malformed finite fields without throwing', () => {
  const probes = [
    catalog => { catalog.ambiguous_inputs[1].input = '豇 豆'; },
    catalog => { catalog.ambiguous_inputs[1].ambiguity_id = catalog.ambiguous_inputs[0].ambiguity_id; },
    catalog => { catalog.ambiguous_inputs[0].reason_code = 'guess_state'; },
    catalog => { catalog.ambiguous_inputs[0].reason = ''; },
    catalog => { catalog.ambiguous_inputs[0].eligible_items = []; },
    catalog => { catalog.ambiguous_inputs[0].eligible_items = ['长豇豆']; },
  ];
  for (const mutate of probes) {
    const invalid = structuredClone(catalog);
    mutate(invalid);
    assert.doesNotThrow(() => validateIngredientTaxonomy(invalid));
    const errors = validateIngredientTaxonomy(invalid);
    assert.ok(errors.length > 0);
    assert.ok(errors.every(error => typeof error === 'string'));
  }
});

test('validator rejects codes outside its finite first-stage vocabularies', () => {
  const invalid = structuredClone(catalog);
  invalid.items[0].texture_behavior.best_method_codes = ['invent_method'];
  invalid.items[0].texture_behavior.failure_mode_codes = ['invent_failure'];
  invalid.items[0].cooking_risk.required_endpoint_codes = ['invent_endpoint'];
  invalid.items[0].compatible_slot_codes = ['invent_slot'];
  invalid.items[0].incompatible_slot_codes = ['invent_incompatible_slot'];
  const errors = validateIngredientTaxonomy(invalid);
  for (const field of [
    'texture_behavior.best_method_codes',
    'texture_behavior.failure_mode_codes',
    'cooking_risk.required_endpoint_codes',
    'compatible_slot_codes',
    'incompatible_slot_codes',
  ]) assert.ok(errors.some(error => error.includes(field)), field);
});

test('validator rejects incomplete machine schemas and unsafe risk rows without endpoints', () => {
  const invalid = structuredClone(catalog);
  invalid.items[0].states = [];
  invalid.items[1].shapes_or_cuts = [];
  invalid.items[2].texture_behavior.best_method_codes = [];
  invalid.items[3].compatible_slot_codes = [];
  invalid.items.find(item => item.canonical_id === 'chicken-breast').cooking_risk.required_endpoint_codes = [];
  const errors = validateIngredientTaxonomy(invalid);
  for (const field of [
    'states are invalid',
    'shapes_or_cuts are invalid',
    'texture_behavior.best_method_codes are invalid',
    'compatible_slot_codes are invalid',
    'cooking_risk.required_endpoint_codes must not be empty for raw_poultry',
  ]) assert.ok(errors.some(error => error.includes(field)), field);
});

test('validator returns string errors for malformed alias-shape containers without throwing', () => {
  for (const field of ['aliases', 'shapes_or_cuts']) {
    const invalid = structuredClone(catalog);
    const item = invalid.items.find(entry => entry.canonical_id === 'beef-generic');
    item[field] = { bad:1 };
    item.default_shape_or_cut = 'slice';
    item.alias_shape_or_cut = { 牛肉片:'slice' };
    assert.doesNotThrow(() => validateIngredientTaxonomy(invalid), field);
    const errors = validateIngredientTaxonomy(invalid);
    assert.ok(errors.length > 0);
    assert.ok(errors.every(error => typeof error === 'string'));
    assert.ok(errors.some(error => error.includes(field)), field);
  }
});

test('validator rejects canonical names that do not resolve to a compatible base identity', () => {
  const nonexistent = structuredClone(catalog);
  nonexistent.items.find(item => item.canonical_id === 'beef-tenderloin').canonical_name = '不存在的肉';
  assert.ok(validateIngredientTaxonomy(nonexistent).some(error => error.includes('canonical_name must name an existing display_name')));

  const incompatible = structuredClone(catalog);
  incompatible.items.find(item => item.canonical_id === 'beef-tenderloin').canonical_name = '鸡肉';
  assert.ok(validateIngredientTaxonomy(incompatible).some(error => error.includes('canonical_name category must match')));

  const selfOrChain = structuredClone(catalog);
  selfOrChain.items.find(item => item.canonical_id === 'beef-tenderloin').canonical_name = '鸡胸肉';
  assert.ok(validateIngredientTaxonomy(selfOrChain).some(error => error.includes('canonical_name must not point to another canonical alias')));

  const self = structuredClone(catalog);
  self.items.find(item => item.canonical_id === 'beef-tenderloin').canonical_name = '牛里脊';
  assert.ok(validateIngredientTaxonomy(self).some(error => error.includes('canonical_name must not point to itself')));
});

test('validator and planner share a normalized identity key and reject normalized collisions', () => {
  assert.equal(normalizeIngredientTaxonomyKey(' 牛 里 脊 '), '牛里脊');
  assert.equal(normalizePlannerTaxonomyKey(' 牛 里 脊 '), '牛里脊');

  const aliasDisplayCollision = structuredClone(catalog);
  aliasDisplayCollision.items.find(item => item.canonical_id === 'beef-generic').aliases.push(' 牛 里 脊 ');
  assert.ok(validateIngredientTaxonomy(aliasDisplayCollision).some(error => error.includes('normalized alias conflicts with display_name')));

  const aliasAliasCollision = structuredClone(catalog);
  aliasAliasCollision.items.find(item => item.canonical_id === 'chicken-generic').aliases.push(' 金 菇 ');
  assert.ok(validateIngredientTaxonomy(aliasAliasCollision).some(error => error.includes('duplicate normalized alias')));
});

test('planner normalization preserves cuts while mapping generic beef only where safe', () => {
  const tenderloin = normalizePlannerItems(['牛里脊肉'], catalog)[0];
  assert.deepEqual(
    pickIdentity(tenderloin),
    { canonical:'牛肉', category:'beef', shape_or_cut:'tenderloin', recognized:true },
  );
  assert.equal(tenderloin.raw, '牛里脊肉');
  assert.equal(tenderloin.role, 'must_use');

  const sirloin = normalizePlannerItems(['牛柳'], catalog)[0];
  const beefSlice = normalizePlannerItems(['牛肉片'], catalog)[0];
  assert.equal(sirloin.canonical, '牛肉');
  assert.equal(sirloin.shape_or_cut, 'tenderloin');
  assert.equal(beefSlice.canonical, '牛肉');
  assert.equal(beefSlice.shape_or_cut, 'slice');

  const [brisket, ground] = normalizePlannerItems(['牛腩', '牛肉末'], catalog);
  assert.deepEqual(pickIdentity(brisket), { canonical:'牛腩', category:'beef', shape_or_cut:'brisket', recognized:true });
  assert.deepEqual(pickIdentity(ground), { canonical:'牛肉末', category:'beef', shape_or_cut:'ground', recognized:true });
});

test('planner normalization distinguishes poultry cuts and tofu texture classes', () => {
  const [breast, leg, soft, softAlias, firm, firmAlias] = normalizePlannerItems(
    ['鸡胸肉', '鸡腿肉', '嫩豆腐', '南豆腐', '老豆腐', '豆腐'],
    catalog,
  );
  assert.deepEqual(pickIdentity(breast), { canonical:'鸡肉', category:'chicken', shape_or_cut:'breast', recognized:true });
  assert.deepEqual(pickIdentity(leg), { canonical:'鸡肉', category:'chicken', shape_or_cut:'leg', recognized:true });
  assert.deepEqual(pickIdentity(soft), { canonical:'嫩豆腐', category:'soft_tofu', shape_or_cut:'whole', recognized:true });
  assert.deepEqual(pickIdentity(softAlias), { canonical:'嫩豆腐', category:'soft_tofu', shape_or_cut:'whole', recognized:true });
  assert.deepEqual(pickIdentity(firm), { canonical:'老豆腐', category:'firm_tofu', shape_or_cut:'whole', recognized:true });
  assert.deepEqual(pickIdentity(firmAlias), { canonical:'老豆腐', category:'firm_tofu', shape_or_cut:'whole', recognized:true });

  const [breastAlias, legAlias] = normalizePlannerItems(['鸡胸', '鸡腿'], catalog);
  assert.deepEqual(pickIdentity(breastAlias), { canonical:'鸡肉', category:'chicken', shape_or_cut:'breast', recognized:true });
  assert.deepEqual(pickIdentity(legAlias), { canonical:'鸡肉', category:'chicken', shape_or_cut:'leg', recognized:true });
});

test('planner normalization preserves pork cuts while mapping only generic pork semantics', () => {
  const [tenderloin, tenderloinMeat, porkSlice] = normalizePlannerItems(
    ['猪里脊', '猪里脊肉', '猪肉片'],
    catalog,
  );
  for (const item of [tenderloin, tenderloinMeat]) {
    assert.deepEqual(pickIdentity(item), { canonical:'猪肉', category:'pork', shape_or_cut:'tenderloin', recognized:true });
  }
  assert.deepEqual(pickIdentity(porkSlice), { canonical:'猪肉', category:'pork', shape_or_cut:'slice', recognized:true });
});

test('lamb leg identity is narrow and keeps generic and other cuts unresolved', () => {
  const rows = normalizePlannerItems(
    ['羊腿肉', '去骨羊腿肉', '羊肉', '羊肩肉', '羊排', '羊腩', '羊肉末'],
    catalog,
  );
  for (const row of rows.slice(0, 2)) {
    assert.deepEqual(
      [row.canonical_id, row.canonical, row.category, row.shape_or_cut, row.cooking_risk],
      ['lamb-leg', '羊肉', 'lamb', 'leg', 'raw_lamb'],
    );
    assert.deepEqual(row.required_endpoint_codes, ['lamb_fully_cooked']);
  }
  assert.deepEqual(rows.slice(2).map(row => row.recognized), [false, false, false, false, false]);
});

test('planner normalization retains unknown and duplicate inputs for explanation', () => {
  const [first, duplicate, unknown] = normalizePlannerItems(
    ['牛里脊', '牛柳', { raw:'火星菜', role:'prefer_use' }],
    catalog,
  );
  assert.equal(first.duplicate_of, null);
  assert.equal(duplicate.canonical, '牛肉');
  assert.equal(duplicate.duplicate_of, '牛里脊');
  assert.deepEqual(unknown, {
    raw: '火星菜', canonical_id: null, canonical: null, ratio_rule_policy: null,
    category: null, state: null, shape_or_cut: null,
    cook_speed: null, moisture_release: null, texture_behavior: null,
    cooking_risk: 'unknown', recognized: false,
    ambiguity_id: null, ambiguity_code: null, ambiguity_reason: null, eligible_items: [],
    role: 'prefer_use', duplicate_of: null,
  });
});

test('planner normalization rejects blank input and makes must_use the duplicate representative', () => {
  assert.throws(
    () => normalizePlannerItems(['  '], catalog),
    error => error?.code === 'invalid_planner_request' && error.message === 'planner item raw must not be blank',
  );
  const [preferFirst, mustSecond] = normalizePlannerItems([
    { raw:'牛柳', role:'prefer_use' },
    { raw:'牛里脊', role:'must_use' },
  ], catalog);
  assert.equal(preferFirst.raw, '牛柳');
  assert.equal(preferFirst.duplicate_of, '牛里脊');
  assert.equal(mustSecond.raw, '牛里脊');
  assert.equal(mustSecond.duplicate_of, null);
});

function pickIdentity(item) {
  return {
    canonical: item.canonical,
    category: item.category,
    shape_or_cut: item.shape_or_cut,
    recognized: item.recognized,
  };
}
