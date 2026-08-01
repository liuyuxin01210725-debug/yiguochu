import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateRiceMealCollection } from '../lib/rice-meal-collection-validator.mjs';

const readJson = async name => JSON.parse(await readFile(new URL(`../data/${name}`, import.meta.url), 'utf8'));

test('national rice-meal collection records all research candidates, exclusions, regional gaps and current catalog tracking', async () => {
  const [collection, taxonomy, catalog] = await Promise.all([
    readJson('rice-meal-collection.v1.json'),
    readJson('ingredient-taxonomy.v1.json'),
    readJson('rice-meal-catalog.v1.json'),
  ]);
  assert.deepEqual(validateRiceMealCollection(collection, { taxonomy, catalog }), []);
  assert.equal(collection.candidates.length, 41);
  assert.ok(collection.exclusions.length >= 8);
  assert.equal(collection.catalog_tracking.length, 11);
  assert.deepEqual(
    collection.region_nodes.filter(node => node.gap).map(node => node.region_id).sort(),
    ['CN-BJ', 'CN-GS', 'CN-GX', 'CN-HE', 'CN-HI', 'CN-HK', 'CN-HL', 'CN-JL', 'CN-JX', 'CN-LN', 'CN-MO', 'CN-NM', 'CN-QH', 'CN-SD', 'CN-SX', 'CN-XZ'],
  );
  assert.equal(collection.catalog_tracking.filter(row => row.status === 'runtime_ready').length, 8);
  assert.equal(collection.catalog_tracking.filter(row => row.status === 'planned').length, 3);
  for (const candidateId of [
    'household-green-bean-pork-rib-rice',
    'household-mushroom-green-bean-pork-rib-rice',
    'household-cabbage-tofu-rice',
    'household-broccoli-beef-rice',
  ]) {
    const candidate = collection.candidates.find(row => row.candidate_id === candidateId);
    assert.equal(candidate?.status, 'runtime_ready', candidateId);
    assert.equal(candidate?.quantity_liquid_completeness, 'complete', candidateId);
    assert.deepEqual(candidate?.blockers, [], candidateId);
    assert.equal(
      candidate?.traditional_appliance_and_steps,
      '一锅出项目 Preview 家庭测试标准，待真实厨房反馈',
      candidateId,
    );
  }
  assert.ok(collection.candidates.every(candidate => (
    Array.isArray(candidate.core_ingredients)
    && candidate.core_ingredients.every(item => item
      && Object.hasOwn(item, 'canonical_id')
      && typeof item.label === 'string'
      && item.label.trim())
    && !Object.hasOwn(candidate, 'core_ingredient_ids')
  )), 'candidate core ingredients must use the canonical structured source only');
  const variants = catalog.families.flatMap(family => family.variants);
  const trackingByVariantId = new Map(collection.catalog_tracking.map(row => [row.runtime_variant_id, row]));
  const mappingsById = new Map(collection.runtime_mappings.map(row => [row.mapping_id, row]));
  for (const variant of variants) {
    const tracking = trackingByVariantId.get(variant.variant_id);
    assert.ok(variant.collection_candidate_id, `${variant.variant_id} must name its collection candidate`);
    assert.equal(tracking?.candidate_id, variant.collection_candidate_id, `${variant.variant_id} must use the collection tracking candidate`);
    assert.deepEqual(
      mappingsById.get(tracking.reverse_mapping_id),
      { mapping_id: tracking.reverse_mapping_id, candidate_id: variant.collection_candidate_id, tracking_id: tracking.tracking_id },
      `${variant.variant_id} must have one reverse collection mapping`,
    );
    const candidate = collection.candidates.find(row => row.candidate_id === variant.collection_candidate_id);
    assert.deepEqual(candidate.mapped_core, tracking.core_ingredient_ids,
      `${variant.variant_id} mapped_core must be the explicit catalog/tracking mapping`);
  }
});
