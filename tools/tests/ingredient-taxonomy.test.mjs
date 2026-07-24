import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertIngredientTaxonomy,
  validateIngredientTaxonomy,
} from '../lib/ingredient-taxonomy-validator.mjs';
import { normalizePlannerItems } from '../../worker/src/planner-v2.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(fs.readFileSync(
  path.join(here, '../data/ingredient-taxonomy.v1.json'),
  'utf8',
));

test('taxonomy is versioned, unique, and covers the first planner vocabulary', () => {
  assert.equal(catalog.taxonomy_version, 'taxonomy-v1-20260724');
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
    '金针菇', '香菇', '水', '食用油', '盐', '酱油',
  ]) assert.ok(names.has(name), `missing ${name}`);
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
  assert.ok(errors.some(error => error.includes('duplicate alias')));
  assert.ok(errors.some(error => error.includes('cooking_risk')));
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

function pickIdentity(item) {
  return {
    canonical: item.canonical,
    category: item.category,
    shape_or_cut: item.shape_or_cut,
    recognized: item.recognized,
  };
}
