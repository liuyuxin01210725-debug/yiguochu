import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildJingjinjiJinmengOnePotResearchReport,
  formatJingjinjiJinmengOnePotResearchSummary,
  validateJingjinjiJinmengOnePotResearchReport,
} from '../lib/jingjinji-jinmeng-one-pot-research-builder.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const inputs = {
  assessment: readJson('../data/jingjinji-jinmeng-one-pot-research.v1.json'), recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'), regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

test('report derives two-region coverage without runtime mutations', () => {
  const report = buildJingjinjiJinmengOnePotResearchReport(inputs);
  assert.deepEqual(validateJingjinjiJinmengOnePotResearchReport(report), []);
  assert.deepEqual(report.region_overview.region_ids, ['jingjinji', 'jinmeng']);
  assert.equal(report.production_recipe_audits.length, 3);
  assert.equal(report.candidate_audits.length, 4);
  assert.equal(report.concrete_research_leads.length, 4);
  assert.equal(report.source_evidence.length, 9);
  assert.equal(report.household_journeys.length, 15);
  assert.equal(report.summary.production_recipe_changes, 0);
  assert.equal(report.summary.regional_candidate_changes, 0);
});

test('shape and claim matrices keep observable evidence boundaries', () => {
  const report = buildJingjinjiJinmengOnePotResearchReport(inputs);
  const shapes = new Set(report.ingredient_shape_matrix.map(row => row.shape));
  for (const shape of ['cooked_wheat_pancake_shreds', 'raw_wheat_dough_roll', 'fresh_wheat_noodle', 'raw_rice']) assert.ok(shapes.has(shape), shape);
  const claims = new Map(report.claim_matrix.map(row => [`${row.subject_id}:${row.claim_id}`, row.verdict]));
  assert.equal(claims.get('north-china-green-bean-braised-noodles:province_exclusive_identity'), 'not_proven');
  assert.equal(claims.get('hebei-julu-braised-pancake:raw_noodle_equivalence'), 'contradicted');
});

test('completion stays blocked by ratio, identity, safety and human review', () => {
  const report = buildJingjinjiJinmengOnePotResearchReport(inputs);
  assert.equal(report.completion.status, 'research_in_progress');
  assert.deepEqual(report.completion.blockers, ['exact_recipe_equivalence_unresolved', 'staple_shape_boundary_unresolved', 'ratio_rule_unresolved', 'safety_endpoint_incomplete', 'human_journey_review_incomplete']);
  assert.equal(report.summary.human_journey_reviewed_count, 0);
});

test('summary is derived from report rows', () => {
  const report = buildJingjinjiJinmengOnePotResearchReport(inputs);
  assert.deepEqual(report.summary.source_count_by_grade, { A: 7, B: 2, C: 0 });
  assert.equal(formatJingjinjiJinmengOnePotResearchSummary(report), '3 North-China recipe audits · 4 candidate audits · 4 research leads · 15 journeys · North-China research ok');
});

test('report validator rejects dishonest completion and count drift', () => {
  const broken = structuredClone(buildJingjinjiJinmengOnePotResearchReport(inputs));
  broken.completion = { status: 'regional_round_complete', blockers: [] };
  broken.summary.source_count = 99;
  const message = validateJingjinjiJinmengOnePotResearchReport(broken).join('\n');
  assert.match(message, /completion cannot be complete/);
  assert.match(message, /summary source_count expected 9, got 99/);
});

test('builder fails closed on invalid assessment while report validator stays total', () => {
  const broken = structuredClone(inputs);
  broken.assessment.candidate_audits[0].claims.fixed_traditional_core.verdict = 'supported';
  assert.throws(() => buildJingjinjiJinmengOnePotResearchReport(broken), /fixed traditional core/);
  assert.deepEqual(validateJingjinjiJinmengOnePotResearchReport(null), ['report must be an object']);
});
