import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const review = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-candidate-review.v1.json', import.meta.url), 'utf8'));

function assertMapped(id, sourceLabel, canonicalId) {
  const row = review.records.find(item => item.recipe_id === id);
  assert.ok(row, `missing review row: ${id}`);
  assert.ok(
    row.taxonomy_mapping.matched.some(item => item.source_label === sourceLabel && item.canonical_id === canonicalId),
    `${id} should map ${sourceLabel} to ${canonicalId}`,
  );
  assert.ok(!row.taxonomy_mapping.missing.includes(sourceLabel), `${id} should not keep ${sourceLabel} missing`);
}

test('formal review maps explicit named mushroom varieties to the existing generic mushroom taxonomy', () => {
  for (const [id, label] of [
    ['hk-hiroshima-oyster-mushroom-claypot-rice', '杂菇'],
    ['hk-tomato-mushroom-chicken-rice', '杂菇'],
    ['r58-panasonic-salmon-edamame-rice', '综合菇'],
    ['tvb-chestnut-chicken-rice', '白蘑菇'],
    ['philips-multigrain-baked-chicken-rice', '波特贝罗蘑菇'],
    ['panasonic-nagano-salmon-nameko-rice', '滑子菇'],
    ['jinning-boletus-braised-rice', '牛肝菌'],
    ['r59-panasonic-taiwan-porcini-lobster-risotto', '牛肝菌'],
    ['r100-hk-garlic-wild-mushroom-stonepot-rice', '白菌与灵芝菇'],
    ['macau-scallop-mushroom-vegetable-rice', '磨菇'],
    ['r100-hk-pumpkin-seafood-brown-rice', '秀珍菇'],
    ['ntuh-salmon-mixed-mushroom-rice', '美白菇'],
    ['panasonic-taiwan-mushroom-vegetable-oil-shallot-rice', '美白菇'],
  ]) assertMapped(id, label, 'mushroom-generic');
});
