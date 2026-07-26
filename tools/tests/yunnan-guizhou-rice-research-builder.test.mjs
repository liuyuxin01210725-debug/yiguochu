import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildYunnanGuizhouRiceResearchReport,
  formatYunnanGuizhouRiceResearchSummary,
  validateYunnanGuizhouRiceResearchReport,
} from '../lib/yunnan-guizhou-rice-research-builder.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const inputs = {
  assessment: readJson('../data/yunnan-guizhou-rice-research.v1.json'),
  recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'),
  regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

test('report derives two production audits, four candidates, three leads and no recipe mutations', () => {
  const report = buildYunnanGuizhouRiceResearchReport(inputs);
  assert.deepEqual(validateYunnanGuizhouRiceResearchReport(report), []);
  assert.equal(report.region_overview.region_id, 'yunnan_guizhou');
  assert.deepEqual(report.region_overview.province_codes, ['CN-YN', 'CN-GZ']);
  assert.equal(report.production_recipe_audits.length, 2);
  assert.equal(report.candidate_audits.length, 4);
  assert.equal(report.concrete_research_leads.length, 3);
  assert.equal(report.source_evidence.length, 9);
  assert.equal(report.household_journeys.length, 12);
  assert.equal(report.summary.production_recipe_changes, 0);
  assert.equal(report.summary.regional_candidate_changes, 0);
});

test('claim matrix separates regional identity from project execution and substitutions', () => {
  const report = buildYunnanGuizhouRiceResearchReport(inputs);
  const claims = new Map(report.claim_matrix.map(row => [`${row.subject_id}:${row.claim_id}`, row.verdict]));
  assert.equal(claims.get('yunnan-copper-pot-potato-rice-home:jiangchuan_copper_pot_potato_rice_identity'), 'supported');
  assert.equal(claims.get('yunnan-copper-pot-potato-rice-home:household_vessel_equivalence'), 'not_proven');
  assert.equal(claims.get('dai-pineapple-purple-rice:mango_substitution_equivalence'), 'not_proven');
  assert.equal(claims.get('guizhou-dong-community-rice:raw_rice_braise_as_traditional_process'), 'not_proven');
});

test('shape matrix makes rice states, vessel and risky ingredient forms inspectable', () => {
  const report = buildYunnanGuizhouRiceResearchReport(inputs);
  const shapes = new Set(report.ingredient_shape_matrix.map(row => row.shape));
  for (const shape of [
    'parboiled_drained_rice', 'glutinous_rice', 'purple_glutinous_rice',
    'hollowed_pineapple_vessel', 'fried_potato_chunks', 'identified_mushroom',
    'cured_meat_dice', 'raw_chicken_pieces',
  ]) assert.ok(shapes.has(shape), shape);
});

test('completion stays research in progress until production, ratios, vessel, safety and humans are resolved', () => {
  const report = buildYunnanGuizhouRiceResearchReport(inputs);
  assert.equal(report.completion.status, 'research_in_progress');
  assert.deepEqual(report.completion.blockers, [
    'production_evidence_gaps',
    'candidate_specificity_gaps',
    'rice_state_ratio_unresolved',
    'household_vessel_adaptation_unresolved',
    'safety_endpoint_incomplete',
    'human_journey_review_incomplete',
  ]);
  assert.equal(report.summary.human_journey_reviewed_count, 0);
});

test('summary is derived from report rows', () => {
  const report = buildYunnanGuizhouRiceResearchReport(inputs);
  assert.deepEqual(report.summary.source_count_by_grade, { A: 7, B: 2, C: 0 });
  assert.equal(
    formatYunnanGuizhouRiceResearchSummary(report),
    '2 Yunnan-Guizhou production audits · 4 candidates · 3 research leads · 12 journeys · Yunnan-Guizhou research ok',
  );
});

test('report validator rejects dishonest completion and mismatched counts', () => {
  const broken = structuredClone(buildYunnanGuizhouRiceResearchReport(inputs));
  broken.completion.status = 'regional_round_complete';
  broken.completion.blockers = [];
  broken.summary.source_count = 99;
  broken.region_overview.production_recipe_count = 1;
  const message = validateYunnanGuizhouRiceResearchReport(broken).join('\n');
  assert.match(message, /completion cannot be complete/);
  assert.match(message, /summary source_count expected 9, got 99/);
  assert.match(message, /region production_recipe_count expected 2, got 1/);
});
