import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildRuntimeCoverageMatrix,
  validateRuntimeCoverageMatrix,
} from '../lib/runtime-coverage-matrix.mjs';

const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const inputs = {
  runtimeJourneys: readJson('recipe-runtime-journeys.v1.json'),
  riceMealJourneys: readJson('rice-meal-journeys.v1.json'),
  directRecommendShadow: readJson('direct-recommend-shadow-v1.json'),
  formalRecipeLibrary: readJson('recipe-library.json'),
  riceMealCatalog: readJson('rice-meal-catalog.v1.json'),
};

test('runtime coverage matrix is scenario keyed and records contract expectations separately from observations', () => {
  const matrix = buildRuntimeCoverageMatrix(inputs);
  assert.equal(matrix.scope, 'runtime-coverage-matrix');
  assert.equal(matrix.runtime_coverage_matrix_version, 'runtime-coverage-matrix-v1-20260813-c5');
  assert.equal(matrix.counts.total, 101);
  assert.deepEqual(matrix.counts.by_source, {
    recipe_runtime: 17,
    rice_meal: 54,
    direct_recommend_shadow: 30,
  });
  assert.equal(new Set(matrix.scenarios.map(row => row.scenario_id)).size, 101);
  assert.ok(matrix.scenarios.every(row => row.observation.observed === false));
  assert.ok(matrix.scenarios.every(row => row.production_eligible === false));

  const tiger = matrix.scenarios.find(row => row.scenario_id === 'rice_meal:RM-344-source-tiger-pork-bamboo-rice');
  assert.deepEqual(tiger.request.pantry, ['五花肉', '竹笋']);
  assert.deepEqual(tiger.expected.candidate_refs.variant_ids, ['source-tiger-pork-bamboo-rice']);
  assert.equal(tiger.observation.hit.recipe_ids.length, 0);
  assert.equal(tiger.quantity.status, 'not_observed');
  assert.equal(tiger.liquid.status, 'not_observed');
  assert.equal(tiger.safety.status, 'not_observed');

  const titleMention = buildRuntimeCoverageMatrix({
    ...inputs,
    runtimeJourneys: {
      journeys: [{ id: 'RR-text', title: 'text has shanghai-salted-pork-vegetable-rice' }],
    },
    riceMealJourneys: { journeys: [] },
    directRecommendShadow: { journeys: [] },
  }).scenarios[0];
  assert.deepEqual(titleMention.expected.candidate_refs.recipe_ids, []);
  assert.equal(titleMention.joins.candidate_refs.status, 'none');
});

test('runtime coverage matrix rejects duplicate or missing scenario joins', () => {
  const matrix = buildRuntimeCoverageMatrix(inputs);
  assert.deepEqual(validateRuntimeCoverageMatrix(matrix, inputs), []);
  const broken = structuredClone(matrix);
  broken.scenarios[1].scenario_id = broken.scenarios[0].scenario_id;
  assert.match(validateRuntimeCoverageMatrix(broken, inputs).join('\n'), /duplicate scenario_id/u);
});
