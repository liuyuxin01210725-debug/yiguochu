import test from 'node:test';
import assert from 'node:assert/strict';
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
