import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = {
  'tiger-hijiki-brown-rice': {
    appliance_model: 'Tiger电饭煲',
    scale: 'brown_rice',
    mark: 2,
    source_id: 'S-TIGER-HIJI-KI-BROWN-RICE-1',
  },
  'toshiba-mixed-mushroom-ume-rice': {
    appliance_model: 'Toshiba RCP-30R电压力锅',
    scale: 'white_rice',
    mark: 2,
    source_id: 'S-TOSHIBA-MIXED-MUSHROOM-UME-1',
  },
  'toshiba-seafood-paella-rice': {
    appliance_model: 'Toshiba RCP-30R电压力锅',
    scale: 'white_rice',
    mark: 2,
    source_id: 'S-TOSHIBA-SEAFOOD-PAELLA-1',
  },
  'toshiba-bibimbap-mixed-rice': {
    appliance_model: 'Toshiba RCP-30R电压力锅',
    scale: 'white_rice',
    mark: 2,
    source_id: 'S-TOSHIBA-BIBIMBAP-RICE-1',
  },
  'r97-zojirushi-taiwan-brown-cabbage-mixed-rice': {
    appliance_model: '象印台湾压力IH电子锅',
    scale: 'brown_rice',
    mark: 3,
    source_id: 'S-R97-ZOJIRUSHI-TW-BROWN-CABBAGE-MIXED-RICE-1',
  },
  'r98-zojirushi-taiwan-corn-chicken-brown-congee': {
    appliance_model: '象印台湾压力IH电子锅',
    scale: 'porridge',
    mark: 1,
    source_id: 'S-R98-ZOJIRUSHI-TW-CORN-CHICKEN-BROWN-CONGEE-1',
  },
  'r98-panasonic-taiwan-preserved-egg-mushroom-congee': {
    appliance_model: 'Panasonic电子锅',
    scale: 'porridge',
    mark: 1,
    source_id: 'S-R98-PANASONIC-TW-PRESERVED-EGG-MUSHROOM-CONGEE-1',
  },
  'r98-zojirushi-taiwan-wild-mushroom-chicken-mixed-rice': {
    appliance_model: '象印台湾压力IH电子锅',
    scale: 'white_rice',
    mark: 2,
    source_id: 'S-R98-ZOJIRUSHI-TW-WILD-MUSHROOM-CHICKEN-MIXED-RICE-1',
  },
  'panasonic-taiwan-sweet-potato-congee': {
    appliance_model: 'Panasonic SR-PAA100电子锅',
    scale: 'porridge',
    mark: '五分稀饭水位',
    source_id: 'S-PANASONIC-TAIWAN-SWEET-POTATO-CONGEE-1',
  },
};

test('r259 closes nine exact waterline contracts without adding recipes', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  for (const [recipeId, contract] of Object.entries(expected)) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.deepEqual(recipe.liquid_contract, {
      kind: 'waterline',
      waterline: {
        appliance_model: contract.appliance_model,
        scale: contract.scale,
        mark: contract.mark,
      },
      source_ids: [contract.source_id],
    }, recipeId);
    const source = recipe.source_refs.find((item) => item.source_id === contract.source_id);
    assert.ok(source, recipeId);
    assert.ok(source.claim_scopes.includes('liquid'), recipeId);
  }
});

test('r259 preserves source-limited appliance boundaries', () => {
  for (const recipeId of Object.keys(expected)) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe.cooker_adaptation.status, 'source_limited', recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});
