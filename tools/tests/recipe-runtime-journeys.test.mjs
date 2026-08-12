import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const productionRuntime = JSON.parse(fs.readFileSync(
  new URL('../data/recipe-runtime.v1.json', import.meta.url),
  'utf8',
));
const productionRecipes = JSON.parse(fs.readFileSync(
  new URL('../data/recipe-library.json', import.meta.url),
  'utf8',
));
const journeyRunner = await import('../run-pantry-planner-v2-journeys.mjs');

test('production catalog remains an honest six-entry planned-only boundary', () => {
  assert.equal(productionRecipes.recipes.length, 72);
  assert.equal(productionRuntime.entries.length, 6);
  assert.deepEqual(
    [...new Set(productionRuntime.entries.map(entry => entry.activation_status))],
    ['planned'],
  );
  assert.ok(productionRuntime.entries.every(entry => entry.household_trial === null));
  assert.ok(productionRuntime.entries.every(entry => entry.ratio_default_rule_id === null));
});

test('dedicated recipe-runtime fixture exercises the Task 7 journey matrix with zero DeepSeek', async () => {
  assert.equal(
    typeof journeyRunner.runRecipeRuntimeJourneys,
    'function',
    'Task 7 requires a dedicated fixture runner; production assets must stay planned-only',
  );

  const result = await journeyRunner.runRecipeRuntimeJourneys();
  assert.deepEqual(result, {
    passed: 17,
    total: 17,
    plan_deepseek_calls: 0,
    generate_deepseek_calls: 0,
    production_runtime_preview_enabled: 0,
    production_recipe_count: 72,
  });
});
