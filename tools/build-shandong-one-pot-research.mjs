#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateShandongOnePotResearch } from './lib/shandong-one-pot-research-validator.mjs';
import {
  buildShandongOnePotResearchReport,
  formatShandongOnePotResearchSummary,
  validateShandongOnePotResearchReport,
} from './lib/shandong-one-pot-research-builder.mjs';
import { buildShandongOnePotResearchArtifacts } from './lib/shandong-one-pot-research-renderer.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));

export function buildShandongOnePotResearchFromFixedInputs() {
  const inputs = {
    assessment: readJson('tools/data/shandong-one-pot-research.v1.json'),
    recipeLibrary: readJson('tools/data/recipe-library.json'),
    regionalResearch: readJson('tools/data/regional-menu-research.v1.json'),
    regionalAtlas: readJson('tools/data/regional-atlas.v2.json'),
    regionalMappings: readJson('tools/data/regional-menu-mappings.v1.json'),
  };
  const sourceErrors = validateShandongOnePotResearch(inputs);
  if (sourceErrors.length) throw new Error(`Shandong research input validation failed:\n${sourceErrors.map(error => `- ${error}`).join('\n')}`);
  const report = buildShandongOnePotResearchReport(inputs);
  const reportErrors = validateShandongOnePotResearchReport(report);
  if (reportErrors.length) throw new Error(`Shandong research report validation failed:\n${reportErrors.map(error => `- ${error}`).join('\n')}`);
  return { report, artifacts: buildShandongOnePotResearchArtifacts(report) };
}

function main() {
  const [mode] = process.argv.slice(2);
  if (!['--write', '--check'].includes(mode) || process.argv.length !== 3) {
    console.error('Usage: node tools/build-shandong-one-pot-research.mjs --write|--check');
    process.exitCode = 2;
    return;
  }
  let result;
  try {
    result = buildShandongOnePotResearchFromFixedInputs();
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
    console.log(formatShandongOnePotResearchSummary(result.report));
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
  console.log(formatShandongOnePotResearchSummary(result.report));
}

if (import.meta.main) main();
