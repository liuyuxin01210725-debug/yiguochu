import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const review = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-candidate-review.v1.json', import.meta.url), 'utf8'));

function assertMapped(id, sourceLabel, canonicalId) {
  const record = review.records.find(item => item.recipe_id === id);
  assert.ok(record, `missing review row: ${id}`);
  assert.ok(
    record.taxonomy_mapping.matched.some(item => item.source_label === sourceLabel && item.canonical_id === canonicalId),
    `${id} should map ${sourceLabel} to ${canonicalId}`,
  );
  assert.ok(!record.taxonomy_mapping.missing.includes(sourceLabel), `${id} should not keep ${sourceLabel} missing`);
}

test('formal review closes only unambiguous ingredient-form aliases in the sixth alias batch', () => {
  assertMapped('instant-pot-chicken-satay-rice', '油', 'cooking-oil');
  assertMapped('instant-pot-chicken-satay-rice', '冷冻四季豆', 'green-beans');
  assertMapped('instant-pot-spanish-chicken-rice', '冷冻豌豆', 'green-peas');
  assertMapped('tatung-pork-jowl-sesame-rice', '干虾', 'dried-shrimp');
  assertMapped('panasonic-nf-pc400-takikomi-rice', '油豆腐', 'fried-tofu');
});
