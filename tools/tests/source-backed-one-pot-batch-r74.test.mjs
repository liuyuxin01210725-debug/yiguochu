import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

const expected = [
  ['zojirushi-chesapeake-crab-carrot-rice', 'Chesapeake Crab Carrot Rice', 'recipe_fact_checked'],
  ['zojirushi-pad-thai-shrimp-mixed-rice', 'Pad Thai Shrimp Mixed Rice', 'recipe_fact_checked'],
  ['shanghai-hongkou-chestnut-sausage-rice', '板栗焖饭', 'recipe_fact_checked'],
  ['kinmen-dried-oyster-pumpkin-rice', '蚵乾金瓜飯', 'recipe_fact_checked'],
  ['qianjiang-xiadao-guoba-rice', '虾稻米锅巴饭', 'identity_verified'],
  ['tongcheng-cured-meat-pot-crust-rice', '腊味锅巴饭', 'identity_verified'],
];

test('r74 records direct vendor, institution, and regional candidates without promotion', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r227');
  assert.equal(catalog.recipes.length, 923);
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.equal(recipe?.identity_status, 'verified', recipeId);
    assert.ok(recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.evidence_locator === 'string' && source.evidence_locator.length > 0), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.attribution === 'string' && source.attribution.length > 0), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.license === 'string' && source.license.length > 0), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients) && recipe.core_ingredients.length >= 2, recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r74 keeps recipe boundaries and does not fabricate missing contracts', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.match(byId.get('zojirushi-chesapeake-crab-carrot-rice')?.evidence_notes ?? '', /蟹|胡萝卜|Mixed|出锅|机型/);
  assert.match(byId.get('zojirushi-pad-thai-shrimp-mixed-rice')?.evidence_notes ?? '', /虾|分锅|生虾|出锅|机型/);
  assert.match(byId.get('shanghai-hongkou-chestnut-sausage-rice')?.evidence_notes ?? '', /上海|板栗|腊肠|预炒|电饭煲/);
  assert.match(byId.get('kinmen-dried-oyster-pumpkin-rice')?.evidence_notes ?? '', /金门|蚵乾|南瓜|预炒|外锅水/);
  assert.match(byId.get('qianjiang-xiadao-guoba-rice')?.evidence_notes ?? '', /潜江|虾稻米|身份|不推断/);
  assert.match(byId.get('tongcheng-cured-meat-pot-crust-rice')?.evidence_notes ?? '', /桐城|腊味|身份|不展开/);
  assert.equal(byId.get('qianjiang-xiadao-guoba-rice')?.fixed_batch, null);
  assert.equal(byId.get('tongcheng-cured-meat-pot-crust-rice')?.fixed_batch, null);
});
