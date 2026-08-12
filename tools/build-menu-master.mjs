#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildMenuMaster,
  formatMenuMasterSummary,
  validateMenuMaster,
  validateMenuMasterBaseline,
} from './lib/menu-master-builder.mjs';
import { validateRecipeLibrary } from './lib/recipe-library-validator.mjs';
import { validateIngredientTaxonomy } from './lib/ingredient-taxonomy-validator.mjs';
import { validateRegionalMenuResearch } from './lib/regional-menu-research-validator.mjs';
import { validateMenuVerificationCases } from './lib/menu-verification-validator.mjs';
import { buildMenuMasterArtifacts } from './lib/menu-master-renderer.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
function validationErrors({ recipeLibrary, taxonomy, regionalResearch, verificationCases }) {
  const recipes = Array.isArray(recipeLibrary?.recipes) ? recipeLibrary.recipes : [];
  const families = Array.isArray(recipeLibrary?.families) ? recipeLibrary.families : [];
  const recipeIds = new Set(recipes.filter(recipe => recipe && typeof recipe === 'object').map(recipe => recipe.id));
  const familyIds = new Set(families.filter(family => family && typeof family === 'object').map(family => family.id));
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
    baseline: readJson('tools/data/menu-master-baseline.v1.json'),
  };
  const errors = validationErrors(inputs);
  if (errors.length) throw new Error(`Input validation failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  const master = buildMenuMaster(inputs);
  const masterErrors = validateMenuMaster(master);
  if (masterErrors.length) throw new Error(`Menu master validation failed:\n${masterErrors.map(error => `- ${error}`).join('\n')}`);
  const baselineErrors = validateMenuMasterBaseline(master, inputs.baseline);
  if (baselineErrors.length) throw new Error(`Menu master baseline validation failed:\n${baselineErrors.map(error => `- ${error}`).join('\n')}`);
  return { master, artifacts: buildMenuMasterArtifacts(master) };
}

function main() {
  const [mode] = process.argv.slice(2);
  if (!['--write', '--check'].includes(mode) || process.argv.length !== 3) {
    console.error('Usage: node tools/build-menu-master.mjs --write|--check');
    process.exitCode = 2;
    return;
  }
  let result;
  try {
    result = buildMenuMasterFromFixedInputs();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }
  const { master, artifacts } = result;
  if (mode === '--write') {
    for (const [relativePath, content] of artifacts) {
      const filePath = path.join(ROOT, relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, 'utf8');
    }
    console.log(formatMenuMasterSummary(master));
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
  console.log(formatMenuMasterSummary(master));
}

if (import.meta.main) main();
