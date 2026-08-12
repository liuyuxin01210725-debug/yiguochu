#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJiangnanRiceResearch } from './lib/jiangnan-rice-research-validator.mjs';
import {
  buildJiangnanRiceResearchReport,
  formatJiangnanRiceResearchSummary,
  validateJiangnanRiceResearchReport,
} from './lib/jiangnan-rice-research-builder.mjs';
import { buildJiangnanRiceResearchArtifacts } from './lib/jiangnan-rice-research-renderer.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));

export function buildJiangnanRiceResearchFromFixedInputs() {
  const inputs = {
    assessment: readJson('tools/data/jiangnan-rice-research.v1.json'),
    recipeLibrary: readJson('tools/data/recipe-library.json'),
    recipeCandidates: readJson('tools/data/recipe-candidates.json'),
    regionalAtlas: readJson('tools/data/regional-atlas.v2.json'),
    regionalMappings: readJson('tools/data/regional-menu-mappings.v1.json'),
  };
  const sourceErrors = validateJiangnanRiceResearch(inputs);
  if (sourceErrors.length) {
    throw new Error(`Jiangnan research input validation failed:\n${sourceErrors.map(error => `- ${error}`).join('\n')}`);
  }
  const report = buildJiangnanRiceResearchReport(inputs);
  const reportErrors = validateJiangnanRiceResearchReport(report);
  if (reportErrors.length) {
    throw new Error(`Jiangnan research report validation failed:\n${reportErrors.map(error => `- ${error}`).join('\n')}`);
  }
  return { report, artifacts: buildJiangnanRiceResearchArtifacts(report) };
}

function main() {
  const [mode] = process.argv.slice(2);
  if (!['--write', '--check'].includes(mode) || process.argv.length !== 3) {
    console.error('Usage: node tools/build-jiangnan-rice-research.mjs --write|--check');
    process.exitCode = 2;
    return;
  }
  let result;
  try {
    result = buildJiangnanRiceResearchFromFixedInputs();
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
    console.log(formatJiangnanRiceResearchSummary(result.report));
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
  console.log(formatJiangnanRiceResearchSummary(result.report));
}

if (import.meta.main) main();
