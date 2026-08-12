import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { buildSourceBackedPreviewManifest, validateSourceBackedPreviewManifest } from '../lib/source-backed-preview-manifest.mjs';
import {
  buildSourceBackedFormalizationLedger,
  validateSourceBackedFormalizationLedger,
} from '../lib/source-backed-formalization-ledger.mjs';
import {
  buildSourceBackedExecutionLibrary,
  validateSourceBackedExecutionLibrary,
} from '../lib/source-backed-execution-library.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const sourceRecipesHtml = fs.readFileSync(new URL('../../source-recipes.html', import.meta.url), 'utf8');

test('source-backed preview manifest selects only rice-cooker contract-complete records', () => {
  const manifest = buildSourceBackedPreviewManifest(catalog);

  assert.equal(manifest.schema_version, 1);
  assert.equal(manifest.source_catalog_version, catalog.catalog_version);
  assert.equal(manifest.scope, 'source-backed-public-preview');
  assert.equal(manifest.counts.total, 923);
  assert.equal(manifest.counts.selected, 34);
  assert.equal(manifest.records.length, 34);
  assert.equal(new Set(manifest.records.map(record => record.recipe_id)).size, 34);
  assert.ok(manifest.records.every(record => record.preview_status === 'preview_ready'));
  assert.ok(manifest.records.every(record => record.original_status === 'executable' || record.original_status === 'recipe_fact_checked'));
  assert.ok(manifest.records.every(record => record.cooker_adaptation_status === 'source_limited'));
  assert.ok(manifest.records.every(record => Array.isArray(record.source_ids) && record.source_ids.length > 0));
  assert.deepEqual(validateSourceBackedPreviewManifest(manifest, catalog), []);
});

test('preview manifest keeps non-eligible records auditable instead of silently dropping them', () => {
  const manifest = buildSourceBackedPreviewManifest(catalog);

  assert.equal(manifest.counts.total - manifest.counts.selected, manifest.blocked.length);
  assert.ok(manifest.blocked.some(record => record.recipe_id === 'tiger-usa-century-egg-fish-porridge'));
  assert.ok(manifest.blocked.some(record => record.reason_codes.includes('excluded_boundary')));
  assert.ok(manifest.blocked.some(record => record.reason_codes.includes('missing_contract')));
});

test('preview manifest validator rejects a record that is not in the source catalog', () => {
  const manifest = buildSourceBackedPreviewManifest(catalog);
  manifest.records[0].recipe_id = 'missing-preview-record';
  assert.match(validateSourceBackedPreviewManifest(manifest, catalog).join('\n'), /not found in source catalog/u);
});

test('source recipe page exposes the preview pool without calling it the formal Planner library', () => {
  assert.match(sourceRecipesHtml, /source-backed-one-pot-preview\.v1\.json/u);
  assert.match(sourceRecipesHtml, /source-backed-formalization-ledger\.v1\.json/u);
  assert.match(sourceRecipesHtml, /预览可照做（来源合同闭合，非 Planner 正式菜谱）/u);
  assert.match(sourceRecipesHtml, /正式化待补/u);
});

test('aggregate recipe gate validates the preview manifest', () => {
  const result = spawnSync(process.execPath, ['tools/check-recipes.mjs'], { encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /source-backed preview 34 selected \/ 923 total/u);
});

test('formalization ledger covers every source record and keeps the 898 blockers explicit', () => {
  const ledger = buildSourceBackedFormalizationLedger(catalog);
  assert.equal(ledger.counts.total, 923);
  assert.equal(ledger.counts.preview_candidate, 34);
  assert.equal(ledger.counts.blocked, 889);
  assert.equal(ledger.records.length, 923);
  assert.equal(new Set(ledger.records.map(record => record.recipe_id)).size, 923);
  assert.ok(ledger.records.every(record => record.formal_planner_status === 'not_in_formal_72'));
  assert.ok(ledger.records.every(record => typeof record.next_action === 'string' && record.next_action.length > 0));
  assert.ok(ledger.records.filter(record => record.formalization_status === 'blocked').every(record => record.blocker_labels.length > 0));
  assert.deepEqual(validateSourceBackedFormalizationLedger(ledger, catalog), []);
});

test('aggregate recipe gate validates the formalization ledger', () => {
  const result = spawnSync(process.execPath, ['tools/check-recipes.mjs'], { encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /source-backed formalization 34 preview candidates \/ 889 blocked \/ 923 total/u);
});

test('aggregate recipe gate validates the full execution library artifact', () => {
  const result = spawnSync(process.execPath, ['tools/check-recipes.mjs'], { encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /source-backed execution 923 cards/u);
  assert.match(result.stdout, /source-backed execution completeness 923\/923 complete research fields · 922\/923 unblocked complete · 1 safety-blocked · 923\/923 quantities · 923\/923 liquid · 923\/923 steps · 923\/923 time/u);
  const expected = buildSourceBackedExecutionLibrary(catalog);
  const artifact = JSON.parse(fs.readFileSync(new URL('../data/source-backed-execution-library.v1.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateSourceBackedExecutionLibrary(artifact, catalog), []);
  assert.deepEqual(artifact.counts, expected.counts);
});

test('aggregate recipe gate validates the per-recipe formal candidate review', () => {
  const result = spawnSync(process.execPath, ['tools/check-recipes.mjs'], { encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /source-backed formal candidate review 923 rows · 138 source-complete · ratio evidence 0 · 0 formal-ready · review ok/u);
  const review = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-candidate-review.v1.json', import.meta.url), 'utf8'));
  assert.equal(review.counts.total, 923);
  assert.equal(review.counts.formal_ready, 0);
});
