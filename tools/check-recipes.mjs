#!/usr/bin/env node
import fs from 'node:fs';
import { validateRecipeLibrary } from './lib/recipe-library-validator.mjs';
import { validateCoverageRecipePromotion } from './lib/coverage-recipe-promotion-gate.mjs';

const file = new URL('./data/recipe-library.json', import.meta.url);
const lib = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = validateRecipeLibrary(lib);
const coverageCandidates = JSON.parse(fs.readFileSync(new URL('./data/coverage-recipe-candidates.json', import.meta.url), 'utf8'));
const coverageDrafts = JSON.parse(fs.readFileSync(new URL('./data/coverage-recipe-drafts.json', import.meta.url), 'utf8'));
const coveragePromotions = JSON.parse(fs.readFileSync(new URL('./data/coverage-recipe-promotions.json', import.meta.url), 'utf8'));
errors.push(...validateCoverageRecipePromotion({
  candidates: coverageCandidates,
  drafts: coverageDrafts,
  promotions: coveragePromotions.promotions,
  production: lib,
}));
for (const error of errors) console.error(`❌ ${error}`);
const familyCount = Array.isArray(lib?.families) ? lib.families.length : 0;
const recipeCount = Array.isArray(lib?.recipes) ? lib.recipes.length : 0;
const approvedCount = Array.isArray(lib?.recipes)
  ? lib.recipes.filter(recipe => recipe?.status === 'approved').length
  : 0;
const autoApprovedCount = Array.isArray(lib?.recipes)
  ? lib.recipes.filter(recipe => recipe?.status === 'auto_approved').length
  : 0;
console.log(`菜谱家族 ${familyCount} 个 · 基础菜谱 ${recipeCount} 道（approved 人工批准 ${approvedCount} 道 · auto_approved 自动闸门通过待评审 ${autoApprovedCount} 道）`);
console.log(errors.length ? `❌ 菜谱库体检不通过: ${errors.length} 项` : '✅ 菜谱库体检通过');
process.exit(errors.length ? 1 : 0);
