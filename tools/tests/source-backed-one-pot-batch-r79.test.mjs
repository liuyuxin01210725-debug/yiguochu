import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

const expected = [
  ['tiger-gomoku-rice-post43', '五目ごはん（Tiger post43官方版）', 'recipe_fact_checked'],
  ['tiger-crab-miso-rice-post6', 'かに味噌ごはん', 'recipe_fact_checked'],
  ['tiger-canned-curry-takikomi-pilaf', '赤缶カレー炊込みピラフ', 'recipe_fact_checked'],
  ['tiger-seafood-paella-post118', '海鮮炊込みパエリア', 'recipe_fact_checked'],
  ['iris-pc-mb3-takikomi-rice', '炊き込みご飯（Iris PC-MB3-H post35）', 'recipe_fact_checked'],
  ['iris-kpc-ma2-paella-recipe29', 'パエリア（Iris KPC-MA2）', 'recipe_fact_checked'],
  ['iris-kpc-ma2-hainan-chicken-rice', '海南鶏飯（Iris KPC-MA2）', 'recipe_fact_checked'],
  ['panasonic-hk-lap-mei-glutinous-rice', '電飯煲臘味糯米飯', 'recipe_fact_checked'],
  ['nestle-ginger-goji-steamed-chicken-claypot-rice', '薑絲枸杞子蒸雞煲仔飯', 'recipe_fact_checked'],
  ['philips-korean-stone-pot-rice', '韓國石鍋飯', 'recipe_fact_checked'],
  ['tvb-quinoa-chestnut-mushroom-chicken-rice', '藜麥栗子冬菇雞飯', 'recipe_fact_checked'],
  ['tvb-chestnut-chicken-rice', '栗子雞飯', 'recipe_fact_checked'],
  ['knorr-electric-rice-cooker-egg-mushroom-beef-rice', '電飯煲窩蛋香菇牛肉飯', 'recipe_fact_checked'],
  ['taiwan-moa-healthy-brown-rice', '養生糙米飯', 'recipe_fact_checked'],
  ['tvb-octopus-chicken-claypot-rice', '章魚雞粒有味飯', 'recipe_fact_checked'],
  ['shishi-jump-fish-braised-rice', '石狮跳跳鱼焖饭', 'identity_verified'],
  ['fujian-oil-braised-meat-rice', '福建油焖肉饭', 'identity_verified'],
];

test('r79 registers 17 newly sourced named one-pot rice candidates', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r202');
  assert.equal(catalog.recipes.length, 923);
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.equal(recipe?.identity_status, 'verified', recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r79 keeps named recipes distinct and records unresolved appliance/safety boundaries', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  const tiger = byId.get('tiger-gomoku-rice-post43');
  assert.match(tiger.evidence_notes, /型号|不外推/u);
  assert.equal(tiger.liquid_contract.kind, 'waterline');
  assert.equal(tiger.liquid_contract.waterline.mark, 3);

  const nestle = byId.get('nestle-ginger-goji-steamed-chicken-claypot-rice');
  assert.equal(nestle.fixed_batch, null);
  assert.equal(nestle.liquid_contract, null);
  assert.match(nestle.evidence_notes, /熟制|豆腐/u);

  const regional = byId.get('shishi-jump-fish-braised-rice');
  assert.equal(regional.fixed_batch, null);
  assert.equal(regional.cooking_sequence.length, 0);
  assert.match(regional.evidence_notes, /身份|配方/u);
});
