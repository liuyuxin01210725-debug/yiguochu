import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DATA = new URL('../data/', import.meta.url);

function readJson(name) {
  return JSON.parse(fs.readFileSync(new URL(name, DATA), 'utf8'));
}

function indexByRecipe(rows) {
  return new Map(rows.map(row => [row.recipe_id || row.id, row]));
}

const CANDIDATE_IDS = Object.freeze([
  'tiger-chicken-bamboo-rice',
  'tiger-pork-bamboo-rice',
  'tiger-whitefish-mixed-rice',
  'tiger-shirasu-tomato-multigrain-rice',
  'tiger-mackerel-aromatic-barley-rice',
]);

const sourceCatalog = readJson('source-backed-one-pot-recipes.v1.json');
const executionLibrary = readJson('source-backed-execution-library.v1.json');
const formalizationLedger = readJson('source-backed-formalization-ledger.v1.json');
const formalReview = readJson('source-backed-formal-candidate-review.v1.json');
const formalStaging = readJson('source-backed-formal-staging.v1.json');
const ratioEvidence = readJson('source-backed-formal-ratio-evidence.v1.json');
const coverageMatrix = readJson('source-backed-coverage-matrix.v1.json');
const runtimeCatalog = readJson('source-backed-release-ledger.v1.json');
const formalRecipeLibrary = readJson('recipe-library.json');

const sourceByRecipe = indexByRecipe(sourceCatalog.recipes);
const executionByRecipe = indexByRecipe(executionLibrary.entries);
const ledgerByRecipe = indexByRecipe(formalizationLedger.records);
const reviewByRecipe = indexByRecipe(formalReview.records);
const stagingByRecipe = indexByRecipe(formalStaging.records);
const ratioByRecipe = indexByRecipe(ratioEvidence.entries);
const coverageByRecipe = indexByRecipe(coverageMatrix.records);
const runtimeByRecipe = indexByRecipe(runtimeCatalog.entries);
const formalIds = new Set(formalRecipeLibrary.recipes.map(recipe => recipe.id));

test('M1.3 batch 01 has exactly five source-complete, unblocked candidates', () => {
  assert.equal(CANDIDATE_IDS.length, 5);
  assert.equal(new Set(CANDIDATE_IDS).size, 5);

  for (const recipeId of CANDIDATE_IDS) {
    const source = sourceByRecipe.get(recipeId);
    const execution = executionByRecipe.get(recipeId);
    const ledger = ledgerByRecipe.get(recipeId);
    const review = reviewByRecipe.get(recipeId);
    const coverage = coverageByRecipe.get(recipeId);

    assert.ok(source, `${recipeId} must exist in source catalog`);
    assert.equal(execution?.method_card_status, 'source_complete', `${recipeId} must be source_complete`);
    assert.equal(ledger?.execution_readiness?.unblocked, true, `${recipeId} must be unblocked`);
    assert.equal(ledger?.formalization_status, 'preview_candidate', `${recipeId} must remain a preview candidate`);
    assert.equal(coverage?.priority, 'P0', `${recipeId} must remain in the P0 queue`);
    assert.equal(coverage?.safety_blocked, false, `${recipeId} must not be safety blocked`);
    assert.equal(review?.formalization_status ?? ledger?.formalization_status, 'preview_candidate');
  }
});

test('M1.3 batch 01 keeps Ratio evidence source-bounded and non-executable', () => {
  for (const recipeId of CANDIDATE_IDS) {
    const review = reviewByRecipe.get(recipeId);
    const evidence = ratioByRecipe.get(recipeId);

    assert.ok(evidence, `${recipeId} must have recipe-scoped Ratio evidence`);
    assert.equal(evidence.compile_status, 'source_bounded_non_executable');
    assert.equal(evidence.executable, false);
    assert.equal(review?.ratio_dsl?.status, 'source_bounded');
    assert.deepEqual(review?.ratio_dsl?.compiled_rule_ids, []);
    assert.ok(
      review?.ratio_dsl?.candidate_rule_ids?.includes(evidence.rule_id),
      `${recipeId} review must reference its evidence rule`,
    );
  }
});

test('M1.3 batch 01 cannot pass kitchen, journey, or production gates', () => {
  for (const recipeId of CANDIDATE_IDS) {
    const ledger = ledgerByRecipe.get(recipeId);
    const review = reviewByRecipe.get(recipeId);
    const staging = stagingByRecipe.get(recipeId);
    const coverage = coverageByRecipe.get(recipeId);
    const runtime = runtimeByRecipe.get(recipeId);

    assert.equal(review?.kitchen_observed?.status, 'pending');
    assert.deepEqual(review?.kitchen_observed?.evidence_ids, []);
    assert.equal(review?.journey_coverage?.status, 'pending');
    assert.deepEqual(review?.journey_coverage?.journey_ids, []);
    assert.equal(staging?.promotion_status, 'not_formal');
    assert.equal(staging?.formal_planner_status, 'not_in_formal_72');
    assert.equal(ledger?.formal_planner_status, 'not_in_formal_72');
    assert.equal(coverage?.formal?.planner_status, 'not_in_formal_72');
    assert.equal(coverage?.kitchen?.status, 'pending');
    assert.equal(coverage?.journey?.status, 'pending');
    assert.equal(runtime?.planner_runtime_eligible, false);
    assert.equal(runtime?.release_state, 'preview_only');
    assert.equal(formalIds.has(recipeId), false, `${recipeId} must not be in formal Planner 72`);
  }
});
