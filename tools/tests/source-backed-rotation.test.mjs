import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  nextSourceRecipe,
  rotatableSourceRecipes,
  sourceRotationRegionPriority,
  sourceRotationLabel,
} from '../lib/source-backed-rotation.mjs';

const shelf = JSON.parse(fs.readFileSync(new URL('../../dist/source-backed-one-pot-shelf.v1.json', import.meta.url), 'utf8'));

test('rotation uses recipe records with fixed quantities and steps, not archive-only records', () => {
  const records = rotatableSourceRecipes(shelf);

  assert.equal(records.length, 234);
  assert.ok(records.every(record => ['A', 'B'].includes(record.shelf)));
  assert.ok(records.every(record => record.fixed_batch?.ingredients?.length));
  assert.ok(records.every(record => record.cooking_sequence?.length));
  assert.ok(records.every(record => !/酸香主食锅|家常焖饭|按食材/u.test(record.canonical_name)));
});

test('rotation preserves original source-backed name and does not create a synthetic title', () => {
  const records = rotatableSourceRecipes(shelf);
  const first = records[0];

  assert.equal(first.canonical_name, '冬菇滑鸡饭');
  assert.equal(sourceRotationLabel(first), '来源菜饭 · 已签署记录');
  assert.equal(nextSourceRecipe(records, first.recipe_id).recipe_id, records[1].recipe_id);
});

test('rotation prioritizes Chinese regional rice meals before Japanese records', () => {
  const records = rotatableSourceRecipes(shelf);
  assert.ok(records.slice(0, 5).every(record => record.region_codes?.some(code => /^CN(?:-|$)/.test(code))));
  assert.ok(sourceRotationRegionPriority(records[0]) < sourceRotationRegionPriority({ region_codes:['JP'] }));
  assert.ok(sourceRotationRegionPriority({ region_codes:['TW'] }) < sourceRotationRegionPriority({ region_codes:['JP'] }));
});

test('rotation wraps to the first source recipe after the last one', () => {
  const records = rotatableSourceRecipes(shelf);
  const last = records.at(-1);

  assert.equal(nextSourceRecipe(records, last.recipe_id).recipe_id, records[0].recipe_id);
});

test('unknown current id starts at the first source recipe', () => {
  const records = rotatableSourceRecipes(shelf);
  assert.equal(nextSourceRecipe(records, 'missing').recipe_id, records[0].recipe_id);
  assert.equal(nextSourceRecipe([], 'missing'), null);
});
