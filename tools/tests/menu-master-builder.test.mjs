import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildMenuMaster,
  buildProductionMenuEntry,
  formatMenuMasterSummary,
  validateMenuMasterBaseline,
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

test('taxonomy-unknown core ingredients remain core and are explicitly marked for role review', () => {
  const entry = buildProductionMenuEntry({
    ...recipe,
    core_ingredients: ['大米', '意式烩饭米'],
  }, 0, new Map(taxonomy.items.map(item => [item.display_name, item])));
  assert.deepEqual(entry.ingredients.staples, ['大米']);
  assert.deepEqual(entry.ingredients.core, ['意式烩饭米']);
  assert.deepEqual(entry.ingredients.unknown_role, ['意式烩饭米']);
});

test('low-level production entry builder defaults to an empty taxonomy index', () => {
  const entry = buildProductionMenuEntry(recipe, 0);
  assert.deepEqual(entry.ingredients.staples, []);
  assert.deepEqual(entry.ingredients.core, ['大米', '牛肉']);
  assert.deepEqual(entry.ingredients.unknown_role, ['大米', '牛肉']);
});

test('missing source fields remain pending instead of being invented', () => {
  const { source_refs, ...recipeWithoutSourceRefs } = recipe;
  const entry = buildProductionMenuEntry(recipeWithoutSourceRefs, 0, new Map());
  assert.equal(entry.audit.source_status, 'pending_review');
  assert.ok(entry.audit.missing_fields.includes('source_refs'));
  assert.equal(entry.evidence.source_count, 0);
  assert.deepEqual(entry.evidence.source_refs, []);
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

  for (const ingredient of ['意式烩饭米', '糯米', '紫米', '粉丝']) {
    const menu = master.production_menus.find(entry => entry.ingredients.core.includes(ingredient));
    assert.ok(menu, `${ingredient} must remain in a production core boundary`);
    assert.ok(menu.ingredients.unknown_role.includes(ingredient), `${ingredient} must be displayed as 待核实角色`);
  }
  const milletMenu = master.production_menus.find(entry => entry.ingredients.core.includes('小米'));
  assert.ok(milletMenu, '小米 must remain in a production core boundary');
  assert.equal(milletMenu.ingredients.unknown_role.includes('小米'), false, '受控小米 taxonomy 不得继续显示为待核实角色');
  const freshNoodleMenu = master.production_menus.find(entry => entry.ingredients.staples.includes('鲜小麦面条'));
  assert.ok(freshNoodleMenu, '鲜小麦面条 must remain in a production staple boundary');
  assert.equal(freshNoodleMenu.ingredients.unknown_role.includes('鲜小麦面条'), false);
  const wheatDoughMenu = master.production_menus.find(entry => entry.ingredients.staples.includes('小麦面团'));
  assert.ok(wheatDoughMenu, '小麦面团 must remain in a production staple boundary');
  assert.equal(wheatDoughMenu.ingredients.unknown_role.includes('小麦面团'), false);
});

test('versioned phase-zero baseline locks every production ID and status', () => {
  const library = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  const realTaxonomy = JSON.parse(fs.readFileSync(new URL('../data/ingredient-taxonomy.v1.json', import.meta.url), 'utf8'));
  const research = JSON.parse(fs.readFileSync(new URL('../data/regional-menu-research.v1.json', import.meta.url), 'utf8'));
  const verification = JSON.parse(fs.readFileSync(new URL('../data/menu-verification-cases.v1.json', import.meta.url), 'utf8'));
  const baseline = JSON.parse(fs.readFileSync(new URL('../data/menu-master-baseline.v1.json', import.meta.url), 'utf8'));
  const master = buildMenuMaster({ recipeLibrary: library, taxonomy: realTaxonomy, regionalResearch: research, verificationCases: verification });

  assert.deepEqual(validateMenuMasterBaseline(master, baseline), []);

  const missingRecipe = structuredClone(master);
  missingRecipe.production_menus.pop();
  missingRecipe.summary.production_count -= 1;
  missingRecipe.summary.auto_approved_count -= 1;
  assert.match(validateMenuMasterBaseline(missingRecipe, baseline).join('\n'), /intentionally update tools\/data\/menu-master-baseline\.v1\.json/);

  const changedStatus = structuredClone(master);
  changedStatus.production_menus[0].status = 'auto_approved';
  changedStatus.summary.approved_count -= 1;
  changedStatus.summary.auto_approved_count += 1;
  assert.match(validateMenuMasterBaseline(changedStatus, baseline).join('\n'), /production ID\/status set differs from the versioned Phase Zero baseline/);
});

test('Phase Zero baseline requires exactly six integer expected summary keys', () => {
  const library = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  const realTaxonomy = JSON.parse(fs.readFileSync(new URL('../data/ingredient-taxonomy.v1.json', import.meta.url), 'utf8'));
  const research = JSON.parse(fs.readFileSync(new URL('../data/regional-menu-research.v1.json', import.meta.url), 'utf8'));
  const verification = JSON.parse(fs.readFileSync(new URL('../data/menu-verification-cases.v1.json', import.meta.url), 'utf8'));
  const baseline = JSON.parse(fs.readFileSync(new URL('../data/menu-master-baseline.v1.json', import.meta.url), 'utf8'));
  const master = buildMenuMaster({ recipeLibrary: library, taxonomy: realTaxonomy, regionalResearch: research, verificationCases: verification });
  const required = [
    'production_count', 'approved_count', 'auto_approved_count', 'research_count',
    'verification_case_count', 'pending_verification_menu_count',
  ];

  for (const field of required) {
    const broken = structuredClone(baseline);
    delete broken.expected_summary[field];
    assert.match(validateMenuMasterBaseline(master, broken).join('\n'), new RegExp(`expected_summary missing required key ${field}`));
  }
  const unknownKey = structuredClone(baseline);
  unknownKey.expected_summary.unreviewed_count = 0;
  assert.match(validateMenuMasterBaseline(master, unknownKey).join('\n'), /expected_summary unknown key unreviewed_count is not allowed/);

  const nonInteger = structuredClone(baseline);
  nonInteger.expected_summary.pending_verification_menu_count = 71.5;
  assert.match(validateMenuMasterBaseline(master, nonInteger).join('\n'), /expected_summary pending_verification_menu_count must be an integer/);
});

test('menu master success summaries are derived from the supplied master', () => {
  assert.equal(formatMenuMasterSummary({
    summary: {
      production_count: 3,
      research_count: 2,
      verification_case_count: 1,
    },
    production_menus: [{ audit: { verification_status: 'pending' } }, { audit: { verification_status: 'covered' } }, { audit: { verification_status: 'pending' } }],
  }), '3 production menus · 2 research candidates · 2 pending verification menus');
});

test('public menu master builder and validator return structured errors for null nested inputs', () => {
  const master = buildMenuMaster({
    recipeLibrary: { recipes: [null] },
    taxonomy: { items: null },
    regionalResearch: { entries: [null] },
    verificationCases: { entries: [null] },
  });
  assert.doesNotThrow(() => validateMenuMaster(master));
  assert.match(validateMenuMaster(master).join('\n'), /production menu 0 id must be a non-empty string/);
  assert.match(validateMenuMaster(master).join('\n'), /research candidate 0 must be an object/);
  assert.match(validateMenuMaster(master).join('\n'), /verification case 0 must be an object/);

  assert.doesNotThrow(() => validateMenuMaster({
    production_menus: null,
    research_candidates: null,
    verification_cases: null,
    summary: null,
  }));
  assert.match(validateMenuMaster({
    production_menus: null,
    research_candidates: null,
    verification_cases: null,
    summary: null,
  }).join('\n'), /production_menus must be an array/);

  assert.doesNotThrow(() => buildMenuMaster({
    recipeLibrary: { recipes: [] },
    taxonomy: { items: {} },
    regionalResearch: { entries: [] },
    verificationCases: { entries: [] },
  }));
});

function makeValidMaster() {
  return {
    production_menus: [{ id: 'menu-1', library_index: 1, status: 'approved' }],
    research_candidates: [{ atlas_id: 'research-1' }],
    verification_cases: [{}],
    summary: {
      approved_count: 1,
      auto_approved_count: 0,
      production_count: 1,
      research_count: 1,
      verification_case_count: 1,
    },
  };
}

test('menu master validation rejects duplicate production IDs', () => {
  const master = makeValidMaster();
  master.production_menus.push({ id: 'menu-1', library_index: 2, status: 'approved' });
  master.summary.approved_count = 2;
  master.summary.production_count = 2;

  assert.deepEqual(validateMenuMaster(master), ['duplicate production menu IDs']);
});

test('menu master validation rejects duplicate library indexes', () => {
  const master = makeValidMaster();
  master.production_menus.push({ id: 'menu-2', library_index: 1, status: 'approved' });
  master.summary.approved_count = 2;
  master.summary.production_count = 2;

  assert.deepEqual(validateMenuMaster(master), ['duplicate production menu library indexes']);
});

test('menu master validation rejects mismatched summary counts', () => {
  const master = makeValidMaster();
  master.summary.production_count = 2;

  assert.deepEqual(validateMenuMaster(master), ['mismatched summary production_count']);
});

test('menu master validation rejects production IDs that overlap research atlas IDs', () => {
  const master = makeValidMaster();
  master.research_candidates[0].atlas_id = 'menu-1';

  assert.deepEqual(validateMenuMaster(master), ['production menu IDs overlap research atlas IDs']);
});
