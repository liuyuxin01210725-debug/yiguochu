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

test('migration validator requires the source-backed catalog for target dispositions', () => {
  // Removing the required-catalog guard would make these unresolved targets pass.
  const migration = {
    schema_version: 1,
    migration_version: 'source-backed-migration-v1-test',
    items: [{
      legacy_variant_id: 'a',
      legacy_display_name: 'A',
      disposition: 'source_backed_migrated',
      target_recipe_id: 'known-target',
      reason: 'independent source supports the identity',
    }],
  };
  for (const catalog of [undefined, null, { recipes: null }]) {
    const errors = validator.validateSourceBackedCatalogMigration(
      migration,
      [{ variant_id: 'a' }],
      catalog,
    );
    assert.match(errors.join('\n'), /sourceBackedCatalog.*required/i);
  }
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
  const legacyById = new Map(flattenLegacyVariants().map(variant => [variant.variant_id, variant]));
  const recipes = sourceBackedCatalog().recipes;
  const recipeIds = new Set(recipes.map(recipe => recipe.recipe_id));
  const recipeNames = new Set(recipes.flatMap(recipe => [recipe.canonical_name, ...(recipe.aliases ?? [])]));

  for (const id of excludedIds) {
    assert.equal(items.get(id)?.disposition, 'project_original_excluded');
    assert.equal(items.get(id)?.target_recipe_id, null);
    const legacy = legacyById.get(id);
    assert.ok(!recipeIds.has(legacy.recipe_id));
    assert.ok(!recipeNames.has(legacy.display_name));
    assert.ok(!recipeNames.has(legacy.name_label));
  }
});

test('migration validator rejects project-original identities copied under a new recipe ID', () => {
  // Removing any recipe-id, canonical-name, or alias exclusion check would make one case pass.
  const legacyVariants = flattenLegacyVariants();
  const migration = migrationLedger();
  const legacy = legacyVariants.find(item => item.variant_id === 'home-broccoli-beef-rice');
  for (const prohibitedRecipe of [
    { recipe_id: legacy.recipe_id, canonical_name: 'Other recipe', aliases: [] },
    { recipe_id: 'different-normal-id', canonical_name: legacy.display_name, aliases: [] },
    { recipe_id: 'another-normal-id', canonical_name: 'Other recipe', aliases: [legacy.name_label] },
  ]) {
    const catalog = sourceBackedCatalog();
    catalog.recipes.push(prohibitedRecipe);
    const errors = validator.validateSourceBackedCatalogMigration(migration, legacyVariants, catalog);
    assert.match(errors.join('\n'), /project-original.*home-broccoli-beef-rice/i);
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

test('locks Taiwan and manufacturer region contracts', () => {
  const catalog = sourceBackedCatalog();
  const recipes = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  for (const recipeId of ['taiwan-cabbage-rice', 'taiwan-pumpkin-rice']) {
    assert.deepEqual(recipes.get(recipeId)?.region_codes, ['TW']);
  }
  for (const recipeId of [
    'zojirushi-fresh-vegetable-bamboo-rice',
    'zojirushi-beef-mixed-rice',
    'joyoung-curry-chicken-rice-jrc-4hp82',
    'panasonic-fresh-shiitake-rice-sr-afg',
    'zojirushi-minced-pork-greens-rice-nl-erh',
    'panasonic-mixed-chicken-rice-sr-df151',
    'joyoung-mixed-sausage-vegetable-rice-jrc-4hp82',
  ]) {
    const recipe = recipes.get(recipeId);
    assert.equal(recipe?.cuisine_family, 'manufacturer-rice-cooker-recipes');
    assert.deepEqual(recipe.region_codes, []);
  }
  assert.deepEqual(validator.validateSourceBackedOnePotCatalog(catalog), []);
});

test('rejects empty regions for ordinary recipes and nonempty regions for manufacturer recipes', () => {
  // Removing either branch in the locked region contract would make one malformed catalog pass.
  const ordinary = sourceBackedCatalog();
  ordinary.recipes.find(recipe => recipe.recipe_id === 'taiwan-cabbage-rice').region_codes = [];
  assert.match(
    validator.validateSourceBackedOnePotCatalog(ordinary).join('\n'),
    /region_codes must be a nonempty string array/i,
  );

  const manufacturer = sourceBackedCatalog();
  manufacturer.recipes.find(recipe => (
    recipe.recipe_id === 'zojirushi-fresh-vegetable-bamboo-rice'
  )).region_codes = ['CN'];
  assert.match(
    validator.validateSourceBackedOnePotCatalog(manufacturer).join('\n'),
    /manufacturer-rice-cooker-recipes.*region_codes must be an empty array/i,
  );
});

test('keeps canonical manufacturer names unique even with empty region codes', () => {
  // Removing empty-region uniqueness would allow duplicate manufacturer catalog entries.
  const catalog = sourceBackedCatalog();
  const duplicate = structuredClone(
    catalog.recipes.find(recipe => recipe.recipe_id === 'zojirushi-fresh-vegetable-bamboo-rice'),
  );
  duplicate.recipe_id = 'zojirushi-fresh-vegetable-bamboo-rice-copy';
  catalog.recipes.push(duplicate);
  assert.match(
    validator.validateSourceBackedOnePotCatalog(catalog).join('\n'),
    /canonical_name \+ region_codes must be unique/i,
  );
});

test('states the Quanzhou identity-versus-adaptation evidence boundary', () => {
  const item = migrationLedger().items.find(row => (
    row.legacy_variant_id === 'home-soaked-glutinous-pork-mushroom-rice'
  ));
  assert.equal(item?.disposition, 'project_original_excluded');
  assert.match(item?.reason ?? '', /泉州.*政府.*身份/u);
  assert.match(item?.reason ?? '', /糯米.*简化/u);
});
