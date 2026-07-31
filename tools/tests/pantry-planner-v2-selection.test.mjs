import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { prepareRatioCatalog } from '../../worker/src/ratio-dsl.js';
import {
  assignItemsToTemplate,
  buildPlannerAllergenAliases,
  buildPotCandidates,
  minimumRecommendCoverageCount,
  normalizePlannerItems,
  normalizePlannerRequest,
  planMeal,
  planMealCandidateBundle,
  planMealWithIdentity,
  rankPotCandidates,
  recentPlanPenalty,
  selectHybridCandidates,
} from '../../worker/src/planner-v2.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const readJson = name => JSON.parse(fs.readFileSync(path.join(here, '../data', name), 'utf8'));
const assets = Object.freeze({
  taxonomy: readJson('ingredient-taxonomy.v1.json'),
  templates: readJson('meal-templates.v2.json'),
  ratios: readJson('ratio-rules.v1.json'),
  recipes: readJson('recipe-library.json'),
});
const frontendHtml = fs.readFileSync(path.join(here, '../../index.html'), 'utf8');
const activeTemplate = id => assets.templates.templates.find(template => template.template_id === id);
const request = ({
  mode = 'pantry', intent = 'normal', must = [], prefer = [], dislikes = [], servings = 2,
  currentPlanId = null, recentPlanIds = [],
} = {}) => normalizePlannerRequest({
  schema_version: 2,
  planner_version: 'pantry-planner-v2',
  constraints: {
    mode,
    intent,
    servings,
    must_use: must,
    prefer_use: prefer,
    dislikes,
    current_plan_id: currentPlanId,
    recent_plan_ids: recentPlanIds,
  },
});
const context = (normalizedItems, overrides = {}) => {
  const prepared = prepareRatioCatalog(assets.ratios, {
    taxonomy: assets.taxonomy,
    templates: assets.templates,
    recipes: assets.recipes,
  });
  assert.equal(prepared.ok, true);
  return {
    taxonomy: assets.taxonomy,
    ratioCatalog: prepared.catalog,
    mode: 'pantry',
    intent: 'normal',
    servings: 2,
    ...overrides,
  };
};

function hybridCandidate({
  source = 'custom_template', identity = 'custom', recipeId = null, variantId = null,
  templateId = 'savory-mixed-rice-pot', used = ['大米'], total = 1,
  extras = [], technique = ['braise'], title = '候选', slotAssignment = null,
  intentFit = true, timeMinutes = 30, stepCount = 4, planId = null,
} = {}) {
  const normalized = Array.from({ length: total }, (_, index) => ({
    raw: used[index] || `食材${index + 1}`,
    canonical: used[index] || `食材${index + 1}`,
    canonical_id: used[index] ? `used-${index + 1}` : `item-${index + 1}`,
    recognized: true,
    role: 'prefer_use',
    duplicate_of: null,
  }));
  const planned = normalized.slice(0, used.length).map(item => structuredClone(item));
  const customTitle = /(焖饭|汤饭|汤面|焖面|炖锅|快炒饭)$/u.test(title) ? title : `${title}焖饭`;
  const presentation = source === 'custom_template'
    ? {
        badge:'自定义方案', title:customTitle,
        subtitle:'按本次选中的食材与受控家常技法组合。',
        source_label:null, canonical_path:null,
      }
    : {
        badge:source === 'recipe_variant' ? '菜谱替换版' : '依据菜谱',
        title,
        subtitle:source === 'recipe_variant'
          ? '采用已复核的食材替换，并以菜谱替换版呈现。'
          : '按已核验菜谱的用料、比例与熟制顺序呈现。',
        source_label:'查看一锅出标准配方',
        canonical_path:recipeId ? `/recipes.html?id=${recipeId}` : null,
      };
  return {
    plan_source: source,
    recipe_id: recipeId,
    variant_id: variantId,
    identity_level: identity,
    presentation,
    match_trace: ['ignored-for-diversity'],
    normalized_items: normalized,
    planned_prefer_use: planned,
    unused_prefer_use: normalized.slice(planned.length),
    required_extra_items: extras,
    intent_fit: intentFit,
    time_minutes: timeMinutes,
    step_count: stepCount,
    plan_id: planId,
    coverage_ratio: total ? planned.length / total : 0,
    template_id: templateId,
    technique_signature: technique,
    slot_assignment: slotAssignment || { main: planned },
  };
}

test('hybrid A-order puts a floor-qualified named 3/4 before custom 4/4 and preserves exact counts', () => {
  const named = hybridCandidate({
    source: 'named_recipe', identity: 'canonical', recipeId: 'shanghai', used: ['大米', '咸肉', '小白菜'], total: 4,
  });
  const custom = hybridCandidate({ used: ['大米', '咸肉', '小白菜', '香菇'], total: 4, templateId: 'custom-rice' });
  const selected = selectHybridCandidates([custom, named], { limit: 3 });
  assert.deepEqual(selected.map(candidate => candidate.plan_source), ['named_recipe', 'custom_template']);
  assert.deepEqual(selected.map(candidate => [candidate.coverage_used, candidate.coverage_total]), [[3, 4], [4, 4]]);
});

test('hybrid hard floor removes named 1/2 before identity ranking', () => {
  const named = hybridCandidate({ source: 'named_recipe', identity: 'canonical', recipeId: 'named', used: ['大米'], total: 2 });
  const custom = hybridCandidate({ used: ['大米', '番茄'], total: 2 });
  const selected = selectHybridCandidates([named, custom]);
  assert.deepEqual(selected.map(candidate => candidate.plan_source), ['custom_template']);
});

test('hybrid identity order is canonical then approved variant then adaptation then custom', () => {
  const candidates = [
    hybridCandidate({ identity: 'custom', used: ['1', '2', '3', '4'], total: 4, title:'自定义焖饭' }),
    hybridCandidate({ source: 'recipe_variant', identity: 'style_adaptation', recipeId: 'a', variantId: 'style', used: ['1', '2', '3'], total: 4, title:'家常改编版' }),
    hybridCandidate({ source: 'recipe_variant', identity: 'approved_variant', recipeId: 'a', variantId: 'variant', used: ['1', '2', '3'], total: 4, title:'已复核替换版' }),
    hybridCandidate({ source: 'named_recipe', identity: 'canonical', recipeId: 'a', used: ['1', '2', '3'], total: 4, title:'基础菜谱' }),
  ];
  assert.deepEqual(
    selectHybridCandidates(candidates, { limit: 9 }).map(candidate => candidate.identity_level),
    ['canonical', 'approved_variant', 'style_adaptation'],
  );
  assert.equal(selectHybridCandidates([candidates[0]])[0].identity_level, 'custom');
});

test('hybrid filtering can preserve the deterministic planner order for custom-only bundles', () => {
  const first = hybridCandidate({
    source:'custom_template', identity:'custom', templateId:'poultry-staple-pot',
    used:['鸡腿','土豆'], total:2, title:'鸡腿、土豆焖饭',
  });
  const second = hybridCandidate({
    source:'custom_template', identity:'custom', templateId:'braised-noodle-pot',
    used:['鸡腿','土豆'], total:2, title:'鸡腿、土豆焖面',
  });
  const selected = selectHybridCandidates([first, second], {
    limit:3,
    preserveInputOrder:true,
  });
  assert.equal(selected[0].template_id, 'poultry-staple-pot');
});

test('hybrid coverage ignores planned items that are not members of submitted normalized input', () => {
  const forged = hybridCandidate({
    source: 'named_recipe', identity: 'canonical', recipeId: 'forged', used: ['大米', '咸肉', '小白菜'], total: 4,
  });
  forged.planned_prefer_use[2] = {
    raw: '外部虾仁', canonical: '虾仁', canonical_id: 'outside-shrimp', recognized: true, role: 'prefer_use', duplicate_of: null,
  };
  assert.deepEqual(selectHybridCandidates([forged]), []);
});

test('hybrid arbitration rejects inconsistent source and identity tuples', () => {
  const invalid = [
    hybridCandidate({ source: 'custom_template', identity: 'canonical', recipeId: 'forged' }),
    hybridCandidate({ source: 'named_recipe', identity: 'custom', recipeId: 'forged' }),
    hybridCandidate({ source: 'named_recipe', identity: 'canonical', recipeId: null }),
    hybridCandidate({ source: 'recipe_variant', identity: 'canonical', recipeId: 'forged', variantId: 'v1' }),
    hybridCandidate({ source: 'recipe_variant', identity: 'approved_variant', recipeId: 'forged', variantId: null }),
  ];
  assert.deepEqual(selectHybridCandidates(invalid), []);
});

test('hybrid diversity collapses prose-only duplicates but preserves structural recipe, variant, template and used-set changes', () => {
  const canonical = hybridCandidate({ source:'named_recipe', identity:'canonical', recipeId:'shanghai', used:['rice','pork','greens'], total:4, title:'上海菜饭' });
  const proseDuplicate = structuredClone(canonical);
  proseDuplicate.presentation.title = '上海菜饭。';
  proseDuplicate.match_trace.reverse();
  const variant = hybridCandidate({ source:'recipe_variant', identity:'approved_variant', recipeId:'shanghai', variantId:'greens-choy-sum', used:['rice','pork','choy-sum'], total:4 });
  const customSameStructure = hybridCandidate({ source:'custom_template', identity:'custom', templateId:'savory-mixed-rice-pot', used:['rice','pork','greens'], total:4 });
  const customOtherTemplate = hybridCandidate({
    source:'custom_template', identity:'custom', templateId:'broth-rice-pot', used:['rice','pork','greens'], total:4,
    slotAssignment: {
      staple: [{ raw:'rice', canonical:'rice', canonical_id:'used-1', recognized:true, role:'prefer_use', duplicate_of:null }],
      topping: [
        { raw:'pork', canonical:'pork', canonical_id:'used-2', recognized:true, role:'prefer_use', duplicate_of:null },
        { raw:'greens', canonical:'greens', canonical_id:'used-3', recognized:true, role:'prefer_use', duplicate_of:null },
      ],
    },
  });
  const customOtherTemplateDuplicate = structuredClone(customOtherTemplate);
  customOtherTemplateDuplicate.slot_assignment = {
    topping: [...customOtherTemplateDuplicate.slot_assignment.topping].reverse(),
    staple: customOtherTemplateDuplicate.slot_assignment.staple,
  };

  const selected = selectHybridCandidates([
    proseDuplicate, customOtherTemplateDuplicate, canonical, variant, customSameStructure, customOtherTemplate,
  ], { limit: 6 });
  assert.equal(selected.filter(candidate => candidate.recipe_id === 'shanghai' && candidate.variant_id == null).length, 1);
  assert.ok(selected.some(candidate => candidate.variant_id === 'greens-choy-sum'));
  assert.equal(selectHybridCandidates([customOtherTemplateDuplicate, customOtherTemplate]).length, 1);
  assert.deepEqual(
    selectHybridCandidates([canonical, customSameStructure]).map(candidate => candidate.plan_source),
    ['named_recipe', 'custom_template'],
  );
});

test('hybrid custom diversity keeps real slot, used-set, template and technique differences', () => {
  const base = hybridCandidate({ used:['rice','pork','greens'], total:4, technique:['braise'], title:'家常焖饭' });
  const differentSlot = structuredClone(base);
  differentSlot.slot_assignment = { other: structuredClone(base.slot_assignment.main) };
  differentSlot.presentation.title = '家常菌菇焖饭';
  const differentTechnique = structuredClone(base);
  differentTechnique.technique_signature = ['steam'];
  differentTechnique.presentation.title = '家常蒸焖饭';
  const differentUsedSet = hybridCandidate({ used:['rice','pork','tomato'], total:4, technique:['braise'], title:'番茄焖饭' });
  const differentTemplate = hybridCandidate({ used:['rice','pork','greens'], total:4, templateId:'broth-rice-pot', technique:['braise'], title:'家常汤饭' });
  assert.equal(selectHybridCandidates(
    [base, differentSlot, differentTechnique, differentUsedSet, differentTemplate],
    { limit: 3 },
  ).length, 3);
});

test('hybrid public choices collapse custom cards that look identical to a cook', () => {
  const eggTofu = hybridCandidate({
    templateId:'egg-tofu-vegetable-pot', used:['豆腐','青菜','金针菇'], total:3,
    technique:['gentle_set_protein'], title:'豆腐、青菜炖锅', timeMinutes:25,
    extras:[{ name:'水', category:'liquid' }, { name:'盐', category:'seasoning' }],
  });
  const mushroomStew = hybridCandidate({
    templateId:'mushroom-vegetable-stew-pot', used:['豆腐','青菜','金针菇'], total:3,
    technique:['simmer_until_tender'], title:'豆腐、青菜炖锅', timeMinutes:30,
    extras:[{ name:'水', category:'liquid' }, { name:'盐', category:'seasoning' }],
  });
  assert.equal(selectHybridCandidates([mushroomStew, eggTofu], { limit:3 }).length, 1);
});

test('custom presentation keeps the user tofu wording instead of silently narrowing it to firm tofu', async () => {
  const result = await planMealWithIdentity(assets, request({
    mode:'recommend', prefer:['豆腐','青菜','金针菇'],
  }));
  assert.match(result.presentation.title, /^豆腐、/u);
  assert.doesNotMatch(result.presentation.title, /^老豆腐、/u);
});

test('custom presentation names the actual staple technique and does not repeat noodle wording', async () => {
  const beefBundle = await planMealCandidateBundle(assets, request({
    mode:'recommend', prefer:['西兰花','牛里脊'],
  }));
  const beefNoodle = beefBundle.candidate_plans.find(candidate => (
    candidate.plan.pots[0].template_id === 'beef-staple-pot'
    && candidate.plan.required_extra_items.some(item => item.category === 'noodle')
  ));
  assert.ok(beefNoodle);
  assert.match(beefNoodle.presentation.title, /汤面$/u);
  assert.doesNotMatch(beefNoodle.presentation.title, /焖饭$/u);

  const pork = await planMealWithIdentity(assets, request({
    mode:'recommend', prefer:['猪里脊','鲜小麦面条','豆角'],
  }));
  assert.match(pork.presentation.title, /焖面$/u);
  assert.doesNotMatch(pork.presentation.title, /面条焖面/u);
});

test('acid staple presentation distinguishes leftover-rice stew from raw-rice braising', async () => {
  const result = await planMealWithIdentity(assets, request({
    mode:'recommend', prefer:['番茄','剩米饭'],
  }));
  assert.equal(result.plan.pots[0].template_id, 'acid-staple-pot');
  assert.match(result.presentation.title, /烩饭$/u);
  assert.doesNotMatch(result.presentation.title, /焖饭$/u);
});

test('hybrid selector rejects a card that leaves the user noodle unused and asks them to buy noodle', () => {
  const conflicting = hybridCandidate({
    templateId:'braised-noodle-pot', used:['猪里脊','豆角'], total:3,
    title:'猪里脊、豆角焖面', extras:[{ name:'面条', category:'noodle' }],
  });
  conflicting.normalized_items[2] = {
    raw:'鲜小麦面条', canonical:'鲜小麦面条', canonical_id:'fresh-wheat-noodle',
    category:'noodle', recognized:true, role:'prefer_use', duplicate_of:null,
  };
  conflicting.unused_prefer_use = [structuredClone(conflicting.normalized_items[2])];
  assert.deepEqual(selectHybridCandidates([conflicting]), []);
});

test('hybrid arbitration applies intent, burden and recent history only after identity, coverage and extras', () => {
  const noMajorExtra = hybridCandidate({
    recipeId:'no-extra', source:'named_recipe', identity:'canonical', used:['1','2','3'], total:4,
    intentFit:false, timeMinutes:60, stepCount:10,
  });
  const majorExtra = hybridCandidate({
    recipeId:'major-extra', source:'named_recipe', identity:'canonical', used:['1','2','3'], total:4,
    extras:[{ name:'另买鸡肉', category:'protein' }], intentFit:true, timeMinutes:15, stepCount:2,
  });
  assert.equal(selectHybridCandidates([majorExtra, noMajorExtra])[0].recipe_id, 'no-extra');

  const poorIntent = hybridCandidate({
    recipeId:'a', source:'named_recipe', identity:'canonical', used:['1','2','3'], total:4,
    intentFit:false, timeMinutes:20, stepCount:2, planId:'plan-poor-intent',
  });
  const goodIntentHeavy = hybridCandidate({
    recipeId:'b', source:'named_recipe', identity:'canonical', used:['1','2','3'], total:4,
    intentFit:true, timeMinutes:40, stepCount:7, planId:'plan-good-heavy',
  });
  const goodIntentLightRecent = hybridCandidate({
    recipeId:'c', source:'named_recipe', identity:'canonical', used:['1','2','3'], total:4,
    intentFit:true, timeMinutes:25, stepCount:4, planId:'plan-good-light-recent',
  });
  const goodIntentLightFresh = hybridCandidate({
    recipeId:'d', source:'named_recipe', identity:'canonical', used:['1','2','3'], total:4,
    intentFit:true, timeMinutes:25, stepCount:4, planId:'plan-good-light-fresh',
  });
  assert.deepEqual(
    selectHybridCandidates(
      [poorIntent, goodIntentHeavy, goodIntentLightRecent, goodIntentLightFresh],
      { limit:3, recentPlanIds:['plan-good-light-recent'] },
    ).map(candidate => candidate.recipe_id),
    ['d', 'c', 'b'],
  );

  const strongerRecent = hybridCandidate({
    recipeId:'strong', source:'named_recipe', identity:'canonical', used:['1','2','3','4'], total:4,
    intentFit:false, timeMinutes:60, stepCount:10, planId:'strong-recent',
  });
  const weakerFresh = hybridCandidate({
    recipeId:'weak', source:'recipe_variant', identity:'approved_variant', variantId:'v1', used:['1','2','3'], total:4,
    intentFit:true, timeMinutes:15, stepCount:2, planId:'weak-fresh',
  });
  assert.equal(
    selectHybridCandidates([weakerFresh, strongerRecent], { recentPlanIds:['strong-recent'] })[0].recipe_id,
    'strong',
  );
});

test('hybrid recent history is a binary soft demotion and never exhausts all candidates', () => {
  const first = hybridCandidate({
    recipeId:'a', source:'named_recipe', identity:'canonical', used:['1','2','3'], total:4,
    planId:'recent-a',
  });
  const second = hybridCandidate({
    recipeId:'b', source:'named_recipe', identity:'canonical', used:['1','2','3'], total:4,
    planId:'recent-b',
  });
  const selected = selectHybridCandidates([second, first], {
    recentPlanIds:['recent-a', 'recent-b'],
  });
  assert.equal(selected.length, 2);
  assert.deepEqual(selected.map(candidate => candidate.recipe_id), ['a', 'b']);
});

test('every public common-pantry chip has a real direct-recommend candidate that uses it', async () => {
  const declaration = frontendHtml.match(/const COMMON_PANTRY = \[([^\]]+)\];/u);
  assert.ok(declaration);
  const chipNames = [...declaration[1].matchAll(/'([^']+)'/gu)].map(match => match[1]);
  for (const raw of chipNames) {
    const result = await planMealCandidateBundle(assets, request({ mode:'recommend', prefer:[raw] }));
    assert.equal(result.status, 'ready', raw);
    assert.ok(result.candidate_plans.length > 0, raw);
    assert.ok(
      result.candidate_plans.some(candidate =>
        candidate.plan.planned_prefer_use.some(item => item.raw === raw)),
      raw,
    );
  }
});

test('existing planner candidates carry an explicit custom identity contract', async () => {
  const bundle = await planMealCandidateBundle(assets, request({
    mode: 'recommend', prefer: ['番茄', '鸡蛋'],
  }));
  assert.ok(bundle.candidate_plans.length > 0);
  for (const candidate of bundle.candidate_plans) {
    assert.equal(candidate.plan_source, 'custom_template');
    assert.equal(candidate.recipe_id, null);
    assert.equal(candidate.variant_id, null);
    assert.equal(candidate.identity_level, 'custom');
  }
});

test('four-item pantry never presents a one-item pot and computes coverage against all four', () => {
  const result = planMeal(assets, request({ must: ['番茄', '金针菇', '鸡蛋', '西兰花'] }));
  assert.equal(result.status, 'complete');
  assert.ok(result.plan.pots.every(pot => pot.planned_must_use.length >= 2));
  assert.equal(result.plan.pots[0].coverage_ratio, 1);
  assert.equal(result.plan.pots[0].planned_must_use.length, 4);
});

test('direct recommendation keeps onion with chicken and root vegetables when one pot can use all four', async () => {
  const result = await planMealCandidateBundle(assets, request({
    mode: 'recommend',
    intent: 'normal',
    prefer: ['鸡腿', '土豆', '胡萝卜', '洋葱'],
  }));
  assert.equal(result.status, 'ready');
  assert.ok(result.candidate_plans.length > 0);
  assert.deepEqual(
    new Set(result.candidate_plans[0].plan.planned_prefer_use.map(item => item.raw)),
    new Set(['鸡腿', '土豆', '胡萝卜', '洋葱']),
  );
  assert.equal(result.candidate_plans[0].plan.coverage_ratio, 1);
});

test('the same pantry enters a composable template without selecting a fixed recipe', () => {
  const candidates = buildPotCandidates(assets, request({ must: ['番茄', '金针菇', '鸡蛋', '西兰花'] }));
  const highCoverage = candidates.find(candidate => candidate.coverage_ratio === 1);
  assert.equal(highCoverage?.template_id, 'acid-staple-pot');
  assert.equal('recipe_id' in highCoverage, false);
  assert.deepEqual(highCoverage.planned_must_use.map(item => item.canonical).sort(), ['番茄', '金针菇', '鸡蛋', '西兰花'].sort());
});

test('recommend chooses a coherent non-empty subset and explains every unused input honestly', () => {
  const result = planMeal(assets, request({
    mode: 'recommend',
    must: [],
    prefer: ['牛里脊', '番茄', '鸡蛋', '西兰花'],
  }));
  assert.equal(result.status, 'ready');
  assert.ok(result.plan.planned_prefer_use.length >= 1);
  assert.ok(result.plan.unused_prefer_use.every(item => item.reason_code && item.reason));
  assert.doesNotMatch(result.commitment, /全部|全都|清空/);
});

test('recommend coverage thresholds always round 60 percent upward', () => {
  const cases = new Map([
    [0, 0], [1, 1], [2, 2], [3, 2], [4, 3], [5, 4],
    [6, 4], [7, 5], [8, 5], [9, 6], [20, 12],
  ]);
  for (const [submitted, expected] of cases) {
    assert.equal(minimumRecommendCoverageCount(submitted), expected, String(submitted));
  }
});

test('recommend single pot uses the original submitted denominator at both levels', () => {
  const result = planMeal(assets, request({
    mode: 'recommend',
    prefer: ['番茄', '鸡蛋', '西兰花', '神秘叶子'],
  }));
  assert.equal(result.status, 'ready');
  assert.equal(result.plan.coverage_ratio, result.plan.pots[0].coverage_ratio);
  assert.equal(result.plan.recognition_ratio, 3 / 4);
  assert.equal(result.plan.coverage_ratio, result.plan.planned_prefer_use.length / 4);
  assert.equal(result.plan.recognized_coverage_ratio, result.plan.planned_prefer_use.length / 3);
  assert.notEqual(result.plan.pots[0].coverage_ratio, 0);
});

test('recommend candidate eligibility applies the submitted-item coverage floor', () => {
  const candidates = buildPotCandidates(assets, request({
    mode: 'recommend',
    prefer: ['番茄', '鸡蛋', '西兰花', '神秘叶子', '神秘块根'],
  }));
  assert.ok(candidates.some(candidate => candidate.planned_prefer_use.length === 3));
  for (const candidate of candidates) {
    assert.equal(candidate.single_pot_eligible, candidate.planned_prefer_use.length >= 4);
  }

  const seven = buildPotCandidates(assets, request({
    mode: 'recommend',
    prefer: ['番茄', '鸡蛋', '西兰花', '金针菇', '胡萝卜', '神秘叶子', '神秘块根'],
  }));
  assert.ok(seven.length > 0);
  for (const candidate of seven) {
    assert.equal(candidate.single_pot_eligible, candidate.planned_prefer_use.length >= 5);
  }
});

test('shrimp and corn are recognized and planned together instead of being silently dropped', () => {
  const result = planMeal(assets, request({
    mode: 'recommend',
    prefer: ['虾仁', '玉米'],
  }));
  assert.equal(result.status, 'ready');
  assert.ok(result.normalized_items.every(item => item.recognized), JSON.stringify(result.normalized_items));
  assert.deepEqual(
    result.plan.planned_prefer_use.map(item => item.canonical).sort(),
    ['虾仁', '玉米'].sort(),
  );
  assert.deepEqual(result.plan.unused_prefer_use, []);
  assert.equal(result.plan.coverage_ratio, 1);
  assert.equal(result.plan.pots[0].template_id, 'savory-mixed-rice-pot');
});

test('initial recommend returns one to three valid non-filler candidates', async () => {
  const bundle = await planMealCandidateBundle(assets, request({
    mode: 'recommend',
    prefer: ['番茄', '鸡蛋', '豆腐', '西兰花', '熟米饭'],
  }));
  assert.ok(bundle.candidate_plans.length >= 1 && bundle.candidate_plans.length <= 3);
  const best = bundle.candidate_plans[0].plan.planned_prefer_use.length;
  assert.ok(bundle.candidate_plans.every(candidate => (
    candidate.plan.planned_prefer_use.length >= minimumRecommendCoverageCount(5)
  )));
  assert.ok(bundle.candidate_plans.slice(1).every(candidate => (
    candidate.plan.planned_prefer_use.length >= best - 1
  )));
  assert.equal(
    new Set(bundle.candidate_plans.map(candidate => candidate.plan.plan_id)).size,
    bundle.candidate_plans.length,
  );
  assert.equal(bundle.preferred_plan_id, bundle.candidate_plans[0].plan.plan_id);
  assert.ok(bundle.candidate_plans.every(candidate => !('candidate_plans' in candidate)));
});

test('initial recommend does not present the same template and user-food set as different dishes', async () => {
  const bundle = await planMealCandidateBundle(assets, request({
    mode: 'recommend',
    prefer: ['番茄', '鸡蛋'],
  }));
  const semanticKeys = bundle.candidate_plans.map(candidate => {
    const pot = candidate.plan.pots[0];
    const used = candidate.plan.planned_prefer_use
      .map(item => item.canonical)
      .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'));
    return JSON.stringify([pot.template_id, used]);
  });
  assert.equal(new Set(semanticKeys).size, semanticKeys.length);
});

test('candidate bundle returns one reliable plan without cloning filler cards', async () => {
  const bundle = await planMealCandidateBundle(assets, request({
    mode: 'recommend',
    prefer: ['虾仁', '玉米'],
  }));
  assert.equal(bundle.status, 'ready');
  assert.equal(bundle.candidate_plans.length, 1);
  assert.equal(bundle.preferred_plan_id, bundle.candidate_plans[0].plan.plan_id);
});

test('plain noodles and pork tenderloin form a reliable household soup-noodle plan', () => {
  const result = planMeal(assets, request({
    mode: 'recommend',
    prefer: ['面条', '猪里脊'],
  }));
  assert.equal(result.status, 'ready');
  assert.deepEqual(
    result.plan.planned_prefer_use.map(item => item.canonical).sort(),
    ['猪肉', '面条'].sort(),
  );
  assert.equal(result.plan.pots[0].template_id, 'broth-noodle-pot');
});

test('direct-recommend no-alternative path never exposes the unshipped multi-pot action', async () => {
  const base = request({
    mode: 'recommend',
    prefer: ['虾仁', '玉米'],
  });
  const current = await planMealWithIdentity(assets, base);
  const result = await planMealWithIdentity(assets, {
    ...base,
    current_plan_id: current.plan.plan_id,
  });
  assert.equal(result.status, 'no_alternative_plan');
  assert.equal(result.actions.some(action => action.action === 'force_multi_pot'), false);
  assert.ok(result.actions.some(action => action.action === 'edit_ingredients'));
});

test('below-floor recommend returns no valid candidate without legacy fallback claims', async () => {
  const bundle = await planMealCandidateBundle(assets, request({
    mode: 'recommend',
    prefer: ['虾仁', '玉米', '未知A', '未知B', '未知C'],
  }));
  assert.equal(bundle.status, 'no_valid_plan');
  assert.deepEqual(bundle.candidate_plans, []);
  assert.equal(bundle.preferred_plan_id, null);
  assert.equal(bundle.legacy_fallback, undefined);
  assert.equal(bundle.plan_source, undefined);
  assert.equal(bundle.plan.planned_prefer_use.length, 0);
  assert.equal(bundle.plan.unused_prefer_use.length, 5);
});

test('recommend candidate planning stops before combinatorial search when one-pot capacity cannot meet the coverage promise', async () => {
  const prefer = [
    '鸡蛋', '西红柿', '土豆', '鸡胸肉', '西兰花',
    '豆腐', '胡萝卜', '洋葱', '虾仁', '香菇',
    '白菜', '青椒', '茄子', '菠菜', '玉米',
    '金针菇', '大米', '面条', '剩米饭', '牛里脊',
  ];
  const started = performance.now();
  const bundle = await planMealCandidateBundle(assets, request({
    mode: 'recommend',
    prefer,
  }));
  const elapsed = performance.now() - started;

  assert.equal(bundle.status, 'no_valid_plan');
  assert.deepEqual(bundle.candidate_plans, []);
  assert.equal(bundle.plan.planned_prefer_use.length, 0);
  assert.equal(bundle.plan.unused_prefer_use.length, prefer.length);
  assert.ok(elapsed < 250, `capacity short-circuit took ${elapsed.toFixed(1)}ms`);
});

test('recent plan ids are a binary soft penalty rather than an exclusion set', () => {
  assert.equal(recentPlanPenalty('new-plan', ['old-plan']), 0);
  assert.equal(recentPlanPenalty('old-plan', ['old-plan']), 1);
  assert.equal(recentPlanPenalty('old-plan', ['old-plan', 'old-plan']), 1);
});

test('swap hard-excludes only the current plan and reuses the best recent plan when needed', async () => {
  const base = request({
    mode: 'recommend',
    prefer: ['熟米饭', '鸡蛋', '牛里脊', '西兰花'],
  });
  const current = await planMealWithIdentity(assets, base);
  const firstAlternative = await planMealWithIdentity(assets, {
    ...base,
    current_plan_id: current.plan.plan_id,
  });
  assert.notEqual(firstAlternative.plan.plan_id, current.plan.plan_id);

  const nonRecent = await planMealWithIdentity(assets, {
    ...base,
    current_plan_id: current.plan.plan_id,
    recent_plan_ids: [firstAlternative.plan.plan_id],
  });
  assert.notEqual(nonRecent.plan.plan_id, current.plan.plan_id);

  const allRecent = await planMealWithIdentity(assets, {
    ...base,
    current_plan_id: current.plan.plan_id,
    recent_plan_ids: [firstAlternative.plan.plan_id, nonRecent.plan.plan_id],
  });
  assert.equal(allRecent.status, 'ready');
  assert.notEqual(allRecent.plan.plan_id, current.plan.plan_id);
});

test('recent penalty never lets a lower-coverage non-recent plan defeat a stronger plan', async () => {
  const base = request({
    mode: 'recommend',
    prefer: ['番茄', '鸡蛋', '豆腐', '西兰花', '熟米饭'],
  });
  const current = await planMealWithIdentity(assets, base);
  const stronger = await planMealWithIdentity(assets, {
    ...base,
    current_plan_id: current.plan.plan_id,
  });
  const withPenalty = await planMealWithIdentity(assets, {
    ...base,
    current_plan_id: current.plan.plan_id,
    recent_plan_ids: [stronger.plan.plan_id],
  });
  assert.notEqual(withPenalty.plan.plan_id, current.plan.plan_id);
  assert.equal(
    withPenalty.plan.planned_prefer_use.length,
    stronger.plan.planned_prefer_use.length,
  );
});

test('generic beef accepts tenderloin while preserving the raw cut and rejects brisket or ground forms', () => {
  const tenderloin = normalizePlannerItems([
    { raw: '牛里脊', role: 'must_use' }, { raw: '熟米饭', role: 'must_use' },
  ], assets.taxonomy);
  const accepted = assignItemsToTemplate(activeTemplate('beef-staple-pot'), tenderloin, context(tenderloin));
  assert.equal(accepted.ok, true);
  const beef = accepted.slot_assignment.protein[0];
  assert.equal(beef.raw, '牛里脊');
  assert.equal(beef.canonical, '牛肉');
  assert.equal(beef.shape_or_cut, 'tenderloin');

  const generic = normalizePlannerItems([
    { raw: '牛肉', role: 'must_use' }, { raw: '熟米饭', role: 'must_use' },
  ], assets.taxonomy);
  assert.equal(assignItemsToTemplate(activeTemplate('beef-staple-pot'), generic, context(generic)).ok, true);

  const beefOnly = normalizePlannerItems([{ raw: '牛里脊', role: 'must_use' }], assets.taxonomy);
  const insufficient = assignItemsToTemplate(activeTemplate('beef-staple-pot'), beefOnly, context(beefOnly));
  assert.equal(insufficient.ok, false);
  assert.equal(insufficient.rejection_reason.reason_code, 'no_compatible_slot');

  for (const raw of ['牛腩', '牛肉末']) {
    const normalized = normalizePlannerItems([
      { raw, role: 'must_use' }, { raw: '熟米饭', role: 'must_use' },
    ], assets.taxonomy);
    const rejected = assignItemsToTemplate(activeTemplate('beef-staple-pot'), normalized, context(normalized));
    assert.equal(rejected.ok, false, raw);
    assert.equal(rejected.rejection_reason.reason_code, 'unsupported_shape_or_cut', raw);
  }
});

test('semantic de-duplication keeps different canonical parts and shapes but collapses true aliases', () => {
  const distinctParts = normalizePlannerItems([
    { raw:'牛肉片', role:'prefer_use' },
    { raw:'牛里脊', role:'prefer_use' },
    { raw:'熟米饭', role:'prefer_use' },
  ], assets.taxonomy);
  assert.equal(distinctParts.filter(item => item.duplicate_of == null).length, 3);
  assert.notEqual(distinctParts[0].canonical_id, distinctParts[1].canonical_id);
  assert.notEqual(distinctParts[0].shape_or_cut, distinctParts[1].shape_or_cut);

  const tenderloinAliases = normalizePlannerItems([
    { raw:'牛里脊肉', role:'prefer_use' },
    { raw:'牛柳', role:'must_use' },
  ], assets.taxonomy);
  assert.equal(tenderloinAliases.filter(item => item.duplicate_of == null).length, 1);
  assert.equal(tenderloinAliases.find(item => item.duplicate_of == null).raw, '牛柳');
  assert.equal(tenderloinAliases.find(item => item.raw === '牛里脊肉').duplicate_of, '牛柳');

  const tofuAliases = normalizePlannerItems([
    { raw:'豆腐', role:'prefer_use' },
    { raw:'老豆腐', role:'must_use' },
  ], assets.taxonomy);
  assert.equal(tofuAliases.filter(item => item.duplicate_of == null).length, 1);
  assert.equal(tofuAliases.find(item => item.duplicate_of == null).raw, '老豆腐');
});

test('豆腐 and 老豆腐 share one canonical identity that is used once and never also shown unused', () => {
  const result = planMeal(assets, request({ must: ['豆腐', '老豆腐', '青菜'] }));
  const used = result.plan.planned_must_use.filter(item => item.canonical === '老豆腐');
  const unused = result.plan.unplanned_must_use.filter(item => item.canonical === '老豆腐');
  assert.equal(used.length, 1);
  assert.equal(unused.length, 0);
  const tofuRows = result.normalized_items.filter(item => item.canonical === '老豆腐');
  assert.equal(tofuRows.length, 2);
  assert.equal(tofuRows.filter(item => item.duplicate_of !== null).length, 1);
});

test('pantry single-pot display floors are exact for 2, 3, 4-6, and 7+ submitted items', () => {
  const two = buildPotCandidates(assets, request({ must: ['番茄', '未知A'] })).find(pot => pot.template_id === 'acid-staple-pot');
  assert.equal(two.coverage_ratio, 0.5);
  assert.equal(two.single_pot_eligible, false);

  const three = buildPotCandidates(assets, request({ must: ['番茄', '鸡蛋', '未知A'] })).find(pot => pot.template_id === 'acid-staple-pot');
  assert.equal(three.coverage_ratio, 2 / 3);
  assert.equal(three.single_pot_eligible, true);

  const four = buildPotCandidates(assets, request({ must: ['番茄', '未知A', '未知B', '未知C'] })).find(pot => pot.template_id === 'acid-staple-pot');
  assert.equal(four.coverage_ratio, 0.25);
  assert.equal(four.single_pot_eligible, false);

  const seven = buildPotCandidates(assets, request({ must: ['番茄', '金针菇', '鸡蛋', '西兰花', '青菜', '胡萝卜', '土豆'] }));
  assert.ok(seven.length > 0);
  assert.ok(seven.every(pot => pot.single_pot_eligible === false));

  const lowCoverageFinal = planMeal(assets, request({ must: ['牛腩', '大米'] }));
  assert.equal(lowCoverageFinal.status, 'no_valid_plan');
  assert.equal(lowCoverageFinal.plan.pots.length, 0);
  assert.equal(lowCoverageFinal.plan.planned_must_use.length, 0);
  assert.deepEqual(
    lowCoverageFinal.plan.unplanned_must_use.map(item => item.raw).sort(),
    ['大米', '牛腩'].sort(),
  );
});

test('unknown must-use remains in the denominator and unplanned list and blocks complete', () => {
  const result = planMeal(assets, request({ must: ['番茄', '鸡蛋', '神秘叶子'] }));
  assert.notEqual(result.status, 'complete');
  assert.equal(result.generation_allowed, false);
  assert.equal(result.plan.coverage_ratio, 2 / 3);
  assert.equal(result.plan.recognition_ratio, 2 / 3);
  assert.deepEqual(result.plan.unplanned_must_use.map(item => item.reason_code), ['unrecognized_ingredient']);
});

test('ambiguous cowpea blocks pantry completion without hiding the existing pot', () => {
  const result = planMeal(assets, request({ must: ['大米', '去核红枣', '豇豆'] }));
  assert.equal(result.status, 'needs_user_decision');
  assert.equal(result.generation_allowed, false);
  assert.ok(result.plan.pots.length >= 1);
  assert.ok(result.plan.coverage_ratio <= 1 / 3);
  const row = result.plan.unplanned_must_use.find(item => item.raw === '豇豆');
  assert.equal(row.reason_code, 'ambiguous_ingredient_state');
  assert.equal(row.ambiguity_id, 'cowpea-state');
  assert.deepEqual(row.eligible_items, ['鲜豇豆', '干豇豆', '熟豇豆']);
});

test('recommend rejects a below-floor subset but still explains unresolved inputs', () => {
  const result = planMeal(assets, request({
    mode: 'recommend',
    prefer: ['大米', '去核红枣', '豇豆', '鸡腿肉'],
  }));
  assert.equal(result.status, 'no_valid_plan');
  assert.equal(result.generation_allowed, false);
  assert.equal(result.plan.pots.length, 0);
  assert.equal(result.plan.planned_prefer_use.length, 0);
  const jujube = result.plan.unused_prefer_use.find(item => item.raw === '去核红枣');
  assert.ok(jujube?.reason_code && jujube?.reason);
  const cowpea = result.plan.unused_prefer_use.find(item => item.raw === '豇豆');
  assert.equal(cowpea?.reason_code, 'ambiguous_ingredient_state');
  assert.deepEqual(cowpea?.eligible_items, ['鲜豇豆', '干豇豆', '熟豇豆']);
});

test('generic chickpea blocks completion while preserving a valid millet potato pot', () => {
  const result = planMeal(assets, request({ must: ['小米', '土豆', '鹰嘴豆'] }));
  assert.equal(result.status, 'needs_user_decision');
  assert.equal(result.generation_allowed, false);
  assert.equal(result.plan.pots.length, 1);
  assert.deepEqual(
    result.plan.pots[0].planned_must_use.map(row => row.raw).sort(),
    ['土豆', '小米'].sort(),
  );
  const unresolved = result.plan.unplanned_must_use.find(row => row.raw === '鹰嘴豆');
  assert.equal(unresolved?.reason_code, 'ambiguous_ingredient_state');
  assert.equal(unresolved?.ambiguity_id, 'chickpea-state');
  assert.deepEqual(unresolved?.eligible_items, ['干鹰嘴豆', '熟鹰嘴豆']);
});

test('dry chickpea is never placed into the cooked legume slot', () => {
  const result = planMeal(assets, request({ must: ['小米', '土豆', '干鹰嘴豆'] }));
  assert.equal(result.status, 'needs_user_decision');
  assert.equal(result.generation_allowed, false);
  assert.equal(result.plan.pots.length, 1);
  assert.ok(result.plan.pots[0].planned_must_use.every(row => row.raw !== '干鹰嘴豆'));
  const unplanned = result.plan.unplanned_must_use.find(row => row.raw === '干鹰嘴豆');
  assert.equal(unplanned?.reason_code, 'unsupported_ingredient_state');

  const alone = planMeal(assets, request({ must: ['干鹰嘴豆'] }));
  assert.equal(alone.status, 'no_valid_plan');
  assert.equal(alone.generation_allowed, false);
  assert.equal(alone.plan.pots.length, 0);
});

test('semantic duplicates never inflate coverage denominators or planned counts', () => {
  const candidates = buildPotCandidates(assets, request({ must: ['豆腐', '老豆腐', '青菜'] }));
  const pot = candidates.find(candidate => candidate.template_id === 'egg-tofu-vegetable-pot');
  assert.equal(pot.coverage_ratio, 1);
  assert.equal(pot.planned_must_use.length, 2);
  assert.equal(pot.recognized_coverage_ratio, 1);
});

test('egg and tofu share the soft-protein pot when a household vegetable is present', () => {
  const candidates = buildPotCandidates(assets, request({
    mode: 'recommend',
    must: [],
    prefer: ['鸡蛋', '豆腐', '白菜'],
  }));
  const pot = candidates.find(candidate => candidate.template_id === 'egg-tofu-vegetable-pot'
    && candidate.planned_prefer_use.length === 3);

  assert.ok(pot);
  assert.equal(pot.coverage_ratio, 1);
  assert.deepEqual(pot.planned_prefer_use.map(item => item.raw).sort(), ['鸡蛋', '豆腐', '白菜'].sort());
  assert.deepEqual(pot.slot_assignment.protein.map(item => item.raw), ['鸡蛋']);
  assert.deepEqual(pot.slot_assignment.companion_tofu.map(item => item.raw), ['豆腐']);
});

test('quick is a hard limit and never admits templates over 30 minutes', () => {
  for (const mode of ['recommend', 'pantry']) {
    const candidates = buildPotCandidates(assets, request({
      mode,
      intent: 'quick',
      must: mode === 'pantry' ? ['番茄', '鸡蛋'] : [],
      prefer: mode === 'recommend' ? ['番茄', '鸡蛋'] : [],
    }));
    assert.ok(candidates.every(candidate => candidate.time_range.max_minutes <= 30));
    assert.ok(candidates.every(candidate => activeTemplate(candidate.template_id).supported_intents.includes('quick')));
  }
});

test('cooked rice, egg, and cabbage form one complete broth-rice meal with executable two-serving amounts', () => {
  const result = planMeal(assets, request({
    must: ['熟米饭', '鸡蛋', '白菜'],
    servings: 2,
    intent: 'batch',
  }));

  assert.equal(result.status, 'complete');
  assert.equal(result.plan.pots.length, 1);
  const pot = result.plan.pots[0];
  assert.equal(pot.template_id, 'broth-rice-pot');
  assert.equal(pot.coverage_ratio, 1);
  assert.deepEqual(pot.planned_must_use.map(item => item.raw).sort(), ['熟米饭', '鸡蛋', '白菜'].sort());
  const amounts = new Map(pot.ingredient_amounts.map(item => [item.name, item.grams]));
  assert.equal(amounts.get('熟米饭'), 360);
  assert.equal(amounts.get('鸡蛋'), 130);
  assert.equal(amounts.get('白菜'), 220);
  assert.equal(amounts.get('水'), 648);
});

test('Jiangnan M1 menu cores become complete single-pot plans without losing regional names', () => {
  for (const [title, must] of [
    ['上海咸肉菜饭', ['大米', '咸五花肉', '小白菜']],
    ['苏州青菜咸肉饭', ['大米', '咸五花肉', '小白菜']],
    ['南京腊肉菜饭', ['大米', '腊五花肉', '矮脚黄']],
    ['南京香肠菜饭', ['大米', '广式腊肠', '矮脚黄']],
    ['金山菜饭', ['大米', '小白菜']],
    ['家常平菇焖饭', ['大米', '平菇']],
  ]) {
    const result = planMeal(assets, request({ must }));
    assert.equal(result.status, 'complete', title);
    assert.equal(result.plan.plan_kind, 'single_pot', title);
    assert.equal(result.plan.pots.length, 1, title);
    const pot = result.plan.pots[0];
    assert.equal(pot.template_id, 'savory-mixed-rice-pot', title);
    assert.deepEqual(new Set(pot.planned_must_use.map(item => item.raw)), new Set(must), title);
    assert.deepEqual(result.plan.unplanned_must_use, [], title);
    assert.equal(pot.coverage_ratio, 1, title);
  }
});

test('Fujian Taiwan M1 menu cores become complete single-pot generic rice plans', () => {
  for (const [title, must] of [
    ['高丽菜香菇炊饭', ['大米', '卷心菜', '鲜香菇']],
    ['福建盖菜肉末咸饭', ['大米', '芥菜', '猪肉末']],
  ]) {
    const result = planMeal(assets, request({ must }));
    assert.equal(result.status, 'complete', title);
    assert.equal(result.plan.plan_kind, 'single_pot', title);
    assert.equal(result.plan.pots[0].template_id, 'savory-mixed-rice-pot', title);
    assert.deepEqual(new Set(result.plan.pots[0].planned_must_use.map(item => item.raw)), new Set(must), title);
    assert.deepEqual(result.plan.unplanned_must_use, [], title);
    assert.equal(result.plan.pots[0].coverage_ratio, 1, title);
  }
});

test('ground pork compatibility never leaks to ribs or ambiguous Fujian staples', () => {
  const ribs = planMeal(assets, request({ must: ['大米', '猪肋排', '芥菜'] }));
  assert.notEqual(ribs.status, 'complete');
  assert.equal(ribs.plan.unplanned_must_use.find(item => item.raw === '猪肋排')?.reason_code, 'unsupported_shape_or_cut');
  for (const must of [
    ['大米', '扁豆'],
    ['泡发糯米', '猪肉末', '鲜香菇'],
    ['糯米', '猪肉末', '食品级干荷叶'],
  ]) assert.notEqual(planMeal(assets, request({ must })).status, 'complete');
});

test('Lingnan M1 menu cores become complete generic rice plans without claiming claypot technique', () => {
  for (const [title, must] of [
    ['广式腊味煲仔饭食材', ['大米', '广式腊肠', '菜心']],
    ['广式香菇滑鸡煲仔饭食材', ['大米', '去皮鸡腿肉', '鲜香菇']],
  ]) {
    const result = planMeal(assets, request({ must }));
    assert.equal(result.status, 'complete', title);
    assert.equal(result.plan.plan_kind, 'single_pot', title);
    const pot = result.plan.pots[0];
    assert.equal(pot.template_id, 'savory-mixed-rice-pot', title);
    assert.deepEqual(new Set(pot.planned_must_use.map(item => item.raw)), new Set(must), title);
    assert.deepEqual(result.plan.unplanned_must_use, [], title);
    assert.equal(pot.coverage_ratio, 1, title);
    assert.doesNotMatch(JSON.stringify(result), /煲仔饭|瓦煲|锅巴/);
  }
});

test('Lingnan cured sausage rice omits preset oil and salt', () => {
  const result = planMeal(assets, request({ must: ['大米', '广式腊肠', '菜心'] }));
  assert.equal(result.status, 'complete');
  assert.deepEqual(result.plan.pots[0].required_extra_items.map(item => item.name), ['水']);
});

test('skinless chicken leg keeps poultry safety and is blocked by chicken dislike', () => {
  const safe = planMeal(assets, request({ must: ['大米', '去皮鸡腿肉', '菜心'] }));
  assert.equal(safe.status, 'complete');
  const leg = safe.normalized_items.find(item => item.raw === '去皮鸡腿肉');
  assert.deepEqual(
    [leg.canonical, leg.shape_or_cut, leg.cooking_risk, leg.required_endpoint_codes],
    ['鸡肉', 'leg', 'raw_poultry', ['poultry_fully_cooked']],
  );
  assert.ok(safe.plan.pots[0].safety_endpoints.some(row => row.endpoint_code === 'poultry_fully_cooked_no_pink'));

  const conflict = planMeal(assets, request({
    must: ['大米', '去皮鸡腿肉', '鲜香菇'],
    dislikes: ['鸡肉'],
  }));
  assert.notEqual(conflict.status, 'complete');
  assert.equal(conflict.generation_allowed, false);
  assert.equal(
    conflict.plan.unplanned_must_use.find(item => item.raw === '去皮鸡腿肉')?.reason_code,
    'allergen_conflict',
  );
});

test('Lingnan unresolved structures never become complete generic raw-rice pots', () => {
  for (const must of [
    ['大米', '生菜', '胡萝卜'],
    ['大米', '猪肋排', '豆豉'],
    ['糯米', '食品级紫薯粉', '食品级甜菜粉', '食品级菠菜粉', '食品级南瓜粉'],
  ]) {
    const result = planMeal(assets, request({ must }));
    assert.notEqual(result.status, 'complete', must.join('+'));
    assert.equal(result.generation_allowed, false, must.join('+'));
  }
  const overloaded = planMeal(assets, request({
    must: ['大米', '广式腊肠', '菜心', '卷心菜'],
  }));
  assert.equal(
    overloaded.status === 'complete' && overloaded.plan.plan_kind === 'single_pot',
    false,
  );
});

test('Jiangnan cured rice plans omit preset oil and salt but retain measured water', () => {
  for (const must of [
    ['大米', '咸五花肉', '小白菜'],
    ['大米', '腊五花肉', '矮脚黄'],
    ['大米', '广式腊肠', '矮脚黄'],
  ]) {
    const result = planMeal(assets, request({ must }));
    assert.equal(result.status, 'complete');
    const extras = result.plan.pots[0].required_extra_items.map(item => item.name);
    assert.deepEqual(extras, ['水']);
    const skipped = result.plan.pots[0].ratio_trace
      .filter(row => ['食用油', '盐'].includes(row.name));
    assert.deepEqual(skipped.map(row => [row.name, row.applied]), [
      ['食用油', false],
      ['盐', false],
    ]);
  }
});

test('Jiangnan M1 leaves cooked duck glutinous rice and color source explicitly unresolved', () => {
  const duck = planMeal(assets, request({ must: ['大米', '包装熟制板鸭（去骨）', '矮脚黄'] }));
  assert.notEqual(duck.status, 'complete');
  assert.equal(duck.generation_allowed, false);
  assert.equal(
    duck.plan.unplanned_must_use.find(item => item.raw === '包装熟制板鸭（去骨）')?.reason_code,
    'unrecognized_ingredient',
  );

  const blackRice = planMeal(assets, request({ must: ['糯米', '食品级黑米色粉'] }));
  assert.notEqual(blackRice.status, 'complete');
  assert.equal(blackRice.generation_allowed, false);
  assert.deepEqual(
    blackRice.plan.unplanned_must_use.map(item => item.raw).sort(),
    ['糯米', '食品级黑米色粉'].sort(),
  );
});

test('two high-moisture Jiangnan items never fabricate a complete single-pot rice plan', () => {
  const result = planMeal(assets, request({
    must: ['大米', '咸五花肉', '小白菜', '平菇'],
  }));
  assert.equal(
    result.status === 'complete' && result.plan.plan_kind === 'single_pot',
    false,
  );
});

test('leftover rice, chicken leg, and potato preserve the real cut and receive chicken-specific broth amounts', () => {
  const result = planMeal(assets, request({ must: ['剩米饭', '鸡腿肉', '土豆'], servings: 2 }));

  assert.equal(result.status, 'complete');
  const pot = result.plan.pots.find(candidate => candidate.template_id === 'broth-rice-pot');
  assert.ok(pot);
  assert.equal(pot.coverage_ratio, 1);
  const chicken = pot.slot_assignment.protein[0];
  assert.equal(chicken.raw, '鸡腿肉');
  assert.equal(chicken.canonical, '鸡肉');
  assert.equal(chicken.shape_or_cut, 'leg');
  const amounts = new Map(pot.ingredient_amounts.map(item => [item.name, item.grams]));
  assert.equal(amounts.get('熟米饭'), 360);
  assert.equal(amounts.get('鸡腿肉'), 180);
  assert.equal(amounts.get('土豆'), 160);
  assert.equal(amounts.get('水'), 648);
});

test('broth-rice can add a basic cooked-rice staple without pretending it came from the pantry', () => {
  const pot = buildPotCandidates(assets, request({ must: ['鸡蛋', '白菜'], servings: 2 }))
    .find(candidate => candidate.template_id === 'broth-rice-pot');

  assert.ok(pot);
  assert.equal(pot.coverage_ratio, 1);
  assert.deepEqual(pot.planned_must_use.map(item => item.raw).sort(), ['鸡蛋', '白菜'].sort());
  assert.ok(pot.required_extra_items.some(item => item.name === '熟米饭' && item.grams === 360));
  assert.ok(pot.required_extra_items.some(item => item.name === '水' && item.grams === 648));
});

test('broth-rice keeps raw rice and incompatible proteins outside its slots and is unavailable for quick intent', () => {
  const rawRice = buildPotCandidates(assets, request({ must: ['大米', '鸡蛋', '白菜'] }))
    .filter(candidate => candidate.template_id === 'broth-rice-pot');
  assert.ok(rawRice.length > 0);
  assert.ok(rawRice.every(candidate => Object.values(candidate.slot_assignment).flat()
    .every(item => item.raw !== '大米')));

  const incompatible = buildPotCandidates(assets, request({ must: ['熟米饭', '豆腐', '西兰花'] }))
    .filter(candidate => candidate.template_id === 'broth-rice-pot');
  assert.equal(incompatible.length, 0);

  const quick = buildPotCandidates(assets, request({ intent: 'quick', must: ['熟米饭', '鸡蛋', '白菜'] }));
  assert.equal(quick.some(candidate => candidate.template_id === 'broth-rice-pot'), false);
});

test('broth-rice protein slot never combines egg and chicken in the same pot', () => {
  const pots = buildPotCandidates(assets, request({ must: ['熟米饭', '鸡蛋', '鸡腿肉', '白菜'] }))
    .filter(candidate => candidate.template_id === 'broth-rice-pot');

  assert.ok(pots.length > 0);
  assert.ok(pots.every(pot => (pot.slot_assignment.protein || []).length <= 1));
  assert.ok(pots.every(pot => !((pot.slot_assignment.protein || []).some(item => item.category === 'egg')
    && (pot.slot_assignment.protein || []).some(item => item.category === 'chicken'))));
});

test('面条、豆角、猪里脊进入独立焖面模板并完整覆盖，quick 不会误选它', () => {
  const normal = planMeal(assets, request({ must: ['面条', '豆角', '猪里脊'] }));
  assert.equal(normal.status, 'complete');
  assert.equal(normal.plan.pots.length, 1);
  assert.equal(normal.plan.pots[0].template_id, 'braised-noodle-pot');
  assert.deepEqual(normal.plan.pots[0].planned_must_use.map(item => item.raw).sort(), ['面条', '豆角', '猪里脊'].sort());
  assert.equal(normal.plan.pots[0].coverage_ratio, 1);

  const quick = buildPotCandidates(assets, request({ intent: 'quick', must: ['面条', '豆角', '猪里脊'] }));
  assert.equal(quick.some(candidate => candidate.template_id === 'braised-noodle-pot'), false);
});

test('fresh wheat noodles green beans and ground pork form a complete fresh-noodle braise', () => {
  const result = planMeal(assets, request({ must:['鲜小麦面条','豆角','猪肉末'] }));
  assert.equal(result.status, 'complete');
  assert.equal(result.plan.plan_kind, 'single_pot');
  const pot = result.plan.pots[0];
  assert.equal(pot.template_id, 'braised-noodle-pot');
  assert.deepEqual(new Set(pot.planned_must_use.map(item => item.raw)),
    new Set(['鲜小麦面条','豆角','猪肉末']));
  assert.deepEqual(result.plan.unplanned_must_use, []);
  assert.equal(pot.coverage_ratio, 1);
  assert.equal(pot.ratio_trace[0].rule_id, 'braised-fresh-wheat-noodle-liquid-v1');
  assert.equal(pot.liquid_constraints.retained_liquid_grams, 170);
  assert.equal(pot.liquid_constraints.reserve_liquid_grams, 34);
  assert.ok(pot.safety_endpoints.some(row => row.endpoint_code === 'bean_fully_cooked'));
  assert.ok(pot.safety_endpoints.some(row => row.endpoint_code === 'pork_fully_cooked'));
  assert.ok(pot.safety_endpoints.some(row => row.endpoint_code === 'noodle_tender'));
});

test('fresh noodles cannot fall through to dried noodle ratio and presteamed noodles stay unplanned', () => {
  const withoutExact = structuredClone(assets);
  withoutExact.ratios.rules = withoutExact.ratios.rules
    .filter(row => row.rule_id !== 'braised-fresh-wheat-noodle-liquid-v1');
  withoutExact.templates.templates.find(row => row.template_id === 'braised-noodle-pot')
    .ratio_constraints = ['braised-noodle-liquid-v1'];
  const fresh = planMeal(withoutExact, request({ must:['鲜小麦面条','豆角'] }));
  assert.notEqual(fresh.status, 'complete');

  const presteamed = planMeal(assets, request({ must:['预蒸面','豆角','猪肉末'] }));
  assert.notEqual(presteamed.status, 'complete');
  assert.equal(presteamed.generation_allowed, false);
  assert.equal(presteamed.normalized_items.find(item => item.raw === '预蒸面').recognized, false);
});

test('slow rib cuts cannot enter a quick cooked-rice stir pot', () => {
  const normalized = normalizePlannerItems([
    { raw: '排骨', role: 'must_use' },
    { raw: '熟米饭', role: 'must_use' },
  ], assets.taxonomy);
  const assigned = assignItemsToTemplate(
    activeTemplate('cooked-rice-stir-pot'),
    normalized,
    context(normalized, { intent: 'quick', collect_valid_variants: true }),
  );

  assert.equal(assigned.ok, true);
  assert.ok(assigned.variants.length > 0);
  assert.ok(assigned.variants.every(variant => Object.values(variant.slot_assignment).flat()
    .every(item => item.raw !== '排骨')));

  const journey = planMeal(assets, request({
    intent: 'quick', must: ['排骨', '豆角', '大米'],
  }));
  assert.ok(journey.plan.pots.every(pot => pot.planned_must_use.every(item => item.raw !== '排骨')));
});

test('generic savory rice rejects pork ribs without an explicit compatible cut rule', () => {
  const result = planMeal(assets, request({ must: ['排骨', '土豆'] }));
  assert.notEqual(result.status, 'complete');
  assert.equal(result.plan.planned_must_use.some(item => item.raw === '排骨'), false);
  assert.equal(
    result.plan.unplanned_must_use.find(item => item.raw === '排骨')?.reason_code,
    'unsupported_shape_or_cut',
  );
});

test('forbidden cuts and declared moisture or cook-speed combinations are hard structured rejections', () => {
  const wet = normalizePlannerItems([
    { raw: '番茄', role: 'must_use' },
    { raw: '白菜', role: 'must_use' },
  ], assets.taxonomy);
  const forcedWetTemplate = structuredClone(activeTemplate('acid-staple-pot'));
  const vegetable = forcedWetTemplate.optional_slots.find(slot => slot.slot_id === 'vegetable');
  forcedWetTemplate.optional_slots = forcedWetTemplate.optional_slots.filter(slot => slot.slot_id !== 'vegetable');
  forcedWetTemplate.required_slots = [
    forcedWetTemplate.required_slots[0],
    { ...forcedWetTemplate.required_slots[1], source_policy: ['basic_extra'], accepts_categories: ['raw_rice'] },
    { ...vegetable, min_items: 1, max_items: 1 },
  ];
  const wetRejected = assignItemsToTemplate(forcedWetTemplate, wet, context(wet));
  assert.equal(wetRejected.ok, false);
  assert.equal(wetRejected.rejection_reason.reason_code, 'incompatible_combination');

  const brisket = normalizePlannerItems([{ raw: '牛腩', role: 'must_use' }], assets.taxonomy);
  const cutRejected = assignItemsToTemplate(activeTemplate('beef-staple-pot'), brisket, context(brisket));
  assert.equal(cutRejected.rejection_reason.reason_code, 'unsupported_shape_or_cut');
});

test('an incompatible optional item is left out instead of displacing a compatible must-use staple', () => {
  const pot = buildPotCandidates(assets, request({ must: ['大米', '番茄', '白菜'] }))
    .find(candidate => candidate.template_id === 'acid-staple-pot');
  assert.ok(pot);
  assert.deepEqual(pot.planned_must_use.map(item => item.canonical).sort(), ['大米', '番茄'].sort());
  assert.equal(pot.unplanned_must_use.find(item => item.canonical === '白菜')?.reason_code, 'incompatible_combination');
  assert.equal(pot.required_extra_items.some(item => item.name === '大米'), false);
});

test('unknown-only pantry remains explainable even when there is no valid pot candidate', () => {
  const result = planMeal(assets, request({ must: ['神秘叶子'] }));
  assert.equal(result.status, 'no_valid_plan');
  assert.equal(result.plan.coverage_ratio, 0);
  assert.equal(result.plan.recognition_ratio, 0);
  assert.deepEqual(result.plan.unplanned_must_use.map(item => item.reason_code), ['unrecognized_ingredient']);
});

test('required basic staple and liquid have positive grams but never increase pantry coverage', () => {
  const pot = buildPotCandidates(assets, request({ must: ['番茄'] })).find(candidate => candidate.template_id === 'acid-staple-pot');
  assert.equal(pot.coverage_ratio, 1);
  assert.equal(pot.planned_must_use.length, 1);
  assert.ok(pot.required_extra_items.some(item => ['大米', '熟米饭', '面条'].includes(item.name) && item.grams > 0));
  assert.ok(pot.required_extra_items.some(item => item.name === '水' && item.grams > 0));
});

test('every assigned optional item receives positive grams and is not silently dropped', () => {
  const pot = buildPotCandidates(assets, request({ must: ['番茄', '鸡蛋', '西兰花', '金针菇'] }))
    .find(candidate => candidate.template_id === 'acid-staple-pot');
  const amounts = new Map(pot.ingredient_amounts.map(item => [item.name, item.grams]));
  for (const item of Object.values(pot.slot_assignment).flat().filter(item => item.source === 'user')) {
    assert.ok(amounts.get(item.display_name) > 0, item.raw);
  }
});

test('ranking is deterministic, input-order independent, stable, and non-mutating', () => {
  const forward = buildPotCandidates(assets, request({ must: ['番茄', '鸡蛋', '西兰花'] }));
  const reverse = buildPotCandidates(assets, request({ must: ['西兰花', '鸡蛋', '番茄'] }));
  const snapshot = structuredClone(forward);
  const rankedForward = rankPotCandidates(forward, request({ must: ['番茄', '鸡蛋', '西兰花'] }));
  const rankedReverse = rankPotCandidates(reverse, request({ must: ['西兰花', '鸡蛋', '番茄'] }));
  assert.deepEqual(forward, snapshot);
  assert.deepEqual(rankedForward.map(item => [item.template_id, item.assignment_key]), rankedReverse.map(item => [item.template_id, item.assignment_key]));
  assert.deepEqual(rankPotCandidates(forward, request({ must: ['番茄', '鸡蛋', '西兰花'] })), rankedForward);
});

test('planned templates are never emitted as runtime candidates', () => {
  const candidates = buildPotCandidates(assets, request({ must: ['番茄', '鸡蛋', '西兰花', '金针菇'] }));
  assert.ok(candidates.length > 0);
  assert.ok(candidates.every(candidate => activeTemplate(candidate.template_id)));
  assert.ok(candidates.every(candidate => candidate.template_id !== 'quick-breakfast-pot'));
});

test('Task-5 planner is pure and cannot make a network or DeepSeek call', () => {
  const before = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('network must not be called'); };
  try {
    assert.doesNotThrow(() => planMeal(assets, request({ must: ['番茄', '鸡蛋'] })));
  } finally {
    globalThis.fetch = before;
  }
});

test('planner enforces controlled allergy semantics for exact, category, and generic-meat dislikes', () => {
  for (const dislike of ['鸡蛋', '蛋']) {
    const result = planMeal(assets, request({ must: ['鸡蛋', '西兰花'], dislikes: [dislike], intent: 'quick' }));
    assert.notEqual(result.status, 'complete', dislike);
    assert.equal(result.plan.unplanned_must_use.find(item => item.canonical === '鸡蛋')?.reason_code, 'allergen_conflict', dislike);
  }
  const onlyEgg = planMeal(assets, request({ must: ['鸡蛋'], dislikes: ['蛋'], intent: 'quick' }));
  assert.equal(onlyEgg.status, 'no_valid_plan');
  assert.equal(onlyEgg.plan.unplanned_must_use[0]?.reason_code, 'allergen_conflict');

  const beef = planMeal(assets, request({ must: ['牛里脊', '熟米饭'], dislikes: ['牛肉'], intent: 'quick' }));
  assert.notEqual(beef.status, 'complete');
  assert.equal(beef.plan.unplanned_must_use.find(item => item.canonical === '牛肉')?.reason_code, 'allergen_conflict');
});

test('disliked basic extras are excluded, safe alternatives are tried, and all-conflict produces no pot', () => {
  const safeAlternate = buildPotCandidates(assets, request({ must: ['番茄'], dislikes: ['大米'] }))
    .find(candidate => candidate.template_id === 'acid-staple-pot');
  assert.ok(safeAlternate);
  assert.equal(safeAlternate.required_extra_items.some(item => item.name === '大米'), false);
  assert.ok(safeAlternate.required_extra_items.some(item => ['熟米饭', '面条'].includes(item.name)));

  const noStaple = buildPotCandidates(assets, request({
    must: ['番茄'], dislikes: ['大米', '熟米饭', '面条'],
  }));
  assert.equal(noStaple.length, 0);

  const eggTofu = normalizePlannerItems([
    { raw: '鸡蛋', role: 'must_use' }, { raw: '西兰花', role: 'must_use' },
  ], assets.taxonomy);
  const compiledExtraConflict = assignItemsToTemplate(activeTemplate('egg-tofu-vegetable-pot'), eggTofu, context(eggTofu, { dislikes: ['水'] }));
  assert.equal(compiledExtraConflict.ok, false);
  assert.equal(compiledExtraConflict.rejection_reason.reason_code, 'allergen_conflict');
});

test('pantry must-use wins required-slot contention against a lexically earlier prefer item', () => {
  const result = planMeal(assets, request({
    mode: 'pantry', intent: 'quick', must: ['老豆腐', '青菜'], prefer: ['鸡蛋'],
  }));
  assert.equal(result.status, 'complete');
  assert.deepEqual(result.plan.planned_must_use.map(item => item.canonical).sort(), ['老豆腐', '青菜'].sort());
  assert.deepEqual(result.plan.planned_prefer_use.map(item => item.canonical), ['鸡蛋']);
  assert.equal(result.plan.unused_prefer_use.length, 0);
});

test('forbidden beef shapes retain unsupported_shape_or_cut in unplanned explanations', () => {
  for (const raw of ['牛腩', '牛肉末']) {
    const result = planMeal(assets, request({ must: [raw, '熟米饭'], intent: 'quick' }));
    assert.notEqual(result.status, 'complete', raw);
    assert.equal(result.plan.unplanned_must_use.find(item => item.raw === raw)?.reason_code, 'unsupported_shape_or_cut', raw);
  }
});

test('lamb leg onion carrot and rice form one complete savory rice pot', () => {
  const result = planMeal(assets, request({ must: ['羊腿肉', '洋葱', '胡萝卜', '大米'] }));
  assert.equal(result.status, 'complete');
  assert.equal(result.plan.plan_kind, 'single_pot');
  assert.equal(result.plan.coverage_ratio, 1);
  assert.deepEqual(result.plan.unplanned_must_use, []);
  const pot = result.plan.pots[0];
  assert.equal(pot.template_id, 'savory-mixed-rice-pot');
  assert.deepEqual(
    new Set(pot.planned_must_use.map(item => item.raw)),
    new Set(['羊腿肉', '洋葱', '胡萝卜', '大米']),
  );
  assert.equal(pot.ratio_trace[0].rule_id, 'savory-mixed-rice-liquid-v1');
  assert.deepEqual(
    Object.fromEntries(pot.ingredient_amounts.map(item => [item.name, item.grams])),
    { 大米:200, 羊腿肉:200, 胡萝卜:240, 洋葱:80, 水:270, 食用油:10, 盐:3 },
  );
  assert.ok(pot.safety_endpoints.some(row => row.endpoint_code === 'lamb_fully_cooked'));
});

test('generic and unsupported lamb cuts never enter the lamb-leg slot', () => {
  for (const raw of ['羊肉', '羊肩肉', '羊排', '羊腩', '羊肉末']) {
    const result = planMeal(assets, request({ must: [raw, '洋葱', '胡萝卜', '大米'] }));
    assert.notEqual(result.status, 'complete', raw);
    assert.ok(result.plan.unplanned_must_use.some(item => item.raw === raw), raw);
  }
});

test('lamb pilaf is excluded from quick plans and blocked by the controlled lamb dislike', () => {
  const quick = planMeal(assets, request({
    mode:'recommend', intent:'quick', prefer:['羊腿肉', '洋葱', '胡萝卜', '大米'],
  }));
  assert.ok(quick.plan.pots.every(pot => pot.template_id !== 'savory-mixed-rice-pot'));
  assert.ok(quick.plan.pots.every(pot => pot.time_range.max_minutes <= 30));

  const disliked = planMeal(assets, request({
    must:['羊腿肉', '洋葱', '胡萝卜', '大米'], dislikes:['羊肉'],
  }));
  assert.notEqual(disliked.status, 'complete');
  assert.equal(disliked.generation_allowed, false);
  assert.equal(
    disliked.plan.unplanned_must_use.find(item => item.raw === '羊腿肉')?.reason_code,
    'allergen_conflict',
  );
});

test('recognition ratio uses the active product promise denominator, not unrelated-role inputs', () => {
  const pantry = planMeal(assets, request({ must: ['番茄'], prefer: ['未知香草'] }));
  assert.equal(pantry.plan.recognition_ratio, 1);
  assert.equal(pantry.plan.unused_prefer_use.find(item => item.raw === '未知香草')?.reason_code, 'unrecognized_ingredient');

  const recommend = planMeal(assets, request({ mode: 'recommend', prefer: ['番茄', '未知香草'] }));
  assert.equal(recommend.plan.recognition_ratio, 0.5);

  const noCandidate = planMeal(assets, request({ must: ['未知根茎'], prefer: ['黄瓜'] }));
  assert.equal(noCandidate.status, 'no_valid_plan');
  assert.equal(noCandidate.plan.recognition_ratio, 0);
});

test('assignment and plan outputs deeply detach nested taxonomy metadata from caller input', () => {
  const normalized = normalizePlannerItems([
    { raw: '鸡蛋', role: 'must_use' }, { raw: '西兰花', role: 'must_use' },
  ], assets.taxonomy);
  const original = structuredClone(normalized);
  const assigned = assignItemsToTemplate(activeTemplate('egg-tofu-vegetable-pot'), normalized, context(normalized));
  assert.equal(assigned.ok, true);
  assigned.slot_assignment.protein[0].required_endpoint_codes.push('forged_endpoint');
  assigned.slot_assignment.protein[0].compatible_slot_codes.push('forged_slot');
  assert.deepEqual(normalized, original);

  const plannerRequest = request({ must: ['鸡蛋', '西兰花'], intent: 'quick' });
  const requestBefore = structuredClone(plannerRequest);
  const templateSafetyBefore = structuredClone(activeTemplate('egg-tofu-vegetable-pot').safety_endpoints);
  const result = planMeal(assets, plannerRequest);
  result.plan.pots[0].slot_assignment.protein[0].required_endpoint_codes.push('forged_endpoint');
  result.plan.pots[0].safety_endpoints[0].endpoint_code = 'forged_endpoint';
  assert.deepEqual(plannerRequest, requestBefore);
  assert.deepEqual(activeTemplate('egg-tofu-vegetable-pot').safety_endpoints, templateSafetyBefore);
  const second = planMeal(assets, request({ must: ['鸡蛋', '西兰花'], intent: 'quick' }));
  assert.equal(second.plan.pots[0].slot_assignment.protein[0].required_endpoint_codes.includes('forged_endpoint'), false);
});

test('planner allergy checks resolve taxonomy and recipe-library aliases in every planning layer', () => {
  const taxonomyBefore = structuredClone(assets.taxonomy);
  const recipeAliases = { ...assets.recipes.ingredient_aliases, 西红柿: '黄瓜', 补充别名: '番茄' };
  const aliases = buildPlannerAllergenAliases(assets.taxonomy, { ...assets.recipes, ingredient_aliases: recipeAliases });
  assert.equal(Object.getPrototypeOf(aliases), Object.prototype);
  assert.equal(aliases.西红柿, '番茄');
  assert.equal(aliases.补充别名, '番茄');
  assert.deepEqual(assets.taxonomy, taxonomyBefore);
  assert.deepEqual(aliases, buildPlannerAllergenAliases(assets.taxonomy, { ...assets.recipes, ingredient_aliases: recipeAliases }));

  const tomato = planMeal(assets, request({ must: ['番茄'], dislikes: ['西红柿'] }));
  assert.notEqual(tomato.status, 'complete');
  assert.equal(tomato.plan.unplanned_must_use.find(item => item.canonical === '番茄')?.reason_code, 'allergen_conflict');

  const tofu = planMeal(assets, request({ must: ['老豆腐', '青菜'], dislikes: ['北豆腐'], intent: 'quick' }));
  assert.notEqual(tofu.status, 'complete');
  assert.equal(tofu.plan.unplanned_must_use.find(item => item.canonical === '老豆腐')?.reason_code, 'allergen_conflict');

  const riceAlias = buildPotCandidates(assets, request({ must: ['番茄'], dislikes: ['白米'] }))
    .find(candidate => candidate.template_id === 'acid-staple-pot');
  assert.ok(riceAlias);
  assert.equal(riceAlias.required_extra_items.some(item => item.name === '大米'), false);
  assert.ok(riceAlias.required_extra_items.some(item => ['熟米饭', '面条'].includes(item.name)));
});
