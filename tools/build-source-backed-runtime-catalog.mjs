#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSourceBackedRuntimeCatalog } from './lib/source-backed-runtime-catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
const runtime = buildSourceBackedRuntimeCatalog({
  sourceCatalog: readJson('tools/data/source-backed-one-pot-recipes.v1.json'),
  executionLibrary: readJson('tools/data/source-backed-execution-library.v1.json'),
  formalizationLedger: readJson('tools/data/source-backed-formalization-ledger.v1.json'),
});
fs.writeFileSync(path.join(ROOT, 'tools/data/source-backed-runtime-catalog.v1.json'), `${JSON.stringify(runtime, null, 2)}\n`);
console.log(`source-backed runtime catalog ${runtime.runtime_catalog_version}: ${runtime.counts.total} entries · preview ${runtime.counts.preview_only} · research ${runtime.counts.research_only} · blocked ${runtime.counts.blocked}`);
