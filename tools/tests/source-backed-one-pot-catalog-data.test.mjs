import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as validator from '../lib/source-backed-one-pot-catalog-validator.mjs';

const directory = dirname(fileURLToPath(import.meta.url));
const toolsDirectory = dirname(directory);
const dataDirectory = join(toolsDirectory, 'data');

const readJson = name => JSON.parse(readFileSync(join(dataDirectory, name), 'utf8'));

const flattenLegacyVariants = () => readJson('rice-meal-catalog.v1.json')
  .families.flatMap(family => family.variants);

const sourceBackedCatalog = () => readJson('source-backed-one-pot-recipes.v1.json');
const migrationLedger = () => readJson('source-backed-catalog-migration.v1.json');

test('migration validator rejects duplicate, missing, unknown, and unresolved targets', () => {
  // Removing the accounting or target-catalog branches must make this fail.
  const errors = validator.validateSourceBackedCatalogMigration({
    schema_version: 1,
    migration_version: 'source-backed-migration-v1-test',
    items: [
      { legacy_variant_id: 'a', legacy_display_name: 'A', disposition: 'scope_excluded', target_recipe_id: null, reason: 'outside the savory rice scope' },
      { legacy_variant_id: 'a', legacy_display_name: 'A', disposition: 'source_backed_migrated', target_recipe_id: 'missing-target', reason: 'independent source supports the identity' },
      { legacy_variant_id: 'unknown', legacy_display_name: 'Unknown', disposition: 'scope_excluded', target_recipe_id: null, reason: 'outside the savory rice scope' },
    ],
  }, [{ variant_id: 'a' }, { variant_id: 'b' }], {
    recipes: [{ recipe_id: 'known-target' }],
  });

  assert.ok(errors.some(error => error.includes('duplicate legacy variant a')));
  assert.ok(errors.some(error => error.includes('missing legacy variant b')));
  assert.ok(errors.some(error => error.includes('unknown legacy variant unknown')));
  assert.ok(errors.some(error => error.includes('target_recipe_id missing-target does not exist')));
});

test('accounts for every current rice-meal variant exactly once', () => {
  const legacyIds = flattenLegacyVariants().map(row => row.variant_id).sort();
  const migratedIds = migrationLedger().items.map(row => row.legacy_variant_id).sort();
  assert.deepEqual(migratedIds, legacyIds);
  assert.equal(new Set(migratedIds).size, migratedIds.length);
});

test('migration and initial catalog pass the provenance validators', () => {
  const legacyVariants = flattenLegacyVariants();
  const catalog = sourceBackedCatalog();
  const migration = migrationLedger();
  assert.deepEqual(validator.validateSourceBackedOnePotCatalog(catalog), []);
  assert.deepEqual(
    validator.validateSourceBackedCatalogMigration(migration, legacyVariants, catalog),
    [],
  );
});

test('keeps project-original combinations out of the source-backed catalog', () => {
  const excludedIds = [
    'home-broccoli-beef-rice',
    'home-cabbage-tofu-rice',
    'home-chicken-leg-potato-rice',
    'home-corn-carrot-chicken-leg-rice',
    'home-green-bean-pork-rib-rice',
    'home-mushroom-green-bean-pork-rib-rice',
  ];
  const items = new Map(migrationLedger().items.map(row => [row.legacy_variant_id, row]));
  const recipeIds = new Set(sourceBackedCatalog().recipes.map(recipe => recipe.recipe_id));

  for (const id of excludedIds) {
    assert.equal(items.get(id)?.disposition, 'project_original_excluded');
    assert.equal(items.get(id)?.target_recipe_id, null);
    assert.ok(!recipeIds.has(id));
  }
});

test('records the audited disposition of all nineteen legacy variants', () => {
  const dispositionById = Object.fromEntries(
    migrationLedger().items.map(item => [item.legacy_variant_id, item.disposition]),
  );
  assert.deepEqual(dispositionById, {
    'home-soaked-glutinous-pork-mushroom-rice': 'project_original_excluded',
    'home-taiwan-cabbage-rice': 'source_backed_research_only',
    'home-taiwan-pumpkin-rice': 'source_backed_research_only',
    'home-lamb-carrot-rice': 'source_backed_research_only',
    'home-red-date-cowpea-rice': 'project_original_excluded',
    'home-bamboo-vegetable-rice': 'manufacturer_recipe_migrated',
    'home-beef-mixed-rice': 'manufacturer_recipe_migrated',
    'home-broccoli-beef-rice': 'project_original_excluded',
    'home-cabbage-tofu-rice': 'project_original_excluded',
    'home-chicken-leg-potato-rice': 'project_original_excluded',
    'home-corn-carrot-chicken-leg-rice': 'project_original_excluded',
    'home-curry-chicken-rice': 'manufacturer_recipe_migrated',
    'home-fresh-shiitake-rice': 'manufacturer_recipe_migrated',
    'home-green-bean-pork-rib-rice': 'project_original_excluded',
    'home-greens-minced-pork-rice': 'manufacturer_recipe_migrated',
    'home-mixed-chicken-rice': 'manufacturer_recipe_migrated',
    'home-mushroom-green-bean-pork-rib-rice': 'project_original_excluded',
    'home-sausage-mixed-rice': 'manufacturer_recipe_migrated',
    'shanghai-salted-pork-rice': 'source_backed_research_only',
  });
});

test('keeps every migrated recipe non-public until safety and complete execution facts are independently supported', () => {
  const catalog = sourceBackedCatalog();
  assert.ok(catalog.recipes.length > 0);
  for (const recipe of catalog.recipes) {
    assert.equal(recipe.status, 'recipe_fact_checked');
    assert.equal(recipe.fixed_batch, null);
    assert.equal(recipe.time_contract, null);
    assert.equal(recipe.safety_endpoints.length, 0);
  }
});

test('preserves official manufacturer names and their appliance boundaries', () => {
  const recipes = new Map(sourceBackedCatalog().recipes.map(recipe => [recipe.recipe_id, recipe]));
  for (const [recipeId, expectedName, expectedModel] of [
    ['zojirushi-fresh-vegetable-bamboo-rice', '鲜蔬竹笋饭', '白米3水位线'],
    ['zojirushi-beef-mixed-rice', '牛肉什锦饭', '什锦饭程序'],
    ['joyoung-curry-chicken-rice-jrc-4hp82', '咖喱鸡肉饭', 'JRC-4HP82'],
    ['panasonic-fresh-shiitake-rice-sr-afg', '鲜香菇饭', 'SR-AFG'],
    ['zojirushi-minced-pork-greens-rice-nl-erh', '肉糜青菜饭', 'NL-ERH'],
    ['panasonic-mixed-chicken-rice-sr-df151', '什锦鸡饭', 'SR-DF151'],
    ['joyoung-mixed-sausage-vegetable-rice-jrc-4hp82', '懒人焖饭', 'JRC-4HP82'],
  ]) {
    const recipe = recipes.get(recipeId);
    assert.equal(recipe?.canonical_name, expectedName);
    assert.match(recipe?.cooker_adaptation?.notes ?? '', new RegExp(expectedModel));
    assert.ok(recipe?.source_refs.some(source => source.source_kind.includes('manufacturer')));
  }
});
