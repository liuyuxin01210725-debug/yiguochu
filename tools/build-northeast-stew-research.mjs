#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateNortheastStewResearch } from './lib/northeast-stew-research-validator.mjs';
import {
  buildNortheastStewResearchReport,
  formatNortheastStewResearchSummary,
  validateNortheastStewResearchReport,
} from './lib/northeast-stew-research-builder.mjs';
import { buildNortheastStewResearchArtifacts } from './lib/northeast-stew-research-renderer.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));

export function buildNortheastStewResearchFromFixedInputs() {
  const inputs = {
    assessment: readJson('tools/data/northeast-stew-research.v1.json'),
    regionalAtlas: readJson('tools/data/regional-atlas.v2.json'),
    regionalResearch: readJson('tools/data/regional-menu-research.v1.json'),
    taxonomy: readJson('tools/data/ingredient-taxonomy.v1.json'),
  };
  const sourceErrors = validateNortheastStewResearch(inputs);
  if (sourceErrors.length) {
    throw new Error(`Northeast research input validation failed:\n${sourceErrors.map(error => `- ${error}`).join('\n')}`);
  }
  const report = buildNortheastStewResearchReport(inputs);
  const reportErrors = validateNortheastStewResearchReport(report);
  if (reportErrors.length) {
    throw new Error(`Northeast research report validation failed:\n${reportErrors.map(error => `- ${error}`).join('\n')}`);
  }
  return { report, artifacts: buildNortheastStewResearchArtifacts(report) };
}

function main() {
  const [mode] = process.argv.slice(2);
  if (!['--write', '--check'].includes(mode) || process.argv.length !== 3) {
    console.error('Usage: node tools/build-northeast-stew-research.mjs --write|--check');
    process.exitCode = 2;
    return;
  }
  let result;
  try {
    result = buildNortheastStewResearchFromFixedInputs();
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
    console.log(formatNortheastStewResearchSummary(result.report));
    return;
  }
  const stale = [];
  for (const [relativePath, content] of result.artifacts) {
    const filePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(filePath) || !fs.readFileSync(filePath).equals(Buffer.from(content, 'utf8'))) stale.push(relativePath);
  }
  if (stale.length) {
    for (const relativePath of stale) console.error(`Missing or stale: ${relativePath}`);
    process.exitCode = 1;
    return;
  }
  console.log(formatNortheastStewResearchSummary(result.report));
}

if (import.meta.main) main();
