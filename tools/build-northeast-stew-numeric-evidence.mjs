#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertNortheastStewNumericEvidence } from './lib/northeast-stew-numeric-evidence-validator.mjs';
import {
  buildNortheastStewNumericEvidenceReport,
  formatNortheastStewNumericEvidenceSummary,
  validateNortheastStewNumericEvidenceReport,
} from './lib/northeast-stew-numeric-evidence-builder.mjs';
import { buildNortheastStewNumericEvidenceArtifacts } from './lib/northeast-stew-numeric-evidence-renderer.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const dataPath = path.join(ROOT, 'tools/data/northeast-stew-numeric-evidence.v1.json');
const researchPath = path.join(ROOT, 'tools/data/northeast-stew-research.v1.json');

export function buildNortheastStewNumericEvidenceFromFixedInputs() {
  const ledger = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const research = JSON.parse(fs.readFileSync(researchPath, 'utf8'));
  const calibrationCases = research.calibration_cases;
  assertNortheastStewNumericEvidence(ledger, calibrationCases);
  const report = buildNortheastStewNumericEvidenceReport(ledger, calibrationCases);
  const errors = validateNortheastStewNumericEvidenceReport(report);
  if (errors.length) throw new Error(`Northeast numeric evidence report validation failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  return { report, artifacts: buildNortheastStewNumericEvidenceArtifacts(report) };
}

function main() {
  const [mode] = process.argv.slice(2);
  if (!['--write', '--check'].includes(mode) || process.argv.length !== 3) {
    console.error('Usage: node tools/build-northeast-stew-numeric-evidence.mjs --write|--check');
    process.exitCode = 2;
    return;
  }
  let result;
  try { result = buildNortheastStewNumericEvidenceFromFixedInputs(); } catch (error) {
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
  console.log(formatNortheastStewNumericEvidenceSummary(result.report));
}

if (import.meta.main) main();
