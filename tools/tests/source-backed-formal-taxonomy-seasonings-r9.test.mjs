import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const review = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-candidate-review.v1.json', import.meta.url), 'utf8'));

function assertSeasoningIgnored(id, label) {
  const row = review.records.find(item => item.recipe_id === id);
  assert.ok(row, `missing review row: ${id}`);
  assert.ok(
    row.taxonomy_mapping.seasoning_ignored.some(item => item.source_label === label),
    `${id} should explicitly classify ${label} as a controlled small-use seasoning`,
  );
  assert.ok(!row.taxonomy_mapping.missing.includes(label), `${id} should not keep ${label} missing`);
}

test('formal review explicitly excludes only unambiguous small-use seasonings from core taxonomy', () => {
  assertSeasoningIgnored('cantonese-cured-meat-claypot-rice', '白胡椒');
  assertSeasoningIgnored('tiger-usa-keema-curry-chickpeas', '咖喱粉');
  assertSeasoningIgnored('taiwan-cabbage-rice', '五香粉');
  assertSeasoningIgnored('illinois-texas-hash', '辣椒粉');
  assertSeasoningIgnored('panasonic-khao-man-gai-nf-ac1000', '胡椒');
});

test('formal review does not silently ignore nutrition-bearing seasonings', () => {
  const row = review.records.find(item => item.recipe_id === 'philips-cantonese-cured-rice');
  assert.ok(row);
  for (const label of ['食用油', '酱油', '糖']) {
    assert.ok(!row.taxonomy_mapping.seasoning_ignored.some(item => item.source_label === label));
  }
});
