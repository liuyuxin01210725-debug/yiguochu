import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateQinghaiTibetOnePotResearch } from '../lib/qinghai-tibet-one-pot-research-validator.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const assessment = readJson('../data/qinghai-tibet-one-pot-research.v1.json');
const inputs = {
  assessment,
  recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'),
  regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

const PRODUCTION_IDS = ['qinghai-hao-fan', 'tibetan-savory-congee', 'tibetan-gutu', 'tibetan-ginseng-fruit-rice'];
const LEAD_IDS = [
  'qinghai-ga-mianpian-broth',
  'qinghai-barley-wheatberry-meat-soup',
  'tibetan-patu-one-pot',
  'tibetan-tuba-barley-thick-bowl',
  'lhasa-tibetan-noodle-breakfast',
];
const FAMILY_IDS = [
  'qinghai-grain-porridge-main-bowl',
  'qinghai-noodle-piece-broth-main-bowl',
  'qinghai-barley-wheatberry-meat-soup',
  'tibetan-patu-one-pot-main-bowl',
  'tibetan-tuba-barley-thick-main-bowl',
  'lhasa-noodle-breakfast-main-bowl',
];
const BOUNDARY_IDS = [
  'qinghai-hao-fan-not-traditional-replica',
  'tibetan-savory-congee-not-traditional-replica',
  'tibetan-gutu-not-traditional-replica',
  'tibetan-ginseng-fruit-rice-not-traditional-replica',
  'ga-mianpian-not-production-recipe',
  'barley-wheatberry-meat-soup-not-free-grain-slot',
  'patu-not-free-noodle-equivalence',
  'tuba-manual-thickening-not-unattended-appliance',
  'lhasa-noodle-breakfast-not-single-pot-proven',
];
const CRITICAL_BOUNDARY_IDS = [
  'ginseng-fruit-rice-new-year-boundary',
  'gutu-non-food-symbols-forbidden',
  'hao-fan-evidence-correction',
  'patu-highest-research-priority',
  'tuba-and-tibetan-noodle-pending',
];

test('assessment locks Qinghai Tibet nodes, 4/0 baseline, five leads, six distinct families and twelve pending journeys', () => {
  assert.equal(assessment.region_id, 'qinghai_tibet');
  assert.deepEqual(assessment.province_codes, ['CN-QH', 'CN-XZ']);
  assert.deepEqual(assessment.production_recipe_audits.map(row => row.recipe_id).sort(), PRODUCTION_IDS.sort());
  assert.deepEqual(assessment.candidate_audits, []);
  assert.deepEqual(assessment.concrete_research_leads.map(row => row.lead_id).sort(), LEAD_IDS.sort());
  assert.deepEqual(assessment.family_model.map(row => row.family_id).sort(), FAMILY_IDS.sort());
  assert.deepEqual(assessment.adaptation_boundaries.map(row => row.boundary_id).sort(), BOUNDARY_IDS.sort());
  assert.equal(assessment.journey_cases.length, 12);
  assert.ok(assessment.journey_cases.every(row => row.human_review.status === 'pending'));
  assert.deepEqual(validateQinghaiTibetOnePotResearch(inputs), []);
});

test('all eleven closed sources are HTTPS, dated or explicitly undated, and participate in a claim or auxiliary edge', () => {
  assert.equal(assessment.source_refs.length, 11);
  assert.ok(assessment.source_refs.every(row => row.url.startsWith('https://')));
  assert.ok(assessment.source_refs.every(row => /^\d{4}-\d{2}-\d{2}$/.test(row.published_at) || (row.published_at === 'undated' && row.date_note)));
  assert.ok(assessment.source_refs.every(row => row.proves.length + row.does_not_prove.length + row.contradicts.length > 0));
  assert.ok(assessment.source_refs.some(row => row.source_id === 'qh-science-hao-fan-2022'));
  assert.ok(assessment.source_refs.some(row => row.source_id === 'xz-gov-new-year-customs-2025'));
  assert.ok(!assessment.source_refs.some(row => row.source_id === 'cn-cdc-bean-safety-2018'));
  assert.ok(!assessment.source_refs.some(row => row.source_id === 'xz-agri-barley-2023'));
});

test('critical product boundaries are machine-linked to their subjects, evidence claims and adaptation boundaries', () => {
  assert.deepEqual(assessment.critical_boundaries.map(row => row.finding_id).sort(), CRITICAL_BOUNDARY_IDS);
  const haoFan = assessment.critical_boundaries.find(row => row.finding_id === 'hao-fan-evidence-correction');
  assert.deepEqual(haoFan.source_ids, ['qh-science-hao-fan-2022']);
  assert.ok(haoFan.claim_tokens.includes('production:qinghai-hao-fan:hao_fan_broth_root_vegetable_structure'));
  const gutu = assessment.critical_boundaries.find(row => row.finding_id === 'gutu-non-food-symbols-forbidden');
  assert.deepEqual(gutu.prohibited_generated_items, ['硬币', '羊毛', '木炭', '纸条']);
  const ginseng = assessment.critical_boundaries.find(row => row.finding_id === 'ginseng-fruit-rice-new-year-boundary');
  assert.ok(ginseng.claim_tokens.includes('production:tibetan-ginseng-fruit-rice:new_year_ginseng_fruit_rice_combination'));
});

test('journeys target a same-province research family or an explicit production audit', () => {
  const xz04 = assessment.journey_cases.find(row => row.journey_id === 'xz-04');
  assert.equal(xz04.journey_kind, 'production_audit');
  assert.deepEqual(xz04.expected_family_ids, []);
  assert.deepEqual(xz04.audit_recipe_ids, ['tibetan-savory-congee']);
  assert.ok(assessment.journey_cases.filter(row => row.journey_kind === 'family_research').every(row => row.audit_recipe_ids.length === 0));

  const crossProvince = structuredClone(assessment);
  const journey = crossProvince.journey_cases.find(row => row.journey_id === 'xz-01');
  journey.expected_family_ids = ['qinghai-grain-porridge-main-bowl'];
  assert.match(
    validateQinghaiTibetOnePotResearch({ ...inputs, assessment: crossProvince }).join('\n'),
    /journey family ownership must match province_code/,
  );
});

test('validator fails closed for fixed claims, source directions, province ownership, mapping scope and reviewed states', () => {
  const baselineBroken = structuredClone(assessment);
  baselineBroken.production_recipe_audits.pop();
  assert.match(validateQinghaiTibetOnePotResearch({ ...inputs, assessment: baselineBroken }).join('\n'), /production audit IDs must match/);

  const directionBroken = structuredClone(assessment);
  directionBroken.concrete_research_leads.find(row => row.lead_id === 'tibetan-patu-one-pot').claims.single_pot_equivalence.verdict = 'supported';
  assert.match(validateQinghaiTibetOnePotResearch({ ...inputs, assessment: directionBroken }).join('\n'), /must be reverse-indexed/);

  const ownershipBroken = structuredClone(assessment);
  ownershipBroken.concrete_research_leads.find(row => row.lead_id === 'qinghai-ga-mianpian-broth').province_code = 'CN-XZ';
  assert.match(validateQinghaiTibetOnePotResearch({ ...inputs, assessment: ownershipBroken }).join('\n'), /lead province mapping must remain fixed/);

  const mappingBroken = structuredClone(inputs.regionalMappings);
  mappingBroken.production_recipe_mappings.find(row => row.source_id === 'qinghai-hao-fan').province_codes = ['CN-XZ'];
  assert.match(validateQinghaiTibetOnePotResearch({ ...inputs, regionalMappings: mappingBroken }).join('\n'), /production mapping province scope must remain fixed/);

  const stateBroken = structuredClone(assessment);
  stateBroken.production_recipe_audits.find(row => row.recipe_id === 'tibetan-gutu').audit_state = 'approved';
  assert.match(validateQinghaiTibetOnePotResearch({ ...inputs, assessment: stateBroken }).join('\n'), /audit_state must remain/);
});

test('validator rejects orphan evidence, source identity drift, and semantic drift in families, boundaries and journeys', () => {
  const orphan = structuredClone(assessment);
  orphan.source_refs[0].proves.push('lead:invented:claim');
  assert.match(validateQinghaiTibetOnePotResearch({ ...inputs, assessment: orphan }).join('\n'), /not a canonical claim token/);

  const sourceBroken = structuredClone(assessment);
  sourceBroken.source_refs[0].title = '改写过的来源标题';
  assert.match(validateQinghaiTibetOnePotResearch({ ...inputs, assessment: sourceBroken }).join('\n'), /source identity manifest mismatch/);

  const familyBroken = structuredClone(assessment);
  familyBroken.family_model[0].meal_structure = 'generic_free_slot';
  assert.match(validateQinghaiTibetOnePotResearch({ ...inputs, assessment: familyBroken }).join('\n'), /family_model semantic fingerprint mismatch/);

  const boundaryBroken = structuredClone(assessment);
  boundaryBroken.adaptation_boundaries[0].notes = '可以视为传统复刻。';
  assert.match(validateQinghaiTibetOnePotResearch({ ...inputs, assessment: boundaryBroken }).join('\n'), /adaptation_boundaries semantic fingerprint mismatch/);

  const journeyBroken = structuredClone(assessment);
  journeyBroken.journey_cases[1].journey_id = journeyBroken.journey_cases[0].journey_id;
  assert.match(validateQinghaiTibetOnePotResearch({ ...inputs, assessment: journeyBroken }).join('\n'), /journey_ids must be unique/);
  assert.match(validateQinghaiTibetOnePotResearch({ ...inputs, assessment: journeyBroken }).join('\n'), /journey_cases semantic fingerprint mismatch/);

  const findingBroken = structuredClone(assessment);
  const finding = findingBroken.critical_boundaries.find(row => row.finding_id === 'gutu-non-food-symbols-forbidden');
  finding.statement = '古突中的非食品象征物可以进入生成食材。';
  finding.source_ids = ['xz-gov-new-year-customs-2025'];
  finding.claim_tokens = ['production:tibetan-gutu:symbolic_filling_context'];
  assert.match(
    validateQinghaiTibetOnePotResearch({ ...inputs, assessment: findingBroken }).join('\n'),
    /critical_boundaries semantic fingerprint mismatch/,
  );
});

test('validator keeps every auxiliary evidence edge attached to its fixed source and required entity', () => {
  const broken = structuredClone(assessment);
  const source = broken.source_refs.find(row => row.source_id === 'cn-animal-food-safety-2025');
  source.proves = [];
  source.does_not_prove = [];
  source.contradicts = [];
  assert.match(validateQinghaiTibetOnePotResearch({ ...inputs, assessment: broken }).join('\n'), /must contribute at least one evidence direction/);
  assert.match(validateQinghaiTibetOnePotResearch({ ...inputs, assessment: broken }).join('\n'), /auxiliary token safety:animal-food-cook-through-and-separate:principle must remain/);
});

test('validator fingerprints the fixed safety controls as well as their auxiliary evidence edges', () => {
  const broken = structuredClone(assessment);
  broken.safety_boundaries[0].required_controls = ['cook_until_convenient'];
  assert.match(
    validateQinghaiTibetOnePotResearch({ ...inputs, assessment: broken }).join('\n'),
    /safety_boundaries semantic fingerprint mismatch/,
  );
});

test('validator fixes the global 72-recipe library and 24-entry regional research baselines', () => {
  const recipeLibraryBroken = structuredClone(inputs.recipeLibrary);
  recipeLibraryBroken.recipes.pop();
  assert.match(
    validateQinghaiTibetOnePotResearch({ ...inputs, recipeLibrary: recipeLibraryBroken }).join('\n'),
    /recipe library baseline must remain 72/,
  );

  const regionalResearchBroken = structuredClone(inputs.regionalResearch);
  regionalResearchBroken.entries.pop();
  assert.match(
    validateQinghaiTibetOnePotResearch({ ...inputs, regionalResearch: regionalResearchBroken }).join('\n'),
    /regional research baseline must remain 24/,
  );
});

test('validator fixes every research lead to the exact research-only destinations', () => {
  const broken = structuredClone(assessment);
  broken.concrete_research_leads.find(row => row.lead_id === 'tibetan-patu-one-pot').product_destinations = ['new_family_research'];
  assert.match(
    validateQinghaiTibetOnePotResearch({ ...inputs, assessment: broken }).join('\n'),
    /lead product_destinations must remain new_family_research and research_only/,
  );
});

test('validator rejects deleting a canonical claim together with its reverse source token', () => {
  const broken = structuredClone(assessment);
  delete broken.concrete_research_leads.find(row => row.lead_id === 'tibetan-patu-one-pot').claims.tibetan_patu_identity;
  const source = broken.source_refs.find(row => row.source_id === 'xz-gov-patu-2025');
  source.proves = source.proves.filter(token => token !== 'lead:tibetan-patu-one-pot:tibetan_patu_identity');
  assert.match(
    validateQinghaiTibetOnePotResearch({ ...inputs, assessment: broken }).join('\n'),
    /canonical claim manifest mismatch/,
  );
});

test('validator rejects symmetrically rewiring a fixed source-to-claim evidence edge', () => {
  const broken = structuredClone(assessment);
  const claim = broken.concrete_research_leads.find(row => row.lead_id === 'tibetan-patu-one-pot').claims.tibetan_patu_identity;
  claim.evidence_source_ids = ['xz-shannan-batu-2026'];
  const oldSource = broken.source_refs.find(row => row.source_id === 'xz-gov-patu-2025');
  oldSource.proves = oldSource.proves.filter(token => token !== 'lead:tibetan-patu-one-pot:tibetan_patu_identity');
  broken.source_refs.find(row => row.source_id === 'xz-shannan-batu-2026').proves.push('lead:tibetan-patu-one-pot:tibetan_patu_identity');
  assert.match(
    validateQinghaiTibetOnePotResearch({ ...inputs, assessment: broken }).join('\n'),
    /source-to-claim edge manifest mismatch/,
  );
});

test('validator rejects adding another region to a fixed production mapping', () => {
  const broken = structuredClone(inputs.regionalMappings);
  broken.production_recipe_mappings.find(row => row.source_id === 'qinghai-hao-fan').region_ids = ['qinghai_tibet', 'northwest'];
  assert.match(
    validateQinghaiTibetOnePotResearch({ ...inputs, regionalMappings: broken }).join('\n'),
    /production mapping region scope must remain exactly qinghai_tibet/,
  );
});
