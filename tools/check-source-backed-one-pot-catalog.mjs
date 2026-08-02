#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { buildSourceBackedOnePotCatalogFromFixedInputs, findStaleArtifactPaths } from './build-source-backed-one-pot-catalog.mjs';

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
