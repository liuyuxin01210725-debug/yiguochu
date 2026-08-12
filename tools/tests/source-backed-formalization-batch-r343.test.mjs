import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateRiceMealCatalog } from '../lib/rice-meal-catalog-validator.mjs';
import { prepareRatioCatalog } from '../../worker/src/ratio-dsl.js';

const read = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const catalog = read('rice-meal-catalog.v1.json');
const ratios = read('ratio-rules.v1.json');
const recipes = read('recipe-library.json');
const taxonomy = read('ingredient-taxonomy.v1.json');
const templates = read('meal-templates.v2.json');
const collection = read('rice-meal-collection.v1.json');
const sourceEvidence = read('rice-cooker-source-evidence.v1.json');
const journeys = read('rice-meal-journeys.v1.json');

const targets = [
  ['source-tatung-beef-burdock-rice', 'tatung-beef-burdock-takikomi-rice'],
  ['source-tiger-pork-bamboo-rice', 'tiger-pork-bamboo-rice'],
  ['source-tatung-pork-daikon-rice', 'tatung-pork-daikon-rice'],
  ['source-tatung-wakayama-ginger-rice', 'tatung-wakayama-ginger-rice'],
];

const variants = () => catalog.families.flatMap(family => family.variants || []);

test('r343 adds four source-bounded calibration previews without changing the formal 72', () => {
  for (const [variantId, sourceId] of targets) {
    const variant = variants().find(row => row.variant_id === variantId);
    assert.ok(variant, `${variantId} must exist`);
    assert.equal(variant.recipe_id, null);
    assert.equal(variant.status, 'calibration_preview');
    assert.deepEqual(variant.supported_servings, [2]);
    assert.equal(variant.collection_candidate_id, variantId);
    assert.ok(variant.evidence_refs.some(ref => ref.kind === 'source' && ref.id === sourceId));
    assert.equal(variant.ratio_rule_ids.length, 1);
    assert.equal(variant.cooker_adaptation.completion_status, 'complete');
    assert.equal(variant.cooker_adaptation.requires_mid_cook_opening, false);
    assert.ok(variant.source_refs.length > 0);

    const candidate = collection.candidates.find(row => row.candidate_id === variantId);
    assert.equal(candidate?.status, 'calibration_ready', variantId);
    assert.deepEqual(candidate?.runtime_contract, {
      quantity: 'complete',
      liquid: 'complete',
      appliance: 'complete',
      safety: 'complete',
    });
    assert.ok(candidate?.blockers?.some(note => /实厨试做/u.test(note)), variantId);

    const tracking = collection.catalog_tracking.find(row => row.runtime_variant_id === variantId);
    assert.equal(tracking?.status, 'calibration_ready', variantId);
    assert.equal(tracking?.candidate_id, variantId);
    assert.equal(tracking?.reverse_mapping_id, `map-${variantId}`);

    const journey = journeys.journeys.find(row => row.id === `RM-3${43 + targets.findIndex(item => item[0] === variantId)}-${variantId}`);
    assert.ok(journey, `${variantId} must have a calibration journey fixture`);
    assert.equal(journey.rice_catalog_scope, 'calibration');
  }

  const errors = validateRiceMealCatalog(catalog, {
    recipeLibrary: recipes,
    sourceEvidence,
    taxonomy,
    ratioCatalog: ratios,
    collection,
  });
  assert.deepEqual(errors, []);
  const prepared = prepareRatioCatalog(ratios, {
    templates,
    taxonomy,
    recipes,
    riceMealCatalog: catalog,
  });
  assert.equal(prepared.ok, true, prepared.errors.join('\n'));
});

test('r343 keeps all four variants calibration-only and out of production Planner', () => {
  for (const [variantId] of targets) {
    const variant = variants().find(row => row.variant_id === variantId);
    assert.equal(variant?.recipe_id, null, variantId);
    assert.deepEqual(variant?.status_history, ['research_only', 'fact_checked', 'planned', 'calibration_preview']);
    assert.equal(variant?.preview_notice_code, 'household_test_pending_feedback');
    assert.equal(collection.candidates.find(row => row.candidate_id === variantId)?.status, 'calibration_ready');
  }
  assert.equal(recipes.recipes.length, 72);
});
