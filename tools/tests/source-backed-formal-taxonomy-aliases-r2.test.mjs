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

test('formal review closes unambiguous source label aliases without widening ingredient states', () => {
  assertMapped('taiwan-tatung-cabbage-rice', '高麗菜', 'green-cabbage');
  assertMapped('taiwan-tatung-cabbage-rice', '醬油', 'soy-sauce');
  assertMapped('tiger-shirasu-tomato-multigrain-rice', '小番茄', 'tomato');
  assertMapped('tatung-pork-jowl-sesame-rice', '干虾', 'dried-shrimp');
  assertMapped('r58-sharp-matsusaka-pork-mushroom-rice', '麻油', 'sesame-oil');
  assertMapped('instant-pot-spanish-chicken-rice', '橄榄油', 'cooking-oil');
  assertMapped('tiger-chinese-sticky-rice', '干香菇', 'dried-shiitake');
  assertMapped('healthvermont-spinach-carrot-rice-pilaf', '糙米', 'brown-rice');
  assertMapped('healthvermont-spinach-carrot-rice-pilaf', '菠菜', 'spinach');
  assertMapped('tatung-hainan-chicken-rice', '生姜', 'ginger-root');
  assertMapped('tatung-hainan-chicken-rice', '蒜', 'garlic');
  assertMapped('tatung-hainan-chicken-rice', '白葱', 'scallion');
  assertMapped('r61-tiger-dried-shrimp-salted-kelp-brown-rice', '毛豆仁', 'edamame');
  assertMapped('r61-tiger-broad-bean-rice', '蚕豆仁', 'broad-bean');
  assertMapped('tatung-hainan-chicken-rice', '清酒', 'cooking-wine');
  assertMapped('r61-tiger-broad-bean-rice', '淡口酱油', 'soy-sauce');
  assertMapped('r61-tiger-dried-shrimp-salted-kelp-brown-rice', '莲藕', 'lotus-root');
  assertMapped('tiger-chinese-sticky-rice', '五花肉', 'pork-belly');
  assertMapped('healthvermont-spinach-carrot-rice-pilaf', '黄油', 'butter');
  assertMapped('zojirushi-pork-vegetable-rice-el-ns23', '青椒', 'bell-pepper');
  assertMapped('zojirushi-pork-vegetable-rice-el-ns23', '红甜椒', 'bell-pepper');
  assertMapped('r61-tiger-broad-bean-rice', '昆布', 'kombu');
  assertMapped('r61-tiger-broad-bean-rice', '黑芝麻', 'black-sesame');
  assertMapped('r61-tiger-dried-shrimp-salted-kelp-brown-rice', '盐昆布', 'salted-kombu');
});
