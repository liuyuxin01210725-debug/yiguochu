import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const corpus = JSON.parse(fs.readFileSync(
  new URL('../data/recipe-regression.json', import.meta.url),
  'utf8',
));

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
