import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

const expected = [
  ['panasonic-carrot-pilaf-mj-l600', 'にんじんピラフ', 'recipe_fact_checked'],
  ['towngas-fresh-pineapple-chicken-multigrain-rice', '鲜菠萝鸡肉高纤多谷饭', 'recipe_fact_checked'],
  ['towngas-asparagus-shrimp-quinoa-rice', '芦笋虾仁藜麦饭', 'recipe_fact_checked'],
  ['towngas-nest-egg-minced-beef-rice', '窝蛋牛肉饭', 'recipe_fact_checked'],
];

test('r83 registers four directly sourced named one-pot candidates without promotion', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260807-national-r112');
  assert.equal(catalog.recipes.length, 849);
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
  assert.equal(counts.recipe_fact_checked.length, 724);
  assert.equal(counts.identity_verified.length, 96);
  assert.equal(counts.executable.length, 12);
  assert.equal(counts.discovered.length, 17);
});

test('r83 preserves appliance and safety boundaries from each source', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

  const carrot = byId.get('panasonic-carrot-pilaf-mj-l600');
  assert.equal(carrot.fixed_batch.servings, 4);
  assert.equal(carrot.liquid_contract.kind, 'waterline');
  assert.equal(carrot.time_contract, null);
  assert.equal(carrot.safety_endpoints.length, 0);
  assert.match(carrot.evidence_notes, /榨渣|胡萝卜丁|不/u);

  const pineapple = byId.get('towngas-fresh-pineapple-chicken-multigrain-rice');
  assert.equal(pineapple.fixed_batch, null);
  assert.equal(pineapple.time_contract.total_minutes, 45);
  assert.equal(pineapple.safety_endpoints.length, 0);
  assert.match(pineapple.cooking_sequence.map(step => step.instruction).join(' '), /菠萝|末段|中途/u);

  const shrimp = byId.get('towngas-asparagus-shrimp-quinoa-rice');
  assert.equal(shrimp.fixed_batch, null);
  assert.equal(shrimp.time_contract.total_minutes, 30);
  assert.equal(shrimp.safety_endpoints.length, 0);
  assert.match(shrimp.cooking_sequence.map(step => step.instruction).join(' '), /虾|芦笋|中途/u);

  const eggBeef = byId.get('towngas-nest-egg-minced-beef-rice');
  assert.equal(eggBeef.fixed_batch, null);
  assert.equal(eggBeef.time_contract.total_minutes, 35);
  assert.equal(eggBeef.safety_endpoints.length, 0);
  assert.match(eggBeef.cooking_sequence.map(step => step.instruction).join(' '), /熄火|鸡蛋|焗/u);
  assert.match(eggBeef.evidence_notes, /无蔬菜|两类/u);
});
