#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCentralPlainsNoodleResearchReport,
  formatCentralPlainsNoodleResearchSummary,
  validateCentralPlainsNoodleResearchReport,
} from './lib/central-plains-noodle-research-builder.mjs';
import { buildCentralPlainsNoodleResearchArtifacts } from './lib/central-plains-noodle-research-renderer.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));

export function buildCentralPlainsNoodleResearchFromFixedInputs() {
  const report = buildCentralPlainsNoodleResearchReport({
    assessment: readJson('tools/data/central-plains-noodle-research.v1.json'),
    recipeLibrary: readJson('tools/data/recipe-library.json'),
    regionalResearch: readJson('tools/data/regional-menu-research.v1.json'),
    regionalAtlas: readJson('tools/data/regional-atlas.v2.json'),
    regionalMappings: readJson('tools/data/regional-menu-mappings.v1.json'),
  });
  const reportErrors = validateCentralPlainsNoodleResearchReport(report);
  if (reportErrors.length) throw new Error(`Central Plains research report validation failed:\n${reportErrors.map(error => `- ${error}`).join('\n')}`);
  return { report, artifacts: buildCentralPlainsNoodleResearchArtifacts(report) };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && !['--write', '--check'].includes(args[0]))) {
    console.error('Usage: node tools/build-central-plains-noodle-research.mjs [--write|--check]');
    process.exitCode = 2;
    return;
  }
  let result;
  try {
    result = buildCentralPlainsNoodleResearchFromFixedInputs();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }
  const mode = args[0];
  if (!mode) {
    console.log(formatCentralPlainsNoodleResearchSummary(result.report));
    return;
  }
  if (mode === '--write') {
    for (const [relativePath, content] of result.artifacts) {
      const filePath = path.join(ROOT, relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const tempPath = `${filePath}.tmp-${process.pid}`;
      fs.writeFileSync(tempPath, content, 'utf8');
      fs.renameSync(tempPath, filePath);
    }
    console.log(formatCentralPlainsNoodleResearchSummary(result.report));
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
  console.log(formatCentralPlainsNoodleResearchSummary(result.report));
}

if (import.meta.main) main();
