import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  nextSourceRecipe,
  rotatableSourceRecipes,
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

  assert.equal(first.canonical_name, '〖愛媛県ご当地メニュー〗鯛めし');
  assert.equal(sourceRotationLabel(first), '来源菜饭 · 试做架');
  assert.equal(nextSourceRecipe(records, first.recipe_id).recipe_id, records[1].recipe_id);
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
