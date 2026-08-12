import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateShandongOnePotResearch } from '../lib/shandong-one-pot-research-validator.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const assessment = readJson('../data/shandong-one-pot-research.v1.json');
const recipeLibrary = readJson('../data/recipe-library.json');
const regionalResearch = readJson('../data/regional-menu-research.v1.json');
const regionalAtlas = readJson('../data/regional-atlas.v2.json');
const regionalMappings = readJson('../data/regional-menu-mappings.v1.json');
const inputs = { assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings };

const PRODUCTION_IDS = ['north-china-green-bean-braised-noodles'];
const CANDIDATE_IDS = [
  'shandong-cabbage-tofu-vermicelli-pot',
  'shandong-seafood-staple-pot',
  'shandong-southwest-family-pot',
  'shandong-vegetable-cornmeal-one-pot',
];

test('assessment audits exactly one production recipe and four Shandong candidates', () => {
  assert.deepEqual(assessment.production_recipe_audits.map(row => row.recipe_id), PRODUCTION_IDS);
  assert.deepEqual(assessment.candidate_audits.map(row => row.candidate_id).sort(), CANDIDATE_IDS);
  assert.deepEqual(validateShandongOnePotResearch(inputs), []);
});

test('Shandong consumption evidence never turns northern braised noodles into a Shandong-specific tradition', () => {
  const row = assessment.production_recipe_audits[0];
  assert.equal(row.claims.shandong_current_presence.verdict, 'supported');
  assert.equal(row.claims.shandong_specific_origin.verdict, 'not_proven');
  assert.equal(row.regional_scope_decision, 'cross_regional_chinese');
});

test('large-pot evidence does not silently add vermicelli or claim a same-pot staple', () => {
  const row = assessment.candidate_audits.find(item => item.candidate_id === 'shandong-cabbage-tofu-vermicelli-pot');
  assert.equal(row.claims.cabbage_tofu_large_pot.verdict, 'supported');
  assert.equal(row.claims.vermicelli_as_fixed_core.verdict, 'not_proven');
  assert.equal(row.claims.complete_same_pot_main_meal.verdict, 'not_proven');
});

test('generic seafood hypothesis is refined into concrete meal families without becoming recipes', () => {
  assert.deepEqual(assessment.concrete_research_leads.map(row => row.lead_id).sort(), [
    'shandong-haixian-dough-drop-soup',
    'shandong-ninghai-naofan',
  ]);
  assert.ok(assessment.concrete_research_leads.every(row => row.production_recipe_id === null));
  assert.ok(assessment.concrete_research_leads.every(row => row.product_destinations.includes('new_family_research')));
});

test('vague southwest and cornmeal candidates remain unproven research hypotheses', () => {
  const byId = new Map(assessment.candidate_audits.map(row => [row.candidate_id, row]));
  assert.equal(byId.get('shandong-southwest-family-pot').claims.regional_identity.verdict, 'not_proven');
  assert.equal(byId.get('shandong-vegetable-cornmeal-one-pot').claims.defined_food_form.verdict, 'not_proven');
  assert.deepEqual(byId.get('shandong-vegetable-cornmeal-one-pot').shape_distinctions, [
    'ready_pancake', 'cornmeal_batter', 'pot-edge-cake',
  ]);
});

test('bean and seafood safety remain separate endpoint principles without invented project quantities', () => {
  assert.deepEqual(assessment.safety_boundaries.map(row => row.safety_id).sort(), [
    'bean-cook-through', 'seafood-cook-through-cross-contamination',
  ]);
  for (const row of assessment.safety_boundaries) {
    assert.equal(row.evidence_status, 'principle_only');
    assert.equal('grams' in row, false);
    assert.equal('minutes' in row, false);
    assert.equal('temperature_c' in row, false);
  }
});

test('validator rejects false localization silent vermicelli proof and promoted research leads', () => {
  const broken = structuredClone(assessment);
  broken.production_recipe_audits[0].regional_scope_decision = 'province_specific';
  broken.production_recipe_audits[0].claims.shandong_specific_origin.verdict = 'supported';
  const cabbage = broken.candidate_audits.find(row => row.candidate_id === 'shandong-cabbage-tofu-vermicelli-pot');
  cabbage.claims.vermicelli_as_fixed_core.verdict = 'supported';
  broken.concrete_research_leads[0].production_recipe_id = 'invented-recipe';
  broken.source_refs[0].url = 'https://yiguochu.pages.dev/recipes.html?id=fake';
  const message = validateShandongOnePotResearch({ ...inputs, assessment: broken }).join('\n');
  assert.match(message, /production audit must remain cross_regional_chinese/);
  assert.match(message, /Shandong-specific origin must remain not_proven/);
  assert.match(message, /vermicelli as fixed core must remain not_proven/);
  assert.match(message, /research leads cannot reference a production recipe/);
  assert.match(message, /project canonical URL cannot be regional evidence/);
});

test('validator is total for malformed roots and nested rows', () => {
  assert.deepEqual(validateShandongOnePotResearch({ assessment: null }), ['assessment must be an object']);
  assert.doesNotThrow(() => validateShandongOnePotResearch({
    assessment: {
      source_refs: [null], production_recipe_audits: [null], candidate_audits: [null],
      concrete_research_leads: [null], family_model: [null], safety_boundaries: [null], journey_cases: [null],
    },
    recipeLibrary: { recipes: [null] }, regionalResearch: { entries: [null] }, regionalAtlas: null,
    regionalMappings: { production_recipe_mappings: [null], research_candidate_mappings: [null] },
  }));
});

test('twelve household journeys preserve unresolved family and safety decisions for human review', () => {
  assert.equal(assessment.journey_cases.length, 12);
  assert.equal(new Set(assessment.journey_cases.map(row => row.journey_id)).size, 12);
  assert.ok(assessment.journey_cases.every(row => row.human_review.status === 'pending'));
  assert.ok(assessment.journey_cases.every(row => row.human_review.household_intuition === null));
  assert.ok(assessment.journey_cases.every(row => row.human_review.operability === null));
  assert.ok(assessment.journey_cases.every(row => row.human_review.taste_judgement === null));
  const byId = new Map(assessment.journey_cases.map(row => [row.journey_id, row]));
  assert.match(byId.get('sd-j01').explanation, /跨北方.*山东传统|山东传统.*跨北方/);
  assert.equal(byId.get('sd-j05').expected_structure, 'pot-plus-ready-staple');
  assert.equal(byId.get('sd-j12').expected_research_outcome, 'unsafe_or_unrecognized');
});
