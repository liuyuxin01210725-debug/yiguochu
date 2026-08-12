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

test('formal review closes only state-safe aliases from the eighth taxonomy batch', () => {
  assertMapped('cantonese-mushroom-chicken-claypot-rice', '干冬菇', 'dried-shiitake');
  assertMapped('cantonese-mushroom-chicken-claypot-rice', '去骨去皮鸡腿肉', 'chicken-leg');
  assertMapped('cantonese-mushroom-chicken-claypot-rice', '绍兴酒', 'cooking-wine');
  assertMapped('cantonese-mushroom-chicken-claypot-rice', '盐（腌料）', 'salt');
  assertMapped('cantonese-mushroom-chicken-claypot-rice', '盐（米饭）', 'salt');
  assertMapped('zojirushi-minced-pork-greens-rice-nl-erh', '猪肉糜', 'ground-pork');
  assertMapped('shanghai-broad-bean-vegetable-rice', '牛心菜', 'green-cabbage');
  assertMapped('quanzhou-radish-rice', '海蛎', 'oyster');
  assertMapped('yunnan-shidian-pea-potato-ham-rice', '青豌豆仁', 'green-peas');
  assertMapped('taiwan-tongzai-rice-cake', '长糯米', 'raw-glutinous-rice');
  assertMapped('yangzhou-standard-fried-rice', '鲜鸡蛋', 'egg');
  assertMapped('meixian-shisan-fish-braised-rice', '姜丝', 'ginger-root');
  assertMapped('mayang-she-rice', '大蒜苗', 'garlic-sprout');
  assertMapped('wuan-lamb-millet-braised-rice', '大葱', 'scallion');
  assertMapped('jixi-bamboo-shoot-braised-rice', '春笋', 'bamboo-shoot');
  assertMapped('shanghai-spring-bamboo-cured-meat-rice', '雷笋', 'bamboo-shoot');
  assertMapped('yangzhou-standard-fried-rice', '净鲜笋', 'bamboo-shoot');
  assertMapped('quanzhou-red-xun-rice', '小干贝', 'dried-scallop');
});
