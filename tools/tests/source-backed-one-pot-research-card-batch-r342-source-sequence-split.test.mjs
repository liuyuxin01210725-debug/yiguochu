import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

const EXPECTED = {
  'huairou-lianqiaofan': [/收集小米、玉米、肉、冻豆腐和萝卜干/u, /大锅中制作百家饭/u, /架锅、烧火、洗菜、切菜/u, /炖肉、蒸米饭/u],
  'nanjing-aijiaohuang-rice': [/矮脚黄青菜与咸肉片、香肠片或板鸭丁/u, /剁入生姜粒/u, /与糯米一起煮/u, /青菜和米饭一起翻炒/u],
  'hubei-enshi-shefan': [/腊肉丁、豆干丁和蒜苗/u, /浸泡过的糯米/u, /搅拌均匀/u, /上甑蒸熟/u],
  'lianyuan-bamboo-rice': [/粳米或糯米为主料/u, /配腊肉、红枣装入竹筒/u, /温火上慢慢翻烤/u, /约二十分钟后取食/u],
  'fujian-beef-mustard-greens-rice': [/盖菜可先焯水/u, /减轻苦味/u, /盖菜可与米饭同煮/u, /福建咸饭或焖煮类家常吃法/u],
  'shexian-millet-braised-rice': [/白菜或茄子等时菜炒在锅里/u, /放入小米、盐和水一齐焖熟/u, /纯小米焖饭可配炒胡萝卜条/u, /土豆丝、野韭花或农家酸菜/u],
  'zhuji-pea-salted-pork-rice': [/新鲜豌豆现剥/u, /备好咸肉和糯米/u, /豌豆、咸肉和糯米入油锅/u, /混合炒制/u],
  'xiushan-she-rice': [/大米、糯米煮熟/u, /煮熟的米饭/u, /腊肉、蒿菜和野葱/u, /拌入/u],
  'southeast-chongqing-tujia-he-rice': [/肉宰成坨/u, /花椒、盐等作料调味/u, /一层米一层肉/u, /蒸熟即成合饭/u],
  'chaoshan-ge-rice': [/潮汕肉卷用油炸或炒制/u, /猪肉粒、玉米、香菇等配菜炒香/u, /拌入新鲜煮熟的米饭/u, /米饭/u],
};

test('r342 splits ten compact source sequences without adding estimated facts', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  for (const [recipeId, patterns] of Object.entries(EXPECTED)) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.cooking_sequence.length, 4, `${recipeId} should expose four source steps`);
    const instructions = recipe.cooking_sequence.map(step => step.instruction).join(' ');
    for (const pattern of patterns) assert.match(instructions, pattern, `${recipeId} lost ${pattern}`);
    assert.ok(recipe.cooking_sequence.every(step => Array.isArray(step.source_ids) && step.source_ids.length > 0), `${recipeId} has an untraceable split step`);
  }
});
