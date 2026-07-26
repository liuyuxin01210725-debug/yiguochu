import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateYunnanGuizhouRiceResearch } from '../lib/yunnan-guizhou-rice-research-validator.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const assessment = readJson('../data/yunnan-guizhou-rice-research.v1.json');
const inputs = {
  assessment,
  recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'),
  regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

const PRODUCTION_IDS = ['dai-pineapple-purple-rice', 'guizhou-dong-community-rice'];
const CANDIDATE_IDS = [
  'yunnan-copper-pot-potato-rice-home',
  'yunnan-corn-chicken-rice',
  'yunnan-ham-flavor-rice-pot',
  'yunnan-mushroom-potato-rice',
];
const LEAD_IDS = [
  'guizhou-dong-shefan-parboiled-rice',
  'yunnan-dai-pineapple-glutinous-rice',
  'yunnan-jiangchuan-copper-pot-potato-rice',
];

test('assessment locks the two atlas nodes and unchanged two-production four-candidate baseline', () => {
  assert.equal(assessment.region_id, 'yunnan_guizhou');
  assert.deepEqual(assessment.province_codes, ['CN-YN', 'CN-GZ']);
  assert.deepEqual(assessment.production_recipe_audits.map(row => row.recipe_id).sort(), PRODUCTION_IDS);
  assert.deepEqual(assessment.candidate_audits.map(row => row.candidate_id).sort(), CANDIDATE_IDS);
  assert.deepEqual(assessment.concrete_research_leads.map(row => row.lead_id).sort(), LEAD_IDS);
  assert.deepEqual(validateYunnanGuizhouRiceResearch(inputs), []);
});

test('copper-pot potato rice keeps parboiled rice and copper vessel identity separate from household equivalence', () => {
  const candidate = assessment.candidate_audits.find(row => row.candidate_id === 'yunnan-copper-pot-potato-rice-home');
  assert.equal(candidate.claims.jiangchuan_copper_pot_potato_rice_identity.verdict, 'supported');
  assert.equal(candidate.claims.parboiled_rice_process.verdict, 'supported');
  assert.equal(candidate.claims.household_vessel_equivalence.verdict, 'not_proven');
  assert.ok(candidate.ingredient_shapes.includes('parboiled_drained_rice'));
  assert.ok(candidate.forbidden_claims.includes('copper_pot_equals_electric_cooker'));
});

test('Dai pineapple evidence supports glutinous rice and purple variant but not mango substitution', () => {
  const audit = assessment.production_recipe_audits.find(row => row.recipe_id === 'dai-pineapple-purple-rice');
  assert.equal(audit.claims.dai_pineapple_rice_identity.verdict, 'supported');
  assert.equal(audit.claims.purple_glutinous_rice_variant.verdict, 'supported');
  assert.equal(audit.claims.mango_substitution_equivalence.verdict, 'not_proven');
  assert.ok(audit.forbidden_claims.includes('pineapple_vessel_as_generic_fruit_slot'));
});

test('Guizhou Dong shefan evidence does not prove raw-rice braise as its traditional process', () => {
  const audit = assessment.production_recipe_audits.find(row => row.recipe_id === 'guizhou-dong-community-rice');
  assert.equal(audit.claims.dong_shefan_identity.verdict, 'supported');
  assert.equal(audit.claims.parboiled_glutinous_structure.verdict, 'supported');
  assert.equal(audit.claims.raw_rice_braise_as_traditional_process.verdict, 'not_proven');
  assert.ok(audit.forbidden_claims.includes('family_adaptation_as_traditional_replica'));
});

test('generic mushroom, corn chicken and ham-slot candidates remain hypotheses rather than regional facts', () => {
  const candidates = new Map(assessment.candidate_audits.map(row => [row.candidate_id, row]));
  assert.equal(candidates.get('yunnan-mushroom-potato-rice').claims.fixed_mushroom_potato_core.verdict, 'not_proven');
  assert.equal(candidates.get('yunnan-mushroom-potato-rice').claims.free_wild_mushroom_substitution.verdict, 'contradicted');
  assert.equal(candidates.get('yunnan-corn-chicken-rice').claims.yunnan_fixed_corn_chicken_rice_identity.verdict, 'not_proven');
  assert.equal(candidates.get('yunnan-ham-flavor-rice-pot').claims.generic_ham_flavor_slot_identity.verdict, 'not_proven');
});

test('research leads do not add production recipes or regional candidates', () => {
  for (const lead of assessment.concrete_research_leads) {
    assert.equal(lead.creates_production_recipe, false);
    assert.equal(lead.creates_research_candidate, false);
  }
});

test('potato, mushroom, cured-meat and poultry controls stay principle-only and journeys stay pending', () => {
  assert.deepEqual(assessment.safety_boundaries.map(row => row.safety_id).sort(), [
    'cured-meat-cook-through-and-salt',
    'identified-mushroom-only-and-cook-through',
    'potato-sprout-green-control',
    'poultry-cook-through',
  ]);
  assert.ok(assessment.safety_boundaries.every(row => row.evidence_status === 'principle_only'));
  assert.equal(assessment.journey_cases.length, 12);
  assert.ok(assessment.journey_cases.every(row => row.human_review.status === 'pending'));
});

test('validator rejects vessel collapse, fruit substitution, wild-mushroom freedom and traditional-process rewriting', () => {
  const broken = structuredClone(assessment);
  broken.candidate_audits.find(row => row.candidate_id === 'yunnan-copper-pot-potato-rice-home').claims.household_vessel_equivalence.verdict = 'supported';
  broken.production_recipe_audits.find(row => row.recipe_id === 'dai-pineapple-purple-rice').claims.mango_substitution_equivalence.verdict = 'supported';
  broken.production_recipe_audits.find(row => row.recipe_id === 'guizhou-dong-community-rice').claims.raw_rice_braise_as_traditional_process.verdict = 'supported';
  broken.candidate_audits.find(row => row.candidate_id === 'yunnan-mushroom-potato-rice').claims.free_wild_mushroom_substitution.verdict = 'supported';
  const message = validateYunnanGuizhouRiceResearch({ ...inputs, assessment: broken }).join('\n');
  assert.match(message, /household vessel equivalence must remain not_proven/);
  assert.match(message, /mango substitution equivalence must remain not_proven/);
  assert.match(message, /raw-rice braise as traditional process must remain not_proven/);
  assert.match(message, /free wild-mushroom substitution must remain contradicted/);
});

test('validator binds supported not-proven and contradicted verdicts to separate source directions', () => {
  const broken = structuredClone(assessment);
  broken.candidate_audits.find(row => row.candidate_id === 'yunnan-mushroom-potato-rice').claims.fixed_mushroom_potato_core.verdict = 'supported';
  const message = validateYunnanGuizhouRiceResearch({ ...inputs, assessment: broken }).join('\n');
  assert.match(message, /fixed_mushroom_potato_core.*supported.*proves/);
});

test('validator is total for malformed roots and nested rows', () => {
  assert.deepEqual(validateYunnanGuizhouRiceResearch({ assessment: null }), ['assessment must be an object']);
  assert.doesNotThrow(() => validateYunnanGuizhouRiceResearch({
    assessment: {
      source_refs: [null], production_recipe_audits: [null], candidate_audits: [null],
      concrete_research_leads: [null], family_model: [null], adaptation_boundaries: [null],
      safety_boundaries: [null], journey_cases: [null],
    },
    recipeLibrary: { recipes: [null] }, regionalResearch: { entries: [null] }, regionalAtlas: null,
    regionalMappings: { production_recipe_mappings: [null], research_candidate_mappings: [null] },
  }));
});
