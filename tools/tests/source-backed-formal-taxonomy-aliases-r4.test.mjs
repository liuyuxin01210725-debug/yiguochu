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

test('formal review closes additional explicit source identities without guessing state', () => {
  assertMapped('startsmart-corn-lean-pork-porridge', '瘦肉', 'lean-pork');
  assertMapped('cookpot-taro-chestnut-pork-rice', '栗子', 'chestnut');
  assertMapped('philips-cantonese-cured-rice', '蒜苗', 'garlic-sprout');
  assertMapped('luling-dingpot-rice', '猪油', 'lard');
  assertMapped('tiger-seafood-paella-post118', '藏红花', 'saffron');
  assertMapped('taiwan-fresh-fish-wild-mushroom-rice', '杏鲍菇', 'king-oyster-mushroom');
  assertMapped('tatung-nasi-goreng-style-rice', '番茄酱', 'tomato-sauce');
  assertMapped('philips-corn-quinoa-vegetable-rice', '三色藜麦', 'quinoa');
  assertMapped('tiger-usa-vietnamese-beef-rice', '红葱头', 'shallot');
  assertMapped('cantonese-mushroom-chicken-claypot-rice', '茉莉香米', 'jasmine-rice');
  assertMapped('tefal-pilaf-with-lamb-r200302', '葡萄干', 'raisin');
  assertMapped('panasonic-pilaf-rice-sr-x910e', '白葡萄酒', 'white-wine');
  assertMapped('instant-pot-spinach-chickpea-rice', '印度香米', 'basmati-rice');
  assertMapped('tatung-tomato-pumpkin-rice', '培根', 'bacon');
  assertMapped('panasonic-my-century-egg-chicken-congee', '皮蛋', 'preserved-egg');
  assertMapped('panasonic-khao-man-gai-nf-ac1000', '鱼露', 'fish-sauce');
  assertMapped('maff-tokyo-fukagawa-meshi', '熟饭', 'cooked-rice');
});
