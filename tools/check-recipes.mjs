#!/usr/bin/env node
import fs from 'node:fs';
import { validateRecipeLibrary } from './lib/recipe-library-validator.mjs';
import { validateCoverageRecipePromotion } from './lib/coverage-recipe-promotion-gate.mjs';
import { validateIngredientTaxonomy } from './lib/ingredient-taxonomy-validator.mjs';
import { validateMealTemplateCatalog } from './lib/meal-template-validator.mjs';
import { validateRatioDslCatalog } from './lib/ratio-dsl-validator.mjs';
import { validateRegionalMenuResearch } from './lib/regional-menu-research-validator.mjs';
import { validateMenuVerificationCases } from './lib/menu-verification-validator.mjs';
import { buildMenuMaster, validateMenuMaster } from './lib/menu-master-builder.mjs';
import { buildMenuMasterArtifacts } from './lib/menu-master-renderer.mjs';

const file = new URL('./data/recipe-library.json', import.meta.url);
const lib = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = validateRecipeLibrary(lib);
const menuMasterInputErrors = [];
function readMenuMasterLedger(relativePath, label) {
  const fileUrl = new URL(relativePath, import.meta.url);
  if (!fs.existsSync(fileUrl)) {
    menuMasterInputErrors.push(`${label} is missing`);
    return {};
  }
  return JSON.parse(fs.readFileSync(fileUrl, 'utf8'));
}
const coverageCandidates = JSON.parse(fs.readFileSync(new URL('./data/coverage-recipe-candidates.json', import.meta.url), 'utf8'));
const coverageDrafts = JSON.parse(fs.readFileSync(new URL('./data/coverage-recipe-drafts.json', import.meta.url), 'utf8'));
const coveragePromotions = JSON.parse(fs.readFileSync(new URL('./data/coverage-recipe-promotions.json', import.meta.url), 'utf8'));
const taxonomy = JSON.parse(fs.readFileSync(new URL('./data/ingredient-taxonomy.v1.json', import.meta.url), 'utf8'));
const templates = JSON.parse(fs.readFileSync(new URL('./data/meal-templates.v2.json', import.meta.url), 'utf8'));
const ratios = JSON.parse(fs.readFileSync(new URL('./data/ratio-rules.v1.json', import.meta.url), 'utf8'));
const regionalResearch = readMenuMasterLedger('./data/regional-menu-research.v1.json', 'regional menu research ledger');
const verificationCases = readMenuMasterLedger('./data/menu-verification-cases.v1.json', 'menu verification cases ledger');
errors.push(...validateCoverageRecipePromotion({
  candidates: coverageCandidates,
  drafts: coverageDrafts,
  promotions: coveragePromotions.promotions,
  production: lib,
}));
const taxonomyErrors = validateIngredientTaxonomy(taxonomy);
const templateErrors = validateMealTemplateCatalog(templates, taxonomy, lib);
const ratioErrors = validateRatioDslCatalog(ratios, templates, taxonomy, lib);
errors.push(...taxonomyErrors, ...templateErrors, ...ratioErrors);
const recipes = Array.isArray(lib.recipes) ? lib.recipes : [];
const families = Array.isArray(lib.families) ? lib.families : [];
const recipeIds = new Set(recipes.map(recipe => recipe.id));
const familyIds = new Set(families.map(family => family.id));
const menuMaster = buildMenuMaster({
  recipeLibrary: { ...lib, recipes, families },
  taxonomy: { ...taxonomy, items: Array.isArray(taxonomy?.items) ? taxonomy.items : [] },
  regionalResearch: { ...regionalResearch, entries: Array.isArray(regionalResearch?.entries) ? regionalResearch.entries : [] },
  verificationCases: { ...verificationCases, entries: Array.isArray(verificationCases?.entries) ? verificationCases.entries : [] },
});
const menuMasterErrors = [
  ...menuMasterInputErrors,
  ...validateRegionalMenuResearch(regionalResearch, recipeIds),
  ...validateMenuVerificationCases(verificationCases, recipeIds, familyIds),
  ...validateMenuMaster(menuMaster),
];
for (const [relativePath, content] of buildMenuMasterArtifacts(menuMaster)) {
  const artifact = new URL(`../${relativePath}`, import.meta.url);
  if (!fs.existsSync(artifact) || !fs.readFileSync(artifact).equals(Buffer.from(content, 'utf8'))) {
    menuMasterErrors.push(`${relativePath} is missing or stale; run node tools/build-menu-master.mjs --write intentionally`);
  }
}
errors.push(...menuMasterErrors);
for (const error of errors) console.error(`❌ ${error}`);
const familyCount = Array.isArray(lib?.families) ? lib.families.length : 0;
const recipeCount = Array.isArray(lib?.recipes) ? lib.recipes.length : 0;
const approvedCount = Array.isArray(lib?.recipes)
  ? lib.recipes.filter(recipe => recipe?.status === 'approved').length
  : 0;
const autoApprovedCount = Array.isArray(lib?.recipes)
  ? lib.recipes.filter(recipe => recipe?.status === 'auto_approved').length
  : 0;
const activeTemplateCount = Array.isArray(templates?.templates)
  ? templates.templates.filter(template => template?.activation_status === 'active' && template?.runtime_eligible === true).length
  : 0;
const plannedTemplateCount = Array.isArray(templates?.templates)
  ? templates.templates.filter(template => template?.activation_status === 'planned' && template?.runtime_eligible === false).length
  : 0;
console.log(`菜谱家族 ${familyCount} 个 · 基础菜谱 ${recipeCount} 道（approved 人工批准 ${approvedCount} 道 · auto_approved 自动闸门通过待评审 ${autoApprovedCount} 道）`);
console.log([
  `${recipeCount} recipes`,
  `${activeTemplateCount} active templates`,
  `${plannedTemplateCount} planned templates`,
  taxonomyErrors.length ? `taxonomy invalid (${taxonomyErrors.length})` : 'taxonomy ok',
  ratioErrors.length ? `ratio DSL invalid (${ratioErrors.length})` : 'ratio DSL ok',
].join(' · '));
if (menuMasterErrors.length === 0) {
  console.log(`${menuMaster.summary.production_count} production menus · ${menuMaster.summary.research_count} research candidates · menu master ok`);
}
console.log(errors.length ? `❌ 菜谱库体检不通过: ${errors.length} 项` : '✅ 菜谱库体检通过');
process.exit(errors.length ? 1 : 0);
