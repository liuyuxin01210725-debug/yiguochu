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

test('formal review maps explicit mushroom-family labels to the existing generic mushroom taxonomy', () => {
  for (const [id, label] of [
    ['taiwan-provencal-mushroom-chicken-risotto', '混合菇'],
    ['toshiba-mixed-mushroom-ume-rice', '混合蘑菇'],
    ['tiger-salmon-mushroom-rice-pilaf', '菌菇'],
    ['tiger-pork-napa-mille-feuille-mushroom-rice', '菌菇'],
    ['cleveland-clinic-chicken-brown-rice-casserole', '菌菇'],
    ['tiger-beef-matsutake-rice', '松茸'],
  ]) assertMapped(id, label, 'mushroom-generic');
});
