#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  buildPlannerMenuCoverage,
  formatPlannerMenuCoverageSummary,
  validatePlannerMenuCoverage,
} from './lib/planner-menu-coverage-builder.mjs';
import { buildPlannerMenuCoverageArtifacts } from './lib/planner-menu-coverage-renderer.mjs';
import { validateRecipeLibrary } from './lib/recipe-library-validator.mjs';
import { validateIngredientTaxonomy } from './lib/ingredient-taxonomy-validator.mjs';
import { validateMealTemplateCatalog } from './lib/meal-template-validator.mjs';
import { validateRatioDslCatalog } from './lib/ratio-dsl-validator.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE_PATHS = [
  'tools/data/recipe-library.json',
  'tools/data/ingredient-taxonomy.v1.json',
  'tools/data/meal-templates.v2.json',
  'tools/data/ratio-rules.v1.json',
  'tools/data/regional-menu-mappings.v1.json',
  'tools/data/menu-master-baseline.v1.json',
];

function readSource(relativePath) {
  const raw = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
  return {
    raw,
    value: JSON.parse(raw),
    hash: createHash('sha256').update(raw).digest('hex'),
  };
}

function mappingAndBaselineErrors(mappings, baseline) {
  const errors = [];
  const rows = Array.isArray(mappings?.production_recipe_mappings) ? mappings.production_recipe_mappings : [];
  const ids = rows.map(row => row?.source_id);
  if (!Array.isArray(mappings?.production_recipe_mappings)) errors.push('production_recipe_mappings must be an array');
  if (new Set(ids).size !== ids.length) errors.push('production recipe mappings must have unique source IDs');
  if (!Array.isArray(baseline?.production_menus)) errors.push('menu master baseline production_menus must be an array');
  return errors;
}

export function buildPlannerMenuCoverageFromFixedInputs() {
  const sources = Object.fromEntries(SOURCE_PATHS.map(relativePath => [relativePath, readSource(relativePath)]));
  const recipeLibrary = sources[SOURCE_PATHS[0]].value;
  const taxonomy = sources[SOURCE_PATHS[1]].value;
  const templates = sources[SOURCE_PATHS[2]].value;
  const ratios = sources[SOURCE_PATHS[3]].value;
  const mappings = sources[SOURCE_PATHS[4]].value;
  const baseline = sources[SOURCE_PATHS[5]].value;
  const sourceErrors = [
    ...validateRecipeLibrary(recipeLibrary),
    ...validateIngredientTaxonomy(taxonomy),
    ...validateMealTemplateCatalog(templates, taxonomy, recipeLibrary),
    ...validateRatioDslCatalog(ratios, templates, taxonomy, recipeLibrary),
    ...mappingAndBaselineErrors(mappings, baseline),
  ];
  if (sourceErrors.length) throw new Error(`Input validation failed:\n${sourceErrors.map(error => `- ${error}`).join('\n')}`);
  const inputs = {
    recipeLibrary,
    taxonomy,
    templates,
    ratios,
    mappings,
    baseline,
    sourceHashes: Object.fromEntries(SOURCE_PATHS.map(relativePath => [relativePath, sources[relativePath].hash])),
  };
  const report = buildPlannerMenuCoverage(inputs);
  const reportErrors = validatePlannerMenuCoverage(report, inputs);
  if (reportErrors.length) throw new Error(`Planner menu coverage validation failed:\n${reportErrors.map(error => `- ${error}`).join('\n')}`);
  return { report, artifacts: buildPlannerMenuCoverageArtifacts(report) };
}

function main() {
  const [mode] = process.argv.slice(2);
  if (!['--write', '--check'].includes(mode) || process.argv.length !== 3) {
    console.error('Usage: node tools/build-planner-menu-coverage.mjs --write|--check');
    process.exitCode = 2;
    return;
  }
  let result;
  try {
    result = buildPlannerMenuCoverageFromFixedInputs();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }
  if (mode === '--write') {
    for (const [relativePath, content] of result.artifacts) {
      const target = path.join(ROOT, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive:true });
      fs.writeFileSync(target, content, 'utf8');
    }
    console.log(formatPlannerMenuCoverageSummary(result.report));
    return;
  }
  const stale = [];
  for (const [relativePath, content] of result.artifacts) {
    const target = path.join(ROOT, relativePath);
    if (!fs.existsSync(target) || !fs.readFileSync(target).equals(Buffer.from(content, 'utf8'))) stale.push(relativePath);
  }
  if (stale.length) {
    for (const relativePath of stale) console.error(`Missing or stale: ${relativePath}`);
    process.exitCode = 1;
    return;
  }
  console.log(formatPlannerMenuCoverageSummary(result.report));
}

if (import.meta.main) main();
