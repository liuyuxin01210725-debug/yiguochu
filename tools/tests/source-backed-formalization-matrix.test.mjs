import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildSourceBackedFormalizationMatrix,
  validateSourceBackedFormalizationMatrix,
} from '../lib/source-backed-formalization-matrix.mjs';

const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const inputs = {
  sourceCatalog: readJson('source-backed-one-pot-recipes.v1.json'),
  executionLibrary: readJson('source-backed-execution-library.v1.json'),
  formalizationLedger: readJson('source-backed-formalization-ledger.v1.json'),
  formalReview: readJson('source-backed-formal-candidate-review.v1.json'),
  formalStaging: readJson('source-backed-formal-staging.v1.json'),
  formalRecipeLibrary: readJson('recipe-library.json'),
  runtimeJourneys: readJson('recipe-runtime-journeys.v1.json'),
  riceMealJourneys: readJson('rice-meal-journeys.v1.json'),
  directRecommendShadow: readJson('direct-recommend-shadow-v1.json'),
  ratioEvidence: readJson('source-backed-formal-ratio-evidence.v1.json'),
};

test('formalization matrix is the canonical 923-row source/formalization projection', () => {
  const matrix = buildSourceBackedFormalizationMatrix(inputs);
  assert.equal(matrix.scope, 'source-backed-formalization-matrix');
  assert.equal(matrix.formalization_matrix_version, 'source-backed-formalization-matrix-v1-20260813-c3');
  assert.equal(matrix.records.length, 923);
  assert.equal(matrix.counts.total, 923);
  assert.equal(matrix.aggregates.journey_evidence_recipe_count, 1);
  assert.equal(matrix.aggregates.journey_evidence_count, 9);
  assert.ok(matrix.records.every(record => record.joins));
  assert.ok(matrix.records.every(record => record.joins.execution.status === 'ok'));
  assert.ok(matrix.records.every(record => record.joins.formal_review.status === 'ok'));
});

test('formalization matrix validation is deterministic and rejects stale scope', () => {
  const matrix = buildSourceBackedFormalizationMatrix(inputs);
  assert.deepEqual(validateSourceBackedFormalizationMatrix(matrix, inputs), []);
  const broken = structuredClone(matrix);
  broken.records[0].joins.execution.status = 'invalid';
  assert.match(
    validateSourceBackedFormalizationMatrix(broken, inputs).join('\n'),
    /does not match deterministic build/u,
  );
});
