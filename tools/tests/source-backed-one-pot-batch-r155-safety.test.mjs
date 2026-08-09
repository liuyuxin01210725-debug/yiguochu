import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

const expected = {
  'panasonic-oyster-negi-takikomi-rice': [
    ['shellfish_fully_cooked', 74, /shellfish|贝类|牡蛎|蛤蜊|oyster/i],
  ],
  'tiger-oyster-mushroom-rice': [
    ['shellfish_fully_cooked', 74, /shellfish|贝类|牡蛎|oyster/i],
  ],
  'zojirushi-seafood-paella': [
    ['shellfish_fully_cooked', 74, /shellfish|贝类|虾|蛤蜊|clam/i],
  ],
  'tatung-seafood-porridge': [
    ['shellfish_fully_cooked', 74, /shellfish|贝类|蟹|crab/i],
    ['seafood_fully_cooked', 63, /fish|鱼类|63°C|seafood/i],
    ['poultry_fully_cooked', 74, /poultry|禽肉|鸡肉|165°F \/ 74°C/i],
  ],
  'panasonic-taiwan-truffle-seafood-risotto': [
    ['shellfish_fully_cooked', 74, /shellfish|贝类|蛤蜊|shrimp/i],
  ],
  'hk-hiroshima-oyster-mushroom-claypot-rice': [
    ['shellfish_fully_cooked', 74, /shellfish|贝类|蚝|oyster/i],
  ],
};
const executableIds = new Set(['tatung-salmon-pumpkin-milk-risotto', 'tatung-seafood-porridge']);

test('r155 closes six existing seafood and poultry safety gaps without adding recipes', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r255');
  assert.equal(catalog.recipes.length, 923);
  for (const [id, endpoints] of Object.entries(expected)) {
    const recipe = catalog.recipes.find(({ recipe_id: recipeId }) => recipeId === id);
    assert.ok(recipe, `missing ${id}`);
    assert.equal(recipe.status, executableIds.has(id) ? 'executable' : 'recipe_fact_checked');
    assert.deepEqual(recipe.safety_endpoints.map(({ code, minimum_core_temperature_c }) => [code, minimum_core_temperature_c]), endpoints.map(([code, temperature]) => [code, temperature]));
    const source = recipe.source_refs.find(({ source_id: sourceId }) => sourceId === 'S-SAFETY-TEMPERATURES-1');
    assert.ok(source, `${id} lacks FoodSafety.gov source`);
    assert.deepEqual(source.claim_scopes, ['safety']);
    assert.equal(source.url, safetyUrl);
    assert.equal(source.access_status, 'opened');
    assert.equal(source.evidence_tier, 1);
    for (const [, , locator] of endpoints) assert.match(source.evidence_locator, locator);
  }
});

test('r155 preserves source-specific pre-processing and leaves ambiguous raw status unresolved', () => {
  const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.match(byId['tiger-oyster-mushroom-rice'].evidence_notes, /先煮牡蛎|出锅|投料/u);
  assert.match(byId['zojirushi-seafood-paella'].evidence_notes, /先蒸|蒸汁|回锅/u);
  assert.match(byId['tatung-seafood-porridge'].evidence_notes, /预煎|两阶段|二阶段/u);
  assert.match(byId['panasonic-taiwan-truffle-seafood-risotto'].evidence_notes, /海鲜|机型|家庭/u);
  assert.deepEqual(byId['panasonic-tokyo-seafood-pilaf'].safety_endpoints, []);
  assert.deepEqual(byId['panasonic-my-chicken-pumpkin-lotus-mixed-rice'].safety_endpoints, []);
  assert.deepEqual(byId['yutian-electric-cooker-lamb-pilaf'].safety_endpoints, []);
  for (const id of Object.keys(expected)) {
    if (!executableIds.has(id)) assert.notEqual(byId[id].status, 'executable');
  }
});
