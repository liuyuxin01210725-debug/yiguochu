import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateSichuanChongqingRiceResearch } from '../lib/sichuan-chongqing-rice-research-validator.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const assessment = readJson('../data/sichuan-chongqing-rice-research.v1.json');
const inputs = {
  assessment,
  recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'),
  regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

const CANDIDATE_IDS = [
  'chongqing-firewood-potato-rice-home',
  'sichuan-bean-potato-rice',
  'sichuan-corn-potato-rice',
  'sichuan-salted-pork-potato-rice',
];
const LEAD_IDS = [
  'chongqing-youzhou-shefan',
  'sichuan-golden-wrapped-silver-rice',
  'sichuan-kong-dry-rice',
];

test('assessment locks the two atlas nodes and unchanged zero-production four-candidate baseline', () => {
  assert.equal(assessment.region_id, 'sichuan_chongqing');
  assert.deepEqual(assessment.province_codes, ['CN-SC', 'CN-CQ']);
  assert.deepEqual(assessment.production_recipe_audits, []);
  assert.deepEqual(assessment.candidate_audits.map(row => row.candidate_id).sort(), CANDIDATE_IDS);
  assert.deepEqual(assessment.concrete_research_leads.map(row => row.lead_id).sort(), LEAD_IDS);
  assert.deepEqual(validateSichuanChongqingRiceResearch(inputs), []);
});

test('Kong rice keeps parboiled drained rice distinct from raw-rice braising and cooked leftover rice', () => {
  const lead = assessment.concrete_research_leads.find(row => row.lead_id === 'sichuan-kong-dry-rice');
  assert.ok(lead.ingredient_shapes.includes('parboiled_drained_rice'));
  assert.ok(lead.forbidden_shortcuts.includes('raw_rice_braise_equivalence'));
  assert.ok(lead.forbidden_shortcuts.includes('cooked_leftover_rice_equivalence'));
  assert.equal(lead.claims.project_ratio_safety.verdict, 'not_proven');
});

test('parallel vegetable examples never become a fixed bean potato or corn potato tradition', () => {
  const candidates = new Map(assessment.candidate_audits.map(row => [row.candidate_id, row]));
  assert.equal(candidates.get('sichuan-bean-potato-rice').claims.fixed_bean_potato_core.verdict, 'not_proven');
  assert.equal(candidates.get('sichuan-corn-potato-rice').claims.fixed_corn_potato_core.verdict, 'not_proven');
  assert.ok(candidates.get('sichuan-bean-potato-rice').forbidden_claims.includes('parallel_examples_as_required_combination'));
  assert.ok(candidates.get('sichuan-corn-potato-rice').forbidden_claims.includes('cornmeal_as_corn_kernel_equivalence'));
});

test('Chongqing potato rice evidence supports core identity but not a silent electric-cooker conversion', () => {
  const candidate = assessment.candidate_audits.find(row => row.candidate_id === 'chongqing-firewood-potato-rice-home');
  assert.equal(candidate.claims.chongqing_potato_rice_identity.verdict, 'supported');
  assert.equal(candidate.claims.household_appliance_equivalence.verdict, 'not_proven');
  assert.ok(candidate.ingredient_shapes.includes('raw_rice'));
  assert.ok(candidate.ingredient_shapes.includes('fried_potato_chunks'));
});

test('optional cured meat does not prove the Sichuan cured pork candidate as a fixed traditional core', () => {
  const candidate = assessment.candidate_audits.find(row => row.candidate_id === 'sichuan-salted-pork-potato-rice');
  assert.equal(candidate.claims.cured_meat_as_optional_garnish.verdict, 'supported');
  assert.equal(candidate.claims.sichuan_fixed_cured_pork_core.verdict, 'not_proven');
  assert.ok(candidate.forbidden_claims.includes('optional_garnish_as_fixed_core'));
});

test('research leads remain outside production and candidate ledgers', () => {
  for (const lead of assessment.concrete_research_leads) {
    assert.equal(lead.production_recipe_id, null);
    assert.equal(lead.candidate_id, null);
  }
});

test('potato, green bean and cured meat controls remain principle-only and human journeys stay pending', () => {
  assert.deepEqual(assessment.safety_boundaries.map(row => row.safety_id).sort(), [
    'cured-meat-cook-through-and-salt', 'green-bean-cook-through', 'potato-sprout-green-control',
  ]);
  assert.ok(assessment.safety_boundaries.every(row => row.evidence_status === 'principle_only'));
  assert.equal(assessment.journey_cases.length, 12);
  assert.ok(assessment.journey_cases.every(row => row.human_review.status === 'pending'));
});

test('validator rejects silent family collapse and invented product links', () => {
  const broken = structuredClone(assessment);
  broken.candidate_audits.find(row => row.candidate_id === 'sichuan-bean-potato-rice').claims.fixed_bean_potato_core.verdict = 'supported';
  broken.candidate_audits.find(row => row.candidate_id === 'chongqing-firewood-potato-rice-home').claims.household_appliance_equivalence.verdict = 'supported';
  broken.concrete_research_leads.find(row => row.lead_id === 'sichuan-kong-dry-rice').production_recipe_id = 'invented';
  const message = validateSichuanChongqingRiceResearch({ ...inputs, assessment: broken }).join('\n');
  assert.match(message, /bean potato fixed core must remain not_proven/);
  assert.match(message, /household appliance equivalence must remain not_proven/);
  assert.match(message, /research leads cannot reference a production recipe/);
});

test('validator is total for malformed roots and nested rows', () => {
  assert.deepEqual(validateSichuanChongqingRiceResearch({ assessment: null }), ['assessment must be an object']);
  assert.doesNotThrow(() => validateSichuanChongqingRiceResearch({
    assessment: { source_refs: [null], production_recipe_audits: [null], candidate_audits: [null], concrete_research_leads: [null], family_model: [null], adaptation_boundaries: [null], safety_boundaries: [null], journey_cases: [null] },
    recipeLibrary: { recipes: [null] }, regionalResearch: { entries: [null] }, regionalAtlas: null,
    regionalMappings: { production_recipe_mappings: [null], research_candidate_mappings: [null] },
  }));
});
