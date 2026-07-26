import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateRegionalMenuMappings } from '../lib/regional-menu-mapping-validator.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const atlas = read('regional-atlas.v2.json');
const mappings = read('regional-menu-mappings.v1.json');
const recipeLibrary = read('recipe-library.json');
const regionalResearch = read('regional-menu-research.v1.json');
const templates = read('meal-templates.v2.json');
const taxonomy = read('ingredient-taxonomy.v1.json');
const ratios = read('ratio-rules.v1.json');
const validate = value => validateRegionalMenuMappings({
  mappings: value,
  atlas,
  recipeLibrary,
  regionalResearch,
  templates,
  taxonomy,
  ratios,
});

test('mapping ledger covers the exact 72 production and 24 research IDs', () => {
  assert.equal(mappings.production_recipe_mappings.length, 72);
  assert.equal(mappings.research_candidate_mappings.length, 24);
  assert.deepEqual(validate(mappings), []);
});

test('capability ledger covers every atlas technique family exactly once', () => {
  const expected = atlas.technique_families.map(row => row.family_id).sort();
  const actual = mappings.template_capability_mappings.map(row => row.family_id).sort();
  assert.equal(mappings.mapping_version, 'regional-menu-mappings-v1-20260726-r2');
  assert.deepEqual(actual, expected);
  assert.equal(actual.length, 12);
  assert.deepEqual(validate(mappings), []);
});

test('capability ledger distinguishes full partial and no coverage', () => {
  const byFamily = new Map(mappings.template_capability_mappings.map(row => [row.family_id, row]));
  assert.equal(byFamily.get('raw-rice-braise')?.coverage_level, 'full');
  assert.equal(byFamily.get('cooked-rice-stew')?.coverage_level, 'partial');
  assert.deepEqual(byFamily.get('cooked-rice-stew')?.coverage_boundary_codes, ['requires_acid_base']);
  assert.equal(byFamily.get('stew-with-staple')?.coverage_level, 'none');
  assert.equal(byFamily.get('stew-with-staple')?.promotion_status, 'blocked_by_ratio');
});

test('capability coverage partitions the atlas staple states without overlap', () => {
  const broken = structuredClone(mappings);
  const row = broken.template_capability_mappings.find(item => item.family_id === 'noodle-braise');
  row.covered_staple_states = ['生面', '半熟面'];
  row.uncovered_staple_states = ['半熟面'];
  assert.match(validate(broken).join('\n'), /covered and uncovered staple states must be disjoint/);
});

test('national household capabilities cannot acquire fake regions', () => {
  const broken = structuredClone(mappings);
  const row = broken.template_capability_mappings.find(item => item.family_id === 'raw-rice-braise');
  row.regional_scope = 'national_household';
  row.region_ids = ['jiangnan'];
  assert.match(validate(broken).join('\n'), /national_household must not bind regions/);
});

test('no coverage cannot carry a runtime template', () => {
  const broken = structuredClone(mappings);
  const row = broken.template_capability_mappings.find(item => item.family_id === 'stew-with-staple');
  row.coverage_level = 'none';
  row.runtime_template_ids = ['savory-mixed-rice-pot'];
  row.covered_staple_states = [];
  row.uncovered_staple_states = ['玉米面团', '小麦面团'];
  row.coverage_boundary_codes = [];
  assert.match(validate(broken).join('\n'), /none coverage cannot have runtime templates or covered states/);
});

test('capability references fail closed across every controlled catalog', () => {
  const mutations = [
    ['runtime_template_ids', 'invented-template', /unknown runtime template/],
    ['candidate_template_ids', 'invented-template', /unknown candidate template/],
    ['evidence_recipe_ids', 'invented-recipe', /unknown value invented-recipe/],
    ['evidence_research_ids', 'invented-research', /unknown value invented-research/],
    ['taxonomy_item_ids', 'invented-ingredient', /unknown value invented-ingredient/],
    ['resolved_ratio_rule_ids', 'invented-ratio-v1', /unknown resolved ratio rule/],
  ];
  for (const [field, value, expected] of mutations) {
    const broken = structuredClone(mappings);
    const row = broken.template_capability_mappings[0];
    row[field] ??= [];
    row[field].push(value);
    assert.match(validate(broken).join('\n'), expected);
  }
});

test('coverage levels and boundaries fail closed on dishonest combinations', () => {
  const cases = [
    ['unknown boundary', row => { row.coverage_boundary_codes = ['invented_boundary']; }, /unknown value invented_boundary/],
    ['partial without gap', row => { row.coverage_level = 'partial'; row.covered_staple_states = ['生米']; row.uncovered_staple_states = []; row.coverage_boundary_codes = []; }, /partial coverage requires an uncovered state or boundary/],
    ['full with gap', row => { row.coverage_level = 'full'; row.covered_staple_states = ['生米']; row.uncovered_staple_states = []; row.coverage_boundary_codes = ['requires_acid_base']; }, /full coverage cannot retain gaps/],
  ];
  for (const [name, mutate, expected] of cases) {
    const broken = structuredClone(mappings);
    const row = broken.template_capability_mappings.find(item => item.family_id === 'raw-rice-braise');
    mutate(row);
    assert.match(validate(broken).join('\n'), expected, name);
  }
});

test('runtime templates must be active and disjoint from candidates', () => {
  const inactive = structuredClone(mappings);
  const inactiveRow = inactive.template_capability_mappings.find(item => item.family_id === 'raw-rice-braise');
  inactiveRow.runtime_template_ids = ['broth-rice-pot'];
  assert.match(validate(inactive).join('\n'), /runtime template must be active and eligible/);

  const overlap = structuredClone(mappings);
  const overlapRow = overlap.template_capability_mappings.find(item => item.family_id === 'raw-rice-braise');
  overlapRow.runtime_template_ids = ['savory-mixed-rice-pot'];
  overlapRow.candidate_template_ids = ['savory-mixed-rice-pot'];
  assert.match(validate(overlap).join('\n'), /runtime and candidate templates must be disjoint/);
});

test('ready blocked and research states enforce blockers evidence and ratios', () => {
  const ready = structuredClone(mappings);
  const readyRow = ready.template_capability_mappings.find(item => item.family_id === 'raw-rice-braise');
  readyRow.promotion_status = 'covered_by_active_template';
  readyRow.blocker_codes = ['manual_review_pending'];
  assert.match(validate(ready).join('\n'), /ready capability cannot retain blockers/);

  const blocked = structuredClone(mappings);
  const blockedRow = blocked.template_capability_mappings.find(item => item.family_id === 'stew-with-staple');
  blockedRow.blocker_codes = [];
  assert.match(validate(blocked).join('\n'), /blocked or research capability requires blocker_codes/);

  const noEvidence = structuredClone(mappings);
  const evidenceRow = noEvidence.template_capability_mappings.find(item => item.family_id === 'raw-rice-braise');
  evidenceRow.evidence_recipe_ids = [];
  evidenceRow.evidence_research_ids = [];
  assert.match(validate(noEvidence).join('\n'), /requires recipe or research evidence/);

  const ratio = structuredClone(mappings);
  const ratioRow = ratio.template_capability_mappings.find(item => item.family_id === 'raw-rice-braise');
  ratioRow.required_ratio_rule_ids = [];
  ratioRow.resolved_ratio_rule_ids = ['savory-mixed-rice-liquid-v1'];
  assert.match(validate(ratio).join('\n'), /resolved ratio rule must also be required/);
});

test('preview candidates fail closed on stale runtime references or unresolved blockers', () => {
  const broken = structuredClone(mappings);
  const row = broken.template_capability_mappings?.find(item => item.family_id === 'noodle-braise');
  assert.ok(row, 'noodle-braise capability row must exist');
  row.promotion_status = 'preview_candidate';
  row.blocker_codes = [];
  row.resolved_ratio_rule_ids = ['invented-ratio-rule-v1'];
  assert.match(validate(broken).join('\n'), /unknown resolved ratio rule/);
});

test('capability rows reject duplicate families and false ready states', () => {
  const broken = structuredClone(mappings);
  assert.ok(Array.isArray(broken.template_capability_mappings));
  const blocked = broken.template_capability_mappings.find(item => item.family_id === 'noodle-braise');
  blocked.promotion_status = 'preview_candidate';
  blocked.blocker_codes = ['manual_review_pending'];
  broken.template_capability_mappings.push(structuredClone(blocked));
  const message = validate(broken).join('\n');
  assert.match(message, /ready capability cannot retain blockers/);
  assert.match(message, /capability family_id must be unique/);
});

test('capability rows reject taxonomy references that are not controlled identities', () => {
  const broken = structuredClone(mappings);
  assert.ok(Array.isArray(broken.template_capability_mappings));
  broken.template_capability_mappings[0].taxonomy_item_ids.push('invented-ingredient');
  assert.match(validate(broken).join('\n'), /unknown value invented-ingredient/);
});

test('national and outside-China menus cannot acquire fake provinces', () => {
  for (const id of ['basic-risotto', 'home-egg-fried-leftover-rice']) {
    const broken = structuredClone(mappings);
    const row = broken.production_recipe_mappings.find(item => item.source_id === id);
    row.province_codes = ['CN-ZJ'];
    row.region_ids = ['jiangnan'];
    assert.match(validate(broken).join('\n'), /must not bind Chinese regions or provinces/);
  }
});

test('known regional recipes retain explicit locality while home recipes remain national', () => {
  const byId = new Map(mappings.production_recipe_mappings.map(row => [row.source_id, row]));
  assert.deepEqual(byId.get('shanghai-salted-pork-vegetable-rice').province_codes, ['CN-SH']);
  assert.equal(byId.get('home-egg-fried-leftover-rice').regional_scope, 'national_household');
  assert.deepEqual(byId.get('home-egg-fried-leftover-rice').province_codes, []);
  assert.equal(byId.get('basic-risotto').regional_scope, 'outside_cn_atlas');
});

test('porridge receives its own technique and research legacy families use an explicit crosswalk', () => {
  const production = new Map(mappings.production_recipe_mappings.map(row => [row.source_id, row]));
  const research = new Map(mappings.research_candidate_mappings.map(row => [row.source_id, row]));
  assert.equal(production.get('chinese-congee').primary_family_id, 'grain-porridge');
  assert.equal(production.get('tibetan-savory-congee').primary_family_id, 'grain-porridge');
  assert.equal(research.get('henan-bean-pork-steamed-noodles').primary_family_id, 'noodle-steam-braise');
  assert.equal(research.get('chongqing-firewood-potato-rice-home').primary_family_id, 'raw-rice-braise');
});

test('province-specific mappings must include their parent region', () => {
  const broken = structuredClone(mappings);
  const row = broken.production_recipe_mappings.find(item => item.source_id === 'shanghai-salted-pork-vegetable-rice');
  row.region_ids = ['northwest'];
  assert.match(validate(broken).join('\n'), /province CN-SH belongs to region jiangnan/);
});

test('mapping validator rejects missing extra duplicate and recipe-only fields', () => {
  const broken = structuredClone(mappings);
  broken.production_recipe_mappings.pop();
  broken.research_candidate_mappings.push(structuredClone(broken.research_candidate_mappings[0]));
  broken.research_candidate_mappings[0].ratio_rules = ['不应进入映射层'];
  const message = validate(broken).join('\n');
  assert.match(message, /production source ID set must exactly match recipe library IDs/);
  assert.match(message, /research source_id must be unique/);
  assert.match(message, /ratio_rules is not allowed/);
});

test('mapping validator is total for malformed roots and rows', () => {
  assert.deepEqual(validateRegionalMenuMappings({ mappings: null, atlas, recipeLibrary, regionalResearch }), ['mappings must be an object']);
  const broken = structuredClone(mappings);
  broken.production_recipe_mappings = [null];
  broken.research_candidate_mappings = [null];
  broken.template_capability_mappings = [null];
  assert.doesNotThrow(() => validate(broken));
  assert.match(validate(broken).join('\n'), /mapping must be an object/);
});
