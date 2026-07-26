import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateLingnanHkMacaoOnePotResearch } from '../lib/lingnan-hk-macao-one-pot-research-validator.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const assessment = readJson('../data/lingnan-hk-macao-one-pot-research.v1.json');
const inputs = {
  assessment,
  recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'),
  regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

const PRODUCTION_IDS = [
  'cantonese-black-bean-pork-rib-claypot-rice',
  'cantonese-cured-meat-claypot-rice',
  'cantonese-mushroom-chicken-claypot-rice',
  'guangxi-five-color-glutinous-rice',
  'hainan-cai-bao-rice',
];
const LEAD_IDS = [
  'cantonese-claypot-rice-technique',
  'guangxi-natural-dye-five-color-glutinous-rice',
  'hainan-coconut-shredded-rice',
  'hainan-dingan-cai-bao-finished-rice',
  'macao-portuguese-style-seafood-rice',
];

test('assessment locks the five Lingnan, Hong Kong and Macao nodes plus the unchanged five-production zero-candidate baseline', () => {
  assert.equal(assessment.region_id, 'lingnan_hk_macao');
  assert.deepEqual(assessment.province_codes, ['CN-GD', 'CN-GX', 'CN-HI', 'CN-HK', 'CN-MO']);
  assert.deepEqual(assessment.production_recipe_audits.map(row => row.recipe_id).sort(), PRODUCTION_IDS);
  assert.deepEqual(assessment.candidate_audits, []);
  assert.deepEqual(assessment.concrete_research_leads.map(row => row.lead_id).sort(), LEAD_IDS);
  assert.deepEqual(validateLingnanHkMacaoOnePotResearch(inputs), []);
});

test('Cantonese claypot rice keeps vessel, late named toppings and Hong Kong consumption separate from generic household equivalence', () => {
  const lead = assessment.concrete_research_leads.find(row => row.lead_id === 'cantonese-claypot-rice-technique');
  assert.equal(lead.claims.cantonese_claypot_rice_identity.verdict, 'supported');
  assert.equal(lead.claims.late_named_topping_structure.verdict, 'supported');
  assert.equal(lead.claims.hong_kong_current_presence.verdict, 'supported');
  assert.equal(lead.claims.household_vessel_equivalence.verdict, 'not_proven');
  assert.ok(lead.forbidden_shortcuts.includes('claypot_equals_ordinary_covered_pot'));
  assert.ok(lead.forbidden_shortcuts.includes('named_toppings_as_free_protein_slot'));
});

test('Guangxi traditional natural dye process remains distinct from the project food-powder adaptation and unproven pineapple claim', () => {
  const audit = assessment.production_recipe_audits.find(row => row.recipe_id === 'guangxi-five-color-glutinous-rice');
  assert.equal(audit.claims.guangxi_natural_dye_structure.verdict, 'supported');
  assert.equal(audit.claims.food_powder_as_traditional_equivalence.verdict, 'not_proven');
  assert.equal(audit.claims.guangxi_pineapple_rice_regional_identity.verdict, 'not_proven');
  assert.ok(audit.forbidden_claims.includes('food_powders_as_traditional_natural_dyes'));
  assert.ok(audit.forbidden_claims.includes('guangxi_traditional_pineapple_rice_claim'));
});

test('Hainan finished-rice, coconut and chicken-rice boundaries remain separate', () => {
  const audit = assessment.production_recipe_audits.find(row => row.recipe_id === 'hainan-cai-bao-rice');
  const caiBaoLead = assessment.concrete_research_leads.find(row => row.lead_id === 'hainan-dingan-cai-bao-finished-rice');
  const coconutLead = assessment.concrete_research_leads.find(row => row.lead_id === 'hainan-coconut-shredded-rice');
  assert.equal(audit.claims.dingan_cai_bao_identity.verdict, 'supported');
  assert.equal(audit.claims.single_vessel_one_pot_equivalence.verdict, 'not_proven');
  assert.equal(caiBaoLead.claims.finished_rice_and_cooked_filling_structure.verdict, 'supported');
  assert.equal(coconutLead.claims.coconut_rice_structure.verdict, 'supported');
  assert.equal(coconutLead.claims.complete_main_meal_sufficiency.verdict, 'not_proven');
});

test('Macao Portuguese seafood rice remains a lead only and cannot prove a one-pot process or rewrite Portuguese chicken', () => {
  const lead = assessment.concrete_research_leads.find(row => row.lead_id === 'macao-portuguese-style-seafood-rice');
  assert.equal(lead.claims.macao_portuguese_style_seafood_rice_presence.verdict, 'supported');
  assert.equal(lead.claims.single_pot_process.verdict, 'not_proven');
  assert.equal(lead.claims.portuguese_chicken_as_rice_pot.verdict, 'not_proven');
  assert.ok(lead.forbidden_shortcuts.includes('portuguese_chicken_as_seafood_rice_equivalent'));
});

test('five families, evidence directions and fifteen pending household journeys remain reviewable', () => {
  assert.equal(assessment.family_model.length, 5);
  assert.equal(assessment.journey_cases.length, 15);
  assert.ok(assessment.journey_cases.every(row => row.human_review.status === 'pending'));
  assert.ok(assessment.source_refs.every(row => Array.isArray(row.proves) && Array.isArray(row.does_not_prove)));
  assert.ok(assessment.source_refs.some(row => row.published_at === 'undated'));
});

test('official-source manifest pins the verified Guangdong standard and Macao tourism source', () => {
  const byId = new Map(assessment.source_refs.map(row => [row.source_id, row]));
  assert.deepEqual(byId.get('gd-cantonese-standard-undated'), {
    ...byId.get('gd-cantonese-standard-undated'),
    url: 'https://std.samr.gov.cn/db/search/stdDBDetailed?id=FCE664C973E2154EE05397BE0A0A886A',
    title: '粤菜餐厅西关风情特色服务规范（DB44/T 2423-2023）',
    publisher: '国家标准信息公共服务平台',
  });
  assert.deepEqual(byId.get('mo-tourism-portuguese-seafood-rice-undated'), {
    ...byId.get('mo-tourism-portuguese-seafood-rice-undated'),
    url: 'https://www.macaotourism.gov.mo/en/dining/taste-of-macao/macanese-and-portuguese-dishes',
    title: 'Macanese & Portuguese Dishes',
    publisher: '澳门特别行政区政府旅游局',
  });
});

test('validator locks family membership, adaptation boundaries, journey references and core claims fail-closed', () => {
  const familyIds = [
    'coconut-shredded-rice-staple',
    'finished-rice-cooked-filling-lettuce-wrap',
    'macao-portuguese-style-seafood-rice-unresolved',
    'natural-dye-steamed-glutinous-rice',
    'raw-rice-claypot-late-named-topping',
  ];
  assert.deepEqual(assessment.family_model.map(row => row.family_id).sort(), familyIds);
  const boundaryIds = [
    'claypot-not-generic-covered-pot', 'dingan-cai-bao-not-raw-rice-one-pot',
    'guangxi-pineapple-rice-unproven', 'macao-menu-not-process',
    'named-claypot-branches-not-free-slots', 'natural-dyes-not-food-powder-equivalence',
  ];
  assert.deepEqual(assessment.adaptation_boundaries.map(row => row.boundary_id).sort(), boundaryIds);

  const familyBroken = structuredClone(assessment);
  familyBroken.family_model[0].family_id = 'bogus-family';
  assert.match(validateLingnanHkMacaoOnePotResearch({ ...inputs, assessment: familyBroken }).join('\n'), /family IDs must match the fixed regional contract/);

  const leadBroken = structuredClone(assessment);
  leadBroken.concrete_research_leads[0].family_id = 'unknown-family';
  assert.match(validateLingnanHkMacaoOnePotResearch({ ...inputs, assessment: leadBroken }).join('\n'), /family_id must reference a fixed family/);

  const boundaryBroken = structuredClone(assessment);
  boundaryBroken.adaptation_boundaries = [null];
  assert.match(validateLingnanHkMacaoOnePotResearch({ ...inputs, assessment: boundaryBroken }).join('\n'), /adaptation boundary IDs must match the fixed regional contract/);

  const journeyBroken = structuredClone(assessment);
  journeyBroken.journey_cases[0].expected_family_ids = ['unknown-family'];
  assert.match(validateLingnanHkMacaoOnePotResearch({ ...inputs, assessment: journeyBroken }).join('\n'), /expected_family_ids contains unknown family unknown-family/);

  const claimBroken = structuredClone(assessment);
  delete claimBroken.concrete_research_leads.find(row => row.lead_id === 'cantonese-claypot-rice-technique').claims.late_named_topping_structure;
  assert.match(validateLingnanHkMacaoOnePotResearch({ ...inputs, assessment: claimBroken }).join('\n'), /late named topping structure claim must remain supported/);
});

test('validator locks every adaptation-boundary meaning and the remaining Cantonese non-equivalence claims', () => {
  const boundary = assessment.adaptation_boundaries.find(row => row.boundary_id === 'claypot-not-generic-covered-pot');
  assert.deepEqual({
    evidence_status: boundary.evidence_status,
    verdict: boundary.verdict,
    forbidden_equivalence: boundary.forbidden_equivalence,
  }, {
    evidence_status: 'not_proven',
    verdict: 'not_proven',
    forbidden_equivalence: 'claypot_equals_ordinary_covered_pot',
  });

  const boundaryBroken = structuredClone(assessment);
  const claypot = boundaryBroken.adaptation_boundaries.find(row => row.boundary_id === 'claypot-not-generic-covered-pot');
  claypot.evidence_status = 'supported';
  claypot.verdict = 'supported';
  claypot.forbidden_equivalence = 'ordinary_pot_equals_claypot';
  assert.match(validateLingnanHkMacaoOnePotResearch({ ...inputs, assessment: boundaryBroken }).join('\n'), /claypot-not-generic-covered-pot boundary meaning must remain fixed/);

  const hongKongBroken = structuredClone(assessment);
  delete hongKongBroken.concrete_research_leads.find(row => row.lead_id === 'cantonese-claypot-rice-technique').claims.hong_kong_exclusive_origin;
  hongKongBroken.source_refs.find(row => row.source_id === 'hk-tourism-claypot-food-map-undated').does_not_prove = [];
  assert.match(validateLingnanHkMacaoOnePotResearch({ ...inputs, assessment: hongKongBroken }).join('\n'), /Hong Kong exclusive origin claim must remain not_proven/);

  const toppingBroken = structuredClone(assessment);
  delete toppingBroken.concrete_research_leads.find(row => row.lead_id === 'cantonese-claypot-rice-technique').claims.named_toppings_as_free_protein_slot;
  toppingBroken.source_refs.find(row => row.source_id === 'gd-xiguan-draft-claypot-rice-undated').does_not_prove = toppingBroken.source_refs
    .find(row => row.source_id === 'gd-xiguan-draft-claypot-rice-undated').does_not_prove
    .filter(token => token !== 'lead:cantonese-claypot-rice-technique:named_toppings_as_free_protein_slot');
  assert.match(validateLingnanHkMacaoOnePotResearch({ ...inputs, assessment: toppingBroken }).join('\n'), /named toppings free protein slot claim must remain not_proven/);
});

test('validator rejects vessel collapse, false regional pineapple attribution and recipe-list promotion', () => {
  const broken = structuredClone(assessment);
  broken.concrete_research_leads.find(row => row.lead_id === 'cantonese-claypot-rice-technique').claims.household_vessel_equivalence.verdict = 'supported';
  broken.production_recipe_audits.find(row => row.recipe_id === 'guangxi-five-color-glutinous-rice').claims.guangxi_pineapple_rice_regional_identity.verdict = 'supported';
  broken.concrete_research_leads.find(row => row.lead_id === 'macao-portuguese-style-seafood-rice').production_recipe_id = 'invented-recipe';
  const message = validateLingnanHkMacaoOnePotResearch({ ...inputs, assessment: broken }).join('\n');
  assert.match(message, /household vessel equivalence must remain not_proven/);
  assert.match(message, /Guangxi pineapple rice regional identity must remain not_proven/);
  assert.match(message, /research leads cannot reference a production recipe/);
});

test('validator is total for malformed roots and nested rows', () => {
  assert.deepEqual(validateLingnanHkMacaoOnePotResearch({ assessment: null }), ['assessment must be an object']);
  assert.doesNotThrow(() => validateLingnanHkMacaoOnePotResearch({
    assessment: { source_refs: [null], production_recipe_audits: [null], candidate_audits: [null], concrete_research_leads: [null], family_model: [null], adaptation_boundaries: [null], safety_boundaries: [null], journey_cases: [null] },
    recipeLibrary: { recipes: [null] }, regionalResearch: { entries: [null] }, regionalAtlas: null,
    regionalMappings: { production_recipe_mappings: [null], research_candidate_mappings: [null] },
  }));
});
