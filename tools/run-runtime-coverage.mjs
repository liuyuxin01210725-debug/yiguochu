#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runRuntimeCoverage,
  validateRuntimeCoverageResults,
} from './lib/runtime-coverage-results.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'data', relative), 'utf8'));
const arg = name => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
};

const matrix = read('runtime-coverage-matrix.v1.json');
const sourceAuthority = read('runtime-authority.v1.json');
const runtimeCatalog = read('generated/runtime-one-pot-catalog.v1.json');
const requestedMode = arg('--authority-mode') ?? arg('--mode');
if (requestedMode && !['shadow', 'catalog-enforced'].includes(requestedMode)) {
  console.error(`invalid --authority-mode: ${requestedMode}`);
  process.exitCode = 2;
} else {
  const authority = requestedMode ? { ...sourceAuthority, mode: requestedMode } : sourceAuthority;
  const results = runRuntimeCoverage({ matrix, authority, runtimeCatalog });
  const errors = validateRuntimeCoverageResults(results, { matrix, authority, runtimeCatalog });
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    const reportPath = arg('--report');
    if (reportPath) {
      const absolute = path.resolve(ROOT, reportPath);
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      fs.writeFileSync(absolute, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
    }
    console.log(JSON.stringify({
      mode: results.authority_mode,
      authority_code: results.authority_status.code,
      execution_status: results.execution.status,
      scenarios: results.counts.total,
      observed: results.counts.observed,
      passed: results.counts.passed,
      blocked: results.counts.blocked,
      note: 'deterministic dry-run; Planner/Worker was not invoked',
    }));
  }
}
