import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildPlannerMenuCoverage,
  buildRecipeCoverageEntry,
  formatPlannerMenuCoverageSummary,
  validatePlannerMenuCoverage,
} from '../lib/planner-menu-coverage-builder.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const recipeLibrary = readJson('../data/recipe-library.json');
const taxonomy = readJson('../data/ingredient-taxonomy.v1.json');
const templates = readJson('../data/meal-templates.v2.json');
const ratios = readJson('../data/ratio-rules.v1.json');
const mappings = readJson('../data/regional-menu-mappings.v1.json');
const baseline = readJson('../data/menu-master-baseline.v1.json');

function buildRealReport() {
  return buildPlannerMenuCoverage({
    recipeLibrary,
    taxonomy,
    templates,
    ratios,
    mappings,
    baseline,
    sourceHashes: {
      'tools/data/ingredient-taxonomy.v1.json': 'a'.repeat(64),
      'tools/data/meal-templates.v2.json': 'b'.repeat(64),
      'tools/data/menu-master-baseline.v1.json': 'c'.repeat(64),
      'tools/data/ratio-rules.v1.json': 'd'.repeat(64),
      'tools/data/recipe-library.json': 'e'.repeat(64),
      'tools/data/regional-menu-mappings.v1.json': 'f'.repeat(64),
    },
  });
}

const byId = (report, id) => report.recipes.find(row => row.recipe_id === id);

function contextFor(recipeId = 'sample') {
  return {
    plannerAssets: {
      recipes: recipeLibrary,
      taxonomy,
      templates,
      ratios,
    },
    mappingByRecipeId: new Map([[
      recipeId,
      {
        source_type: 'production_recipe',
        source_id: recipeId,
        regional_scope: 'national_household',
        region_ids: [],
        primary_family_id: 'cooked-rice-stew',
      },
    ]]),
  };
}

function sampleWith(coreIngredients, overrides = {}) {
  return {
    id: 'sample',
    name: '样例',
    status: 'auto_approved',
    core_ingredients: coreIngredients,
    ...overrides,
  };
}

test('keeps source order while partitioning planner, basic, and unknown identities', () => {
  const entry = buildRecipeCoverageEntry(
    sampleWith(['牛里脊', '水', '陌生菜', '牛肉片']),
    contextFor(),
  );

  assert.deepEqual(entry.raw_core_items, ['牛里脊', '水', '陌生菜', '牛肉片']);
  assert.deepEqual(entry.recognized_basic_items.map(row => row.raw), ['水']);
  assert.deepEqual(entry.unclassified_core_items.map(row => row.raw), ['陌生菜']);
  const representatives = entry.planner_eligible_items.filter(row => row.duplicate_of === null);
  assert.deepEqual(representatives.map(row => [row.raw, row.canonical_id, row.shape_or_cut]), [
    ['牛里脊', 'beef-tenderloin', 'tenderloin'],
    ['牛肉片', 'beef-generic', 'slice'],
  ]);
  assert.equal(entry.identity_recognition_ratio, 1 / 2);
});

test('raw scenario keeps unknown items while recognized scenario isolates template capacity', () => {
  const entry = buildRecipeCoverageEntry(
    sampleWith(['熟米饭', '白菜', '鸡蛋', '陌生菜']),
    contextFor(),
  );

  assert.deepEqual(entry.raw_core_scenario.submitted_raw_items, ['熟米饭', '白菜', '鸡蛋', '陌生菜']);
  assert.deepEqual(entry.recognized_only_scenario.submitted_raw_items, ['熟米饭', '白菜', '鸡蛋']);
  assert.equal(entry.raw_core_scenario.status, 'needs_user_decision');
  assert.equal(entry.recognized_only_scenario.status, 'complete');
});

test('audits exactly the locked 72 recipes and preserves current safety boundaries', () => {
  const report = buildRealReport();

  assert.equal(report.recipes.length, 72);
  assert.equal(new Set(report.recipes.map(row => row.recipe_id)).size, 72);

  const soupRice = byId(report, 'cabbage-egg-soup-rice');
  assert.deepEqual(soupRice.raw_core_items, ['熟米饭', '白菜', '鸡蛋']);
  assert.equal(soupRice.recognized_only_scenario.selected_template_ids.includes('broth-rice-pot'), true);
  assert.equal(soupRice.evidence_alignment.direct_template_evidence, true);

  const tomatoChicken = byId(report, 'tomato-chicken-leg-soup-rice');
  assert.deepEqual(tomatoChicken.raw_core_items, ['熟米饭', '鸡腿肉', '番茄']);
  assert.equal(tomatoChicken.raw_core_items.includes('土豆'), false);

  const ribs = byId(report, 'green-bean-pork-rib-braised-rice');
  assert.equal(ribs.planner_eligible_items.find(row => row.raw === '猪肋排').shape_or_cut, 'rib');
  if (ribs.recognized_only_scenario.selected_template_ids.includes('savory-mixed-rice-pot')) {
    assert.equal(ribs.recognized_only_scenario.planned_raw_items.includes('猪肋排'), false);
    assert.equal(ribs.recognized_only_scenario.unplanned_raw_items.includes('猪肋排'), true);
  }

  const noodles = byId(report, 'north-china-green-bean-braised-noodles');
  assert.equal(noodles.audit_status, 'full_single_pot_evidence_aligned');
  assert.deepEqual(noodles.unclassified_core_items, []);
  assert.equal(noodles.raw_core_scenario.end_to_end_core_coverage_ratio, 1);
  assert.equal(noodles.raw_core_scenario.plan_kind, 'single_pot');
  assert.ok(noodles.raw_core_scenario.selected_template_ids.includes('braised-noodle-pot'));
});

test('Jiangnan M1 recovers six menu cores without forging two unresolved identities', () => {
  const report = buildRealReport();
  const expected = new Map([
    ['shanghai-salted-pork-vegetable-rice', 'full_single_pot_evidence_aligned'],
    ['nanjing-sausage-greens-rice', 'full_single_pot_evidence_aligned'],
    ['suzhou-salted-pork-vegetable-rice', 'full_single_pot_ingredient_compatible'],
    ['nanjing-cured-pork-greens-rice', 'full_single_pot_ingredient_compatible'],
    ['jinshan-clay-oven-vegetable-rice', 'full_single_pot_ingredient_compatible'],
    ['banshan-wild-rice', 'full_single_pot_ingredient_compatible'],
  ]);
  for (const [id, status] of expected) {
    const row = byId(report, id);
    assert.equal(row.audit_status, status, id);
    assert.deepEqual(row.unclassified_core_items, [], id);
    assert.equal(row.raw_core_scenario.end_to_end_core_coverage_ratio, 1, id);
    assert.equal(row.raw_core_scenario.plan_kind, 'single_pot', id);
  }

  const duck = byId(report, 'nanjing-duck-greens-rice');
  assert.equal(duck.audit_status, 'taxonomy_gap');
  assert.ok(duck.unclassified_core_items.some(item => item.raw === '包装熟制板鸭（去骨）'));

  const blackRice = byId(report, 'she-people-black-rice');
  assert.notEqual(blackRice.audit_status, 'full_single_pot_evidence_aligned');
  assert.notEqual(blackRice.audit_status, 'full_single_pot_ingredient_compatible');
  assert.deepEqual(
    blackRice.unclassified_core_items.map(item => item.raw).sort(),
    ['糯米', '食品级黑米色粉'].sort(),
  );
});

test('Fujian Taiwan M1 recovers two generic plans and retains four honest gaps', () => {
  const report = buildRealReport();
  const byRecipeId = new Map(report.recipes.map(row => [row.recipe_id, row]));
  assert.equal(byRecipeId.get('taiwan-cabbage-mushroom-rice').audit_status, 'full_single_pot_evidence_aligned');
  assert.equal(byRecipeId.get('fujian-gai-cai-minced-pork-rice').audit_status, 'full_single_pot_ingredient_compatible');
  assert.equal(byRecipeId.get('fujian-hyacinth-bean-rice').audit_status, 'taxonomy_gap');
  const quanzhou = byRecipeId.get('quanzhou-oil-rice');
  assert.notEqual(quanzhou.raw_core_scenario.status, 'complete');
  assert.equal(quanzhou.raw_core_scenario.planned_raw_items.includes('泡发糯米'), false);
  assert.equal(quanzhou.raw_core_scenario.unplanned_raw_items.includes('泡发糯米'), true);
  assert.equal(quanzhou.raw_core_scenario.ratio_plans.some(plan => plan.ingredient_amounts
    .some(item => item.name === '泡发糯米' && item.grams === 200)), false);
  for (const id of ['quanzhou-oil-rice', 'daxi-lotus-leaf-oil-rice', 'she-people-black-rice']) {
    assert.ok(['taxonomy_gap', 'planner_gap', 'no_recognized_core'].includes(byRecipeId.get(id).audit_status), id);
  }
  const region = report.by_region.find(row => row.region_id === 'fujian_taiwan');
  assert.deepEqual(
    [region.recipe_count, region.single_pot_full_count],
    [6, 2],
  );
});

test('Lingnan M1 recovers two generic plans and retains three structural gaps', () => {
  const report = buildRealReport();
  const byRecipeId = new Map(report.recipes.map(row => [row.recipe_id, row]));
  for (const id of [
    'cantonese-cured-meat-claypot-rice',
    'cantonese-mushroom-chicken-claypot-rice',
  ]) {
    assert.equal(byRecipeId.get(id).audit_status, 'full_single_pot_ingredient_compatible', id);
  }
  for (const id of [
    'hainan-cai-bao-rice',
    'cantonese-black-bean-pork-rib-claypot-rice',
    'guangxi-five-color-glutinous-rice',
  ]) {
    assert.ok(
      ['taxonomy_gap', 'planner_gap', 'no_recognized_core'].includes(byRecipeId.get(id).audit_status),
      id,
    );
  }
  const region = report.by_region.find(row => row.region_id === 'lingnan_hk_macao');
  assert.deepEqual([region.recipe_count, region.single_pot_full_count], [5, 2]);
});

test('Northwest lamb-leg capability restores Xinjiang pilaf without widening other recipes', () => {
  const report = buildRealReport();
  const lamb = byId(report, 'xinjiang-lamb-pilaf');
  assert.equal(lamb.audit_status, 'full_single_pot_evidence_aligned');
  assert.deepEqual(lamb.unclassified_core_items, []);
  assert.equal(lamb.raw_core_scenario.end_to_end_core_coverage_ratio, 1);
  assert.equal(lamb.raw_core_scenario.plan_kind, 'single_pot');
  assert.ok(lamb.raw_core_scenario.selected_template_ids.includes('savory-mixed-rice-pot'));
  const northwest = report.by_region.find(row => row.region_id === 'northwest');
  assert.deepEqual([northwest.recipe_count, northwest.single_pot_full_count], [3, 2]);
});

test('Shaanbei cowpea ambiguity is no longer counted as a fresh green-bean hit', () => {
  const report = buildRealReport();
  const shaanbei = byId(report, 'shaanbei-red-date-cowpea-rice');
  assert.equal(shaanbei.raw_core_scenario.status, 'needs_user_decision');
  assert.ok(shaanbei.raw_core_scenario.end_to_end_core_coverage_ratio <= 1 / 3);
  assert.ok(shaanbei.unclassified_core_items.some(row =>
    row.raw === '豇豆' && row.ambiguity_code === 'ambiguous_ingredient_state'));
  assert.equal(shaanbei.audit_status === 'full_single_pot_evidence_aligned', false);

  const northwest = report.by_region.find(row => row.region_id === 'northwest');
  assert.equal(northwest.recipe_count, 3);
  assert.equal(northwest.single_pot_full_count, 2);
});

test('Qinghai millet capability covers one household adaptation without widening Tibetan dishes', () => {
  const report = buildRealReport();
  const qinghai = byId(report, 'qinghai-hao-fan');
  assert.equal(qinghai.audit_status, 'full_single_pot_evidence_aligned');
  assert.deepEqual(qinghai.unclassified_core_items, []);
  assert.equal(qinghai.raw_core_scenario.status, 'complete');
  assert.equal(qinghai.raw_core_scenario.end_to_end_core_coverage_ratio, 1);
  assert.deepEqual(qinghai.raw_core_scenario.selected_template_ids, ['soft-family-rice-pot']);
  assert.deepEqual(
    new Set(qinghai.raw_core_scenario.planned_raw_items),
    new Set(['小米', '土豆', '熟鹰嘴豆']),
  );
  assert.ok(qinghai.raw_core_scenario.ratio_plans[0].ratio_trace
    .some(row => row.rule_id === 'soft-family-millet-liquid-v1'));

  const qinghaiTibet = report.by_region.find(row => row.region_id === 'qinghai_tibet');
  assert.deepEqual([qinghaiTibet.recipe_count, qinghaiTibet.single_pot_full_count], [4, 1]);
  for (const id of ['tibetan-savory-congee', 'tibetan-gutu', 'tibetan-ginseng-fruit-rice']) {
    assert.equal(byId(report, id).audit_status.startsWith('full_single_pot_'), false, id);
  }

  const capability = mappings.template_capability_mappings
    .find(row => row.family_id === 'grain-porridge');
  assert.equal(capability.coverage_level, 'partial');
  assert.deepEqual(capability.runtime_template_ids, ['soft-family-rice-pot']);
  assert.deepEqual(capability.resolved_ratio_rule_ids, ['soft-family-millet-liquid-v1']);
  assert.ok(capability.scope_note.includes('不声称传统复刻'));
});

test('report metadata, summaries, and validation are deterministic', () => {
  const first = buildRealReport();
  const second = buildRealReport();

  assert.deepEqual(first, second);
  assert.equal(first.schema_version, 1);
  assert.equal(first.summary.recipe_count, 72);
  assert.equal(first.summary.approved_count, 12);
  assert.equal(first.summary.auto_approved_count, 60);
  assert.deepEqual(validatePlannerMenuCoverage(first, {
    recipeLibrary, taxonomy, templates, ratios, mappings, baseline,
  }), []);
  assert.match(formatPlannerMenuCoverageSummary(first), /72 recipes/);
});

test('report validation rejects baseline, ratio, evidence, aggregate, and runtime-field drift', () => {
  const valid = buildRealReport();
  const errorText = report => validatePlannerMenuCoverage(report, {
    recipeLibrary, taxonomy, templates, ratios, mappings, baseline,
  }).join('\n');

  const missing = structuredClone(valid);
  missing.recipes.pop();
  assert.match(errorText(missing), /recipe count|ID\/status order/);

  const duplicate = structuredClone(valid);
  duplicate.recipes[1].recipe_id = duplicate.recipes[0].recipe_id;
  assert.match(errorText(duplicate), /IDs must be unique/);

  const changedStatus = structuredClone(valid);
  changedStatus.recipes[0].recipe_status = 'auto_approved';
  assert.match(errorText(changedStatus), /ID\/status order/);

  const unknownTemplate = structuredClone(valid);
  unknownTemplate.recipes[0].raw_core_scenario.selected_template_ids = ['not-a-template'];
  unknownTemplate.recipes[0].raw_core_scenario.pot_count = 1;
  assert.match(errorText(unknownTemplate), /unknown template/);

  const badRatio = structuredClone(valid);
  badRatio.recipes[0].identity_recognition_ratio = 0.123;
  assert.match(errorText(badRatio), /identity_recognition_ratio/);

  const badPotKind = structuredClone(valid);
  badPotKind.recipes[0].raw_core_scenario.plan_kind = 'single_pot';
  badPotKind.recipes[0].raw_core_scenario.pot_count = 2;
  assert.match(errorText(badPotKind), /single_pot must contain one pot/);

  const falseEvidence = structuredClone(valid);
  falseEvidence.recipes[0].evidence_alignment.evidence_template_ids = ['acid-staple-pot'];
  falseEvidence.recipes[0].evidence_alignment.direct_template_evidence = true;
  assert.match(errorText(falseEvidence), /false direct template evidence/);

  const unknownTechnique = structuredClone(valid);
  unknownTechnique.recipes[0].technique_family_id = 'invented-family';
  assert.match(errorText(unknownTechnique), /technique family/);

  const runtimeField = structuredClone(valid);
  runtimeField.recipes[0].steps = ['模型步骤'];
  assert.match(errorText(runtimeField), /forbidden runtime field steps/);

  const staleVersion = structuredClone(valid);
  staleVersion.template_catalog_version = 'stale-template-version';
  assert.match(errorText(staleVersion), /template_catalog_version/);

  const staleAggregate = structuredClone(valid);
  staleAggregate.by_template[0].selected_recipe_count += 1;
  assert.match(errorText(staleAggregate), /by_template aggregate/);

  const badHashes = structuredClone(valid);
  delete badHashes.source_hashes['tools/data/recipe-library.json'];
  badHashes.source_hashes['tools/data/ratio-rules.v1.json'] = 'not-a-sha256';
  assert.match(errorText(badHashes), /source_hashes/);

  const dishonestStatus = structuredClone(valid);
  dishonestStatus.recipes.find(row => row.audit_status === 'taxonomy_gap').audit_status = 'full_single_pot_evidence_aligned';
  assert.match(errorText(dishonestStatus), /audit_status is inconsistent/);
});
