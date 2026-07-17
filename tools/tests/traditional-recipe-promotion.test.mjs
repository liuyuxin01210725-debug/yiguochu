import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  PROMOTION_MATRIX,
  validateTraditionalRecipePromotion,
} from '../lib/traditional-recipe-promotion-gate.mjs';

const canonicalUrl = id => `https://yiguochu.pages.dev/recipes.html?id=${id}`;

function completeFixture(matrix = PROMOTION_MATRIX) {
  const promotions = [...matrix.entries()].map(([recipe_id, expected]) => ({
    recipe_id,
    draft_id: expected.draft_id,
    candidate_id: expected.candidate_id,
    family_id: expected.family_id,
    cuisine: '示例菜系',
    purposes: ['pantry'],
    total_time_minutes: 30,
    canonical_path: `/recipes.html?id=${recipe_id}`,
    identity_resolution: '使用明确命名的食品级食材。',
  }));
  return {
    promotions,
    candidates: { entries: promotions.map(({ candidate_id }) => ({ id: candidate_id, status: 'candidate' })) },
    drafts: { drafts: promotions.map(({ draft_id, candidate_id }) => ({ id: draft_id, candidate_id, status: 'draft' })) },
    production: {
      recipes: promotions.map(({ recipe_id, candidate_id }) => ({
        id: recipe_id,
        status: 'approved',
        origin_candidate_id: candidate_id,
        core_ingredients: ['大米'],
        generation_optional_ingredients: ['香葱'],
        generation_liquid_ingredients: ['水'],
        substitution_slots: [{ slot: '叶菜', replaces: ['叶菜'], allowed: ['小白菜'] }],
        source_refs: [{ usage: 'approved', url: canonicalUrl(recipe_id), attribution: '一锅出项目' }],
      })),
    },
  };
}

test('promotion gate reports origin, identity and canonical-source failures deterministically', () => {
  const matrix = new Map([['demo-rice', {
    draft_id: 'demo-rice-draft', candidate_id: 'demo-candidate', family_id: 'family-demo',
  }]]);
  const bad = completeFixture(matrix);
  bad.production.recipes[0].origin_candidate_id = 'wrong-candidate';
  bad.production.recipes[0].core_ingredients = ['经核验野菜'];
  bad.production.recipes[0].source_refs[0].url = 'https://example.test/recipes/demo-rice';

  assert.deepEqual(validateTraditionalRecipePromotion({ ...bad, matrix }), [
    'demo-rice origin_candidate_id must equal demo-candidate',
    'demo-rice contains identity placeholder 经核验野菜',
    'demo-rice canonical source must use https://yiguochu.pages.dev/recipes.html?id=demo-rice',
  ]);
});

test('promotion gate rejects an entry whose linked candidate is no longer a candidate', () => {
  const fixture = completeFixture();
  fixture.candidates.entries[0].status = 'research_hold';
  assert.ok(validateTraditionalRecipePromotion(fixture).includes(
    `${fixture.promotions[0].recipe_id} linked candidate ${fixture.promotions[0].candidate_id} must have status candidate`,
  ));
});

test('promotion gate rejects an incomplete, duplicate or matrix-mismatched manifest', () => {
  const fixture = completeFixture();
  fixture.promotions.pop();
  fixture.promotions[1].candidate_id = fixture.promotions[0].candidate_id;
  fixture.promotions[2].family_id = 'family-wrong';
  const errors = validateTraditionalRecipePromotion(fixture);
  assert.ok(errors.includes('promotion manifest must contain exactly 30 promotions'));
  assert.ok(errors.includes(`promotion manifest duplicates candidate_id ${fixture.promotions[0].candidate_id}`));
  assert.ok(errors.includes(`${fixture.promotions[2].recipe_id} must use family_id ${PROMOTION_MATRIX.get(fixture.promotions[2].recipe_id).family_id}`));
  assert.ok(errors.includes(`expected promotion ${[...PROMOTION_MATRIX.keys()].at(-1)} is missing`));
});

test('promotion manifest fixes all thirty candidate, draft and family mappings', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../data/traditional-recipe-promotions.json', import.meta.url), 'utf8'));
  assert.equal(manifest.schema_version, 1);
  assert.equal(manifest.promotions.length, 30);
  assert.deepEqual(
    manifest.promotions.map(({ recipe_id, draft_id, candidate_id, family_id }) => [recipe_id, draft_id, candidate_id, family_id]),
    [...PROMOTION_MATRIX.entries()].map(([recipe_id, value]) => [recipe_id, value.draft_id, value.candidate_id, value.family_id]),
  );
  for (const promotion of manifest.promotions) {
    assert.deepEqual(Object.keys(promotion), [
      'recipe_id', 'draft_id', 'candidate_id', 'family_id', 'cuisine', 'purposes',
      'total_time_minutes', 'canonical_path', 'identity_resolution',
    ]);
  }
});

test('promotion checker documents the expected pre-Task-3 missing-production transition', () => {
  const run = spawnSync('node', ['tools/check-traditional-recipe-promotion.mjs'], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stdout, /传统菜晋升清单 30 道/);
  assert.match(run.stderr, /missing production recipe/);
  assert.match(run.stdout, /预期在 Task 3 晋升生产菜谱后通过/);
});
