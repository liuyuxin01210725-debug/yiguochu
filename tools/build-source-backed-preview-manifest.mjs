#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSourceBackedPreviewManifest } from './lib/source-backed-preview-manifest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(ROOT, 'tools/data/source-backed-one-pot-recipes.v1.json');
const outputPath = path.join(ROOT, 'tools/data/source-backed-one-pot-preview.v1.json');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const manifest = buildSourceBackedPreviewManifest(catalog);
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`source-backed preview manifest ${manifest.preview_version}: ${manifest.counts.selected}/${manifest.counts.total} selected, ${manifest.counts.blocked} blocked`);
