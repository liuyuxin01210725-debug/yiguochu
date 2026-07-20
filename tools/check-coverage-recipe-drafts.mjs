#!/usr/bin/env node

import fs from 'node:fs';
import { validateRecipeDraftLibrary } from './lib/recipe-draft-validator.mjs';
import { COVERAGE_PROMOTION_MATRIX } from './lib/coverage-recipe-promotion-gate.mjs';

const candidates = JSON.parse(fs.readFileSync(
  new URL('./data/coverage-recipe-candidates.json', import.meta.url),
  'utf8',
));
const drafts = JSON.parse(fs.readFileSync(
  new URL('./data/coverage-recipe-drafts.json', import.meta.url),
  'utf8',
));
const entries = Array.isArray(drafts?.drafts) ? drafts.drafts : [];
const errors = validateRecipeDraftLibrary(drafts, candidates);
const expectedIds = [...COVERAGE_PROMOTION_MATRIX.keys()].map(id => `${id}-draft`);

if (entries.length !== expectedIds.length) {
  errors.push(`coverage draft library must contain exactly ${expectedIds.length} drafts`);
}
if (JSON.stringify(entries.map(entry => entry?.id)) !== JSON.stringify(expectedIds)) {
  errors.push('coverage draft identities must match the fixed promotion matrix');
}

console.log(`覆盖扩库草案 ${entries.length} 道 · 生产可用 0 道`);
if (errors.length) {
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('✅ 覆盖扩库草案体检通过');
}
