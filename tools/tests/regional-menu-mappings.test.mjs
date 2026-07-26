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

test('capability ledger records covered, preview-ready, and ratio-blocked techniques', () => {
  assert.ok(Array.isArray(mappings.template_capability_mappings));
  const byFamily = new Map(mappings.template_capability_mappings.map(row => [row.family_id, row]));
  assert.equal(byFamily.size, 3);
  assert.equal(byFamily.get('raw-rice-braise')?.promotion_status, 'covered_by_active_template');
  assert.equal(byFamily.get('noodle-braise')?.promotion_status, 'preview_candidate');
  assert.deepEqual(byFamily.get('noodle-braise')?.resolved_ratio_rule_ids, ['braised-noodle-liquid-v1']);
  assert.equal(byFamily.get('stew-with-staple')?.promotion_status, 'blocked_by_ratio');
  assert.deepEqual(validate(mappings), []);
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
