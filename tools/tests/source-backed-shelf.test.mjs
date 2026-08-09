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
  assert.deepEqual(shelf.summary, { A: 36, B: 285, C: 602, trial_ready_total: 321 });
  assert.equal(new Set(shelf.records.map(record => record.recipe_id)).size, shelf.records.length);
});
