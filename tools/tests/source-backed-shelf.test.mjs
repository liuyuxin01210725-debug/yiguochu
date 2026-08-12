import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { buildShelfCatalog, classifySourceBackedRecipe } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../../tools/data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('classifies signed recipes as A and complete trial recipes as B without overlap', () => {
  const signed = catalog.recipes.find(recipe => recipe.status === 'executable');
  const trial = catalog.recipes.find(recipe => recipe.status === 'recipe_fact_checked' && recipe.fixed_batch && recipe.cooking_sequence?.length);
  const archive = catalog.recipes.find(recipe => !recipe.fixed_batch || !recipe.cooking_sequence?.length);

  assert.equal(classifySourceBackedRecipe(signed).shelf, 'A');
  assert.equal(classifySourceBackedRecipe(trial).shelf, 'B');
  assert.equal(classifySourceBackedRecipe(archive).shelf, 'C');
  assert.notEqual(classifySourceBackedRecipe(signed).shelf, classifySourceBackedRecipe(trial).shelf);
});

test('reports missing trial contracts instead of inventing values', () => {
  const trial = catalog.recipes.find(recipe => recipe.status === 'recipe_fact_checked' && recipe.fixed_batch && recipe.cooking_sequence?.length && !recipe.liquid_contract);
  const classified = classifySourceBackedRecipe(trial);

  assert.equal(classified.shelf, 'B');
  assert.ok(classified.missing_contracts.includes('liquid_contract'));
  assert.equal(classified.liquid_contract, null);
});

test('turns declared safety endpoints into traceable user notes', () => {
  const poultry = catalog.recipes.find(recipe => (recipe.safety_endpoints || []).some(endpoint => endpoint.code === 'poultry_fully_cooked'));
  const classified = classifySourceBackedRecipe(poultry);

  assert.ok(classified.safety_notes.some(note => /禽肉/.test(note) && /74/.test(note)));
  assert.ok(classified.safety_source_ids.includes('S-SAFETY-TEMPERATURES-1'));
});

test('only reports a missing safety contract when raw high-risk ingredients require one', () => {
  const lowRisk = classifySourceBackedRecipe({
    recipe_id: 'fixture-low-risk-shelf', status: 'recipe_fact_checked', canonical_name: '南瓜蘑菇饭',
    core_ingredients: ['米', '南瓜', '蘑菇'], fixed_batch: { ingredients: [{ name: '米' }] },
    cooking_sequence: [{ step: 1, instruction: '同锅煮熟' }], safety_endpoints: [], source_refs: [],
  });
  const highRisk = classifySourceBackedRecipe({
    recipe_id: 'fixture-high-risk-shelf', status: 'recipe_fact_checked', canonical_name: '生蚝饭',
    core_ingredients: ['米', '生蚝'], fixed_batch: { ingredients: [{ name: '米' }] },
    cooking_sequence: [{ step: 1, instruction: '同锅煮熟' }], safety_endpoints: [], source_refs: [],
  });
  const stockOnly = classifySourceBackedRecipe({
    recipe_id: 'fixture-stock-only-shelf', status: 'recipe_fact_checked', canonical_name: '高汤烩饭',
    core_ingredients: ['米', '鸡汤'], fixed_batch: { ingredients: [{ name: '米' }] },
    cooking_sequence: [{ step: 1, instruction: '同锅煮熟' }], safety_endpoints: [], source_refs: [],
  });

  assert.equal(lowRisk.missing_contracts.includes('safety_endpoints'), false);
  assert.equal(highRisk.missing_contracts.includes('safety_endpoints'), true);
  assert.equal(stockOnly.safety_notes.some(note => /禽肉或禽类食材/.test(note)), false);
});

test('does not mislabel burdock as beef or egg as poultry', () => {
  const burdock = classifySourceBackedRecipe({
    recipe_id: 'fixture-burdock', status: 'recipe_fact_checked', canonical_name: '牛蒡炊饭',
    core_ingredients: ['米', '牛蒡'], fixed_batch: { ingredients: [{ name: '米' }] },
    cooking_sequence: [{ step: 1, instruction: '同锅煮熟' }], safety_endpoints: [], source_refs: [],
  });
  const egg = classifySourceBackedRecipe({
    recipe_id: 'fixture-egg', status: 'recipe_fact_checked', canonical_name: '虾仁鸡蛋饭',
    core_ingredients: ['米', '有头虾', '鸡蛋'], fixed_batch: { ingredients: [{ name: '米' }] },
    cooking_sequence: [{ step: 1, instruction: '同锅煮熟' }], safety_endpoints: [], source_refs: [],
  });

  assert.equal(burdock.safety_notes.some(note => note.includes('牛肉')), false);
  assert.equal(egg.safety_notes.some(note => note.includes('禽肉或禽类食材')), false);
  assert.equal(egg.safety_notes.some(note => note.includes('蛋类')), true);
});

test('treats fish sauce as a seasoning instead of a fish ingredient warning', () => {
  const classified = classifySourceBackedRecipe({
    recipe_id: 'fixture-fish-sauce', status: 'recipe_fact_checked', canonical_name: '鱼露鸡饭',
    core_ingredients: ['米', '鸡肉', '鱼露'],
    fixed_batch: { ingredients: [{ name: '米' }] },
    cooking_sequence: [{ step: 1, instruction: '同锅煮熟' }],
    safety_endpoints: [{ code: 'poultry_fully_cooked', source_ids: [] }], source_refs: [],
  });

  assert.equal(classified.safety_notes.some(note => /鱼类或海鲜|海鲜/.test(note)), false);
});

test('catalog preserves all records and exposes the expected non-overlapping counts', () => {
  const shelf = buildShelfCatalog(catalog);

  assert.equal(shelf.catalog_version, catalog.catalog_version);
  assert.equal(shelf.records.length, 923);
  assert.deepEqual(shelf.summary, { A: 36, B: 343, C: 544, trial_ready_total: 379 });
  assert.equal(new Set(shelf.records.map(record => record.recipe_id)).size, shelf.records.length);
});

test('every research record gets a visible method card without changing the production shelf', () => {
  const shelf = buildShelfCatalog(catalog);

  assert.deepEqual(shelf.method_coverage, {
    total: 923,
    source_complete: 138,
    source_partial_with_draft: 738,
    draft_estimated: 36,
    identity_only_draft: 11,
    estimated_cards: 785,
    cards_with_quantities: 923,
    cards_with_liquid_guidance: 923,
    cards_with_time: 923,
    cards_with_steps: 923,
    complete_research_cards: 923,
    complete_unblocked_research_cards: 922,
    blocked_cards: 1,
    cards_with_source_quantity_hints: 624,
    cards_with_source_process_hints: 843,
    cards_with_source_time_hints: 285,
  });
  const sourceComplete = shelf.records.find(record => record.recipe_id === 'philips-cantonese-cured-rice');
  assert.equal(sourceComplete.research_method.status, 'source_complete');
  assert.ok(sourceComplete.research_method.ingredients.every(item => item.provenance === 'source'));
  assert.ok(sourceComplete.research_method.steps.every(step => step.provenance === 'source'));

  const partial = shelf.records.find(record => record.recipe_id === 'nanjing-aijiaohuang-duck-rice');
  assert.equal(partial.research_method.status, 'source_partial_with_draft');
  assert.ok(partial.research_method.ingredients.some(item => item.provenance === 'estimated'));
  assert.ok(partial.research_method.steps.some(step => step.provenance === 'source'));

  const rangedBatch = shelf.records.find(record => record.recipe_id === 'zojirushi-fresh-vegetable-bamboo-rice');
  assert.equal(rangedBatch.research_method.servings.provenance, 'estimated');
  assert.match(rangedBatch.research_method.servings_source_hint.text, /4~5人份/u);

  const processFragmentDraft = shelf.records.find(record => record.recipe_id === 'yongchun-pork-rib-salted-rice');
  assert.equal(processFragmentDraft.research_method.status, 'source_partial_with_draft');
  assert.ok(processFragmentDraft.research_method.ingredients.length > 0);
  assert.ok(processFragmentDraft.research_method.steps.some(step => step.provenance === 'source'));
});

test('an exact single-version source contract is not downgraded by unrelated core-name hints', () => {
  const shelf = buildShelfCatalog(catalog);
  const record = shelf.records.find(item => item.recipe_id === 'cantonese-mushroom-chicken-claypot-rice');
  assert.equal(record.research_method.status, 'source_complete');
  assert.ok(record.research_method.ingredients.every(item => item.provenance === 'source'));
});

test('a complete three-step source contract is not downgraded by a synthetic fourth step', () => {
  const shelf = buildShelfCatalog(catalog);
  const record = shelf.records.find(item => item.recipe_id === 'tiger-whitefish-mixed-rice');
  assert.equal(record.research_method.status, 'source_complete');
  assert.equal(record.research_method.steps.length, 3);
  assert.ok(record.research_method.steps.every(step => step.provenance === 'source'));
});
