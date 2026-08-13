import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildRuntimeOnePotCatalog,
  validateRuntimeOnePotCatalog,
} from '../lib/runtime-one-pot-catalog.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const readJson = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));

const inputs = {
  recipeLibrary: readJson('tools/data/recipe-library.json'),
  recipeRuntime: readJson('tools/data/recipe-runtime.v1.json'),
  actionProfiles: readJson('tools/data/recipe-action-profiles.v1.json'),
  ratios: readJson('tools/data/ratio-rules.v1.json'),
  taxonomy: readJson('tools/data/ingredient-taxonomy.v1.json'),
  sourceCatalog: readJson('tools/data/source-backed-one-pot-recipes.v1.json'),
  executionLibrary: readJson('tools/data/source-backed-execution-library.v1.json'),
  formalizationLedger: readJson('tools/data/source-backed-formalization-ledger.v1.json'),
  kitchenLedger: { schema_version: 'kitchen-observations.v1', observations: [] },
};

test('runtime catalog contains only trusted formal Planner recipes and retains release contracts', () => {
  const catalog = buildRuntimeOnePotCatalog(inputs);
  assert.equal(catalog.scope, 'runtime-one-pot-catalog');
  assert.equal(catalog.entries.length, 72);
  assert.equal(catalog.counts.planner_runtime_eligible, 72);
  assert.equal(catalog.counts.production_approved, 0);
  assert.equal(catalog.counts.kitchen_observed, 0);
  assert.ok(catalog.entries.every(entry => entry.planner_runtime_eligible === true));
  assert.ok(catalog.entries.every(entry => entry.source_summary?.source_recipe_id === entry.recipe_id || !entry.source_summary));
  assert.ok(catalog.entries.every(entry => entry.contract_hashes?.recipe_library));
});

test('runtime catalog rejects a research-only source card and stale contract hash', () => {
  const catalog = buildRuntimeOnePotCatalog(inputs);
  const first = catalog.entries[0];
  first.recipe_id = 'not-a-formal-recipe';
  assert.ok(validateRuntimeOnePotCatalog(catalog, inputs).some(error => /formal recipe|recipe_id/i.test(error)));
  const rebuilt = buildRuntimeOnePotCatalog(inputs);
  rebuilt.entries[0].contract_hashes.recipe_library = 'forged';
  assert.ok(validateRuntimeOnePotCatalog(rebuilt, inputs).some(error => /hash|deterministic/i.test(error)));
});

test('runtime catalog never grants production approval from an empty kitchen ledger', () => {
  const catalog = buildRuntimeOnePotCatalog(inputs);
  assert.ok(catalog.entries.every(entry => entry.production_approved === false));
  assert.equal(catalog.counts.production_approved, 0);
  assert.deepEqual(catalog.kitchen_observation_summary, { observations: 0, observed_recipe_ids: [] });
});
