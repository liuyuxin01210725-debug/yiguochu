#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSourceBackedFormalStaging } from './lib/source-backed-formal-staging.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'tools', 'data', 'source-backed-one-pot-recipes.v1.json');
const reviewPath = path.join(root, 'tools', 'data', 'source-backed-formal-candidate-review.v1.json');
const outputPath = path.join(root, 'tools', 'data', 'source-backed-formal-staging.v1.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const review = JSON.parse(fs.readFileSync(reviewPath, 'utf8'));
const staging = buildSourceBackedFormalStaging(catalog, review);
fs.writeFileSync(outputPath, `${JSON.stringify(staging, null, 2)}\n`);
console.log(`source-backed formal staging ${staging.staging_version}: ${staging.counts.total} queued · ${staging.counts.source_complete} source-complete · ${staging.counts.formal_ready} formal-ready`);
