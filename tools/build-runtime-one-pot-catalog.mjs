#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRuntimeOnePotCatalog, validateRuntimeOnePotCatalog } from './lib/runtime-one-pot-catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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
  kitchenLedger: fs.existsSync(path.join(ROOT, 'tools/data/kitchen-observations.v1.json'))
    ? readJson('tools/data/kitchen-observations.v1.json')
    : { schema_version: 'kitchen-observations.v1', observations: [] },
};
const outputPath = path.join(ROOT, 'tools/data/generated/runtime-one-pot-catalog.v1.json');
const catalog = buildRuntimeOnePotCatalog(inputs);
const errors = validateRuntimeOnePotCatalog(catalog, inputs);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  console.log(`runtime one-pot catalog ${catalog.runtime_catalog_version}: ${catalog.counts.total} trusted recipes`);
}
