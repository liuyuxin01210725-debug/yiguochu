#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertNortheastStewSafetyEvidence } from './lib/northeast-stew-safety-evidence-validator.mjs';
import {
  buildNortheastStewSafetyEvidenceReport,
  formatNortheastStewSafetyEvidenceSummary,
  validateNortheastStewSafetyEvidenceReport,
} from './lib/northeast-stew-safety-evidence-builder.mjs';
import { buildNortheastStewSafetyEvidenceArtifacts } from './lib/northeast-stew-safety-evidence-renderer.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = relativePath => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));

export function buildNortheastStewSafetyEvidenceFromFixedInputs() {
  const inputs = {
    ledger: read('tools/data/northeast-stew-safety-evidence.v1.json'),
    research: read('tools/data/northeast-stew-research.v1.json'),
    taxonomy: read('tools/data/ingredient-taxonomy.v1.json'),
    numericEvidence: read('tools/data/northeast-stew-numeric-evidence.v1.json'),
  };
  assertNortheastStewSafetyEvidence(inputs);
  const report = buildNortheastStewSafetyEvidenceReport(inputs);
  const errors = validateNortheastStewSafetyEvidenceReport(report);
  if (errors.length) throw new Error(`Northeast safety evidence report validation failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  return { report, artifacts: buildNortheastStewSafetyEvidenceArtifacts(report) };
}

function main() {
  const [mode] = process.argv.slice(2);
  if (!['--write', '--check'].includes(mode) || process.argv.length !== 3) {
    console.error('Usage: node tools/build-northeast-stew-safety-evidence.mjs --write|--check');
    process.exitCode = 2;
    return;
  }
  let result;
  try { result = buildNortheastStewSafetyEvidenceFromFixedInputs(); } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }
  if (mode === '--write') {
    for (const [relativePath, content] of result.artifacts) {
      const target = path.join(ROOT, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content, 'utf8');
    }
  } else {
    const stale = [...result.artifacts].filter(([relativePath, content]) => {
      const target = path.join(ROOT, relativePath);
      return !fs.existsSync(target) || !fs.readFileSync(target).equals(Buffer.from(content, 'utf8'));
    }).map(([relativePath]) => relativePath);
    if (stale.length) {
      for (const relativePath of stale) console.error(`Missing or stale: ${relativePath}`);
      process.exitCode = 1;
      return;
    }
  }
  console.log(formatNortheastStewSafetyEvidenceSummary(result.report));
}

if (import.meta.main) main();
