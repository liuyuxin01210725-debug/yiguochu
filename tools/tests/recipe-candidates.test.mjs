import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { validateRecipeCandidateLedger } from '../lib/recipe-candidate-validator.mjs';

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

test('research ledger has exactly 30 non-production candidates and leaves the Phase A library untouched', () => {
  const ledger = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const production = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateRecipeCandidateLedger(ledger), []);
  assert.equal(ledger.entries.length, 30);
  assert.ok(ledger.entries.every(entry => entry.status !== 'approved'));
  assert.equal(production.families.length, 9);
  assert.equal(production.recipes.length, 12);
  assert.ok(production.recipes.every(recipe => !ledger.entries.some(entry => entry.id === recipe.id)));
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
