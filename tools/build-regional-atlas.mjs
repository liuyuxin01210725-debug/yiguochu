#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRegionalAtlas } from './lib/regional-atlas-validator.mjs';
import { validateRegionalMenuMappings } from './lib/regional-menu-mapping-validator.mjs';
import {
  buildRegionalAtlasReport,
  formatRegionalAtlasSummary,
  validateRegionalAtlasReport,
} from './lib/regional-atlas-builder.mjs';
import { buildRegionalAtlasArtifacts } from './lib/regional-atlas-renderer.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));

export function buildRegionalAtlasFromFixedInputs() {
  const inputs = {
    atlas: readJson('tools/data/regional-atlas.v2.json'),
    mappings: readJson('tools/data/regional-menu-mappings.v1.json'),
    recipeLibrary: readJson('tools/data/recipe-library.json'),
    regionalResearch: readJson('tools/data/regional-menu-research.v1.json'),
  };
  const sourceErrors = [
    ...validateRegionalAtlas(inputs.atlas),
    ...validateRegionalMenuMappings(inputs),
  ];
  if (sourceErrors.length) {
    throw new Error(`Regional atlas input validation failed:\n${sourceErrors.map(error => `- ${error}`).join('\n')}`);
  }
  const report = buildRegionalAtlasReport(inputs);
  const reportErrors = validateRegionalAtlasReport(report);
  if (reportErrors.length) {
    throw new Error(`Regional atlas report validation failed:\n${reportErrors.map(error => `- ${error}`).join('\n')}`);
  }
  return { report, artifacts: buildRegionalAtlasArtifacts(report) };
}

function main() {
  const [mode] = process.argv.slice(2);
  if (!['--write', '--check'].includes(mode) || process.argv.length !== 3) {
    console.error('Usage: node tools/build-regional-atlas.mjs --write|--check');
    process.exitCode = 2;
    return;
  }
  let result;
  try {
    result = buildRegionalAtlasFromFixedInputs();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }
  if (mode === '--write') {
    for (const [relativePath, content] of result.artifacts) {
      const filePath = path.join(ROOT, relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, 'utf8');
    }
    console.log(formatRegionalAtlasSummary(result.report));
    return;
  }
  const stale = [];
  for (const [relativePath, content] of result.artifacts) {
    const filePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(filePath) || !fs.readFileSync(filePath).equals(Buffer.from(content, 'utf8'))) {
      stale.push(relativePath);
    }
  }
  if (stale.length) {
    for (const relativePath of stale) console.error(`Missing or stale: ${relativePath}`);
    process.exitCode = 1;
    return;
  }
  console.log(formatRegionalAtlasSummary(result.report));
}

if (import.meta.main) main();
