#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKitchenTrialCatalog } from './lib/kitchen-trial-catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
const catalog = buildKitchenTrialCatalog({
  sourceCatalog: readJson('tools/data/source-backed-one-pot-recipes.v1.json'),
  executionLibrary: readJson('tools/data/source-backed-execution-library.v1.json'),
  formalizationLedger: readJson('tools/data/source-backed-formalization-ledger.v1.json'),
  formalReview: readJson('tools/data/source-backed-formal-candidate-review.v1.json'),
});
fs.writeFileSync(path.join(ROOT, 'tools/data/kitchen-trial-catalog.v1.json'), `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`kitchen trial catalog ${catalog.kitchen_trial_catalog_version}: ${catalog.counts.total} trial candidates`);
