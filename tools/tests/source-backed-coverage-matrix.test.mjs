import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildSourceBackedCoverageMatrix,
  validateSourceBackedCoverageMatrix,
} from '../lib/source-backed-coverage-matrix.mjs';

const readJson = name => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const sourceCatalog = readJson('source-backed-one-pot-recipes.v1.json');
const executionLibrary = readJson('source-backed-execution-library.v1.json');
const formalizationLedger = readJson('source-backed-formalization-ledger.v1.json');
const formalReview = readJson('source-backed-formal-candidate-review.v1.json');
const formalStaging = readJson('source-backed-formal-staging.v1.json');
const formalRecipeLibrary = readJson('recipe-library.json');
const runtimeJourneys = readJson('recipe-runtime-journeys.v1.json');
const riceMealJourneys = readJson('rice-meal-journeys.v1.json');
const directRecommendShadow = readJson('direct-recommend-shadow-v1.json');
const ratioEvidence = readJson('source-backed-formal-ratio-evidence.v1.json');

const inputs = {
  sourceCatalog,
  executionLibrary,
  formalizationLedger,
  formalReview,
  formalStaging,
  formalRecipeLibrary,
  runtimeJourneys,
  riceMealJourneys,
  directRecommendShadow,
  ratioEvidence,
};

test('coverage matrix covers every source recipe and separates P0-P3 from safety blocking', () => {
  const matrix = buildSourceBackedCoverageMatrix(inputs);

  assert.equal(matrix.schema_version, 1);
  assert.equal(matrix.source_catalog_version, sourceCatalog.catalog_version);
  assert.equal(matrix.counts.total, 923);
  assert.deepEqual(matrix.counts.priority, { P0: 138, P1: 738, P2: 36, P3: 11 });
  assert.equal(matrix.counts.safety_blocked, 1);
  assert.equal(matrix.records.length, 923);
  assert.equal(new Set(matrix.records.map(row => row.recipe_id)).size, 923);

  for (const row of matrix.records) {
    assert.match(row.priority, /^P[0-3]$/u);
    assert.equal(typeof row.safety_blocked, 'boolean');
    assert.ok(row.source.status);
    assert.ok(row.execution.status);
    assert.ok(row.formal.status);
    assert.ok(row.kitchen.status);
    assert.ok(row.journey.status);
    assert.ok(Array.isArray(row.gap_codes));
    assert.ok(row.next_action);
  }

  const pufferfish = matrix.records.find(row => row.recipe_id === 'yangzhong-pufferfish-eight-pot-rice');
  assert.equal(pufferfish.priority, 'P2');
  assert.equal(pufferfish.safety_blocked, true);
  assert.ok(pufferfish.gap_codes.includes('safety_blocked'));
  assert.equal(pufferfish.kitchen.status, 'blocked');
  assert.equal(pufferfish.journey.status, 'blocked');

  const philips = matrix.records.find(row => row.recipe_id === 'philips-cantonese-cured-rice');
  assert.equal(philips.priority, 'P0');
  assert.equal(philips.source.contract_status, 'complete');
  assert.equal(philips.execution.status, 'source_complete');
  assert.equal(philips.formal.status, 'preview_candidate');
  assert.equal(philips.kitchen.status, 'pending');
  assert.equal(philips.journey.status, 'pending');
  assert.ok(philips.gap_codes.includes('ratio_dsl'));
  assert.ok(philips.gap_codes.includes('kitchen_observed'));
  assert.ok(philips.gap_codes.includes('journey_coverage'));
});

test('coverage matrix aggregates product-path contracts without promoting source cards', () => {
  const matrix = buildSourceBackedCoverageMatrix(inputs);

  assert.deepEqual(matrix.product_paths.map(path => path.path_id), [
    'give_me_one',
    'must_use_ingredients',
    'today_what_to_eat',
    'clear_pantry',
  ]);

  const giveMeOne = matrix.product_paths.find(path => path.path_id === 'give_me_one');
  assert.equal(giveMeOne.formal_recipe_count, 72);
  assert.equal(giveMeOne.formal_approved_count, 12);
  assert.equal(giveMeOne.formal_auto_approved_count, 60);
  assert.equal(giveMeOne.source_card_eligible_count, 0);
  assert.ok(giveMeOne.blocker_counts.kitchen_observed >= 1);

  const mustUse = matrix.product_paths.find(path => path.path_id === 'must_use_ingredients');
  assert.equal(mustUse.coverage_status, 'not_covered');
  assert.ok(mustUse.blocker_counts.must_use_runtime_contract >= 1);

  const today = matrix.product_paths.find(path => path.path_id === 'today_what_to_eat');
  assert.equal(today.coverage_status, 'partial');
  assert.equal(today.evidence.direct_recommend_shadow_cases, 30);
  assert.equal(today.evidence.rice_meal_journey_cases, 54);

  const clearPantry = matrix.product_paths.find(path => path.path_id === 'clear_pantry');
  assert.equal(clearPantry.coverage_status, 'not_covered');
  assert.ok(clearPantry.blocker_counts.quantity_allocation >= 1);
  assert.ok(clearPantry.blocker_counts.multi_meal_state >= 1);

  const overlap = matrix.records.find(row => row.recipe_id === 'shanghai-salted-pork-vegetable-rice');
  assert.equal(overlap.formal.library_match, true);
  assert.equal(overlap.formal.planner_status, 'not_in_formal_72');
  assert.equal(overlap.product_paths.give_me_one.status, 'library_overlap_not_promoted');
});

test('coverage matrix reports source/execution/formal/kitchen/journey aggregations and validates deterministically', () => {
  const matrix = buildSourceBackedCoverageMatrix(inputs);

  assert.deepEqual(matrix.aggregates.execution_status, {
    source_complete: 138,
    source_partial_with_draft: 738,
    draft_estimated: 36,
    identity_only_draft: 11,
  });
  assert.deepEqual(matrix.aggregates.formal_status, {
    preview_candidate: 34,
    blocked: 889,
  });
  assert.deepEqual(matrix.aggregates.kitchen_status, { pending: 922, blocked: 1 });
  assert.deepEqual(matrix.aggregates.journey_status, { pending: 922, blocked: 1 });
  assert.equal(matrix.aggregates.journey_evidence_recipe_count, 16);
  assert.equal(matrix.aggregates.ratio_evidence_count, 132);
  assert.deepEqual(validateSourceBackedCoverageMatrix(matrix, inputs), []);

  const broken = structuredClone(matrix);
  broken.records.pop();
  assert.match(validateSourceBackedCoverageMatrix(broken, inputs).join('\n'), /records must cover every source recipe/u);
});

