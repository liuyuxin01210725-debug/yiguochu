#!/usr/bin/env node
import fs from 'node:fs';
import {
  COVERAGE_JOURNEYS,
  validateCoverageRecipePromotion,
} from './lib/coverage-recipe-promotion-gate.mjs';

function read(relativePath) {
  return JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

const candidates = read('./data/coverage-recipe-candidates.json');
const drafts = read('./data/coverage-recipe-drafts.json');
const promotionManifest = read('./data/coverage-recipe-promotions.json');
const production = read('./data/recipe-library.json');
const promotions = promotionManifest.promotions;
const errors = validateCoverageRecipePromotion({ candidates, drafts, promotions, production });
const productionIds = new Set(production.recipes.map(recipe => recipe.id));
const completed = promotions.filter(promotion => productionIds.has(promotion.recipe_id)).length;
const readyJourneys = completed === promotions.length ? COVERAGE_JOURNEYS.length : 0;

for (const error of errors) console.error(`❌ ${error}`);
console.log(`覆盖扩库晋升 ${completed}/${promotions.length} · 目标旅程 ${readyJourneys}/${COVERAGE_JOURNEYS.length}`);
if (errors.length) {
  console.log(`⚠️ 覆盖扩库晋升闸门未通过: ${errors.length} 项。`);
  process.exitCode = 1;
} else {
  console.log('✅ 覆盖扩库晋升闸门通过');
}
