import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertIngredientTaxonomy,
  normalizeIngredientTaxonomyKey,
  validateIngredientTaxonomy,
} from '../lib/ingredient-taxonomy-validator.mjs';
import { normalizePlannerItems, normalizePlannerTaxonomyKey } from '../../worker/src/planner-v2.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(fs.readFileSync(
  path.join(here, '../data/ingredient-taxonomy.v1.json'),
  'utf8',
));

test('taxonomy is versioned, unique, and covers the first planner vocabulary', () => {
  assert.equal(catalog.taxonomy_version, 'taxonomy-v1-20260727-r3');
  assert.deepEqual(validateIngredientTaxonomy(catalog), []);
  assert.doesNotThrow(() => assertIngredientTaxonomy(catalog));

  const canonicalIds = catalog.items.map(item => item.canonical_id);
  assert.equal(new Set(canonicalIds).size, canonicalIds.length);
  const aliases = catalog.items.flatMap(item => item.aliases);
  assert.equal(new Set(aliases).size, aliases.length);

  const names = new Set(catalog.items.map(item => item.display_name));
  for (const name of [
    '大米', '熟米饭', '面条', '番茄', '鸡蛋', '嫩豆腐', '老豆腐',
    '牛肉', '牛肉末', '鸡肉', '鸡胸肉', '鸡腿肉', '猪肉', '排骨',
    '白菜', '西兰花', '青菜', '豆角', '黄瓜', '洋葱', '胡萝卜', '土豆',
    '金针菇', '香菇', '咸肉', '腊肠', '玉米面', '和好的玉米面团',
    '锅边玉米饼', '现成玉米饼', '油豆角', '小麦面团',
    '水', '食用油', '盐', '酱油',
  ]) assert.ok(names.has(name), `missing ${name}`);
});

test('cornmeal identities preserve raw prepared derived and ready states', () => {
  const byId = new Map(catalog.items.map(item => [item.canonical_id, item]));
  assert.deepEqual(
    ['cornmeal-flour', 'cornmeal-dough', 'pot-edge-corn-cake', 'ready-corn-cake']
      .map(id => [id, byId.get(id)?.states, byId.get(id)?.input_scope]),
    [
      ['cornmeal-flour', ['raw'], 'pantry_input'],
      ['cornmeal-dough', ['prepared'], 'pantry_input'],
      ['pot-edge-corn-cake', ['derived_plan_output'], 'derived_only'],
      ['ready-corn-cake', ['cooked'], 'pantry_input'],
    ],
  );
});

test('cornmeal aliases preserve coarseness and never collapse cooked or derived forms', () => {
  const [fine, coarse, unspecified, dough, ready, forgedDerived] = normalizePlannerItems(
    ['细玉米面', '粗玉米面', '玉米面', '玉米面团', '现成玉米饼', '锅边玉米饼'],
    catalog,
  );
  assert.deepEqual([fine.canonical, fine.shape_or_cut], ['玉米面', 'fine']);
  assert.deepEqual([coarse.canonical, coarse.shape_or_cut], ['玉米面', 'coarse']);
  assert.deepEqual([unspecified.canonical, unspecified.shape_or_cut], ['玉米面', 'unspecified']);
  assert.deepEqual([dough.category, dough.shape_or_cut], ['cornmeal_dough', 'dough_piece']);
  assert.deepEqual([ready.category, ready.cooking_risk], ['ready_staple', 'none']);
  assert.equal(forgedDerived.recognized, false);
});

test('oil beans remain distinct from generic green beans', () => {
  const [oilBeans, generic] = normalizePlannerItems(['油豆角', '普通豆角'], catalog);
  assert.equal(oilBeans.display_name, '油豆角');
  assert.equal(oilBeans.canonical, '油豆角');
  assert.equal(generic.display_name, '豆角');
  assert.equal(generic.canonical, '豆角');
  assert.notEqual(oilBeans.canonical, generic.canonical);
  assert.deepEqual(oilBeans.required_endpoint_codes, ['bean_fully_cooked']);
  assert.deepEqual(generic.required_endpoint_codes, ['bean_fully_cooked']);
});

test('derived-only identities cannot advertise pantry aliases or the wrong state', () => {
  const aliasLeak = structuredClone(catalog);
  const aliasLeakItem = aliasLeak.items.find(item => item.canonical_id === 'pot-edge-corn-cake');
  assert.ok(aliasLeakItem);
  aliasLeakItem.aliases = ['贴饼子'];
  assert.match(validateIngredientTaxonomy(aliasLeak).join('\n'), /derived_only identities must not define aliases/);

  const wrongState = structuredClone(catalog);
  const wrongStateItem = wrongState.items.find(item => item.canonical_id === 'pot-edge-corn-cake');
  assert.ok(wrongStateItem);
  wrongStateItem.states = ['cooked'];
  assert.match(validateIngredientTaxonomy(wrongState).join('\n'), /derived_only identity must use derived_plan_output/);

  const indirectAlias = structuredClone(catalog);
  const pantryItem = indirectAlias.items.find(item => item.canonical_id === 'ready-corn-cake');
  pantryItem.canonical_name = '锅边玉米饼';
  assert.match(
    validateIngredientTaxonomy(indirectAlias).join('\n'),
    /canonical_name must not target a derived_only identity/,
  );
});

test('regional ingredients preserve cured-meat and dough cooking identities', () => {
  const [salted, sausage, cornDough, wheatDough, bacon] = normalizePlannerItems(
    ['咸肉', '腊肠', '玉米面团', '小麦面团', '腊肉'],
    catalog,
  );
  assert.deepEqual(
    [salted.canonical, salted.category, salted.shape_or_cut, salted.cooking_risk],
    ['咸肉', 'pork', 'cured_slice', 'raw_pork'],
  );
  assert.deepEqual(
    [sausage.canonical, sausage.category, sausage.shape_or_cut, sausage.cooking_risk],
    ['腊肠', 'pork', 'sausage', 'raw_pork'],
  );
  assert.deepEqual(
    [cornDough.category, cornDough.shape_or_cut, cornDough.cooking_risk],
    ['cornmeal_dough', 'dough_piece', 'raw_dough'],
  );
  assert.deepEqual(
    [wheatDough.category, wheatDough.shape_or_cut, wheatDough.cooking_risk],
    ['wheat_dough', 'dough_piece', 'raw_dough'],
  );
  assert.equal(bacon.recognized, false, '咸肉不能无依据扩成腊肉同义词');
});

test('Jiangnan M1 identities preserve regional names and controlled compatibility', () => {
  const rows = normalizePlannerItems(
    ['小白菜', '矮脚黄', '咸五花肉', '腊五花肉', '平菇'],
    catalog,
  );
  assert.deepEqual(rows.map(row => [
    row.raw,
    row.canonical,
    row.display_name,
    row.category,
    row.shape_or_cut,
    row.cooking_risk,
  ]), [
    ['小白菜', '青菜', '小白菜', 'leafy_vegetable', 'whole', 'none'],
    ['矮脚黄', '青菜', '矮脚黄', 'leafy_vegetable', 'whole', 'none'],
    ['咸五花肉', '咸肉', '咸五花肉', 'pork', 'cured_slice', 'raw_pork'],
    ['腊五花肉', '咸肉', '腊五花肉', 'pork', 'cured_slice', 'raw_pork'],
    ['平菇', '平菇', '平菇', 'mushroom', 'whole', 'none'],
  ]);
  assert.ok(rows[2].compatible_slot_codes.includes('cured_pork'));
  assert.ok(rows[3].compatible_slot_codes.includes('cured_pork'));
  assert.deepEqual(rows[2].texture_failure_modes, ['salty_when_overseasoned']);
  assert.deepEqual(rows[3].texture_failure_modes, ['salty_when_overseasoned']);
});

test('Jiangnan M1 keeps cooked duck glutinous rice and color source unresolved', () => {
  const rows = normalizePlannerItems(
    ['包装熟制板鸭（去骨）', '糯米', '食品级黑米色粉'],
    catalog,
  );
  assert.ok(rows.every(row => row.recognized === false));
});

test('taxonomy carries culinary behavior, not category alone', () => {
  const beef = catalog.items.find(item => item.canonical_id === 'beef-generic');
  assert.equal(beef.category, 'beef');
  assert.ok(beef.shapes_or_cuts.includes('tenderloin'));
  assert.equal(beef.cook_speed, 'fast');
  assert.equal(beef.moisture_release, 'low');
  assert.equal(beef.texture_behavior.behavior_code, 'tender_when_quick_cooked');
  assert.equal(beef.cooking_risk.risk_code, 'raw_beef');
  assert.deepEqual(beef.incompatible_slot_codes, ['brisket_required', 'ground_meat_required']);
});

test('validator rejects duplicate IDs and aliases plus incomplete cooking attributes', () => {
  const invalid = structuredClone(catalog);
  invalid.items[1].canonical_id = invalid.items[0].canonical_id;
  invalid.items[2].aliases = [invalid.items[0].aliases[0]];
  delete invalid.items[3].cooking_risk;
  const errors = validateIngredientTaxonomy(invalid);
  assert.ok(errors.some(error => error.includes('duplicate canonical_id')));
  assert.ok(errors.some(error => error.includes('duplicate normalized alias')));
  assert.ok(errors.some(error => error.includes('cooking_risk')));
});

test('validator rejects codes outside its finite first-stage vocabularies', () => {
  const invalid = structuredClone(catalog);
  invalid.items[0].texture_behavior.best_method_codes = ['invent_method'];
  invalid.items[0].texture_behavior.failure_mode_codes = ['invent_failure'];
  invalid.items[0].cooking_risk.required_endpoint_codes = ['invent_endpoint'];
  invalid.items[0].compatible_slot_codes = ['invent_slot'];
  invalid.items[0].incompatible_slot_codes = ['invent_incompatible_slot'];
  const errors = validateIngredientTaxonomy(invalid);
  for (const field of [
    'texture_behavior.best_method_codes',
    'texture_behavior.failure_mode_codes',
    'cooking_risk.required_endpoint_codes',
    'compatible_slot_codes',
    'incompatible_slot_codes',
  ]) assert.ok(errors.some(error => error.includes(field)), field);
});

test('validator rejects incomplete machine schemas and unsafe risk rows without endpoints', () => {
  const invalid = structuredClone(catalog);
  invalid.items[0].states = [];
  invalid.items[1].shapes_or_cuts = [];
  invalid.items[2].texture_behavior.best_method_codes = [];
  invalid.items[3].compatible_slot_codes = [];
  invalid.items.find(item => item.canonical_id === 'chicken-breast').cooking_risk.required_endpoint_codes = [];
  const errors = validateIngredientTaxonomy(invalid);
  for (const field of [
    'states are invalid',
    'shapes_or_cuts are invalid',
    'texture_behavior.best_method_codes are invalid',
    'compatible_slot_codes are invalid',
    'cooking_risk.required_endpoint_codes must not be empty for raw_poultry',
  ]) assert.ok(errors.some(error => error.includes(field)), field);
});

test('validator returns string errors for malformed alias-shape containers without throwing', () => {
  for (const field of ['aliases', 'shapes_or_cuts']) {
    const invalid = structuredClone(catalog);
    const item = invalid.items.find(entry => entry.canonical_id === 'beef-generic');
    item[field] = { bad:1 };
    item.default_shape_or_cut = 'slice';
    item.alias_shape_or_cut = { 牛肉片:'slice' };
    assert.doesNotThrow(() => validateIngredientTaxonomy(invalid), field);
    const errors = validateIngredientTaxonomy(invalid);
    assert.ok(errors.length > 0);
    assert.ok(errors.every(error => typeof error === 'string'));
    assert.ok(errors.some(error => error.includes(field)), field);
  }
});

test('validator rejects canonical names that do not resolve to a compatible base identity', () => {
  const nonexistent = structuredClone(catalog);
  nonexistent.items.find(item => item.canonical_id === 'beef-tenderloin').canonical_name = '不存在的肉';
  assert.ok(validateIngredientTaxonomy(nonexistent).some(error => error.includes('canonical_name must name an existing display_name')));

  const incompatible = structuredClone(catalog);
  incompatible.items.find(item => item.canonical_id === 'beef-tenderloin').canonical_name = '鸡肉';
  assert.ok(validateIngredientTaxonomy(incompatible).some(error => error.includes('canonical_name category must match')));

  const selfOrChain = structuredClone(catalog);
  selfOrChain.items.find(item => item.canonical_id === 'beef-tenderloin').canonical_name = '鸡胸肉';
  assert.ok(validateIngredientTaxonomy(selfOrChain).some(error => error.includes('canonical_name must not point to another canonical alias')));

  const self = structuredClone(catalog);
  self.items.find(item => item.canonical_id === 'beef-tenderloin').canonical_name = '牛里脊';
  assert.ok(validateIngredientTaxonomy(self).some(error => error.includes('canonical_name must not point to itself')));
});

test('validator and planner share a normalized identity key and reject normalized collisions', () => {
  assert.equal(normalizeIngredientTaxonomyKey(' 牛 里 脊 '), '牛里脊');
  assert.equal(normalizePlannerTaxonomyKey(' 牛 里 脊 '), '牛里脊');

  const aliasDisplayCollision = structuredClone(catalog);
  aliasDisplayCollision.items.find(item => item.canonical_id === 'beef-generic').aliases.push(' 牛 里 脊 ');
  assert.ok(validateIngredientTaxonomy(aliasDisplayCollision).some(error => error.includes('normalized alias conflicts with display_name')));

  const aliasAliasCollision = structuredClone(catalog);
  aliasAliasCollision.items.find(item => item.canonical_id === 'chicken-generic').aliases.push(' 金 菇 ');
  assert.ok(validateIngredientTaxonomy(aliasAliasCollision).some(error => error.includes('duplicate normalized alias')));
});

test('planner normalization preserves cuts while mapping generic beef only where safe', () => {
  const tenderloin = normalizePlannerItems(['牛里脊肉'], catalog)[0];
  assert.deepEqual(
    pickIdentity(tenderloin),
    { canonical:'牛肉', category:'beef', shape_or_cut:'tenderloin', recognized:true },
  );
  assert.equal(tenderloin.raw, '牛里脊肉');
  assert.equal(tenderloin.role, 'must_use');

  const sirloin = normalizePlannerItems(['牛柳'], catalog)[0];
  const beefSlice = normalizePlannerItems(['牛肉片'], catalog)[0];
  assert.equal(sirloin.canonical, '牛肉');
  assert.equal(sirloin.shape_or_cut, 'tenderloin');
  assert.equal(beefSlice.canonical, '牛肉');
  assert.equal(beefSlice.shape_or_cut, 'slice');

  const [brisket, ground] = normalizePlannerItems(['牛腩', '牛肉末'], catalog);
  assert.deepEqual(pickIdentity(brisket), { canonical:'牛腩', category:'beef', shape_or_cut:'brisket', recognized:true });
  assert.deepEqual(pickIdentity(ground), { canonical:'牛肉末', category:'beef', shape_or_cut:'ground', recognized:true });
});

test('planner normalization distinguishes poultry cuts and tofu texture classes', () => {
  const [breast, leg, soft, softAlias, firm, firmAlias] = normalizePlannerItems(
    ['鸡胸肉', '鸡腿肉', '嫩豆腐', '南豆腐', '老豆腐', '豆腐'],
    catalog,
  );
  assert.deepEqual(pickIdentity(breast), { canonical:'鸡肉', category:'chicken', shape_or_cut:'breast', recognized:true });
  assert.deepEqual(pickIdentity(leg), { canonical:'鸡肉', category:'chicken', shape_or_cut:'leg', recognized:true });
  assert.deepEqual(pickIdentity(soft), { canonical:'嫩豆腐', category:'soft_tofu', shape_or_cut:'whole', recognized:true });
  assert.deepEqual(pickIdentity(softAlias), { canonical:'嫩豆腐', category:'soft_tofu', shape_or_cut:'whole', recognized:true });
  assert.deepEqual(pickIdentity(firm), { canonical:'老豆腐', category:'firm_tofu', shape_or_cut:'whole', recognized:true });
  assert.deepEqual(pickIdentity(firmAlias), { canonical:'老豆腐', category:'firm_tofu', shape_or_cut:'whole', recognized:true });

  const [breastAlias, legAlias] = normalizePlannerItems(['鸡胸', '鸡腿'], catalog);
  assert.deepEqual(pickIdentity(breastAlias), { canonical:'鸡肉', category:'chicken', shape_or_cut:'breast', recognized:true });
  assert.deepEqual(pickIdentity(legAlias), { canonical:'鸡肉', category:'chicken', shape_or_cut:'leg', recognized:true });
});

test('planner normalization preserves pork cuts while mapping only generic pork semantics', () => {
  const [tenderloin, tenderloinMeat, porkSlice] = normalizePlannerItems(
    ['猪里脊', '猪里脊肉', '猪肉片'],
    catalog,
  );
  for (const item of [tenderloin, tenderloinMeat]) {
    assert.deepEqual(pickIdentity(item), { canonical:'猪肉', category:'pork', shape_or_cut:'tenderloin', recognized:true });
  }
  assert.deepEqual(pickIdentity(porkSlice), { canonical:'猪肉', category:'pork', shape_or_cut:'slice', recognized:true });
});

test('planner normalization retains unknown and duplicate inputs for explanation', () => {
  const [first, duplicate, unknown] = normalizePlannerItems(
    ['牛里脊', '牛柳', { raw:'火星菜', role:'prefer_use' }],
    catalog,
  );
  assert.equal(first.duplicate_of, null);
  assert.equal(duplicate.canonical, '牛肉');
  assert.equal(duplicate.duplicate_of, '牛里脊');
  assert.deepEqual(unknown, {
    raw: '火星菜', canonical: null, category: null, shape_or_cut: null,
    cook_speed: null, moisture_release: null, texture_behavior: null,
    cooking_risk: 'unknown', recognized: false, role: 'prefer_use', duplicate_of: null,
  });
});

test('planner normalization rejects blank input and makes must_use the duplicate representative', () => {
  assert.throws(
    () => normalizePlannerItems(['  '], catalog),
    error => error?.code === 'invalid_planner_request' && error.message === 'planner item raw must not be blank',
  );
  const [preferFirst, mustSecond] = normalizePlannerItems([
    { raw:'牛柳', role:'prefer_use' },
    { raw:'牛里脊', role:'must_use' },
  ], catalog);
  assert.equal(preferFirst.raw, '牛柳');
  assert.equal(preferFirst.duplicate_of, '牛里脊');
  assert.equal(mustSecond.raw, '牛里脊');
  assert.equal(mustSecond.duplicate_of, null);
});

function pickIdentity(item) {
  return {
    canonical: item.canonical,
    category: item.category,
    shape_or_cut: item.shape_or_cut,
    recognized: item.recognized,
  };
}
