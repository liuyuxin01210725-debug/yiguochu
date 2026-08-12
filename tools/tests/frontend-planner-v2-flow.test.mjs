import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizePlannerRequest,
  planMealCandidateBundle,
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

function request(prefer) {
  return normalizePlannerRequest({
    schema_version: 2,
    planner_version: 'pantry-planner-v2',
    constraints: {
      mode: 'recommend', intent: 'normal', servings: 2,
      must_use: [], prefer_use: prefer, dislikes: [],
      current_plan_id: null, recent_plan_ids: [],
    },
  });
}

test('every real custom candidate carries the exact safe public presentation shape', async () => {
  const bundle = await planMealCandidateBundle(
    assets,
    request(['番茄', '鸡蛋', '西兰花', '土豆']),
  );
  assert.ok(bundle.candidate_plans.length > 0);
  for (const candidate of bundle.candidate_plans) {
    assert.deepEqual(
      Object.keys(candidate.presentation).sort(),
      ['badge', 'canonical_path', 'source_label', 'subtitle', 'title'],
    );
    assert.equal(candidate.presentation.badge, '自定义方案');
    assert.equal(candidate.presentation.source_label, null);
    assert.equal(candidate.presentation.canonical_path, null);
    assert.match(candidate.presentation.title, /(焖饭|汤饭|汤面|焖面|炖锅|快炒饭)$/u);
    assert.doesNotMatch(
      `${candidate.presentation.title}\n${candidate.presentation.subtitle}`,
      /地域|正宗|传统|经典|酸香主食锅|家常主食锅|(?:acid|staple|pot|template)[-_a-z]*/iu,
    );
  }
});

test('real candidates keep unrecognized ingredients separate without changing the submitted denominator', async () => {
  const submitted = ['神秘叶子', '番茄', '鸡蛋', '西兰花'];
  const bundle = await planMealCandidateBundle(assets, request(submitted));
  assert.ok(bundle.candidate_plans.length > 0);
  for (const candidate of bundle.candidate_plans) {
    assert.deepEqual(
      candidate.unrecognized_items.map(item => item.raw),
      ['神秘叶子'],
    );
    assert.equal(
      candidate.normalized_items.filter(item => item.duplicate_of == null).length,
      submitted.length,
    );
    assert.equal(selectHybridCandidates([candidate])[0].coverage_total, submitted.length);
  }
});

test('hybrid selection rejects missing unknown overlong and unsafe presentation before display', () => {
  const normalized = ['番茄', '鸡蛋'].map((raw, index) => ({
    raw, canonical: raw, canonical_id: `item-${index + 1}`,
    recognized: true, role: 'prefer_use', duplicate_of: null,
  }));
  const base = {
    plan_source: 'custom_template', recipe_id: null, variant_id: null, identity_level: 'custom',
    normalized_items: normalized,
    planned_prefer_use: normalized,
    unused_prefer_use: [], required_extra_items: [],
    template_id: 'acid-staple-pot', technique_signature: ['acid_base_cookdown'],
    slot_assignment: { main: normalized }, plan_id: 'pln_v2_contract_fixture',
  };
  const valid = {
    ...structuredClone(base),
    presentation: {
      badge: '自定义方案', title: '番茄、鸡蛋焖饭',
      subtitle: '按本次选中的食材与受控家常技法组合。',
      source_label: null, canonical_path: null,
    },
  };
  const unknown = structuredClone(valid);
  unknown.presentation.template_id = 'acid-staple-pot';
  const overlong = structuredClone(valid);
  overlong.presentation.title = '番'.repeat(81);
  const unsafe = structuredClone(valid);
  unsafe.presentation.title = '正宗传统番茄饭';

  assert.deepEqual(selectHybridCandidates([
    { ...structuredClone(base), presentation:null }, unknown, overlong, unsafe,
  ]), []);
  assert.equal(selectHybridCandidates([valid]).length, 1);
});
