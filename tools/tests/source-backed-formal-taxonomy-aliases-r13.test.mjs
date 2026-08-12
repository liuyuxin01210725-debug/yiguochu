import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const review = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-candidate-review.v1.json', import.meta.url), 'utf8'));

function rowFor(id) {
  const row = review.records.find(item => item.recipe_id === id);
  assert.ok(row, `missing review row: ${id}`);
  return row;
}

function assertMapped(id, sourceLabel, canonicalId) {
  const row = rowFor(id);
  assert.ok(
    row.taxonomy_mapping.matched.some(item => item.source_label === sourceLabel && item.canonical_id === canonicalId),
    `${id} should map ${sourceLabel} to ${canonicalId}`,
  );
  assert.ok(!row.taxonomy_mapping.missing.includes(sourceLabel), `${id} should not keep ${sourceLabel} missing`);
}

function assertSeasoningIgnored(id, sourceLabel) {
  const row = rowFor(id);
  assert.ok(
    row.taxonomy_mapping.seasoning_ignored.some(item => item.source_label === sourceLabel),
    `${id} should treat ${sourceLabel} as a small-use seasoning`,
  );
  assert.ok(!row.taxonomy_mapping.missing.includes(sourceLabel), `${id} should not keep ${sourceLabel} missing`);
}

test('formal review closes exact protein, liquid, aromatic and condiment labels', () => {
  for (const [id, label, canonicalId] of [
    ['panasonic-hiroshima-oyster-lemon-paella', '虾', 'shrimp'],
    ['maff-oita-amimeshi', '干虾米', 'dried-shrimp'],
    ['taiwan-mushroom-bamboo-shoot-rice', '金钩虾', 'dried-shrimp'],
    ['maff-saga-tsugani-meshi', '浓口酱油', 'soy-sauce'],
    ['sg-healthhub-chicken-briyani', '低钠盐', 'salt'],
    ['sg-healthhub-bubur-lambuk', '主锅水', 'water'],
    ['sg-healthhub-bubur-lambuk', '香料糊用水', 'water'],
    ['xiangjiangyuan-bamboo-rice', '猪肉末', 'ground-pork'],
    ['taishan-shixialuo-rice', '猪肉粒', 'pork-generic'],
    ['shanghai-broad-bean-vegetable-rice', '猪肉丁', 'pork-generic'],
    ['sg-healthhub-chicken-briyani', '鸡肉（切块）', 'chicken-generic'],
    ['instant-pot-one-pot-chicken-brown-rice', '去骨鸡肉', 'chicken-generic'],
    ['hk-yam-longan-chicken-claypot-rice', '鸡柳', 'chicken-breast'],
    ['ntuh-low-sodium-spanish-paella-rice', '鸡里肌肉', 'chicken-breast'],
    ['panasonic-taiwan-spanish-seafood-risotto-breadmaker', '鸡腿排', 'chicken-leg'],
    ['panasonic-taiwan-salmon-daikon-golden-rice', '蔥花', 'scallion'],
    ['sg-healthhub-chicken-briyani', '嫩姜（磨碎）', 'ginger-root'],
    ['sg-healthhub-chicken-briyani', '嫩姜（切片）', 'ginger-root'],
    ['sg-healthhub-bubur-lambuk', '配食葱花', 'scallion'],
  ]) assertMapped(id, label, canonicalId);
});

test('formal review keeps explicit herbs and spices out of nutrition blockers', () => {
  for (const [id, label] of [
    ['sg-healthhub-chicken-briyani', '芫荽（切碎）'],
    ['sg-healthhub-chicken-briyani', '新鲜薄荷'],
    ['sg-healthhub-chicken-briyani', '八角'],
    ['sg-healthhub-chicken-briyani', '肉桂'],
    ['sg-healthhub-chicken-briyani', '丁香'],
    ['sg-healthhub-chicken-briyani', '绿色小豆蔻'],
    ['sg-healthhub-chicken-briyani', '绿色小豆蔻（米饭用）'],
    ['sg-healthhub-chicken-briyani', '茴香粉'],
    ['sg-healthhub-bubur-lambuk', '孜然粉'],
    ['sg-healthhub-bubur-lambuk', '芫荽粉'],
    ['sg-healthhub-bubur-lambuk', '豆蔻'],
    ['sg-healthhub-bubur-lambuk', '黑胡椒粒'],
    ['sg-healthhub-bubur-lambuk', '香茅'],
    ['cu-caribbean-jerk-chicken-rice', '香叶'],
    ['tiger-clam-tomato-rice', '罗勒'],
  ]) assertSeasoningIgnored(id, label);
});
