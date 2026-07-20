#!/usr/bin/env node
import fs from 'node:fs';
import { validateRecipeDraftLibrary } from './lib/recipe-draft-validator.mjs';
import { validateThirtyDraftReleaseGate } from './lib/recipe-draft-release-gate.mjs';

function fileArgument(name, defaultFile) {
  const index = process.argv.indexOf(name);
  return index === -1 ? defaultFile : process.argv[index + 1];
}

const draftFile = fileArgument('--draft-file', new URL('./data/recipe-drafts.json', import.meta.url));
const candidateFile = fileArgument('--candidate-file', new URL('./data/recipe-candidates.json', import.meta.url));
const productionFile = fileArgument('--production-file', new URL('./data/recipe-library.json', import.meta.url));
const drafts = JSON.parse(fs.readFileSync(draftFile, 'utf8'));
const candidates = JSON.parse(fs.readFileSync(candidateFile, 'utf8'));
const production = JSON.parse(fs.readFileSync(productionFile, 'utf8'));
const errors = validateRecipeDraftLibrary(drafts, candidates);
errors.push(...validateThirtyDraftReleaseGate(drafts, candidates));
const draftEntries = Array.isArray(drafts?.drafts) ? drafts.drafts : [];
const productionFamilies = Array.isArray(production?.families) ? production.families : [];
const productionRecipes = Array.isArray(production?.recipes) ? production.recipes : [];

if (draftEntries.length !== 30) {
  errors.push('draft library must contain exactly 30 drafts');
}
if (draftEntries.some(draft => draft?.status !== 'draft')) errors.push('draft library must contain only draft entries');
if (productionFamilies.length !== 21) errors.push('production library must contain exactly 21 families');
if (productionRecipes.length !== 72) errors.push('production library must contain exactly 72 recipes');
const approvedCount = productionRecipes.filter(recipe => recipe?.status === 'approved').length;
const autoApprovedCount = productionRecipes.filter(recipe => recipe?.status === 'auto_approved').length;
if (approvedCount !== 12 || autoApprovedCount !== 60) {
  errors.push(`production library must contain exactly 12 approved (human-approved) and 60 auto_approved (auto-gate passed, pending human review) recipes; got ${approvedCount} approved and ${autoApprovedCount} auto_approved`);
}
if (draftEntries.some(draft => productionRecipes.some(recipe => recipe?.id === draft?.id))) {
  errors.push('draft ids must not overlap production recipe ids');
}

for (const error of errors) console.error(`❌ ${error}`);
const productionCount = draftEntries.filter(draft => draft?.status === 'approved').length;
console.log(`传统一锅草案 ${draftEntries.length} 道 · 生产可用 ${productionCount} 道`);
console.log(errors.length ? `❌ 传统一锅草案体检不通过: ${errors.length} 项` : '✅ 传统一锅草案体检通过');
process.exit(errors.length ? 1 : 0);
