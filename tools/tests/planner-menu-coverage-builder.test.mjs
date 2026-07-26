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
  assert.equal(entry.planner_eligible_items.filter(row => row.duplicate_of === null).length, 1);
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
  assert.equal(noodles.audit_status, 'taxonomy_gap');
  assert.equal(noodles.unclassified_core_items.some(row => row.raw === '鲜小麦面条'), true);
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
