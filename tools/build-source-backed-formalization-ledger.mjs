#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSourceBackedFormalizationLedger } from './lib/source-backed-formalization-ledger.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(ROOT, 'tools/data/source-backed-one-pot-recipes.v1.json');
const outputPath = path.join(ROOT, 'tools/data/source-backed-formalization-ledger.v1.json');
const catalog = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const ledger = buildSourceBackedFormalizationLedger(catalog);
fs.writeFileSync(outputPath, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
console.log(`source-backed formalization ledger ${ledger.ledger_version}: ${ledger.counts.preview_candidate} preview candidates / ${ledger.counts.blocked} blocked / ${ledger.counts.total} total · execution ${ledger.counts.execution_unblocked_complete}/${ledger.counts.execution_complete} unblocked complete`);
