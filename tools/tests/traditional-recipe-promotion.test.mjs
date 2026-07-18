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
    drafts: { drafts: promotions.map(({ draft_id, candidate_id }) => ({
      id: draft_id,
      candidate_id,
      status: 'draft',
      core_ingredients: ['大米', '叶菜'],
      optional_ingredients: ['香葱'],
      substitution_slots: [{ slot: '叶菜', replaces: ['叶菜'], allowed: ['小白菜', '菜心'] }],
      technique_outline: ['米饭接近熟透时再加入叶菜。'],
      draft_ratio_rules: ['每100克大米使用130克水。'],
      safety_and_quality_gates: [{ type: 'texture', requirement: '叶菜后段加入。' }],
    })) },
    production: {
      recipes: promotions.map(({ recipe_id, candidate_id }) => ({
        id: recipe_id,
        family_id: promotions.find(item => item.recipe_id === recipe_id).family_id,
        cuisine: '示例菜系',
        purposes: ['pantry'],
        total_time_minutes: 30,
        adaptation_note: '使用明确命名的食品级食材。',
        status: 'approved',
        origin_candidate_id: candidate_id,
        core_ingredients: ['大米', '小白菜'],
        optional_ingredients: ['香葱'],
        generation_optional_ingredients: ['香葱'],
        generation_liquid_ingredients: ['水'],
        substitution_slots: [{ slot: '叶菜', replaces: ['小白菜'], allowed: ['菜心'] }],
        technique: ['米饭接近熟透时再加入叶菜。'],
        ratio_rules: ['每100克大米使用130克水。'],
        safety_rules: ['叶菜后段加入。'],
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

  const errors = validateTraditionalRecipePromotion({ ...bad, matrix });
  for (const expected of [
    'demo-rice origin_candidate_id must equal demo-candidate',
    'demo-rice contains identity placeholder 经核验野菜',
    'demo-rice canonical source must use https://yiguochu.pages.dev/recipes.html?id=demo-rice',
  ]) assert.ok(errors.includes(expected), expected);
});

test('promotion gate rejects identity placeholders in optional ingredients', () => {
  const matrix = new Map([['demo-rice', {
    draft_id: 'demo-rice-draft', candidate_id: 'demo-candidate', family_id: 'family-demo',
  }]]);
  const fixture = completeFixture(matrix);
  fixture.production.recipes[0].optional_ingredients = ['地方植物'];

  assert.ok(validateTraditionalRecipePromotion({ ...fixture, matrix }).includes(
    'demo-rice contains identity placeholder 地方植物',
  ));
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

test('mature regional recipe policy documents the approved promotion boundary', () => {
  const policy = fs.readFileSync(new URL('../../docs/成熟地方菜上线规则.md', import.meta.url), 'utf8');
  const drafts = fs.readFileSync(new URL('../../docs/传统一锅草案说明.md', import.meta.url), 'utf8');

  assert.match(policy, /不要求逐道真人试做/);
  assert.match(policy, /传统事实可追溯/);
  assert.match(policy, /项目原创标准配方/);
  assert.match(policy, /身份不明/);
  assert.match(policy, /不伪称已经完成真人试吃/);
  assert.match(drafts, /草案文件本身生产可用 0 道/);
  assert.match(drafts, /当前 30 道草案各有一条对应的项目原创标准配方进入正式库/);
  assert.match(drafts, /尚未通过晋升闸门的草案/);
});

test('promotion gate locks manifest metadata and concrete production boundaries to every linked draft', () => {
  const matrix = new Map([['demo-rice', {
    draft_id: 'demo-rice-draft', candidate_id: 'demo-candidate', family_id: 'family-demo',
  }]]);
  const fixture = completeFixture(matrix);
  const recipe = fixture.production.recipes[0];
  recipe.family_id = 'family-wrong';
  recipe.cuisine = '错误菜系';
  recipe.purposes = ['fresh'];
  recipe.total_time_minutes = 31;
  recipe.optional_ingredients = ['炼乳'];
  recipe.generation_optional_ingredients = ['炼乳'];
  recipe.substitution_slots[0] = { slot: '叶菜', replaces: ['小白菜'], allowed: ['猪肋排'] };
  recipe.technique = ['把所有食材一起煮熟。'];
  recipe.ratio_rules = ['随意加水。'];
  recipe.safety_rules = [];

  const errors = validateTraditionalRecipePromotion({ ...fixture, matrix });
  for (const expected of [
    'demo-rice production family_id must equal manifest family-demo',
    'demo-rice production cuisine must equal manifest 示例菜系',
    'demo-rice production purposes must equal manifest purposes',
    'demo-rice production total_time_minutes must equal manifest 30',
    'demo-rice production optional ingredient is outside draft semantics: 炼乳',
    'demo-rice substitution slot 叶菜 allows ingredient outside draft semantics: 猪肋排',
    'demo-rice technique must retain the linked draft technique outline',
    'demo-rice ratio_rules must retain the linked draft ratio rules',
    'demo-rice safety_rules missing draft requirement: 叶菜后段加入。',
  ]) assert.ok(errors.includes(expected), expected);
});

test('promotion gate resolves labelled fresh shiitake from draft to the concrete production ingredient', () => {
  const matrix = new Map([['demo-rice', {
    draft_id: 'demo-rice-draft', candidate_id: 'demo-candidate', family_id: 'family-demo',
  }]]);
  const fixture = completeFixture(matrix);
  const draft = fixture.drafts.drafts[0];
  const recipe = fixture.production.recipes[0];
  draft.optional_ingredients = ['有食品标签的鲜香菇'];
  draft.substitution_slots = [{ slot: '叶菜', replaces: ['叶菜'], allowed: ['有食品标签的鲜香菇'] }];
  recipe.optional_ingredients = ['鲜香菇'];
  recipe.generation_optional_ingredients = ['鲜香菇'];
  recipe.substitution_slots = [{ slot: '叶菜', replaces: ['小白菜'], allowed: ['鲜香菇'] }];

  assert.deepEqual(validateTraditionalRecipePromotion({ ...fixture, matrix }), []);
});

test('promotion gate rejects impossible ingredient-action combinations', () => {
  const matrix = new Map([['demo-rice', {
    draft_id: 'demo-rice-draft', candidate_id: 'demo-candidate', family_id: 'family-demo',
  }]]);
  const fixture = completeFixture(matrix);
  fixture.production.recipes[0].technique = [
    '牛奶切成均匀小块。',
    '食品级干荷叶切碎后作为主料煮熟。',
    '食品级紫薯粉切丁后同锅炒香。',
    '米饭接近熟透时再加入叶菜。',
  ];
  const errors = validateTraditionalRecipePromotion({ ...fixture, matrix });
  assert.ok(errors.includes('demo-rice has impossible ingredient action: 牛奶切成均匀小块。'));
  assert.ok(errors.includes('demo-rice has impossible ingredient action: 食品级干荷叶切碎后作为主料煮熟。'));
  assert.ok(errors.includes('demo-rice has impossible ingredient action: 食品级紫薯粉切丁后同锅炒香。'));
});

test('promotion gate rejects She black rice entries that omit the household-adaptation identity', () => {
  const candidates = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  const production = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  const promotions = JSON.parse(fs.readFileSync(new URL('../data/traditional-recipe-promotions.json', import.meta.url), 'utf8'));
  const recipeId = 'she-people-black-rice';
  const label = '畲族乌饭风味家庭适配版';
  const matrix = new Map([[recipeId, PROMOTION_MATRIX.get(recipeId)]]);
  candidates.entries = candidates.entries.filter(entry => entry.id === recipeId);
  drafts.drafts = drafts.drafts.filter(entry => entry.id === `${recipeId}-draft`);
  production.recipes = production.recipes.filter(entry => entry.id === recipeId);
  promotions.promotions = promotions.promotions.filter(entry => entry.recipe_id === recipeId);
  const draft = drafts.drafts[0];
  const recipe = production.recipes[0];
  const promotion = promotions.promotions[0];

  candidates.entries[0].name = label;
  draft.name = '食品级色源乌米饭试做框架';
  draft.adaptation_summary = '以食品级色源制作，不披露家庭适配身份。';
  promotion.identity_resolution = '糯米与食品级色源逐项记录。';
  recipe.name = '畲族乌饭';
  recipe.summary = '以食品级黑米色粉制作。';
  recipe.adaptation_note = promotion.identity_resolution;
  recipe.source_refs[0].title = '一锅出原创标准配方：畲族乌饭';

  const errors = validateTraditionalRecipePromotion({ candidates, drafts, production, promotions, matrix });
  for (const expected of [
    `${recipeId} candidate fact name must remain 畲族乌饭`,
    `${recipeId} draft name must disclose ${label}`,
    `${recipeId} draft adaptation_summary must disclose ${label}`,
    `${recipeId} manifest identity_resolution must disclose ${label}`,
    `${recipeId} production name must equal ${label}`,
    `${recipeId} production summary must disclose ${label}`,
    `${recipeId} production adaptation_note must disclose ${label}`,
    `${recipeId} canonical source title must disclose ${label}`,
  ]) assert.ok(errors.includes(expected), expected);
});

test('promotion gate keeps cultural fact names but forces household-adaptation identity for mismatched standardized recipes', () => {
  const identities = new Map([
    ['qinghai-hao-fan', { candidateName: '青海熬饭', adaptationName: '青海熬饭风味家庭适配版' }],
    ['tibetan-savory-congee', { candidateName: '藏式咸稀饭', adaptationName: '藏式咸稀饭风味家庭适配版' }],
    ['guizhou-dong-community-rice', { candidateName: '贵州侗家社饭', adaptationName: '侗家社饭风味家庭适配版' }],
  ]);
  const candidates = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  const production = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  const promotions = JSON.parse(fs.readFileSync(new URL('../data/traditional-recipe-promotions.json', import.meta.url), 'utf8'));
  const matrix = new Map([...identities.keys()].map(recipeId => [recipeId, PROMOTION_MATRIX.get(recipeId)]));
  candidates.entries = candidates.entries.filter(entry => identities.has(entry.id));
  drafts.drafts = drafts.drafts.filter(entry => identities.has(entry.candidate_id));
  production.recipes = production.recipes.filter(entry => identities.has(entry.id));
  promotions.promotions = promotions.promotions.filter(entry => identities.has(entry.recipe_id));

  for (const [recipeId, { adaptationName }] of identities) {
    const candidate = candidates.entries.find(entry => entry.id === recipeId);
    const draft = drafts.drafts.find(entry => entry.candidate_id === recipeId);
    const recipe = production.recipes.find(entry => entry.id === recipeId);
    const promotion = promotions.promotions.find(entry => entry.recipe_id === recipeId);
    candidate.name = adaptationName;
    draft.name = '未披露家庭适配身份的试做框架';
    draft.adaptation_summary = '只说明原料和技法，不披露家庭适配身份。';
    draft.safety_and_quality_gates = draft.safety_and_quality_gates.filter(gate => !gate.requirement.includes(adaptationName));
    promotion.identity_resolution = '只说明原料已固定。';
    recipe.name = identities.get(recipeId).candidateName;
    recipe.summary = '原创家庭一锅标准配方。';
    recipe.adaptation_note = '已固定食品级原料。';
    recipe.safety_rules = recipe.safety_rules.filter(rule => !rule.includes(adaptationName));
    recipe.source_refs[0].title = `一锅出原创标准配方：${identities.get(recipeId).candidateName}`;
  }

  const errors = validateTraditionalRecipePromotion({ candidates, drafts, production, promotions, matrix });
  for (const [recipeId, { candidateName, adaptationName }] of identities) {
    for (const expected of [
      `${recipeId} candidate fact name must remain ${candidateName}`,
      `${recipeId} draft name must disclose ${adaptationName}`,
      `${recipeId} draft adaptation_summary must disclose ${adaptationName}`,
      `${recipeId} draft safety wording must disclose ${adaptationName}`,
      `${recipeId} manifest identity_resolution must disclose ${adaptationName}`,
      `${recipeId} production name must equal ${adaptationName}`,
      `${recipeId} production summary must disclose ${adaptationName}`,
      `${recipeId} production adaptation_note must disclose ${adaptationName}`,
      `${recipeId} production safety wording must disclose ${adaptationName}`,
      `${recipeId} canonical source title must disclose ${adaptationName}`,
    ]) assert.ok(errors.includes(expected), expected);
  }
});

test('promotion gate rejects false traditional-product claims even when adaptation labels remain', () => {
  const identities = new Map([
    ['qinghai-hao-fan', {
      adaptationName: '青海熬饭风味家庭适配版',
      boundaryClaim: '不声称复刻青海熬饭的传统成品',
    }],
    ['tibetan-savory-congee', {
      adaptationName: '藏式咸稀饭风味家庭适配版',
      boundaryClaim: '不声称复刻藏式咸稀饭的传统成品',
    }],
    ['guizhou-dong-community-rice', {
      adaptationName: '侗家社饭风味家庭适配版',
      boundaryClaim: '不声称为传统社饭或复刻传统成品',
    }],
  ]);
  const candidates = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  const production = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  const promotions = JSON.parse(fs.readFileSync(new URL('../data/traditional-recipe-promotions.json', import.meta.url), 'utf8'));
  const matrix = new Map([...identities.keys()].map(recipeId => [recipeId, PROMOTION_MATRIX.get(recipeId)]));
  candidates.entries = candidates.entries.filter(entry => identities.has(entry.id));
  drafts.drafts = drafts.drafts.filter(entry => identities.has(entry.candidate_id));
  production.recipes = production.recipes.filter(entry => identities.has(entry.id));
  promotions.promotions = promotions.promotions.filter(entry => identities.has(entry.recipe_id));

  for (const [recipeId, { adaptationName }] of identities) {
    const falseClaim = `${adaptationName}；完全复刻正宗传统成品。`;
    const draft = drafts.drafts.find(entry => entry.candidate_id === recipeId);
    const promotion = promotions.promotions.find(entry => entry.recipe_id === recipeId);
    const recipe = production.recipes.find(entry => entry.id === recipeId);
    draft.adaptation_summary = falseClaim;
    draft.safety_and_quality_gates = draft.safety_and_quality_gates.map(gate => (
      gate.type === 'cultural_scope' ? { ...gate, requirement: falseClaim } : gate
    ));
    promotion.identity_resolution = falseClaim;
    recipe.summary = falseClaim;
    recipe.adaptation_note = falseClaim;
    recipe.safety_rules = recipe.safety_rules.map(rule => (
      rule.includes(adaptationName) ? falseClaim : rule
    ));
  }

  const errors = validateTraditionalRecipePromotion({ candidates, drafts, production, promotions, matrix });
  for (const [recipeId, { boundaryClaim }] of identities) {
    for (const field of [
      'draft adaptation_summary',
      'draft cultural_scope',
      'manifest identity_resolution',
      'production summary',
      'production adaptation_note',
      'production cultural safety wording',
    ]) {
      assert.ok(errors.includes(`${recipeId} ${field} must state ${boundaryClaim}`), `${recipeId} ${field}`);
      assert.ok(errors.includes(`${recipeId} ${field} contains forbidden traditional-product claim`), `${recipeId} ${field} false claim`);
    }
  }
});

function householdAdaptationFixture(recipeId) {
  const candidates = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  const production = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  const promotions = JSON.parse(fs.readFileSync(new URL('../data/traditional-recipe-promotions.json', import.meta.url), 'utf8'));
  candidates.entries = candidates.entries.filter(entry => entry.id === recipeId);
  drafts.drafts = drafts.drafts.filter(entry => entry.candidate_id === recipeId);
  production.recipes = production.recipes.filter(entry => entry.id === recipeId);
  promotions.promotions = promotions.promotions.filter(entry => entry.recipe_id === recipeId);
  return {
    candidates,
    drafts,
    production,
    promotions,
    matrix: new Map([[recipeId, PROMOTION_MATRIX.get(recipeId)]]),
  };
}

function applyHouseholdBoundaryText(fixture, adaptationName, text) {
  const draft = fixture.drafts.drafts[0];
  const promotion = fixture.promotions.promotions[0];
  const recipe = fixture.production.recipes[0];
  draft.adaptation_summary = text;
  draft.safety_and_quality_gates = draft.safety_and_quality_gates.map(gate => (
    gate.type === 'cultural_scope' ? { ...gate, requirement: text } : gate
  ));
  promotion.identity_resolution = text;
  recipe.summary = text;
  recipe.adaptation_note = text;
  recipe.safety_rules = recipe.safety_rules.map(rule => (
    rule.includes(adaptationName) ? text : rule
  ));
}

test('promotion gate permits clear negated traditional-product disclaimers', () => {
  const identities = [
    {
      recipeId: 'qinghai-hao-fan',
      adaptationName: '青海熬饭风味家庭适配版',
      boundaryClaim: '不声称复刻青海熬饭的传统成品',
    },
    {
      recipeId: 'tibetan-savory-congee',
      adaptationName: '藏式咸稀饭风味家庭适配版',
      boundaryClaim: '不声称复刻藏式咸稀饭的传统成品',
    },
    {
      recipeId: 'guizhou-dong-community-rice',
      adaptationName: '侗家社饭风味家庭适配版',
      boundaryClaim: '不声称为传统社饭或复刻传统成品',
    },
  ];
  const negations = [
    '不声称完全复刻正宗传统成品',
    '不是完整复刻正宗传统成品',
    '不声称为正宗传统成品或完全复刻',
  ];

  for (const negation of negations) {
    for (const { recipeId, adaptationName, boundaryClaim } of identities) {
      const fixture = householdAdaptationFixture(recipeId);
      applyHouseholdBoundaryText(
        fixture,
        adaptationName,
        `${adaptationName}；${boundaryClaim}；${negation}。`,
      );
      assert.deepEqual(validateTraditionalRecipePromotion(fixture), [], `${recipeId}: ${negation}`);
    }
  }
});

test('promotion gate rejects an affirmative claim that coexists with a boundary disclaimer', () => {
  const recipeId = 'qinghai-hao-fan';
  const adaptationName = '青海熬饭风味家庭适配版';
  const boundaryClaim = '不声称复刻青海熬饭的传统成品';
  const fixture = householdAdaptationFixture(recipeId);
  applyHouseholdBoundaryText(
    fixture,
    adaptationName,
    `${adaptationName}；${boundaryClaim}；完全复刻正宗传统成品。`,
  );

  const errors = validateTraditionalRecipePromotion(fixture);
  assert.equal(errors.some(error => error.includes(' must state ')), false);
  for (const field of [
    'draft adaptation_summary',
    'draft cultural_scope',
    'manifest identity_resolution',
    'production summary',
    'production adaptation_note',
    'production cultural safety wording',
  ]) {
    assert.ok(errors.includes(`${recipeId} ${field} contains forbidden traditional-product claim`), field);
  }
});

test('promotion gate rejects adversative affirmative claims after a direct boundary disclaimer', () => {
  const recipeId = 'qinghai-hao-fan';
  const adaptationName = '青海熬饭风味家庭适配版';
  const boundaryClaim = '不声称复刻青海熬饭的传统成品';
  for (const adversative of ['但', '却']) {
    const fixture = householdAdaptationFixture(recipeId);
    applyHouseholdBoundaryText(
      fixture,
      adaptationName,
      `${adaptationName}；${boundaryClaim}，${adversative}完全复刻传统成品。`,
    );

    const errors = validateTraditionalRecipePromotion(fixture);
    assert.equal(errors.some(error => error.includes(' must state ')), false, adversative);
    for (const field of [
      'draft adaptation_summary',
      'draft cultural_scope',
      'manifest identity_resolution',
      'production summary',
      'production adaptation_note',
      'production cultural safety wording',
    ]) {
      assert.ok(
        errors.includes(`${recipeId} ${field} contains forbidden traditional-product claim`),
        `${adversative} ${field}`,
      );
    }
  }
});

test('all thirty production promotions preserve their linked manifest and draft semantics', () => {
  const candidates = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  const production = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  const promotions = JSON.parse(fs.readFileSync(new URL('../data/traditional-recipe-promotions.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateTraditionalRecipePromotion({ candidates, drafts, production, promotions }), []);
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
