#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSourceBackedFormalRatioEvidence } from './lib/source-backed-formal-ratio-evidence.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/data/source-backed-one-pot-recipes.v1.json'), 'utf8'));
const evidence = buildSourceBackedFormalRatioEvidence(catalog);
const output = path.join(ROOT, 'tools/data/source-backed-formal-ratio-evidence.v1.json');
fs.writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`source-backed formal ratio evidence ${evidence.evidence_version}: ${evidence.counts.candidate_evidence_only} candidate entries / ${evidence.counts.total} total`);
