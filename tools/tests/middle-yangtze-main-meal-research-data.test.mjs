import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateMiddleYangtzeMainMealResearch } from '../lib/middle-yangtze-main-meal-research-validator.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const assessment = readJson('../data/middle-yangtze-main-meal-research.v1.json');
const inputs = {
  assessment,
  recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'),
  regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

const PROVINCES = ['CN-HB', 'CN-HN', 'CN-JX'];
const LEADS = [
  'hubei-enshi-ready-doupi-bowl',
  'hubei-mianyang-mixed-grain-powder-steam',
  'hubei-wuhan-three-delicacy-doupi',
  'hubei-xiantao-eel-rice-noodle-bowl',
  'hunan-xiangxi-shefan',
  'hunan-yongzhou-grey-zongzi',
  'jiangxi-nanchang-stir-fried-rice-noodle',
  'jiangxi-nanfeng-rice-noodle-bowl',
];

test('assessment keeps the real three-province zero-mapping baseline', () => {
  assert.deepEqual(assessment.province_gap_audits.map(row => row.province_code).sort(), PROVINCES);
  assert.ok(assessment.province_gap_audits.every(row => row.production_recipe_ids.length === 0));
  assert.ok(assessment.province_gap_audits.every(row => row.candidate_ids.length === 0));
  assert.deepEqual(validateMiddleYangtzeMainMealResearch(inputs), []);
});

test('eight leads remain research evidence instead of silently becoming recipes or candidates', () => {
  assert.deepEqual(assessment.concrete_research_leads.map(row => row.lead_id).sort(), LEADS);
  assert.ok(assessment.concrete_research_leads.every(row => row.production_recipe_id === null));
  assert.ok(assessment.concrete_research_leads.every(row => row.candidate_id === null));
});

test('Hubei forms preserve multi-stage ready-staple and staple-sufficiency boundaries', () => {
  const leads = new Map(assessment.concrete_research_leads.map(row => [row.lead_id, row]));
  assert.equal(leads.get('hubei-wuhan-three-delicacy-doupi').meal_structure, 'multi_stage_filled_crepe');
  assert.ok(leads.get('hubei-enshi-ready-doupi-bowl').ingredient_shapes.includes('ready_rice_bean_sheet'));
  assert.ok(leads.get('hubei-enshi-ready-doupi-bowl').forbidden_shortcuts.includes('raw_rice_to_ready_doupi_same_meal'));
  assert.equal(leads.get('hubei-mianyang-mixed-grain-powder-steam').claims.staple_sufficiency.verdict, 'not_proven');
  assert.equal(leads.get('hubei-xiantao-eel-rice-noodle-bowl').claims.quick_household_equivalence.verdict, 'not_proven');
});

test('Hunan evidence never turns contradictory prose into executable ratios or grey zongzi into quick food', () => {
  const leads = new Map(assessment.concrete_research_leads.map(row => [row.lead_id, row]));
  const shefan = leads.get('hunan-xiangxi-shefan');
  assert.equal(shefan.claims.regional_structure.verdict, 'supported');
  assert.equal(shefan.claims.executable_ratio.verdict, 'not_proven');
  assert.ok(shefan.forbidden_shortcuts.includes('source_ratio_to_ratio_dsl'));
  const zongzi = leads.get('hunan-yongzhou-grey-zongzi');
  assert.equal(zongzi.claims.quick_household_equivalence.verdict, 'contradicted');
  assert.equal(zongzi.product_destinations.includes('content_only'), true);
});

test('Jiangxi ready rice noodles and two-vessel boundaries stay explicit', () => {
  const leads = new Map(assessment.concrete_research_leads.map(row => [row.lead_id, row]));
  assert.ok(leads.get('jiangxi-nanchang-stir-fried-rice-noodle').ingredient_shapes.includes('ready_or_precooked_rice_noodle'));
  assert.ok(leads.get('jiangxi-nanfeng-rice-noodle-bowl').forbidden_shortcuts.includes('dry_noodle_without_pretreatment'));
  const boundary = assessment.adaptation_boundaries.find(row => row.boundary_id === 'claypot-soup-plus-noodle-is-two-vessel');
  assert.equal(boundary.evidence_status, 'checked');
});

test('wet rice noodle safety does not pretend heat destroys preformed toxin', () => {
  const row = assessment.safety_boundaries.find(item => item.safety_id === 'wet-rice-noodle-source-storage-discard');
  assert.deepEqual(row.required_controls, ['正规来源', '按标签冷藏', '保质期内尽快食用', '异常或过期立即丢弃']);
  assert.match(row.endpoint_note, /加热.*不能.*米酵菌酸/);
  assert.equal('minutes' in row, false);
  assert.equal('storage_hours' in row, false);
});

test('validator rejects dishonest promotion shape collapse and heat-only wet noodle safety', () => {
  const broken = structuredClone(assessment);
  broken.province_gap_audits[0].production_recipe_ids = ['invented-recipe'];
  broken.concrete_research_leads[0].production_recipe_id = 'invented-recipe';
  broken.concrete_research_leads.find(row => row.lead_id === 'hubei-enshi-ready-doupi-bowl').forbidden_shortcuts = [];
  broken.concrete_research_leads.find(row => row.lead_id === 'hunan-xiangxi-shefan').claims.executable_ratio.verdict = 'supported';
  broken.adaptation_boundaries.find(row => row.boundary_id === 'claypot-soup-plus-noodle-is-two-vessel').evidence_status = 'unresearched';
  const wet = broken.safety_boundaries.find(row => row.safety_id === 'wet-rice-noodle-source-storage-discard');
  wet.required_controls = ['彻底加热'];
  wet.endpoint_note = '煮熟即可安全';
  const message = validateMiddleYangtzeMainMealResearch({ ...inputs, assessment: broken }).join('\n');
  assert.match(message, /zero-mapping baseline/);
  assert.match(message, /research leads cannot reference a production recipe/);
  assert.match(message, /ready doupi cannot be synthesized from raw rice/);
  assert.match(message, /shefan executable ratio must remain not_proven/);
  assert.match(message, /claypot soup plus noodle must remain two-vessel/);
  assert.match(message, /wet rice noodle controls/);
});

test('fifteen household journeys remain pending and cover each province', () => {
  assert.equal(assessment.journey_cases.length, 15);
  assert.equal(new Set(assessment.journey_cases.map(row => row.journey_id)).size, 15);
  assert.deepEqual([...new Set(assessment.journey_cases.map(row => row.province_code))].sort(), PROVINCES);
  assert.ok(assessment.journey_cases.every(row => row.human_review.status === 'pending'));
  assert.equal(assessment.journey_cases.find(row => row.journey_id === 'my-j12').expected_outcome, 'requires_pretreatment');
  assert.equal(assessment.journey_cases.find(row => row.journey_id === 'my-j14').expected_structure, 'two_vessel_meal');
});

test('validator is total for malformed roots and nested rows', () => {
  assert.deepEqual(validateMiddleYangtzeMainMealResearch({ assessment: null }), ['assessment must be an object']);
  assert.doesNotThrow(() => validateMiddleYangtzeMainMealResearch({
    assessment: {
      source_refs: [null], province_gap_audits: [null], concrete_research_leads: [null],
      family_model: [null], adaptation_boundaries: [null], safety_boundaries: [null], journey_cases: [null],
    },
    recipeLibrary: { recipes: [null] }, regionalResearch: { entries: [null] }, regionalAtlas: null,
    regionalMappings: { production_recipe_mappings: [null], research_candidate_mappings: [null] },
  }));
});
