import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareRatioCatalog } from '../lib/ratio-dsl-validator.mjs';
import { validateRiceMealCatalog } from '../lib/rice-meal-catalog-validator.mjs';
import { compileRatioPlan } from '../../worker/src/planner-v2.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const readJson = name => JSON.parse(fs.readFileSync(path.join(here, '../data', name), 'utf8'));
const catalog = readJson('rice-meal-catalog.v1.json');
const recipes = readJson('recipe-library.json');
const ratios = readJson('ratio-rules.v1.json');
const taxonomy = readJson('ingredient-taxonomy.v1.json');
const templates = readJson('meal-templates.v2.json');
const collection = readJson('rice-meal-collection.v1.json');
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

function variantFor(recipeId) {
  const rows = variants.filter(variant => variant.recipe_id === recipeId);
  assert.equal(rows.length, 1, `${recipeId} must have exactly one first-stage catalog variant`);
  return rows[0];
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

test('first-stage scope maps each permitted recipe exactly once to a fixed natural household name', () => {
  assert.deepEqual(validateRiceMealCatalog(catalog, {
    recipeLibrary: recipes,
    taxonomy,
    ratioCatalog: ratios,
    collection,
  }), []);
  const catalogEvidenceIds = [
    ...scope.included_recipe_ids,
    ...scope.controlled_process_adaptation_recipe_ids,
  ];
  assert.deepEqual(
    new Set(variants.map(variant => variant.recipe_id)),
    new Set(catalogEvidenceIds),
    'the catalog must cover only the fixed allowlist plus the three controlled process adaptations',
  );

  for (const [recipeId, want] of expected) {
    const variant = variantFor(recipeId);
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

test('chicken-leg potato rice is B because potato cannot stand in for the fiber role', () => {
  const variant = variantFor('chicken-leg-potato-braised-rice');

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
    taxonomy,
    ratioCatalog: ratios,
    collection: driftedCollection,
  }).some(error => error.includes('collection candidate.core_ingredients[2].label conflicts with canonical_id potato')));
});

test('every first-stage variant has traceable sources, A-or-B material nutrition, honest quantity references, and a closed-lid protocol', () => {
  for (const recipeId of scope.included_recipe_ids) {
    const variant = variantFor(recipeId);
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
  assert.deepEqual(previewReady.map(variant => variant.recipe_id).sort(), [
    'broccoli-beef-braised-rice',
    'cabbage-tofu-braised-rice',
    'chicken-leg-potato-braised-rice',
    'corn-carrot-chicken-leg-covered-rice',
    'green-bean-pork-rib-braised-rice',
    'greens-minced-pork-braised-rice',
    'mushroom-green-bean-pork-rib-braised-rice',
    'shanghai-salted-pork-vegetable-rice',
  ]);

  for (const variant of previewReady) {
    const recipe = recipeById.get(variant.recipe_id);
    const sourceNames = new Set(recipe.core_ingredients.map(normalize));
    for (const canonicalId of materialIds(variant)) {
      assert.ok(sourceNamesFor(taxonomyById.get(canonicalId)).some(name => sourceNames.has(name)), `${variant.recipe_id} may not depend on a user-unprovided major ingredient`);
    }
    for (const ruleId of variant.ratio_rule_ids) {
      const rule = ratioById.get(ruleId);
      assert.equal(rule.execution_mode, 'executable', `${variant.recipe_id} must only promote executable rules`);
      assert.equal(rule.when.recipe_id, variant.recipe_id);
      const liquid = rule.operations.filter(operation => operation.operator === 'ratio');
      assert.equal(liquid.length, 1, `${variant.recipe_id} needs one liquid default`);
      assert.equal(liquid[0].min, liquid[0].default, `${variant.recipe_id} liquid lower bound must equal its only default`);
      assert.equal(liquid[0].default, liquid[0].max, `${variant.recipe_id} liquid upper bound must equal its only default`);
    }
    for (const ingredient of [variant.rice, ...variant.ingredients]) {
      assert.notEqual(ingredient.amount_rule_id, null, `${variant.recipe_id} preview material must have an executable amount rule`);
      assert.ok(variant.ratio_rule_ids.includes(ingredient.amount_rule_id), `${variant.recipe_id} preview amount rule must be declared`);
    }
    assert.deepEqual(variant.approved_substitutions, [], `${variant.recipe_id} preview substitutions need an executable contract and are therefore absent`);
    const startActions = variant.cooker_adaptation.start_actions;
    const loads = startActions.filter(action => action.action_code === 'load_inner_pot');
    const starts = startActions.filter(action => action.action_code === 'start_closed_lid_program');
    assert.equal(loads.length, 1, `${variant.recipe_id} preview flow must load exactly once`);
    assert.equal(starts.length, 1, `${variant.recipe_id} preview flow must start exactly once`);
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
      `${variant.recipe_id} preview load must include every start-load material and exclude finish-only vegetables`,
    );
    if (finishHeld.size) {
      const fold = variant.cooker_adaptation.finish_actions
        .find(action => action.action_code === 'fold_in_pre_cooked_ingredients');
      assert.ok(fold, `${variant.recipe_id} controlled adaptation needs a finish fold`);
      assert.deepEqual(new Set(fold.ingredient_ids), finishHeld);
    }
    if (midHeld.size) {
      assert.equal(variant.variant_id, 'shanghai-salted-pork-rice');
      assert.deepEqual([...midHeld], ['small-bok-choy']);
      assert.deepEqual(variant.supported_servings, [3]);
    }
    const endpointIds = new Set(variant.safety_endpoints.map(endpoint => endpoint.canonical_ingredient_id));
    const verification = variant.cooker_adaptation.finish_actions.find(action => action.action_code === 'verify_safety_endpoints');
    assert.ok(verification, `${variant.recipe_id} preview flow must verify safety endpoints`);
    for (const endpointId of endpointIds) {
      assert.ok(verification.ingredient_ids.includes(endpointId), `${variant.recipe_id} preview verification must cover ${endpointId}`);
    }
  }

  for (const recipeId of [
    'quanzhou-oil-rice',
    'xinjiang-lamb-pilaf',
    'shaanbei-red-date-cowpea-rice',
  ]) {
    const variant = variantFor(recipeId);
    assert.equal(variant.status, 'planned', `${recipeId} has no source-backed unique executable default`);
    for (const ruleId of variant.ratio_rule_ids) {
      assert.equal(ratioById.get(ruleId).execution_mode, 'bounds_only', `${recipeId} must not turn a prose range into a midpoint default`);
    }
  }
});

test('meat-and-greens rice keeps the manufacturer evidence separate from the project household standard', () => {
  const variant = variantFor('greens-minced-pork-braised-rice');
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
  const prepared = prepareRatioCatalog(ratios, { templates, taxonomy, recipes });
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
      want: { 大米: 200, 排骨: 140, 豆角: 110, 水: 290, 盐: 2 },
    },
    {
      recipe_id: 'corn-carrot-chicken-leg-covered-rice',
      rule_id: 'corn-carrot-chicken-leg-covered-rice-executable-v1',
      items: ['大米', '鸡腿肉', '玉米', '胡萝卜'],
      want: { 大米: 200, 鸡腿肉: 110, 玉米: 45, 胡萝卜: 45, 水: 280 },
    },
    {
      recipe_id: 'mushroom-green-bean-pork-rib-braised-rice',
      rule_id: 'mushroom-green-bean-pork-rib-braised-rice-executable-v1',
      items: ['大米', '排骨', '香菇', '豆角'],
      want: { 大米: 200, 排骨: 140, 香菇: 65, 豆角: 65, 水: 290, 盐: 2 },
    },
    {
      recipe_id: 'cabbage-tofu-braised-rice',
      rule_id: 'cabbage-tofu-braised-rice-executable-v1',
      items: ['大米', '老豆腐', '白菜'],
      want: { 大米: 200, 老豆腐: 120, 白菜: 100, 水: 260, 盐: 2 },
    },
    {
      recipe_id: 'broccoli-beef-braised-rice',
      rule_id: 'broccoli-beef-braised-rice-executable-v1',
      items: ['大米', '牛肉', '西兰花'],
      want: { 大米: 200, 牛肉: 70, 西兰花: 90, 水: 270, 盐: 2 },
    },
    {
      recipe_id: 'greens-minced-pork-braised-rice',
      rule_id: 'greens-minced-pork-braised-rice-executable-v1',
      items: ['大米', '猪肉末', '青菜'],
      want: { 大米: 200, 猪肉末: 90, 青菜: 80, 水: 270 },
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

test('controlled finish-only variants expose the drained project test standard without changing regional identity', () => {
  const cases = [
    ['cabbage-tofu-braised-rice', 'napa-cabbage'],
    ['broccoli-beef-braised-rice', 'broccoli'],
  ];
  for (const [recipeId, heldId] of cases) {
    const variant = variantFor(recipeId);
    assert.equal(variant.status, 'preview_ready');
    assert.deepEqual(variant.supported_servings, [1, 2, 4]);
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
  assert.equal(variantFor('greens-minced-pork-braised-rice').status, 'preview_ready');
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
    const variant = variantFor(testCase.recipeId);
    const rule = ratioById.get(variant.ratio_rule_ids[0]);
    assert.deepEqual(variant.supported_servings, [1, 2, 4]);
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
      variantFor(recipeId).cooker_adaptation.pre_actions.some(action => action.action_code === actionCode),
      `${recipeId} must retain its explicit preprocessing action`,
    );
  }
});
