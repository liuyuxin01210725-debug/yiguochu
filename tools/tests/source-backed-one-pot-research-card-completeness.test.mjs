import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildShelfCatalog } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('all 923 research cards expose quantities, liquid guidance, time and usable steps', () => {
  const shelf = buildShelfCatalog(catalog);
  assert.equal(shelf.records.length, 923);
  assert.equal(shelf.method_coverage.total, 923);

  for (const record of shelf.records) {
    const method = record.research_method;
    assert.ok(method, record.recipe_id);
    assert.ok(Array.isArray(method.ingredients) && method.ingredients.length > 0, record.recipe_id);
    assert.ok(method.ingredients.every((ingredient) => ingredient.amount && Number.isFinite(ingredient.amount.value) && ingredient.amount.unit), record.recipe_id);
    assert.ok(
      method.liquid?.amount || method.liquid?.research_starting_point || method.liquid?.waterline,
      record.recipe_id,
    );
    assert.ok(method.time?.total_minutes || method.time?.range, record.recipe_id);
    assert.ok(Array.isArray(method.steps) && method.steps.length >= 3, record.recipe_id);
    assert.ok(method.steps.every((step) => typeof step.instruction === 'string' && step.instruction.length > 0), record.recipe_id);
  }
});
