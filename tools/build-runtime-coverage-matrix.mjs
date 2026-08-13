#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRuntimeCoverageMatrix } from './lib/runtime-coverage-matrix.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
const matrix = buildRuntimeCoverageMatrix({
  runtimeJourneys: readJson('tools/data/recipe-runtime-journeys.v1.json'),
  riceMealJourneys: readJson('tools/data/rice-meal-journeys.v1.json'),
  directRecommendShadow: readJson('tools/data/direct-recommend-shadow-v1.json'),
  formalRecipeLibrary: readJson('tools/data/recipe-library.json'),
  riceMealCatalog: readJson('tools/data/rice-meal-catalog.v1.json'),
});
fs.writeFileSync(path.join(ROOT, 'tools/data/runtime-coverage-matrix.v1.json'), `${JSON.stringify(matrix, null, 2)}\n`);
console.log(`runtime coverage matrix ${matrix.runtime_coverage_matrix_version}: ${matrix.counts.total} scenarios · ${matrix.counts.candidate_joined} structured candidate joins`);
