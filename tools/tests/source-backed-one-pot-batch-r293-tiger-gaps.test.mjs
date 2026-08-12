import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

test('r293 closes two same-source Tiger contracts without adding canonical recipes', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);

  const soup = byId['tiger-edamame-carrot-rice-soup'];
  assert.ok(soup);
  assert.equal(soup.time_contract?.total_minutes, 70);
  assert.deepEqual(soup.time_contract?.source_ids, ['S-TIGER-EDAMAME-CARROT-RICE-SOUP-R65']);
  assert.equal(soup.status, 'recipe_fact_checked');

  const friedRice = byId['r60-tiger-takeout-vegetable-fried-rice'];
  assert.ok(friedRice);
  assert.deepEqual(friedRice.liquid_contract, {
    kind: 'added_stock',
    amount: { value: 1.75, unit: 'cups' },
    source_ids: ['S-TIGER-TAKEOUT-VEGETABLE-FRIED-RICE-R60'],
  });
  assert.equal(friedRice.status, 'recipe_fact_checked');
});

test('r293 does not compress staged or ranged time clues into contracts', () => {
  assert.equal(byId['tiger-spinach-chickpea-curry-rice']?.time_contract, null);
  assert.equal(byId['tiger-usa-asparagus-mushroom-risotto']?.time_contract?.total_minutes, 75);
  assert.deepEqual(byId['tiger-usa-asparagus-mushroom-risotto']?.time_contract?.source_ids, ['S-TIGER-USA-ASPARAGUS-MUSHROOM-RISOTTO-1']);
  assert.equal(byId['instant-pot-quick-chicken-steamed-rice']?.time_contract, null);
});
