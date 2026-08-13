#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSourceBackedCoverageMatrix } from './lib/source-backed-coverage-matrix.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

const matrix = buildSourceBackedCoverageMatrix({
  sourceCatalog: readJson('tools/data/source-backed-one-pot-recipes.v1.json'),
  executionLibrary: readJson('tools/data/source-backed-execution-library.v1.json'),
  formalizationLedger: readJson('tools/data/source-backed-formalization-ledger.v1.json'),
  formalReview: readJson('tools/data/source-backed-formal-candidate-review.v1.json'),
  formalStaging: readJson('tools/data/source-backed-formal-staging.v1.json'),
  formalRecipeLibrary: readJson('tools/data/recipe-library.json'),
  runtimeJourneys: readJson('tools/data/recipe-runtime-journeys.v1.json'),
  riceMealJourneys: readJson('tools/data/rice-meal-journeys.v1.json'),
  directRecommendShadow: readJson('tools/data/direct-recommend-shadow-v1.json'),
  ratioEvidence: readJson('tools/data/source-backed-formal-ratio-evidence.v1.json'),
});

const outputPath = path.join(ROOT, 'tools/data/source-backed-coverage-matrix.v1.json');
fs.writeFileSync(outputPath, `${JSON.stringify(matrix, null, 2)}\n`, 'utf8');
console.log(`source-backed coverage matrix ${matrix.coverage_matrix_version}: ${matrix.counts.total} recipes · ${matrix.counts.safety_blocked} safety blocked · ${matrix.aggregates.journey_evidence_recipe_count} with journey evidence`);

