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

test('migration validator keeps all six mandatory project-original combinations blocked under new IDs', () => {
  const legacyVariants = flattenLegacyVariants();
  const migration = migrationLedger();
  for (const legacyId of [
    'home-broccoli-beef-rice',
    'home-cabbage-tofu-rice',
    'home-chicken-leg-potato-rice',
    'home-corn-carrot-chicken-leg-rice',
    'home-green-bean-pork-rib-rice',
    'home-mushroom-green-bean-pork-rib-rice',
  ]) {
    const legacy = legacyVariants.find(item => item.variant_id === legacyId);
    const catalog = sourceBackedCatalog();
    catalog.recipes.push({
      recipe_id: `independent-looking-${legacyId}`,
      canonical_name: legacy.display_name,
      aliases: [],
    });
    const errors = validator.validateSourceBackedCatalogMigration(migration, legacyVariants, catalog);
    assert.match(errors.join('\n'), new RegExp(`project-original legacy variant ${legacyId}`));
  }
});

test('migration validator permits an independently sourced canonical Quanzhou identity', () => {
  // A ban that applies to all project_original_excluded rows would reject this independent identity.
  const legacyVariants = flattenLegacyVariants();
  const migration = migrationLedger();
  const legacy = legacyVariants.find(item => (
    item.variant_id === 'home-soaked-glutinous-pork-mushroom-rice'
  ));
  const catalog = sourceBackedCatalog();
  catalog.recipes.push({
    recipe_id: 'quanzhou-independent-oil-rice',
    canonical_name: legacy.display_name,
    aliases: [],
  });
  const errors = validator.validateSourceBackedCatalogMigration(migration, legacyVariants, catalog);
  assert.doesNotMatch(
    errors.join('\n'),
    /project-original legacy variant home-soaked-glutinous-pork-mushroom-rice/i,
  );
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
  // Partial evidence may now be structured one contract at a time, but no incomplete row may be promoted.
  const catalog = sourceBackedCatalog();
  assert.ok(catalog.recipes.length > 0);
  const statusTotals = catalog.recipes.reduce((totals, recipe) => {
    totals[recipe.status] = (totals[recipe.status] ?? 0) + 1;
    return totals;
  }, {});
  assert.deepEqual(statusTotals, {
    identity_verified: 10,
    recipe_fact_checked: 40,
  });
  for (const recipe of catalog.recipes) {
    assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe.status));
  }

  const factCompleteButNotPublic = new Set(['shanghai-salted-pork-vegetable-rice']);
  for (const recipe of catalog.recipes.filter(recipe => recipe.status === 'recipe_fact_checked')) {
    const completeExecutionContract = Boolean(
      recipe.fixed_batch
      && recipe.liquid_contract
      && recipe.cooking_sequence.length > 0
      && recipe.time_contract
      && recipe.safety_endpoints.length > 0,
    );
    if (completeExecutionContract) {
      assert.ok(factCompleteButNotPublic.has(recipe.recipe_id), `${recipe.recipe_id} is not an approved complete fact contract`);
      assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe.status));
    } else {
      assert.equal(completeExecutionContract, false, `${recipe.recipe_id} must remain incomplete and non-public`);
    }
  }
});

test('structures the Guangzhou government electric-cooker taro and cured-pork rice recipe without inventing a batch or time', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'guangzhou-taro-cured-pork-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-GD-GUANGZHOU-TARO-CURED-RICE-1');

  assert.equal(recipe?.canonical_name, '腊肉芋头饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.identity_status, 'verified');
  assert.deepEqual(recipe?.traditional_vessels, ['电饭煲']);
  assert.deepEqual(recipe?.core_ingredients, ['芋头', '腊肉', '大米']);
  assert.equal(recipe?.fixed_batch, null, 'the source gives no servings or fixed weights');
  assert.equal(recipe?.liquid_contract, null, 'the source only says to use the cooker scale');
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /芋头.*两厘米.*小块/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /腊肉.*切成小片/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /大米.*电饭煲.*刻度线.*芋头.*腊肉/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /出锅前.*加盐.*搅拌均匀/);
  assert.equal(recipe?.time_contract, null, 'the source gives no total cooking time');
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'pork_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('appliance'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Qijiang potato cured-pork kong rice as an identity-only government source without inventing its process', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'qijiang-potato-cured-pork-kong-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-CQ-QIJIANG-POTATO-CURED-PORK-KONG-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '綦江洋芋腊肉箜饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-CQ']);
  assert.deepEqual(recipe?.traditional_vessels, []);
  assert.deepEqual(recipe?.core_ingredients, ['米', '土豆', '腊肉']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.deepEqual(recipe?.cooking_sequence, []);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'unassessed', roles: [] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.status, 'identity_verified');
  assert.equal(source?.title, '2000名选手参赛 2025重庆老瀛山越野挑战赛开幕');
  assert.equal(source?.publisher, '重庆市人民政府网');
  assert.equal(source?.retrieved_at, '2026-08-03');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients']);
  assert.equal(source?.access_status, 'opened');
  assert.equal(validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status), false);
});

test('records Ninghe zengxiang pork rice with only the source-stated vessel and process', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'ninghe-zeng-pork-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-TJ-NINGHE-ZENG-PORK-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '宁河甑乡肉焖儿');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-TJ']);
  assert.deepEqual(recipe?.traditional_vessels, ['陶甑']);
  assert.deepEqual(recipe?.core_ingredients, ['大米', '猪肉']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /陶甑.*大米.*猪肉.*蒸制/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'unassessed', roles: [] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(source?.title, '望山见水忆乡愁（图）');
  assert.equal(source?.publisher, '天津日报');
  assert.equal(source?.retrieved_at, '2026-08-03');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.equal(source?.access_status, 'opened');
});

test('records Yichang cured-pork braised rice as an identity-only official listing when the source page is redirect-looped', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'yichang-cured-pork-braised-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-HB-YICHANG-CURED-PORK-BRAISED-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '宜昌腊肉焖饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-HB']);
  assert.deepEqual(recipe?.traditional_vessels, []);
  assert.deepEqual(recipe?.core_ingredients, ['米', '腊肉']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.deepEqual(recipe?.cooking_sequence, []);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'unassessed', roles: [] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.status, 'identity_verified');
  assert.equal(source?.title, '新华网：江汉大米“链动”三峡 产销合作启新篇');
  assert.equal(source?.publisher, '宜昌市发展和改革委员会');
  assert.equal(source?.retrieved_at, '2026-08-03');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients']);
  assert.equal(source?.access_status, 'search_extract_opened');
});

test('structures the Shanghai civil-affairs broad-bean vegetable-rice process without inventing quantities or liquid', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'shanghai-broad-bean-vegetable-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-JN-2');

  assert.equal(recipe?.canonical_name, '蚕豆菜饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.identity_status, 'verified');
  assert.deepEqual(recipe?.traditional_vessels, ['饭锅', '电饭煲']);
  assert.deepEqual(recipe?.core_ingredients, ['蚕豆', '猪肉丁', '牛心菜', '饭']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /蚕豆.*猪大排.*里脊肉.*切成丁/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /猪油.*肉丁.*黄酒.*葱花.*姜末/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /蚕豆.*牛心菜.*翻炒.*半熟/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /饭锅.*饭粒.*蚕豆.*猪肉粒.*牛心菜.*焖半小时/);
  assert.equal(recipe?.time_contract, null, 'the source gives a final braise duration but no total-time contract');
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'pork_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('appliance'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the Quanzhou Huzaifan steaming process without inventing quantities or cooker equivalence', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'shenhu-huzaifan'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-MN-1');

  assert.equal(recipe?.canonical_name, '壶仔饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.identity_status, 'verified');
  assert.deepEqual(recipe?.traditional_vessels, ['壶仔陶罐', '蒸制']);
  assert.deepEqual(recipe?.core_ingredients, ['糯米', '三层肉', '香菇', '虾米', '大骨汤']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null, 'the source names bone broth but gives no amount');
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /三层肉.*香菇.*虾米.*陶罐底部/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /炒好的糯米/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /大骨汤.*蒸熟/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /香葱.*花生.*卤肉汁/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, [
    { code: 'pork_fully_cooked', minimum_core_temperature_c: 74, source_ids: ['S-SAFETY-TEMPERATURES-1'] },
    { code: 'shellfish_fully_cooked', visual_endpoint: '肉质呈珍珠白或白色且不透明', source_ids: ['S-SAFETY-TEMPERATURES-1'] },
  ]);
  assert.deepEqual(recipe?.allergen_labels, ['甲壳类', '花生']);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'C',
    roles: ['carbohydrate', 'protein'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the Panan bamboo-tube rice ingredients and roast time without inventing quantities', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'zhejiang-panan-bamboo-tube-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-ZJ-PANAN-BAMBOO-RICE-1');

  assert.equal(recipe?.canonical_name, '磐安竹筒饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.identity_status, 'verified');
  assert.deepEqual(recipe?.traditional_vessels, ['竹筒', '烤架']);
  assert.deepEqual(recipe?.core_ingredients, ['糯米', '腊肉', '青豆']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /竹筒.*糯米.*腊肉.*青豆/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /锡纸.*封口/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /烤架.*约半个小时.*劈开/);
  assert.deepEqual(recipe?.time_contract, { total_minutes: 30, source_ids: ['S-ZJ-PANAN-BAMBOO-RICE-1'] });
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'pork_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('time'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records reviewed coverage and the evidence status of every eastern research node', () => {
  // Dropping a research node, promoting it, or leaving a region unreviewed must fail here.
  const catalog = sourceBackedCatalog();
  const recipes = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  const reviewed = new Set(catalog.reviewed_regions);
  const expected = {
    'shanghai-salted-pork-vegetable-rice': 'recipe_fact_checked',
    'shanghai-broad-bean-vegetable-rice': 'recipe_fact_checked',
    'wujiang-fragrant-greens-salted-pork-rice': 'identity_verified',
    'nanjing-aijiaohuang-rice': 'identity_verified',
    'wenzhou-mustard-greens-rice': 'recipe_fact_checked',
    'quanzhou-radish-rice': 'identity_verified',
    'minnan-salty-rice': 'recipe_fact_checked',
    'quanzhou-taro-rice': 'identity_verified',
    'shenhu-huzaifan': 'recipe_fact_checked',
    'quanzhou-yifan-oil-rice': 'identity_verified',
    'quanzhou-red-xun-rice': 'identity_verified',
    'taiwan-cabbage-rice': 'recipe_fact_checked',
    'taiwan-mushroom-bamboo-shoot-rice': 'recipe_fact_checked',
    'taiwan-tongzai-rice-cake': 'recipe_fact_checked',
    'cantonese-cured-meat-claypot-rice': 'recipe_fact_checked',
    'cantonese-mushroom-chicken-claypot-rice': 'recipe_fact_checked',
    'cantonese-black-bean-pork-rib-claypot-rice': 'recipe_fact_checked',
    'zhanjiang-galangal-leaf-rice': 'recipe_fact_checked',
    'zhanjiang-duck-rice': 'recipe_fact_checked',
  };

  for (const code of ['CN-SH', 'CN-JS', 'CN-ZJ', 'CN-FJ', 'CN-GD', 'TW']) {
    assert.ok(reviewed.has(code), `${code} is reviewed`);
    assert.ok(
      catalog.recipes.some(recipe => recipe.region_codes.includes(code))
        || catalog.regional_blanks.some(blank => blank.region_code === code),
      `${code} has a candidate or explicit blank`,
    );
  }
  for (const [recipeId, status] of Object.entries(expected)) {
    assert.equal(recipes.get(recipeId)?.status, status, recipeId);
  }
  assert.equal(recipes.has('taiwan-oil-rice'), false);
  assert.deepEqual(catalog.regional_blanks.find(blank => blank.region_code === 'TW'), {
    region_code: 'TW',
    candidate_name: '台湾油饭',
    reason: '候选“台湾油饭”未找到可读的直达原始食谱来源。',
    searched_at: '2026-08-02',
  });
});

test('keeps eastern source identities distinct and source claims bounded', () => {
  // Merging source formulations or turning vessel evidence into rice-cooker support is a data bug.
  const recipes = sourceBackedCatalog().recipes;
  const byId = new Map(recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.equal(recipes.filter(recipe => recipe.recipe_id === 'shanghai-salted-pork-vegetable-rice').length, 1);
  assert.equal(recipes.filter(recipe => recipe.recipe_id === 'taiwan-cabbage-rice').length, 1);

  for (const recipeId of [
    'shenhu-huzaifan',
    'taiwan-tongzai-rice-cake',
    'cantonese-cured-meat-claypot-rice',
    'cantonese-mushroom-chicken-claypot-rice',
    'quanzhou-red-xun-rice',
  ]) {
    const recipe = byId.get(recipeId);
    assert.ok(!/电饭煲|电锅|rice cooker/i.test(recipe?.cooker_adaptation?.notes ?? ''), recipeId);
  }

  for (const recipe of recipes.filter(recipe => recipe.region_codes.some(code => (
    ['CN-SH', 'CN-JS', 'CN-ZJ', 'CN-FJ', 'CN-GD', 'TW'].includes(code)
  )))) {
    for (const source of recipe.source_refs) {
      assert.ok(source.url.startsWith('https://'), `${recipe.recipe_id}:${source.source_id}`);
      for (const field of ['title', 'publisher', 'retrieved_at', 'source_kind', 'license', 'attribution']) {
        assert.ok(source[field], `${recipe.recipe_id}:${source.source_id}:${field}`);
      }
    }
  }
});

test('structures the Zhanjiang galangal-leaf rice cooker process without inventing its reduced liquid', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'zhanjiang-galangal-leaf-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-GD-ZHANJIANG-GALOU-1');
  const standardSource = recipe?.source_refs.find(item => item.source_id === 'S-GD-ZHANJIANG-GALOU-STANDARD-1');

  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.identity_status, 'verified');
  assert.deepEqual(recipe?.traditional_vessels, ['炒锅', '电饭锅']);
  assert.deepEqual(recipe?.core_ingredients, ['蛤蒌叶', '香米']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null, 'the source requires reduced water but gives no measurable amount');
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /蛤蒌叶.*洗净.*切成细丝/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /油.*炒香.*泡好的香米/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /电饭锅.*煲饭/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('appliance'));
  assert.equal(standardSource?.access_status, 'search_extract_opened');
  assert.ok(standardSource?.claim_scopes.includes('liquid'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the Wenzhou Nanji mustard-greens rice event process without inventing quantities or a cooker contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'wenzhou-mustard-greens-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-JN-5');

  assert.equal(recipe?.canonical_name, '温州南麂芥菜饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['芥菜', '肉末', '米']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /洗菜.*切肉.*淘米.*大锅.*翻炒/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'unassessed', roles: [] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures Zhanjiang duck rice from the standard extract without turning duck broth into an invented ratio', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'zhanjiang-duck-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-GD-ZHANJIANG-DUCK-RICE-1');

  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.identity_status, 'verified');
  assert.deepEqual(recipe?.traditional_vessels, ['煲']);
  assert.deepEqual(recipe?.core_ingredients, ['白切鸭', '大米', '鸭原汤']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null, 'the source names duck broth but gives no measurable amount');
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /白切鸭.*原汤/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /鸭原汤.*煲制大米/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /蒜蓉.*生抽/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'poultry_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'search_extract_opened');
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures Quanzhou mustard-green salted rice from the food-city process without inventing its water amount', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'minnan-salty-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-FJ-QUANZHOU-MUSTARD-RICE-1');

  assert.equal(recipe?.canonical_name, '闽南芥菜饭');
  assert.deepEqual(recipe?.aliases, ['咸饭', '芥菜饭']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['高压锅', '铁锅']);
  assert.deepEqual(recipe?.core_ingredients, ['大米', '芥菜', '海蛎干', '蛏干']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null, 'the source only says add an appropriate amount of water');
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /芥菜.*切成段.*大米.*炒热/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /海蛎干.*蛏干.*清水/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /高压锅或铁锅.*慢火蒸煮/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('rejects unparsed PDF scopes and promotion beyond discovery', () => {
  // Letting unread PDFs carry a scope or raise a row above discovery would manufacture evidence.
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'zhanjiang-duck-rice');
  recipe.source_refs[0].access_status = 'pdf_not_parsed';
  recipe.source_refs[0].claim_scopes = ['identity'];
  assert.match(
    validator.validateSourceBackedOnePotCatalog(catalog).join('\n'),
    /pdf_not_parsed.*exactly \[\]/i,
  );

  const promoted = sourceBackedCatalog();
  const promotedRecipe = promoted.recipes.find(item => item.recipe_id === 'zhanjiang-duck-rice');
  promotedRecipe.source_refs[0].access_status = 'pdf_not_parsed';
  promotedRecipe.source_refs[0].claim_scopes = [];
  promotedRecipe.status = 'identity_verified';
  assert.match(
    validator.validateSourceBackedOnePotCatalog(promoted).join('\n'),
    /pdf_not_parsed.*discovery-only/i,
  );
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

test('records an evidence result or concrete blank for every required national region', () => {
  // Removing national review coverage or a dated research result must make this fail.
  const requiredCodes = [
    'CN-BJ', 'CN-TJ', 'CN-HE', 'CN-SX', 'CN-NM', 'CN-LN', 'CN-JL', 'CN-HL',
    'CN-SH', 'CN-JS', 'CN-ZJ', 'CN-AH', 'CN-FJ', 'CN-JX', 'CN-SD', 'CN-HA',
    'CN-HB', 'CN-HN', 'CN-GD', 'CN-GX', 'CN-HI', 'CN-CQ', 'CN-SC', 'CN-GZ',
    'CN-YN', 'CN-XZ', 'CN-SN', 'CN-GS', 'CN-QH', 'CN-NX', 'CN-XJ', 'TW',
    'HK', 'MO',
  ];
  const catalog = sourceBackedCatalog();
  const reviewed = new Set(catalog.reviewed_regions);

  assert.deepEqual([...reviewed].sort(), [...requiredCodes].sort());
  for (const code of requiredCodes) {
    const hasRecipe = catalog.recipes.some(recipe => recipe.region_codes.includes(code));
    const blanks = catalog.regional_blanks.filter(blank => blank.region_code === code);
    assert.ok(hasRecipe || blanks.length > 0, `${code} has a recipe or regional blank`);
    for (const blank of blanks) {
      assert.match(blank.reason ?? '', /\S/u, `${code} blank has a concrete reason`);
      assert.equal(blank.searched_at, '2026-08-02', `${code} blank research date`);
    }
  }
});

test('retains the national source-backed candidates at their evidence-only statuses', () => {
  // Dropping a retained lead or promoting incomplete evidence must make this fail.
  const recipes = new Map(sourceBackedCatalog().recipes.map(recipe => [recipe.recipe_id, recipe]));
  const expected = {
    'ningxia-wuzhong-rouzhanfan': ['肉粘饭', 'recipe_fact_checked'],
    'yunnan-shidian-pea-potato-ham-rice': ['豌豆洋芋火腿焖饭', 'recipe_fact_checked'],
    'sichuan-kongganfan': ['孔干饭', 'recipe_fact_checked'],
    'hubei-enshi-shefan': ['社饭', 'recipe_fact_checked'],
  };

  for (const [recipeId, [canonicalName, status]] of Object.entries(expected)) {
    const recipe = recipes.get(recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status), recipeId);
    assert.ok(recipe?.source_refs.every(source => source.url.startsWith('https://')), recipeId);
  }

  for (const recipe of recipes.values()) {
    assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe.status), recipe.recipe_id);
  }
});

test('records the first-priority source matrix without pretending the recipes are executable', () => {
  const recipes = new Map(sourceBackedCatalog().recipes.map(recipe => [recipe.recipe_id, recipe]));

  const pilaf = recipes.get('yutian-electric-cooker-lamb-pilaf');
  const yutian = pilaf?.source_refs.find(source => (
    source.source_id === 'yutian-electric-cooker-lamb-pilaf'
  ));
  const ili = pilaf?.source_refs.find(source => source.source_id === 'S-XJ-ILI-1');
  const regional = pilaf?.source_refs.find(source => source.source_id === 'S-XJ-REGION-1');
  assert.ok(yutian?.claim_scopes.includes('quantity'));
  assert.ok(yutian?.claim_scopes.includes('time'));
  assert.ok(ili?.claim_scopes.includes('time'));
  assert.deepEqual(regional?.claim_scopes, [
    'identity', 'ingredients', 'liquid', 'process', 'appliance', 'time',
  ]);
  assert.match(pilaf?.evidence_notes ?? '', /20分钟.*40分钟.*1\.5小时/u);
  assert.equal(pilaf?.fixed_batch, null, 'rice amount remains unspecified');
  assert.equal(pilaf?.time_contract, null, 'different appliance timelines stay separate');

  const curry = recipes.get('joyoung-curry-chicken-rice-jrc-4hp82');
  assert.deepEqual(curry?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 528, unit: 'g' },
    source_ids: ['joyoung-curry-chicken-rice-jrc-4hp82'],
  });
  assert.equal(curry?.cooking_sequence.length, 2);
  assert.deepEqual(curry?.safety_endpoints, [{
    code: 'poultry_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.equal(curry?.fixed_batch, null, 'manual does not state servings');
  assert.equal(curry?.time_contract, null, 'bilingual program conflict and duration remain unresolved');
  assert.ok(curry?.source_refs.find(source => source.source_id === 'S-SAFETY-TEMPERATURES-1'));

  const shanghai = recipes.get('shanghai-salted-pork-vegetable-rice');
  assert.equal(shanghai?.status, 'recipe_fact_checked');
  assert.equal(shanghai?.fixed_batch?.servings, 4);
  assert.deepEqual(shanghai?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 1.25, unit: '杯' },
    source_ids: ['S-WOL-SHANGHAI-CAIFAN-1'],
  });
  assert.deepEqual(shanghai?.time_contract, {
    total_minutes: 60,
    source_ids: ['S-WOL-SHANGHAI-CAIFAN-1'],
  });

  for (const recipeId of [
    'cantonese-cured-meat-claypot-rice',
    'cantonese-mushroom-chicken-claypot-rice',
  ]) {
    const recipe = recipes.get(recipeId);
    assert.ok(recipe?.source_refs.find(source => source.source_id === 'S-GD-3'));
    assert.ok(recipe?.source_refs.find(source => source.source_id === 'S-GD-KAIPING-1'));
    assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
  }

  const curedMeat = recipes.get('cantonese-cured-meat-claypot-rice');
  const yangpu = curedMeat?.source_refs.find(source => source.source_id === 'S-GD-YANGPU-1');
  assert.deepEqual(yangpu?.claim_scopes, [
    'identity', 'ingredients', 'liquid', 'process', 'appliance', 'time',
  ]);
  assert.match(curedMeat?.evidence_notes ?? '', /200克水.*中火8分钟.*小火.*15分钟/u);
  assert.deepEqual(curedMeat?.liquid_contract, {
    kind: 'rice_to_water_ratio',
    amount: { value: 1.3, unit: '杯水/杯米' },
    source_ids: ['S-TW-AFA-CURED-RICE-1'],
  });
  assert.equal(curedMeat?.time_contract, null, 'the source does not close the full preparation timeline');
});

test('records the Joyoung bilingual program conflict instead of choosing a convenient cooker mode', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'joyoung-curry-chicken-rice-jrc-4hp82'
  ));
  const manual = recipe?.source_refs.find(source => (
    source.source_id === 'joyoung-curry-chicken-rice-jrc-4hp82'
  ));

  assert.match(
    manual?.evidence_locator ?? '',
    /Chapter 8.*Curry Chicken Rice.*page 11\/27.*咖喱鸡肉饭.*page 24\/27/u,
  );
  assert.match(recipe?.evidence_notes ?? '', /英文.*Slow cook.*中文.*White rice/u);
  assert.doesNotMatch(JSON.stringify(recipe?.cooking_sequence), /Slow cook|White rice|柴火饭|精煮饭/u);
  assert.deepEqual(recipe?.liquid_contract?.amount, { value: 528, unit: 'g' });
  assert.equal(recipe?.time_contract, null);
});

test('structures the fixed National Health Insurance cabbage-rice version without inventing a cooker duration', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'taiwan-cabbage-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-TW-NHI-CABBAGE-1');

  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(source?.claim_scopes, [
    'identity', 'ingredients', 'quantity', 'liquid', 'process', 'appliance', 'time',
  ]);
  assert.equal(recipe?.fixed_batch?.servings, 3);
  assert.deepEqual(
    recipe?.fixed_batch?.ingredients.find(item => item.name === '白米')?.amount,
    { value: 1.5, unit: '杯' },
  );
  assert.deepEqual(
    recipe?.fixed_batch?.ingredients.find(item => item.name === '五花肉')?.amount,
    { value: 200, unit: 'g' },
  );
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 1.5, unit: '杯' },
    source_ids: ['S-TW-NHI-CABBAGE-1'],
  });
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.equal(recipe?.time_contract, null, 'automatic cooker-cycle duration is not stated');
  assert.deepEqual(
    recipe?.safety_endpoints.map(endpoint => endpoint.code).sort(),
    ['pork_fully_cooked', 'shellfish_fully_cooked'],
  );
  const shellfishEndpoint = recipe?.safety_endpoints.find(endpoint => (
    endpoint.code === 'shellfish_fully_cooked'
  ));
  assert.equal(shellfishEndpoint?.minimum_core_temperature_c, undefined);
  assert.equal(shellfishEndpoint?.visual_endpoint, '肉质呈珍珠白或白色且不透明');
  assert.ok(recipe?.allergen_labels.includes('甲壳类'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures only the supported liquid time and safety facts for mushroom bamboo-shoot rice', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'taiwan-mushroom-bamboo-shoot-rice'
  ));

  assert.equal(recipe?.fixed_batch, null, 'source gives quantities but does not state servings');
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 1, unit: '杯' },
    source_ids: ['S-TW-3'],
  });
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.deepEqual(recipe?.time_contract, {
    total_minutes: 30,
    source_ids: ['S-TW-3'],
  });
  assert.deepEqual(
    recipe?.safety_endpoints.map(endpoint => endpoint.code).sort(),
    ['pork_fully_cooked', 'shellfish_fully_cooked'],
  );
  const shellfishEndpoint = recipe?.safety_endpoints.find(endpoint => (
    endpoint.code === 'shellfish_fully_cooked'
  ));
  assert.equal(shellfishEndpoint?.minimum_core_temperature_c, undefined);
  assert.equal(shellfishEndpoint?.visual_endpoint, '肉质呈珍珠白或白色且不透明');
  assert.ok(recipe?.allergen_labels.includes('甲壳类'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the official pumpkin-rice liquid and process without inventing servings or total time', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'taiwan-pumpkin-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'taiwan-afa-pumpkin-rice');

  assert.equal(recipe?.fixed_batch, null, 'source gives ingredient quantities but no servings');
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'rice_to_water_ratio',
    amount: { value: 0.8, unit: '杯水/杯米' },
    source_ids: ['taiwan-afa-pumpkin-rice'],
  });
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /泡水半小时/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /猪绞肉.*炒熟/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /焖15分钟/);
  assert.equal(recipe?.time_contract, null, 'the source gives stage times but no complete total duration');
  assert.deepEqual(
    recipe?.safety_endpoints.map(endpoint => endpoint.code).sort(),
    ['pork_fully_cooked', 'shellfish_fully_cooked'],
  );
  assert.equal(source?.claim_scopes.includes('time'), true);
  assert.ok(recipe?.allergen_labels.includes('甲壳类'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures a fixed Shanghai salted-pork vegetable-rice source contract without claiming an electric-cooker adaptation', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'shanghai-salted-pork-vegetable-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-WOL-SHANGHAI-CAIFAN-1');

  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.fixed_batch, {
    servings: 4,
    ingredients: [
      { name: '大米', amount: { value: 1, unit: '杯' }, source_ids: ['S-WOL-SHANGHAI-CAIFAN-1'] },
      { name: '咸肉', amount: { value: 0.25, unit: '杯' }, source_ids: ['S-WOL-SHANGHAI-CAIFAN-1'] },
      { name: '猪油（或培根油/食用油）', amount: { value: 1, unit: '汤匙' }, source_ids: ['S-WOL-SHANGHAI-CAIFAN-1'] },
      { name: '食用油', amount: { value: 1, unit: '汤匙' }, source_ids: ['S-WOL-SHANGHAI-CAIFAN-1'] },
      { name: '姜', amount: { value: 0.5, unit: '茶匙' }, source_ids: ['S-WOL-SHANGHAI-CAIFAN-1'] },
      { name: '小青菜', amount: { value: 225, unit: '克' }, source_ids: ['S-WOL-SHANGHAI-CAIFAN-1'] },
    ],
    source_ids: ['S-WOL-SHANGHAI-CAIFAN-1'],
  });
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 1.25, unit: '杯' },
    source_ids: ['S-WOL-SHANGHAI-CAIFAN-1'],
  });
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /浸泡.*45.*60分钟/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /咸肉.*猪油.*沸腾/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /青菜.*8分钟.*5分钟/);
  assert.deepEqual(recipe?.time_contract, {
    total_minutes: 60,
    source_ids: ['S-WOL-SHANGHAI-CAIFAN-1'],
  });
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(source?.claim_scopes.includes('appliance'));
  assert.ok(source?.claim_scopes.includes('time'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the Panasonic fresh-shiitake rice contract while retaining its model-specific program boundary', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'panasonic-fresh-shiitake-rice-sr-afg'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'panasonic-fresh-shiitake-rice-sr-afg');

  assert.equal(recipe?.fixed_batch, null, 'the manual gives a one-cup recipe but no servings');
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 1, unit: '杯' },
    source_ids: ['panasonic-fresh-shiitake-rice-sr-afg'],
  });
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /1杯水.*浸泡.*15分钟/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /香菇丝.*鸡肉丝.*铺/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /煲仔饭/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /芹菜.*余温焖5分钟/);
  assert.equal(recipe?.time_contract, null, 'the manual does not state the complete program duration');
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'poultry_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.equal(source?.claim_scopes.includes('time'), true);
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.match(recipe?.cooker_adaptation?.notes ?? '', /SR-AFG/);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the Zojirushi minced-pork greens rice waterline without collapsing its four-to-five-serving range', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'zojirushi-minced-pork-greens-rice-nl-erh'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'zojirushi-minced-pork-greens-rice-nl-erh');

  assert.equal(recipe?.fixed_batch, null, 'the manual states 4–5 servings, not one fixed serving count');
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'waterline',
    waterline: {
      appliance_model: 'ZOJIRUSHI NL-ERH10C / NL-ERH18C',
      scale: 'white_rice',
      mark: 3,
    },
    source_ids: ['zojirushi-minced-pork-greens-rice-nl-erh'],
  });
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /猪肉糜.*青菜.*炒熟/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /汤汁和水.*白米.*3/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /铺平.*不搅拌/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /煮饭结束.*搅拌/);
  assert.equal(recipe?.time_contract, null, 'the source does not provide a complete program duration');
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'pork_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.ok(source?.claim_scopes.includes('appliance'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the official Zojirushi fresh-vegetable bamboo rice process without inventing a serving count or cross-model water volume', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'zojirushi-fresh-vegetable-bamboo-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'zojirushi-fresh-vegetable-bamboo-rice');

  assert.equal(recipe?.fixed_batch, null, 'the official page states 4–5 servings');
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'waterline',
    waterline: {
      appliance_model: '搭载“什锦饭”菜单且有白米3水位线的象印机型',
      scale: 'white_rice',
      mark: 3,
    },
    source_ids: ['zojirushi-fresh-vegetable-bamboo-rice'],
  });
  assert.equal(recipe?.cooking_sequence.length, 5);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /木耳.*泡发.*1小时/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /肉糜.*洋葱.*胡萝卜.*竹笋/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /白米.*白米3.*水位/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /铺入.*不搅拌.*什锦饭/);
  assert.match(recipe?.cooking_sequence[4]?.instruction ?? '', /结束.*拌匀/);
  assert.equal(recipe?.time_contract, null, 'the official page does not state a complete program duration');
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'pork_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.ok(source?.claim_scopes.includes('quantity'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the official Zojirushi beef mixed-rice waterline and ground-beef safety endpoint', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'zojirushi-beef-mixed-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'zojirushi-beef-mixed-rice');

  assert.equal(recipe?.fixed_batch, null, 'the official page states 4–5 servings');
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'waterline',
    waterline: {
      appliance_model: '搭载“什锦饭”菜单且有白米3水位线的象印机型',
      scale: 'white_rice',
      mark: 3,
    },
    source_ids: ['zojirushi-beef-mixed-rice'],
  });
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /白米.*盐.*胡萝卜泥.*洋葱.*牛肉糜.*黄油.*不搅拌/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /结束.*拌匀/);
  assert.equal(recipe?.time_contract, null, 'the official page does not state a complete program duration');
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'beef_fully_cooked',
    minimum_core_temperature_c: 71,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.ok(source?.claim_scopes.includes('appliance'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the Panasonic mixed-chicken rice quantities and four-cup liquid without inventing servings or a cross-model runtime', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'panasonic-mixed-chicken-rice-sr-df151'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'panasonic-mixed-chicken-rice-sr-df151');

  assert.equal(recipe?.fixed_batch, null, 'the manual gives ingredient quantities but no servings');
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 4, unit: '杯' },
    source_ids: ['panasonic-mixed-chicken-rice-sr-df151'],
  });
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /鸡肉.*牛蒡.*焯/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /米.*4杯水/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /料酒.*酱油.*盐.*其余材料.*合盖/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /精煮/);
  assert.equal(recipe?.time_contract, null, 'the manual does not state the complete program duration');
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'poultry_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.ok(source?.claim_scopes.includes('quantity'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the Joyoung lazy braised-rice liquid and layering process while leaving sausage safety unresolved', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'joyoung-mixed-sausage-vegetable-rice-jrc-4hp82'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'joyoung-mixed-sausage-vegetable-rice-jrc-4hp82');

  assert.equal(recipe?.fixed_batch, null, 'the manual gives 3 cups but no servings');
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 528, unit: 'g' },
    source_ids: ['joyoung-mixed-sausage-vegetable-rice-jrc-4hp82'],
  });
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /香肠.*香菇.*胡萝卜.*青豆.*玉米/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /420克.*528克水/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /White rice|柴火饭/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /葱花.*搅拌/);
  assert.equal(recipe?.time_contract, null, 'the manual gives no complete recipe duration for this menu');
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.match(recipe?.evidence_notes ?? '', /香肠.*安全|安全.*香肠/);
  assert.ok(source?.claim_scopes.includes('appliance'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the official tongzai rice-cake quantities and staged steaming without hiding its time conflict', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'taiwan-tongzai-rice-cake'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-TW-4');

  assert.equal(recipe?.fixed_batch, null, 'the source gives ingredient amounts but no servings');
  assert.equal(recipe?.liquid_contract, null, 'the glaze water is not a rice-cooking liquid contract');
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /长糯米.*2小时.*15分钟/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /金钩虾.*香菇.*红葱头/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /猪绞肉.*颜色变白/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /蒸筒.*5分钟/);
  assert.equal(recipe?.time_contract, null, 'the page time conflicts with its two-hour soak and staged steaming');
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'pork_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.ok(source?.claim_scopes.includes('quantity'));
  assert.ok(source?.claim_scopes.includes('process'));
  assert.match(recipe?.evidence_notes ?? '', /30分钟.*2小时|2小时.*30分钟/);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the direct official mushroom-chicken claypot-rice quantities while retaining its vessel and permission boundary', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'cantonese-mushroom-chicken-claypot-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-GD-TAFT-CHICKEN-RICE-1');

  assert.equal(recipe?.fixed_batch, null, 'the source gives ingredient quantities but no servings');
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 2.5, unit: '杯' },
    source_ids: ['S-GD-TAFT-CHICKEN-RICE-1'],
  });
  assert.equal(recipe?.cooking_sequence.length, 5);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /白米.*1\.5杯.*煲饭酱/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /鸡腿.*香菇.*鸡蛋.*20分钟/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /2\.5杯水.*煮滚/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /材料.*20几分钟.*翻面/);
  assert.match(recipe?.cooking_sequence[4]?.instruction ?? '', /鸡肉有熟.*煲饭酱汁/);
  assert.equal(recipe?.time_contract, null, 'the source gives an approximate stage duration, not a complete total');
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'poultry_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.equal(source?.license, 'permission_required');
  assert.ok(source?.claim_scopes.includes('quantity'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the Cookpot IH black-bean pork-rib rice schedule without turning a cooker countdown into a total time', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'cantonese-black-bean-pork-rib-claypot-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-GD-COOKPOT-BLACK-BEAN-RIB-RICE-1');

  assert.equal(recipe?.fixed_batch, null, 'the source reports a four-to-five-person range, not one fixed serving count');
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 3.6, unit: '杯' },
    source_ids: ['S-GD-COOKPOT-BLACK-BEAN-RIB-RICE-1'],
  });
  assert.equal(recipe?.cooking_sequence.length, 6);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /长秈米.*3杯/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /小排.*2厘米/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /豆豉.*腌.*30分钟/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /3\.6杯水.*蒸架/);
  assert.match(recipe?.cooking_sequence[4]?.instruction ?? '', /煲仔饭.*模式/);
  assert.match(recipe?.cooking_sequence[5]?.instruction ?? '', /倒数30分钟.*倒入饭里/);
  assert.equal(recipe?.time_contract, null, 'the page gives preparation time and a countdown point, not a complete cooker duration');
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'pork_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'C',
    roles: ['carbohydrate', 'protein'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.match(recipe?.cooker_adaptation?.notes ?? '', /IH/);
  assert.ok(source?.claim_scopes.includes('appliance'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the official Kongganfan parboil-and-return process without inventing a rice-cooker contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'sichuan-kongganfan'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-SC-CPPCC-KONGGANFAN-1');

  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /大米.*半熟.*沥水/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /豌豆.*四季豆.*洋芋.*翻炒/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /倒入.*滤干.*米饭/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /盖上锅盖.*文火.*孔.*熟/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.match(recipe?.cooker_adaptation?.notes ?? '', /电饭/);
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(source?.claim_scopes.includes('identity'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the Ningxia rouzhanfan identity and cook sequence without inventing missing quantities', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'ningxia-wuzhong-rouzhanfan'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-NX-AGRI-ROUZHANFAN-2024-1');

  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /牛肉或羊肉.*洋葱.*胡萝卜.*炒制/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /米饭.*同蒸/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /半固体.*粘饭/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(source?.claim_scopes.includes('identity'));
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the official Shidian pea-potato-ham rice sequence without promoting a wood-fired pot to cooker equivalence', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'yunnan-shidian-pea-potato-ham-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-YN-1');

  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /火腿.*切丁.*煸出油脂/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /青豌豆米.*土豆丁.*大米.*拌匀/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /罗锅.*柴火.*慢焖/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(source?.claim_scopes.includes('appliance'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('keeps the Tongren seasonal shefan as a separate regional identity with its half-hour steaming evidence', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'guizhou-tongren-shefan'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-GZ-TONGREN-SHEFAN-1');
  const variantSource = recipe?.source_refs.find(item => item.source_id === 'S-GZ-TONGREN-SHEFAN-2');

  assert.equal(recipe?.canonical_name, '铜仁社饭');
  assert.deepEqual(recipe?.region_codes, ['CN-GZ']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /青蒿.*野葱.*洗.*切/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /豆腐干.*腊肉.*切成丁.*糯米.*黏米/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /花生.*黄豆.*豆腐干丁.*腊肉丁.*青蒿.*野葱/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /拌匀.*蒸.*半小时/);
  assert.equal(recipe?.time_contract, null, 'the source gives a steaming stage, not a complete preparation time');
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(source?.claim_scopes.includes('appliance'));
  assert.equal(variantSource?.access_status, 'opened');
  assert.ok(variantSource?.claim_scopes.includes('process'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('keeps the official cured-meat claypot-rice variant separate while structuring its exact ratio', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'cantonese-cured-meat-claypot-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-TW-AFA-CURED-RICE-1');

  assert.deepEqual(source?.claim_scopes, [
    'ingredients', 'quantity', 'liquid', 'process', 'appliance', 'time',
  ]);
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'rice_to_water_ratio',
    amount: { value: 1.3, unit: '杯水/杯米' },
    source_ids: ['S-TW-AFA-CURED-RICE-1'],
  });
  assert.ok(recipe?.cooking_sequence.length >= 4);
  assert.equal(recipe?.fixed_batch, null, 'official variant does not state servings');
  assert.equal(recipe?.time_contract, null, 'listed stages do not state complete preparation time');
  assert.match(recipe?.evidence_notes ?? '', /农粮署.*独立版本.*不与.*杨浦/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('locks each retained national candidate to its exact supported source, vessel, and core-ingredient boundary', () => {
  // Treating process facts as vessels or core ingredients, or drifting provenance, must make this fail.
  const recipes = new Map(sourceBackedCatalog().recipes.map(recipe => [recipe.recipe_id, recipe]));
  const expected = {
    'yutian-electric-cooker-lamb-pilaf': {
      canonicalName: '手抓饭',
      status: 'recipe_fact_checked',
      vessels: ['炉上有盖锅', '电饭锅'],
      ingredients: ['鲜羊肉', '胡萝卜', '洋葱', '油脂', '米'],
      sources: [
        ['yutian-electric-cooker-lamb-pilaf', '于田抓饭做法', '新疆和田地区于田县人民政府', 'https://www.xjyt.gov.cn/changyou/chi/2021-06-07/251.html', ['identity', 'ingredients', 'quantity', 'process', 'appliance', 'time']],
        ['S-XJ-ILI-1', '手抓饭', '伊犁哈萨克自治州人民政府', 'https://www.xjyl.gov.cn/xjylz/c112874/201811/7095a8856ee44c7eb86791f76602e0ed.shtml', ['identity', 'ingredients', 'process', 'appliance', 'time']],
        ['S-XJ-REGION-1', '新疆抓饭', '新疆维吾尔自治区人民政府', 'https://www.xinjiang.gov.cn/xinjiang/tsxj/201111/358fd2c0b97841bba6513661c11d770c.shtml', ['identity', 'ingredients', 'liquid', 'process', 'appliance', 'time']],
      ],
    },
    'ningxia-wuzhong-rouzhanfan': {
      canonicalName: '肉粘饭',
      status: 'recipe_fact_checked',
      vessels: [],
      ingredients: ['宁夏大米', '牛肉或羊肉', '洋葱', '胡萝卜'],
      sources: [
        ['S-NX-1', '不尝一次宁夏大米，难以给胃一个交代！', '宁夏回族自治区农业农村厅（农宣中心）', 'https://nynct.nx.gov.cn/rdzt/ppny/202211/t20221103_3829781.html', ['identity', 'ingredients', 'process']],
        ['S-NX-AGRI-ROUZHANFAN-2024-1', '2024年第一顿必吃它，香甜软糯油润喷香！', '宁夏回族自治区农业农村厅（农业宣传教育展览中心）', 'https://nynct.nx.gov.cn/rdzt/ppny/202403/t20240307_4478445.html', ['identity', 'ingredients', 'process']],
      ],
    },
    'yunnan-shidian-pea-potato-ham-rice': {
      canonicalName: '豌豆洋芋火腿焖饭',
      status: 'recipe_fact_checked',
      vessels: ['罗锅'],
      ingredients: ['火腿', '青豌豆仁', '洋芋', '米'],
      sources: [['S-YN-1', '来老麦解锁青豌豆的N种“鲜”吃法', '施甸县人民政府门户网站 / 施甸融媒体中心', 'https://shidian.gov.cn/info/1111/3792183.htm', ['identity', 'ingredients', 'process', 'appliance']]],
    },
    'sichuan-kongganfan': {
      canonicalName: '孔干饭',
      status: 'recipe_fact_checked',
      vessels: ['炉上锅'],
      ingredients: ['米', '腊肉', '豆角', '洋芋'],
      sources: [
        ['S-SC-1', '曾颖：孔干饭', '四川省作家协会网站（页面标注来源四川日报）', 'https://www.sczjw.net.cn/read/detail/11028.html', ['identity', 'ingredients', 'liquid', 'process', 'appliance']],
        ['S-SC-CPPCC-KONGGANFAN-1', '古蜀先民“菜篮子”里都有啥？', '中国人民政治协商会议黑龙江省委员会办公厅（转载人民政协网）', 'https://www.hljzx.gov.cn/contents/68/7320.html', ['identity', 'ingredients', 'process']],
      ],
    },
    'hubei-enshi-shefan': {
      canonicalName: '社饭',
      status: 'recipe_fact_checked',
      vessels: ['甑'],
      ingredients: ['香蒿', '糯米', '腊肉', '豆干', '蒜苗'],
      sources: [
        ['S-HB-1', '恩施社节', '恩施州人民政府门户网站', 'https://www.enshi.gov.cn/ly/mswh/202203/t20220322_1267844.shtml', ['identity', 'ingredients']],
        ['S-HB-FORESTRY-SHEFAN-1', '体验民风民俗 感受传统韵味', '国家林业和草原局', 'https://www.forestry.gov.cn/c/www/xxyd/26633.jhtml', ['identity', 'ingredients', 'process', 'appliance']],
      ],
    },
  };

  for (const [recipeId, expectedRecipe] of Object.entries(expected)) {
    const recipe = recipes.get(recipeId);
    assert.equal(recipe?.canonical_name, expectedRecipe.canonicalName, recipeId);
    assert.equal(recipe?.status, expectedRecipe.status, recipeId);
    assert.deepEqual(recipe?.traditional_vessels, expectedRecipe.vessels, recipeId);
    assert.deepEqual(recipe?.core_ingredients, expectedRecipe.ingredients, recipeId);
    assert.deepEqual(recipe?.source_refs.map(source => [
      source.source_id, source.title, source.publisher, source.url, source.claim_scopes,
    ]), expectedRecipe.sources, recipeId);
    assert.ok(recipe?.source_refs.every(source => source.url.startsWith('https://')), recipeId);
  }

  const xinjiang = recipes.get('yutian-electric-cooker-lamb-pilaf');
  assert.match(xinjiang?.evidence_notes ?? '', /伊犁.*炉上/u);
  assert.match(xinjiang?.evidence_notes ?? '', /于田.*电饭锅/u);
  assert.match(xinjiang?.cooker_adaptation?.notes ?? '', /伊犁.*炉上有盖锅/u);
  assert.match(xinjiang?.cooker_adaptation?.notes ?? '', /于田.*电饭锅/u);
  assert.equal(xinjiang?.fixed_batch, null);
  assert.equal(xinjiang?.liquid_contract, null);
  assert.equal(xinjiang?.cooking_sequence.length, 5);
  assert.equal(xinjiang?.time_contract, null);
  assert.deepEqual(xinjiang?.safety_endpoints, []);
});

test('structures the Yutian electric-cooker hand-grab-rice sequence while keeping its unresolved rice and liquid facts explicit', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'yutian-electric-cooker-lamb-pilaf'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'yutian-electric-cooker-lamb-pilaf');

  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null, 'the source says 1:2 without identifying the compared quantities');
  assert.equal(recipe?.cooking_sequence.length, 5);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /大米.*泡.*半个小时.*羊肉.*胡萝卜.*洋葱/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /洋葱.*羊肉.*翻炒/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /羊肉.*煮.*10分钟/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /泡好的米.*均匀撒在上面/);
  assert.match(recipe?.cooking_sequence[4]?.instruction ?? '', /电饭锅.*焖.*20分钟/);
  assert.equal(recipe?.time_contract, null, 'the cooker step is not a complete total-time contract');
  assert.equal(recipe?.nutrition_structure?.grade, 'B');
  assert.deepEqual(recipe?.nutrition_structure?.roles, ['carbohydrate', 'protein', 'fiber']);
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.ok(source?.claim_scopes.includes('appliance'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('merges Ili hand-grab-rice evidence into the existing Xinjiang identity without blending cooker contracts', () => {
  // Splitting the identity into a duplicate or turning two limited sources into a recipe contract must fail.
  const recipes = sourceBackedCatalog().recipes;
  const xinjiang = recipes.filter(recipe => recipe.recipe_id === 'yutian-electric-cooker-lamb-pilaf');
  assert.equal(xinjiang.length, 1);
  assert.equal(xinjiang[0].canonical_name, '手抓饭');
  assert.deepEqual(xinjiang[0].aliases, ['抓饭', '波罗']);
  assert.ok(xinjiang[0].source_refs.some(source => source.source_id === 'S-XJ-ILI-1'));
  assert.ok(xinjiang[0].source_refs.some(source => source.source_id === 'yutian-electric-cooker-lamb-pilaf'));
  assert.equal(recipes.some(recipe => recipe.recipe_id === 'xinjiang-ili-shouzhua-fan'), false);
  assert.equal(xinjiang[0].fixed_batch, null);
  assert.equal(xinjiang[0].liquid_contract, null);
  assert.equal(xinjiang[0].cooking_sequence.length, 5);
  assert.equal(xinjiang[0].time_contract, null);
  assert.deepEqual(xinjiang[0].safety_endpoints, []);
});

test('structures the Enshi shefan process from the forestry authority excerpt without inventing quantities', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'hubei-enshi-shefan'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-HB-FORESTRY-SHEFAN-1');

  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /腊肉丁.*豆干丁.*蒜苗.*浸泡过的糯米.*搅拌均匀/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /上甑蒸熟/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'C',
    roles: ['carbohydrate', 'protein'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'search_extract_opened');
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Wa chicken lanfan as a source-backed mixed rice identity without inventing a cooker contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'yunnan-wa-chicken-lanfan'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-YN-WA-CHICKEN-LANFAN-1');

  assert.equal(recipe?.canonical_name, '佤族鸡肉烂饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['大米', '鸡肉']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /大米.*鸡肉.*同锅煮/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'poultry_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'search_extract_opened');
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the sourced spring-bamboo cured-meat rice process without promoting an ambiguous 15-minute label', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'shanghai-spring-bamboo-cured-meat-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-SH-SPRING-BAMBOO-CURED-RICE-1');

  assert.equal(recipe?.canonical_name, '春笋腊味饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['大米', '雷笋', '腊肠', '五花咸肉', '青豆']);
  assert.equal(recipe?.fixed_batch, null, 'source gives amounts but no serving count');
  assert.equal(recipe?.liquid_contract, null, 'source only says to add an unspecified amount of water');
  assert.equal(recipe?.cooking_sequence.length, 5);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /雷笋.*(?:剥.*壳|去壳)/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /腊肠.*咸肉.*切/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /大米.*电饭煲.*清水/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /焯烫.*2分钟/);
  assert.match(recipe?.cooking_sequence[4]?.instruction ?? '', /咸肉.*腊肠.*雷笋.*青豆.*电饭煲/);
  assert.equal(recipe?.time_contract, null, 'source labels 15 minutes but does not define whether rice cooking is included');
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'pork_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('appliance'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('keeps Yangzhou fried rice as a named source-backed identity rather than a generic fried-rice combination', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'yangzhou-standard-fried-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-JS-YANGZHOU-FRIED-RICE-STANDARD-1');

  assert.equal(recipe?.canonical_name, '扬州炒饭');
  assert.equal(recipe?.status, 'identity_verified');
  assert.deepEqual(recipe?.core_ingredients, [
    '籼米饭', '鲜鸡蛋', '水发海参', '熟地方鸡腿肉', '中国火腿肉',
    '水发干贝', '上浆湖虾仁', '水发花菇', '净鲜笋', '青豌豆',
  ]);
  assert.deepEqual(recipe?.cooking_sequence, []);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients']);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Ezhou Sanshanhu steamed fish rice as a named fish-and-rice identity without inventing cooker parameters', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'ezhou-sanshanhu-steamed-fish-rice'
  ));
  const processSource = recipe?.source_refs.find(item => item.source_id === 'S-HB-EZHOU-FANZHENGYU-1');
  const identitySource = recipe?.source_refs.find(item => item.source_id === 'S-HB-EZHOU-TOP10-1');

  assert.equal(recipe?.canonical_name, '三山湖饭蒸鱼');
  assert.deepEqual(recipe?.aliases, ['饭蒸鱼']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['刁子鱼', '新米']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /湖鱼.*腌制.*风干/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /浸透水的新米/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /鱼.*米.*同蒸|鱼脂.*米芯/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'seafood_fully_cooked',
    minimum_core_temperature_c: 63,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'C',
    roles: ['carbohydrate', 'protein'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(processSource?.access_status, 'opened');
  assert.equal(identitySource?.access_status, 'search_extract_opened');
  assert.ok(processSource?.claim_scopes.includes('process'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Taiwan Yiye Banyue oil rice as a named multi-stage rice dish without treating it as a one-pot cooker contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'taiwan-yiyebanyue-oil-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-TW-AFA-YIYE-BANYUE-OIL-RICE-1');

  assert.equal(recipe?.canonical_name, '一叶弥月油饭');
  assert.deepEqual(recipe?.aliases, ['一葉彌月油飯']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['糯米', '香菇', '肉丝', '虾米', '鱿鱼']);
  assert.equal(recipe?.fixed_batch, null, 'the source gives ingredient weights but no servings');
  assert.equal(recipe?.liquid_contract, null, 'the source does not specify a measured cooking liquid');
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /糯米.*泡水4[至到]6小时.*蒸成糯米饭/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /香菇.*魷魚|香菇.*鱿鱼/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /虾米.*鱿鱼丝.*猪肉丝.*炒熟.*糯米饭/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /三角形.*包/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, [
    { code: 'pork_fully_cooked', minimum_core_temperature_c: 74, source_ids: ['S-SAFETY-TEMPERATURES-1'] },
    { code: 'shellfish_fully_cooked', visual_endpoint: '肉质呈珍珠白或白色且不透明', source_ids: ['S-SAFETY-TEMPERATURES-1'] },
  ]);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'C',
    roles: ['carbohydrate', 'protein'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('quantity'));
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Taishan caiguo rice as a named non-electric regional rice dish with its cured-meat and vegetable sequence', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'taishan-caiguo-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-GD-TAISHAN-CAIGUO-RICE-1');

  assert.equal(recipe?.canonical_name, '台山菜果饭');
  assert.deepEqual(recipe?.aliases, ['菜果饭']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['丝苗米', '菜果（苤蓝）', '腊味', '海虾米', '香芹']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /菜果.*苤蓝/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /腊味.*煸炒.*菜果丁.*翻炒/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /丝苗米.*煮好的米饭.*拌匀/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /瓦煲.*小火慢焖/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'shellfish_fully_cooked',
    visual_endpoint: '肉质呈珍珠白或白色且不透明',
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures the Dongzhi electric-pot guoba rice facts without inventing servings, bottle volume, or runtime', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'dongzhi-guoba-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-AH-DONGZHI-GUOBA-RICE-1');

  assert.equal(recipe?.canonical_name, '东至农家锅巴饭');
  assert.deepEqual(recipe?.aliases, ['东至锅巴饭']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['香米', '红心芋', '红芋粉蒸肉生坯']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /红心芋.*一厘米厚/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /黑猪前腿肉.*350克.*红芋粉/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /香米.*750克.*电锅.*煮饭键/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /米饭进入干水.*红心芋.*红芋粉蒸肉生坯.*饭熟/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'pork_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'C',
    roles: ['carbohydrate', 'protein'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'search_extract_opened');
  assert.ok(source?.claim_scopes.includes('quantity'));
  assert.ok(source?.claim_scopes.includes('liquid'));
  assert.ok(source?.claim_scopes.includes('appliance'));
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures Tengchong Beihai copper-pot potato rice without inventing quantities or electric-cooker equivalence', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'tengchong-copper-pot-potato-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-YN-TENGCHONG-COPPER-POT-POTATO-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '腾冲北海铜锅洋芋饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.region_codes, ['CN-YN']);
  assert.deepEqual(recipe?.core_ingredients, ['米', '洋芋', '绿豆', '腊肉']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /洋芋.*切成小块.*炒至入味/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /米.*铜锅.*慢煮/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /洋芋.*绿豆.*腊肉.*继续煮/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /饭熟.*锅巴.*焦黄/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'unassessed',
    roles: [],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('identity'));
  assert.ok(source?.claim_scopes.includes('ingredients'));
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(source?.claim_scopes.includes('appliance'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures Mizhi lamb dingding rice from the county government page without inventing quantities or cooker parameters', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'mizhi-lamb-diced-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-SN-MIZHI-LAMB-DINGDING-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '米脂羊肉丁丁饭');
  assert.deepEqual(recipe?.aliases, ['肉丁丁饭', '羊肉丁丁饭']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.region_codes, ['CN-SN']);
  assert.deepEqual(recipe?.core_ingredients, ['小米', '羊肉', '羊肉汤']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /炖羊肉.*捞出.*过滤羊肉汤/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /碎羊肉.*加入适量的水/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /经验.*一定比例.*小米/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /大约一个时辰.*做熟/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'C',
    roles: ['carbohydrate', 'protein'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('identity'));
  assert.ok(source?.claim_scopes.includes('ingredients'));
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(source?.claim_scopes.includes('time'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures Nanjing aijiaohuang duck rice from the local gazette office without collapsing duck safety or cooker facts', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'nanjing-aijiaohuang-duck-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-JS-NANJING-AIJIAOHUANG-DUCK-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '南京矮脚黄板鸭菜饭');
  assert.deepEqual(recipe?.aliases, ['南京菜饭', '矮脚黄板鸭菜饭']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.region_codes, ['CN-JS']);
  assert.deepEqual(recipe?.core_ingredients, ['糯米', '矮脚黄', '板鸭丁', '生姜']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /矮脚黄.*板鸭丁.*生姜粒.*糯米.*一起煮/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'unassessed',
    roles: [],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(recipe?.evidence_notes.includes('生熟状态'));
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('identity'));
  assert.ok(source?.claim_scopes.includes('ingredients'));
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('structures Banshan Lixia wild rice from the national intangible-heritage page without inventing a batch or cooker conversion', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'banshan-lixia-wild-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-ZJ-BANSHAN-LIXIA-WILD-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '半山立夏野米饭');
  assert.deepEqual(recipe?.aliases, ['立夏野米饭', '烧野米饭']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.region_codes, ['CN-ZJ']);
  assert.deepEqual(recipe?.core_ingredients, ['米', '鸡蛋', '韭菜']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /鸡蛋.*米.*韭菜.*铁锅.*烧.*野米饭/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'unassessed',
    roles: [],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('identity'));
  assert.ok(source?.claim_scopes.includes('ingredients'));
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Shidian broad-bean ham rice as an identity-only government source without inventing its missing method', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'shidian-broad-bean-ham-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-YN-SHIDIAN-BROAD-BEAN-HAM-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '施甸蚕豆火腿焖饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.equal(recipe?.status, 'identity_verified');
  assert.deepEqual(recipe?.region_codes, ['CN-YN']);
  assert.deepEqual(recipe?.core_ingredients, ['米饭', '蚕豆', '火腿']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.deepEqual(recipe?.cooking_sequence, []);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'unassessed',
    roles: [],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('identity'));
  assert.ok(source?.claim_scopes.includes('ingredients'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('preserves HTTP, nutrition, process, and access blockers as dated regional blanks', () => {
  // Replacing blockers with invented HTTPS, balanced variants, or unproven one-pot facts must fail.
  const blanks = sourceBackedCatalog().regional_blanks;
  const expected = [
    ['CN-YN', '禄劝洋芋焖饭', /HTTP.*HTTPS/u],
    ['CN-YN', '禄劝蚕豆焖饭', /HTTP.*HTTPS/u],
    ['CN-CQ', '柴火洋芋饭', /营养|两种主食/u],
    ['MO', 'Portuguese Style Seafood Rice', /米饭状态|一锅/u],
    ['CN-GX', '宁明县电饭锅焖饭', /404/u],
    ['HK', '香港煲仔饭', /403/u],
  ];

  for (const [regionCode, candidateName, reasonPattern] of expected) {
    const blank = blanks.find(item => (
      item.region_code === regionCode && item.candidate_name === candidateName
    ));
    assert.equal(blank?.searched_at, '2026-08-02', `${regionCode}:${candidateName}`);
    assert.match(blank?.reason ?? '', reasonPattern, `${regionCode}:${candidateName}`);
  }
});
