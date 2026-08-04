#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateSourceBackedCatalogMigration,
  validateSourceBackedOnePotCatalog,
} from './lib/source-backed-one-pot-catalog-validator.mjs';
import { buildSourceBackedOnePotArtifacts } from './lib/source-backed-one-pot-catalog-renderer.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));

export function validateSourceBackedOnePotCatalogInputs(catalog, migration, legacyVariants, options = {}) {
  return [
    ...validateSourceBackedOnePotCatalog(catalog, options),
    ...validateSourceBackedCatalogMigration(migration, legacyVariants, catalog),
  ];
}

export function buildSourceBackedOnePotCatalogFromFixedInputs() {
  const catalog = readJson('tools/data/source-backed-one-pot-recipes.v1.json');
  const migration = readJson('tools/data/source-backed-catalog-migration.v1.json');
  const legacyCatalog = readJson('tools/data/rice-meal-catalog.v1.json');
  const legacyVariants = Array.isArray(legacyCatalog?.families)
    ? legacyCatalog.families.flatMap(family => Array.isArray(family?.variants) ? family.variants : [])
    : [];
  const errors = validateSourceBackedOnePotCatalogInputs(
    catalog,
    migration,
    legacyVariants,
    { archive_root: ROOT },
  );
  if (errors.length) {
    throw new Error(`Source-backed one-pot catalog input validation failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  }
  return { catalog, migration, artifacts: buildSourceBackedOnePotArtifacts(catalog, migration) };
}

export function findStaleArtifactPaths(artifacts, root = ROOT) {
  const stale = [];
  for (const [relativePath, content] of artifacts instanceof Map ? artifacts : []) {
    const filePath = path.join(root, relativePath);
    if (!fs.existsSync(filePath) || !fs.readFileSync(filePath).equals(Buffer.from(content, 'utf8'))) {
      stale.push(relativePath);
    }
  }
  return stale;
}

export function writeArtifacts(artifacts, root = ROOT) {
  for (const [relativePath, content] of artifacts instanceof Map ? artifacts : []) {
    const filePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

export function runBuildMode(mode, root = ROOT) {
  if (!['--write', '--check'].includes(mode)) return { usage: true, stale: [], result: null };
  const result = buildSourceBackedOnePotCatalogFromFixedInputs();
  if (mode === '--write') writeArtifacts(result.artifacts, root);
  return { usage: false, stale: mode === '--check' ? findStaleArtifactPaths(result.artifacts, root) : [], result };
}

function main() {
  const [mode] = process.argv.slice(2);
  if (!['--write', '--check'].includes(mode) || process.argv.length !== 3) {
    console.error('Usage: node tools/build-source-backed-one-pot-catalog.mjs --write|--check');
    process.exitCode = 2;
    return;
  }
  try {
    const outcome = runBuildMode(mode);
    if (outcome.stale.length) {
      outcome.stale.forEach(relativePath => console.error(`Missing or stale: ${relativePath}`));
      process.exitCode = 1;
      return;
    }
    console.log(`${outcome.result.catalog.recipes.length} source-backed one-pot recipes · artifacts ok`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (import.meta.main) main();
