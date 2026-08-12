import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { classifySourceBackedRecipe } from '../lib/source-backed-shelf.mjs';

const page = fs.readFileSync(new URL('../../source-recipes.html', import.meta.url), 'utf8');

test('r305 labels identity-only cards as usable research starts rather than read-only blanks', () => {
  const record = classifySourceBackedRecipe({
    recipe_id: 'fixture-identity-card',
    canonical_name: '身份来源饭',
    status: 'identity_verified',
    core_ingredients: [],
    fixed_batch: null,
    liquid_contract: null,
    cooking_sequence: [],
    time_contract: null,
    safety_endpoints: [],
    source_refs: [],
  });
  assert.equal(record.shelf, 'C');
  assert.equal(record.shelf_label, 'C · 研究起步架（来源字段待补）');
});

test('r305 distinguishes identity-source drafts from empty cards in the visible page labels', () => {
  assert.match(page, /研究起步草案（来源只确认身份）/u);
  assert.match(page, /研究起步架（来源字段待补）/u);
  assert.match(page, /以下是为了让你能先做起来的研究版补全/u);
});
