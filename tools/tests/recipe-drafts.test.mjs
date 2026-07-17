import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateRecipeDraftLibrary } from '../lib/recipe-draft-validator.mjs';
import {
  validateExpectedDraftMappings,
  validateSixDraftReleaseGate,
} from '../lib/recipe-draft-release-gate.mjs';

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

test('expected mapping validator rejects a missing and an extra draft', () => {
  const library = { drafts: [{ id: 'a-draft', candidate_id: 'a' }, { id: 'extra-draft', candidate_id: 'b' }] };
  const candidates = { entries: [{ id: 'a', status: 'candidate' }, { id: 'b', status: 'candidate' }] };
  assert.deepEqual(validateExpectedDraftMappings(library, candidates, new Map([['a-draft', 'a'], ['missing-draft', 'b']]), true), [
    'expected draft missing-draft is missing',
    'unexpected draft extra-draft is present',
  ]);
});

test('expected mapping validator reports a wrong mapping and non-candidate link', () => {
  const library = { drafts: [{ id: 'a-draft', candidate_id: 'b' }] };
  const candidates = { entries: [{ id: 'b', status: 'approved' }] };
  assert.deepEqual(validateExpectedDraftMappings(library, candidates, new Map([['a-draft', 'a']]), false), [
    'a-draft must link candidate_id a',
    'a-draft linked candidate b must have status candidate',
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

test('six-draft release gate rejects a valid but incorrectly remapped candidate', () => {
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  const candidates = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  drafts.drafts[0].candidate_id = 'suzhou-salted-pork-vegetable-rice';

  assert.deepEqual(validateSixDraftReleaseGate(drafts, candidates), [
    'shanghai-salted-pork-vegetable-rice-draft must link candidate_id shanghai-salted-pork-vegetable-rice',
  ]);
});

test('six-draft release gate rejects a linked candidate that is not a candidate', () => {
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  const candidates = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  candidates.entries.find(entry => entry.id === drafts.drafts[0].candidate_id).status = 'approved';

  assert.deepEqual(validateSixDraftReleaseGate(drafts, candidates), [
    'shanghai-salted-pork-vegetable-rice-draft linked candidate shanghai-salted-pork-vegetable-rice must have status candidate',
  ]);
});

test('draft checker permits the current six drafts during expansion', () => {
  const run = spawnSync('node', ['tools/check-recipe-drafts.mjs'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /传统一锅草案 6 道 · 生产可用 0 道/);
});

test('draft checker permits seven drafts and rejects five or thirty-one drafts', (t) => {
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  const candidates = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const production = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'recipe-drafts-'));
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  const runWithDraftCount = (count) => {
    const fixtureDrafts = structuredClone(drafts);
    const fixtureCandidates = structuredClone(candidates);
    while (fixtureDrafts.drafts.length < count) {
      const number = fixtureDrafts.drafts.length + 1;
      const draft = structuredClone(fixtureDrafts.drafts[0]);
      draft.id = `fixture-draft-${number}`;
      draft.candidate_id = `fixture-candidate-${number}`;
      fixtureDrafts.drafts.push(draft);
      fixtureCandidates.entries.push({ id: draft.candidate_id, status: 'candidate' });
    }
    fixtureDrafts.drafts.length = count;
    const draftPath = path.join(tempDir, `drafts-${count}.json`);
    const candidatePath = path.join(tempDir, `candidates-${count}.json`);
    const productionPath = path.join(tempDir, `production-${count}.json`);
    fs.writeFileSync(draftPath, JSON.stringify(fixtureDrafts));
    fs.writeFileSync(candidatePath, JSON.stringify(fixtureCandidates));
    fs.writeFileSync(productionPath, JSON.stringify(production));
    return spawnSync('node', [
      'tools/check-recipe-drafts.mjs',
      '--draft-file', draftPath,
      '--candidate-file', candidatePath,
      '--production-file', productionPath,
    ], { encoding: 'utf8' });
  };

  const seven = runWithDraftCount(7);
  assert.equal(seven.status, 0, seven.stderr);
  assert.match(seven.stdout, /传统一锅草案 7 道 · 生产可用 0 道/);

  for (const count of [5, 31]) {
    const run = runWithDraftCount(count);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /draft library must contain from 6 to 30 drafts during expansion/);
  }
});

test('draft documentation keeps the production promotion boundary explicit', () => {
  const doc = fs.readFileSync(new URL('../../docs/传统一锅草案说明.md', import.meta.url), 'utf8');
  assert.match(doc, /不进入运行时/);
  assert.match(doc, /原创标准配方/);
  assert.match(doc, /真实试做/);
  assert.match(doc, /node tools\/check-recipe-drafts\.mjs/);
});
