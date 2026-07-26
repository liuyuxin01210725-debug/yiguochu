import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateCentralPlainsNoodleResearch } from '../lib/central-plains-noodle-research-validator.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const assessment = readJson('../data/central-plains-noodle-research.v1.json');
const recipeLibrary = readJson('../data/recipe-library.json');
const regionalResearch = readJson('../data/regional-menu-research.v1.json');
const regionalAtlas = readJson('../data/regional-atlas.v2.json');
const regionalMappings = readJson('../data/regional-menu-mappings.v1.json');
const inputs = { assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings };

const PRODUCTION_IDS = ['north-china-green-bean-braised-noodles'];
const CANDIDATE_IDS = [
  'henan-bean-pork-steamed-noodles',
  'henan-cabbage-mushroom-steamed-noodles',
  'henan-celery-pork-steamed-noodles',
  'henan-home-one-pot-steamed-braised-noodles',
];

test('assessment audits exactly one production recipe and four Central Plains candidates', () => {
  assert.deepEqual(assessment.production_recipe_audits.map(row => row.recipe_id), PRODUCTION_IDS);
  assert.deepEqual(assessment.candidate_audits.map(row => row.candidate_id).sort(), CANDIDATE_IDS);
  assert.deepEqual(validateCentralPlainsNoodleResearch(inputs), []);
});

test('current Henan presence never turns northern braised noodles into a Henan-specific tradition', () => {
  const row = assessment.production_recipe_audits[0];
  assert.equal(row.claims.henan_current_presence.verdict, 'supported');
  assert.equal(row.claims.henan_specific_origin.verdict, 'not_proven');
  assert.equal(row.regional_scope_decision, 'cross_regional_chinese');
});

test('only bean and pork has evidence for the fixed steamed-noodle pairing', () => {
  const bean = assessment.candidate_audits.find(row => row.candidate_id === 'henan-bean-pork-steamed-noodles');
  assert.equal(bean.claims.bean_pork_pairing.verdict, 'supported');
  for (const id of ['henan-celery-pork-steamed-noodles', 'henan-cabbage-mushroom-steamed-noodles']) {
    const row = assessment.candidate_audits.find(item => item.candidate_id === id);
    assert.equal(row.claims.fixed_regional_core.verdict, 'not_proven');
  }
});

test('single-pot route remains an adaptation rather than a traditional identity claim', () => {
  const row = assessment.candidate_audits.find(item => item.candidate_id === 'henan-home-one-pot-steamed-braised-noodles');
  assert.equal(row.claims.traditional_single_pot_identity.verdict, 'not_proven');
  assert.equal(row.claims.vessel_process_equivalence.verdict, 'not_proven');
});

test('concrete research leads keep three distinct Central Plains families without becoming recipes', () => {
  assert.deepEqual(assessment.concrete_research_leads.map(row => row.lead_id).sort(), [
    'henan-huimian-broth-pulled-noodle',
    'henan-luoyang-fermented-sour-noodle-bowl',
    'henan-wugang-mohu-grain-vegetable-bowl',
  ]);
  assert.ok(assessment.concrete_research_leads.every(row => row.production_recipe_id === null));
  assert.ok(assessment.concrete_research_leads.every(row => row.product_destinations.includes('new_family_research')));
});

test('noodle and grain forms remain distinct instead of collapsing into generic noodles', () => {
  const byId = new Map(assessment.candidate_audits.map(row => [row.candidate_id, row]));
  assert.deepEqual(byId.get('henan-bean-pork-steamed-noodles').shape_distinctions, [
    'fresh_noodle', 'presteamed_noodle', 'steamed_then_mixed_and_resteamed',
  ]);
  const leads = new Map(assessment.concrete_research_leads.map(row => [row.lead_id, row]));
  assert.equal(leads.get('henan-huimian-broth-pulled-noodle').family_id, 'broth-pulled-noodle');
  assert.equal(leads.get('henan-luoyang-fermented-sour-noodle-bowl').family_id, 'fermented-sour-noodle-bowl');
  assert.equal(leads.get('henan-wugang-mohu-grain-vegetable-bowl').family_id, 'grain-vegetable-thick-bowl');
});

test('bean and pork safety remain endpoint principles without invented project quantities', () => {
  assert.deepEqual(assessment.safety_boundaries.map(row => row.safety_id).sort(), [
    'bean-cook-through', 'pork-cook-through-cross-contamination',
  ]);
  for (const row of assessment.safety_boundaries) {
    assert.equal(row.evidence_status, 'principle_only');
    assert.equal('grams' in row, false);
    assert.equal('minutes' in row, false);
    assert.equal('liquid_ml' in row, false);
  }
});

test('validator rejects false localization fixed variants and promoted research leads', () => {
  const broken = structuredClone(assessment);
  broken.production_recipe_audits[0].regional_scope_decision = 'province_specific';
  broken.production_recipe_audits[0].claims.henan_specific_origin.verdict = 'supported';
  const celery = broken.candidate_audits.find(row => row.candidate_id === 'henan-celery-pork-steamed-noodles');
  celery.claims.fixed_regional_core.verdict = 'supported';
  const onePot = broken.candidate_audits.find(row => row.candidate_id === 'henan-home-one-pot-steamed-braised-noodles');
  onePot.claims.vessel_process_equivalence.verdict = 'supported';
  broken.concrete_research_leads[0].production_recipe_id = 'invented-recipe';
  broken.source_refs[0].url = 'https://yiguochu.pages.dev/recipes.html?id=fake';
  const message = validateCentralPlainsNoodleResearch({ ...inputs, assessment: broken }).join('\n');
  assert.match(message, /production audit must remain cross_regional_chinese/);
  assert.match(message, /Henan-specific origin must remain not_proven/);
  assert.match(message, /celery fixed regional core must remain not_proven/);
  assert.match(message, /vessel-process equivalence must remain not_proven/);
  assert.match(message, /research leads cannot reference a production recipe/);
  assert.match(message, /project canonical URL cannot be regional evidence/);
});

test('validator is total for malformed roots and nested rows', () => {
  assert.deepEqual(validateCentralPlainsNoodleResearch({ assessment: null }), ['assessment must be an object']);
  assert.doesNotThrow(() => validateCentralPlainsNoodleResearch({
    assessment: {
      source_refs: [null], production_recipe_audits: [null], candidate_audits: [null],
      concrete_research_leads: [null], family_model: [null], adaptation_boundaries: [null],
      safety_boundaries: [null], journey_cases: [null],
    },
    recipeLibrary: { recipes: [null] }, regionalResearch: { entries: [null] }, regionalAtlas: null,
    regionalMappings: { production_recipe_mappings: [null], research_candidate_mappings: [null] },
  }));
});

test('twelve household journeys preserve unresolved family and safety decisions for human review', () => {
  assert.equal(assessment.journey_cases.length, 12);
  assert.equal(new Set(assessment.journey_cases.map(row => row.journey_id)).size, 12);
  assert.ok(assessment.journey_cases.every(row => row.human_review.status === 'pending'));
  assert.ok(assessment.journey_cases.every(row => row.human_review.family_fit === null));
  assert.ok(assessment.journey_cases.every(row => row.human_review.household_feasibility === null));
  assert.ok(assessment.journey_cases.every(row => row.human_review.identity_preserved === null));
  const byId = new Map(assessment.journey_cases.map(row => [row.journey_id, row]));
  assert.equal(byId.get('cp-journey-07').expected_family_ids[0], 'broth-pulled-noodle');
  assert.match(byId.get('cp-journey-09').reason, /普通豆浆.*不能.*发酵酸浆/);
  assert.equal(byId.get('cp-journey-12').expected_outcome, 'safety_conflict');
});
