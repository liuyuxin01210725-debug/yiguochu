import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const corpus = JSON.parse(fs.readFileSync(
  new URL('../data/recipe-regression.json', import.meta.url),
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

test('manual review sheet remains unfilled and distinguishes static coverage from human approval', () => {
  const reviewRows = reviewSheet.match(/^\| `(?:base|adversarial|cycle)-/gm) || [];

  assert.equal(reviewRows.length, 30);
  assert.equal((reviewSheet.match(/□通过 \/ □不通过/g) || []).length, 180);
  assert.doesNotMatch(reviewSheet, /☑通过/);
  assert.doesNotMatch(reviewSheet, /获用户批准|已完成 30 例逐项人工复核/);
  assert.match(reviewSheet, /## 当前人工评审状态：未完成/);
  assert.match(reviewSheet, /6 个 known gaps/);
  assert.match(reviewSheet, /不替代这些人工闸门/);
  assert.equal((reviewSheet.match(/未评审／未试做/g) || []).length, 6);
});
