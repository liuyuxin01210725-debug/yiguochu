#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSourceBackedFormalCandidateReview } from './lib/source-backed-formal-candidate-review.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));

const catalog = readJson('tools/data/source-backed-one-pot-recipes.v1.json');
const taxonomy = readJson('tools/data/ingredient-taxonomy.v1.json');
const ratioCatalog = readJson('tools/data/ratio-rules.v1.json');
const formalRatioEvidence = readJson('tools/data/source-backed-formal-ratio-evidence.v1.json');
const review = buildSourceBackedFormalCandidateReview(catalog, taxonomy, ratioCatalog, formalRatioEvidence);
const outputPath = path.join(ROOT, 'tools/data/source-backed-formal-candidate-review.v1.json');
fs.writeFileSync(outputPath, `${JSON.stringify(review, null, 2)}\n`);
console.log(`source-backed formal candidate review ${review.review_version}: ${review.counts.total} rows · ${review.counts.source_complete} source-complete · ${review.counts.formal_ready} formal-ready`);
