import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

test('r86 registers two MAFF regional mixed-rice recipes without collapsing continuous processes into one-pot contracts', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r175');
  assert.equal(catalog.recipes.length, 923);

  const kate = catalog.recipes.find(item => item.recipe_id === 'maff-kanagawa-kate-meshi');
  assert.equal(kate?.canonical_name, 'かて飯');
  assert.equal(kate?.status, 'recipe_fact_checked');
  assert.equal(kate?.fixed_batch?.servings, 4);
  assert.equal(kate?.cooker_adaptation?.status, 'source_limited');
  assert.equal(kate?.source_refs?.[0]?.url, 'https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/35_8_kanagawa.html');
  assert.ok(kate?.source_refs?.[0]?.claim_scopes?.includes('process'));

  const pheasant = catalog.recipes.find(item => item.recipe_id === 'maff-ehime-pheasant-dried-daikon-mixed-rice');
  assert.equal(pheasant?.canonical_name, 'きじ肉と切り干し大根の混ぜご飯');
  assert.equal(pheasant?.status, 'recipe_fact_checked');
  assert.equal(pheasant?.fixed_batch, null);
  assert.equal(pheasant?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(pheasant?.source_refs?.[0]?.url, 'https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/kijiniku_to_kiri_boshi_daikon_no_maze_gohan_ehime.html');
  assert.ok(pheasant?.source_refs?.[0]?.claim_scopes?.includes('process'));

  const counts = Object.groupBy(catalog.recipes, item => item.status);
  assert.equal(counts.recipe_fact_checked.length, 794);
  assert.equal(counts.identity_verified.length, 100);
  assert.equal(counts.executable.length, 12);
  assert.equal(counts.discovered.length, 17);
});

test('r86 records the Pengshui zha-cai-rice identity without inventing ingredients or a method', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const recipe = catalog.recipes.find(item => item.recipe_id === 'pengshui-zhacai-rice');
  assert.equal(recipe?.canonical_name, '馇菜饭');
  assert.equal(recipe?.status, 'identity_verified');
  assert.deepEqual(recipe?.core_ingredients, []);
  assert.deepEqual(recipe?.cooking_sequence, []);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.match(recipe?.evidence_notes ?? '', /非遗|不补写|身份/u);
  assert.ok(recipe?.source_refs?.every(source => Number.isInteger(source.evidence_tier)));
});
