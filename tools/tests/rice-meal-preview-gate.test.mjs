import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  auditRiceMealPreviewRuntime,
  validateRiceMealPreviewGate,
} from '../check-rice-meal-preview.mjs';

const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const assets = Object.freeze({
  catalog: readJson('rice-meal-catalog.v1.json'),
  journeys: readJson('rice-meal-journeys.v1.json'),
  ratioCatalog: readJson('ratio-rules.v1.json'),
  recipeLibrary: readJson('recipe-library.json'),
  taxonomy: readJson('ingredient-taxonomy.v1.json'),
});
const clone = value => structuredClone(value);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mutateVariant = (catalog, variantId, mutate) => {
  const variant = catalog.families.flatMap(family => family.variants).find(row => row.variant_id === variantId);
  assert.ok(variant, `fixture variant missing: ${variantId}`);
  mutate(variant);
};

test('release gate reports the reviewed rice-meal Preview facts and compiles every active variant', () => {
  const report = validateRiceMealPreviewGate(assets);

  assert.deepEqual(report.errors, []);
  assert.equal(report.summary.catalog_version, 'rice-meal-catalog-v1-20260801-r4');
  assert.equal(report.summary.recipe_count, 72);
  assert.equal(report.summary.family_count, 3);
  assert.equal(report.summary.variant_count, 10);
  assert.equal(report.summary.preview_ready_count, 2);
  assert.equal(report.summary.planned_count, 8);
  assert.deepEqual(report.summary.nutrition_grade_counts, { A: 1, B: 1, C: 0 });
  assert.equal(report.summary.journey_count, 20);
  assert.deepEqual(report.summary.journey_variant_ids, [
    'home-chicken-leg-potato-rice',
    'home-corn-carrot-chicken-leg-rice',
  ]);
  assert.deepEqual(report.summary.compiled_variant_ids, report.summary.journey_variant_ids);
  assert.deepEqual(report.summary.excluded_legacy_categories, [
    'legacy-selector',
    'leftover-rice',
    'multi-pot',
    'noodle',
    'porridge',
    'soup-rice',
    'template-planner',
  ]);
});

test('release gate rejects ordinary C candidates and mechanical or excluded category names', () => {
  const catalog = clone(assets.catalog);
  mutateVariant(catalog, 'home-chicken-leg-potato-rice', variant => {
    variant.nutrition_structure.grade = 'C';
    variant.display_name = '鸡腿土豆主食锅';
  });

  const report = validateRiceMealPreviewGate({ ...assets, catalog });
  assert.match(report.errors.join('\n'), /ordinary preview candidate must not be nutrition grade C/u);
  assert.match(report.errors.join('\n'), /mechanical or excluded public name/u);
});

test('release gate rejects missing executable ratios, incomplete actions and mid-cycle lid opening', () => {
  const catalog = clone(assets.catalog);
  mutateVariant(catalog, 'home-chicken-leg-potato-rice', variant => {
    variant.ingredients[0].amount_rule_id = null;
    for (const phase of ['pre_actions', 'start_actions', 'finish_actions']) {
      for (const action of variant.cooker_adaptation[phase]) {
        action.ingredient_ids = action.ingredient_ids.filter(id => id !== 'chicken-leg');
      }
    }
    variant.cooker_adaptation.requires_mid_cook_opening = true;
  });

  const report = validateRiceMealPreviewGate({ ...assets, catalog });
  const errors = report.errors.join('\n');
  assert.match(errors, /major ingredient must declare amount_rule_id/u);
  assert.match(errors, /must reference every material ingredient across ordered actions: chicken-leg/u);
  assert.match(errors, /must not require mid-cook lid opening/u);
});

test('release gate rejects an active variant without a deterministic journey and compile contract', () => {
  const journeys = clone(assets.journeys);
  journeys.journeys = journeys.journeys.filter(journey => (
    journey.expect?.expected_first_variant !== 'home-corn-carrot-chicken-leg-rice'
  ));

  const report = validateRiceMealPreviewGate({ ...assets, journeys });
  assert.match(report.errors.join('\n'), /home-corn-carrot-chicken-leg-rice has no deterministic first-candidate journey/u);
  assert.equal(report.summary.compiled_variant_ids.includes('home-corn-carrot-chicken-leg-rice'), false);
});

test('runtime audit proves exact build metadata, truthful health and zero model or budget work', async () => {
  const report = await auditRiceMealPreviewRuntime({ buildId: 'rice-meal-gate-test' });

  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.summary.build_metadata, {
    buildId: 'rice-meal-gate-test',
    plannerRollout: 'direct-recommend',
    generationMode: 'deterministic',
    productFocus: 'rice-meal-v1',
  });
  assert.equal(report.summary.health_catalog_status, 'ok');
  assert.equal(report.summary.health_mismatch_status, 'unavailable');
  assert.equal(report.summary.model_calls, 0);
  assert.equal(report.summary.budget_reads, 0);
  assert.equal(report.summary.budget_writes, 0);
  assert.equal(report.summary.built_asset_count > 10, true);
});

test('build command rejects a rice product focus unless rollout and generation metadata are exact', () => {
  const outputDir = path.join(root, 'dist', `.rice-gate-invalid-${process.pid}`);
  try {
    const result = spawnSync(process.execPath, [
      path.join(root, 'tools', 'build-dist.mjs'),
      '--out-dir', outputDir,
      '--build-id', 'invalid-rice-gate',
      '--planner-rollout', 'off',
      '--generation-mode', 'llm',
      '--product-focus', 'rice-meal-v1',
    ], { cwd: root, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /rice-meal-v1 requires direct-recommend and deterministic/i);
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});
