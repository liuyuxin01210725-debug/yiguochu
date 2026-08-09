import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  {
    recipeId: 'afa-ebook9-clam-greens-soup-rice',
    canonicalName: '蛤蜊青菜湯飯',
    alias: '蛤蜊青菜汤饭',
    coreIngredients: ['白飯', '蛤蜊', '青江菜', '薑'],
    liquidKind: 'added_water',
    water: 1.5,
    waterUnit: '碗',
    locator: 'ebook9-1.html 行328至340',
  },
  {
    recipeId: 'afa-ebook9-roselle-soup-rice',
    canonicalName: '羅宋湯飯',
    alias: '罗宋汤饭',
    coreIngredients: ['米飯', '牛肉', '蕃茄', '高麗菜', '嫩薑'],
    liquidKind: 'added_broth',
    water: 2,
    waterUnit: '碗',
    locator: 'ebook9-1.html 行732至746',
  },
];

test('r114 adds two Taiwan official soup-rice candidates without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r223');
  assert.equal(catalog.recipes.length, 923);
  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.ok(recipe, item.recipeId);
    assert.equal(recipe.canonical_name, item.canonicalName, item.recipeId);
    assert.ok(recipe.aliases.includes(item.alias), item.recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', item.recipeId);
    assert.equal(recipe.identity_status, 'verified', item.recipeId);
    assert.deepEqual(recipe.core_ingredients, item.coreIngredients, item.recipeId);
    assert.equal(recipe.fixed_batch.servings, 1, item.recipeId);
    assert.equal(recipe.liquid_contract.kind, item.liquidKind, item.recipeId);
    assert.equal(recipe.liquid_contract.amount.value, item.water, item.recipeId);
    assert.equal(recipe.liquid_contract.amount.unit, item.waterUnit, item.recipeId);
    assert.equal(recipe.time_contract, null, item.recipeId);
    assert.deepEqual(recipe.safety_endpoints, [], item.recipeId);
    assert.equal(recipe.cooker_adaptation.status, 'not_adapted', item.recipeId);
    assert.equal(recipe.source_refs.length, 1, item.recipeId);
    const source = recipe.source_refs[0];
    assert.equal(source.publisher, '台湾農糧署北區分署', item.recipeId);
    assert.equal(source.access_status, 'opened', item.recipeId);
    assert.ok(Number.isInteger(source.evidence_tier), item.recipeId);
    assert.equal(source.evidence_locator, item.locator, item.recipeId);
    assert.ok(source.claim_scopes.includes('identity'), item.recipeId);
    assert.ok(source.claim_scopes.includes('ingredients'), item.recipeId);
    assert.ok(source.claim_scopes.includes('quantity'), item.recipeId);
    assert.ok(source.claim_scopes.includes('liquid'), item.recipeId);
    assert.ok(source.claim_scopes.includes('process'), item.recipeId);
    assert.match(recipe.evidence_notes, /普通汤锅|普通鍋|普通湯鍋|不.*电饭煲|不.*電飯煲/u, item.recipeId);
  }
});

test('r114 preserves stove-top and missing-contract boundaries', () => {
  const clam = byId.get('afa-ebook9-clam-greens-soup-rice');
  const roselle = byId.get('afa-ebook9-roselle-soup-rice');
  for (const recipe of [clam, roselle]) {
    assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
    assert.match(recipe.cooker_adaptation.notes, /汤锅|湯鍋/iu);
    assert.match(recipe.cooker_adaptation.notes, /未.*电饭煲|未.*電飯煲|不.*外推/u);
    assert.equal(recipe.time_contract, null);
    assert.deepEqual(recipe.safety_endpoints, []);
    assert.match(recipe.evidence_notes, /缺.*时长|缺.*時間|未.*總時長/u);
    assert.match(recipe.evidence_notes, /安全终点|安全終點/u);
  }
});
