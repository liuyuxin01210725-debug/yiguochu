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

test('formal review closes the seventh batch of state-safe regional and appliance aliases', () => {
  assertMapped('dongguan-daojiao-hehua-carp-rice', '冬菇', 'dried-shiitake');
  assertMapped('xiangxi-she-rice', '粘米', 'raw-rice');
  assertMapped('taiwan-turmeric-chicken-risotto', '洋蔥', 'onion');
  assertMapped('philips-chicken-vegetable-takikomi-rice', '鹽', 'salt');
  assertMapped('taiwan-bottle-gourd-mushroom-rice', '胡蘿蔔', 'carrot');
  assertMapped('toshiba-seafood-paella-rice', '彩椒', 'bell-pepper');
  assertMapped('toshiba-bibimbap-mixed-rice', '牛肉薄片', 'beef-generic');
  assertMapped('panasonic-biryani-style-takikomi-rice', '鸡翅根', 'chicken-generic');
  assertMapped('hakka-creative-sweet-potato-rice', '蔥', 'scallion');
  assertMapped('panasonic-kanagawa-shirasu-ume-rice', '油揚げ', 'fried-tofu');
});
