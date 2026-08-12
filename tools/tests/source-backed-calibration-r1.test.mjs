import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRiceMealCatalog } from '../lib/rice-meal-catalog-validator.mjs';
import { prepareRatioCatalog } from '../lib/ratio-dsl-validator.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = name => JSON.parse(fs.readFileSync(path.join(here, '../data', name), 'utf8'));
const catalog = read('rice-meal-catalog.v1.json');
const recipes = read('recipe-library.json');
const taxonomy = read('ingredient-taxonomy.v1.json');
const ratios = read('ratio-rules.v1.json');
const templates = read('meal-templates.v2.json');
const collection = read('rice-meal-collection.v1.json');
const sourceEvidence = read('rice-cooker-source-evidence.v1.json');

test('Sichuan pork ribs source contract is admitted only as a two-serving calibration preview', () => {
  const variant = catalog.families.flatMap(family => family.variants || [])
    .find(row => row.variant_id === 'source-sichuan-pork-ribs-rice');
  assert.ok(variant, 'source Sichuan pork ribs calibration variant must exist');
  assert.equal(variant.recipe_id, null);
  assert.equal(variant.status, 'calibration_preview');
  assert.deepEqual(variant.supported_servings, [2]);
  assert.equal(variant.collection_candidate_id, 'source-sichuan-pork-ribs-rice');
  assert.deepEqual(variant.evidence_refs, [{
    kind: 'source',
    id: 'woks-of-love-pork-ribs-rice',
    supports: ['identity', 'quantity', 'liquid', 'appliance', 'process'],
  }]);
  assert.deepEqual(variant.ratio_rule_ids, ['source-sichuan-pork-ribs-rice-calibration-v1']);
  assert.equal(variant.cooker_adaptation.adaptation, 'process_adaptation');
  assert.equal(variant.cooker_adaptation.requires_mid_cook_opening, false);
  assert.equal(variant.cooker_adaptation.completion_status, 'complete');
  assert.deepEqual(variant.safety_endpoints, [
    { canonical_ingredient_id: 'raw-rice', endpoint_code: 'rice_tender' },
    { canonical_ingredient_id: 'pork-ribs', endpoint_code: 'pork_fully_cooked' },
    { canonical_ingredient_id: 'carrot', endpoint_code: 'tender' },
  ]);
  assert.match(variant.review_note, /来源合同|厨房试做/u);
  assert.deepEqual(validateRiceMealCatalog(catalog, {
    recipeLibrary: recipes,
    sourceEvidence,
    taxonomy,
    ratioCatalog: ratios,
    collection,
  }), []);
  const prepared = prepareRatioCatalog(ratios, {
    templates,
    taxonomy,
    recipes,
    riceMealCatalog: catalog,
  });
  assert.equal(prepared.ok, true, prepared.errors.join('\n'));
});

test('Sichuan source calibration is tracked as pending kitchen work, never production-ready', () => {
  const candidate = collection.candidates.find(row => row.candidate_id === 'source-sichuan-pork-ribs-rice');
  const tracking = collection.catalog_tracking.find(row => row.runtime_variant_id === 'source-sichuan-pork-ribs-rice');
  assert.equal(candidate?.status, 'calibration_ready');
  assert.deepEqual(candidate?.runtime_contract, {
    quantity: 'complete',
    liquid: 'complete',
    appliance: 'complete',
    safety: 'complete',
  });
  assert.equal(tracking?.status, 'calibration_ready');
  assert.equal(tracking?.reverse_mapping_id, 'map-source-sichuan-pork-ribs-rice');
  assert.equal(candidate?.blockers?.length, 1);
  assert.match(candidate.blockers[0], /实厨试做/u);
  assert.equal(tracking?.nutrition_grade, 'B');
});
