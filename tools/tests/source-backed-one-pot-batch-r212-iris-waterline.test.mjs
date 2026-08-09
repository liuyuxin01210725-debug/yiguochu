import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

test('r212 closes IRIS RC-PGA50 porridge waterline', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r242');
  const recipe = byId['iris-chinese-chicken-congee'];
  assert.deepEqual(recipe.liquid_contract, {
    kind: 'waterline',
    waterline: { appliance_model: 'IRIS OHYAMA RC-PGA50', scale: 'porridge', mark: 1 },
    source_ids: ['S-IRIS-CHINESE-CHICKEN-CONGEE-1'],
  });
});

test('r212 closes IRIS RC-PGA50 paella white-rice waterline', () => {
  const recipe = byId['iris-rc-pga-paella'];
  assert.equal(recipe.liquid_contract.waterline.appliance_model, 'IRIS OHYAMA RC-PGA50');
  assert.equal(recipe.liquid_contract.waterline.scale, 'white_rice');
  assert.equal(recipe.liquid_contract.waterline.mark, 1.5);
  assert.deepEqual(recipe.liquid_contract.source_ids, ['S-IRIS-RC-PGA-PAELLA-1']);
});

test('r212 closes IRIS RC-PGA50 chicken-rice white-rice waterline', () => {
  const recipe = byId['iris-rc-pga-chicken-rice'];
  assert.equal(recipe.liquid_contract.waterline.appliance_model, 'IRIS OHYAMA RC-PGA50');
  assert.equal(recipe.liquid_contract.waterline.scale, 'white_rice');
  assert.equal(recipe.liquid_contract.waterline.mark, 2);
  assert.deepEqual(recipe.liquid_contract.source_ids, ['S-IRIS-RC-PGA-CHICKEN-RICE-1']);
});
