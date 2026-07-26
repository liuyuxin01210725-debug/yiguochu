import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildMiddleYangtzeMainMealResearchReport,
  formatMiddleYangtzeMainMealResearchSummary,
  validateMiddleYangtzeMainMealResearchReport,
} from '../lib/middle-yangtze-main-meal-research-builder.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const inputs = {
  assessment: readJson('../data/middle-yangtze-main-meal-research.v1.json'),
  recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'),
  regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

test('report contains the complete three-province research package without production mutations', () => {
  const report = buildMiddleYangtzeMainMealResearchReport(inputs);
  assert.deepEqual(validateMiddleYangtzeMainMealResearchReport(report), []);
  assert.equal(report.region_overview.region_id, 'middle_yangtze');
  assert.deepEqual(report.region_overview.province_codes, ['CN-HB', 'CN-HN', 'CN-JX']);
  assert.equal(report.province_gap_audits.length, 3);
  assert.equal(report.concrete_research_leads.length, 8);
  assert.equal(report.source_evidence.length, 11);
  assert.equal(report.household_journeys.length, 15);
  assert.equal(report.summary.production_recipe_changes, 0);
  assert.equal(report.summary.regional_candidate_changes, 0);
});

test('report separates eight food forms instead of flattening them to one-pot rice', () => {
  const report = buildMiddleYangtzeMainMealResearchReport(inputs);
  const ids = new Set(report.family_model.map(row => row.family_id));
  for (const id of [
    'filled-glutinous-rice-crepe', 'ready-rice-bean-sheet-bowl', 'grain-powder-mixed-steam',
    'long-broth-eel-rice-noodle', 'cured-meat-herb-glutinous-rice',
    'alkaline-ash-water-wrapped-rice', 'ready-rice-noodle-stir-fry',
    'ready-rice-noodle-broth-or-stir',
  ]) assert.ok(ids.has(id), id);
});

test('province coverage is transparent despite zero recipe and candidate mappings', () => {
  const report = buildMiddleYangtzeMainMealResearchReport(inputs);
  const byProvince = new Map(report.province_gap_audits.map(row => [row.province_code, row]));
  assert.equal(byProvince.get('CN-HB').lead_count, 4);
  assert.equal(byProvince.get('CN-HN').lead_count, 2);
  assert.equal(byProvince.get('CN-JX').lead_count, 2);
  assert.ok(report.province_gap_audits.every(row => row.production_recipe_ids.length === 0));
  assert.ok(report.province_gap_audits.every(row => row.candidate_ids.length === 0));
});

test('ingredient shape matrix makes ready and raw staple states inspectable', () => {
  const report = buildMiddleYangtzeMainMealResearchReport(inputs);
  const shapes = new Set(report.ingredient_shape_matrix.map(row => row.shape));
  for (const shape of [
    'ready_rice_bean_sheet', 'presteamed_glutinous_rice', 'grain_powder_coating',
    'ash_alkaline_water', 'ready_or_precooked_rice_noodle',
  ]) assert.ok(shapes.has(shape), shape);
});

test('initial round remains research_in_progress with exact blockers', () => {
  const report = buildMiddleYangtzeMainMealResearchReport(inputs);
  assert.equal(report.completion.status, 'research_in_progress');
  assert.deepEqual(report.completion.blockers, [
    'zero_production_mapping',
    'zero_candidate_mapping',
    'source_ratio_conflict_unresolved',
    'staple_sufficiency_unresolved',
    'safety_endpoint_incomplete',
    'human_journey_review_incomplete',
  ]);
  assert.equal(report.summary.human_journey_reviewed_count, 0);
});

test('summary is derived from report rows', () => {
  const report = buildMiddleYangtzeMainMealResearchReport(inputs);
  assert.deepEqual(report.summary.source_count_by_grade, { A: 8, B: 3, C: 0 });
  assert.equal(report.summary.province_gap_count, 3);
  assert.equal(report.summary.concrete_research_lead_count, 8);
  assert.equal(report.summary.household_journey_count, 15);
  assert.equal(
    formatMiddleYangtzeMainMealResearchSummary(report),
    '3 Middle Yangtze province gaps · 8 research leads · 15 journeys · Middle Yangtze research ok',
  );
});

test('report validator rejects dishonest completion and mismatched counts', () => {
  const broken = structuredClone(buildMiddleYangtzeMainMealResearchReport(inputs));
  broken.completion.status = 'regional_round_complete';
  broken.completion.blockers = [];
  broken.summary.source_count = 99;
  broken.region_overview.production_recipe_count = 1;
  const message = validateMiddleYangtzeMainMealResearchReport(broken).join('\n');
  assert.match(message, /completion cannot be complete/);
  assert.match(message, /summary source_count expected 11, got 99/);
  assert.match(message, /region production_recipe_count expected 0, got 1/);
});

test('builder rejects invalid source input while report validator remains total', () => {
  const broken = structuredClone(inputs);
  broken.assessment.concrete_research_leads.find(row => row.lead_id === 'hunan-xiangxi-shefan').claims.executable_ratio.verdict = 'supported';
  assert.throws(() => buildMiddleYangtzeMainMealResearchReport(broken), /shefan executable ratio/);
  assert.deepEqual(validateMiddleYangtzeMainMealResearchReport(null), ['report must be an object']);
});
