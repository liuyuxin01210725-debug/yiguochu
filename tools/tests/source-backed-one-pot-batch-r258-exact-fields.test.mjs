import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

test('r258 closes four exact same-source time and waterline fields without adding recipes', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);

  for (const [recipeId, minutes, sourceId] of [
    ['r60-tiger-chicken-brown-rice-soup', 120, 'S-TIGER-CHICKEN-BROWN-RICE-SOUP-R60'],
    ['tiger-tuscan-bean-brown-rice-soup', 75, 'S-TIGER-TUSCAN-BEAN-BROWN-RICE-SOUP-1'],
  ]) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe, recipeId);
    assert.deepEqual(recipe.time_contract, { total_minutes: minutes, source_ids: [sourceId] }, recipeId);
    const source = recipe.source_refs.find((item) => item.source_id === sourceId);
    assert.ok(source, recipeId);
    assert.ok(source.claim_scopes.includes('time'), recipeId);
  }

  const corn = byId.get('panasonic-corn-rice-shimamoto');
  assert.deepEqual(corn.liquid_contract, {
    kind: 'waterline',
    waterline: {
      appliance_model: 'Panasonic Cooking页面所述电饭煲',
      scale: 'white_rice',
      mark: '2合',
    },
    source_ids: ['S-R67-PANASONIC-CORN-RICE'],
  });

  const meatballs = byId.get('tiger-chicken-meatballs-grated-daikon');
  assert.deepEqual(meatballs.liquid_contract, {
    kind: 'waterline',
    waterline: {
      appliance_model: 'Tiger Tacook电饭煲（页面列示的3杯机型）',
      scale: 'white_rice',
      mark: '页面机型内锅水位线',
    },
    source_ids: ['S-R102-TIGER-CHICKEN-MEATBALLS-DAIKON-1'],
  });
});

test('r258 preserves source boundaries and does not promote the four records', () => {
  for (const recipeId of [
    'r60-tiger-chicken-brown-rice-soup',
    'tiger-tuscan-bean-brown-rice-soup',
    'panasonic-corn-rice-shimamoto',
    'tiger-chicken-meatballs-grated-daikon',
  ]) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
    assert.ok(recipe.source_refs.length > 0, recipeId);
  }
  assert.equal(byId.get('r60-tiger-chicken-brown-rice-soup').safety_endpoints.length, 1);
  assert.equal(byId.get('tiger-chicken-meatballs-grated-daikon').cooker_adaptation.status, 'source_limited');
});
