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

test('formal review closes the next exact state-safe rice, aromatic, produce and condiment aliases', () => {
  for (const [id, label, canonicalId] of [
    ['ezhou-sanshanhu-steamed-fish-rice', '新米', 'raw-rice'],
    ['chaoshan-ke-rice', '新大米', 'raw-rice'],
    ['r60-tiger-salmon-rice', '日本短粒米', 'raw-rice'],
    ['guangdong-raw-stir-fried-glutinous-rice', '生糯米', 'raw-glutinous-rice'],
    ['zojirushi-takikomi-gohan-mixed-rice', '短粒或中粒白米', 'raw-rice'],
    ['cookpot-century-egg-pork-congee-704', '姜片', 'ginger-root'],
    ['taiwan-turmeric-chicken-risotto', '蒜末', 'garlic'],
    ['hakka-creative-sweet-potato-rice', '蒜頭', 'garlic'],
    ['kagoshima-ginger-takikomi-gohan', '新姜', 'ginger-root'],
    ['guizhou-tongren-shefan', '野葱', 'scallion'],
    ['healthvermont-one-pot-chicken-brown-rice', '黄洋葱', 'onion'],
    ['sg-healthhub-bubur-lambuk', '大红洋葱', 'onion'],
    ['zojirushi-spicy-basmati-lentil-spinach-rice', '樱桃番茄', 'tomato'],
    ['unl-chicken-rice', 'Roma番茄', 'tomato'],
    ['taiwan-tatung-cabbage-rice', '紅蔥頭', 'shallot'],
    ['maff-tottori-dondoroke-meshi', '三角油豆腐', 'fried-tofu'],
    ['maff-shimane-uzume-meshi', '厚揚げ', 'fried-tofu'],
    ['macau-lettuce-fishball-porridge', '豉油', 'soy-sauce'],
    ['tatung-sesame-shiitake-shio-koji-chicken-rice', '黑麻油', 'sesame-oil'],
    ['hk-choy-sum-scallop-rice', '干瑶柱', 'dried-scallop'],
  ]) assertMapped(id, label, canonicalId);
});
