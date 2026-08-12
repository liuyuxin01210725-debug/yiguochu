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

test('formal review closes the next exact aromatic, grain, condiment and broth aliases', () => {
  for (const [id, label, canonicalId] of [
    ['r100-macau-high-fiber-brown-fried-rice', '姜茸', 'ginger-root'],
    ['panasonic-asian-style-takikomi-rice', '长葱', 'scallion'],
    ['maff-miyazaki-hiezushi', '葱叶', 'scallion'],
    ['sg-healthhub-chicken-briyani', '蒜（切碎）', 'garlic'],
    ['r100-hk-garlic-wild-mushroom-stonepot-rice', '蒜蓉', 'garlic'],
    ['maff-hiroshima-mihara-tako-meshi', '精白米', 'raw-rice'],
    ['zojirushi-chicken-dry-curry', '茉莉白米', 'raw-rice'],
    ['hk-golden-seafood-congee', '丝苗白米', 'raw-rice'],
    ['zojirushi-kurigohan-japanese-chestnut-rice', '生栗', 'chestnut'],
    ['maff-kyoto-kuri-gohan', '去皮栗', 'chestnut'],
    ['philips-chicken-vegetable-takikomi-rice', '脫殼栗子', 'chestnut'],
    ['tatung-tongzai-rice-cake', '酱油膏', 'soy-sauce'],
    ['tatung-tongzai-rice-cake', '台湾酱油', 'soy-sauce'],
    ['saito-wakeshiko-torimeshi', '减盐酱油', 'soy-sauce'],
    ['r59-panasonic-taiwan-spanish-seafood-risotto', '紅甜椒', 'bell-pepper'],
    ['panasonic-taiwan-butter-corn-mushroom-rice', '鮮香菇', 'shiitake'],
    ['tatung-taro-shiitake-vegetarian-oil-rice', '小香菇', 'shiitake'],
    ['tatung-salted-squid-corn-rice', '小黄瓜', 'cucumber'],
    ['taiwan-tuna-mushroom-quinoa-rice', '红藜麦', 'quinoa'],
    ['towngas-asparagus-shrimp-quinoa-rice', '多色藜麦', 'quinoa'],
    ['tamu-turkey-burrito-bowl', '冷冻玉米', 'sweet-corn'],
    ['firststeps-turkey-vegetable-pilaf', '冷冻甜玉米', 'sweet-corn'],
    ['r60-tiger-salmon-rice', '日式高汤', 'broth'],
    ['maff-corn-chicken-takikomi-gohan', '鲣鱼高汤', 'broth'],
    ['tiger-clam-tomato-rice', '鸡汤块', 'chicken-broth'],
    ['toshiba-sakuraebi-rice', '鸡汤粉', 'chicken-broth'],
  ]) assertMapped(id, label, canonicalId);
});
