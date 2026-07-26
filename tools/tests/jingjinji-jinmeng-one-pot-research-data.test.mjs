import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateJingjinjiJinmengOnePotResearch } from '../lib/jingjinji-jinmeng-one-pot-research-validator.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const assessment = readJson('../data/jingjinji-jinmeng-one-pot-research.v1.json');
const inputs = {
  assessment,
  recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'),
  regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

const PRODUCTION_IDS = ['north-china-green-bean-braised-noodles', 'shanxi-nitun-millet-rice', 'shanxi-potato-rice'];
const CANDIDATE_IDS = [
  'north-cabbage-pork-braised-noodles', 'north-mushroom-vegetable-braised-noodles',
  'north-pork-bean-braised-noodles', 'north-potato-bean-braised-noodles',
];
const LEAD_IDS = ['beijing-pinggu-sticky-roll', 'hebei-julu-braised-pancake', 'inner-mongolia-western-braised-noodle', 'tianjin-fish-staple-pot'];

test('assessment locks both atlas regions, five province nodes and the unchanged 3/4 mapping baseline', () => {
  assert.deepEqual(assessment.region_ids, ['jingjinji', 'jinmeng']);
  assert.deepEqual(assessment.province_gap_audits.map(row => row.province_code).sort(), ['CN-BJ', 'CN-HE', 'CN-NM', 'CN-SX', 'CN-TJ']);
  assert.deepEqual(assessment.production_recipe_audits.map(row => row.recipe_id).sort(), PRODUCTION_IDS);
  assert.deepEqual(assessment.candidate_audits.map(row => row.candidate_id).sort(), CANDIDATE_IDS);
  assert.deepEqual(assessment.concrete_research_leads.map(row => row.lead_id).sort(), LEAD_IDS);
  assert.deepEqual(validateJingjinjiJinmengOnePotResearch(inputs), []);
});

test('staple shapes cannot collapse cooked pancake, dough roll, corn cake, fresh noodle and raw grain', () => {
  const leads = new Map(assessment.concrete_research_leads.map(row => [row.lead_id, row]));
  assert.ok(leads.get('hebei-julu-braised-pancake').ingredient_shapes.includes('cooked_wheat_pancake_shreds'));
  assert.ok(leads.get('beijing-pinggu-sticky-roll').ingredient_shapes.includes('raw_wheat_dough_roll'));
  assert.ok(leads.get('tianjin-fish-staple-pot').ingredient_shapes.includes('cornmeal_cake_or_steamed_roll_unresolved'));
  assert.ok(leads.get('inner-mongolia-western-braised-noodle').ingredient_shapes.includes('fresh_wheat_noodle'));
  assert.ok(assessment.production_recipe_audits.find(row => row.recipe_id === 'shanxi-potato-rice').ingredient_shapes.includes('raw_rice'));
});

test('cross-regional braised noodle evidence does not prove province exclusivity or every candidate core', () => {
  const production = assessment.production_recipe_audits.find(row => row.recipe_id === 'north-china-green-bean-braised-noodles');
  assert.equal(production.claims.cross_northern_identity.verdict, 'supported');
  assert.equal(production.claims.province_exclusive_identity.verdict, 'not_proven');
  for (const candidate of assessment.candidate_audits) {
    assert.equal(candidate.claims.cross_regional_family.verdict, 'supported');
    assert.equal(candidate.claims.fixed_traditional_core.verdict, 'not_proven');
    assert.ok(candidate.forbidden_claims.includes('optional_ingredient_as_fixed_regional_core'));
  }
});

test('local presence evidence remains weaker than exact project method and Ratio DSL', () => {
  const leads = new Map(assessment.concrete_research_leads.map(row => [row.lead_id, row]));
  assert.equal(leads.get('beijing-pinggu-sticky-roll').claims.regional_structure.verdict, 'supported');
  assert.equal(leads.get('beijing-pinggu-sticky-roll').claims.project_ratio_safety.verdict, 'not_proven');
  assert.equal(leads.get('tianjin-fish-staple-pot').claims.single_pot_process.verdict, 'not_proven');
  assert.equal(leads.get('hebei-julu-braised-pancake').claims.raw_noodle_equivalence.verdict, 'contradicted');
});

test('validator rejects source inflation and staple-shape collapse', () => {
  const broken = structuredClone(assessment);
  broken.production_recipe_audits.find(row => row.recipe_id === 'north-china-green-bean-braised-noodles').claims.province_exclusive_identity.verdict = 'supported';
  broken.candidate_audits[0].claims.fixed_traditional_core.verdict = 'supported';
  broken.concrete_research_leads.find(row => row.lead_id === 'hebei-julu-braised-pancake').claims.raw_noodle_equivalence.verdict = 'supported';
  broken.concrete_research_leads.find(row => row.lead_id === 'tianjin-fish-staple-pot').production_recipe_id = 'invented';
  const message = validateJingjinjiJinmengOnePotResearch({ ...inputs, assessment: broken }).join('\n');
  assert.match(message, /province exclusivity must remain not_proven/);
  assert.match(message, /candidate fixed traditional core must remain not_proven/);
  assert.match(message, /braised pancake cannot equal raw noodle/);
  assert.match(message, /research leads cannot reference a production recipe/);
});

test('fifteen household journeys remain pending and cover all five province nodes', () => {
  assert.equal(assessment.journey_cases.length, 15);
  assert.deepEqual([...new Set(assessment.journey_cases.map(row => row.province_code))].sort(), ['CN-BJ', 'CN-HE', 'CN-NM', 'CN-SX', 'CN-TJ']);
  assert.ok(assessment.journey_cases.every(row => row.human_review.status === 'pending'));
});

test('validator is total for malformed roots and nested rows', () => {
  assert.deepEqual(validateJingjinjiJinmengOnePotResearch({ assessment: null }), ['assessment must be an object']);
  assert.doesNotThrow(() => validateJingjinjiJinmengOnePotResearch({
    assessment: { source_refs: [null], province_gap_audits: [null], production_recipe_audits: [null], candidate_audits: [null], concrete_research_leads: [null], family_model: [null], adaptation_boundaries: [null], safety_boundaries: [null], journey_cases: [null] },
    recipeLibrary: { recipes: [null] }, regionalResearch: { entries: [null] }, regionalAtlas: null,
    regionalMappings: { production_recipe_mappings: [null], research_candidate_mappings: [null] },
  }));
});
