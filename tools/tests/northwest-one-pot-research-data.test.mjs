import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateNorthwestOnePotResearch } from '../lib/northwest-one-pot-research-validator.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const assessment = readJson('../data/northwest-one-pot-research.v1.json');
const inputs = {
  assessment,
  recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'),
  regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

const PRODUCTION_IDS = ['shaanbei-red-date-cowpea-rice', 'xinjiang-lamb-pilaf', 'xinjiang-vegetable-pilaf'];
const LEAD_IDS = [
  'gansu-heyan-jiumianpian-broth', 'huaining-mixed-grain-jiaotuan',
  'huayin-mashi-pao', 'ningxia-rouzhanfan-steamed-rice',
  'ningxia-shengcuan-jiumian-bowl', 'turpan-soup-rice-technique',
  'xifu-jiaotuan-seasoned-bowl', 'xinjiang-household-jupianzi-soup',
];
const FAMILY_IDS = [
  'festive-soft-grain-date-bean-braise', 'noodle-piece-broth-main-bowl',
  'pre-saute-meat-vegetable-steamed-rice', 'staged-pilaf-raw-rice',
  'stirred-grain-thick-main-bowl',
];
const BOUNDARY_IDS = [
  'heyan_ich_not_recipe', 'huayin_cross_locality_and_single_pot_unproven',
  'jiaotuan_not_unattended_appliance', 'pilaf_named_branches_not_free_slots',
  'rouzhanfan_not_any_meat_rice_braise', 'sanfan_dispute_not_family',
  'shengcuan_branches_not_one_recipe', 'soft_grain_not_ordinary_rice',
  'turpan_ich_not_recipe',
];

test('assessment locks four Northwest nodes, the unchanged 3/0 baseline, eight leads, five families and sixteen pending journeys', () => {
  assert.equal(assessment.region_id, 'northwest');
  assert.deepEqual(assessment.province_codes, ['CN-SN', 'CN-GS', 'CN-NX', 'CN-XJ']);
  assert.deepEqual(assessment.production_recipe_audits.map(row => row.recipe_id).sort(), PRODUCTION_IDS);
  assert.deepEqual(assessment.candidate_audits, []);
  assert.deepEqual(assessment.concrete_research_leads.map(row => row.lead_id).sort(), LEAD_IDS);
  assert.deepEqual(assessment.family_model.map(row => row.family_id).sort(), FAMILY_IDS);
  assert.deepEqual(assessment.adaptation_boundaries.map(row => row.boundary_id).sort(), BOUNDARY_IDS);
  assert.equal(assessment.journey_cases.length, 16);
  assert.ok(assessment.journey_cases.every(row => row.human_review.status === 'pending'));
  assert.deepEqual(validateNorthwestOnePotResearch(inputs), []);
});

test('validator keeps the fixed Northwest adaptation boundaries fail-closed', () => {
  const broken = structuredClone(assessment);
  broken.adaptation_boundaries.pop();
  assert.match(validateNorthwestOnePotResearch({ ...inputs, assessment: broken }).join('\n'), /adaptation boundary IDs must match/);
});

test('source claims retain direct proof, non-proof and contradiction directions without forged dates', () => {
  assert.ok(assessment.source_refs.every(row => Array.isArray(row.proves) && Array.isArray(row.does_not_prove) && Array.isArray(row.contradicts)));
  assert.ok(assessment.source_refs.filter(row => row.published_at === 'undated').every(row => typeof row.date_note === 'string' && row.date_note.length > 0));
  const huayin = assessment.concrete_research_leads.find(row => row.lead_id === 'huayin-mashi-pao');
  assert.equal(huayin.claims.cross_locality_shape_not_proven.verdict, 'not_proven');
  assert.ok(huayin.forbidden_shortcuts.includes('single_pot_equivalence'));
});

test('production audits and research-only leads cannot promote unproven substitutions, slots or generic appliance equivalence', () => {
  const byRecipe = new Map(assessment.production_recipe_audits.map(row => [row.recipe_id, row]));
  assert.equal(byRecipe.get('shaanbei-red-date-cowpea-rice').claims.ordinary_rice_adaptation.verdict, 'not_proven');
  assert.equal(byRecipe.get('xinjiang-lamb-pilaf').claims.named_lamb_cut_and_fruit_slots.verdict, 'not_proven');
  assert.equal(byRecipe.get('xinjiang-vegetable-pilaf').claims.current_formula_equivalence.verdict, 'not_proven');
  assert.ok(assessment.concrete_research_leads.every(row => row.production_recipe_id === null && row.candidate_id === null));
});

test('validator fails closed for baseline drift, claim-direction inflation and malformed input', () => {
  const mappingBroken = structuredClone(assessment);
  mappingBroken.production_recipe_audits.pop();
  assert.match(validateNorthwestOnePotResearch({ ...inputs, assessment: mappingBroken }).join('\n'), /production audit IDs must match/);
  const directionBroken = structuredClone(assessment);
  directionBroken.concrete_research_leads.find(row => row.lead_id === 'huayin-mashi-pao').claims.cross_locality_shape_not_proven.verdict = 'supported';
  assert.match(validateNorthwestOnePotResearch({ ...inputs, assessment: directionBroken }).join('\n'), /must be reverse-indexed/);
  assert.deepEqual(validateNorthwestOnePotResearch({ assessment: null }), ['assessment must be an object']);
});

test('validator rejects orphan source tokens, deleted claims, and verdict inflation even when a source direction is edited too', () => {
  const orphan = structuredClone(assessment);
  orphan.source_refs.find(row => row.source_id === 'gs-lanzhou-noodle-2024').proves.push('lead:invented:claim');
  assert.match(validateNorthwestOnePotResearch({ ...inputs, assessment: orphan }).join('\n'), /is not a canonical claim token/);

  const deleted = structuredClone(assessment);
  delete deleted.production_recipe_audits.find(row => row.recipe_id === 'shaanbei-red-date-cowpea-rice').claims.ordinary_rice_adaptation;
  assert.match(validateNorthwestOnePotResearch({ ...inputs, assessment: deleted }).join('\n'), /has no matching assessment claim/);

  const inflated = structuredClone(assessment);
  const token = 'production:shaanbei-red-date-cowpea-rice:ordinary_rice_adaptation';
  inflated.production_recipe_audits.find(row => row.recipe_id === 'shaanbei-red-date-cowpea-rice').claims.ordinary_rice_adaptation.verdict = 'supported';
  for (const sourceId of ['sn-mizhi-laba-2017', 'sn-shaanxi-daily-laba-2020', 'sn-samr-broomcorn-millet-undated']) {
    const source = inflated.source_refs.find(row => row.source_id === sourceId);
    source.does_not_prove = source.does_not_prove.filter(value => value !== token);
    source.proves.push(token);
  }
  assert.match(validateNorthwestOnePotResearch({ ...inputs, assessment: inflated }).join('\n'), /fixed verdict must remain not_proven/);
});

test('validator fixes entity province ownership, per-province lead distribution, and mapping province scope', () => {
  const leadBroken = structuredClone(assessment);
  leadBroken.concrete_research_leads.find(row => row.lead_id === 'xifu-jiaotuan-seasoned-bowl').province_code = 'CN-GS';
  assert.match(validateNorthwestOnePotResearch({ ...inputs, assessment: leadBroken }).join('\n'), /lead province mapping must remain fixed/);

  const auditBroken = structuredClone(assessment);
  auditBroken.production_recipe_audits.find(row => row.recipe_id === 'shaanbei-red-date-cowpea-rice').province_code = 'CN-XJ';
  assert.match(validateNorthwestOnePotResearch({ ...inputs, assessment: auditBroken }).join('\n'), /production province mapping must remain fixed/);

  const mappingBroken = structuredClone(inputs.regionalMappings);
  mappingBroken.production_recipe_mappings.find(row => row.source_id === 'shaanbei-red-date-cowpea-rice').province_codes = ['CN-XJ'];
  assert.match(validateNorthwestOnePotResearch({ ...inputs, regionalMappings: mappingBroken }).join('\n'), /production mapping province scope must remain fixed/);
});

test('validator fingerprints fixed family, boundary and journey semantics beyond IDs and counts', () => {
  const familyBroken = structuredClone(assessment);
  familyBroken.family_model[0].meal_structure = 'generic_rice_cooker_free_slot';
  assert.match(validateNorthwestOnePotResearch({ ...inputs, assessment: familyBroken }).join('\n'), /family_model semantic fingerprint mismatch/);

  const boundaryBroken = structuredClone(assessment);
  boundaryBroken.adaptation_boundaries[0].notes = '普通大米与软谷物完全等价。';
  assert.match(validateNorthwestOnePotResearch({ ...inputs, assessment: boundaryBroken }).join('\n'), /adaptation_boundaries semantic fingerprint mismatch/);

  const journeyBroken = structuredClone(assessment);
  journeyBroken.journey_cases[0].input_items = ['普通大米'];
  journeyBroken.journey_cases[1].journey_id = journeyBroken.journey_cases[0].journey_id;
  assert.match(validateNorthwestOnePotResearch({ ...inputs, assessment: journeyBroken }).join('\n'), /journey_cases semantic fingerprint mismatch/);
  assert.match(validateNorthwestOnePotResearch({ ...inputs, assessment: journeyBroken }).join('\n'), /journey_ids must be unique/);
});
