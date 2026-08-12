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

function assertSeasoningIgnored(id, sourceLabel) {
  const row = review.records.find(item => item.recipe_id === id);
  assert.ok(row, `missing review row: ${id}`);
  assert.ok(row.taxonomy_mapping.seasoning_ignored.some(item => item.source_label === sourceLabel), `${id} should ignore ${sourceLabel}`);
  assert.ok(!row.taxonomy_mapping.missing.includes(sourceLabel), `${id} should not keep ${sourceLabel} missing`);
}

test('formal review closes exact meat, broth, kelp and octopus labels', () => {
  for (const [id, label, canonicalId] of [
    ['panasonic-taiwan-chicken-curry-rice', '去骨鸡腿', 'chicken-leg'],
    ['cookpot-salted-mackerel-chicken-claypot-rice', '雞胸肉', 'chicken-breast'],
    ['panasonic-okinawa-jyushi', '猪五花肉（块）', 'pork-belly'],
    ['yangxin-spring-lake-fish-rice', '鱼汤', 'broth'],
    ['tiger-usa-asparagus-mushroom-risotto', '蔬菜汤', 'broth'],
    ['maff-irogohan-nara', '出汁昆布', 'kombu'],
    ['maff-ehime-shoyu-meshi', '酒（调味料A）', 'cooking-wine'],
    ['maff-ehime-shoyu-meshi', '酒（调味料B）', 'cooking-wine'],
    ['jp-mie-tako-meshi', '生章鱼', 'octopus'],
    ['sg-healthhub-bubur-lambuk', '瘦牛肉末', 'beef-ground'],
  ]) assertMapped(id, label, canonicalId);
});

test('formal review treats the explicit turmeric powder label as seasoning', () => {
  assertSeasoningIgnored('taiwan-turmeric-chicken-risotto', '薑黃粉');
});
