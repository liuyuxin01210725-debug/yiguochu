import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { validateRecipeDraftLibrary } from '../lib/recipe-draft-validator.mjs';

const candidateLedger = { entries: [{ id: 'candidate-a' }] };
const validDraftLibrary = {
  schema_version: 1, purpose: '原创试做草案，不进入运行时。',
  drafts: [{
    id: 'sample-draft', candidate_id: 'candidate-a', status: 'draft', name: '示例饭', region: '示例地区', form: '焖饭',
    adaptation_summary: '以家庭一锅完成为目标的原创试做底稿。', serving_range: [2, 4],
    core_ingredients: ['大米', '青菜'], optional_ingredients: ['葱'],
    substitution_slots: [{ slot: '叶菜', replaces: ['青菜'], allowed: ['小白菜'] }],
    draft_ratio_rules: ['每100克大米配120至140克总液体。'], technique_outline: ['炒香配料', '同锅焖熟'],
    safety_and_quality_gates: [{ type: 'texture', requirement: '叶菜后段加入，避免出水过多。' }],
    trial_requirements: ['记录锅具、份数、实际用量、总时长、米粒状态和修订原因。'],
  }],
};

test('draft library accepts an original trial draft linked to a candidate', () => {
  assert.deepEqual(validateRecipeDraftLibrary(validDraftLibrary, candidateLedger), []);
});

test('draft library rejects production status and a missing safety gate', () => {
  const invalid = structuredClone(validDraftLibrary);
  invalid.drafts[0].status = 'approved';
  invalid.drafts[0].safety_and_quality_gates = [];
  assert.deepEqual(validateRecipeDraftLibrary(invalid, candidateLedger), [
    'sample-draft status must be draft',
    'sample-draft safety_and_quality_gates must be non-empty',
  ]);
});

test('six traditional drafts are isolated from candidates and production', () => {
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  const candidates = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const production = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateRecipeDraftLibrary(drafts, candidates), []);
  assert.equal(drafts.drafts.length, 6);
  assert.ok(drafts.drafts.every(draft => draft.status === 'draft'));
  assert.equal(production.families.length, 9);
  assert.equal(production.recipes.length, 12);
  assert.ok(drafts.drafts.every(draft => !production.recipes.some(recipe => recipe.id === draft.id)));
});

test('draft checker reports six drafts and zero production entries', () => {
  const run = spawnSync('node', ['tools/check-recipe-drafts.mjs'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /传统一锅草案 6 道 · 生产可用 0 道/);
});

test('draft documentation keeps the production promotion boundary explicit', () => {
  const doc = fs.readFileSync(new URL('../../docs/传统一锅草案说明.md', import.meta.url), 'utf8');
  assert.match(doc, /不进入运行时/);
  assert.match(doc, /原创标准配方/);
  assert.match(doc, /真实试做/);
  assert.match(doc, /node tools\/check-recipe-drafts\.mjs/);
});
