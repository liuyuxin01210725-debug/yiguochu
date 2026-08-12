import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildShelfCatalog } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync('tools/data/source-backed-one-pot-recipes.v1.json', 'utf8'));
const shelf = buildShelfCatalog(catalog);

const ids = [
  'yichang-cured-pork-braised-rice',
  'lianping-neiguan-braised-chicken-rice',
  'hubei-xinzhou-yellow-catfish-glutinous-rice',
  'zhejiang-changxing-salted-pork-xiuhuajin-rice',
  'taicang-seafood-pot-crust-rice',
  'afa-japanese-chestnut-rice',
  'afa-garlic-fresh-fish-rice',
  'taiwan-pumpkin-dried-fish-red-shallot-rice',
  'taiwan-sausage-chestnut-rice',
  'mindong-she-black-rice',
  'qianjiang-xiadao-guoba-rice',
  'r103-cn-guangxi-shangsi-xiangnu-wuse-fan',
];

test('r333 tailored drafts cover concrete identity-only cards without changing canonical contracts', () => {
  for (const id of ids) {
    const canonical = catalog.recipes.find(recipe => recipe.recipe_id === id);
    const record = shelf.records.find(recipe => recipe.recipe_id === id);
    assert.ok(canonical, `${id} canonical record exists`);
    assert.ok(record, `${id} shelf record exists`);
    assert.equal(canonical.fixed_batch, null, `${id} keeps source fixed_batch null`);
    assert.equal(canonical.liquid_contract, null, `${id} keeps source liquid null`);
    assert.equal(canonical.time_contract, null, `${id} keeps source time null`);
    assert.equal(canonical.cooking_sequence.length, 0, `${id} keeps source sequence empty`);
    const method = record.research_method;
    assert.ok(method, `${id} has a research method`);
    assert.ok(method.ingredients.length >= 1, `${id} has named draft ingredients`);
    assert.ok(method.ingredients.every(item => item.provenance === 'estimated'), `${id} draft ingredients are visibly estimated`);
    assert.ok(method.liquid?.amount?.value > 0, `${id} has a draft liquid amount`);
    assert.equal(method.liquid.provenance, 'estimated', `${id} draft liquid is visibly estimated`);
    assert.ok(method.time?.total_minutes > 0, `${id} has a draft time`);
    assert.equal(method.time.provenance, 'estimated', `${id} draft time is visibly estimated`);
    assert.ok(method.steps.length >= 4, `${id} has an ordered draft method`);
    assert.ok(method.steps.every(step => step.provenance === 'estimated'), `${id} draft steps are visibly estimated`);
  }
});

test('r333 tailored drafts improve method specificity while preserving the 923-card coverage contract', () => {
  assert.equal(shelf.records.length, 923);
  assert.equal(shelf.method_coverage.total, 923);
  assert.equal(shelf.method_coverage.estimated_cards, 785);
  assert.equal(shelf.summary.trial_ready_total, 379);
});
