#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRuntimeCoverageResults } from './lib/runtime-coverage-results.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'data', name), 'utf8'));
const matrix = read('runtime-coverage-matrix.v1.json');
const authority = read('runtime-authority.v1.json');
const runtimeCatalog = read('generated/runtime-one-pot-catalog.v1.json');
const output = buildRuntimeCoverageResults({ matrix, authority, runtimeCatalog });
const target = path.join(ROOT, 'tools', 'data', 'runtime-coverage-results.v1.json');
fs.writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ target, scenarios: output.counts.total, observed: output.counts.observed }));
