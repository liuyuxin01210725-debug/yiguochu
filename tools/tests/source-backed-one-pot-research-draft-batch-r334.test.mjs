import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildShelfCatalog } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const shelf = buildShelfCatalog(catalog);
const identityOnlySequenceGaps = [
  'hunan-mayang-steamed-glutinous-rice',
  'afa-douchi-pork-steamed-rice',
  'yangzhong-pufferfish-eight-pot-rice',
  'fujian-oil-braised-meat-rice',
  'wuerhe-awudan-lamb-shank-pilaf',
  'shache-pea-meat-pilaf',
  'pingjiang-red-army-guerrilla-bamboo-rice',
  'cn-yunnan-ruili-dai-steamed-rice-technique',
  'cn-xinjiang-mulei-chickpea-pilaf',
];

test('r334 gives every remaining empty-sequence identity card a named draft or an explicit safety block', () => {
  const emptyCanonicalIds = catalog.recipes
    .filter(recipe => Array.isArray(recipe.cooking_sequence) && recipe.cooking_sequence.length === 0)
    .map(recipe => recipe.recipe_id);
  assert.equal(emptyCanonicalIds.length, 47);
  assert.deepEqual(identityOnlySequenceGaps.filter(id => !emptyCanonicalIds.includes(id)), []);

  for (const id of identityOnlySequenceGaps) {
    const canonical = catalog.recipes.find(recipe => recipe.recipe_id === id);
    const record = shelf.records.find(recipe => recipe.recipe_id === id);
    assert.ok(canonical && record, `${id} exists`);
    assert.equal(canonical.cooking_sequence.length, 0, `${id} keeps canonical process empty`);
    const method = record.research_method;
    assert.ok(method.ingredients.length > 0, `${id} has draft ingredients`);
    assert.ok(method.liquid?.amount, `${id} has liquid guidance`);
    assert.ok(method.time?.total_minutes, `${id} has time guidance`);
    assert.ok(method.steps.length >= 5, `${id} has ordered steps or block`);
    assert.ok(method.steps.every(step => step.provenance === 'estimated'), `${id} steps are visibly estimated`);
  }
});

test('r334 keeps the pufferfish identity card blocked instead of emitting a cooking procedure', () => {
  const record = shelf.records.find(recipe => recipe.recipe_id === 'yangzhong-pufferfish-eight-pot-rice');
  assert.equal(record.research_method.method_type, 'blocked_safety');
  assert.match(record.research_method.blocked_reason, /河豚|专业去毒|禁止/iu);
  assert.match(record.research_method.safety_note, /禁止家庭执行/iu);
  assert.ok(record.research_method.steps.every(step => /停止|不要|不提供|blocked|核验/iu.test(step.instruction)));
});
