#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { validateRiceMealCatalog } from './lib/rice-meal-catalog-validator.mjs';
import { selectRiceMealCandidates } from '../worker/src/rice-meal-selector.js';
import {
  buildRiceMealPlanToken,
  compileRiceMeal,
  verifyAndRecomputeRiceMealPlan,
} from '../worker/src/rice-meal-compiler.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXPECTED = Object.freeze({
  recipeCount: 72,
  familyCount: 3,
  variantCount: 10,
  previewReadyCount: 3,
  plannedCount: 7,
  minimumGradeA: 2,
  journeyCount: 20,
});
const EXCLUDED_LEGACY_CATEGORIES = Object.freeze([
  'legacy-selector',
  'leftover-rice',
  'multi-pot',
  'noodle',
  'porridge',
  'soup-rice',
  'template-planner',
]);
const EXCLUDED_PUBLIC_PATTERN = /饭锅|主食锅|面条|焖面|汤面|剩米饭|炒饭|粥|汤饭|多锅/u;
const BUILD_METADATA = buildId => Object.freeze({
  buildId,
  plannerRollout: 'direct-recommend',
  generationMode: 'deterministic',
  productFocus: 'rice-meal-v1',
});

const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const variantsOf = catalog => (catalog?.families || []).flatMap(family => family?.variants || []);
const actionCodes = variant => ['pre_actions', 'start_actions', 'finish_actions'].flatMap(phase => (
  (variant?.cooker_adaptation?.[phase] || [])
    .slice()
    .sort((left, right) => left.order - right.order)
    .map(action => action.action_code)
));

function selectJourney(journey, assets) {
  const first = selectRiceMealCandidates({
    request: journey.request,
    catalog: assets.catalog,
    taxonomy: assets.taxonomy,
    ratioCatalog: assets.ratioCatalog,
    recentPlanIds: [],
  });
  if (!journey.swap_from_variant_id) return first;
  const current = first.candidates.find(candidate => candidate.variant_id === journey.swap_from_variant_id);
  if (!current) return { ...first, status: 'journey_setup_error', candidates: [] };
  return selectRiceMealCandidates({
    request: { ...journey.request, current_plan_id: current.plan_id },
    catalog: assets.catalog,
    taxonomy: assets.taxonomy,
    ratioCatalog: assets.ratioCatalog,
    recentPlanIds: [],
  });
}

function validateJourney(journey, result) {
  const errors = [];
  const expected = journey.expect || {};
  if (result.status !== expected.status) {
    errors.push(`${journey.id} status expected ${expected.status} but got ${result.status}`);
  }
  if (expected.status === 'ready' && result.candidates?.[0]?.variant_id !== expected.expected_first_variant) {
    errors.push(`${journey.id} first candidate expected ${expected.expected_first_variant} but got ${result.candidates?.[0]?.variant_id || 'none'}`);
  }
  for (const candidate of result.candidates || []) {
    if (!(expected.allowed_variant_ids || []).includes(candidate.variant_id)) {
      errors.push(`${journey.id} emitted unexpected variant ${candidate.variant_id}`);
    }
    if ((expected.forbidden_variant_ids || []).includes(candidate.variant_id)) {
      errors.push(`${journey.id} emitted forbidden variant ${candidate.variant_id}`);
    }
    if (candidate.coverage_count < (expected.min_coverage_count || 0)) {
      errors.push(`${journey.id} candidate ${candidate.variant_id} coverage fell below ${expected.min_coverage_count}`);
    }
    if (!(expected.nutrition_grades || []).includes(candidate.nutrition_grade)) {
      errors.push(`${journey.id} candidate ${candidate.variant_id} has unexpected nutrition grade ${candidate.nutrition_grade}`);
    }
  }
  return errors;
}

function compileJourneyCandidate(candidate, variant, assets) {
  const secret = 'rice-meal-preview-gate-contract-v1';
  const planToken = buildRiceMealPlanToken(candidate, secret);
  const recomputed = verifyAndRecomputeRiceMealPlan({ plan_token: planToken }, {
    catalog: assets.catalog,
    taxonomy: assets.taxonomy,
    ratios: assets.ratioCatalog,
    recipes: assets.recipeLibrary,
  }, secret);
  const output = compileRiceMeal(recomputed, {
    catalog: assets.catalog,
    taxonomy: assets.taxonomy,
    ratios: assets.ratioCatalog,
    recipes: assets.recipeLibrary,
  });
  const meal = output.meals?.[0];
  const errors = [];
  if (output.plan_id !== candidate.plan_id) errors.push(`${variant.variant_id} compiler changed plan_id`);
  if (meal?.dish_name !== variant.display_name) errors.push(`${variant.variant_id} compiler changed the fixed dish name`);
  const materialIds = new Set([
    variant.rice?.canonical_ingredient_id,
    ...(variant.ingredients || []).map(item => item.canonical_ingredient_id),
  ]);
  const compiledIds = new Set((output.plan?.ingredient_amounts || []).map(item => item.canonical_id));
  for (const id of materialIds) {
    if (!compiledIds.has(id)) errors.push(`${variant.variant_id} compiler omitted material ingredient ${id}`);
  }
  const compiledActions = (meal?.steps || []).map(step => step.action_code);
  if (JSON.stringify(compiledActions) !== JSON.stringify(actionCodes(variant))) {
    errors.push(`${variant.variant_id} compiler action protocol differs from reviewed catalog actions`);
  }
  return errors;
}

export function validateRiceMealPreviewGate({
  catalog,
  journeys,
  ratioCatalog,
  recipeLibrary,
  taxonomy,
} = {}) {
  const errors = validateRiceMealCatalog(catalog, { recipeLibrary, taxonomy, ratioCatalog });
  const variants = variantsOf(catalog);
  const active = variants.filter(variant => variant.status === 'preview_ready');
  const planned = variants.filter(variant => variant.status === 'planned');
  const gradeCounts = { A: 0, B: 0, C: 0 };
  for (const variant of active) {
    const grade = variant.nutrition_structure?.grade;
    if (Object.hasOwn(gradeCounts, grade)) gradeCounts[grade] += 1;
    if (grade === 'C') errors.push(`${variant.variant_id} ordinary preview candidate must not be nutrition grade C`);
    if (EXCLUDED_PUBLIC_PATTERN.test(variant.display_name || '')) {
      errors.push(`${variant.variant_id} has a mechanical or excluded public name: ${variant.display_name}`);
    }
    if (variant.cooker_adaptation?.requires_mid_cook_opening === true) {
      errors.push(`${variant.variant_id} must not require mid-cook lid opening`);
    }
  }

  const recipeCount = Array.isArray(recipeLibrary?.recipes) ? recipeLibrary.recipes.length : 0;
  if (recipeCount !== EXPECTED.recipeCount) errors.push(`recipe library must remain ${EXPECTED.recipeCount}, got ${recipeCount}`);
  if ((catalog?.families || []).length !== EXPECTED.familyCount) errors.push(`rice family count must be ${EXPECTED.familyCount}`);
  if (variants.length !== EXPECTED.variantCount) errors.push(`rice variant count must be ${EXPECTED.variantCount}`);
  if (active.length !== EXPECTED.previewReadyCount) errors.push(`preview_ready count must be ${EXPECTED.previewReadyCount}`);
  if (planned.length !== EXPECTED.plannedCount) errors.push(`planned count must be ${EXPECTED.plannedCount}`);
  if (gradeCounts.A < EXPECTED.minimumGradeA) errors.push(`preview needs at least ${EXPECTED.minimumGradeA} grade-A candidates`);
  if (gradeCounts.C !== 0) errors.push('preview must have zero ordinary grade-C candidates');

  const journeyRows = Array.isArray(journeys?.journeys) ? journeys.journeys : [];
  if (journeyRows.length !== EXPECTED.journeyCount) errors.push(`journey count must be ${EXPECTED.journeyCount}`);
  const journeyVariantIds = new Set();
  const compiledVariantIds = new Set();
  const activeById = new Map(active.map(variant => [variant.variant_id, variant]));
  for (const journey of journeyRows) {
    let result;
    try {
      result = selectJourney(journey, { catalog, taxonomy, ratioCatalog });
      errors.push(...validateJourney(journey, result));
    } catch (error) {
      errors.push(`${journey.id} selector failed: ${error?.message || error}`);
      continue;
    }
    const expectedVariantId = journey.expect?.status === 'ready'
      ? journey.expect.expected_first_variant
      : null;
    if (!activeById.has(expectedVariantId)) continue;
    journeyVariantIds.add(expectedVariantId);
    const candidate = result.candidates?.[0];
    if (!candidate || candidate.variant_id !== expectedVariantId) continue;
    try {
      const compileErrors = compileJourneyCandidate(candidate, activeById.get(expectedVariantId), {
        catalog,
        taxonomy,
        ratioCatalog,
        recipeLibrary,
      });
      errors.push(...compileErrors);
      if (compileErrors.length === 0) compiledVariantIds.add(expectedVariantId);
    } catch (error) {
      errors.push(`${expectedVariantId} compile contract failed: ${error?.code || error?.message || error}`);
    }
  }
  for (const variant of active) {
    if (!journeyVariantIds.has(variant.variant_id)) {
      errors.push(`${variant.variant_id} has no deterministic first-candidate journey`);
    } else if (!compiledVariantIds.has(variant.variant_id)) {
      errors.push(`${variant.variant_id} has no passing compile contract`);
    }
  }

  return {
    errors: [...new Set(errors)],
    summary: {
      catalog_version: catalog?.catalog_version || null,
      recipe_count: recipeCount,
      family_count: (catalog?.families || []).length,
      variant_count: variants.length,
      preview_ready_count: active.length,
      planned_count: planned.length,
      nutrition_grade_counts: gradeCounts,
      journey_count: journeyRows.length,
      journey_variant_ids: [...journeyVariantIds].sort(),
      compiled_variant_ids: [...compiledVariantIds].sort(),
      excluded_legacy_categories: [...EXCLUDED_LEGACY_CATEGORIES],
    },
  };
}

function unavailableAssets() {
  return { async fetch() { throw new Error('gate build must use embedded assets'); } };
}

function throwingBudget() {
  return {
    reads: 0,
    writes: 0,
    async get() { this.reads += 1; throw new Error('rice gate must not read budget'); },
    async put() { this.writes += 1; throw new Error('rice gate must not write budget'); },
  };
}

async function responseJson(worker, pathname, body, env) {
  const response = await worker.fetch(new Request(`https://rice-gate.example${pathname}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }), env);
  let json;
  try { json = await response.json(); } catch (_error) { json = null; }
  return { response, json };
}

export async function auditRiceMealPreviewRuntime({ buildId = 'rice-meal-gate' } = {}) {
  const outputDir = path.join(ROOT, 'dist', `.rice-meal-preview-gate-${process.pid}-${Date.now()}`);
  const errors = [];
  const summary = {
    build_metadata: null,
    health_catalog_status: null,
    health_mismatch_status: null,
    model_calls: 0,
    budget_reads: 0,
    budget_writes: 0,
    built_asset_count: 0,
  };
  try {
    const build = spawnSync(process.execPath, [
      path.join(ROOT, 'tools', 'build-dist.mjs'),
      '--out-dir', outputDir,
      '--build-id', buildId,
      '--planner-rollout', 'direct-recommend',
      '--generation-mode', 'deterministic',
      '--product-focus', 'rice-meal-v1',
    ], { cwd: ROOT, encoding: 'utf8' });
    if (build.status !== 0) {
      return { errors: [`rice build failed: ${[build.stdout, build.stderr].filter(Boolean).join('\n').trim()}`], summary };
    }
    const expectedMetadata = BUILD_METADATA(buildId);
    const metadata = readJson(path.relative(ROOT, path.join(outputDir, 'build-meta.json')));
    summary.build_metadata = metadata;
    if (JSON.stringify(metadata) !== JSON.stringify(expectedMetadata)) errors.push('built metadata does not match rice Preview contract');

    const sourcePairs = [
      ['tools/data/rice-meal-catalog.v1.json', 'rice-meal-catalog.v1.json'],
      ['tools/data/ratio-rules.v1.json', 'ratio-rules.v1.json'],
      ['tools/data/ingredient-taxonomy.v1.json', 'ingredient-taxonomy.v1.json'],
      ['tools/data/recipe-library.json', 'recipe-library.json'],
      ['tools/data/foods-tw.json', 'foods-tw.json'],
      ['worker/src/rice-meal-selector.js', 'rice-meal-selector.js'],
      ['worker/src/rice-meal-compiler.js', 'rice-meal-compiler.js'],
      ['worker/src/rice-meal-catalog-validator.js', 'rice-meal-catalog-validator.js'],
    ];
    for (const [source, built] of sourcePairs) {
      const sourceBytes = fs.readFileSync(path.join(ROOT, source));
      const builtPath = path.join(outputDir, built);
      if (!fs.existsSync(builtPath) || !fs.readFileSync(builtPath).equals(sourceBytes)) {
        errors.push(`${built} is missing or stale in the build graph`);
      }
    }
    summary.built_asset_count = fs.readdirSync(outputDir).length;

    const workerUrl = `${pathToFileURL(path.join(outputDir, '_worker.js')).href}?gate=${Date.now()}`;
    const { default: builtWorker } = await import(workerUrl);
    const budget = throwingBudget();
    const env = {
      ASSETS: unavailableAssets(),
      RATE_KV: budget,
      RICE_MEAL_PLAN_SECRET: 'rice-meal-preview-gate-runtime-secret',
    };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      summary.model_calls += 1;
      throw new Error('rice Preview must not call a model');
    };
    try {
      const health = await responseJson(builtWorker, '/health', undefined, env);
      summary.health_catalog_status = health.json?.riceMealCatalog || null;
      if (health.response.status !== 200 || health.json?.productFocus !== 'rice-meal-v1'
          || health.json?.riceMealCatalog !== 'ok' || health.json?.baseRecipes !== 72
          || health.json?.riceMealFamilies !== 3 || health.json?.riceMealVariants !== 10
          || health.json?.riceMealPreviewReady !== 3 || health.json?.riceMealPlanned !== 7) {
        errors.push('built /health does not report the exact rice Preview catalog facts');
      }
      const planned = await responseJson(builtWorker, '/plan-meal', {
        schema_version: 3,
        product_focus: 'rice_meal',
        servings: 2,
        pantry: ['鸡腿', '土豆'],
        dislikes: [],
      }, env);
      if (planned.response.status !== 200 || planned.json?.status !== 'ready' || !planned.json?.candidates?.[0]?.plan_token) {
        errors.push('built /plan-meal did not return a signed deterministic rice candidate');
      } else {
        const generated = await responseJson(builtWorker, '/generate-plan', {
          plan_token: planned.json.candidates[0].plan_token,
        }, env);
        if (generated.response.status !== 200 || generated.json?.status !== 'ready') {
          errors.push('built /generate-plan did not compile the signed candidate');
        }
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
    summary.budget_reads = budget.reads;
    summary.budget_writes = budget.writes;
    if (summary.model_calls !== 0) errors.push(`rice Preview made ${summary.model_calls} model calls`);
    if (budget.reads !== 0 || budget.writes !== 0) errors.push(`rice Preview touched generation budget reads=${budget.reads} writes=${budget.writes}`);

    const brokenWorkerPath = path.join(outputDir, '_worker-broken-metadata.mjs');
    const builtSource = fs.readFileSync(path.join(outputDir, '_worker.js'), 'utf8');
    fs.writeFileSync(brokenWorkerPath, builtSource.replace(
      /const COMPILED_BUILD_METADATA_JSON = [^;]+;/u,
      "const COMPILED_BUILD_METADATA_JSON = 'not-valid-json';",
    ));
    const { default: brokenWorker } = await import(`${pathToFileURL(brokenWorkerPath).href}?broken=${Date.now()}`);
    const brokenHealth = await responseJson(brokenWorker, '/health', undefined, { ASSETS: unavailableAssets() });
    summary.health_mismatch_status = brokenHealth.json?.riceMealCatalog || null;
    if (brokenHealth.json?.buildMetadata !== 'unavailable' || brokenHealth.json?.riceMealCatalog !== 'unavailable') {
      errors.push('health reported rice assets ok despite missing or mismatched build metadata');
    }
  } catch (error) {
    errors.push(`runtime audit failed: ${error?.stack || error}`);
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  return { errors, summary };
}

function loadSourceAssets() {
  return {
    catalog: readJson('tools/data/rice-meal-catalog.v1.json'),
    journeys: readJson('tools/data/rice-meal-journeys.v1.json'),
    ratioCatalog: readJson('tools/data/ratio-rules.v1.json'),
    recipeLibrary: readJson('tools/data/recipe-library.json'),
    taxonomy: readJson('tools/data/ingredient-taxonomy.v1.json'),
  };
}

async function main() {
  const staticReport = validateRiceMealPreviewGate(loadSourceAssets());
  const runtimeReport = await auditRiceMealPreviewRuntime({ buildId: 'rice-meal-gate' });
  const errors = [...staticReport.errors, ...runtimeReport.errors];
  if (errors.length) {
    console.error('Rice meal Preview gate failed:');
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }
  const summary = staticReport.summary;
  console.log([
    'Rice meal Preview gate ok',
    `catalog=${summary.catalog_version}`,
    `families=${summary.family_count}`,
    `variants=${summary.variant_count}`,
    `preview_ready=${summary.preview_ready_count}`,
    `planned=${summary.planned_count}`,
    `grades=A:${summary.nutrition_grade_counts.A},B:${summary.nutrition_grade_counts.B},C:${summary.nutrition_grade_counts.C}`,
    `journeys=${summary.journey_count}`,
    `compiled=${summary.compiled_variant_ids.length}/${summary.preview_ready_count}`,
    'model_calls=0',
    'budget_changes=0',
    `excluded=${summary.excluded_legacy_categories.join(',')}`,
  ].join(' · '));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
