import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

test('r216 closes the documented clam shell-opening endpoint for Tatung Fukagawa rice', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r218');
  const recipe = byId['tatung-fukagawa-rice'];
  assert.equal(recipe.safety_endpoints.length, 1);
  assert.equal(recipe.safety_endpoints[0].code, 'shellfish_fully_cooked');
  assert.match(recipe.safety_endpoints[0].visual_endpoint, /贝壳打开/);
  assert.deepEqual(recipe.safety_endpoints[0].source_ids, ['S-SAFETY-TEMPERATURES-1']);
  assert.ok(recipe.source_refs.some((source) => source.source_id === 'S-SAFETY-TEMPERATURES-1'));
});
