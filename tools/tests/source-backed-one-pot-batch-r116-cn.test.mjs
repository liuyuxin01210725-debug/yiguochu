import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  {
    recipeId: 'cn-zhejiang-pinghu-hanjia-miao-wild-rice',
    canonicalName: '韩家庙村野米饭',
    status: 'recipe_fact_checked',
    region: 'CN-ZJ',
    url: 'https://zjsxfj.zj.gov.cn/art/2025/8/21/art_1229857792_58816054.html',
    ingredients: ['春笋', '咸肉', '蚕豆', '野蕈'],
  },
  {
    recipeId: 'cn-chongqing-tujia-gan-nian-he-rice',
    canonicalName: '土家族赶年合饭',
    status: 'recipe_fact_checked',
    region: 'CN-CQ',
    url: 'https://dfz.cq.gov.cn/zqlswh/msmf_417820/202311/t20231102_12510457.html',
    ingredients: ['米', '肉', '花椒', '盐'],
  },
  {
    recipeId: 'cn-xinjiang-karamay-pilaf',
    canonicalName: '克拉玛依抓饭',
    status: 'recipe_fact_checked',
    region: 'CN-XJ',
    url: 'https://hzjl.sh.gov.cn/n1308/20250207/e9892da3af324a398bd570fc1bd089c4.html',
    ingredients: ['米', '胡萝卜', '羊肉'],
  },
  {
    recipeId: 'cn-xinjiang-mulei-chickpea-pilaf',
    canonicalName: '木垒鹰嘴豆抓饭',
    status: 'identity_verified',
    region: 'CN-XJ',
    url: 'https://czt.xinjiang.gov.cn/xjczt/c115019/202508/a56dad9f8a0849e4ba183196263a59ed.shtml',
    ingredients: ['鹰嘴豆'],
  },
  {
    recipeId: 'cn-gansu-baiyin-laba-rice',
    canonicalName: '白银腊八饭',
    status: 'recipe_fact_checked',
    region: 'CN-GS',
    url: 'https://www.baiyin.gov.cn/bmzq/bysbwg/bmyw/art/2025/art_f8884a80ed8b43b5abb2258997a7aba3.html',
    ingredients: ['米饭', '肉臊子', '豆腐', '面条'],
  },
  {
    recipeId: 'cn-shaanxi-northern-jujube-braised-rice',
    canonicalName: '陕北枣焖饭',
    status: 'identity_verified',
    region: 'CN-SN',
    url: 'https://dfz.shaanxi.gov.cn/zslm/sxsq/msfq/201112/t20111216_2620139.html',
    ingredients: [],
  },
  {
    recipeId: 'cn-yunnan-nujiang-lisu-hand-grab-mixed-rice',
    canonicalName: '傈僳族手抓饭·拌饭',
    status: 'identity_verified',
    region: 'CN-YN',
    url: 'https://std.samr.gov.cn/db/search/stdDBDetailed?id=D7B683B23127A476E05397BE0A0A0A45',
    ingredients: [],
  },
];

test('r116 adds seven deduplicated mainland named rice candidates without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r135');
  assert.equal(catalog.recipes.length, 911);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);

  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.ok(recipe, item.recipeId);
    assert.equal(recipe.canonical_name, item.canonicalName, item.recipeId);
    assert.equal(recipe.status, item.status, item.recipeId);
    assert.equal(recipe.identity_status, 'verified', item.recipeId);
    assert.deepEqual(recipe.region_codes, [item.region], item.recipeId);
    assert.ok(recipe.source_refs.some((source) => source.url === item.url), item.recipeId);
    assert.notEqual(recipe.status, 'executable', item.recipeId);
    assert.notEqual(recipe.status, 'preview_ready', item.recipeId);
    assert.equal(recipe.fixed_batch, null, item.recipeId);
    assert.equal(recipe.liquid_contract, null, item.recipeId);
    assert.equal(recipe.time_contract, null, item.recipeId);
    assert.deepEqual(recipe.safety_endpoints, [], item.recipeId);
    assert.equal(recipe.cooker_adaptation.status, 'not_adapted', item.recipeId);
    assert.match(recipe.cooker_adaptation.notes, /不.*电饭煲|不.*電飯煲|未.*电饭煲|未.*電飯煲|来源未.*器具/u, item.recipeId);
    for (const ingredient of item.ingredients) {
      assert.ok(recipe.core_ingredients.includes(ingredient), `${item.recipeId} missing ${ingredient}`);
    }
  }
});

test('r116 keeps process evidence and adjacent-staple boundaries explicit', () => {
  for (const recipeId of [
    'cn-zhejiang-pinghu-hanjia-miao-wild-rice',
    'cn-chongqing-tujia-gan-nian-he-rice',
    'cn-xinjiang-karamay-pilaf',
    'cn-gansu-baiyin-laba-rice',
  ]) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe.cooking_sequence.length > 0, recipeId);
    assert.ok(recipe.source_refs.some((source) => source.claim_scopes.includes('process')), recipeId);
    assert.match(recipe.evidence_notes, /未.*(数量|克重|液体|时间|安全)|不.*电饭煲|相邻主食/u, recipeId);
  }

  const laba = byId.get('cn-gansu-baiyin-laba-rice');
  assert.ok(laba.core_ingredients.includes('面条'));
  assert.match(laba.evidence_notes, /面条|相邻主食/u);
  assert.equal(laba.cooker_adaptation.status, 'not_adapted');

  for (const recipeId of [
    'cn-xinjiang-mulei-chickpea-pilaf',
    'cn-shaanxi-northern-jujube-braised-rice',
    'cn-yunnan-nujiang-lisu-hand-grab-mixed-rice',
  ]) {
    const recipe = byId.get(recipeId);
    assert.deepEqual(recipe.cooking_sequence, [], recipeId);
    assert.match(recipe.evidence_notes, /仅.*(身份|标准)|只.*(身份|标准)|未.*(流程|食材)|缺.*(流程|食材)/u, recipeId);
  }
});

test('r116 source records preserve direct evidence and no invented contracts', () => {
  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    const source = recipe.source_refs.find((candidate) => candidate.url === item.url);
    assert.ok(source, item.recipeId);
    assert.equal(source.access_status, 'opened', item.recipeId);
    assert.ok(Number.isInteger(source.evidence_tier) && source.evidence_tier >= 1 && source.evidence_tier <= 5, item.recipeId);
    assert.ok(source.evidence_locator, item.recipeId);
    assert.ok(source.claim_scopes.includes('identity'), item.recipeId);
    assert.ok(source.claim_scopes.includes('ingredients') || item.ingredients.length === 0, item.recipeId);
    assert.notEqual(source.access_status, 'search_extract_only', item.recipeId);
    assert.notEqual(source.access_status, 'timeout_pending', item.recipeId);
  }
});
