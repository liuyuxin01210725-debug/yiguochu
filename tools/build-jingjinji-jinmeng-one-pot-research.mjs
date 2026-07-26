#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildJingjinjiJinmengOnePotResearchReport, formatJingjinjiJinmengOnePotResearchSummary, validateJingjinjiJinmengOnePotResearchReport } from './lib/jingjinji-jinmeng-one-pot-research-builder.mjs';
import { buildJingjinjiJinmengOnePotResearchArtifacts } from './lib/jingjinji-jinmeng-one-pot-research-renderer.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));

export function buildJingjinjiJinmengOnePotResearchFromFixedInputs() {
  const report = buildJingjinjiJinmengOnePotResearchReport({
    assessment: readJson('tools/data/jingjinji-jinmeng-one-pot-research.v1.json'),
    recipeLibrary: readJson('tools/data/recipe-library.json'),
    regionalResearch: readJson('tools/data/regional-menu-research.v1.json'),
    regionalAtlas: readJson('tools/data/regional-atlas.v2.json'),
    regionalMappings: readJson('tools/data/regional-menu-mappings.v1.json'),
  });
  const errors = validateJingjinjiJinmengOnePotResearchReport(report);
  if (errors.length) throw new Error(`North-China research report validation failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  return { report, artifacts: buildJingjinjiJinmengOnePotResearchArtifacts(report) };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && !['--write', '--check'].includes(args[0]))) {
    console.error('Usage: node tools/build-jingjinji-jinmeng-one-pot-research.mjs [--write|--check]');
    process.exitCode = 2;
    return;
  }
  let result;
  try { result = buildJingjinjiJinmengOnePotResearchFromFixedInputs(); }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; return; }
  const mode = args[0];
  if (!mode) { console.log(formatJingjinjiJinmengOnePotResearchSummary(result.report)); return; }
  if (mode === '--write') {
    for (const [relativePath, content] of result.artifacts) {
      const filePath = path.join(ROOT, relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const tempPath = `${filePath}.tmp-${process.pid}`;
      fs.writeFileSync(tempPath, content, 'utf8');
      fs.renameSync(tempPath, filePath);
    }
    console.log(formatJingjinjiJinmengOnePotResearchSummary(result.report));
    return;
  }
  const stale = [];
  for (const [relativePath, content] of result.artifacts) {
    const filePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(filePath) || !fs.readFileSync(filePath).equals(Buffer.from(content, 'utf8'))) stale.push(relativePath);
  }
  if (stale.length) { for (const relativePath of stale) console.error(`Missing or stale: ${relativePath}`); process.exitCode = 1; return; }
  console.log(formatJingjinjiJinmengOnePotResearchSummary(result.report));
}

if (import.meta.main) main();
