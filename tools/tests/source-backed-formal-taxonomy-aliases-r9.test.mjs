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

test('formal review adds only exact state-safe sugar and broth aliases', () => {
  assertMapped('tatung-tongzai-rice-cake', '冰糖', 'sugar');
  assertMapped('yulin-laba-braised-rice', '红糖', 'sugar');
  assertMapped('maff-saga-tsugani-meshi', '出汁', 'broth');
  assertMapped('panasonic-taiwan-scallop-five-color-rice', '柴鱼高汤', 'broth');
  assertMapped('panasonic-nagasaki-yudeboshi-daikon-rice', '白だし', 'broth');
});

test('formal review does not broaden ambiguous protein or produce labels through aliases', () => {
  for (const [id, label] of [
    ['maff-kanagawa-narachameshi', '炒大豆'],
    ['tiger-usa-keema-curry-chickpeas', '鹰嘴豆'],
    ['maff-aichi-kiinai-okowa', '黑豆'],
  ]) {
    const row = review.records.find(item => item.recipe_id === id);
    assert.ok(row);
    assert.ok(row.taxonomy_mapping.missing.includes(label), `${id} should keep ambiguous ${label} missing`);
  }
});
