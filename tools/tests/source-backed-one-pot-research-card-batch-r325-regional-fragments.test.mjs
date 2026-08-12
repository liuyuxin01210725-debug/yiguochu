import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

const cases = [
  {
    recipe_id: 'kashgar-nowruz-rice',
    expected: /准备小麦、大麦、玉米、黄米、高粱、豌豆等七种作物颗粒/u,
    sourceProcess: /将上述类别组合做成诺鲁孜饭/u,
  },
  {
    recipe_id: 'cn-quanzhou-nanan-penghua-mustard-rice',
    expected: /选用霜打过的鲜甜清香芥菜/u,
    sourceProcess: /芥菜与喷香软糯的米饭交融/u,
  },
  {
    recipe_id: 'hongdong-steamed-rice',
    expected: /准备黍米或江米作为主料/u,
    sourceProcess: /以黍米或江米制成洪洞蒸饭/u,
  },
  {
    recipe_id: 'cn-shanxi-wuxiang-millet-braised-rice',
    expected: /准备武乡小米/u,
    sourceProcess: /以武乡小米焖制成饭/u,
  },
];

test('r325 adds only source-supported process fragments for four regional identity cards', () => {
  for (const item of cases) {
    const recipe = catalog.recipes.find(row => row.recipe_id === item.recipe_id);
    assert.ok(recipe, item.recipe_id);
    assert.equal(recipe.status, 'identity_verified', item.recipe_id);
    assert.ok(recipe.cooking_sequence.length >= 2, item.recipe_id);
    assert.match(recipe.cooking_sequence[0].instruction, item.expected, item.recipe_id);
    assert.match(recipe.cooking_sequence.at(-1).instruction, item.sourceProcess, item.recipe_id);
    assert.ok(recipe.source_refs.some(source => source.claim_scopes.includes('process')));
    assert.match(recipe.evidence_notes, /不提供|未提供|没有|缺/u);
  }
});

test('r325 keeps quantity, liquid, time and safety contracts empty for fragment-only sources', () => {
  for (const item of cases) {
    const recipe = catalog.recipes.find(row => row.recipe_id === item.recipe_id);
    assert.equal(recipe.fixed_batch, null, item.recipe_id);
    assert.equal(recipe.liquid_contract, null, item.recipe_id);
    assert.equal(recipe.time_contract, null, item.recipe_id);
    assert.deepEqual(recipe.safety_endpoints, [], item.recipe_id);
  }
});
