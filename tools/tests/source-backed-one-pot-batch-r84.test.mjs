import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

const expected = [
  ['maff-chicken-shiitake-chinese-steamed-rice', '鶏肉と椎茸の中華風蒸しご飯', 'recipe_fact_checked'],
  ['wansheng-potato-green-bean-kongfan', '万盛箜饭', 'identity_verified'],
];

test('r84 registers two new directly sourced named candidates without promotion', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r226');
  assert.equal(catalog.recipes.length, 923);
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.equal(recipe?.identity_status, 'verified', recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }

  const counts = Object.groupBy(catalog.recipes, recipe => recipe.status);
  assert.equal(counts.recipe_fact_checked.length, 771);
  assert.equal(counts.identity_verified.length, 99);
  assert.equal(counts.executable.length, 36);
  assert.equal(counts.discovered.length, 17);
});

test('r84 preserves vessel, safety, and identity-only boundaries', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

  const steamed = byId.get('maff-chicken-shiitake-chinese-steamed-rice');
  assert.equal(steamed.fixed_batch.servings, 2);
  assert.equal(steamed.liquid_contract.amount.value, 240);
  assert.equal(steamed.time_contract, null);
  assert.equal(steamed.safety_endpoints.length, 0);
  assert.equal(steamed.cooker_adaptation.status, 'not_adapted');

  const wansheng = byId.get('wansheng-potato-green-bean-kongfan');
  assert.deepEqual(wansheng.core_ingredients, ['洋芋', '四季豆']);
  assert.deepEqual(wansheng.cooking_sequence, []);
  assert.equal(wansheng.fixed_batch, null);
  assert.equal(wansheng.liquid_contract, null);
  assert.match(wansheng.evidence_notes, /身份|不补写|米/u);
});
