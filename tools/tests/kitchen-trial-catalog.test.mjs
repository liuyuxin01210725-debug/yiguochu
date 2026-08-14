import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildKitchenTrialCatalog,
  validateKitchenTrialCatalog,
} from '../lib/kitchen-trial-catalog.mjs';

const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const inputs = {
  sourceCatalog: readJson('source-backed-one-pot-recipes.v1.json'),
  executionLibrary: readJson('source-backed-execution-library.v1.json'),
  formalizationLedger: readJson('source-backed-formalization-ledger.v1.json'),
  formalReview: readJson('source-backed-formal-candidate-review.v1.json'),
};

test('trial catalog keeps source candidates shadow-only until every runtime contract is closed', () => {
  const catalog = buildKitchenTrialCatalog(inputs);
  assert.equal(catalog.scope, 'kitchen-trial-catalog');
  assert.equal(catalog.kitchen_trial_catalog_version, 'kitchen-trial-catalog-v1-20260813-c13');
  assert.equal(catalog.counts.total, 34);
  assert.equal(catalog.counts.trial_eligible, 0);
  assert.ok(catalog.entries.every(entry => entry.trial_eligible === false));
  assert.ok(catalog.entries.every(entry => entry.eligibility_reasons.includes('equipment_contract_missing')));
  assert.ok(catalog.entries.every(entry => entry.planner_runtime_eligible === false));
  assert.ok(catalog.entries.every(entry => entry.production_approved === false));
  const tiger = catalog.entries.find(entry => entry.recipe_id === 'tiger-chicken-bamboo-rice');
  assert.ok(tiger);
  assert.match(tiger.source_catalog_ref, /^source-backed-one-pot-v1-/u);
  assert.match(tiger.execution_card_ref, /^source-backed-execution-/u);
  assert.match(tiger.formalization_ref, /^source-backed-formalization-/u);
  assert.deepEqual(tiger.required_safety_endpoint_codes, ['poultry_fully_cooked']);
  assert.equal(tiger.candidate_id, tiger.recipe_id);
  assert.equal(tiger.variant_id, null);
  assert.ok(Object.values(tiger.contract_hashes).every(value => /^[a-f0-9]{64}$/u.test(value)));
});

test('trial catalog validation is deterministic and rejects authority escalation', () => {
  const catalog = buildKitchenTrialCatalog(inputs);
  assert.deepEqual(validateKitchenTrialCatalog(catalog, inputs), []);
  const broken = structuredClone(catalog);
  broken.entries[0].planner_runtime_eligible = true;
  assert.match(validateKitchenTrialCatalog(broken, inputs).join('\n'), /planner_runtime_eligible must be false/u);
});

test('trial catalog fails closed when a source/execution/formal join is missing', () => {
  const brokenInputs = structuredClone(inputs);
  brokenInputs.executionLibrary.entries = brokenInputs.executionLibrary.entries.filter(entry => entry.recipe_id !== 'tiger-chicken-bamboo-rice');
  const catalog = buildKitchenTrialCatalog(brokenInputs);
  const missing = catalog.entries.find(entry => entry.recipe_id === 'tiger-chicken-bamboo-rice');
  assert.equal(missing.trial_eligible, false);
});
