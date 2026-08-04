#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSourceBackedOnePotCatalogFromFixedInputs, findStaleArtifactPaths } from './build-source-backed-one-pot-catalog.mjs';
import {
  validateSourceBackedCatalogMigration,
  validateSourceBackedOnePotCatalog,
} from './lib/source-backed-one-pot-catalog-validator.mjs';
import { buildSourceBackedOnePotArtifacts } from './lib/source-backed-one-pot-catalog-renderer.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

export function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

export function compareArtifacts(expectedArtifacts, artifactContents) {
  const errors = [];
  if (!(expectedArtifacts instanceof Map)) {
    return ['expectedArtifacts must be a Map'];
  }
  if (!(artifactContents instanceof Map)) {
    return ['artifactContents must be a Map'];
  }
  for (const [relativePath, expectedContent] of expectedArtifacts) {
    if (!artifactContents.has(relativePath)) {
      errors.push(`${relativePath} is missing or stale`);
    } else if (artifactContents.get(relativePath) !== expectedContent) {
      errors.push(`${relativePath} is stale`);
    }
  }
  return errors;
}

export function validateSourceBackedCatalogFiles(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return ['aggregate catalog arguments must be an object'];
  }

  const { catalog, migration, artifactContents } = input;
  const errors = [];
  let legacyVariants = [];
  try {
    const legacyCatalog = readJson('tools/data/rice-meal-catalog.v1.json');
    legacyVariants = Array.isArray(legacyCatalog?.families)
      ? legacyCatalog.families.flatMap(family => Array.isArray(family?.variants) ? family.variants : [])
      : [];
  } catch (error) {
    errors.push(`legacy catalog could not be read: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    errors.push(...validateSourceBackedOnePotCatalog(catalog, { archive_root: ROOT }));
  } catch (error) {
    errors.push(`catalog validation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  try {
    errors.push(...validateSourceBackedCatalogMigration(migration, legacyVariants, catalog));
  } catch (error) {
    errors.push(`migration validation failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  let expectedArtifacts;
  try {
    expectedArtifacts = buildSourceBackedOnePotArtifacts(catalog, migration);
  } catch (error) {
    errors.push(`artifact rendering failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (expectedArtifacts) errors.push(...compareArtifacts(expectedArtifacts, artifactContents));
  else if (!(artifactContents instanceof Map)) errors.push('artifactContents must be a Map');

  return errors;
}

export function checkSourceBackedOnePotCatalog() {
  try {
    const result = buildSourceBackedOnePotCatalogFromFixedInputs();
    return { errors: [], stale: findStaleArtifactPaths(result.artifacts), result };
  } catch (error) {
    return { errors: [error instanceof Error ? error.message : String(error)], stale: [], result: null };
  }
}

function main() {
  const outcome = checkSourceBackedOnePotCatalog();
  if (outcome.errors.length) {
    outcome.errors.forEach(error => console.error(error));
    process.exitCode = 1;
    return;
  }
  if (outcome.stale.length) {
    outcome.stale.forEach(relativePath => console.error(`Missing or stale: ${relativePath}`));
    process.exitCode = 1;
    return;
  }
  console.log(`${outcome.result.catalog.recipes.length} source-backed one-pot recipes · catalog and artifacts ok`);
}

if (import.meta.main) main();
