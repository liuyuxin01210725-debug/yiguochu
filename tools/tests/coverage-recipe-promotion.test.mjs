import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

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
