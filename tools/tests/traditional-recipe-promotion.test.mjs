import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  PROMOTION_MATRIX,
  hasOnlyExpectedMissingProductionErrors,
  validateTraditionalRecipePromotion,
} from '../lib/traditional-recipe-promotion-gate.mjs';

const canonicalUrl = path => `https://yiguochu.pages.dev${path}`;

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
        source_refs: [{
          usage: 'approved',
          url: canonicalUrl(`/recipes.html?id=${recipe_id}`),
          title: '一锅出菜谱页',
          license: '项目自有内容',
          attribution: '一锅出项目',
          retrieved_at: '2026-07-17',
        }],
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

test('promotion gate rejects identity placeholders in optional ingredients', () => {
  const matrix = new Map([['demo-rice', {
    draft_id: 'demo-rice-draft', candidate_id: 'demo-candidate', family_id: 'family-demo',
  }]]);
  const fixture = completeFixture(matrix);
  fixture.production.recipes[0].optional_ingredients = ['地方植物'];

  assert.deepEqual(validateTraditionalRecipePromotion({ ...fixture, matrix }), [
    'demo-rice contains identity placeholder 地方植物',
  ]);
});

test('promotion gate validates and uses the manifest canonical path', () => {
  const matrix = new Map([['demo-rice', {
    draft_id: 'demo-rice-draft', candidate_id: 'demo-candidate', family_id: 'family-demo',
  }]]);
  const fixture = completeFixture(matrix);
  fixture.promotions[0].canonical_path = '/recipes.html?id=wrong-rice';
  fixture.production.recipes[0].source_refs[0].url = canonicalUrl(fixture.promotions[0].canonical_path);

  assert.deepEqual(validateTraditionalRecipePromotion({ ...fixture, matrix }), [
    'demo-rice canonical_path must equal /recipes.html?id=demo-rice',
  ]);
});

test('promotion gate requires complete approved source metadata', () => {
  const matrix = new Map([['demo-rice', {
    draft_id: 'demo-rice-draft', candidate_id: 'demo-candidate', family_id: 'family-demo',
  }]]);
  for (const field of ['title', 'license', 'attribution', 'retrieved_at']) {
    const fixture = completeFixture(matrix);
    delete fixture.production.recipes[0].source_refs[0][field];
    assert.deepEqual(validateTraditionalRecipePromotion({ ...fixture, matrix }), [
      'demo-rice canonical source must use https://yiguochu.pages.dev/recipes.html?id=demo-rice',
    ], field);
  }
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

test('promotion checker accepts all thirty formal production mappings', () => {
  const run = spawnSync('node', ['tools/check-traditional-recipe-promotion.mjs'], { encoding: 'utf8' });
  assert.equal(run.status, 0);
  assert.match(run.stdout, /传统菜晋升清单 30 道/);
  assert.equal(run.stderr, '');
  assert.match(run.stdout, /传统菜晋升闸门通过/);
});

test('promotion checker reports a bad manifest path alongside missing production recipes', () => {
  const fixture = completeFixture();
  fixture.production = { recipes: [] };
  const badPromotion = fixture.promotions[0];
  badPromotion.canonical_path = '/recipes.html?id=wrong-rice';
  const expectedPathError = `${badPromotion.recipe_id} canonical_path must equal /recipes.html?id=${badPromotion.recipe_id}`;
  const expectedMissingProduction = `${badPromotion.recipe_id} missing production recipe`;
  const errors = validateTraditionalRecipePromotion(fixture);
  assert.ok(errors.includes(expectedPathError));
  assert.ok(errors.includes(expectedMissingProduction));
  assert.equal(hasOnlyExpectedMissingProductionErrors(errors, fixture.promotions), false);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'traditional-promotion-'));
  const files = {
    candidate: path.join(directory, 'candidates.json'),
    draft: path.join(directory, 'drafts.json'),
    production: path.join(directory, 'production.json'),
    promotion: path.join(directory, 'promotions.json'),
  };
  try {
    fs.writeFileSync(files.candidate, JSON.stringify(fixture.candidates));
    fs.writeFileSync(files.draft, JSON.stringify(fixture.drafts));
    fs.writeFileSync(files.production, JSON.stringify(fixture.production));
    fs.writeFileSync(files.promotion, JSON.stringify({ schema_version: 1, promotions: fixture.promotions }));
    const run = spawnSync('node', [
      'tools/check-traditional-recipe-promotion.mjs',
      '--candidate-file', files.candidate,
      '--draft-file', files.draft,
      '--production-file', files.production,
      '--promotion-file', files.promotion,
    ], { encoding: 'utf8' });
    assert.equal(run.status, 1);
    assert.ok(run.stderr.includes(expectedPathError));
    assert.ok(run.stderr.includes(expectedMissingProduction));
    assert.doesNotMatch(run.stdout, /预期在 Task 3 晋升生产菜谱后通过/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
