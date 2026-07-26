import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildRegionalAtlasReport,
  formatRegionalAtlasSummary,
  validateRegionalAtlasReport,
} from '../lib/regional-atlas-builder.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const inputs = {
  atlas: read('regional-atlas.v2.json'),
  mappings: read('regional-menu-mappings.v1.json'),
  recipeLibrary: read('recipe-library.json'),
  regionalResearch: read('regional-menu-research.v1.json'),
};

test('real report audits 34 provinces, 72 recipes and 24 candidates', () => {
  const report = buildRegionalAtlasReport(inputs);
  assert.deepEqual(validateRegionalAtlasReport(report), []);
  assert.equal(report.summary.region_count, 13);
  assert.equal(report.summary.province_count, 34);
  assert.equal(report.summary.technique_family_count, 12);
  assert.equal(report.summary.production_audit_count, 72);
  assert.equal(report.summary.research_audit_count, 24);
});

test('outside and national menus stay visible without fake geography', () => {
  const report = buildRegionalAtlasReport(inputs);
  const risotto = report.production_audit.find(row => row.source_id === 'basic-risotto');
  const friedRice = report.production_audit.find(row => row.source_id === 'home-egg-fried-leftover-rice');
  assert.equal(risotto.regional_scope, 'outside_cn_atlas');
  assert.deepEqual(risotto.region_ids, []);
  assert.equal(friedRice.regional_scope, 'national_household');
  assert.deepEqual(friedRice.province_codes, []);
  assert.equal(report.summary.outside_cn_atlas_count, 11);
  assert.equal(report.summary.national_household_count, 31);
});

test('blank provinces remain explicit instead of disappearing', () => {
  const report = buildRegionalAtlasReport(inputs);
  assert.equal(report.province_coverage.length, 34);
  const blanks = report.province_coverage.filter(row => row.coverage_status === 'skeleton_only');
  assert.ok(blanks.length > 0);
  for (const row of blanks) {
    assert.equal(row.production_recipe_ids.length, 0);
    assert.equal(row.research_candidate_ids.length, 0);
    assert.ok(Boolean(row.research_question) !== Boolean(row.defer_reason));
  }
});

test('all technique families remain visible and porridge is independently counted', () => {
  const report = buildRegionalAtlasReport(inputs);
  assert.equal(report.technique_coverage.length, 12);
  const porridge = report.technique_coverage.find(row => row.family_id === 'grain-porridge');
  assert.deepEqual(porridge.production_recipe_ids, ['chinese-congee', 'qinghai-hao-fan', 'tibetan-savory-congee']);
});

test('report exposes all 12 planner capability rows in atlas order', () => {
  const report = buildRegionalAtlasReport(inputs);
  assert.ok(Array.isArray(report.capability_coverage));
  assert.equal(report.capability_coverage.length, 12);
  assert.deepEqual(
    report.capability_coverage.map(row => row.family_id),
    inputs.atlas.technique_families.map(row => row.family_id),
  );
  assert.equal(report.summary.capability_full_count, 3);
  assert.equal(report.summary.capability_partial_count, 2);
  assert.equal(report.summary.capability_none_count, 7);
  const stew = report.capability_coverage.find(row => row.family_id === 'stew-with-staple');
  assert.equal(stew.promotion_status, 'blocked_by_ratio');
  assert.deepEqual(stew.runtime_template_ids, []);
});

test('pantry gaps aggregate exact research strings without semantic invention', () => {
  const report = buildRegionalAtlasReport(inputs);
  const byItem = new Map(report.pantry_gap_coverage.map(row => [row.item, row]));
  assert.equal(byItem.get('土豆').research_candidate_count, 8);
  assert.equal(byItem.has('马铃薯'), false);
  assert.ok(byItem.get('土豆').research_candidate_ids.includes('chongqing-firewood-potato-rice-home'));
});

test('source status keeps discovery-only research distinct from production evidence', () => {
  const report = buildRegionalAtlasReport(inputs);
  assert.equal(report.source_status.research.discovery_only, 24);
  assert.equal(report.source_status.research.fact_checked, 0);
  assert.equal(report.source_status.production.with_sources, 72);
});

test('summary text is derived from the report', () => {
  const report = buildRegionalAtlasReport(inputs);
  assert.equal(
    formatRegionalAtlasSummary(report),
    '13 regions · 34 provinces · 12 technique families · 72 production audits · 24 research audits',
  );
});

test('report validator rejects mismatched summaries, duplicate sources and missing provinces', () => {
  const broken = buildRegionalAtlasReport(inputs);
  broken.summary.production_audit_count += 2;
  broken.production_audit.push(structuredClone(broken.production_audit[0]));
  broken.province_coverage.pop();
  const message = validateRegionalAtlasReport(broken).join('\n');
  assert.match(message, /summary production_audit_count/);
  assert.match(message, /production audit source_id must be unique/);
  assert.match(message, /province_coverage must contain exactly 34 items/);
});

test('report validator rejects missing or duplicate capability families', () => {
  const missing = buildRegionalAtlasReport(inputs);
  assert.ok(Array.isArray(missing.capability_coverage));
  missing.capability_coverage.pop();
  assert.match(validateRegionalAtlasReport(missing).join('\n'), /capability_coverage must contain exactly 12 items/);

  const duplicate = buildRegionalAtlasReport(inputs);
  duplicate.capability_coverage[1].family_id = duplicate.capability_coverage[0].family_id;
  assert.match(validateRegionalAtlasReport(duplicate).join('\n'), /capability coverage family_id must be unique/);
});

test('builder and report validator are total for malformed nested inputs', () => {
  assert.doesNotThrow(() => buildRegionalAtlasReport({
    atlas: { regions: [null], province_nodes: [null], technique_families: [null], cultural_overlays: [null] },
    mappings: { production_recipe_mappings: [null], research_candidate_mappings: [null], template_capability_mappings: [null] },
    recipeLibrary: { recipes: [null] },
    regionalResearch: { entries: [null] },
  }));
  assert.doesNotThrow(() => validateRegionalAtlasReport(null));
  assert.deepEqual(validateRegionalAtlasReport(null), ['report must be an object']);
});
