import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const review = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-candidate-review.v1.json', import.meta.url), 'utf8'));

function row(id) {
  const record = review.records.find(item => item.recipe_id === id);
  assert.ok(record, `missing review row: ${id}`);
  return record;
}

function assertMapped(id, sourceLabel, canonicalId) {
  const record = row(id);
  assert.ok(
    record.taxonomy_mapping.matched.some(item => item.source_label === sourceLabel && item.canonical_id === canonicalId),
    `${id} should map ${sourceLabel} to ${canonicalId}`,
  );
  assert.ok(!record.taxonomy_mapping.missing.includes(sourceLabel), `${id} should not keep ${sourceLabel} missing`);
}

test('formal review closes state-safe household aliases without collapsing ambiguous states', () => {
  assertMapped('panasonic-nf-pc400-takikomi-rice', '油豆腐', 'fried-tofu');
  assertMapped('panasonic-yamagata-imoni-takikomi-rice', '砂糖', 'sugar');
  assertMapped('maff-fukui-chameshi', '粳米', 'raw-rice');
  assertMapped('maff-ehime-shoyu-meshi', '魔芋', 'konjac');
  assertMapped('hk-pumpkin-taro-chicken-claypot-rice', '芋头', 'taro');
  assertMapped('r100-hk-scallop-egg-braised-rice', '瑶柱', 'dried-scallop');
  assertMapped('maff-kagawa-iriko-meshi', '白萝卜', 'daikon');
  assertMapped('zojirushi-new-orleans-red-beans-rice', '鸡汤', 'chicken-broth');
  assertMapped('panasonic-tokyo-fukagawa-meshi', '蛤蜊', 'clam');
  assertMapped('panasonic-hyogo-tako-meshi', '章鱼', 'octopus');
  assertMapped('panasonic-oyster-negi-takikomi-rice', '牡蛎', 'oyster');
  assertMapped('cookpot-gomoku-mixed-rice', '鴻喜菇', 'shimeji-mushroom');
  assertMapped('tatung-paella-style-seafood-rice', '鱿鱼', 'squid');
  assertMapped('maff-miyagi-harako-meshi', '鲑鱼', 'salmon');
  assertMapped('tiger-chinese-sticky-rice', '五花肉', 'pork-belly');
  assertMapped('tiger-chinese-sticky-rice', '五花肉', 'pork-belly');
  assertMapped('zojirushi-brown-rice-ih-pot', '玄米', 'brown-rice');
  assertMapped('zojirushi-black-rice-ih-pot', '黑米', 'black-rice');
  assertMapped('startsmart-three-bean-egg-tofu-red-rice', '红米', 'red-rice');
  assertMapped('zhuji-pea-salted-pork-rice', '豌豆', 'green-peas');
  assertMapped('cookpot-gomoku-mixed-rice', '紅蘿蔔', 'carrot');
  assertMapped('zojirushi-new-orleans-red-beans-rice', '长粒白米', 'raw-rice');
});
