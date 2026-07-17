#!/usr/bin/env node
import fs from 'node:fs';
import { validateRecipeCandidateLedger } from './lib/recipe-candidate-validator.mjs';

const file = new URL('./data/recipe-candidates.json', import.meta.url);
const ledger = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = validateRecipeCandidateLedger(ledger);
const total = Array.isArray(ledger?.entries) ? ledger.entries.length : 0;
const production = Array.isArray(ledger?.entries)
  ? ledger.entries.filter(entry => entry?.status === 'approved').length
  : 0;
for (const error of errors) console.error(`❌ ${error}`);
console.log(`传统菜候选 ${total} 道 · 生产可用 ${production} 道`);
console.log(errors.length ? `❌ 传统菜候选册体检不通过: ${errors.length} 项` : '✅ 传统菜候选册体检通过');
process.exit(errors.length ? 1 : 0);
