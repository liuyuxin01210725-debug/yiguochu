import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateFujianTaiwanRiceNoodleResearch } from '../lib/fujian-taiwan-rice-noodle-research-validator.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const assessment = readJson('../data/fujian-taiwan-rice-noodle-research.v1.json');
const inputs = {
  assessment,
  recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'),
  regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

const PRODUCTION_IDS = [
  'daxi-lotus-leaf-oil-rice',
  'fujian-gai-cai-minced-pork-rice',
  'fujian-hyacinth-bean-rice',
  'quanzhou-oil-rice',
  'she-people-black-rice',
  'taiwan-cabbage-mushroom-rice',
];
const LEAD_IDS = [
  'fujian-putian-lor-noodle',
  'quanzhou-seafood-pork-savory-rice',
  'taiwan-hakka-vegetable-rice',
];

test('assessment audits the exact six mapped recipes without changing production or candidates', () => {
  assert.deepEqual(assessment.production_recipe_audits.map(row => row.recipe_id).sort(), PRODUCTION_IDS);
  assert.deepEqual(assessment.province_gap_audits.map(row => row.province_code).sort(), ['CN-FJ', 'CN-TW']);
  assert.ok(assessment.province_gap_audits.every(row => row.candidate_ids.length === 0));
  assert.deepEqual(validateFujianTaiwanRiceNoodleResearch(inputs), []);
});

test('official family evidence never silently proves the project recipe or Ratio DSL', () => {
  const audits = new Map(assessment.production_recipe_audits.map(row => [row.recipe_id, row]));
  assert.equal(audits.get('taiwan-cabbage-mushroom-rice').claims.regional_family.verdict, 'supported');
  assert.equal(audits.get('taiwan-cabbage-mushroom-rice').claims.project_ratio_equivalence.verdict, 'not_proven');
  assert.ok(audits.get('taiwan-cabbage-mushroom-rice').forbidden_claims.includes('official_0_8_ratio_equals_project_retained_liquid_ratio'));
  assert.equal(audits.get('quanzhou-oil-rice').claims.regional_family.verdict, 'supported');
  assert.equal(audits.get('quanzhou-oil-rice').claims.exact_project_equivalence.verdict, 'not_proven');
  assert.equal(audits.get('daxi-lotus-leaf-oil-rice').claims.lotus_leaf_history.verdict, 'supported');
  assert.equal(audits.get('daxi-lotus-leaf-oil-rice').claims.exact_project_formula.verdict, 'not_proven');
});

test('menu-plan evidence and ingredient identity remain weaker than regional tradition claims', () => {
  const audits = new Map(assessment.production_recipe_audits.map(row => [row.recipe_id, row]));
  assert.equal(audits.get('fujian-gai-cai-minced-pork-rice').claims.official_menu_presence.verdict, 'supported');
  assert.equal(audits.get('fujian-gai-cai-minced-pork-rice').claims.regional_traditional_identity.verdict, 'not_proven');
  assert.equal(audits.get('fujian-hyacinth-bean-rice').claims.bean_species_identity.verdict, 'not_proven');
  assert.ok(audits.get('fujian-hyacinth-bean-rice').forbidden_claims.includes('generic_biandou_is_hyacinth_bean'));
  assert.equal(audits.get('she-people-black-rice').claims.project_color_powder_equivalence.verdict, 'not_proven');
});

test('three new leads stay research-only and preserve finished-staple boundaries', () => {
  assert.deepEqual(assessment.concrete_research_leads.map(row => row.lead_id).sort(), LEAD_IDS);
  assert.ok(assessment.concrete_research_leads.every(row => row.production_recipe_id === null && row.candidate_id === null));
  const leads = new Map(assessment.concrete_research_leads.map(row => [row.lead_id, row]));
  assert.ok(leads.get('fujian-putian-lor-noodle').ingredient_shapes.includes('ready_wheat_noodle'));
  assert.ok(leads.get('fujian-putian-lor-noodle').forbidden_shortcuts.includes('dry_noodle_without_hydration_rule'));
  assert.ok(leads.get('taiwan-hakka-vegetable-rice').forbidden_shortcuts.includes('contest_recipe_as_canonical_hakka_tradition'));
});

test('safety boundaries lock bean identity, animal cook-through, allergens and leftover handling', () => {
  const rows = new Map(assessment.safety_boundaries.map(row => [row.safety_id, row]));
  assert.deepEqual([...rows.keys()].sort(), [
    'animal-and-seafood-cook-through',
    'bean-identity-and-cook-through',
    'leftover-rice-storage-and-reheat',
    'seafood-allergen-disclosure',
  ]);
  assert.ok(rows.get('bean-identity-and-cook-through').required_controls.includes('记录商品名或豆种'));
  assert.ok(rows.get('seafood-allergen-disclosure').required_controls.includes('虾米、蚵干、干贝分别显式列出'));
  assert.equal('minutes' in rows.get('animal-and-seafood-cook-through'), false);
});

test('validator rejects provenance inflation, ratio collapse and bean identity guessing', () => {
  const broken = structuredClone(assessment);
  broken.production_recipe_audits.find(row => row.recipe_id === 'taiwan-cabbage-mushroom-rice').claims.project_ratio_equivalence.verdict = 'supported';
  broken.production_recipe_audits.find(row => row.recipe_id === 'quanzhou-oil-rice').claims.exact_project_equivalence.verdict = 'supported';
  broken.production_recipe_audits.find(row => row.recipe_id === 'fujian-hyacinth-bean-rice').claims.bean_species_identity.verdict = 'supported';
  broken.production_recipe_audits.find(row => row.recipe_id === 'daxi-lotus-leaf-oil-rice').claims.exact_project_formula.verdict = 'supported';
  broken.concrete_research_leads[0].production_recipe_id = 'invented';
  const message = validateFujianTaiwanRiceNoodleResearch({ ...inputs, assessment: broken }).join('\n');
  assert.match(message, /cabbage rice ratio equivalence must remain not_proven/);
  assert.match(message, /Quanzhou project equivalence must remain not_proven/);
  assert.match(message, /bean species identity must remain not_proven/);
  assert.match(message, /Daxi exact project formula must remain not_proven/);
  assert.match(message, /research leads cannot reference a production recipe/);
});

test('twelve household journeys remain pending and cover both province nodes', () => {
  assert.equal(assessment.journey_cases.length, 12);
  assert.equal(new Set(assessment.journey_cases.map(row => row.journey_id)).size, 12);
  assert.deepEqual([...new Set(assessment.journey_cases.map(row => row.province_code))].sort(), ['CN-FJ', 'CN-TW']);
  assert.ok(assessment.journey_cases.every(row => row.human_review.status === 'pending'));
  assert.equal(assessment.journey_cases.find(row => row.journey_id === 'ft-j04').expected_outcome, 'needs_ingredient_identity');
  assert.equal(assessment.journey_cases.find(row => row.journey_id === 'ft-j09').expected_outcome, 'ratio_research_only');
});

test('validator is total for malformed roots and nested rows', () => {
  assert.deepEqual(validateFujianTaiwanRiceNoodleResearch({ assessment: null }), ['assessment must be an object']);
  assert.doesNotThrow(() => validateFujianTaiwanRiceNoodleResearch({
    assessment: {
      source_refs: [null], province_gap_audits: [null], production_recipe_audits: [null],
      concrete_research_leads: [null], family_model: [null], adaptation_boundaries: [null],
      safety_boundaries: [null], journey_cases: [null],
    },
    recipeLibrary: { recipes: [null] }, regionalResearch: { entries: [null] }, regionalAtlas: null,
    regionalMappings: { production_recipe_mappings: [null], research_candidate_mappings: [null] },
  }));
});
