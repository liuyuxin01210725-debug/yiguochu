import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { validateRecipeCandidateLedger } from '../lib/recipe-candidate-validator.mjs';
import { validateRecipeCandidateReleaseGate } from '../lib/recipe-candidate-release-gate.mjs';

const validLedger = {
  schema_version: 1,
  purpose: '研究传统一锅主食，不进入生产生成库。',
  entries: [{
    id: 'sample-rice', status: 'candidate', name: '示例菜饭', region: '示例地区',
    cuisine: '示例菜系', form: '菜饭', traditional_basis: '米与蔬菜同锅焖制。',
    ingredient_pattern: ['大米', '青菜'], technique_pattern: ['炒香', '加盖焖熟'],
    risk_level: 'low', promotion_requirements: ['原创标准配方', '安全与适配审核'],
    basis_refs: [{
      kind: 'cultural_fact', relationship: 'ingredient_pattern', claim: '存在米与青菜同锅焖制的菜饭方向。',
      source_type: 'government_culture', title: '示例资料', publisher: '示例机构',
      url: 'https://example.test/rice', retrieved_at: '2026-07-17',
      rights_note: '事实溯源；不复制页面文字、图片或完整菜谱。',
      evidence_scope: ['dish_name', 'region', 'high_level_technique'],
      excluded_scope: ['exact_quantities', 'step_text', 'nutrition', 'safety'],
    }],
  }],
};

test('candidate ledger accepts a factual research candidate', () => {
  assert.deepEqual(validateRecipeCandidateLedger(validLedger), []);
});

test('candidate ledger rejects approved status and copied-source metadata gaps', () => {
  const invalid = structuredClone(validLedger);
  invalid.entries[0].status = 'approved';
  invalid.entries[0].basis_refs[0].rights_note = '';
  assert.deepEqual(validateRecipeCandidateLedger(invalid), [
    'sample-rice status must be candidate or research_hold',
    'sample-rice basis ref 0 missing rights_note',
  ]);
});

test('research ledger has exactly 30 non-production candidates and locks the promoted production baseline', () => {
  const ledger = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const production = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateRecipeCandidateLedger(ledger), []);
  assert.equal(ledger.entries.length, 30);
  assert.ok(ledger.entries.every(entry => entry.status !== 'approved'));
  assert.equal(production.families.length, 21);
  assert.equal(production.recipes.length, 72);
  assert.equal(production.recipes.filter(recipe => recipe.status === 'approved').length, 12);
  const promoted = production.recipes.filter(recipe => ledger.entries.some(entry => entry.id === recipe.id));
  assert.equal(promoted.length, 30);
  assert.ok(promoted.every(recipe => recipe.status === 'auto_approved'));
  assert.ok(promoted.every(recipe => recipe.origin_candidate_id === recipe.id));
});

test('candidate checker reports the candidate and production counts', () => {
  const run = spawnSync('node', ['tools/check-recipe-candidates.mjs'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /传统菜候选 30 道 · 生产可用 0 道/);
  assert.match(run.stdout, /✅ 传统菜候选册体检通过/);
});

test('candidate ledger documentation preserves the facts-versus-expression boundary', () => {
  const doc = fs.readFileSync(new URL('../../docs/传统菜谱候选册说明.md', import.meta.url), 'utf8');
  assert.match(doc, /传统事实/);
  assert.match(doc, /不复制/);
  assert.match(doc, /原创标准配方/);
  assert.match(doc, /node tools\/check-recipe-candidates\.mjs/);
});

test('candidate ledger rejects non-factual kinds, unknown fields, and quantified content', () => {
  const invalid = structuredClone(validLedger);
  invalid.entries[0].basis_refs[0].kind = 'recipe_copy';
  invalid.entries[0].basis_refs[0].claim = '每份 500 千卡';
  invalid.entries[0].basis_refs[0].nutrition = '每份 500 千卡';
  invalid.entries[0].ingredient_pattern = ['大米 200 克'];
  invalid.entries[0].steps = ['先炒后焖'];
  const errors = validateRecipeCandidateLedger(invalid);
  assert.ok(errors.includes('sample-rice ingredient_pattern must not contain quantities or nutrition claims'));
  assert.ok(errors.includes('sample-rice has unexpected field steps'));
  assert.ok(errors.includes('sample-rice basis ref 0 kind must be cultural_fact'));
  assert.ok(errors.includes('sample-rice basis ref 0 claim must not contain quantities or nutrition claims'));
  assert.ok(errors.includes('sample-rice basis ref 0 has unexpected field nutrition'));
});

test('candidate ledger rejects Chinese-character quantities and ordered source-like steps', () => {
  const invalid = structuredClone(validLedger);
  invalid.entries[0].ingredient_pattern = ['大米二百克'];
  invalid.entries[0].technique_pattern = ['先炒香后焖熟'];
  invalid.entries[0].basis_refs[0].claim = '将米洗净，炒香咸肉和青菜后加水焖熟。';
  assert.deepEqual(validateRecipeCandidateLedger(invalid), [
    'sample-rice ingredient_pattern must not contain quantities or nutrition claims',
    'sample-rice technique_pattern must not contain ordered step-sequence language',
    'sample-rice basis ref 0 claim must not contain ordered step-sequence language',
  ]);
});

test('candidate release gate locks the first batch and production baseline', () => {
  const ledger = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const production = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateRecipeCandidateReleaseGate(ledger, production), []);
  const shortLedger = structuredClone(ledger);
  shortLedger.entries.pop();
  assert.ok(validateRecipeCandidateReleaseGate(shortLedger, production).includes('candidate ledger must contain exactly 30 entries'));
  const incompleteProduction = structuredClone(production);
  incompleteProduction.recipes.pop();
  assert.ok(validateRecipeCandidateReleaseGate(ledger, incompleteProduction).includes('production library must contain exactly 72 recipes'));
  const missingFamily = structuredClone(production);
  missingFamily.families.pop();
  assert.ok(validateRecipeCandidateReleaseGate(ledger, missingFamily).includes('production library must contain exactly 21 families'));
  const wrongStatus = structuredClone(production);
  wrongStatus.recipes[0].status = 'auto_approved';
  assert.ok(validateRecipeCandidateReleaseGate(ledger, wrongStatus).includes(
    'production library must contain exactly 12 approved (human-approved) and 60 auto_approved (auto-gate passed, pending human review) recipes; got 11 approved and 61 auto_approved',
  ));
});
