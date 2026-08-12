import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildResearchMethod } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

const fixtures = [
  ['wulong-dingpot-sticky-rice-kongfan', /鼎罐.*柴火|糯米箜饭/iu],
  ['changning-kas-dai-bamboo-rice', /竹筒.*蒸熟/iu],
  ['yuping-dong-sticky-rice', /前一天晚上.*制作/iu],
];

test('r313 turns three identity cards into source-labelled process cards without inventing contracts', () => {
  for (const [recipeId, pattern] of fixtures) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.ok(recipe, `${recipeId} exists`);
    assert.equal(recipe.fixed_batch, null);
    assert.equal(recipe.liquid_contract, null);
    assert.equal(recipe.time_contract, null);
    assert.ok(recipe.cooking_sequence.length >= 1);
    assert.match(recipe.cooking_sequence[0].instruction, pattern);
    const method = buildResearchMethod(recipe);
    assert.ok(method.steps.some(step => step.provenance === 'source'));
    assert.ok(method.steps.length >= 4);
    assert.ok(method.ingredients.every(item => item.amount), `${recipeId} research quantities are visible`);
    assert.ok(method.time, `${recipeId} research time is visible`);
    assert.ok(method.liquid?.amount || method.liquid?.research_starting_point || method.liquid?.waterline, `${recipeId} research liquid is visible`);
  }
});

test('r313 keeps traditional vessel boundaries visible in the research card', () => {
  const wulong = buildResearchMethod(catalog.recipes.find(item => item.recipe_id === 'wulong-dingpot-sticky-rice-kongfan'));
  const changning = buildResearchMethod(catalog.recipes.find(item => item.recipe_id === 'changning-kas-dai-bamboo-rice'));
  assert.match(wulong.research_profile.note, /鼎罐|柴火/iu);
  assert.match(changning.research_profile.note, /竹筒/iu);
  assert.ok(wulong.assumptions.some(note => /原文|研究稿/iu.test(note)));
  assert.ok(changning.assumptions.some(note => /原文|研究稿/iu.test(note)));
});
