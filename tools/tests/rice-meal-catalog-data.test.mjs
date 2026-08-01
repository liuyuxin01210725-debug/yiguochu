import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareRatioCatalog } from '../lib/ratio-dsl-validator.mjs';
import {
  resolveDefaultPerServingMaterialGrams,
  validateRiceMealCatalog,
  validateSubstantialNutrition,
} from '../lib/rice-meal-catalog-validator.mjs';
import { compileRatioPlan } from '../../worker/src/planner-v2.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const readJson = name => JSON.parse(fs.readFileSync(path.join(here, '../data', name), 'utf8'));
const catalog = readJson('rice-meal-catalog.v1.json');
const recipes = readJson('recipe-library.json');
const ratios = readJson('ratio-rules.v1.json');
const taxonomy = readJson('ingredient-taxonomy.v1.json');
const templates = readJson('meal-templates.v2.json');
const collection = readJson('rice-meal-collection.v1.json');
const sourceEvidence = readJson('rice-cooker-source-evidence.v1.json');
const scope = JSON.parse(fs.readFileSync(path.join(here, 'fixtures/rice-meal-preview-scope.json'), 'utf8'));

const recipeById = new Map(recipes.recipes.map(recipe => [recipe.id, recipe]));
const ratioById = new Map(ratios.rules.map(rule => [rule.rule_id, rule]));
const taxonomyById = new Map(taxonomy.items.map(item => [item.canonical_id, item]));
const variants = catalog.families.flatMap(family => family.variants || []);
const normalize = value => String(value || '').trim().toLowerCase().replace(/[\s（）()_-]+/gu, '');

const expected = new Map([
  ['quanzhou-oil-rice', {
    variant_id: 'home-soaked-glutinous-pork-mushroom-rice',
    display_name: '泉州浥饭（油饭）',
    status: 'planned',
  }],
  ['xinjiang-lamb-pilaf', {
    variant_id: 'home-lamb-carrot-rice',
    display_name: '新疆羊肉抓饭',
    status: 'planned',
  }],
  ['shaanbei-red-date-cowpea-rice', {
    variant_id: 'home-red-date-cowpea-rice',
    display_name: '陕北红枣豇豆焖饭',
    status: 'planned',
  }],
  ['chicken-leg-potato-braised-rice', {
    variant_id: 'home-chicken-leg-potato-rice',
    display_name: '鸡腿土豆焖饭',
    status: 'preview_ready',
  }],
  ['corn-carrot-chicken-leg-covered-rice', {
    variant_id: 'home-corn-carrot-chicken-leg-rice',
    display_name: '玉米胡萝卜鸡腿焖饭',
    status: 'preview_ready',
  }],
  ['green-bean-pork-rib-braised-rice', {
    variant_id: 'home-green-bean-pork-rib-rice',
    display_name: '豆角排骨焖饭',
    status: 'preview_ready',
  }],
  ['mushroom-green-bean-pork-rib-braised-rice', {
    variant_id: 'home-mushroom-green-bean-pork-rib-rice',
    display_name: '香菇豆角排骨焖饭',
    status: 'preview_ready',
  }],
  ['cabbage-tofu-braised-rice', {
    variant_id: 'home-cabbage-tofu-rice',
    display_name: '白菜豆腐焖饭',
    status: 'preview_ready',
  }],
  ['broccoli-beef-braised-rice', {
    variant_id: 'home-broccoli-beef-rice',
    display_name: '西兰花牛肉焖饭',
    status: 'preview_ready',
  }],
  ['greens-minced-pork-braised-rice', {
    variant_id: 'home-greens-minced-pork-rice',
    display_name: '肉糜青菜饭',
    status: 'preview_ready',
  }],
  ['shanghai-salted-pork-vegetable-rice', {
    variant_id: 'shanghai-salted-pork-rice',
    display_name: '上海咸肉菜饭',
    status: 'preview_ready',
    identity_level: 'regional',
  }],
]);

function variantForRecipeEvidence(recipeId) {
  const expectedVariantId = expected.get(recipeId)?.variant_id;
  assert.ok(expectedVariantId, `${recipeId} must have an expected migrated variant`);
  const row = variants.find(variant => variant.variant_id === expectedVariantId);
  assert.ok(row, `${expectedVariantId} must be the stable runtime variant identity`);
  assert.ok(
    row.evidence_refs.some(ref => ref.kind === 'recipe' && ref.id === recipeId),
    `${expectedVariantId} must retain ${recipeId} only as recipe evidence`,
  );
  return row;
}

function materialIds(variant) {
  return [variant.rice.canonical_ingredient_id, ...variant.ingredients.map(item => item.canonical_ingredient_id)];
}

function allActionIngredientIds(variant) {
  return new Set([
    ...variant.cooker_adaptation.pre_actions,
    ...variant.cooker_adaptation.start_actions,
    ...(variant.cooker_adaptation.mid_actions || []),
    ...variant.cooker_adaptation.finish_actions,
  ].flatMap(action => action.ingredient_ids));
}

function sourceNamesFor(item) {
  return [item.display_name, ...(item.aliases || [])].map(normalize);
}

test('first-stage scope uses unique variant identities and keeps recipes as optional evidence', () => {
  assert.deepEqual(validateRiceMealCatalog(catalog, {
    recipeLibrary: recipes,
    sourceEvidence,
    taxonomy,
    ratioCatalog: ratios,
    collection,
  }), []);
  const catalogEvidenceIds = [
    ...scope.included_recipe_ids,
    ...scope.controlled_process_adaptation_recipe_ids,
  ];
  assert.equal(new Set(variants.map(variant => variant.variant_id)).size, variants.length);
  assert.deepEqual(
    new Set(variants.flatMap(variant => variant.evidence_refs
      .filter(ref => ref.kind === 'recipe')
      .map(ref => ref.id))),
    new Set(catalogEvidenceIds),
    'recipe evidence must cover the fixed allowlist plus controlled process adaptations without becoming the runtime key',
  );
  for (const variant of variants) {
    assert.ok(variant.evidence_refs.length > 0, `${variant.variant_id} requires evidence`);
    if (variant.recipe_id !== null && variant.recipe_id !== undefined) {
      assert.ok(
        variant.evidence_refs.some(ref => ref.kind === 'recipe' && ref.id === variant.recipe_id),
        `${variant.variant_id} legacy recipe_id must also appear as same-ID recipe evidence`,
      );
    }
  }

  for (const [recipeId, want] of expected) {
    const variant = variantForRecipeEvidence(recipeId);
    assert.equal(variant.variant_id, want.variant_id);
    assert.equal(variant.display_name, want.display_name);
    assert.equal(variant.status, want.status);
    assert.equal(variant.identity_level, want.identity_level || 'household_reviewed');
    if (want.identity_level === 'regional') {
      assert.deepEqual(variant.region_codes, ['CN-SH']);
      assert.equal(variant.identity_refs.length, 1);
    } else {
      assert.deepEqual(variant.region_codes, [], `${recipeId} must not imply a regional authenticity claim`);
      assert.deepEqual(variant.identity_refs, [], `${recipeId} must not carry an unsupported regional identity ref`);
    }
    assert.doesNotMatch(variant.display_name, /饭锅|主食锅/u, `${recipeId} needs a natural household dish name`);
    if (want.identity_level === 'regional') {
      assert.match(variant.review_note, /上海市政府|HowToCook/u, `${recipeId} review note must trace its regional and process evidence`);
    } else {
      assert.match(variant.review_note, /recipe-library\.json/u, `${recipeId} review note must trace the migration basis`);
    }
  }
});

test('a source-only runtime variant remains valid with recipe_id null and a variant-scoped ratio', () => {
  const sourceOnlyCatalog = structuredClone(catalog);
  const sourceOnlyRatios = structuredClone(ratios);
  const variant = sourceOnlyCatalog.families
    .flatMap(family => family.variants)
    .find(row => row.variant_id === 'home-chicken-leg-potato-rice');
  variant.recipe_id = null;
  variant.evidence_refs = [{
    kind: 'source',
    id: 'panasonic-mixed-chicken-rice-sr-df151',
    supports: ['identity'],
  }];
  for (const ratioRuleId of variant.ratio_rule_ids) {
    sourceOnlyRatios.rules.find(rule => rule.rule_id === ratioRuleId).when = {
      variant_id: variant.variant_id,
    };
  }

  assert.deepEqual(validateRiceMealCatalog(sourceOnlyCatalog, {
    recipeLibrary: recipes,
    sourceEvidence,
    taxonomy,
    ratioCatalog: sourceOnlyRatios,
    collection,
  }), []);
});

test('chicken-leg potato rice is B because potato cannot stand in for the fiber role', () => {
  const variant = variantForRecipeEvidence('chicken-leg-potato-braised-rice');

  assert.equal(variant.nutrition_structure.grade, 'B');
  assert.deepEqual(variant.nutrition_structure.material_contributors, [
    { role: 'carb', canonical_ingredient_id: 'raw-rice' },
    { role: 'protein', canonical_ingredient_id: 'chicken-leg' },
  ]);
  assert.equal(
    variant.nutrition_structure.material_contributors.some(contributor => (
      contributor.canonical_ingredient_id === 'potato' || contributor.role === 'fiber'
    )),
    false,
  );
});

test('catalog rejects a source label drift in chicken-leg potato rice while its canonical ID stays potato', () => {
  const driftedCollection = structuredClone(collection);
  const potato = driftedCollection.candidates
    .find(candidate => candidate.candidate_id === 'household-chicken-leg-potato-rice')
    .core_ingredients.find(item => item.canonical_id === 'potato');
  potato.label = '香菇';

  assert.ok(validateRiceMealCatalog(catalog, {
    recipeLibrary: recipes,
    sourceEvidence,
    taxonomy,
    ratioCatalog: ratios,
    collection: driftedCollection,
  }).some(error => error.includes('collection candidate.core_ingredients[2].label conflicts with canonical_id potato')));
});

test('every first-stage variant has traceable sources, A-or-B material nutrition, honest quantity references, and a closed-lid protocol', () => {
  for (const recipeId of scope.included_recipe_ids) {
    const variant = variantForRecipeEvidence(recipeId);
    const recipe = recipeById.get(recipeId);
    assert.ok(recipe, `${recipeId} must still be a library recipe`);
    const materials = materialIds(variant);
    assert.equal(new Set(materials).size, materials.length, `${recipeId} material identities must not duplicate`);
    assert.equal(variant.nutrition_structure.grade === 'A' || variant.nutrition_structure.grade === 'B', true);
    const roles = new Set(variant.nutrition_structure.material_contributors.map(row => row.role));
    if (variant.nutrition_structure.grade === 'A') {
      assert.deepEqual(new Set(['carb', 'protein', 'fiber'].filter(role => roles.has(role))), new Set(['carb', 'protein', 'fiber']));
    } else {
      assert.ok(roles.size >= 2, `${recipeId} B structure needs two material roles`);
    }
    for (const contributor of variant.nutrition_structure.material_contributors) {
      assert.ok(materials.includes(contributor.canonical_ingredient_id), `${recipeId} contributor must be material`);
    }

    assert.ok(variant.source_refs.some(ref => recipe.source_refs.some(source => source.url === ref.url)), `${recipeId} must retain a traceable recipe source`);
    assert.ok(variant.ratio_rule_ids.length > 0, `${recipeId} needs a ratio rule`);
    for (const ingredient of [variant.rice, ...variant.ingredients]) {
      if (ingredient.amount_rule_id === null) {
        assert.equal(variant.status, 'planned', `${recipeId} may leave a material unquantified only while planned`);
        assert.match(variant.review_note, /未量化/u, `${recipeId} planned null amount_rule_id must be explained`);
        continue;
      }
      assert.ok(ratioById.has(ingredient.amount_rule_id), `${recipeId} ${ingredient.canonical_ingredient_id} needs a known amount rule`);
      assert.ok(variant.ratio_rule_ids.includes(ingredient.amount_rule_id), `${recipeId} amount rule must be declared by the variant`);
    }

    const adaptation = variant.cooker_adaptation;
    assert.equal(adaptation.closed_lid_continuation, true);
    assert.equal(adaptation.requires_mid_cook_opening, false);
    assert.equal(adaptation.completion_status, 'complete');
    assert.equal(adaptation.program, 'standard_rice');
    assert.ok(adaptation.active_time_minutes > 0 && adaptation.active_time_minutes <= adaptation.total_time_minutes);
    assert.equal(adaptation.total_time_minutes, recipe.total_time_minutes, `${recipeId} must not invent a total duration`);
    for (const phase of ['pre_actions', 'start_actions', 'finish_actions']) {
      const actions = adaptation[phase];
      assert.ok(actions.length > 0, `${recipeId} ${phase} must be explicit`);
      assert.deepEqual(actions.map(action => action.order), actions.map((_, index) => index + 1), `${recipeId} ${phase} must stay ordered`);
    }
    const actionMaterials = allActionIngredientIds(variant);
    for (const material of materials) assert.ok(actionMaterials.has(material), `${recipeId} action protocol omits ${material}`);

    const endpointPairs = new Set(variant.safety_endpoints.map(endpoint => `${endpoint.canonical_ingredient_id}\u0000${endpoint.endpoint_code}`));
    for (const material of materials) {
      for (const endpointCode of taxonomyById.get(material).cooking_risk.required_endpoint_codes) {
        assert.ok(endpointPairs.has(`${material}\u0000${endpointCode}`), `${recipeId} lacks ${endpointCode} for ${material}`);
      }
    }

    for (const substitution of variant.approved_substitutions) {
      const replaced = taxonomyById.get(substitution.replaces_canonical_id);
      assert.ok(materials.includes(replaced.canonical_id), `${recipeId} can only substitute a listed material`);
      for (const allowedId of substitution.allowed_canonical_ids) {
        const allowed = taxonomyById.get(allowedId);
        assert.equal(allowed.category, replaced.category, `${recipeId} substitution must retain ingredient form category`);
        assert.ok(allowed.states.some(state => replaced.states.includes(state)), `${recipeId} substitution must retain state`);
        assert.ok(allowed.shapes_or_cuts.some(shape => replaced.shapes_or_cuts.includes(shape)), `${recipeId} substitution must retain cut/form`);
      }
    }
  }
});

test('preview-ready entries promote only unique executable defaults and never infer a midpoint from recipe prose', () => {
  const previewReady = variants.filter(variant => variant.status === 'preview_ready');
  assert.deepEqual(previewReady.map(variant => variant.variant_id).sort(), [
    'home-broccoli-beef-rice',
    'home-cabbage-tofu-rice',
    'home-chicken-leg-potato-rice',
    'home-corn-carrot-chicken-leg-rice',
    'home-green-bean-pork-rib-rice',
    'home-greens-minced-pork-rice',
    'home-mushroom-green-bean-pork-rib-rice',
    'shanghai-salted-pork-rice',
  ]);

  for (const variant of previewReady) {
    const recipeEvidence = variant.evidence_refs.find(ref => ref.kind === 'recipe');
    const recipe = recipeById.get(recipeEvidence?.id);
    assert.ok(recipe, `${variant.variant_id} requires usable recipe evidence for this migrated batch`);
    const sourceNames = new Set(recipe.core_ingredients.map(normalize));
    for (const canonicalId of materialIds(variant)) {
      assert.ok(sourceNamesFor(taxonomyById.get(canonicalId)).some(name => sourceNames.has(name)), `${variant.variant_id} may not depend on a user-unprovided major ingredient`);
    }
    for (const ruleId of variant.ratio_rule_ids) {
      const rule = ratioById.get(ruleId);
      assert.equal(rule.execution_mode, 'executable', `${variant.variant_id} must only promote executable rules`);
      assert.equal(
        rule.when.variant_id === variant.variant_id || rule.when.recipe_id === variant.recipe_id,
        true,
        `${variant.variant_id} ratio rule must bind the runtime variant or its temporary legacy recipe evidence`,
      );
      const liquid = rule.operations.filter(operation => operation.operator === 'ratio');
      assert.equal(liquid.length, 1, `${variant.variant_id} needs one liquid default`);
      assert.equal(liquid[0].min, liquid[0].default, `${variant.variant_id} liquid lower bound must equal its only default`);
      assert.equal(liquid[0].default, liquid[0].max, `${variant.variant_id} liquid upper bound must equal its only default`);
    }
    for (const ingredient of [variant.rice, ...variant.ingredients]) {
      assert.notEqual(ingredient.amount_rule_id, null, `${variant.variant_id} preview material must have an executable amount rule`);
      assert.ok(variant.ratio_rule_ids.includes(ingredient.amount_rule_id), `${variant.variant_id} preview amount rule must be declared`);
    }
    assert.deepEqual(variant.approved_substitutions, [], `${variant.variant_id} preview substitutions need an executable contract and are therefore absent`);
    const startActions = variant.cooker_adaptation.start_actions;
    const loads = startActions.filter(action => action.action_code === 'load_inner_pot');
    const starts = startActions.filter(action => action.action_code === 'start_closed_lid_program');
    assert.equal(loads.length, 1, `${variant.variant_id} preview flow must load exactly once`);
    assert.equal(starts.length, 1, `${variant.variant_id} preview flow must start exactly once`);
    const preCook = variant.cooker_adaptation.pre_actions
      .find(action => [
        'pre_cook_tender_vegetables_outside_cooker',
        'pre_cook_tender_vegetables_drain_and_discard_liquid',
      ].includes(action.action_code));
    const finishHeld = new Set(preCook?.ingredient_ids || []);
    const midHeld = new Set((variant.cooker_adaptation.mid_actions || [])
      .flatMap(action => action.ingredient_ids || []));
    const heldAside = new Set([...finishHeld, ...midHeld]);
    assert.deepEqual(
      new Set(loads[0].ingredient_ids),
      new Set(materialIds(variant).filter(id => !heldAside.has(id))),
      `${variant.variant_id} preview load must include every start-load material and exclude finish-only vegetables`,
    );
    if (finishHeld.size) {
      const fold = variant.cooker_adaptation.finish_actions
        .find(action => action.action_code === 'fold_in_pre_cooked_ingredients');
      assert.ok(fold, `${variant.variant_id} controlled adaptation needs a finish fold`);
      assert.deepEqual(new Set(fold.ingredient_ids), finishHeld);
    }
    if (midHeld.size) {
      assert.equal(variant.variant_id, 'shanghai-salted-pork-rice');
      assert.deepEqual([...midHeld], ['small-bok-choy']);
      assert.deepEqual(variant.supported_servings, [3]);
    }
    const endpointIds = new Set(variant.safety_endpoints.map(endpoint => endpoint.canonical_ingredient_id));
    const verification = variant.cooker_adaptation.finish_actions.find(action => action.action_code === 'verify_safety_endpoints');
    assert.ok(verification, `${variant.variant_id} preview flow must verify safety endpoints`);
    for (const endpointId of endpointIds) {
      assert.ok(verification.ingredient_ids.includes(endpointId), `${variant.variant_id} preview verification must cover ${endpointId}`);
    }
  }

  for (const recipeId of [
    'quanzhou-oil-rice',
    'xinjiang-lamb-pilaf',
    'shaanbei-red-date-cowpea-rice',
  ]) {
    const variant = variantForRecipeEvidence(recipeId);
    assert.equal(variant.status, 'planned', `${recipeId} has no source-backed unique executable default`);
    for (const ruleId of variant.ratio_rule_ids) {
      assert.equal(ratioById.get(ruleId).execution_mode, 'bounds_only', `${recipeId} must not turn a prose range into a midpoint default`);
    }
  }
});

test('meat-and-greens rice keeps the manufacturer evidence separate from the project household standard', () => {
  const variant = variantForRecipeEvidence('greens-minced-pork-braised-rice');
  const rule = ratioById.get('greens-minced-pork-braised-rice-executable-v1');

  assert.equal(variant.display_name, '肉糜青菜饭');
  assert.ok(variant.source_refs.some(ref => ref.url === 'https://www.zojirushi-china.com/media/6749/nl-erh-ccn20250317_a.pdf'));
  assert.deepEqual(rule.liquid_contract, {
    kind: 'added_water',
    measurement: 'weigh_before_loading',
    display_precision: 'approximate',
    display_rounding_grams: 10,
  });
  assert.match(variant.review_note, /项目家庭标准/u);
  assert.match(variant.review_note, /象印/u);
});

test('closed-lid recipe rules compile the migrated fixed quantities through one integer normalization boundary', () => {
  const prepared = prepareRatioCatalog(ratios, {
    templates,
    taxonomy,
    recipes,
    riceMealCatalog: catalog,
  });
  assert.equal(prepared.ok, true, prepared.errors.join('\n'));
  const cases = [
    {
      recipe_id: 'chicken-leg-potato-braised-rice',
      rule_id: 'chicken-leg-potato-braised-rice-executable-v1',
      items: ['大米', '鸡腿肉', '土豆'],
      want: { 大米: 200, 鸡腿肉: 120, 土豆: 100, 水: 280 },
    },
    {
      recipe_id: 'green-bean-pork-rib-braised-rice',
      rule_id: 'green-bean-pork-rib-braised-rice-executable-v1',
      items: ['大米', '排骨', '豆角'],
      want: { 大米: 200, 排骨: 200, 豆角: 150, 水: 290, 盐: 2 },
    },
    {
      recipe_id: 'corn-carrot-chicken-leg-covered-rice',
      rule_id: 'corn-carrot-chicken-leg-covered-rice-executable-v1',
      items: ['大米', '鸡腿肉', '玉米', '胡萝卜'],
      want: { 大米: 200, 鸡腿肉: 110, 玉米: 75, 胡萝卜: 75, 水: 280 },
    },
    {
      recipe_id: 'mushroom-green-bean-pork-rib-braised-rice',
      rule_id: 'mushroom-green-bean-pork-rib-braised-rice-executable-v1',
      items: ['大米', '排骨', '香菇', '豆角'],
      want: { 大米: 200, 排骨: 200, 香菇: 75, 豆角: 75, 水: 290, 盐: 2 },
    },
    {
      recipe_id: 'cabbage-tofu-braised-rice',
      rule_id: 'cabbage-tofu-braised-rice-executable-v1',
      items: ['大米', '老豆腐', '白菜'],
      want: { 大米: 200, 老豆腐: 180, 白菜: 150, 水: 260, 盐: 2 },
    },
    {
      recipe_id: 'broccoli-beef-braised-rice',
      rule_id: 'broccoli-beef-braised-rice-executable-v1',
      items: ['大米', '牛肉', '西兰花'],
      want: { 大米: 200, 牛肉: 100, 西兰花: 150, 水: 270, 盐: 2 },
    },
    {
      recipe_id: 'greens-minced-pork-braised-rice',
      rule_id: 'greens-minced-pork-braised-rice-executable-v1',
      items: ['大米', '猪肉末', '青菜'],
      want: { 大米: 200, 猪肉末: 100, 青菜: 150, 水: 270 },
    },
  ];
  for (const testCase of cases) {
    const result = compileRatioPlan(testCase.rule_id, {
      recipe_id: testCase.recipe_id,
      servings: 2,
      slots: { recipe_materials: testCase.items },
    }, prepared.catalog);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.deepEqual(Object.fromEntries(result.ingredient_amounts.map(row => [row.name, row.grams])), testCase.want);
    assert.equal(result.liquid_constraints.rounding_grams, 1);
    assert.ok(result.identity_amounts.every(row => Number.isSafeInteger(row.grams) && row.grams > 0));
  }
});

test('all eight Preview meals earn their A-or-B grade from executable per-person grams', () => {
  const active = variants.filter(variant => variant.status === 'preview_ready');
  const expectedDefaults = new Map([
    ['home-chicken-leg-potato-rice', { grade: 'B', grams: { 'raw-rice': 100, 'chicken-leg': 60, potato: 50 } }],
    ['home-corn-carrot-chicken-leg-rice', { grade: 'A', grams: { 'raw-rice': 100, 'chicken-leg': 55, 'sweet-corn': 38, carrot: 37 } }],
    ['home-green-bean-pork-rib-rice', { grade: 'A', grams: { 'raw-rice': 100, 'pork-ribs': 100, 'green-beans': 75 } }],
    ['home-mushroom-green-bean-pork-rib-rice', { grade: 'A', grams: { 'raw-rice': 100, 'pork-ribs': 100, shiitake: 38, 'green-beans': 37 } }],
    ['home-cabbage-tofu-rice', { grade: 'A', grams: { 'raw-rice': 100, 'firm-tofu': 90, 'napa-cabbage': 75 } }],
    ['home-broccoli-beef-rice', { grade: 'A', grams: { 'raw-rice': 100, 'beef-generic': 50, broccoli: 75 } }],
    ['shanghai-salted-pork-rice', { grade: 'A', grams: { 'raw-rice': 100, 'salted-pork-belly': 50, 'small-bok-choy': 133 } }],
    ['home-greens-minced-pork-rice', { grade: 'A', grams: { 'raw-rice': 100, 'ground-pork': 50, 'leafy-greens': 75 } }],
  ]);

  assert.equal(active.length, expectedDefaults.size);
  for (const variant of active) {
    const expectedRow = expectedDefaults.get(variant.variant_id);
    assert.ok(expectedRow, variant.variant_id);
    assert.equal(variant.nutrition_structure.grade, expectedRow.grade, variant.variant_id);
    assert.deepEqual(
      Object.fromEntries(resolveDefaultPerServingMaterialGrams(variant, ratios)),
      expectedRow.grams,
      variant.variant_id,
    );
    assert.deepEqual(validateSubstantialNutrition(variant, taxonomy, ratios), [], variant.variant_id);
  }
});

test('catalog exposes eight liquid-audited Preview meals while keeping all eleven evidence variants and 72 recipes', () => {
  const active = variants.filter(variant => variant.status === 'preview_ready');
  assert.equal(catalog.families.length, 3);
  assert.equal(variants.length, 11);
  assert.equal(active.length, 8);
  assert.equal(variants.filter(variant => variant.status === 'planned').length, 3);
  assert.equal(active.filter(variant => variant.nutrition_structure.grade === 'A').length, 7);
  assert.equal(active.filter(variant => variant.nutrition_structure.grade === 'B').length, 1);
  assert.equal(recipes.recipes.length, 72);
});

test('every active ordinary meal explicitly supports 1, 2, 3, and 4 servings while Shanghai remains 3-only', () => {
  const active = variants.filter(variant => variant.status === 'preview_ready');
  for (const variant of active) {
    assert.deepEqual(
      variant.supported_servings,
      variant.variant_id === 'shanghai-salted-pork-rice' ? [3] : [1, 2, 3, 4],
      variant.variant_id,
    );
  }
});

test('project nutrition calibrations are explicit in review notes instead of being presented as source facts', () => {
  for (const variantId of [
    'home-corn-carrot-chicken-leg-rice',
    'home-green-bean-pork-rib-rice',
    'home-mushroom-green-bean-pork-rib-rice',
    'home-cabbage-tofu-rice',
    'home-broccoli-beef-rice',
    'home-greens-minced-pork-rice',
  ]) {
    const variant = variants.find(row => row.variant_id === variantId);
    assert.match(variant.review_note, /项目营养校准/u, variantId);
    assert.match(variant.review_note, /不是来源原始单项克数|不是来源原始份量/u, variantId);
  }
});

test('controlled finish-only variants expose the drained project test standard without changing regional identity', () => {
  const cases = [
    ['cabbage-tofu-braised-rice', 'napa-cabbage'],
    ['broccoli-beef-braised-rice', 'broccoli'],
  ];
  for (const [recipeId, heldId] of cases) {
    const variant = variantForRecipeEvidence(recipeId);
    assert.equal(variant.status, 'preview_ready');
    assert.deepEqual(variant.supported_servings, [1, 2, 3, 4]);
    assert.match(variant.review_note, /一锅出项目 Preview 家庭测试标准/u);
    assert.match(variant.review_note, /待真实厨房反馈/u);
    assert.match(variant.review_note, /不宣称地域原方、厂商跨机型保证、已试做或人工批准/u);
    const preCook = variant.cooker_adaptation.pre_actions.find(action => action.action_code === 'pre_cook_tender_vegetables_drain_and_discard_liquid');
    const load = variant.cooker_adaptation.start_actions.find(action => action.action_code === 'load_inner_pot');
    const fold = variant.cooker_adaptation.finish_actions.find(action => action.action_code === 'fold_in_pre_cooked_ingredients');
    assert.deepEqual(preCook?.ingredient_ids, [heldId]);
    assert.equal(load?.ingredient_ids.includes(heldId), false);
    assert.deepEqual(fold?.ingredient_ids, [heldId]);
    assert.ok(variant.safety_endpoints.some(endpoint => endpoint.canonical_ingredient_id === heldId));
  }
  assert.equal(variantForRecipeEvidence('greens-minced-pork-braised-rice').status, 'preview_ready');
});

test('four project test standards bind added water, salt, draining actions, safety and project canonical source', () => {
  const cases = [
    {
      recipeId: 'green-bean-pork-rib-braised-rice',
      water: 1.45,
      preActions: ['pre_cook_pork_ribs_drain_and_discard_liquid', 'drain_prepared_vegetables_before_loading'],
      endpoints: ['rice_tender', 'pork_fully_cooked', 'bean_fully_cooked'],
    },
    {
      recipeId: 'mushroom-green-bean-pork-rib-braised-rice',
      water: 1.45,
      preActions: ['pre_cook_pork_ribs_drain_and_discard_liquid', 'drain_prepared_vegetables_before_loading'],
      endpoints: ['rice_tender', 'pork_fully_cooked', 'bean_fully_cooked'],
    },
    {
      recipeId: 'cabbage-tofu-braised-rice',
      water: 1.3,
      preActions: ['pre_cook_tender_vegetables_drain_and_discard_liquid'],
      endpoints: ['rice_tender', 'heated_through', 'tender'],
    },
    {
      recipeId: 'broccoli-beef-braised-rice',
      water: 1.35,
      preActions: ['pre_cook_tender_vegetables_drain_and_discard_liquid'],
      endpoints: ['rice_tender', 'beef_fully_cooked', 'tender'],
    },
  ];
  for (const testCase of cases) {
    const variant = variantForRecipeEvidence(testCase.recipeId);
    const rule = ratioById.get(variant.ratio_rule_ids[0]);
    assert.deepEqual(variant.supported_servings, [1, 2, 3, 4]);
    assert.equal(rule.liquid_contract.kind, 'added_water');
    const liquid = rule.operations.find(operation => operation.operator === 'ratio');
    assert.equal(liquid.numerator.resource, 'added_water_grams');
    assert.equal(liquid.default, testCase.water);
    const salt = rule.operations.find(operation => operation.target?.category === 'seasoning');
    assert.deepEqual(salt, {
      operator: 'scale_by_servings',
      target: { name: '盐', category: 'seasoning' },
      grams: { min: 1, default: 1, max: 1 },
    });
    const actionCodes = variant.cooker_adaptation.pre_actions.map(action => action.action_code);
    for (const actionCode of testCase.preActions) assert.ok(actionCodes.includes(actionCode), `${testCase.recipeId}/${actionCode}`);
    assert.deepEqual(variant.safety_endpoints.map(endpoint => endpoint.endpoint_code), testCase.endpoints);
    assert.ok(variant.source_refs.every(ref => ref.title.startsWith('一锅出项目标准配方：')));
    assert.ok(variant.source_refs.every(ref => !/地域事实来源|传统原方/u.test(ref.title)));
  }
});

test('four project test standards keep their canonical recipe pages aligned with the machine contract', () => {
  const cases = [
    {
      recipeId: 'green-bean-pork-rib-braised-rice',
      water: 145,
      technique: /锅外预煮.*沥干.*预煮水.*弃置/u,
      summary: /沥干.*弃置.*预煮水/u,
    },
    {
      recipeId: 'mushroom-green-bean-pork-rib-braised-rice',
      water: 145,
      technique: /锅外预煮.*沥干.*预煮水.*弃置/u,
      summary: /沥干.*弃置.*预煮水/u,
    },
    {
      recipeId: 'cabbage-tofu-braised-rice',
      water: 130,
      technique: /白菜.*锅外.*熟.*沥干.*弃置.*焖菜水.*成饭.*拌入/u,
      summary: /白菜.*锅外.*成饭后.*拌入/u,
    },
    {
      recipeId: 'broccoli-beef-braised-rice',
      water: 135,
      technique: /西兰花.*锅外.*熟.*沥干.*弃置.*焖菜水.*成饭.*拌入/u,
      summary: /西兰花.*锅外.*成饭后.*拌入/u,
    },
  ];
  for (const testCase of cases) {
    const recipe = recipeById.get(testCase.recipeId);
    assert.equal(recipe.status, 'auto_approved');
    assert.equal(recipe.source_refs.length, 1);
    assert.deepEqual(Object.keys(recipe.source_refs[0]).sort(), [
      'attribution', 'license', 'retrieved_at', 'title', 'url', 'usage',
    ]);
    assert.match(recipe.summary, testCase.summary, testCase.recipeId);
    assert.match(recipe.technique.join(' '), testCase.technique, testCase.recipeId);
    assert.match(recipe.ratio_rules.join(' '), new RegExp(`每100克大米另加约${testCase.water}克清水`, 'u'), testCase.recipeId);
    assert.match(recipe.ratio_rules.join(' '), /每份使用1克盐/u, testCase.recipeId);
    assert.doesNotMatch(
      [recipe.summary, recipe.adaptation_note, ...recipe.technique, ...recipe.ratio_rules].join(' '),
      /可用总液体|接近熟透时加入白菜|后段加入西兰花/u,
      testCase.recipeId,
    );
  }
  assert.equal(recipes.recipes.length, 72);
});

test('the first-stage action catalog preserves explicit poultry rib and lamb preprocessing outside the single closed-lid cycle', () => {
  const requiredPreAction = new Map([
    ['chicken-leg-potato-braised-rice', 'cut_chicken_leg_to_small_pieces'],
    ['corn-carrot-chicken-leg-covered-rice', 'cut_chicken_leg_to_small_pieces'],
    ['green-bean-pork-rib-braised-rice', 'pre_cook_pork_ribs_drain_and_discard_liquid'],
    ['mushroom-green-bean-pork-rib-braised-rice', 'pre_cook_pork_ribs_drain_and_discard_liquid'],
    ['xinjiang-lamb-pilaf', 'brown_lamb_and_aromatics_outside_cooker'],
  ]);
  for (const [recipeId, actionCode] of requiredPreAction) {
    assert.ok(
      variantForRecipeEvidence(recipeId).cooker_adaptation.pre_actions.some(action => action.action_code === actionCode),
      `${recipeId} must retain its explicit preprocessing action`,
    );
  }
});
