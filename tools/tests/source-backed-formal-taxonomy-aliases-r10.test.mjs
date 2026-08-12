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

test('formal review maps exact raw ingredient and broth aliases without changing quantities', () => {
  for (const [id, label, canonicalId] of [
    ['r61-tiger-easy-khao-man-gai', '蒜泥', 'garlic'],
    ['tatung-kumamoto-ebimeshi', '温水', 'water'],
    ['r60-tiger-takeout-vegetable-fried-rice', '生白米', 'raw-rice'],
    ['tatung-tuna-garlic-butter-rice', '免洗米', 'raw-rice'],
    ['cuckoo-abalone-pot-rice', '短粒米', 'raw-rice'],
    ['r61-tiger-chestnut-brown-rice', '去皮栗子', 'chestnut'],
    ['r61-tiger-easy-khao-man-gai', '姜泥', 'ginger-root'],
    ['r61-tiger-easy-khao-man-gai', '葱绿', 'scallion'],
    ['r58-cookpot-corn-rice-beef-meatballs', '洋蔥末', 'onion'],
    ['hk-taro-shrimp-multigrain-steamed-rice', '鲜虾', 'shrimp'],
    ['tefal-saffron-rice-seafood', '鱼高汤', 'broth'],
    ['maff-tokushima-omiisan', 'だし汁', 'broth'],
  ]) assertMapped(id, label, canonicalId);
});
