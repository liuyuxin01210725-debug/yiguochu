import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildMenuMaster,
  buildProductionMenuEntry,
  validateMenuMaster,
} from '../lib/menu-master-builder.mjs';

const taxonomy = {
  taxonomy_version: 'test-taxonomy',
  items: [{
    canonical_id: 'raw-rice',
    display_name: '大米',
    aliases: ['白米'],
    category: 'raw_rice',
    compatible_slot_codes: ['staple', 'raw_rice'],
  }],
};

const recipe = {
  id: 'test-rice-pot',
  family_id: 'family-test',
  status: 'auto_approved',
  name: '测试饭锅',
  cuisine: '测试地域',
  form: '焖饭',
  summary: '测试摘要',
  purposes: ['pantry'],
  protein_class: ['牛'],
  light_level: '适中',
  total_time_minutes: 30,
  core_ingredients: ['大米', '牛肉'],
  optional_ingredients: ['胡萝卜', '水'],
  generation_optional_ingredients: ['胡萝卜'],
  generation_liquid_ingredients: ['水'],
  substitution_slots: [{ slot: '肉类', replaces: ['牛肉'], allowed: ['鸡肉'] }],
  discouraged: [{ ingredients: ['牛腩'], reason_type: 'shape', reason: '时间不足。' }],
  technique: ['同锅焖制'],
  ratio_rules: ['大米与水按规则计算'],
  safety_rules: ['肉类完全熟透'],
  source_refs: [{ usage: 'approved', title: '测试来源', url: 'https://example.test/recipe' }],
};

test('production menu extraction preserves every declared ingredient boundary', () => {
  const entry = buildProductionMenuEntry(recipe, 0, new Map(taxonomy.items.map(item => [item.display_name, item])));
  assert.equal(entry.library_index, 1);
  assert.deepEqual(entry.ingredients.staples, ['大米']);
  assert.deepEqual(entry.ingredients.core, ['牛肉']);
  assert.deepEqual(entry.ingredients.optional, ['胡萝卜', '水']);
  assert.deepEqual(entry.ingredients.generation_optional, ['胡萝卜']);
  assert.deepEqual(entry.ingredients.liquids, ['水']);
  assert.deepEqual(entry.ingredients.substitutions, recipe.substitution_slots);
  assert.deepEqual(entry.ingredients.discouraged, recipe.discouraged);
});

test('missing source fields remain pending instead of being invented', () => {
  const entry = buildProductionMenuEntry({ ...recipe, source_refs: [] }, 0, new Map());
  assert.equal(entry.audit.source_status, 'pending_review');
  assert.ok(entry.audit.missing_fields.includes('source_refs'));
});

test('production and research counts remain separate', () => {
  const master = buildMenuMaster({
    recipeLibrary: { schema_version: 1, families: [{ id: 'family-test' }], recipes: [recipe] },
    taxonomy,
    regionalResearch: { schema_version: 1, entries: [{ atlas_id: 'research-only' }] },
    verificationCases: { schema_version: 1, entries: [] },
  });
  assert.equal(master.summary.production_count, 1);
  assert.equal(master.summary.research_count, 1);
  assert.deepEqual(validateMenuMaster(master), []);
});

test('current production library produces exactly 72 unique menu rows', () => {
  const library = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  const realTaxonomy = JSON.parse(fs.readFileSync(new URL('../data/ingredient-taxonomy.v1.json', import.meta.url), 'utf8'));
  const master = buildMenuMaster({
    recipeLibrary: library,
    taxonomy: realTaxonomy,
    regionalResearch: { schema_version: 1, entries: [] },
    verificationCases: { schema_version: 1, entries: [] },
  });
  assert.equal(master.summary.production_count, 72);
  assert.equal(master.summary.approved_count, 12);
  assert.equal(master.summary.auto_approved_count, 60);
  assert.equal(new Set(master.production_menus.map(menu => menu.id)).size, 72);
  assert.deepEqual(validateMenuMaster(master), []);
});
