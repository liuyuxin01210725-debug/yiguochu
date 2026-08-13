#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSourceBackedFormalizationMatrix } from './lib/source-backed-formalization-matrix.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
const matrix = buildSourceBackedFormalizationMatrix({
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
fs.writeFileSync(path.join(ROOT, 'tools/data/source-backed-formalization-matrix.v1.json'), `${JSON.stringify(matrix, null, 2)}\n`);
console.log(`source-backed formalization matrix ${matrix.formalization_matrix_version}: ${matrix.counts.total} rows · ${matrix.aggregates.journey_evidence_recipe_count} structured journey-linked recipes`);
