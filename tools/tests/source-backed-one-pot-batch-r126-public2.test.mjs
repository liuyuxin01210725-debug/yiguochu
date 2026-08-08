import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  {
    recipeId: 'maff-ginger-aburaage-takikomi',
    name: '生姜と油揚げの炊き込みご飯',
    url: 'https://www.maff.go.jp/j/syokuiku/torikumi/pdf/fam003-.pdf',
    vessel: /电饭煲|炊饭器|炊具/u,
  },
  {
    recipeId: 'maff-hyogo-aromatic-takikomi',
    name: 'ひょうご香る炊き込みご飯',
    url: 'https://www.maff.go.jp/kinki/syouhi/seikatu/syokuiku/attach/pdf/251114-32.pdf',
    vessel: /普通锅|燃气|锅/u,
  },
  {
    recipeId: 'maff-shincha-takikomi-gohan',
    name: '新茶の炊き込み御飯',
    url: 'https://www.maff.go.jp/j/seisan/tokusan/cha/chachatto.html',
    vessel: /炊饭器|炊具|普通锅|锅/u,
  },
  {
    recipeId: 'qld-one-pot-beans-rice',
    name: 'One Pot Beans and Rice',
    url: 'https://hw.qld.gov.au/healthy-recipes/one-pot-beans-and-rice-recipe/',
    vessel: /普通锅|saucepan|锅/u,
  },
  {
    recipeId: 'uw-one-pot-chicken-rice-soup',
    name: 'One-Pot Chicken and Rice Soup',
    url: 'https://www.washington.edu/anyhungryhusky/2020/05/01/one-pot-chicken-and-rice-soup-gf/',
    vessel: /普通锅|锅|pot/u,
  },
  {
    recipeId: 'rda-korea-naengi-panbap',
    name: '냉이팬밥',
    url: 'https://rda.go.kr/webzine/2026/04/4_3.html',
    vessel: /平底锅|锅|pan/u,
  },
];

test('r126 adds six directly evidenced one-pot rice candidates', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r137');
  assert.equal(catalog.recipes.length, 916);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);

  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.ok(recipe, item.recipeId);
    assert.equal(recipe.canonical_name, item.name, item.recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', item.recipeId);
    assert.equal(recipe.identity_status, 'verified', item.recipeId);
    assert.notEqual(recipe.status, 'executable', item.recipeId);
    assert.ok(recipe.core_ingredients.length >= 3, item.recipeId);
    assert.ok(recipe.cooking_sequence.length >= 2, item.recipeId);
    assert.match(recipe.traditional_vessels.join(' '), item.vessel, item.recipeId);

    const source = recipe.source_refs.find((candidate) => candidate.url === item.url);
    assert.ok(source, `${item.recipeId}: official source URL`);
    assert.equal(source.access_status, 'opened', item.recipeId);
    assert.ok(source.evidence_locator, item.recipeId);
    assert.ok(source.claim_scopes.includes('identity'), item.recipeId);
    assert.ok(source.claim_scopes.includes('ingredients'), item.recipeId);
    assert.ok(source.claim_scopes.includes('process'), item.recipeId);
  }
});

test('r126 preserves source-limited appliance and safety boundaries', () => {
  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.ok(['source_limited', 'not_adapted'].includes(recipe.cooker_adaptation.status), item.recipeId);
    assert.match(recipe.cooker_adaptation.notes, /不外推.*电饭煲|普通锅|燃气灶锅|原器具|普通炊具|平底锅|炊饭器/u, item.recipeId);
    assert.deepEqual(recipe.safety_endpoints, [], item.recipeId);
  }

  const ginger = byId.get('maff-ginger-aburaage-takikomi');
  assert.equal(ginger.fixed_batch.servings, 2);
  assert.equal(ginger.fixed_batch.ingredients.find((item) => item.name === '白米').amount.value, 1);
  assert.equal(ginger.fixed_batch.ingredients.find((item) => item.name === '白米').amount.unit, '合');
  assert.equal(ginger.liquid_contract.kind, 'rice_cooker_mark');

  const qld = byId.get('qld-one-pot-beans-rice');
  assert.equal(qld.fixed_batch.servings, 6);
  assert.equal(qld.liquid_contract.amount.value, 2);
  assert.equal(qld.liquid_contract.amount.unit, 'cup');

  const naengi = byId.get('rda-korea-naengi-panbap');
  assert.equal(naengi.fixed_batch.servings, 2);
  assert.equal(naengi.liquid_contract.amount.value, 200);
  assert.equal(naengi.liquid_contract.amount.unit, 'ml');
  assert.equal(naengi.time_contract.total_minutes, 13);
});

test('r126 candidates are not legacy fixed recipes or executable promotions', () => {
  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.match(recipe.evidence_notes, /来源|MAFF|普通锅|电饭煲|炊饭器|平底锅/u, item.recipeId);
    assert.ok(!['approved', 'auto_approved', 'executable', 'preview_ready'].includes(recipe.status), item.recipeId);
  }
});
