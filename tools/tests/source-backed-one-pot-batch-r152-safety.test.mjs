import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

test('r152 closes the Macau fresh-scallop safety gap with the existing visual shellfish endpoint', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r201');
  assert.equal(catalog.recipes.length, 923);
  const recipe = catalog.recipes.find(({ recipe_id: id }) => id === 'macau-scallop-mushroom-vegetable-rice');
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.safety_endpoints, [{
    code: 'shellfish_fully_cooked',
    visual_endpoint: '肉质呈珍珠白或白色且不透明',
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  const safetySource = recipe.source_refs.find(({ source_id: id }) => id === 'S-SAFETY-TEMPERATURES-1');
  assert.ok(safetySource);
  assert.deepEqual(safetySource.claim_scopes, ['safety']);
  assert.equal(safetySource.url, safetyUrl);
  assert.equal(safetySource.access_status, 'opened');
  assert.equal(safetySource.evidence_tier, 1);
  assert.match(safetySource.evidence_locator, /scallop|shellfish|珍珠白|白色且不透明/u);
});

test('r152 preserves the ordinary-pot staged process and does not alter other safety-gap decisions', () => {
  const recipe = catalog.recipes.find(({ recipe_id: id }) => id === 'macau-scallop-mushroom-vegetable-rice');
  assert.ok(recipe);
  assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
  assert.match(recipe.cooker_adaptation.notes, /普通锅|电饭煲|水位|分钟/u);
  assert.match(recipe.cooking_sequence[0].instruction, /一半鸡汤|白菜|磨菇/u);
  assert.match(recipe.cooking_sequence[1].instruction, /饭滚|带子|白饭熟透/u);

  for (const id of [
    'taiwan-saffron-seafood-rice',
    'yutian-electric-cooker-lamb-pilaf',
    'panasonic-tokyo-seafood-pilaf',
  ]) {
    const other = catalog.recipes.find(({ recipe_id: recipeId }) => recipeId === id);
    assert.ok(other, `missing ${id}`);
    assert.deepEqual(other.safety_endpoints, [], `${id} must remain blocked in r155`);
  }
});
