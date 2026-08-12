import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildSourceBackedFormalCandidateReview } from '../lib/source-backed-formal-candidate-review.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const taxonomy = JSON.parse(fs.readFileSync(new URL('../data/ingredient-taxonomy.v1.json', import.meta.url), 'utf8'));
const ratioCatalog = JSON.parse(fs.readFileSync(new URL('../data/ratio-rules.v1.json', import.meta.url), 'utf8'));
const formalRatioEvidence = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-ratio-evidence.v1.json', import.meta.url), 'utf8'));

const EXPECTED = Object.freeze([
  ['panasonic-claypot-style-chicken-rice', '整只鸡腿', 'chicken-leg'],
  ['nih-medlineplus-chicken-rice', '鸡块', 'chicken-generic'],
  ['philips-sea-conch-oyster-chicken-congee', '鸡件', 'chicken-generic'],
  ['towngas-fresh-pineapple-chicken-multigrain-rice', '鸡扒', 'chicken-generic'],
  ['r59-panasonic-taiwan-pumpkin-chicken-risotto', '去骨雞腿排', 'chicken-leg'],
  ['philips-chicken-vegetable-takikomi-rice', '帶皮雞腿肉', 'chicken-leg'],
  ['r59-panasonic-taiwan-tomato-spiced-chicken-rice', '去骨雞腿肉', 'chicken-leg'],
  ['au-slhd-oven-baked-biryani', '去脂鸡腿肉', 'chicken-leg'],
  ['instant-pot-chicken-rice-soup', '去骨去皮鸡胸', 'chicken-breast'],
  ['cdph-calfresh-chicken-rice', '去骨去皮鸡胸肉', 'chicken-breast'],
  ['philips-chicken-vegetable-takikomi-rice', '舞菇', 'mushroom-generic'],
  ['tiger-oyster-mushroom-rice', '舞茸', 'mushroom-generic'],
  ['ntuh-wild-mushroom-rice', '雪白菇', 'mushroom-generic'],
  ['taiwan-tuna-mushroom-quinoa-rice', '雪白菇', 'mushroom-generic'],
  ['philips-chicken-vegetable-takikomi-rice', '越光米', 'raw-rice'],
]);

test('r295 exact poultry cut labels map only to existing taxonomy identities', () => {
  const review = buildSourceBackedFormalCandidateReview(catalog, taxonomy, ratioCatalog, formalRatioEvidence);
  for (const [recipeId, sourceLabel, canonicalId] of EXPECTED) {
    const row = review.records.find(record => record.recipe_id === recipeId);
    assert.ok(row, `missing review row ${recipeId}`);
    assert.equal(row.taxonomy_mapping.missing.includes(sourceLabel), false, `${recipeId} still misses ${sourceLabel}`);
    assert.ok(row.taxonomy_mapping.matched.some(item => item.source_label === sourceLabel && item.canonical_id === canonicalId), `${recipeId} did not map ${sourceLabel} to ${canonicalId}`);
  }
});

test('r295 does not collapse ambiguous generic poultry labels', () => {
  const review = buildSourceBackedFormalCandidateReview(catalog, taxonomy, ratioCatalog, formalRatioEvidence);
  const genericRows = review.records.filter(record => record.taxonomy_mapping.missing.includes('熟地方鸡腿肉') || record.taxonomy_mapping.missing.includes('整鸡'));
  assert.ok(genericRows.length > 0, 'ambiguous generic poultry labels should remain visible for review');
});
