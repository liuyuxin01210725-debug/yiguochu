import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const corpus = JSON.parse(fs.readFileSync(
  new URL('../data/recipe-regression.json', import.meta.url),
  'utf8',
));
const library = JSON.parse(fs.readFileSync(
  new URL('../data/recipe-library.json', import.meta.url),
  'utf8',
));
const reviewSheet = fs.readFileSync(
  new URL('../../docs/recipe-validation-review.md', import.meta.url),
  'utf8',
);

const NEW_FAMILY_REPRESENTATIVES = [
  ['family-jiangnan-vegetable-rice', 'shanghai-salted-pork-vegetable-rice'],
  ['family-southern-savory-rice', 'taiwan-cabbage-mushroom-rice'],
  ['family-covered-pot-rice', 'cantonese-cured-meat-claypot-rice'],
  ['family-northwest-grain-rice', 'xinjiang-lamb-pilaf'],
  ['family-regional-grain-specialties', 'tibetan-savory-congee'],
  ['family-northern-braised-noodles', 'north-china-green-bean-braised-noodles'],
  ['family-home-fried-rice', 'broccoli-beef-fried-rice'],
  ['family-home-braised-rice', 'green-bean-pork-rib-braised-rice'],
  ['family-home-stewed-rice', 'tomato-tofu-stewed-rice'],
  ['family-home-soup-staple', 'broccoli-beef-soup-noodles'],
  ['family-home-covered-pot', 'potato-broccoli-beef-covered-rice'],
  ['family-home-vermicelli-pot', 'greens-tofu-vermicelli-pot'],
];

test('100-case static corpus replaces only redundant cycle coverage with each new formal family', () => {
  assert.equal(corpus.length, 100);
  assert.equal(corpus.filter(testCase => testCase.case_group === 'base').length, 48);
  assert.equal(corpus.filter(testCase => testCase.case_group === 'adversarial').length, 20);
  assert.equal(corpus.filter(testCase => testCase.case_group === 'cycle').length, 32);

  for (const [familyId, recipeId] of NEW_FAMILY_REPRESENTATIVES) {
    assert.ok(corpus.some(testCase => (
      testCase.case_group === 'cycle'
      && testCase.family_id === familyId
      && testCase.expected_recipe_ids.includes(recipeId)
    )), `${familyId} needs a deterministic cycle representative`);
  }
});

test('quick regression expectations never name recipes over the thirty-minute eligibility limit', () => {
  const recipesById = new Map(library.recipes.map(recipe => [recipe.id, recipe]));
  for (const testCase of corpus.filter(testCase => testCase.purpose === 'quick')) {
    for (const recipeId of testCase.expected_recipe_ids) {
      const recipe = recipesById.get(recipeId);
      assert.ok(recipe, `${testCase.id} expects a recipe in the library`);
      assert.ok(
        recipe.total_time_minutes <= 30,
        `${testCase.id} expects quick-ineligible ${recipeId} (${recipe.total_time_minutes} minutes)`,
      );
    }
  }
});

test('manual review sheet remains unfilled and distinguishes static coverage from human approval', () => {
  const reviewRows = reviewSheet.match(/^\| `(?:base|adversarial|cycle)-/gm) || [];

  assert.equal(reviewRows.length, 30);
  assert.equal((reviewSheet.match(/□通过 \/ □不通过/g) || []).length, 180);
  assert.doesNotMatch(reviewSheet, /☑通过/);
  assert.doesNotMatch(reviewSheet, /获用户批准|已完成 30 例逐项人工复核/);
  assert.match(reviewSheet, /## 当前人工评审状态：未完成/);
  assert.match(reviewSheet, /6 个 known gaps/);
  assert.match(reviewSheet, /不替代这些人工闸门/);
  assert.equal((reviewSheet.match(/未评审／未试做/g) || []).length, 12);
});

test('manual review sheet names the expanded Taiwan rice boundary without claiming approval', () => {
  const row = reviewSheet.split('\n').find(line => (
    line.includes('cycle-014-taiwan-cabbage-mushroom-rice-fresh-2')
  ));
  assert.ok(row);
  for (const text of ['高丽菜香菇炊饭', '番茄', '玉米', '虾仁', '未评审／未试做', '未批准']) {
    assert.match(row, new RegExp(text), text);
  }
});

test('manual review sheet lists all thirty targeted recipes as pending and untried', () => {
  const targetedRows = reviewSheet.match(/^\| `[a-z0-9-]+` \| .+ \| 待人工评审 \| 未试做 \| 未批准 \|$/gm) || [];
  assert.equal(targetedRows.length, 30);
  assert.match(reviewSheet, /正式库 72 道菜谱/);
  assert.match(reviewSheet, /60 道晋升菜谱为 `auto_approved`/);
  assert.doesNotMatch(reviewSheet, /30 道定向覆盖菜.*已试做/);
});
