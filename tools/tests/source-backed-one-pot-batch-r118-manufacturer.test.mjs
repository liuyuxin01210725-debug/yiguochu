import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  {
    recipeId: 'tiger-carrot-rice',
    name: 'Carrot Rice',
    url: 'https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/carrot-rice/',
    kind: 'direct_one_pot',
  },
  {
    recipeId: 'tiger-usa-saffron-rice',
    name: 'Saffron Rice',
    url: 'https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/saffron-rice/',
    kind: 'direct_one_pot',
  },
  {
    recipeId: 'panasonic-autocooker-seasoned-rice-kit',
    name: '炊き込みごはん（市販の素使用）',
    url: 'https://panasonic.jp/cooking/recipe/autocooker/1276.html',
    kind: 'direct_one_pot',
  },
];

test('r118 adds three official one-pot rice candidates without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r240');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);

  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.ok(recipe, item.recipeId);
    assert.equal(recipe.canonical_name, item.name, item.recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', item.recipeId);
    assert.equal(recipe.identity_status, 'verified', item.recipeId);
    assert.ok(recipe.core_ingredients.length >= 2, item.recipeId);
    assert.ok(recipe.cooking_sequence.length >= 2, item.recipeId);
    assert.ok(recipe.source_refs.some((source) => source.url === item.url), item.recipeId);
    assert.notEqual(recipe.status, 'executable', item.recipeId);
    assert.notEqual(recipe.status, 'preview_ready', item.recipeId);
  }
});

test('r118 keeps appliance and nutritional boundaries explicit', () => {
  const carrot = byId.get('tiger-carrot-rice');
  assert.equal(carrot.fixed_batch, null);
  assert.equal(carrot.liquid_contract.waterline.mark, 2);
  assert.equal(carrot.time_contract, null);
  assert.equal(carrot.cooker_adaptation.status, 'source_limited');
  assert.match(carrot.evidence_notes, /蛋白|配饭|未给|Tiger/u);

  const saffron = byId.get('tiger-usa-saffron-rice');
  assert.equal(saffron.fixed_batch, null);
  assert.equal(saffron.liquid_contract.amount.value, 1.75);
  assert.equal(saffron.time_contract, null);
  assert.equal(saffron.cooker_adaptation.status, 'source_limited');
  assert.match(saffron.evidence_notes, /蛋白|配饭|未给|Plain/u);

  const kit = byId.get('panasonic-autocooker-seasoned-rice-kit');
  assert.equal(kit.fixed_batch.servings, 3);
  assert.equal(kit.liquid_contract.amount.value, 650);
  assert.equal(kit.liquid_contract.amount.unit, 'mL');
  assert.equal(kit.time_contract.total_minutes, 55);
  assert.equal(kit.cooker_adaptation.status, 'source_limited');
  assert.match(kit.cooker_adaptation.notes, /NF-AC1000|NF-AC700|市售|料包|不外推/u);
});

test('r118 source records are opened, tiered, and do not invent missing facts', () => {
  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    const source = recipe.source_refs.find((candidate) => candidate.url === item.url);
    assert.ok(source, item.recipeId);
    assert.equal(source.access_status, 'opened', item.recipeId);
    assert.ok(Number.isInteger(source.evidence_tier) && source.evidence_tier >= 1 && source.evidence_tier <= 5, item.recipeId);
    assert.ok(source.evidence_locator, item.recipeId);
    assert.ok(source.claim_scopes.includes('identity'), item.recipeId);
    assert.ok(source.claim_scopes.includes('ingredients'), item.recipeId);
    assert.ok(source.claim_scopes.includes('process'), item.recipeId);
    assert.ok(source.claim_scopes.includes('appliance'), item.recipeId);
    assert.notEqual(source.access_status, 'search_extract_only', item.recipeId);
  }
});
