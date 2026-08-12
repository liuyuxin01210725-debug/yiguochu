import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

const expected = {
  'shizhu-tujia-potato-rice': {
    sourceId: 'S-CQ-SHIZHU-TUJIA-POTATO-RICE-IDENTITY-1',
    instruction: '将石柱高山洋芋与颗粒分明的新米同锅焖煮，形成洋芋饭。',
  },
  'ningshan-liangcanzi-dry-rice': {
    sourceId: 'S-SN-NINGSHAN-LIANGCANZI-R62',
    instruction: '苞谷磨成米后先煮，接近熟时加入大米继续蒸熟，称为两参子干饭。',
  },
  'r99-chikan-oil-salt-rice': {
    sourceId: 'S-R99-GD-KAIPING-CHIKAN-OIL-SALT-RICE-1',
    instruction: '米浸泡约2小时后入煲，大火煮沸再转中火收水，七成熟时放入配料，熄火后利用余温焗约5分钟。',
  },
  'huoqiu-haozi-guoba-rice': {
    sourceId: 'S-R77-HUOQIU-HAOZI-GUOBA',
    instruction: '蒿子与米同锅制作菜干饭，并形成蒿香锅巴。',
  },
  'r103-cn-guangxi-sanjiang-dong-nuomi-fan': {
    sourceId: 'S-R103-CN-SANJIANG-DONG-NUOMI-FAN-1',
    instruction: '侗族糯饭按来源使用木甑蒸熟，并作为日常主食储存食用。',
  },
};

test('r256 records only the process facts directly stated for five identity-only entries', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  for (const [recipeId, expectedStep] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'identity_verified', recipeId);
    assert.equal(recipe.fixed_batch, null, recipeId);
    assert.equal(recipe.liquid_contract, null, recipeId);
    assert.equal(recipe.time_contract, null, recipeId);
    assert.deepEqual(recipe.cooking_sequence, [{ step: 1, instruction: expectedStep.instruction, source_ids: [expectedStep.sourceId] }], recipeId);
  }
});

test('r256 keeps unsupported execution fields empty', () => {
  for (const recipeId of Object.keys(expected)) {
    const recipe = byId[recipeId];
    assert.deepEqual(recipe.safety_endpoints, [], recipeId);
    assert.equal(recipe.cooker_adaptation?.status, 'not_adapted', recipeId);
  }
});
