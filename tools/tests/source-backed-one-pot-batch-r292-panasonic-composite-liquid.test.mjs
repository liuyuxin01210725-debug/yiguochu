import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('r292 records Panasonic MY layered liquid objects with the closed source process', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  const recipe = catalog.recipes.find(item => item.recipe_id === 'panasonic-my-chicken-pumpkin-lotus-mixed-rice');
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.liquid_contract, {
    kind: 'composite_liquid',
    amount: { value: 3, unit: '杯（鲣鱼高汤；另加水100mL）' },
    components: [
      { name: '鲣鱼高汤', amount: { value: 3, unit: '杯' }, source_ids: ['S-PANASONIC-MY-CHICKEN-PUMPKIN-LOTUS-MIXED-RICE-1'] },
      { name: '水', amount: { value: 100, unit: 'mL' }, source_ids: ['S-PANASONIC-MY-CHICKEN-PUMPKIN-LOTUS-MIXED-RICE-1'] },
    ],
    source_ids: ['S-PANASONIC-MY-CHICKEN-PUMPKIN-LOTUS-MIXED-RICE-1'],
  });
  assert.equal(recipe.cooking_sequence.length, 4);
  assert.match(recipe.evidence_notes, /100mL|3杯|Brown Rice|四步/u);
});
