#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMenuMaster, validateMenuMaster } from './lib/menu-master-builder.mjs';
import { validateRecipeLibrary } from './lib/recipe-library-validator.mjs';
import { validateIngredientTaxonomy } from './lib/ingredient-taxonomy-validator.mjs';
import { validateRegionalMenuResearch } from './lib/regional-menu-research-validator.mjs';
import { validateMenuVerificationCases } from './lib/menu-verification-validator.mjs';
import { buildMenuMasterArtifacts } from './lib/menu-master-renderer.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const SUMMARY = '72 production menus · 24 research candidates · 72 pending verification menus';

function validationErrors({ recipeLibrary, taxonomy, regionalResearch, verificationCases }) {
  const recipeIds = new Set((recipeLibrary.recipes || []).map(recipe => recipe.id));
  const familyIds = new Set((recipeLibrary.families || []).map(family => family.id));
  return [
    ...validateRecipeLibrary(recipeLibrary),
    ...validateIngredientTaxonomy(taxonomy),
    ...validateRegionalMenuResearch(regionalResearch, recipeIds),
    ...validateMenuVerificationCases(verificationCases, recipeIds, familyIds),
  ];
}

export function buildMenuMasterFromFixedInputs() {
  const inputs = {
    recipeLibrary: readJson('tools/data/recipe-library.json'),
    taxonomy: readJson('tools/data/ingredient-taxonomy.v1.json'),
    regionalResearch: readJson('tools/data/regional-menu-research.v1.json'),
    verificationCases: readJson('tools/data/menu-verification-cases.v1.json'),
  };
  const errors = validationErrors(inputs);
  if (errors.length) throw new Error(`Input validation failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  const master = buildMenuMaster(inputs);
  const masterErrors = validateMenuMaster(master);
  if (masterErrors.length) throw new Error(`Menu master validation failed:\n${masterErrors.map(error => `- ${error}`).join('\n')}`);
  return buildMenuMasterArtifacts(master);
}

function main() {
  const [mode] = process.argv.slice(2);
  if (!['--write', '--check'].includes(mode) || process.argv.length !== 3) {
    console.error('Usage: node tools/build-menu-master.mjs --write|--check');
    process.exitCode = 2;
    return;
  }
  const artifacts = buildMenuMasterFromFixedInputs();
  if (mode === '--write') {
    for (const [relativePath, content] of artifacts) {
      const filePath = path.join(ROOT, relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, 'utf8');
    }
    console.log(SUMMARY);
    return;
  }
  const stale = [];
  for (const [relativePath, content] of artifacts) {
    const filePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(filePath) || !fs.readFileSync(filePath).equals(Buffer.from(content, 'utf8'))) stale.push(relativePath);
  }
  if (stale.length) {
    for (const relativePath of stale) console.error(`Missing or stale: ${relativePath}`);
    process.exitCode = 1;
    return;
  }
  console.log(SUMMARY);
}

if (import.meta.main) main();
