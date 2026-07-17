#!/usr/bin/env node
import fs from 'node:fs';
import { validateRecipeDraftLibrary } from './lib/recipe-draft-validator.mjs';
import { validateSixDraftReleaseGate } from './lib/recipe-draft-release-gate.mjs';

const draftFile = new URL('./data/recipe-drafts.json', import.meta.url);
const candidateFile = new URL('./data/recipe-candidates.json', import.meta.url);
const productionFile = new URL('./data/recipe-library.json', import.meta.url);
const drafts = JSON.parse(fs.readFileSync(draftFile, 'utf8'));
const candidates = JSON.parse(fs.readFileSync(candidateFile, 'utf8'));
const production = JSON.parse(fs.readFileSync(productionFile, 'utf8'));
const errors = validateRecipeDraftLibrary(drafts, candidates);
errors.push(...validateSixDraftReleaseGate(drafts, candidates));
const draftEntries = Array.isArray(drafts?.drafts) ? drafts.drafts : [];
const productionFamilies = Array.isArray(production?.families) ? production.families : [];
const productionRecipes = Array.isArray(production?.recipes) ? production.recipes : [];

if (draftEntries.length < 6 || draftEntries.length > 30) {
  errors.push('draft library must contain from 6 to 30 drafts during expansion');
}
if (draftEntries.some(draft => draft?.status !== 'draft')) errors.push('draft library must contain only draft entries');
if (productionFamilies.length !== 9) errors.push('production library must contain exactly 9 families');
if (productionRecipes.length !== 12) errors.push('production library must contain exactly 12 recipes');
if (productionRecipes.some(recipe => recipe?.status !== 'approved')) {
  errors.push('production library recipes must all be approved');
}
if (draftEntries.some(draft => productionRecipes.some(recipe => recipe?.id === draft?.id))) {
  errors.push('draft ids must not overlap production recipe ids');
}

for (const error of errors) console.error(`❌ ${error}`);
const productionCount = draftEntries.filter(draft => draft?.status === 'approved').length;
console.log(`传统一锅草案 ${draftEntries.length} 道 · 生产可用 ${productionCount} 道`);
console.log(errors.length ? `❌ 传统一锅草案体检不通过: ${errors.length} 项` : '✅ 传统一锅草案体检通过');
process.exit(errors.length ? 1 : 0);
