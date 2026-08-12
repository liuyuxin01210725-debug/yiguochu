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

test('formal review closes only exact or controlled aliases for source-complete candidates', () => {
  assertMapped('philips-cantonese-cured-rice', '港式腊肠', 'chinese-sausage');
  assertMapped('toshiba-mixed-chicken-bamboo-rice-rc-dr18t', '水煮竹笋', 'bamboo-shoot');
  assertMapped('toshiba-mixed-chicken-bamboo-rice-rc-dr18t', '鸡脯肉', 'chicken-breast');
  assertMapped('zojirushi-pork-vegetable-rice-el-ns23', '酒', 'cooking-wine');
  assertMapped('panasonic-nf-pc400-takikomi-rice', '日式颗粒高汤', 'broth');
  assertMapped('zojirushi-okayama-ebimeshi-el-ns23', '有头虾', 'shrimp');
  assertMapped('tatung-beef-burdock-takikomi-rice', '牛肉薄切り', 'beef-generic');
  assertMapped('r58-sharp-matsusaka-pork-mushroom-rice', '金針菇', 'enoki-mushroom');
  assertMapped('instant-pot-chicken-enchilada-rice', '中粒白米', 'raw-rice');
  assertMapped('ca-health-multigrain-congee', '冷水', 'water');
  assertMapped('au-slhd-oven-baked-biryani', '低盐鸡汤', 'chicken-broth');
});
