#!/usr/bin/env node
import fs from 'node:fs';
import { validateTraditionalRecipePromotion } from './lib/traditional-recipe-promotion-gate.mjs';

function fileArgument(name, defaultFile) {
  const index = process.argv.indexOf(name);
  return index === -1 ? defaultFile : process.argv[index + 1];
}

const candidateFile = fileArgument('--candidate-file', new URL('./data/recipe-candidates.json', import.meta.url));
const draftFile = fileArgument('--draft-file', new URL('./data/recipe-drafts.json', import.meta.url));
const productionFile = fileArgument('--production-file', new URL('./data/recipe-library.json', import.meta.url));
const promotionFile = fileArgument('--promotion-file', new URL('./data/traditional-recipe-promotions.json', import.meta.url));
const candidates = JSON.parse(fs.readFileSync(candidateFile, 'utf8'));
const drafts = JSON.parse(fs.readFileSync(draftFile, 'utf8'));
const production = JSON.parse(fs.readFileSync(productionFile, 'utf8'));
const promotionManifest = JSON.parse(fs.readFileSync(promotionFile, 'utf8'));
const promotions = promotionManifest?.promotions;
const errors = validateTraditionalRecipePromotion({ candidates, drafts, production, promotions });

for (const error of errors) console.error(`❌ ${error}`);
console.log(`传统菜晋升清单 ${Array.isArray(promotions) ? promotions.length : 0} 道`);
if (errors.length) {
  console.log(`⚠️ 晋升闸门暂未通过: ${errors.length} 项；预期在 Task 3 晋升生产菜谱后通过。`);
  process.exitCode = 1;
} else {
  console.log('✅ 传统菜晋升闸门通过');
}
