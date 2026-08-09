import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

test('r255 closes the official Hong Kong pumpkin seafood page without changing the canonical count', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r255');
  assert.equal(catalog.recipes.length, 923);

  const recipe = byId.get('r100-hk-pumpkin-seafood-brown-rice');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.fixed_batch?.servings, 1);
  assert.equal(recipe?.fixed_batch?.ingredients?.find((item) => item.name === '南瓜')?.amount.value, 800);
  assert.equal(recipe?.fixed_batch?.ingredients?.find((item) => item.name === '清鱼汤')?.amount.value, 5);
  assert.equal(recipe?.cooking_sequence?.length, 6);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.equal(recipe?.safety_endpoints?.length, 0);
  assert.notEqual(recipe?.status, 'executable');
  const htmlSource = recipe?.source_refs?.find((source) => source.source_id === 'S-R100-HK-PUMPKIN-SEAFOOD-BROWN-RICE-HTML-1');
  assert.equal(htmlSource?.access_status, 'opened');
  assert.ok(htmlSource?.claim_scopes?.includes('quantity'));
  assert.ok(htmlSource?.claim_scopes?.includes('process'));
});
test('r255 confirms the six AFA PDF records are menu identities only', () => {
  const ids = [
    'afa-douchi-pork-steamed-rice',
    'afa-japanese-chestnut-rice',
    'afa-sesame-oil-chicken-rice',
    'afa-garlic-fresh-fish-rice',
    'afa-tomato-pork-rice',
    'afa-beef-rice',
  ];
  for (const id of ids) {
    const recipe = byId.get(id);
    assert.equal(recipe?.status, 'discovered', id);
    const source = recipe?.source_refs?.[0];
    assert.equal(source?.access_status, 'opened', id);
    assert.deepEqual(source?.claim_scopes, ['identity'], id);
    assert.match(source?.evidence_locator ?? '', /课程表|菜单/u, id);
    assert.equal(recipe?.fixed_batch, null, id);
    assert.equal(recipe?.cooking_sequence?.length, 0, id);
  }
});
