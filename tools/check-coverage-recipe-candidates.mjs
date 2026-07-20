#!/usr/bin/env node

import fs from 'node:fs';
import { validateRecipeCandidateLedger } from './lib/recipe-candidate-validator.mjs';
import { COVERAGE_PROMOTION_MATRIX } from './lib/coverage-recipe-promotion-gate.mjs';

const ledger = JSON.parse(fs.readFileSync(
  new URL('./data/coverage-recipe-candidates.json', import.meta.url),
  'utf8',
));
const errors = validateRecipeCandidateLedger(ledger);
const entries = Array.isArray(ledger?.entries) ? ledger.entries : [];

if (entries.length !== COVERAGE_PROMOTION_MATRIX.size) {
  errors.push(`coverage candidate ledger must contain exactly ${COVERAGE_PROMOTION_MATRIX.size} entries`);
}
if (entries.some(entry => entry?.status !== 'candidate')) {
  errors.push('coverage candidate ledger must contain research candidates only');
}
if (JSON.stringify(entries.map(entry => entry?.id)) !== JSON.stringify([...COVERAGE_PROMOTION_MATRIX.keys()])) {
  errors.push('coverage candidate ledger identities must match the fixed promotion matrix');
}

console.log(`覆盖扩库候选 ${entries.length} 道 · 生产可用 0 道`);
if (errors.length) {
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('✅ 覆盖扩库候选册体检通过');
}
