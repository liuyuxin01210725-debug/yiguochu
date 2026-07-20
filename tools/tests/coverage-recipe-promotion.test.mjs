import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateRecipeCandidateLedger } from '../lib/recipe-candidate-validator.mjs';
import { validateRecipeDraftLibrary } from '../lib/recipe-draft-validator.mjs';

const gateUrl = new URL('../lib/coverage-recipe-promotion-gate.mjs', import.meta.url);

async function loadGate() {
  if (!fs.existsSync(gateUrl)) return null;
  return import(gateUrl.href);
}

function makeFixture(matrix) {
  const entries = [...matrix.entries()];
  const candidates = {
    schema_version: 1,
    entries: entries.map(([recipeId]) => ({ id: recipeId, status: 'candidate' })),
  };
  const drafts = {
    schema_version: 1,
    drafts: entries.map(([recipeId]) => ({
      id: `${recipeId}-draft`,
      candidate_id: recipeId,
      core_ingredients: ['示例主料'],
      optional_ingredients: ['示例配料'],
      substitution_slots: [{ slot: '示例替换', replaces: ['示例配料'], allowed: ['示例替换料'] }],
      technique_outline: ['同锅完成。'],
      draft_ratio_rules: ['按固定比例加入液体。'],
      safety_and_quality_gates: [{ type: 'food_safety', requirement: '所有主料彻底熟透。' }],
    })),
  };
  const promotions = entries.map(([recipeId, mapping]) => ({
    recipe_id: recipeId,
    draft_id: mapping.draft_id,
    candidate_id: mapping.candidate_id,
    family_id: mapping.family_id,
    cuisine: '中式家常',
    purposes: ['pantry'],
    total_time_minutes: 30,
    canonical_path: `/recipes.html?id=${recipeId}`,
    identity_resolution: '只使用明确命名的常见食品级食材。',
  }));
  const production = {
    families: [...new Set(entries.map(([, mapping]) => mapping.family_id))]
      .map(id => ({ id, name: id, form: '一锅主食' })),
    recipes: entries.map(([recipeId, mapping]) => ({
      id: recipeId,
      status: 'auto_approved',
      origin_candidate_id: recipeId,
      family_id: mapping.family_id,
      cuisine: '中式家常',
      purposes: ['pantry'],
      total_time_minutes: 30,
      core_ingredients: ['示例主料'],
      optional_ingredients: ['示例配料'],
      generation_optional_ingredients: ['示例配料'],
      substitution_slots: [{ slot: '示例替换', replaces: ['示例配料'], allowed: ['示例替换料'] }],
      technique: ['同锅完成。'],
      ratio_rules: ['按固定比例加入液体。'],
      safety_rules: ['所有主料彻底熟透。'],
      source_refs: [{
        usage: 'approved',
        url: `https://yiguochu.pages.dev/recipes.html?id=${recipeId}`,
        title: `一锅出原创标准配方：${recipeId}`,
        license: '一锅出项目原创标准配方，保留所有权利',
        attribution: '一锅出项目',
        retrieved_at: '2026-07-20',
      }],
    })),
  };
  return { candidates, drafts, promotions, production };
}

test('coverage promotion gate exports the exact thirty-recipe contract', async () => {
  const gate = await loadGate();
  assert.ok(gate, 'coverage-recipe-promotion-gate.mjs must exist');
  assert.equal(gate.COVERAGE_PROMOTION_MATRIX.size, 30);
  assert.equal(gate.COVERAGE_JOURNEYS.length, 7);
  assert.equal(gate.COVERAGE_GROUPS.length, 6);

  const recipeIds = [...gate.COVERAGE_PROMOTION_MATRIX.keys()];
  assert.deepEqual(recipeIds.slice(0, 5), [
    'home-egg-fried-leftover-rice',
    'tomato-egg-stewed-leftover-rice',
    'greens-egg-braised-leftover-rice',
    'mushroom-egg-covered-leftover-rice',
    'shrimp-egg-fried-leftover-rice',
  ]);
  assert.deepEqual(recipeIds.slice(-5), [
    'green-bean-pork-rib-braised-rice',
    'potato-pork-rib-stewed-rice',
    'tomato-potato-pork-rib-covered-rice',
    'mushroom-green-bean-pork-rib-braised-rice',
    'cabbage-potato-pork-rib-soup-rice',
  ]);
  for (const [recipeId, mapping] of gate.COVERAGE_PROMOTION_MATRIX) {
    assert.deepEqual(mapping, {
      candidate_id: recipeId,
      draft_id: `${recipeId}-draft`,
      family_id: mapping.family_id,
    });
  }
});

test('coverage promotion gate accepts a complete linked fixture', async () => {
  const gate = await loadGate();
  if (!gate) return;
  assert.deepEqual(gate.validateCoverageRecipePromotion(
    makeFixture(gate.COVERAGE_PROMOTION_MATRIX),
  ), []);
});

test('coverage promotion gate reports incomplete and mismatched records deterministically', async () => {
  const gate = await loadGate();
  if (!gate) return;
  const fixture = makeFixture(gate.COVERAGE_PROMOTION_MATRIX);
  const removed = fixture.promotions.pop();
  fixture.promotions[0].candidate_id = fixture.promotions[1].candidate_id;
  fixture.production.recipes[1].status = 'approved';
  fixture.production.recipes[2].source_refs[0].url = 'https://example.test/not-canonical';

  const errors = gate.validateCoverageRecipePromotion(fixture);
  for (const expected of [
    'coverage promotion manifest must contain exactly 30 promotions',
    `expected promotion ${removed.recipe_id} is missing`,
    `${fixture.promotions[0].recipe_id} candidate_id must equal ${fixture.promotions[0].recipe_id}`,
    `${fixture.production.recipes[1].id} production status must be auto_approved`,
    `${fixture.production.recipes[2].id} canonical source must use https://yiguochu.pages.dev/recipes.html?id=${fixture.production.recipes[2].id}`,
  ]) assert.ok(errors.includes(expected), expected);
});

test('coverage groups each lock five identities across at least four families', async () => {
  const gate = await loadGate();
  if (!gate) return;
  for (const group of gate.COVERAGE_GROUPS) {
    assert.equal(group.recipe_ids.length, 5, group.id);
    const families = new Set(group.recipe_ids.map(
      recipeId => gate.COVERAGE_PROMOTION_MATRIX.get(recipeId)?.family_id,
    ));
    assert.ok(families.size >= 4, `${group.id} only covers ${families.size} families`);
  }
});

test('coverage candidate ledger locks thirty factual source records', async () => {
  const gate = await loadGate();
  assert.ok(gate);
  const ledgerUrl = new URL('../data/coverage-recipe-candidates.json', import.meta.url);
  assert.equal(fs.existsSync(ledgerUrl), true, 'coverage-recipe-candidates.json must exist');
  const ledger = JSON.parse(fs.readFileSync(ledgerUrl, 'utf8'));
  assert.deepEqual(validateRecipeCandidateLedger(ledger), []);
  assert.deepEqual(
    ledger.entries.map(entry => entry.id),
    [...gate.COVERAGE_PROMOTION_MATRIX.keys()],
  );
  assert.equal(ledger.entries.length, 30);
  assert.ok(ledger.entries.every(entry => entry.status === 'candidate'));

  for (const entry of ledger.entries) {
    assert.ok(entry.basis_refs.length >= 1, entry.id);
    for (const ref of entry.basis_refs) {
      const url = new URL(ref.url);
      assert.equal(url.protocol, 'https:', `${entry.id}: ${ref.url}`);
      assert.notEqual(url.hostname, 'yiguochu.pages.dev', entry.id);
      assert.doesNotMatch(url.hostname, /recipedb/i, entry.id);
      assert.doesNotMatch(url.pathname, /\/search(?:\/|$)/i, entry.id);
      assert.notEqual(url.pathname, '/', `${entry.id} must use a direct content URL`);
      assert.equal(ref.rights_note, '事实溯源；不复制页面文字、图片或完整菜谱。');
      for (const excluded of ['exact_quantities', 'step_text', 'nutrition', 'safety']) {
        assert.ok(ref.excluded_scope.includes(excluded), `${entry.id}: ${excluded}`);
      }
    }
  }
});

test('coverage candidate checker reports thirty research-only entries', () => {
  const checker = new URL('../check-coverage-recipe-candidates.mjs', import.meta.url);
  assert.equal(fs.existsSync(checker), true, 'check-coverage-recipe-candidates.mjs must exist');
  const run = spawnSync(process.execPath, [fileURLToPath(checker)], { encoding: 'utf8' });
  assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
  assert.match(run.stdout, /覆盖扩库候选 30 道 · 生产可用 0 道/);
  assert.match(run.stdout, /✅ 覆盖扩库候选册体检通过/);
});

test('coverage draft library locks thirty original one-pot drafts', async () => {
  const gate = await loadGate();
  assert.ok(gate);
  const candidateUrl = new URL('../data/coverage-recipe-candidates.json', import.meta.url);
  const draftUrl = new URL('../data/coverage-recipe-drafts.json', import.meta.url);
  assert.equal(fs.existsSync(draftUrl), true, 'coverage-recipe-drafts.json must exist');
  const candidates = JSON.parse(fs.readFileSync(candidateUrl, 'utf8'));
  const drafts = JSON.parse(fs.readFileSync(draftUrl, 'utf8'));
  assert.deepEqual(validateRecipeDraftLibrary(drafts, candidates), []);
  assert.deepEqual(
    drafts.drafts.map(draft => draft.id),
    [...gate.COVERAGE_PROMOTION_MATRIX.keys()].map(id => `${id}-draft`),
  );
  assert.equal(drafts.drafts.length, 30);
  for (const draft of drafts.drafts) {
    assert.ok(draft.technique_outline.length >= 1 && draft.technique_outline.length <= 4, draft.id);
    assert.ok(draft.draft_ratio_rules.some(rule => /米|饭|面|粉丝|水|液体/.test(rule)), draft.id);
    assert.doesNotMatch(
      `${draft.name}${draft.adaptation_summary}`,
      /正宗|原样复刻|一比一复刻|传统成品/u,
      draft.id,
    );
  }
});

test('coverage drafts make leftover rice and high-risk endpoints explicit', () => {
  const draftUrl = new URL('../data/coverage-recipe-drafts.json', import.meta.url);
  if (!fs.existsSync(draftUrl)) return;
  const drafts = JSON.parse(fs.readFileSync(draftUrl, 'utf8')).drafts;
  const byId = new Map(drafts.map(draft => [draft.candidate_id, draft]));
  const requirements = id => byId.get(id).safety_and_quality_gates.map(gate => gate.requirement).join('；');

  for (const id of [...byId.keys()].filter(id => id.includes('leftover-rice'))) {
    assert.match(requirements(id), /冷藏/, id);
    assert.match(requirements(id), /充分复热/, id);
  }
  for (const [needle, ingredient] of [
    ['chicken-leg', '鸡腿'], ['beef', '牛肉'], ['pork-rib', '排骨'], ['shrimp', '虾仁'],
  ]) {
    for (const id of [...byId.keys()].filter(candidateId => candidateId.includes(needle))) {
      assert.match(requirements(id), new RegExp(ingredient), id);
    }
  }
  for (const id of [...byId.keys()].filter(candidateId => candidateId.includes('egg'))) {
    assert.match(requirements(id), /鸡蛋.*凝固|凝固.*鸡蛋/u, id);
  }
  for (const id of gateRecipeIds('potato-green-bean-ribs')) {
    assert.match(requirements(id), /豆角.*熟透/u, id);
  }
});

function gateRecipeIds(groupId) {
  const groups = [
    ['potato-green-bean-ribs', [
      'green-bean-pork-rib-braised-rice',
      'potato-pork-rib-stewed-rice',
      'tomato-potato-pork-rib-covered-rice',
      'mushroom-green-bean-pork-rib-braised-rice',
      'cabbage-potato-pork-rib-soup-rice',
    ]],
  ];
  return new Map(groups).get(groupId) || [];
}

test('coverage draft checker reports thirty research drafts', () => {
  const checker = new URL('../check-coverage-recipe-drafts.mjs', import.meta.url);
  assert.equal(fs.existsSync(checker), true, 'check-coverage-recipe-drafts.mjs must exist');
  const run = spawnSync(process.execPath, [fileURLToPath(checker)], { encoding: 'utf8' });
  assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
  assert.match(run.stdout, /覆盖扩库草案 30 道 · 生产可用 0 道/);
  assert.match(run.stdout, /✅ 覆盖扩库草案体检通过/);
});
