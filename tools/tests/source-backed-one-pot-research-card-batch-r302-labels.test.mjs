import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { buildResearchMethod } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('r302 research cards replace opaque ingredient placeholders with actionable qualified labels', () => {
  const opaque = [];
  for (const recipe of catalog.recipes) {
    const method = buildResearchMethod(recipe);
    for (const ingredient of method.ingredients || []) {
      if (/来源未展开|来源未注明物种|具体待核|种类待核|构成待核|语义待核/iu.test(ingredient.name || '')) {
        opaque.push(`${recipe.recipe_id}:${ingredient.name}`);
      }
    }
  }
  assert.deepEqual(opaque, []);

  const fixtures = [
    ['shache-pea-meat-pilaf', /抓饭肉类/iu],
    ['kashgar-nowruz-rice', /七种畜禽肉|七种谷物/iu],
  ];
  for (const [recipeId, pattern] of fixtures) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.ok(recipe, `${recipeId} fixture exists`);
    assert.ok(buildResearchMethod(recipe).ingredients.some(item => pattern.test(item.name)));
  }
  const bamboo = catalog.recipes.find(item => item.recipe_id === 'dai-fragrant-bamboo-rice');
  assert.ok(bamboo);
  const bambooMethod = buildResearchMethod(bamboo);
  assert.equal(bambooMethod.ingredients.some(item => /竹筒饭配料/iu.test(item.name)), false);
  assert.ok(bambooMethod.assumptions.some(note => /来源未展开配料|不要自行添加/u.test(note)));

  for (const recipe of catalog.recipes) {
    const names = buildResearchMethod(recipe).ingredients.map(item => item.name);
    assert.equal(new Set(names).size, names.length, `${recipe.recipe_id} has duplicate visible ingredient rows`);
  }
});
