import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateJiangnanRiceResearch } from '../lib/jiangnan-rice-research-validator.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const assessment = readJson('../data/jiangnan-rice-research.v1.json');
const recipeLibrary = readJson('../data/recipe-library.json');
const recipeCandidates = readJson('../data/recipe-candidates.json');
const regionalAtlas = readJson('../data/regional-atlas.v2.json');
const regionalMappings = readJson('../data/regional-menu-mappings.v1.json');
const inputs = { assessment, recipeLibrary, recipeCandidates, regionalAtlas, regionalMappings };

const EXPECTED_RECIPE_IDS = [
  'banshan-wild-rice',
  'jinshan-clay-oven-vegetable-rice',
  'nanjing-cured-pork-greens-rice',
  'nanjing-duck-greens-rice',
  'nanjing-sausage-greens-rice',
  'shanghai-salted-pork-vegetable-rice',
  'she-people-black-rice',
  'suzhou-salted-pork-vegetable-rice',
];

test('assessment audits exactly the eight existing Jiangnan recipes', () => {
  assert.deepEqual(assessment.recipe_audits.map(row => row.recipe_id).sort(), EXPECTED_RECIPE_IDS);
  assert.deepEqual(validateJiangnanRiceResearch(inputs), []);
});

test('Nanjing cultural evidence does not turn glutinous rice into plain rice evidence', () => {
  const rows = assessment.recipe_audits.filter(row => row.recipe_id.startsWith('nanjing-'));
  assert.equal(rows.length, 3);
  for (const row of rows) {
    assert.equal(row.claims.regional_variant.verdict, 'supported');
    assert.equal(row.claims.production_staple_equivalence.verdict, 'not_proven');
    assert.match(row.claims.production_staple_equivalence.reason, /糯米.*普通大米|普通大米.*糯米/);
  }
});

test('Banshan cultural identity and the project mushroom adaptation stay separate', () => {
  const row = assessment.recipe_audits.find(item => item.recipe_id === 'banshan-wild-rice');
  assert.equal(row.claims.cultural_identity.verdict, 'supported');
  assert.equal(row.claims.production_core_combination.verdict, 'not_proven');
  assert.match(row.claims.production_core_combination.reason, /平菇/);
});

test('She cultural identity does not equate a project color powder with the traditional color source', () => {
  const row = assessment.recipe_audits.find(item => item.recipe_id === 'she-people-black-rice');
  assert.equal(row.claims.cultural_identity.verdict, 'supported');
  assert.equal(row.claims.traditional_color_source_equivalence.verdict, 'not_proven');
  assert.match(row.claims.traditional_color_source_equivalence.reason, /黑米色粉/);
});

test('Anhui gap is represented by research leads rather than fake production recipes', () => {
  assert.deepEqual(assessment.province_research_leads.map(row => row.lead_id).sort(), [
    'anhui-dongzhi-farm-pot-crust-rice',
    'anhui-mugwort-pot-crust',
  ]);
  assert.ok(assessment.province_research_leads.every(row => row.production_recipe_id === null));
  assert.ok(assessment.province_research_leads.every(row => row.product_destinations.includes('research_only')));
});

test('family model keeps staple states protein forms and adaptation boundaries distinct', () => {
  assert.deepEqual(assessment.family_model.staple_states.map(row => row.state_id).sort(), [
    'cooked_rice', 'glutinous_rice', 'plain_rice',
  ]);
  assert.deepEqual(assessment.family_model.protein_forms.map(row => row.form_id).sort(), [
    'cooked_duck', 'cured_pork', 'fresh_meat', 'salted_pork', 'sausage',
  ]);
  assert.deepEqual(assessment.family_model.adaptation_boundaries.map(row => row.boundary_id).sort(), [
    'color-source-to-food-grade-powder',
    'outdoor-fire-to-home-pot',
    'traditional-greens-to-common-greens',
    'traditional-staple-to-plain-rice',
    'wood-fired-stove-to-home-pot',
  ]);
});

test('unresearched ratio and safety rows never invent quantities', () => {
  for (const row of [...assessment.family_model.ratio_branches, ...assessment.family_model.safety_branches]) {
    assert.equal(row.evidence_status, 'unresearched');
    assert.equal('grams' in row, false);
    assert.equal('minutes' in row, false);
    assert.equal('temperature_c' in row, false);
  }
});

test('validator rejects fake recipe links supported claims without proof and promoted Anhui leads', () => {
  const broken = structuredClone(assessment);
  broken.recipe_audits[0].recipe_id = 'not-a-real-recipe';
  broken.recipe_audits.find(row => row.recipe_id.startsWith('nanjing-')).claims.production_staple_equivalence.verdict = 'supported';
  broken.province_research_leads[0].production_recipe_id = 'invented-anhui-recipe';
  broken.province_research_leads[0].product_destinations = ['recipe_evidence'];
  broken.source_refs[0].url = 'https://yiguochu.pages.dev/recipes.html?id=fake-evidence';
  const message = validateJiangnanRiceResearch({ ...inputs, assessment: broken }).join('\n');
  assert.match(message, /recipe audit IDs must match the fixed Jiangnan production set/);
  assert.match(message, /Nanjing plain-rice equivalence must remain not_proven/);
  assert.match(message, /Anhui research leads cannot reference a production recipe/);
  assert.match(message, /Anhui research leads must remain research_only/);
  assert.match(message, /project canonical URL cannot be regional evidence/);
});

test('validator is total for malformed roots and nested rows', () => {
  assert.deepEqual(validateJiangnanRiceResearch({ assessment: null }), ['assessment must be an object']);
  assert.doesNotThrow(() => validateJiangnanRiceResearch({
    assessment: { recipe_audits: [null], source_refs: [null], province_research_leads: [null] },
    recipeLibrary: [null],
    recipeCandidates: [null],
    regionalAtlas: null,
    regionalMappings: { production_recipe_mappings: [null] },
  }));
});

test('twelve household journeys cover family matches and deliberate non-equivalence cases', () => {
  assert.equal(assessment.journey_cases.length, 12);
  assert.equal(new Set(assessment.journey_cases.map(row => row.journey_id)).size, 12);
  assert.ok(assessment.journey_cases.some(row => row.expected_research_outcome === 'supported_family_route'));
  assert.ok(assessment.journey_cases.some(row => row.expected_research_outcome === 'needs_more_evidence'));
  assert.ok(assessment.journey_cases.some(row => row.expected_research_outcome === 'unsupported_for_family'));
  assert.ok(assessment.journey_cases.some(row => row.expected_research_outcome === 'research_lead_only'));
  assert.ok(assessment.journey_cases.every(row => row.human_review.status === 'pending'));
  assert.ok(assessment.journey_cases.every(row => row.human_review.household_intuition === null));
  assert.ok(assessment.journey_cases.every(row => row.human_review.operability === null));
  assert.ok(assessment.journey_cases.every(row => row.human_review.taste_judgement === null));
});

test('journeys make the critical household decisions explicit', () => {
  const byId = new Map(assessment.journey_cases.map(row => [row.journey_id, row]));
  assert.deepEqual(byId.get('jn-j01').expected_used_items, ['大米', '小白菜', '咸肉']);
  assert.equal(byId.get('jn-j07').expected_research_outcome, 'unsupported_for_family');
  assert.match(byId.get('jn-j07').explanation, /剩米饭.*生米/);
  assert.equal(byId.get('jn-j08').expected_research_outcome, 'unsupported_for_family');
  assert.match(byId.get('jn-j08').explanation, /鲜猪肉.*咸肉|咸肉.*鲜猪肉/);
  assert.equal(byId.get('jn-j11').intent, 'quick');
  assert.equal(byId.get('jn-j12').expected_research_outcome, 'research_lead_only');
});

test('journey validator rejects fabricated human review and unsupported outcomes', () => {
  const broken = structuredClone(assessment);
  broken.journey_cases[0].human_review.status = 'passed';
  broken.journey_cases[0].human_review.reviewer = '';
  broken.journey_cases[1].expected_research_outcome = 'pretend_success';
  const message = validateJiangnanRiceResearch({ ...inputs, assessment: broken }).join('\n');
  assert.match(message, /completed human review requires reviewer, date, household judgement, notes and conclusion/);
  assert.match(message, /expected_research_outcome is invalid/);
});
