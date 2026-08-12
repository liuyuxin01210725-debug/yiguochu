#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRiceMealCollection } from './lib/rice-meal-collection-validator.mjs';
import { buildRiceMealCollectionArtifacts } from './lib/rice-meal-collection-renderer.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));

export function buildRiceMealCollectionFromFixedInputs() {
  const collection = readJson('tools/data/rice-meal-collection.v1.json');
  const taxonomy = readJson('tools/data/ingredient-taxonomy.v1.json');
  const catalog = readJson('tools/data/rice-meal-catalog.v1.json');
  const errors = validateRiceMealCollection(collection, { taxonomy, catalog });
  if (errors.length) throw new Error(`Rice meal collection input validation failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  return { collection, artifacts: buildRiceMealCollectionArtifacts(collection) };
}

function main() {
  const [mode] = process.argv.slice(2);
  if (!['--write', '--check'].includes(mode) || process.argv.length !== 3) {
    console.error('Usage: node tools/build-rice-meal-collection.mjs --write|--check');
    process.exitCode = 2;
    return;
  }
  let result;
  try { result = buildRiceMealCollectionFromFixedInputs(); } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }
  const stale = [];
  for (const [relativePath, content] of result.artifacts) {
    const filePath = path.join(ROOT, relativePath);
    if (mode === '--write') {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, 'utf8');
    } else if (!fs.existsSync(filePath) || !fs.readFileSync(filePath).equals(Buffer.from(content, 'utf8'))) stale.push(relativePath);
  }
  if (stale.length) {
    for (const relativePath of stale) console.error(`Missing or stale: ${relativePath}`);
    process.exitCode = 1;
    return;
  }
  console.log(`${result.collection.candidates.length} rice meal collection candidates · review artifacts ok`);
}

if (import.meta.main) main();
