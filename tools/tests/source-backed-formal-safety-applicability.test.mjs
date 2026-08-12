import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildSourceBackedFormalCandidateReview } from '../lib/source-backed-formal-candidate-review.mjs';
import { buildSourceBackedPreviewManifest } from '../lib/source-backed-preview-manifest.mjs';
import { validateSourceBackedOnePotCatalog } from '../lib/source-backed-one-pot-catalog-validator.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const taxonomy = JSON.parse(fs.readFileSync(new URL('../data/ingredient-taxonomy.v1.json', import.meta.url), 'utf8'));
const ratioCatalog = JSON.parse(fs.readFileSync(new URL('../data/ratio-rules.v1.json', import.meta.url), 'utf8'));
const formalRatioEvidence = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-ratio-evidence.v1.json', import.meta.url), 'utf8'));

test('low-risk rice and vegetable cards do not require a fabricated food-safety endpoint', () => {
  const review = buildSourceBackedFormalCandidateReview(catalog, taxonomy, ratioCatalog, formalRatioEvidence);
  const row = review.records.find(record => record.recipe_id === 'zojirushi-corn-risotto');
  assert.ok(row);
  assert.equal(row.source_contract.fields.safety_endpoints, false);
  assert.equal(row.source_contract.safety_applicability, 'not_applicable');
  assert.ok(!row.source_contract.missing_fields.includes('safety_endpoints'));
  assert.equal(row.safety.status, 'not_applicable');
  assert.ok(!row.blocker_codes.includes('source_contract'));
  assert.ok(!row.blocker_codes.includes('safety_gate'));
});

test('raw high-risk cards still require an explicit safety endpoint', () => {
  const review = buildSourceBackedFormalCandidateReview(catalog, taxonomy, ratioCatalog, formalRatioEvidence);
  const row = review.records.find(record => record.recipe_id === 'toshiba-seafood-paella-rice');
  assert.ok(row);
  assert.equal(row.source_contract.safety_applicability, 'required');
  assert.ok(row.source_contract.missing_fields.includes('safety_endpoints'));
  assert.equal(row.safety.status, 'missing');
  assert.ok(row.blocker_codes.includes('source_contract'));
});

test('preview manifest admits a low-risk contract-complete card but keeps raw seafood blocked', () => {
  const manifest = buildSourceBackedPreviewManifest(catalog);
  assert.ok(manifest.records.some(record => record.recipe_id === 'tefal-risotto-with-peas-r106322'));
  assert.ok(manifest.blocked.some(record => record.recipe_id === 'toshiba-seafood-paella-rice'));

  const lowRiskCatalog = structuredClone(catalog);
  const lowRisk = lowRiskCatalog.recipes.find(record => record.recipe_id === 'tefal-risotto-with-peas-r106322');
  lowRisk.status = 'preview_ready';
  assert.ok(!validateSourceBackedOnePotCatalog(lowRiskCatalog).some(error => /tefal-risotto-with-peas-r106322.*safety_endpoints/u.test(error)));

  const highRiskCatalog = structuredClone(catalog);
  const highRisk = highRiskCatalog.recipes.find(record => record.recipe_id === 'toshiba-seafood-paella-rice');
  highRisk.status = 'preview_ready';
  assert.ok(validateSourceBackedOnePotCatalog(highRiskCatalog).some(error => /safety_endpoints is required for public recipes/u.test(error)));
});
