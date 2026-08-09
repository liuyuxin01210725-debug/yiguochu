import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as validator from '../lib/source-backed-one-pot-catalog-validator.mjs';
import { buildSourceBackedOnePotArtifacts } from '../lib/source-backed-one-pot-catalog-renderer.mjs';

const directory = dirname(fileURLToPath(import.meta.url));
const toolsDirectory = dirname(directory);
const projectDirectory = dirname(toolsDirectory);
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

test('r57 collection batch records first-party vendor, institutional and regional one-pot candidates without promoting research', () => {
  const catalog = sourceBackedCatalog();
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');
  assert.equal(catalog.recipes.length, 923);
  const expected = [
    ['panasonic-taiwan-taiyu-scallop-quinoa-rice', '鯛魚干貝藜麥炊飯'],
    ['panasonic-taiwan-salmon-mushroom-rice', '鮭魚菇菇炊飯'],
    ['panasonic-taiwan-sakura-shrimp-cabbage-rice', '櫻蝦玉菜煲仔飯'],
    ['panasonic-taiwan-truffle-seafood-risotto', '松露海鮮燉飯'],
    ['panasonic-taiwan-golden-snapper-rice', '金絲鯛魚炊飯'],
    ['panasonic-taiwan-mushroom-chicken-bamboo-rice', '野菇雞肉竹筍什錦飯'],
    ['panasonic-taiwan-shiitake-bamboo-chicken-rice', '香菇竹筍雞肉炊飯'],
    ['fehd-healthy-mixed-bean-porridge', '健康雜豆粥'],
    ['fehd-cheese-asparagus-seafood-rice', '芝士蘆筍海鮮焗飯'],
    ['startsmart-corn-lean-pork-porridge', '粟米瘦肉粥'],
    ['had-vegetable-pulao', '港巴蔬菜粥'],
    ['startsmart-three-bean-egg-tofu-red-rice', '三色豆蛋絲豆腐菜粒焗紅米飯'],
    ['dongtai-salted-pork-daylily-rice', '東台咸肉黃花頭焖飯'],
    ['she-black-rice', '畲族乌饭'],
    ['qianjiang-junmi-tea', '潜江焌米茶'],
    ['taiwan-sweet-potato-salted-rice', '地瓜鹹飯'],
    ['taiwan-pork-rib-claypot-rice', '排骨煲仔飯'],
    ['panasonic-taiwan-ginseng-chicken-rice', '人蔘雞肉飯'],
    ['panasonic-taiwan-five-color-rice', '五色炊飯'],
    ['panasonic-taiwan-chicken-curry-rice', '雞腿咖哩飯'],
    ['panasonic-taiwan-beef-brisket-radish-rice', '蘿蔔牛腩飯'],
    ['panasonic-taiwan-mushroom-risotto', '和風香菇燉飯'],
    ['panasonic-taiwan-pumpkin-mushroom-chicken-brown-rice', '南瓜野菇雞肉糙米飯'],
    ['tiger-takikomi-gohan', 'Takikomi Gohan (Japanese Mixed Rice)'],
    ['tiger-cabbage-mushroom-rice', 'Cabbage and Mushroom Rice'],
    ['tiger-sweet-potato-bacon-kombu-rice', 'さつまいもの炊き込みご飯'],
    ['startsmart-seasonal-pork-congee', '時菜肉碎粥'],
    ['startsmart-tomato-chicken-congee', '番茄雞肉粥'],
    ['startsmart-quinoa-millet-corn-pork-congee', '三色藜麥小米甜粟米粒肉碎粥'],
    ['taiwan-bamboo-shoot-rice', '竹筍炊飯'],
    ['taiwan-milkfish-congee', '虱目魚粥（一）'],
    ['hechuan-yinmi-black-chicken-congee', '合川阴米乌鸡粥'],
    ['pingchuan-sanfan', '平川糁饭'],
    ['huaihua-haocai-rice', '薅菜饭', 'identity_verified'],
    ['jinning-huanglaitou-braised-rice', '黄赖头焖饭', 'identity_verified'],
    ['qingyang-yellow-millet-braised-rice', '黄米焖饭', 'identity_verified'],
    ['weihui-dashan-millet-braised-rice', '大山小米焖饭', 'identity_verified'],
    ['honghe-hani-five-color-rice', '哈尼五色彩饭', 'identity_verified'],
    ['lianping-neiguan-braised-chicken-rice', '内莞焖鸡饭', 'identity_verified'],
    ['lianping-neiguan-braised-duck-rice', '内莞焖鸭饭', 'identity_verified'],
    ['xuyi-salted-pork-rice-cracker', '盱眙咸肉菜饭锅巴制作技艺', 'identity_verified'],
    ['shenmu-gua-braised-rice', '瓜焖饭', 'identity_verified'],
  ];
  for (const [recipeId, canonicalName, expectedStatus = 'recipe_fact_checked'] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, expectedStatus, recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    if (expectedStatus === 'recipe_fact_checked') {
      assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    } else {
      assert.ok(recipe.source_refs.every(source => typeof source.access_status === 'string'), recipeId);
    }
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients), recipeId);
    if (expectedStatus === 'recipe_fact_checked') {
      assert.ok(recipe.core_ingredients.length >= 2, recipeId);
    }
    assert.ok(Array.isArray(recipe.cooking_sequence), recipeId);
    if (expectedStatus === 'identity_verified') {
      assert.equal(recipe.cooking_sequence.length, 0, recipeId);
    }
    if (expectedStatus !== 'executable') assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r58 collection batch records the next first-party, institutional and regional candidates without promoting research', () => {
  const catalog = sourceBackedCatalog();
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');
  assert.equal(catalog.recipes.length, 923);
  const expected = [
    ['tiger-usa-chicken-mushroom-rice', 'Chicken Mushroom Rice', 'recipe_fact_checked'],
    ['tiger-usa-chicken-rice-vegetables', 'Chicken and Rice With Vegetables', 'recipe_fact_checked'],
    ['tiger-usa-autumn-chicken-mushroom-green-bean-pilaf', 'Autumn Rice Pilaf with Chicken Mushroom Green Bean Casserole', 'recipe_fact_checked'],
    ['tiger-usa-asparagus-mushroom-risotto', 'Asparagus and Mushroom Risotto', 'recipe_fact_checked'],
    ['tiger-usa-italian-beef-bowl', 'Italian Beef Bowl', 'recipe_fact_checked'],
    ['tiger-usa-chinese-rice-bowl', 'Chinese Rice Bowl', 'recipe_fact_checked'],
    ['tiger-usa-zha-cai-beef-rice', 'Zha Cai and Beef Rice', 'recipe_fact_checked'],
    ['tiger-usa-vietnamese-beef-rice', 'Vietnamese Style Beef with Rice', 'recipe_fact_checked'],
    ['tiger-usa-chinese-marinated-tofu-rice', 'Chinese Marinated Tofu Rice', 'recipe_fact_checked'],
    ['tiger-usa-tomato-chicken-melt', 'Tomato Chicken Melt', 'recipe_fact_checked'],
    ['tiger-usa-bacon-tuna-rice-casserole', 'Bacon and Tuna Rice Casserole', 'recipe_fact_checked'],
    ['tiger-usa-multi-cooker-butternut-squash-risotto', 'Multi-Cooker Butternut Squash Risotto', 'recipe_fact_checked'],
    ['r58-taiwan-afa-pumpkin-rice', '南瓜飯', 'recipe_fact_checked'],
    ['r58-xinjiang-pilaf', '新疆抓飯', 'recipe_fact_checked'],
    ['r58-taiwan-red-crab-glutinous-rice', '紅蟳米糕', 'recipe_fact_checked'],
    ['r58-taiwan-preserved-egg-pork-congee', '皮蛋瘦肉粥', 'recipe_fact_checked'],
    ['r58-taiwan-crab-congee', '螃蟹粥', 'recipe_fact_checked'],
    ['r58-panasonic-salmon-edamame-rice', '和風鮭魚毛豆炊飯', 'recipe_fact_checked'],
    ['r58-sharp-matsusaka-pork-mushroom-rice', '麻油松阪豬綜合菇炊飯', 'recipe_fact_checked'],
    ['r58-cookpot-salmon-milk-brown-rice-risotto', '鮭魚奶香糙米燉飯', 'recipe_fact_checked'],
    ['r58-cookpot-corn-rice-beef-meatballs', '玉米飯+牛肉丸子 (一鍋二菜)', 'recipe_fact_checked'],
    ['hubei-yangxin-chunhu-fish-rice', '春湖鱼饭', 'recipe_fact_checked'],
    ['fujian-jinjiang-shenhu-huzi-salted-rice', '壶仔咸饭', 'recipe_fact_checked'],
    ['shanghai-songjiang-apo-vegetable-rice', '阿婆菜饭', 'recipe_fact_checked'],
    ['hubei-xinzhou-yellow-catfish-glutinous-rice', '黄颡鱼焖糯米饭', 'identity_verified'],
    ['zhejiang-changxing-salted-pork-xiuhuajin-rice', '咸肉绣花锦菜饭', 'identity_verified'],
    ['fujian-shishi-sesame-oil-rice', '石狮香油饭', 'identity_verified'],
    ['guizhou-buyi-flower-glutinous-rice', '布依花糯米饭', 'identity_verified'],
    ['hunan-mayang-steamed-glutinous-rice', '粉蒸糯米饭', 'identity_verified'],
    ['shanxi-lingchuan-firewood-rice', '陵川柴火饭', 'identity_verified'],
  ];
  for (const [recipeId, canonicalName, expectedStatus] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, expectedStatus, recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients), recipeId);
    if (expectedStatus === 'recipe_fact_checked') {
      assert.ok(recipe.core_ingredients.length >= 2, recipeId);
    }
    if (expectedStatus === 'identity_verified') {
      assert.deepEqual(recipe.cooking_sequence, [], recipeId);
      assert.equal(recipe.fixed_batch, null, recipeId);
      assert.equal(recipe.liquid_contract, null, recipeId);
      assert.equal(recipe.time_contract, null, recipeId);
      assert.deepEqual(recipe.safety_endpoints, [], recipeId);
    } else {
      assert.ok(recipe.cooking_sequence.length > 0, recipeId);
    }
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r59 collection batch records direct vendor, institutional and regional candidates without promoting research', () => {
  const catalog = sourceBackedCatalog();
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');
  assert.equal(catalog.recipes.length, 923);
  const expected = [
    ['r59-panasonic-taiwan-pineapple-shrimp-rice', '鳳梨蝦仁飯', 'recipe_fact_checked'],
    ['r59-panasonic-taiwan-tomato-spiced-chicken-rice', '番茄香料雞肉飯', 'recipe_fact_checked'],
    ['r59-panasonic-taiwan-tomato-chicken-cheese-risotto', '番茄雞肉起司燉飯', 'recipe_fact_checked'],
    ['r59-panasonic-taiwan-spanish-seafood-risotto', '西班牙海鮮燉飯', 'recipe_fact_checked'],
    ['r59-panasonic-taiwan-pumpkin-chicken-risotto', '灰姑娘南瓜馬車燉飯', 'recipe_fact_checked'],
    ['r59-panasonic-taiwan-tuna-edamame-rice', '炙燒鮪魚芝麻醬與毛豆白飯', 'recipe_fact_checked'],
    ['r59-panasonic-taiwan-porcini-lobster-risotto', '蝦螯牛肝菌菇燉飯', 'recipe_fact_checked'],
    ['r59-tiger-usa-garlic-salmon-garden-rice', 'Steamed Garlic Salmon with Dill and Garden Vegetables', 'recipe_fact_checked'],
    ['taiwan-four-season-pork-congee', '四季米香粥', 'recipe_fact_checked'],
    ['macau-lettuce-fishball-porridge', '生菜魚球粥', 'recipe_fact_checked'],
    ['taiwan-fresh-oyster-taro-brown-rice-porridge', '鮮蚵芋頭糙米粥', 'recipe_fact_checked'],
    ['hainan-coconut-shred-rice', '椰丝饭', 'recipe_fact_checked'],
    ['guangxi-jingxi-seven-color-glutinous-rice', '靖西七色糯米饭', 'recipe_fact_checked'],
    ['guangxi-jingxi-pork-glutinous-rice', '靖西扣肉糯米饭', 'identity_verified'],
    ['guangxi-jingxi-lotus-leaf-fragrant-rice', '靖西荷叶香糯饭', 'identity_verified'],
    ['jiangxi-ganxian-huangyuan-rice', '黄元米饭', 'recipe_fact_checked'],
    ['guangxi-yulin-sarou-glutinous-rice', '玉林撒肉糯米饭', 'recipe_fact_checked'],
    ['guizhou-zhenfeng-glutinous-rice', '贞丰糯米饭', 'recipe_fact_checked'],
    ['hunan-dongan-black-rice', '东安乌饭', 'recipe_fact_checked'],
  ];

  for (const [recipeId, canonicalName, expectedStatus] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, expectedStatus, recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.some(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => ['opened', 'search_extract_opened'].includes(source.access_status)), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.evidence_locator === 'string' && source.evidence_locator.length > 0), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients), recipeId);
    assert.ok(Array.isArray(recipe.cooking_sequence), recipeId);
    if (expectedStatus === 'identity_verified') {
      assert.equal(recipe.core_ingredients.length, 0, recipeId);
      assert.deepEqual(recipe.cooking_sequence, [], recipeId);
      assert.equal(recipe.fixed_batch, null, recipeId);
      assert.equal(recipe.liquid_contract, null, recipeId);
      assert.equal(recipe.time_contract, null, recipeId);
      assert.deepEqual(recipe.safety_endpoints, [], recipeId);
    } else {
      assert.ok(recipe.core_ingredients.length >= 2, recipeId);
      assert.ok(recipe.cooking_sequence.length > 0, recipeId);
    }
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r60 collection batch records direct vendor, institutional and regional candidates without promoting research', () => {
  const catalog = sourceBackedCatalog();
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');
  assert.equal(catalog.recipes.length, 923);
  const expected = [
    ['r60-tiger-salmon-rice', 'Salmon Rice', 'recipe_fact_checked'],
    ['r60-tiger-shiitake-garlic-rice', 'Shiitake Mushroom Garlic Rice', 'recipe_fact_checked'],
    ['r60-tiger-chicken-brown-rice-soup', 'Chicken and Brown Rice Soup', 'recipe_fact_checked'],
    ['r60-tiger-basic-chicken-congee', 'Basic Congee (Porridge)', 'recipe_fact_checked'],
    ['r60-tiger-takeout-vegetable-fried-rice', 'Take Out Style Vegetable Fried Rice', 'recipe_fact_checked'],
    ['r60-tiger-garlic-shrimp-herbed-rice', 'Garlic Shrimp with Herbed Rice', 'recipe_fact_checked'],
    ['r60-tiger-szechuan-pork-tacook-rice', 'Szechuan Pork', 'recipe_fact_checked'],
    ['r60-tiger-taiwan-minced-pork-rice', 'Taiwan Minced Pork', 'recipe_fact_checked'],
    ['taiwan-longkui-pork-porridge', '龍葵肉絲粥', 'recipe_fact_checked'],
    ['taiwan-milkfish-belly-porridge', '虱目魚肚粥', 'recipe_fact_checked'],
    ['taiwan-milkfish-salted-porridge', '虱目魚鹹粥', 'recipe_fact_checked'],
    ['taiwan-huai-shi-lean-pork-porridge', '淮實瘦肉粥', 'recipe_fact_checked'],
    ['taiwan-brown-rice-sishen-porridge', '糙米四神粥', 'recipe_fact_checked'],
    ['taiwan-sliding-egg-sweet-potato-vegetable-porridge', '滑蛋地瓜菜粥', 'recipe_fact_checked'],
    ['taiwan-pork-liver-spinach-porridge', '豬肝菠菜粥', 'recipe_fact_checked'],
    ['motuo-menba-hand-grab-rice', '门巴手抓饭', 'recipe_fact_checked'],
    ['nu-zu-rou-ban-fan', '怒族肉拌饭', 'recipe_fact_checked'],
    ['nujiang-lisu-hand-grab-rice', '傈僳族手抓饭（拌饭）', 'identity_verified'],
    ['chayu-dengren-hand-grab-rice', '察隅僜人手抓饭', 'identity_verified'],
    ['shaoyang-black-rice', '邵阳黑饭', 'identity_verified'],
  ];

  for (const [recipeId, canonicalName, expectedStatus] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, expectedStatus, recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.evidence_locator === 'string' && source.evidence_locator.length > 0), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
    if (expectedStatus === 'identity_verified') {
      assert.ok(Array.isArray(recipe.core_ingredients), recipeId);
      assert.deepEqual(recipe.cooking_sequence, [], recipeId);
      assert.equal(recipe.fixed_batch, null, recipeId);
      assert.equal(recipe.liquid_contract, null, recipeId);
      assert.equal(recipe.time_contract, null, recipeId);
      assert.deepEqual(recipe.safety_endpoints, [], recipeId);
    } else {
      assert.ok(recipe.core_ingredients.length >= 2, recipeId);
      assert.ok(recipe.cooking_sequence.length > 0, recipeId);
    }
  }
});

test('r61 collection batch records direct vendor, institutional and regional candidates without promoting research', () => {
  const catalog = sourceBackedCatalog();
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');
  assert.equal(catalog.recipes.length, 923);
  const expected = [
    ['r61-tiger-dried-shrimp-salted-kelp-brown-rice', '干しえびと塩昆布の玄米ごはん', 'recipe_fact_checked'],
    ['r61-tiger-chestnut-brown-rice', '栗玄米ごはん', 'recipe_fact_checked'],
    ['r61-tiger-multigrain-medicinal-porridge', '雑穀薬膳粥', 'recipe_fact_checked'],
    ['r61-tiger-red-can-curry-pilaf', '赤缶カレーの炊込みピラフ', 'recipe_fact_checked'],
    ['r61-tiger-easy-khao-man-gai', '簡単カオマンガイ', 'executable'],
    ['r61-tiger-broad-bean-rice', 'そら豆のごはん', 'recipe_fact_checked'],
    ['maff-gunma-katemeshi', 'かて飯', 'recipe_fact_checked'],
    ['maff-kyoto-matsutake-gohan', '松茸ごはん', 'recipe_fact_checked'],
    ['maff-corn-chicken-takikomi-gohan', 'とうもろこしの炊き込みご飯', 'recipe_fact_checked'],
    ['shanbei-sauerkraut-potato-laofan', '陕北酸菜捞饭', 'recipe_fact_checked'],
    ['guizhou-sauerkraut-bean-broth-baogu-rice', '酸菜豆汤苞谷饭', 'recipe_fact_checked'],
    ['weihai-baomi-chazi-dry-rice', '威海苞米碴子干饭', 'identity_verified'],
    ['kuancheng-manchu-sorghum-rice', '宽城满族高粱米饭', 'identity_verified'],
    ['dulong-corn-rice', '独龙族玉米饭', 'identity_verified'],
    ['metok-menba-corn-rice', '门巴族玉米饭', 'identity_verified'],
  ];

  for (const [recipeId, canonicalName, expectedStatus] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, expectedStatus, recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.evidence_locator === 'string' && source.evidence_locator.length > 0), recipeId);
    if (expectedStatus !== 'executable') assert.notEqual(recipe.status, 'executable', recipeId);
    if (expectedStatus === 'identity_verified') {
      assert.ok(Array.isArray(recipe.core_ingredients), recipeId);
      assert.deepEqual(recipe.cooking_sequence, [], recipeId);
      assert.equal(recipe.fixed_batch, null, recipeId);
      assert.equal(recipe.liquid_contract, null, recipeId);
      assert.equal(recipe.time_contract, null, recipeId);
      assert.deepEqual(recipe.safety_endpoints, [], recipeId);
    } else {
      assert.ok(recipe.core_ingredients.length >= 2, recipeId);
      assert.ok(recipe.cooking_sequence.length > 0, recipeId);
    }
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
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');
  assert.equal(catalog.recipes.length, 923);
  for (const recipeId of [
    'panasonic-tako-meshi-sr-x910e',
    'zojirushi-brown-rice-ih-pot',
    'toshiba-sakuraebi-rice',
    'toshiba-sekihan-rcp30r',
    'toshiba-kuri-okowa',
    'panasonic-sekihan-nf-ac1000',
    'tiger-beef-matsutake-rice',
    'tiger-steamed-abalone-rice',
    'tiger-uni-rice',
    'maff-tottori-dondoroke-meshi',
    'maff-tottori-itadaki',
    'maff-tottori-igai-meshi',
    'maff-ehime-shoyu-meshi',
    'maff-hiroshima-tai-meshi',
    'maff-kagawa-iriko-meshi',
    'maff-okayama-tako-meshi',
    'maff-tottori-daisen-okowa',
    'maff-okayama-hiruzen-okowa',
    'maff-aichi-hebo-meshi',
    'maff-shimane-kujira-gohan',
    'maff-yamanashi-sanma-meshi',
    'maff-tochigi-ayu-meshi',
    'maff-tokushima-tai-meshi',
  ]) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe?.status, 'recipe_fact_checked', recipeId);
    assert.ok(recipe?.source_refs?.length > 0, recipeId);
  }
  assert.deepEqual(validator.validateSourceBackedOnePotCatalog(catalog), []);
  assert.deepEqual(
    validator.validateSourceBackedCatalogMigration(migration, legacyVariants, catalog),
    [],
  );
});

test('Shanghai salted pork vegetable rice is the first evidence-closed executable recipe', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'shanghai-salted-pork-vegetable-rice');
  assert.equal(recipe?.status, 'executable');
  assert.deepEqual(recipe?.allergen_labels, ['无已知过敏原']);
  assert.equal(recipe?.fixed_batch?.servings, 4);
  assert.equal(recipe?.liquid_contract?.amount?.value, 1.25);
  assert.equal(recipe?.time_contract?.total_minutes, 60);
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  for (const source of recipe?.source_refs ?? []) {
    assert.ok(Number.isInteger(source.evidence_tier), source.source_id);
  }
});

test('Taiwan mushroom bamboo shoot rice records directly sourced quantities without inventing servings', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'taiwan-mushroom-bamboo-shoot-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-TW-3');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 1);
  assert.match(source?.evidence_locator ?? '', /613.*637/);
  assert.equal(recipe?.liquid_contract?.amount?.value, 1);
  assert.equal(recipe?.time_contract?.total_minutes, 30);
  assert.ok(recipe?.safety_endpoints?.some(item => item.code === 'pork_fully_cooked'));
});

test('Taiwan cabbage rice keeps the NTUH electric-cooker variant separate from the 3-person contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'taiwan-cabbage-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-TW-NTUH-CABBAGE-1');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.fixed_batch?.servings, 3);
  assert.deepEqual(recipe?.fixed_batch?.source_ids, ['S-TW-NHI-CABBAGE-1']);
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 1);
  assert.match(source?.evidence_locator ?? '', /第19至28行/u);
  assert.match(recipe?.evidence_notes ?? '', /独立的2人份电锅版本/u);
  assert.equal(recipe?.time_contract, null);
});

test('records the Tatung official two-person cabbage-rice contract as a separate executable variant', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'taiwan-tatung-cabbage-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-TATUNG-CABBAGE-RICE-1');
  assert.equal(recipe?.status, 'executable');
  assert.equal(recipe?.canonical_name, '大同電鍋高麗菜飯');
  assert.equal(recipe?.fixed_batch?.servings, 2);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '白米')?.amount?.value, 2);
  assert.equal(recipe?.liquid_contract?.amount?.value, 2);
  assert.match(recipe?.cooking_sequence?.[2]?.instruction ?? '', /外鍋.*1杯水/u);
  assert.equal(recipe?.time_contract?.total_minutes, 60);
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.match(source?.evidence_locator ?? '', /第34至64行.*约1小时.*2人份.*白米2合.*内锅2杯水.*外锅1杯水/u);
});

test('records Tatung nasi-goreng-style mixed rice as a named model-scoped meal', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'tatung-nasi-goreng-style-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-TATUNG-NASI-GORENG-STYLE-RICE-1');

  assert.equal(recipe?.canonical_name, 'ナシゴレン風炊き込みご飯');
  assert.equal(recipe?.status, 'executable');
  assert.equal(recipe?.fixed_batch?.servings, 3);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '米')?.amount?.value, 2);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '鸡胸肉')?.amount?.value, 100);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '冷冻海鲜综合')?.amount?.value, 150);
  assert.equal(recipe?.liquid_contract?.kind, 'waterline');
  assert.equal(recipe?.liquid_contract?.waterline?.mark, '2刻度略下');
  assert.equal(recipe?.time_contract?.total_minutes, 60);
  assert.ok(recipe?.cooking_sequence?.length >= 5);
  assert.match(
    recipe?.cooking_sequence.map(step => step.instruction).join(' ') ?? '',
    /(?=.*米)(?=.*酱油)(?=.*鱼露)(?=.*鸡肉)(?=.*海鲜)(?=.*水位线)(?=.*外锅)(?=.*焖5分钟)/u,
  );
  assert.ok(recipe?.safety_endpoints?.some(endpoint => endpoint.code === 'poultry_fully_cooked'));
  assert.ok(recipe?.safety_endpoints?.some(endpoint => endpoint.code === 'shellfish_fully_cooked'));
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.match(
    source?.evidence_locator ?? '',
    /(?=.*正文第23至111行)(?=.*ナシゴレン風炊き込みご飯)(?=.*3人前)(?=.*米2合)(?=.*鸡胸肉100g)(?=.*冷冻海鲜综合150g)(?=.*米水位线2刻度略下)(?=.*外锅1\.5杯)(?=.*60分钟)/u,
  );
});

test('records three additional Tatung named rice meals without inventing fixed servings', () => {
  const catalog = sourceBackedCatalog();
  const cases = [
    {
      id: 'tatung-taro-shiitake-vegetarian-oil-rice',
      name: '芋头香菇素油饭',
      sourceId: 'S-TATUNG-TARO-SHIITAKE-VEGETARIAN-OIL-RICE-1',
      url: 'https://www.tatung.com.cn/ElectronicRecipes/info_itemid_225.html',
      liquid: 0.9,
      time: 30,
      pattern: /(?=.*长糯米)(?=.*芋头)(?=.*小香菇)(?=.*杏鲍菇)(?=.*豆皮)(?=.*泡香菇水)(?=.*外锅.*1杯水)/u,
    },
    {
      id: 'tatung-daikon-tofu-skin-rice',
      name: '萝卜豆皮炊饭',
      sourceId: 'S-TATUNG-DAIKON-TOFU-SKIN-RICE-1',
      url: 'https://www.tatung.com.cn/ElectronicRecipes/info_itemid_167.html',
      liquid: 2,
      time: 60,
      pattern: /(?=.*白米)(?=.*白萝卜)(?=.*豆皮)(?=.*柴鱼高汤)(?=.*外锅.*1杯水)(?=.*焖10分钟)/u,
    },
    {
      id: 'tatung-salted-squid-corn-rice',
      name: '咸小卷玉米炊饭',
      sourceId: 'S-TATUNG-SALTED-SQUID-CORN-RICE-1',
      url: 'https://www.tatung.com.cn/ElectronicRecipes/info_itemid_29.html',
      liquid: 1.2,
      time: 40,
      pattern: /(?=.*咸小卷)(?=.*白米)(?=.*内锅水)(?=.*玉米)(?=.*小黄瓜)(?=.*外锅.*1杯水)(?=.*焖5分钟)/u,
    },
  ];
  for (const item of cases) {
    const recipe = catalog.recipes.find(row => row.recipe_id === item.id);
    const source = recipe?.source_refs.find(row => row.source_id === item.sourceId);
    assert.equal(recipe?.canonical_name, item.name, item.id);
    assert.equal(recipe?.status, 'recipe_fact_checked', item.id);
    assert.equal(recipe?.fixed_batch, null, item.id);
    assert.equal(recipe?.liquid_contract?.amount?.value, item.liquid, item.id);
    assert.equal(recipe?.time_contract?.total_minutes, item.time, item.id);
    assert.match(recipe?.cooking_sequence.map(step => step.instruction).join(' ') ?? '', item.pattern, item.id);
    assert.equal(source?.url, item.url, item.id);
    assert.equal(source?.access_status, 'opened', item.id);
    assert.equal(source?.evidence_tier, 3, item.id);
    assert.ok(source?.evidence_locator, item.id);
  }
});

test('records two additional Tatung named rice meals without inventing liquid contracts', () => {
  const catalog = sourceBackedCatalog();
  const executableIds = new Set(['tatung-paella-style-seafood-rice']);
  const cases = [
    {
      id: 'tatung-hainan-chicken-rice',
      name: '海南鶏飯シンガポールチキンライス',
      servings: 4,
      minutes: 30,
      sourceId: 'S-TATUNG-HAINAN-CHICKEN-RICE-1',
      sourcePattern: /正文第41至80行.*海南鶏飯.*4人分.*鸡腿.*2合.*外锅1杯水.*水位线2/u,
      processPattern: /(?=.*鸡肉)(?=.*米)(?=.*鸡汤)(?=.*外锅)(?=.*水位线2)(?=.*分阶段)/u,
      safety: 'poultry_fully_cooked',
      liquid: { kind: 'waterline', waterline: { appliance_model: '大同電鍋', scale: '内锅水位线', mark: 2 }, source_ids: ['S-TATUNG-HAINAN-CHICKEN-RICE-1'] },
    },
    {
      id: 'tatung-paella-style-seafood-rice',
      name: 'パエリア風魚介の炊き込みご飯',
      servings: 4,
      minutes: 30,
      sourceId: 'S-TATUNG-PAELLA-SEAFOOD-RICE-1',
      sourcePattern: /正文第34至76行.*パエリア風魚介.*4人分.*米3合.*约30分钟.*水位线2至3/u,
      processPattern: /(?=.*贝类)(?=.*虾)(?=.*鱿鱼)(?=.*汤汁)(?=.*米)(?=.*外锅)(?=.*1\.5杯)/u,
      safety: 'shellfish_fully_cooked',
      liquid: { kind: 'waterline', waterline: { appliance_model: '大同電鍋', scale: '内锅水位线', mark: '2至3' }, source_ids: ['S-TATUNG-PAELLA-SEAFOOD-RICE-1'] },
    },
  ];

  for (const item of cases) {
    const recipe = catalog.recipes.find(row => row.recipe_id === item.id);
    const source = recipe?.source_refs.find(row => row.source_id === item.sourceId);
    assert.equal(recipe?.canonical_name, item.name, item.id);
    assert.equal(recipe?.status, executableIds.has(item.id) ? 'executable' : 'recipe_fact_checked', item.id);
    assert.equal(recipe?.fixed_batch?.servings ?? null, item.servings, item.id);
    assert.equal(recipe?.time_contract?.total_minutes ?? null, item.minutes, item.id);
    assert.deepEqual(recipe?.liquid_contract, item.liquid, item.id);
    assert.ok(recipe?.cooking_sequence?.length >= 5, item.id);
    assert.match(recipe?.cooking_sequence.map(step => step.instruction).join(' '), item.processPattern, item.id);
    assert.ok(recipe?.safety_endpoints?.some(endpoint => endpoint.code === item.safety), item.id);
    assert.equal(recipe?.cooker_adaptation?.status, 'source_limited', item.id);
    assert.equal(source?.access_status, 'opened', item.id);
    assert.equal(source?.evidence_tier, 3, item.id);
    assert.match(source?.evidence_locator ?? '', item.sourcePattern, item.id);
    assert.deepEqual(recipe?.liquid_contract, item.liquid, item.id);
  }
});

test('records the next two Tatung named rice meals with staged and model-scoped boundaries', () => {
  const catalog = sourceBackedCatalog();
  const cases = [
    {
      id: 'tatung-tongzai-rice-cake',
      name: '筒仔米糕（ドンズーミーガオ）',
      servings: 4,
      minutes: 30,
      liquid: null,
      sourceId: 'S-TATUNG-TONGZAI-RICE-CAKE-1',
      sourcePattern: /正文第40至78行.*筒仔米糕.*4人分.*猪绞肉.*300至400ml.*糯米2合.*1\.5杯/u,
      processPattern: /(?=.*猪绞肉)(?=.*糯米)(?=.*肉燥)(?=.*不锈钢杯)(?=.*蒸板)(?=.*外锅)/u,
      safety: 'pork_fully_cooked',
    },
    {
      id: 'tatung-cajun-chicken-rice',
      name: 'ケイジャンチキンライス',
      servings: null,
      minutes: 30,
      liquid: { kind: 'waterline', waterline: { appliance_model: '大同電鍋', scale: '内锅米水位线', mark: '2刻度略下' }, source_ids: ['S-TATUNG-CAJUN-CHICKEN-RICE-1'] },
      sourceId: 'S-TATUNG-CAJUN-CHICKEN-RICE-1',
      sourcePattern: /正文第34至73行.*ケイジャンチキンライス.*3至4人分.*鸡腿肉约300克.*米2合.*内锅水位线2刻度略下.*外锅1杯加3刻度/u,
      processPattern: /(?=.*鸡肉)(?=.*米)(?=.*酸奶)(?=.*姜黄)(?=.*铝箔)(?=.*外锅)(?=.*3刻度)/u,
      safety: 'poultry_fully_cooked',
    },
  ];

  for (const item of cases) {
    const recipe = catalog.recipes.find(row => row.recipe_id === item.id);
    const source = recipe?.source_refs.find(row => row.source_id === item.sourceId);
    assert.equal(recipe?.canonical_name, item.name, item.id);
    assert.equal(recipe?.status, 'recipe_fact_checked', item.id);
    assert.equal(recipe?.fixed_batch?.servings ?? null, item.servings, item.id);
    assert.equal(recipe?.time_contract?.total_minutes ?? null, item.minutes, item.id);
    assert.deepEqual(recipe?.liquid_contract, item.liquid, item.id);
    assert.ok(recipe?.cooking_sequence?.length >= 5, item.id);
    assert.match(recipe?.cooking_sequence.map(step => step.instruction).join(' '), item.processPattern, item.id);
    assert.ok(recipe?.safety_endpoints?.some(endpoint => endpoint.code === item.safety), item.id);
    assert.equal(recipe?.cooker_adaptation?.status, 'source_limited', item.id);
    assert.equal(source?.access_status, 'opened', item.id);
    assert.equal(source?.evidence_tier, 3, item.id);
    assert.match(source?.evidence_locator ?? '', item.sourcePattern, item.id);
  }
});

test('records Tatung pork-jowl sesame rice without collapsing mixed liquid components', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'tatung-pork-jowl-sesame-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-TATUNG-PORK-JOWL-SESAME-RICE-1');

  assert.equal(recipe?.canonical_name, '豚トロとごま油炊き込みご飯');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.fixed_batch?.servings, 2);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '猪颈肉')?.amount?.value, 200);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '泰国香米')?.amount?.value, 180);
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'soaking_liquid',
    amount: { value: 180, unit: 'ml' },
    source_ids: ['S-TATUNG-PORK-JOWL-SESAME-RICE-1'],
  });
  assert.equal(recipe?.time_contract?.total_minutes, 60);
  assert.ok(recipe?.cooking_sequence?.length >= 6);
  assert.match(
    recipe?.cooking_sequence.map(step => step.instruction).join(' ') ?? '',
    /(?=.*猪颈肉)(?=.*干香菇)(?=.*干虾)(?=.*生姜)(?=.*泰国香米)(?=.*内锅)(?=.*外锅)(?=.*炒)/u,
  );
  assert.ok(recipe?.safety_endpoints?.some(endpoint => endpoint.code === 'pork_fully_cooked'));
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.match(
    source?.evidence_locator ?? '',
    /正文第34至70行.*豚トロとごま油炊き込みご飯.*2人分.*泰国香米.*猪颈肉.*干香菇.*干虾.*180ml.*约1小时/u,
  );
});

test('records the Zojirushi EL-NS23 pork-and-vegetable rice contract without renaming the source recipe', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'zojirushi-pork-vegetable-rice-el-ns23');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-ZOJIRUSHI-EL-NS23-PORK-VEGETABLE-RICE-1');
  assert.equal(recipe?.status, 'executable');
  assert.equal(recipe?.canonical_name, '豚肉と野菜のおかずごはん');
  assert.equal(recipe?.fixed_batch?.servings, 4);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '米')?.amount?.value, 2);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '猪肉')?.amount?.value, 300);
  assert.equal(recipe?.liquid_contract?.amount?.value, 260);
  assert.equal(recipe?.time_contract?.total_minutes, 60);
  assert.match(recipe?.cooking_sequence?.[2]?.instruction ?? '', /内锅.*本体/u);
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.match(source?.evidence_locator ?? '', /第164至275行.*EL-NS23.*约1小时.*4人分.*米2カップ.*水260mL/u);
});

test('records Zojirushi Okayama ebimeshi as a named regional electric-cooker rice dish', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'zojirushi-okayama-ebimeshi-el-ns23');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-ZOJIRUSHI-EL-NS23-EBIMESHI-1');
  assert.equal(recipe?.status, 'executable');
  assert.equal(recipe?.canonical_name, 'えびめし');
  assert.deepEqual(recipe?.region_codes, []);
  assert.equal(recipe?.fixed_batch?.servings, 4);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '有头虾')?.amount?.value, 160);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '鸡蛋')?.amount?.value, 4);
  assert.equal(recipe?.liquid_contract?.kind, 'waterline');
  assert.equal(recipe?.liquid_contract?.waterline?.mark, 2);
  assert.equal(recipe?.time_contract?.total_minutes, 60);
  assert.ok(recipe?.cooking_sequence?.some(item => /えびめし|菜单/u.test(item.instruction)));
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.ok(recipe?.safety_endpoints?.some(item => item.code === 'shellfish_fully_cooked'));
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.match(source?.evidence_locator ?? '', /第167至277行.*EL-NS23.*约1小时.*4人分.*米2杯.*有头虾160g.*水位目盛2/u);
});

test('records Zojirushi gomoku rice without collapsing its four-to-five-serving range', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'zojirushi-gomoku-rice-el-ns23');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-ZOJIRUSHI-EL-NS23-GOMOKU-1');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.canonical_name, '五目ご飯');
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract?.waterline?.mark, 3);
  assert.equal(recipe?.time_contract?.total_minutes, 60);
  assert.ok(recipe?.safety_endpoints?.some(item => item.code === 'poultry_fully_cooked'));
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.match(source?.evidence_locator ?? '', /第164至263行.*EL-NS23.*约1小时.*4至5人分.*米3カップ.*水位目盛3/u);
});

test('records Zojirushi grilled-mackerel rice as a named one-pot rice dish without inventing total time', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'zojirushi-yakisaba-meshi-ep-fa10');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-ZOJIRUSHI-EP-FA10-YAKISABA-MESHI-1');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.canonical_name, '焼きさばめし');
  assert.deepEqual(recipe?.region_codes, ['JP']);
  assert.equal(recipe?.fixed_batch?.servings, 4);
  assert.equal(recipe?.liquid_contract?.amount?.value, 320);
  assert.equal(recipe?.time_contract, null);
  assert.ok(recipe?.cooking_sequence?.some(item => /WARM.*15分/u.test(item.instruction)));
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.ok(recipe?.safety_endpoints?.some(item => item.code === 'seafood_fully_cooked'));
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.match(source?.evidence_locator ?? '', /第164至246行.*EP-FA10.*4人分.*米2合.*盐鲭300g.*320mL高汤/u);
});

test('records Philips chicken and lap-cheong claypot rice with its staged loading contract', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'philips-chicken-lap-cheong-claypot-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-PHILIPS-HD4775-HD4777-CHICKEN-LAP-CHEONG-1');

  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.canonical_name, '鸡肉腊肠煲仔饭');
  assert.deepEqual(recipe?.traditional_vessels, ['Philips HD4775 / HD4777 多功能电饭煲']);
  assert.deepEqual(recipe?.core_ingredients, ['米', '鸡肉片', '腊肠', '生姜']);
  assert.equal(recipe?.fixed_batch, null, 'the source fixes rice and ingredient quantities but does not state servings');
  assert.equal(recipe?.liquid_contract?.kind, 'waterline');
  assert.equal(recipe?.liquid_contract?.waterline?.mark, 3);
  assert.deepEqual(recipe?.liquid_contract?.waterline?.appliance_model, 'Philips HD4775 / HD4777');
  assert.equal(recipe?.time_contract, null, 'the recipe does not state a total duration');
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /鸡肉片.*盐和糖.*腌/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /3杯米.*煲仔饭.*启动/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /哔声.*鸡肉片.*腊肠.*铺在米饭/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /煲仔饭.*洋葱.*趁热/u);
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'poultry_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'quantity', 'liquid', 'process', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /第2394至2407行.*鸡肉腊肠煲仔饭.*3杯米.*300克鸡肉片.*200克腊肠.*HD4775.*HD4777.*煲仔饭/u);
});

test('records the Panasonic NF-PC400 takikomi rice contract without converting pressure-cooker facts to rice-cooker facts', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'panasonic-nf-pc400-takikomi-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-PANASONIC-NF-PC400-TAKIKOMI-1');
  assert.equal(recipe?.status, 'executable');
  assert.equal(recipe?.canonical_name, '炊き込みごはん');
  assert.equal(recipe?.fixed_batch?.servings, 4);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '白米')?.amount?.value, 3);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '鸡腿肉')?.amount?.value, 50);
  assert.equal(recipe?.liquid_contract?.kind, 'waterline');
  assert.equal(recipe?.liquid_contract?.waterline?.mark, 3);
  assert.equal(recipe?.time_contract?.total_minutes, 60);
  assert.match(recipe?.cooking_sequence?.[2]?.instruction ?? '', /自动调理17/u);
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.match(source?.evidence_locator ?? '', /第43至87行.*NF-PC400.*约1小时.*4人份.*白米3杯.*水位线3/u);
});

test('records Panasonic NF-AC1000 regional rice pages without converting cup batches to servings', () => {
  const catalog = sourceBackedCatalog();
  const expected = [
    ['panasonic-hyogo-tako-meshi', 'S-PANASONIC-NF-AC1000-HYOGO-TAKO-MESHI-1', 420, 50, /第43至103行/u],
    ['panasonic-tokyo-fukagawa-meshi', 'S-PANASONIC-NF-AC1000-TOKYO-FUKAGAWA-MESHI-1', 380, 50, /第43至109行/u],
    ['panasonic-gomoku-rice-nf-ac1000', 'S-PANASONIC-NF-AC1000-GOMOKU-GOHAN-1', 610, 55, /第43至113行/u],
    ['panasonic-hiroshima-oyster-lemon-paella', 'S-PANASONIC-NF-AC1000-HIROSHIMA-OYSTER-PAELLA-1', 470, 55, /第43至123行/u],
    ['panasonic-pilaf-nf-ac1000', 'S-PANASONIC-NF-AC1000-PILAF-1', 600, 55, /第43至104行/u],
    ['panasonic-biryani-style-takikomi-rice', 'S-PANASONIC-NF-AC1000-BIRYANI-1', 280, 55, /第34至180行/u],
  ];
  for (const [recipeId, sourceId, liquid, minutes, locator] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    const source = recipe?.source_refs.find(item => item.source_id === sourceId);
    assert.equal(recipe?.status, 'recipe_fact_checked');
    assert.equal(recipe?.fixed_batch, null);
    assert.equal(recipe?.liquid_contract?.amount?.value, liquid);
    assert.equal(recipe?.time_contract?.total_minutes, minutes);
    assert.equal(source?.access_status, 'opened');
    assert.equal(source?.evidence_tier, 3);
    assert.match(source?.evidence_locator ?? '', locator);
  }
});

test('records the Panasonic NF-AC1000 khao man gai as an evidence-closed pressure-cooker meal', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'panasonic-khao-man-gai-nf-ac1000');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-PANASONIC-NF-AC1000-KHAO-MAN-GAI-1');
  assert.equal(recipe?.status, 'executable');
  assert.equal(recipe?.canonical_name, 'カオマンガイ');
  assert.equal(recipe?.fixed_batch?.servings, 4);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '鸡腿肉')?.amount?.value, 400);
  assert.equal(recipe?.liquid_contract?.amount?.value, 360);
  assert.equal(recipe?.time_contract?.total_minutes, 40);
  assert.match(recipe?.cooking_sequence?.[3]?.instruction ?? '', /中压.*8分钟/u);
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.ok(recipe?.safety_endpoints?.some(item => item.code === 'poultry_fully_cooked'));
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.match(source?.evidence_locator ?? '', /第43至127行.*约40分钟.*4人份.*白米300g.*水360mL.*鸡腿肉400g/u);
});

test('records Panasonic regional rice-cooker menus without inventing a missing duration', () => {
  const catalog = sourceBackedCatalog();
  const expected = [
    ['panasonic-yamagata-imoni-takikomi-rice', '〖山形県ご当地メニュー〗いも煮炊込みごはん', 4, 'beef_fully_cooked', /第43至89行/u],
    ['panasonic-shimane-pork-ponzu-takikomi-rice', '〖島根県ご当地メニュー〗島根県産豚肉とポン酢のさっぱり炊込み', 6, 'pork_fully_cooked', /第43至81行/u],
    ['panasonic-ehime-tai-meshi', '〖愛媛県ご当地メニュー〗鯛めし', 4, 'seafood_fully_cooked', /第43至86行/u],
    ['panasonic-nagasaki-yudeboshi-daikon-rice', '〖長崎県ご当地メニュー〗ゆで干し大根の炊込みごはん', 6, 'poultry_fully_cooked', /第43至90行/u],
    ['panasonic-okinawa-jyushi', '〖沖縄県ご当地メニュー〗ジューシー', 4, 'pork_fully_cooked', /第43至91行/u],
  ];
  for (const [recipeId, canonicalName, servings, safetyCode, locator] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    const source = recipe?.source_refs.find(item => item.source_id.endsWith('-1'));
    assert.equal(recipe?.status, 'recipe_fact_checked');
    assert.equal(recipe?.canonical_name, canonicalName);
    assert.equal(recipe?.fixed_batch?.servings, servings);
    assert.equal(recipe?.liquid_contract?.kind, 'waterline');
    assert.equal(recipe?.liquid_contract?.waterline?.appliance_model, 'Panasonic SR-V10BB');
    assert.equal(recipe?.liquid_contract?.waterline?.mark, 2 + (servings === 6 ? 1 : 0));
    assert.equal(recipe?.time_contract, null);
    assert.ok(recipe?.safety_endpoints?.some(item => item.code === safetyCode));
    assert.equal(source?.access_status, 'opened');
    assert.equal(source?.evidence_tier, 3);
    assert.match(source?.evidence_locator ?? '', locator);
    const spec = recipe?.source_refs.find(item => item.source_id === 'S-PANASONIC-SR-V10BB-SPEC-1');
    assert.equal(spec?.access_status, 'opened');
    assert.equal(spec?.evidence_tier, 3);
    assert.match(spec?.evidence_locator ?? '', /炊込み.*55～65分/u);
  }
});

test('records five additional named regional rice-cooker menus without inventing a fixed duration', () => {
  const catalog = sourceBackedCatalog();
  const expected = [
    {
      recipeId: 'panasonic-hokkaido-corn-butter-rice',
      canonicalName: '〖北海道ご当地メニュー〗炊込みコーンバターごはん',
      servings: 4,
      model: 'Panasonic SR-X910E',
      mark: 2,
      roles: ['carbohydrate'],
      sourceId: 'S-PANASONIC-HOKKAIDO-CORN-BUTTER-RICE-1',
      locator: /第34至82行/u,
      specId: 'S-PANASONIC-SR-X910E-SPEC-1',
      specLocator: /炊込み.*52～65分/u,
    },
    {
      recipeId: 'panasonic-ibaraki-sweet-potato-rice',
      canonicalName: '〖茨城県ご当地メニュー〗さつまいもごはん',
      servings: 6,
      model: 'Panasonic SR-V10BB',
      mark: 3,
      roles: ['carbohydrate'],
      sourceId: 'S-PANASONIC-IBARAKI-SWEET-POTATO-RICE-1',
      locator: /第285至325行/u,
      specId: 'S-PANASONIC-SR-V10BB-SPEC-1',
      specLocator: /炊込み.*55～65分/u,
    },
    {
      recipeId: 'panasonic-kanagawa-shirasu-ume-rice',
      canonicalName: '〖神奈川県ご当地メニュー〗湘南産しらすと油揚げの梅茶漬け炊込みごはん',
      servings: 6,
      model: 'Panasonic SR-X910E',
      mark: 3,
      roles: ['carbohydrate', 'protein'],
      sourceId: 'S-PANASONIC-KANAGAWA-SHIRASU-UME-RICE-1',
      locator: /第34至82行/u,
      specId: 'S-PANASONIC-SR-X910E-SPEC-1',
      specLocator: /炊込み.*52～65分/u,
    },
    {
      recipeId: 'panasonic-nagano-salmon-nameko-rice',
      canonicalName: '〖長野県ご当地メニュー〗信州産サーモンとなめ茸の炊込みごはん',
      servings: 6,
      model: 'Panasonic SR-X910E',
      mark: 3,
      roles: ['carbohydrate', 'protein', 'fiber'],
      sourceId: 'S-PANASONIC-NAGANO-SALMON-NAMEKO-RICE-1',
      locator: /第34至84行/u,
      specId: 'S-PANASONIC-SR-X910E-SPEC-1',
      specLocator: /炊込み.*52～65分/u,
      safetyCode: 'seafood_fully_cooked',
    },
    {
      recipeId: 'panasonic-hyogo-black-edamame-rice',
      canonicalName: '〖兵庫県ご当地メニュー〗丹波の黒枝豆ごはん',
      servings: 6,
      model: 'Panasonic SR-X910E',
      mark: 3,
      roles: ['carbohydrate', 'protein', 'fiber'],
      sourceId: 'S-PANASONIC-HYOGO-BLACK-EDAMAME-RICE-1',
      locator: /第34至80行/u,
      specId: 'S-PANASONIC-SR-X910E-SPEC-1',
      specLocator: /炊込み.*52～65分/u,
    },
  ];

  for (const item of expected) {
    const recipe = catalog.recipes.find(row => row.recipe_id === item.recipeId);
    const source = recipe?.source_refs.find(row => row.source_id === item.sourceId);
    const spec = recipe?.source_refs.find(row => row.source_id === item.specId);
    assert.equal(recipe?.status, 'recipe_fact_checked');
    assert.equal(recipe?.canonical_name, item.canonicalName);
    assert.equal(recipe?.fixed_batch?.servings, item.servings);
    assert.equal(recipe?.liquid_contract?.waterline?.appliance_model, item.model);
    assert.equal(recipe?.liquid_contract?.waterline?.mark, item.mark);
    assert.deepEqual(recipe?.nutrition_structure?.roles, item.roles);
    assert.equal(recipe?.time_contract, null);
    assert.equal(recipe?.traditional_vessels?.[0], `${item.model} 可变压力IH电饭煲`);
    assert.equal(source?.access_status, 'opened');
    assert.equal(source?.evidence_tier, 3);
    assert.match(source?.evidence_locator ?? '', item.locator);
    assert.equal(spec?.access_status, 'opened');
    assert.equal(spec?.evidence_tier, 3);
    assert.match(spec?.evidence_locator ?? '', item.specLocator);
    if (item.safetyCode) {
      assert.ok(recipe?.safety_endpoints?.some(endpoint => endpoint.code === item.safetyCode));
    } else {
      assert.deepEqual(recipe?.safety_endpoints, []);
    }
  }
});

test('records two additional Panasonic named rice-cooker dishes with their closed-lid and finish-step boundaries', () => {
  const catalog = sourceBackedCatalog();
  const expected = [
    {
      recipeId: 'panasonic-asian-style-takikomi-rice',
      canonicalName: 'アジア風炊込みごはん',
      servings: 4,
      mark: 3,
      sourceId: 'S-PANASONIC-ASIAN-STYLE-TAKIKOMI-RICE-1',
      locator: /第34至99行/u,
      safetyCode: 'poultry_fully_cooked',
      roles: ['carbohydrate', 'protein'],
    },
    {
      recipeId: 'panasonic-pilaf-rice-sr-x910e',
      canonicalName: 'ピラフ（SR-X910E炊飯器版）',
      servings: 4,
      mark: 3,
      sourceId: 'S-PANASONIC-PILAF-RICE-SR-X910E-1',
      locator: /第34至93行/u,
      safetyCode: 'shellfish_fully_cooked',
      roles: ['carbohydrate', 'protein', 'fiber'],
    },
  ];
  for (const item of expected) {
    const recipe = catalog.recipes.find(row => row.recipe_id === item.recipeId);
    const source = recipe?.source_refs.find(row => row.source_id === item.sourceId);
    const spec = recipe?.source_refs.find(row => row.source_id === 'S-PANASONIC-SR-X910E-SPEC-1');
    assert.equal(recipe?.status, 'recipe_fact_checked');
    assert.equal(recipe?.canonical_name, item.canonicalName);
    assert.equal(recipe?.fixed_batch?.servings, item.servings);
    assert.equal(recipe?.liquid_contract?.waterline?.appliance_model, 'Panasonic SR-X910E');
    assert.equal(recipe?.liquid_contract?.waterline?.mark, item.mark);
    assert.equal(recipe?.time_contract, null);
    assert.deepEqual(recipe?.nutrition_structure?.roles, item.roles);
    assert.ok(recipe?.safety_endpoints?.some(endpoint => endpoint.code === item.safetyCode));
    assert.equal(source?.access_status, 'opened');
    assert.equal(source?.evidence_tier, 3);
    assert.match(source?.evidence_locator ?? '', item.locator);
    assert.equal(spec?.access_status, 'opened');
    assert.equal(spec?.evidence_tier, 3);
    assert.match(spec?.evidence_locator ?? '', /炊込み.*52～65分/u);
  }
});

test('records two Panasonic manufacturer dashi-rice dishes with their fixed four-person waterline contract', () => {
  const catalog = sourceBackedCatalog();
  const expected = [
    {
      recipeId: 'panasonic-kanoya-dashi-rice-sr-v10ba',
      canonicalName: '〖茅乃舎監修〗茅乃舎だし だし炊きごはん',
      ingredient: '茅乃舎だし',
      sourceId: 'S-PANASONIC-KANOYA-DASHI-RICE-1',
      url: /\/0966\.html/u,
      locator: /第285至319行/u,
    },
    {
      recipeId: 'panasonic-vegetable-dashi-rice-sr-v10ba',
      canonicalName: '〖茅乃舎監修〗野菜だし だし炊きごはん',
      ingredient: '野菜だし',
      sourceId: 'S-PANASONIC-VEGETABLE-DASHI-RICE-1',
      url: /\/0968\.html/u,
      locator: /第34至68行/u,
    },
  ];
  for (const item of expected) {
    const recipe = catalog.recipes.find(row => row.recipe_id === item.recipeId);
    const source = recipe?.source_refs.find(row => row.source_id === item.sourceId);
    assert.equal(recipe?.status, 'recipe_fact_checked');
    assert.equal(recipe?.canonical_name, item.canonicalName);
    assert.deepEqual(recipe?.fixed_batch?.servings, 4);
    assert.equal(recipe?.fixed_batch?.ingredients.find(row => row.name === item.ingredient)?.amount?.value, 1);
    assert.equal(recipe?.liquid_contract?.waterline?.appliance_model, 'Panasonic SR-V10BA / SR-V18BA');
    assert.equal(recipe?.liquid_contract?.waterline?.mark, 2);
    assert.equal(recipe?.time_contract, null);
    assert.deepEqual(recipe?.nutrition_structure?.roles, ['carbohydrate']);
    assert.equal(source?.access_status, 'opened');
    assert.equal(source?.evidence_tier, 3);
    assert.match(source?.url ?? '', item.url);
    assert.match(source?.evidence_locator ?? '', item.locator);
  }
});

test('records the Panasonic frozen-seafood paella rice as a closed-lid one-pot recipe without inventing servings', () => {
  const recipe = sourceBackedCatalog().recipes.find(row => row.recipe_id === 'panasonic-frozen-seafood-paella-rice');
  const source = recipe?.source_refs.find(row => row.source_id === 'S-PANASONIC-FROZEN-SEAFOOD-PAELLA-1');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.canonical_name, '〖料理家 ぐっち夫婦監修〗冷凍シーフードのパエリア風ごはん');
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract?.kind, 'added_water');
  assert.equal(recipe?.liquid_contract?.amount?.value, 500);
  assert.equal(recipe?.liquid_contract?.amount?.unit, 'mL');
  assert.equal(recipe?.time_contract?.total_minutes, 55);
  assert.deepEqual(recipe?.nutrition_structure?.roles, ['carbohydrate', 'protein', 'fiber']);
  assert.ok(recipe?.safety_endpoints?.some(endpoint => endpoint.code === 'shellfish_fully_cooked'));
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.match(source?.evidence_locator ?? '', /第285至374行/u);
});

test('archives the directly opened National Health Insurance cabbage-rice source without inventing a cooker duration', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'taiwan-cabbage-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-TW-NHI-CABBAGE-1');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 1);
  assert.match(source?.evidence_locator ?? '', /PDF第39页.*印刷第37页.*高麗菜飯.*1\.5杯.*1杯水.*10分钟/u);
  assert.deepEqual(source?.local_archive?.pages, [39]);
  assert.equal(recipe?.time_contract, null);
});

test('independent sign-off admits the two complete single-version WOL contracts', () => {
  const catalog = sourceBackedCatalog();
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');

  const beef = catalog.recipes.find(item => item.recipe_id === 'zojirushi-beef-mixed-rice');
  const beefSource = beef?.source_refs.find(item => item.source_id === 'zojirushi-beef-mixed-rice');
  assert.equal(beefSource?.access_status, 'opened');
  assert.equal(beefSource?.evidence_tier, 3);
  assert.match(beefSource?.evidence_locator ?? '', /第12至50行/u);

  const cured = catalog.recipes.find(item => item.recipe_id === 'cantonese-cured-meat-claypot-rice');
  const curedSource = cured?.source_refs.find(item => item.source_id === 'S-WOL-HK-CURED-CLAYPOT-RICE-1');
  assert.equal(curedSource?.access_status, 'opened');
  assert.equal(curedSource?.evidence_tier, 5);
  assert.match(curedSource?.evidence_locator ?? '', /第105至136行.*2人份.*1杯米.*1杯水.*75分钟/u);
  assert.equal(cured?.status, 'executable');
  assert.equal(cured?.fixed_batch?.servings, 2);
  assert.equal(cured?.liquid_contract?.amount?.value, 1);
  assert.equal(cured?.time_contract?.total_minutes, 75);
  assert.match(cured?.evidence_notes ?? '', /完整单一版本.*2026-08-05.*准入签署通过/u);

  const chicken = catalog.recipes.find(item => item.recipe_id === 'cantonese-mushroom-chicken-claypot-rice');
  const chickenSource = chicken?.source_refs.find(item => item.source_id === 'S-WOL-CHICKEN-MUSHROOM-CLAYPOT-RICE-1');
  assert.equal(chickenSource?.access_status, 'opened');
  assert.equal(chickenSource?.evidence_tier, 5);
  assert.match(chickenSource?.evidence_locator ?? '', /第139至186行.*2人份.*1杯米.*1杯高汤或水.*190分钟/u);
  assert.equal(chicken?.status, 'executable');
  assert.equal(chicken?.fixed_batch?.servings, 2);
  assert.equal(chicken?.liquid_contract?.amount?.value, 1);
  assert.equal(chicken?.time_contract?.total_minutes, 190);
  assert.match(chicken?.evidence_notes ?? '', /完整单一版本.*2026-08-05.*准入签署通过/u);
});

test('two signed WOL contracts retain promotion-ready source hygiene after admission', () => {
  const catalog = sourceBackedCatalog();

  const expectations = [
    {
      recipeId: 'cantonese-cured-meat-claypot-rice',
      scopedSources: {
        'S-GD-1': { tier: 1, scopes: ['identity', 'ingredients'] },
        'S-GD-2': { tier: 1, scopes: ['identity'] },
        'S-GD-3': { tier: 1, scopes: ['identity', 'ingredients'] },
        'S-GD-KAIPING-1': { tier: 1, scopes: ['identity', 'ingredients'] },
        'S-GD-YANGPU-1': { tier: 5, scopes: ['identity', 'ingredients'] },
        'S-TW-AFA-CURED-RICE-1': {
          tier: 1,
          scopes: ['ingredients', 'quantity', 'liquid', 'process', 'appliance', 'time'],
        },
        'S-SAFETY-CURED-MEAT-1': { tier: 1, scopes: ['safety'] },
      },
      archiveSourceId: 'S-HK-HKJC-CURED-RICE-1',
      archivePath: 'docs/source-archives/hkjc-home-cooking-claypot-rice.pdf',
      archivePages: [1],
    },
    {
      recipeId: 'cantonese-mushroom-chicken-claypot-rice',
      scopedSources: {
        'S-GD-1': { tier: 1, scopes: ['identity', 'ingredients'] },
        'S-GD-2': { tier: 1, scopes: ['identity'] },
        'S-GD-3': { tier: 1, scopes: ['identity', 'ingredients'] },
        'S-GD-KAIPING-1': { tier: 1, scopes: ['identity', 'ingredients'] },
        'S-GD-TAFT-CHICKEN-RICE-1': { tier: 5, scopes: ['identity', 'ingredients'] },
        'S-SAFETY-TEMPERATURES-1': { tier: 1, scopes: ['safety'] },
      },
      archiveSourceId: 'S-TEFAL-MUSHROOM-CHICKEN-RICE-1',
      archivePath: 'docs/source-archives/tefal-rice-cooker-recipe-book-2020.pdf',
      archivePages: [5],
    },
  ];

  for (const expectation of expectations) {
    const recipe = catalog.recipes.find(item => item.recipe_id === expectation.recipeId);
    assert.equal(recipe?.status, 'executable', `${expectation.recipeId} has explicit human sign-off`);
    for (const [sourceId, expected] of Object.entries(expectation.scopedSources)) {
      const source = recipe?.source_refs.find(item => item.source_id === sourceId);
      assert.equal(source?.evidence_tier, expected.tier, sourceId);
      assert.deepEqual(source?.claim_scopes, expected.scopes, sourceId);
    }
    const archiveSource = recipe?.source_refs.find(item => item.source_id === expectation.archiveSourceId);
    assert.equal(archiveSource?.local_archive?.path, expectation.archivePath);
    assert.deepEqual(archiveSource?.local_archive?.pages, expectation.archivePages);
    assert.match(archiveSource?.local_archive?.sha256 ?? '', /^[a-f0-9]{64}$/u);
  }

  assert.deepEqual(
    validator.validateSourceBackedOnePotCatalog(catalog, { archive_root: projectDirectory }),
    [],
  );
});

test('Philips Cantonese cured-rice variant has a complete model-scoped execution contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'philips-cantonese-cured-rice');
  assert.equal(recipe?.status, 'executable');
  assert.equal(recipe?.fixed_batch?.servings, 4);
  assert.equal(recipe?.fixed_batch?.source_ids?.[0], 'S-PHILIPS-CANTONESE-CURED-RICE-1');
  assert.equal(recipe?.liquid_contract?.amount?.value, 2);
  assert.equal(recipe?.time_contract?.total_minutes, 45);
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(recipe?.cooker_adaptation?.source_ids?.[0], 'S-PHILIPS-CANTONESE-CURED-RICE-1');
  assert.ok(recipe?.safety_endpoints?.some(item => item.code === 'cured_meat_fully_heated'));
  assert.deepEqual(recipe?.allergen_labels, ['大豆']);
  const source = recipe?.source_refs?.find(item => item.source_id === 'S-PHILIPS-CANTONESE-CURED-RICE-1');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.match(source?.evidence_locator ?? '', /第349至378行/u);
});

test('Toshiba RC-DR18T mixed rice keeps its manufacturer recipe and model-scoped execution contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'toshiba-mixed-chicken-bamboo-rice-rc-dr18t');
  assert.equal(recipe?.status, 'executable');
  assert.equal(recipe?.canonical_name, '东芝什锦饭');
  assert.equal(recipe?.fixed_batch?.servings, 4);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '大米')?.amount?.value, 3);
  assert.equal(recipe?.liquid_contract?.kind, 'waterline');
  assert.equal(recipe?.liquid_contract?.waterline?.mark, 3);
  assert.equal(recipe?.time_contract?.total_minutes, 45);
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.ok(recipe?.safety_endpoints?.some(item => item.code === 'poultry_fully_cooked'));
  const source = recipe?.source_refs?.find(item => item.source_id === 'S-TOSHIBA-RC-DR18T-MIXED-RICE-1');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.match(source?.evidence_locator ?? '', /PDF第14页/u);
  assert.match(source?.evidence_locator ?? '', /PDF第19页/u);
  assert.deepEqual(source?.local_archive?.pages, [14, 19]);
});

test('archives the directly opened manufacturer evidence for the next rice-cooker batch', () => {
  const catalog = sourceBackedCatalog();
  const bamboo = catalog.recipes.find(item => item.recipe_id === 'zojirushi-fresh-vegetable-bamboo-rice');
  const bambooSource = bamboo?.source_refs.find(item => item.source_id === 'zojirushi-fresh-vegetable-bamboo-rice');
  assert.equal(bambooSource?.access_status, 'opened');
  assert.equal(bambooSource?.evidence_tier, 3);
  assert.match(bambooSource?.evidence_locator ?? '', /第266至299行.*4~5人份.*白米3.*什锦饭/u);

  const pork = catalog.recipes.find(item => item.recipe_id === 'zojirushi-minced-pork-greens-rice-nl-erh');
  const porkSource = pork?.source_refs.find(item => item.source_id === 'zojirushi-minced-pork-greens-rice-nl-erh');
  assert.equal(porkSource?.access_status, 'opened');
  assert.equal(porkSource?.evidence_tier, 3);
  assert.match(porkSource?.evidence_locator ?? '', /PDF第5页.*65至71分钟.*PDF第8页.*4~5人份/u);
  assert.deepEqual(porkSource?.local_archive?.pages, [5, 8]);

  const curry = catalog.recipes.find(item => item.recipe_id === 'joyoung-curry-chicken-rice-jrc-4hp82');
  const currySource = curry?.source_refs.find(item => item.source_id === 'joyoung-curry-chicken-rice-jrc-4hp82');
  assert.equal(currySource?.access_status, 'opened_bilingual_conflict_recorded');
  assert.equal(currySource?.evidence_tier, 3);
  assert.deepEqual(currySource?.local_archive?.pages, [11, 24]);
});

test('archives the directly opened Panasonic mixed-chicken-rice manual without inventing a serving count', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'panasonic-mixed-chicken-rice-sr-df151');
  const source = recipe?.source_refs.find(item => item.source_id === 'panasonic-mixed-chicken-rice-sr-df151');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.match(source?.evidence_locator ?? '', /PDF第6页.*精煮.*38分钟.*PDF第9页.*什锦鸡饭.*3杯.*4杯/u);
  assert.deepEqual(source?.local_archive?.pages, [6, 9]);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.time_contract, null);
});

test('archives the directly opened Panasonic fresh-shiitake-rice manual without inventing a serving count', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'panasonic-fresh-shiitake-rice-sr-afg');
  const source = recipe?.source_refs.find(item => item.source_id === 'panasonic-fresh-shiitake-rice-sr-afg');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.match(source?.evidence_locator ?? '', /PDF第8页.*煲仔饭.*37分钟.*PDF第23页.*鲜香菇饭.*1杯米.*1杯水/u);
  assert.deepEqual(source?.local_archive?.pages, [8, 23]);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.time_contract, null);
});

test('marks aggregate-only process evidence as technique evidence pending strengthening', () => {
  const catalog = sourceBackedCatalog();
  for (const recipeId of ['qijiang-potato-cured-pork-kong-rice', 'shidian-broad-bean-ham-rice']) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    const processSources = recipe.source_refs.filter(source => source.claim_scopes.includes('process'));
    assert.ok(processSources.some(source => source.evidence_tier === 6), recipeId);
    assert.match(recipe.evidence_notes, /技法来源待加强/u, recipeId);
  }
  const artifacts = buildSourceBackedOnePotArtifacts(catalog, migrationLedger());
  assert.match(artifacts.get('docs/source-backed-one-pot-recipes.md'), /技法来源待加强/u);
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

test('keeps research entries non-public after signed contracts are admitted', () => {
  const catalog = sourceBackedCatalog();
  assert.ok(catalog.recipes.length > 0);
  const statusTotals = catalog.recipes.reduce((totals, recipe) => {
    totals[recipe.status] = (totals[recipe.status] ?? 0) + 1;
    return totals;
  }, {});
  assert.deepEqual(statusTotals, {
    discovered: 17,
    executable: 36,
    identity_verified: 100,
    recipe_fact_checked: 770,
  });
  for (const recipe of catalog.recipes) {
    assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe.status));
  }

  const completeResearch = catalog.recipes.filter(recipe => recipe.status === 'recipe_fact_checked')
    .filter(recipe => Boolean(
      recipe.fixed_batch
      && recipe.liquid_contract
      && recipe.cooking_sequence.length > 0
      && recipe.time_contract
      && recipe.safety_endpoints.length > 0,
    ));
  assert.deepEqual(
    completeResearch.map(recipe => recipe.recipe_id),
    ['tatung-hainan-chicken-rice', 'tatung-pork-jowl-sesame-rice', 'tiger-duck-matsutake-rice', 'sichuan-rice-cooker-pork-ribs-rice', 'tatung-avocado-chicken-rice', 'tiger-beef-matsutake-rice', 'tiger-oyster-mushroom-rice', 'tiger-post-196-gomoku-rice', 'tiger-gomoku-rice-post43', 'instant-pot-spanish-chicken-rice', 'illinois-texas-hash', 'va-pork-rice-skillet', 'usu-salsa-verde-chicken-rice', 'cu-caribbean-jerk-chicken-rice', 'kidney-care-chicken-tikka-pulao', 'firststeps-turkey-vegetable-pilaf'],

  );
  assert.ok(completeResearch.every(recipe => !validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe.status)));
});

test('r40 collection batch records only directly sourced research candidates', () => {
  const catalog = sourceBackedCatalog();
  const expected = [
    ['tiger-chicken-bamboo-rice', '鶏肉たけのこごはん', 'executable'],
    ['tiger-whitefish-mixed-rice', '白身魚の炊込みごはん', 'executable'],
    ['tiger-chinese-sticky-rice', '炊込み中華おこわ', 'executable'],
    ['tiger-shirasu-tomato-multigrain-rice', '釜揚げしらすとトマトの雑穀ごはん', 'recipe_fact_checked'],
    ['tiger-mackerel-aromatic-barley-rice', 'さばの香味麦炊込みごはん', 'recipe_fact_checked'],
    ['tiger-hamo-rice', 'はもごはん', 'recipe_fact_checked'],
    ['tiger-duck-matsutake-rice', '鴨ロースと松茸の炊込みごはん', 'recipe_fact_checked'],
    ['ntuh-salmon-mixed-mushroom-rice', '鮭魚什錦菇飯', 'recipe_fact_checked'],
    ['ntuh-wild-mushroom-rice', '野菇炊飯', 'recipe_fact_checked'],
    ['sichuan-rice-cooker-pork-ribs-rice', '排骨焖饭', 'recipe_fact_checked'],
  ];
  for (const [recipeId, name, status] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.ok(recipe, `${recipeId} should be in the r40 research batch`);
    assert.equal(recipe.canonical_name, name);
    assert.equal(recipe.status, status);
    assert.ok(recipe.source_refs.some(source => source.access_status === 'opened'));
    assert.ok(recipe.source_refs.every(source => source.url.startsWith('https://')));
    if (status !== 'executable') assert.notEqual(recipe.status, 'executable');
  }
});

test('r41 collection batch records only directly sourced named rice meals', () => {
  const catalog = sourceBackedCatalog();
  const executableIds = new Set(['panasonic-claypot-style-chicken-rice', 'hk-pumpkin-taro-chicken-claypot-rice', 'hk-taro-shrimp-multigrain-steamed-rice', 'hk-yam-longan-chicken-claypot-rice']);
  const expected = [
    ['taiwan-brown-rice-salmon-rice', '糙米鮭魚炊飯'],
    ['taiwan-ten-fragrant-rice', '十香飯'],
    ['taiwan-vegetable-chicken-rice', '蔬菜雞肉飯'],
    ['taiwan-saffron-seafood-rice', '番紅花海鮮飯'],
    ['taiwan-three-mushroom-rice', '三菇飯'],
    ['hakka-electric-cooker-rice', '客家菜飯'],
    ['hk-hiroshima-oyster-mushroom-claypot-rice', '廣島蠔雜菇煲仔飯'],
    ['panasonic-one-pot-chicken-rice', 'One Pot Chicken Rice'],
    ['panasonic-chicken-vegetable-rice', 'Chicken Vegetable Rice'],
    ['panasonic-claypot-style-chicken-rice', 'Claypot Style Chicken Rice'],
    ['yuping-farmer-she-rice', '玉屏农家社饭'],
    ['taiwan-cured-pot-rice', '臘味煲飯'],
    ['taiwan-fuzhou-drunk-duck-rice', '福州糟鴨飯'],
    ['hk-pumpkin-taro-chicken-claypot-rice', '南瓜芋頭雞粒煲仔飯'],
    ['hk-yam-longan-chicken-claypot-rice', '淮山圓肉雞柳煲仔飯'],
    ['hk-taro-shrimp-multigrain-steamed-rice', '芋頭鮮蝦五穀蒸飯'],
    ['macau-scallop-mushroom-vegetable-rice', '帶子磨菇菜飯'],
    ['macau-tomato-corn-rice', '蕃茄粟米飯'],
    ['tatung-avocado-chicken-rice', 'アボカド鶏肉炊き込みご飯'],
  ];
  for (const [recipeId, name] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.ok(recipe, `${recipeId} should be in the r41 research batch`);
    assert.equal(recipe.canonical_name, name);
    assert.equal(recipe.status, executableIds.has(recipeId) ? 'executable' : 'recipe_fact_checked');
    assert.ok(recipe.source_refs.some(source => source.access_status === 'opened'));
    assert.ok(recipe.source_refs.every(source => source.url.startsWith('https://')));
    if (!executableIds.has(recipeId)) assert.notEqual(recipe.status, 'executable');
  }
});

test('r42 collection batch records only directly sourced low-overlap one-pot meals', () => {
  const catalog = sourceBackedCatalog();
  const expected = [
    ['tiger-kimchi-rice', 'Kimchi Rice'],
    ['tiger-edamame-fried-tofu-rice', 'Edamame and Fried Tofu Rice'],
    ['tiger-seafood-pilaf', 'Seafood Pilaf'],
    ['taiwan-angelica-sesame-chicken-rice', '當歸麻油雞飯'],
    ['raoping-gaotang-pork-rice', '高堂焖'],
    ['guangzhou-shrimp-lotus-leaf-rice', '鮮蝦荷葉飯'],
    ['yunnan-mabang-luoguo-rice', '马帮锣锅饭'],
    ['hubei-steamed-cured-meat-rice', '饭蒸腊味'],
  ];
  for (const [recipeId, name] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.ok(recipe, `${recipeId} should be in the r42 research batch`);
    assert.equal(recipe.canonical_name, name);
    assert.equal(recipe.status, 'recipe_fact_checked');
    assert.ok(recipe.source_refs.some(source => source.access_status === 'opened'));
    assert.ok(recipe.source_refs.every(source => source.url.startsWith('https://')));
    assert.notEqual(recipe.status, 'executable');
  }
});

test('r43 collection batch records directly sourced named rice meals without inventing contracts', () => {
  const catalog = sourceBackedCatalog();
  const expected = [
    ['hk-salmon-edamame-quinoa-rice', '三文魚青毛豆藜麥飯'],
    ['hk-tomato-mushroom-chicken-rice', '番茄雜菇雞腿肉飯'],
    ['hk-pumpkin-shiitake-pork-rice', '南瓜冬菇豬肉燉飯'],
    ['hk-sakura-shrimp-chicken-quinoa-rice', '櫻花蝦冬菇雞肉藜麥飯'],
    ['tiger-hijiki-brown-rice', 'Hijiki Brown Rice'],
    ['tiger-bibimbap-style-rice', 'Bibimbap Style Rice'],
    ['toshiba-vegetarian-mixed-brown-rice', 'Vegetarian Mixed Brown Rice'],
    ['yangxin-spring-lake-fish-rice', '春湖魚飯'],
    ['huarong-guoba-fish-rice', '鍋巴魚飯'],
    ['taizhou-yellowfish-rice', '黃魚飯'],
  ];
  assert.equal(expected.length, 10);
  for (const [recipeId, name] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.ok(recipe, `${recipeId} should be in the r43 research batch`);
    assert.equal(recipe.canonical_name, name);
    assert.equal(recipe.status, 'recipe_fact_checked');
    assert.ok(recipe.source_refs.some(source => source.access_status === 'opened'));
    assert.ok(recipe.source_refs.every(source => source.url.startsWith('https://')));
    assert.equal(recipe.fixed_batch, null);
    assert.notEqual(recipe.status, 'executable');
  }
});

test('r44 collection batch records new named one-pot meals without promoting research into executable', () => {
  const catalog = sourceBackedCatalog();
  const expected = [
    ['taiwan-sesame-oil-chicken-glutinous-rice-cake', '麻油雞丁糯米糕', 'recipe_fact_checked'],
    ['taiwan-tilapia-edamame-rice', '鯛魚毛豆炊飯', 'recipe_fact_checked'],
    ['taiwan-multigrain-scallop-seafood-quinoa-rice', '雜糧干貝海鮮蒸臺灣藜飯', 'recipe_fact_checked'],
    ['taiwan-five-elements-bamboo-shoot-rice', '鮮筍五行炊飯', 'recipe_fact_checked'],
    ['taiwan-tea-oil-bamboo-shoot-chicken-rice', '茶油綠竹筍炊飯', 'recipe_fact_checked'],
    ['taiwan-pine-nut-chicken-wild-mushroom-rice', '松子雞肉野菇炊飯', 'recipe_fact_checked'],
    ['taiwan-tuna-mushroom-quinoa-rice', '鮪魚菇菇洋蔥紅藜麥炊飯', 'recipe_fact_checked'],
    ['taiwan-golden-mushroom-chicken-rice', '炙燒黃金菇菇雞炊飯', 'recipe_fact_checked'],
    ['midea-beef-pumpkin-rice', '牛肉南瓜焖饭', 'recipe_fact_checked'],
    ['cuckoo-abalone-pot-rice', 'Abalone Pot Rice with the CR-0675F', 'recipe_fact_checked'],
    ['instant-pot-coconut-chicken-pineapple-rice', 'Coconut Chicken and Rice with Pineapple Salsa', 'recipe_fact_checked'],
    ['instant-pot-tuscan-chicken-rice', 'Tuscan Chicken and Rice', 'recipe_fact_checked'],
    ['instant-pot-eggplant-rice', 'Eggplant Rice', 'recipe_fact_checked'],
    ['instant-pot-spinach-chickpea-rice', 'Dump & Done Spinach Rice & Chickpeas', 'recipe_fact_checked'],
    ['pengshui-dingpot-rice', '彭水鼎罐饭', 'recipe_fact_checked'],
    ['yongchun-pork-rib-salted-rice', '永春排骨咸饭', 'identity_verified'],
    ['hk-mushroom-mixed-vegetable-kamameshi', '菇菌雜蔬釜飯', 'recipe_fact_checked'],
    ['hk-choy-sum-scallop-rice', '菜心瑤柱飯', 'recipe_fact_checked'],
  ];
  assert.equal(expected.length, 18);
  for (const [recipeId, name, status] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.ok(recipe, `${recipeId} should be in the r44 research batch`);
    assert.equal(recipe.canonical_name, name);
    assert.equal(recipe.status, status);
    assert.ok(recipe.source_refs.some(source => source.access_status === 'opened'));
    assert.ok(recipe.source_refs.every(source => source.url.startsWith('https://')));
    assert.notEqual(recipe.status, 'executable');
  }
});

test('r39 ledger records both signed promotions and the unchanged kitchen boundary', () => {
  const progress = readFileSync(
    join(projectDirectory, 'docs', 'source-backed-one-pot-recipe-progress-20260804.md'),
    'utf8',
  );
  assert.match(progress, /r39 两道签署菜谱晋升记录（2026-08-05）/u);
  assert.match(progress, /腊味煲仔饭.*recipe_fact_checked.*executable.*签署通过/u);
  assert.match(progress, /冬菇滑鸡饭.*recipe_fact_checked.*executable.*签署通过/u);
  assert.match(progress, /executable=10.*executable=12/u);
  assert.match(progress, /kitchen_observed=0/u);
  assert.match(progress, /手抓饭.*保持.*recipe_fact_checked/u);
  assert.match(progress, /咖喱鸡.*保持.*recipe_fact_checked/u);
});

test('records Hezhe Mowenggu rice porridge as a named millet meal without inventing fish species or timing', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'heizhe-mowenggu-millet-porridge'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-HL-HEZHE-MOWENGGU-1'
  ));

  assert.equal(recipe?.canonical_name, '赫哲族莫温古饭');
  assert.deepEqual(recipe?.aliases, ['莫温古饭', '鱼肉粥']);
  assert.deepEqual(recipe?.region_codes, ['CN-HL']);
  assert.deepEqual(recipe?.traditional_vessels, []);
  assert.deepEqual(recipe?.core_ingredients, ['小米', '鱼或兽肉']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /鱼或兽肉.*小米.*一同烹制.*稀饭/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'unassessed', roles: [] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(source?.publisher, '黑龙江省文化和旅游厅（生活报）');
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(source?.evidence_locator ?? '', /正文第35至42行/);
  assert.match(recipe?.evidence_notes ?? '', /没有固定鱼种或肉种、克数、液体、时间/u);
});

test('records Jilin red-bean sorghum rice as a named wedding-pot staple without inventing its missing contracts', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'jilin-red-bean-sorghum-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-JL-RED-BEAN-SORGHUM-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '吉林小豆高粱米饭');
  assert.deepEqual(recipe?.aliases, ['小豆高粱米饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-JL']);
  assert.deepEqual(recipe?.traditional_vessels, ['大锅']);
  assert.deepEqual(recipe?.core_ingredients, ['小豆', '高粱米']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /小米.*七八成熟.*笊篱.*捞出/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /小豆高粱米饭.*并列.*一般工艺/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'unassessed', roles: [] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /正文第14至18行.*小豆高粱米饭/u);
  assert.match(recipe?.evidence_notes ?? '', /并列事实.*没有固定小豆和高粱米用量、液体、时间/u);
});

test('records Qingyang sticky-millet braised rice without inventing its missing contracts', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'qingyang-sticky-millet-braised-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-GS-QINGYANG-STICKY-MILLET-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '庆阳粘糜子焖饭');
  assert.deepEqual(recipe?.aliases, ['粘糜子焖饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-GS']);
  assert.deepEqual(recipe?.traditional_vessels, ['锅']);
  assert.deepEqual(recipe?.core_ingredients, ['粘糜子', '红枣']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /粘糜子.*淘洗.*锅中.*清水.*红枣.*慢煮/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /小火慢煮.*粘糜子焖饭/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'C', roles: ['carbohydrate'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'liquid', 'process', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /正文第62至65行/u);
  assert.match(recipe?.evidence_notes ?? '', /没有固定.*用量、精确液体量、时间/u);
});

test('records Yulin Laba braised rice with its staged bean-and-grain process only', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'yulin-laba-braised-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-SN-YULIN-LABA-BRAISED-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '榆林腊八焖饭');
  assert.deepEqual(recipe?.aliases, ['腊八焖饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-SN']);
  assert.deepEqual(recipe?.traditional_vessels, ['锅']);
  assert.deepEqual(recipe?.core_ingredients, ['软谷米', '软黄米', '红枣', '豇豆', '红糖']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /软谷米.*软黄米.*红枣.*豇豆.*浸泡/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /豇豆.*七分熟.*软谷米.*下锅/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /小火慢煮焖熟/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /小麻油.*盐.*葱花.*浇上热油/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'C', roles: ['carbohydrate', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(source?.access_status, 'search_extract_opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /腊八焖饭.*豇豆.*七分熟.*下软谷米/u);
  assert.match(recipe?.evidence_notes ?? '', /没有固定.*用量、液体量、份数、总时间/u);
});

test('records the Fujian beef mustard-greens rice process without inventing beef-specific timing or quantities', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'fujian-beef-mustard-greens-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-FJ-MUSTARD-BEEF-RICE-1');

  assert.equal(recipe?.canonical_name, '牛肉盖菜饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['牛肉', '盖菜', '米饭']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /盖菜.*焯水.*苦味/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /盖菜.*米饭同煮.*咸饭.*焖煮/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(recipe?.evidence_notes ?? '', /没有给出牛肉投料顺序、固定数量、液体、时间、安全终点或电饭煲适配/u);
});

test('records Quanzhou radish rice as a sourced same-pot process without inventing missing contracts', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'quanzhou-radish-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-MN-1');

  assert.equal(recipe?.canonical_name, '萝卜饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['萝卜', '带皮猪肉', '香菇', '海蛎', '虾干', '米']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /萝卜.*带皮猪肉.*香菇.*海蛎.*虾干.*同煮/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'unassessed',
    roles: [],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(recipe?.evidence_notes ?? '', /没有固定米量、液体、时间、安全终点或电饭煲适配/u);
});

test('records Wujiang fragrant-greens salted-pork rice as a sourced stir-fried dish without inventing its rice workflow', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'wujiang-fragrant-greens-salted-pork-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-JN-3');

  assert.equal(recipe?.canonical_name, '香青菜咸肉饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['吴江香青菜', '咸肉', '饭']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /香青菜.*咸肉饭.*炒食/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'unassessed',
    roles: [],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(recipe?.evidence_notes ?? '', /没有米饭与咸肉的具体投料顺序、液体、时间、安全终点或电饭煲适配/u);
});

test('records Pingtan golden-crab glutinous rice as a named banquet rice dish without inventing quantities or cooker equivalence', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'pingtan-golden-crab-glutinous-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-FJ-PINGTAN-GOLDEN-CRAB-GLUTINOUS-RICE-1');

  assert.equal(recipe?.canonical_name, '金蟳糯米饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-FJ']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['蒸制', '瓷盆']);
  assert.deepEqual(recipe?.core_ingredients, ['金蟳（锯缘青蟹）', '糯米', '香菇', '冬菜', '老酒']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /金蟳.*老酒.*切块.*香菇.*冬菜/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /瓷盆.*糯米.*入锅蒸熟/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'shellfish_fully_cooked',
    visual_endpoint: '肉质呈珍珠白或白色且不透明',
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.url, 'https://www.yidaiyilu.gov.cn/p/51351.html');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(recipe?.evidence_notes ?? '', /平潭.*宴席名菜.*固定数量.*电饭煲适配仍缺失/u);
});

test('records the official Youzhou she rice identity without inventing a fixed batch', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'youzhou-she-rice');
  assert.equal(recipe?.canonical_name, '酉州社饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['米', '腊肉', '豆腐干', '野菜']);
  assert.deepEqual(recipe?.traditional_vessels, ['锅', '蒸制']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.evidence_notes || '', /不把两条分支合并/);
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://youyang.gov.cn/sy_236/yyyw/202506/t20250610_14698997.html');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'process']);
});

test('records the Dong侗 steamed she rice identity without merging its two source branches', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'dong-steamed-she-rice');
  assert.equal(recipe?.canonical_name, '贵州侗家甑蒸社饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['糯米', '粳米', '蒿菜', '腌肉', '花生米', '干豆腐丁']);
  assert.deepEqual(recipe?.traditional_vessels, ['甑', '蒸制']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.evidence_notes || '', /不把它们合并/);
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://www.gzrd.gov.cn/gzwh/201912/t20191220_77669989.html?isMobile=true');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'process']);
});

test('records Wanshan she rice with its source-stated fresh-to-glutinous rice split', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'wanshan-she-rice');
  assert.equal(recipe?.canonical_name, '铜仁万山社饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['鲜米', '糯米', '蒿菜', '野葱', '豆子', '花生', '腊肉']);
  assert.deepEqual(recipe?.traditional_vessels, ['锅']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.evidence_notes || '', /三分之一.*鲜米.*三分之二.*糯米/);
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://www.tongren.gov.cn/2025/0405/333568.shtml');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'process']);
});

test('records Huixian ground-pot chicken rice without turning approximate broth or time into a fixed contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'huixian-ground-pot-chicken-rice');
  assert.equal(recipe?.canonical_name, '辉县地锅鸡米饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['生米', '鸡肉', '干豆角', '香菇', '粉条']);
  assert.deepEqual(recipe?.traditional_vessels, ['地锅']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 5);
  assert.match(recipe?.evidence_notes || '', /二十分钟左右/);
  assert.match(recipe?.evidence_notes || '', /不把.*固定/);
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://www.hntv.tv/ms/article/1/1186924396997120000?from=dxlist');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'process']);
});

test('records Mayang she rice with its source-stated 3-to-7 rice split and two methods', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'mayang-she-rice');
  assert.equal(recipe?.canonical_name, '麻阳社饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['粳米', '糯米', '社蒿菜', '腊肉', '野藠', '大蒜苗']);
  assert.deepEqual(recipe?.traditional_vessels, ['锅', '甑桶']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 5);
  assert.match(recipe?.evidence_notes || '', /3:7/);
  assert.match(recipe?.evidence_notes || '', /煮社饭和蒸社饭两条分支/);
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://www.mayang.gov.cn/mayang/c105440/202502/9d1d39afd086496da8cf07a96e138e76.shtml');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'quantity', 'process']);
});

test('records Xiangxi she rice while preserving the source ratio contradiction', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'xiangxi-she-rice');
  assert.equal(recipe?.canonical_name, '湘西社饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['粘米', '糯米', '蒿菜', '腊肉', '葫葱']);
  assert.deepEqual(recipe?.traditional_vessels, ['锅']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.deepEqual(recipe?.time_contract, { total_minutes: 30, source_ids: ['S-HN-XIANGXI-SHE-RICE-1'] });
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.evidence_notes || '', /三比一/);
  assert.match(recipe?.evidence_notes || '', /三分之一的粘米.*三分之二的糯米/);
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://www.hunan.gov.cn/hnszf/jxxx/hxwh/cwd/201711/t20171111_4685412.html');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'quantity', 'process', 'time']);
});

test('records Xiangjiangyuan Yao bamboo rice with its source-stated thirds', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'xiangjiangyuan-bamboo-rice');
  assert.equal(recipe?.canonical_name, '湘江源瑶家竹筒饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['糯米', '茶豆', '猪肉末']);
  assert.deepEqual(recipe?.traditional_vessels, ['竹筒']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.deepEqual(recipe?.time_contract, { total_minutes: 30, source_ids: ['S-HN-LANSHAN-BAMBOO-RICE-1'] });
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.evidence_notes || '', /三分之一糯米、三分之一茶豆、三分之一瘦肉末/);
  assert.match(recipe?.evidence_notes || '', /粽叶/);
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://www.lanshan.gov.cn/lanshan/msmw/201805/a96955c68487440983d0b541f179de37.shtml');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'quantity', 'process', 'time']);
});

test('records Lianyuan cured-pork red-date bamboo rice with its named local source', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'lianyuan-bamboo-rice');
  assert.equal(recipe?.canonical_name, '涟源腊肉红枣竹筒饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['粳米或糯米', '腊肉', '红枣']);
  assert.deepEqual(recipe?.traditional_vessels, ['竹筒', '火烤']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.deepEqual(recipe?.time_contract, { total_minutes: 20, source_ids: ['S-HN-LIANYUAN-BAMBOO-RICE-1'] });
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.evidence_notes || '', /粳米或糯米/);
  assert.match(recipe?.evidence_notes || '', /温火.*20分钟/);
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://whhlyt.hunan.gov.cn/whhlyt/news/sxxw/202309/t20230927_29503286.html');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'process', 'time']);
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

test('records Qijiang potato cured-pork kong rice with identity and bounded Chongqing technique evidence', () => {
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
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'unassessed', roles: [] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(source?.title, '2000名选手参赛 2025重庆老瀛山越野挑战赛开幕');
  assert.equal(source?.publisher, '重庆市人民政府网');
  assert.equal(source?.retrieved_at, '2026-08-03');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients']);
  assert.equal(source?.access_status, 'opened');
  assert.equal(validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status), false);
});

test('binds a bounded Chongqing kong-fan technique to Qijiang without treating it as a Qijiang-specific formula', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'qijiang-potato-cured-pork-kong-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-CQ-KONG-FAN-TECHNIQUE-1'
  ));

  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(source?.publisher, '搜狐号·重庆美食圈');
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /米饭.*七成熟.*沥干/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /洋芋.*调料.*翻炒/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /米饭.*洋芋.*适量的水.*插.*孔.*焖/u);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.match(recipe?.evidence_notes ?? '', /重庆通用箜饭技法/u);
  assert.match(recipe?.evidence_notes ?? '', /不建立綦江专属/u);
  assert.equal(validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status), false);
});

test('records Ninghe zengxiang pork rice from two bounded sources without inventing missing contracts', () => {
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
  assert.deepEqual(recipe?.core_ingredients, ['大米', '猪肉', '香菇']);
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

  const ingredientSource = recipe?.source_refs.find(item => (
    item.source_id === 'S-TJ-NINGHE-ZENG-PORK-RICE-2'
  ));
  assert.equal(ingredientSource?.publisher, '中宏网');
  assert.equal(ingredientSource?.access_status, 'opened');
  assert.deepEqual(ingredientSource?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(ingredientSource?.evidence_locator ?? '', /第139至140行/);
  assert.match(recipe?.evidence_notes ?? '', /三瘦七肥.*肉丁.*香菇.*宁河大米/u);
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

test('records the Jinjiang government corroboration for Shenhu Huzaifan without promoting approximate facts to contracts', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'shenhu-huzaifan'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-FJ-JINJIANG-SHENHU-HUZAI-1'
  ));

  assert.equal(source?.title, '关于开展“晋邑古筵”推荐餐厅认定工作的通知');
  assert.equal(source?.publisher, '晋江市人民政府');
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, [
    'identity',
    'ingredients',
    'process',
    'appliance',
    'time',
  ]);
  assert.match(source?.evidence_locator ?? '', /深沪壶仔饭/);
  assert.match(source?.evidence_locator ?? '', /约一时辰/);
  assert.match(source?.evidence_locator ?? '', /汤量宜适中/);
  assert.equal(recipe?.time_contract, null, 'an approximate source duration is not a fixed time contract');
  assert.equal(recipe?.liquid_contract, null, 'an unquantified broth amount is not a liquid contract');
  assert.match(recipe?.evidence_notes ?? '', /5至6分钟/);
  assert.match(recipe?.evidence_notes ?? '', /约1小时/);
  assert.match(recipe?.evidence_notes ?? '', /汤量宜适中/);
});

test('records the Xinhua corroboration for Enshi shefan while keeping the seasonal steaming facts non-executable', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'hubei-enshi-shefan'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-HB-XINHUA-ENSHI-SHEFAN-1'
  ));

  assert.equal(source?.title, '湖北恩施：充满春天味道的土家“社饭”');
  assert.equal(source?.publisher, '新华网');
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, [
    'identity',
    'ingredients',
    'process',
    'appliance',
  ]);
  assert.match(source?.evidence_locator ?? '', /青蒿/);
  assert.match(source?.evidence_locator ?? '', /木甑/);
  assert.deepEqual(recipe?.cooking_sequence[0]?.source_ids, [
    'S-HB-FORESTRY-SHEFAN-1',
    'S-HB-XINHUA-ENSHI-SHEFAN-1',
  ]);
  assert.deepEqual(recipe?.cooking_sequence[1]?.source_ids, [
    'S-HB-FORESTRY-SHEFAN-1',
    'S-HB-XINHUA-ENSHI-SHEFAN-1',
  ]);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
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
    'shanghai-salted-pork-vegetable-rice': 'executable',
    'shanghai-broad-bean-vegetable-rice': 'recipe_fact_checked',
    'wujiang-fragrant-greens-salted-pork-rice': 'recipe_fact_checked',
    'nanjing-aijiaohuang-rice': 'recipe_fact_checked',
    'wenzhou-mustard-greens-rice': 'recipe_fact_checked',
    'quanzhou-radish-rice': 'recipe_fact_checked',
    'minnan-salty-rice': 'recipe_fact_checked',
    'quanzhou-taro-rice': 'recipe_fact_checked',
    'shenhu-huzaifan': 'recipe_fact_checked',
    'quanzhou-yifan-oil-rice': 'recipe_fact_checked',
    'quanzhou-red-xun-rice': 'recipe_fact_checked',
    'taiwan-cabbage-rice': 'recipe_fact_checked',
    'taiwan-mushroom-bamboo-shoot-rice': 'recipe_fact_checked',
    'taiwan-tongzai-rice-cake': 'recipe_fact_checked',
    'cantonese-cured-meat-claypot-rice': 'executable',
    'cantonese-mushroom-chicken-claypot-rice': 'executable',
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

test('records the Quanzhou taro rice same-pot process without inventing quantities or cooker equivalence', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'quanzhou-taro-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-MN-QUANZHOU-TARO-RICE-2');

  assert.equal(recipe?.canonical_name, '芋头饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['锅']);
  assert.deepEqual(recipe?.core_ingredients, ['米', '芋头']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /芋头.*去皮切块.*热锅.*油炒.*米和水.*猪肉.*蔬菜.*盖上锅盖煮熟/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'C', roles: ['carbohydrate'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'search_extract_opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(recipe?.evidence_notes ?? '', /泉港地方志.*同锅工序.*没有固定数量、液体比例、时间、安全终点或电饭煲适配/u);
});

test('keeps the official Quanzhou yifan process instead of leaving its identity-only row empty', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'quanzhou-yifan-oil-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-MN-2');

  assert.equal(recipe?.canonical_name, '浥饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['柴火大锅']);
  assert.deepEqual(recipe?.core_ingredients, ['红葱头油', '大米', '三层肉', '香菇', '豆干', '蚵干', '干贝']);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /红葱头油.*大米.*三层肉.*香菇.*豆干.*蚵干.*干贝.*柴火大锅.*煮熟/u);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('process'));
  assert.match(recipe?.evidence_notes ?? '', /浥饭.*柴火大锅.*来源没有给.*有效液体.*总时间.*海味安全.*电饭煲/u);
});

test('keeps the Nanjing vegetable-rice alternatives explicit instead of inventing one fixed recipe', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'nanjing-aijiaohuang-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-JN-NANJING-XIAOHAN-1');

  assert.equal(recipe?.canonical_name, '南京菜饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, []);
  assert.deepEqual(recipe?.core_ingredients, ['矮脚黄', '糯米', '咸肉片或香肠片或板鸭丁']);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /矮脚黄青菜.*咸肉片、香肠片或板鸭丁.*生姜粒.*糯米.*一起煮/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /青菜和米饭一起翻炒.*咸肉、香肠、火腿或板鸭丁.*并列表达/u);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(recipe?.evidence_notes ?? '', /南京市地方志.*矮脚黄.*咸肉片.*香肠片.*板鸭丁.*来源没有给固定数量.*有效液体.*总时间.*电饭煲/u);
});

test('keeps the official Quanzhou red-xun process and its pressure-pot or steamer branches explicit', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'quanzhou-red-xun-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-MN-3');

  assert.equal(recipe?.canonical_name, '红蟳饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['高压锅', '蒸笼']);
  assert.deepEqual(recipe?.core_ingredients, ['红蟳', '米', '香菇', '小干贝', '三层肉']);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /红蟳.*清洗.*宰杀.*过油.*切/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /香菇.*小干贝.*三层肉.*米.*混合/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /两条分支.*高压锅.*蒸笼/u);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('process'));
  assert.match(recipe?.evidence_notes ?? '', /红蟳.*团体标准.*没有给.*固定.*蟹类安全.*电饭煲/u);
});

test('keeps eastern source identities distinct and cooker claims bounded', () => {
  // Merging source formulations or inventing cross-model cooker parameters is a data bug.
  const recipes = sourceBackedCatalog().recipes;
  const byId = new Map(recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.equal(recipes.filter(recipe => recipe.recipe_id === 'shanghai-salted-pork-vegetable-rice').length, 1);
  assert.equal(recipes.filter(recipe => recipe.recipe_id === 'taiwan-cabbage-rice').length, 1);

  assert.equal(byId.get('shenhu-huzaifan')?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(byId.get('taiwan-tongzai-rice-cake')?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(byId.get('cantonese-mushroom-chicken-claypot-rice')?.cooker_adaptation?.status, 'not_adapted');
  assert.match(byId.get('cantonese-mushroom-chicken-claypot-rice')?.cooker_adaptation?.notes ?? '', /没有电饭煲.*等价参数/u);
  assert.equal(byId.get('cantonese-cured-meat-claypot-rice')?.cooker_adaptation?.status, 'source_limited');
  assert.match(byId.get('cantonese-cured-meat-claypot-rice')?.cooker_adaptation?.notes ?? '', /仅提示.*电饭煲.*未给.*机型.*程序/u);

  const redXun = byId.get('quanzhou-red-xun-rice');
  assert.equal(redXun?.cooker_adaptation?.status, 'not_adapted');
  assert.match(redXun?.cooker_adaptation?.notes ?? '', /不提供现代电饭煲等价/u);

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

test('records Zhanjiang taro galangal-leaf rice as a named cooker variant without borrowing the base rice water rule', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'zhanjiang-taro-galou-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-GD-ZHANJIANG-GALOU-1');

  assert.equal(recipe?.canonical_name, '芋头蛤蒌饭');
  assert.deepEqual(recipe?.aliases, ['蛤蒌芋头饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.deepEqual(recipe?.traditional_vessels, ['炒锅', '电饭锅']);
  assert.deepEqual(recipe?.core_ingredients, ['蛤蒌叶', '米', '芋头']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /蛤蒌叶.*炒至熟黑.*米.*芋头/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /蒜头.*芋头.*翻炒.*电饭煲.*煮饭/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'C',
    roles: ['carbohydrate', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(recipe?.evidence_notes ?? '', /不把同页油炒蛤蒌饭的减水说明移植过来/u);
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

test('does not retain a regional blank for Tianjin once Ninghe zengxiang pork rice is sourced', () => {
  const catalog = sourceBackedCatalog();
  assert.equal(
    catalog.regional_blanks.some(blank => blank.region_code === 'CN-TJ'),
    false,
  );
});

test('records Huairou Lianqiaofan as a named communal-pot rice meal without importing ritual objects into cooking steps', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'huairou-lianqiaofan'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-BJ-HUAIROU-LIANQIAOFAN-1'
  ));
  const processSource = recipe?.source_refs.find(item => (
    item.source_id === 'S-BJ-HUAIROU-LIANQIAOFAN-2'
  ));

  assert.equal(recipe?.canonical_name, '怀柔敛巧饭');
  assert.deepEqual(recipe?.aliases, ['敛巧饭', '百家饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-BJ']);
  assert.deepEqual(recipe?.traditional_vessels, ['大锅']);
  assert.deepEqual(recipe?.core_ingredients, ['小米', '玉米', '肉', '冻豆腐', '萝卜干']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /收集.*小米.*玉米.*冻豆腐.*萝卜干.*百家饭/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /架锅.*烧火.*洗菜.*切菜.*炖肉.*蒸米饭/u);
  assert.doesNotMatch(recipe?.cooking_sequence.map(step => step.instruction).join(' '), /顶针|针线/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'unassessed', roles: [] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(source?.publisher, '怀柔区政务服务管理局');
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /第35至42行/);
  assert.equal(processSource?.publisher, '怀柔区文明办');
  assert.equal(processSource?.access_status, 'opened');
  assert.deepEqual(processSource?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(recipe?.evidence_notes ?? '', /仪式.*不写入料理步骤/u);
});

test('records the sourced Lingchuan heguo rice process without inventing a recipe contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'lingchuan-heguo-rice');
  const processSource = recipe?.source_refs?.find(item => item.source_id === 'S-SX-LINGCHUAN-HEGUO-RICE-2');
  assert.equal(recipe?.canonical_name, '陵川和锅大米');
  assert.deepEqual(recipe?.aliases, ['一锅出', '柴火大米']);
  assert.deepEqual(recipe?.region_codes, ['CN-SX']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['大米', '干豆角']);
  assert.deepEqual(recipe?.traditional_vessels, []);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /大米.*干豆角.*焖制/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'C', roles: ['carbohydrate', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://www.lczf.gov.cn/txlc_5/lcms/202512/t20251229_2302909.shtml');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients']);
  assert.equal(processSource?.url, 'https://app-new.sxwbs.com/pages/2026/04/24/bc279d8c60bf4588824d5f8f84222c47.html');
  assert.equal(processSource?.publisher, '山西晚报·山河+');
  assert.deepEqual(processSource?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.equal(processSource?.access_status, 'search_extract_opened');
  assert.match(recipe?.evidence_notes ?? '', /山西晚报.*大米.*干豆角.*焖制/u);
});

test('records Xiushan she rice as a sourced mixed-rice process without merging other regional she-rice variants', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'xiushan-she-rice');
  const source = recipe?.source_refs?.find(item => item.source_id === 'S-CQ-XIUSHAN-SHE-RICE-1');

  assert.equal(recipe?.canonical_name, '秀山社饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-CQ']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['大米', '糯米', '腊肉', '蒿菜', '野葱']);
  assert.deepEqual(recipe?.traditional_vessels, []);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /大米.*糯米.*煮熟/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /拌.*腊肉.*蒿菜.*野葱/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.url, 'https://nyncw.cq.gov.cn/ztzl_161/rdzt/xczx/gzdt_249775/stzx/202405/t20240507_13180827_wap.html');
  assert.equal(source?.publisher, '重庆市农业农村委员会');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.equal(source?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /秀山.*大米.*糯米.*煮熟.*腊肉.*蒿菜.*野葱/u);
});

test('records Xianfeng she rice from its local spring-society process without merging Enshi or Qianjiang variants', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'xianfeng-she-rice');
  const source = recipe?.source_refs?.find(item => item.source_id === 'S-HB-XIANFENG-SHE-RICE-1');

  assert.equal(recipe?.canonical_name, '咸丰社饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-HB']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['糯米', '腊肉', '白蒿']);
  assert.deepEqual(recipe?.traditional_vessels, []);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /白蒿.*洗.*切.*揉.*苦水/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /腊肉.*切剁/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /糯米.*翻炒.*拌/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.url, 'https://www.ctdsb.net/c1741_202604/2704266.html');
  assert.equal(source?.publisher, '湖北日报 / 极目新闻');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.equal(source?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /咸丰.*白蒿.*揉出苦水/u);
  assert.match(recipe?.evidence_notes ?? '', /腊肉.*翻炒糯米/u);
});

test('records Northeast one-pot as a named iron-pot staple meal without overstating its vegetable-only nutrition', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'northeast-one-pot');
  const source = recipe?.source_refs?.find(item => item.source_id === 'S-LN-NORTHEAST-ONE-POT-1');

  assert.equal(recipe?.canonical_name, '东北一锅出');
  assert.deepEqual(recipe?.aliases, ['锅边饽饽一锅出']);
  assert.deepEqual(recipe?.region_codes, ['CN-LN']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['豆角', '土豆', '茄子', '玉米面']);
  assert.deepEqual(recipe?.traditional_vessels, ['铁锅']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 5);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /玉米面.*发/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /铁锅.*油.*酱油.*炝锅/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /豆角.*土豆.*茄子/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /八分熟.*玉米面.*贴.*锅沿/u);
  assert.match(recipe?.cooking_sequence[4]?.instruction ?? '', /盖上锅.*半个小时/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'C',
    roles: ['carbohydrate', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.url, 'https://epaper.lnd.com.cn/lnbepaper/pc/att/202311/14/28895b71-2106-46ae-8dbc-98df05a4a5bd.pdf');
  assert.equal(source?.publisher, '辽宁日报');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance', 'time']);
  assert.equal(source?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /一锅出.*东北.*豆角.*土豆.*茄子.*玉米面/u);
  assert.match(recipe?.evidence_notes ?? '', /铁锅炖菜/u);
});

test('records Qianjiang firewood potato rice as a regional carb-only identity without implying a balanced meal', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'qianjiang-firewood-potato-rice');
  const source = recipe?.source_refs?.find(item => item.source_id === 'S-CQ-QIANGJIANG-FIREWOOD-POTATO-RICE-1');

  assert.equal(recipe?.canonical_name, '柴火洋芋饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-CQ']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['洋芋', '大米']);
  assert.deepEqual(recipe?.traditional_vessels, ['柴火灶台']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /高山洋芋.*翻炒至金黄/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /大米.*一同放入锅中/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /柴火.*慢炖/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'C',
    roles: ['carbohydrate'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.url, 'https://www.qianjiang.gov.cn/bmjd/xzfgzbm/qwhlyw/zwgk_49175/gkml/cyqj/czqj/202506/t20250612_14708703.html');
  assert.equal(source?.publisher, '重庆市黔江区人民政府');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.equal(source?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /洋芋.*大米.*柴火下慢炖/u);
  assert.match(recipe?.evidence_notes ?? '', /腊肉.*腊肠.*蔬菜.*可选/u);
});

test('records Hainan Li bamboo-tube rice with its source-stated meat, water, and charcoal boundaries', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'hainan-li-bamboo-tube-rice');
  const source = recipe?.source_refs?.find(item => item.source_id === 'S-HI-LI-BAMBOO-TUBE-RICE-1');

  assert.equal(recipe?.canonical_name, '黎家竹筒饭');
  assert.deepEqual(recipe?.aliases, ['黎族竹筒饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-HI']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['山兰米', '猪瘦肉']);
  assert.deepEqual(recipe?.traditional_vessels, ['竹筒', '木炭火']);
  assert.equal(recipe?.fixed_batch, null);
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 500, unit: 'g' },
    source_ids: ['S-HI-LI-BAMBOO-TUBE-RICE-1'],
  });
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /山兰米.*猪瘦肉.*味料/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /新鲜竹筒.*清水/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /木炭.*烤熟/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.url, 'https://m.idevsite.com/hainan/mstc/200606/4a427e8c0c504c81af537cd1755dfd3b.shtml');
  assert.equal(source?.publisher, '海南省人民政府办公厅');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'quantity', 'liquid', 'process', 'appliance']);
  assert.equal(source?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /黎族传统美食.*竹筒.*木炭/u);
  assert.match(recipe?.evidence_notes ?? '', /500克.*猪瘦肉100克.*清水500克/u);
});

test('records Dai pineapple rice with its named sweet-rice identity and steaming boundary', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'dai-pineapple-sticky-rice');
  const nationalSource = recipe?.source_refs?.find(item => item.source_id === 'S-YN-DAI-PINEAPPLE-RICE-1');
  const processSource = recipe?.source_refs?.find(item => item.source_id === 'S-GX-DAI-PINEAPPLE-RICE-1');

  assert.equal(recipe?.canonical_name, '傣族菠萝饭');
  assert.deepEqual(recipe?.aliases, ['菠萝紫米饭', '菠萝饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-YN']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['糯米', '菠萝', '火腿丁', '青豌豆或果脯']);
  assert.deepEqual(recipe?.traditional_vessels, ['菠萝', '蒸屉']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /糯米.*浸泡2小时以上.*蒸熟/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /菠萝.*掏空.*火腿丁.*青豌豆或果脯/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /菠萝.*上屉蒸20分钟/u);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'C',
    roles: ['carbohydrate', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(nationalSource?.url, 'https://www.neac.gov.cn/seac/ztzl/daiz/fsxg.shtml');
  assert.equal(nationalSource?.publisher, '国家民族事务委员会');
  assert.deepEqual(nationalSource?.claim_scopes, ['identity', 'ingredients']);
  assert.equal(processSource?.url, 'https://v.gxnews.com.cn/a/5269029');
  assert.equal(processSource?.publisher, '广西新闻网美食频道');
  assert.deepEqual(processSource?.claim_scopes, ['identity', 'ingredients', 'process', 'time']);
  assert.match(recipe?.evidence_notes ?? '', /傣族.*菠萝饭.*糯米/u);
  assert.match(recipe?.evidence_notes ?? '', /火腿丁.*青豌豆.*果脯.*20分钟/u);
  assert.match(recipe?.evidence_notes ?? '', /甜味米食.*C级.*不包装成均衡主餐/u);
});

test('records Longlin Zhuang five-color sticky rice without collapsing its two steaming-time sources', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'longlin-five-color-sticky-rice');
  const detailedSource = recipe?.source_refs?.find(item => item.source_id === 'S-GX-LONGLIN-FIVE-COLOR-RICE-1');
  const processSource = recipe?.source_refs?.find(item => item.source_id === 'S-GX-LONGLIN-FIVE-COLOR-RICE-2');

  assert.equal(recipe?.canonical_name, '隆林五色糯米饭');
  assert.deepEqual(recipe?.aliases, ['五色糯米饭', '五色饭', '花米饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-GX']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['糯米', '枫叶', '黄饭花', '红蓝草', '紫蕃滕']);
  assert.deepEqual(recipe?.traditional_vessels, ['木甑', '蒸桶']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /植物染料.*捣.*浸泡|煮沸.*过滤/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /糯米.*染料液.*浸泡.*至少4个小时/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /木甑|蒸桶.*40至50分钟.*约1小时/u);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'C',
    roles: ['carbohydrate'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(detailedSource?.url, 'https://www.longlin.gov.cn/index.php?c=show&id=72818');
  assert.equal(detailedSource?.publisher, '中共隆林各族自治县委员会宣传部');
  assert.deepEqual(detailedSource?.claim_scopes, ['identity', 'ingredients', 'process', 'time']);
  assert.equal(processSource?.url, 'https://www.longlin.gov.cn/index.php?c=show&id=72858');
  assert.equal(processSource?.publisher, '中共隆林各族自治县委员会宣传部');
  assert.deepEqual(processSource?.claim_scopes, ['identity', 'ingredients', 'process', 'time', 'appliance']);
  assert.match(recipe?.evidence_notes ?? '', /壮族.*三月三.*五色糯米饭/u);
  assert.match(recipe?.evidence_notes ?? '', /40至50分钟.*约一小时|约一小时.*40至50分钟/u);
  assert.match(recipe?.evidence_notes ?? '', /C级.*不包装成均衡主餐/u);
});

test('records Jixi bamboo-shoot braised rice with the sourced local process without inventing a cooker contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'jixi-bamboo-shoot-braised-rice');
  const identitySource = recipe?.source_refs?.find(item => item.source_id === 'S-AH-JIXI-BAMBOO-SHOOT-BRAISED-RICE-1');
  const processSource = recipe?.source_refs?.find(item => item.source_id === 'S-AH-JIXI-BAMBOO-SHOOT-BRAISED-RICE-2');

  assert.equal(recipe?.canonical_name, '绩溪笋焖饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-AH']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, []);
  assert.deepEqual(recipe?.core_ingredients, ['春笋', '腊肉', '豌豆', '糯米']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /腊肉.*煸炒.*咸香/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /笋丁.*豌豆.*翻炒/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /糯米和水.*焖煮/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(identitySource?.url, 'https://www.cnjx.gov.cn/Jczwgk/show/3490028.html');
  assert.equal(identitySource?.publisher, '绩溪县文化和旅游局 / 绩溪县人民政府');
  assert.deepEqual(identitySource?.claim_scopes, ['identity', 'ingredients']);
  assert.equal(identitySource?.access_status, 'opened');
  assert.equal(processSource?.url, 'https://cn.chinadaily.com.cn/a/202303/30/WS64255a2ea3102ada8b236164.html');
  assert.equal(processSource?.publisher, '中国日报网；引述安徽省文化和旅游厅资料');
  assert.deepEqual(processSource?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.equal(processSource?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /中国日报.*腊肉.*笋丁.*豌豆.*糯米和水.*焖煮/u);
});

test('records Huangpu cured-meat claypot rice with the sourced claypot process without inventing a cooker contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'huangpu-cured-meat-claypot-rice');
  const identitySource = recipe?.source_refs?.find(item => item.source_id === 'S-GD-HUANGPU-CURED-MEAT-CLAYPOT-RICE-1');
  const processSource = recipe?.source_refs?.find(item => item.source_id === 'S-GD-HUANGPU-CURED-MEAT-CLAYPOT-RICE-3');

  assert.equal(recipe?.canonical_name, '黄圃腊味煲仔饭');
  assert.deepEqual(recipe?.aliases, ['黄圃腊味蒸饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['煲仔', '砂煲']);
  assert.deepEqual(recipe?.core_ingredients, ['腊味', '糯米']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /米.*水.*砂煲.*约10分钟/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /水分.*收干/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /腊肠.*腊肉.*姜丝.*葱花/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /酱油.*拌匀/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(identitySource?.url, 'https://www.zs.gov.cn/hpz/zjhp/whmz/content/post_1292814.html');
  assert.equal(identitySource?.publisher, '中山市黄圃镇人民政府信息网');
  assert.deepEqual(identitySource?.claim_scopes, ['identity', 'ingredients', 'appliance']);
  assert.equal(identitySource?.access_status, 'opened');
  assert.equal(processSource?.url, 'https://zsrbapp.zsnews.cn/home/content/newsContent/cp411.html/561409');
  assert.equal(processSource?.publisher, '中山日报新媒体中心 / 中山网');
  assert.deepEqual(processSource?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.equal(processSource?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /中山日报.*砂煲.*米和水.*腊味.*没有固定批量.*电饭煲/u);
});

test('records Zhuji pea salted-pork rice with its source-stated stir-fry process without inventing a cooker contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'zhuji-pea-salted-pork-rice');
  const source = recipe?.source_refs?.[0];

  assert.equal(recipe?.canonical_name, '诸暨豌豆咸肉饭');
  assert.deepEqual(recipe?.aliases, ['豌豆饭', '立夏饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-ZJ']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['油锅']);
  assert.deepEqual(recipe?.core_ingredients, ['豌豆', '咸肉', '糯米']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /豌豆.*现剥.*咸肉.*糯米/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /入油锅.*混合炒制/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.url, 'https://www.zjsjw.gov.cn/yixiankuaixun/201705/t20170505_2604502_ext.html');
  assert.equal(source?.publisher, '浙江省纪律检查委员会 / 浙江省监察委员会');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.equal(source?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /诸暨.*立夏.*豌豆咸肉饭.*没有给出.*固定数量.*电饭煲/u);
});

test('records Kaiping Danjia carp stewed glutinous rice from the local heritage source without overclaiming a cooker contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'kaiping-danjia-carp-glutinous-rice');
  const source = recipe?.source_refs?.[0];

  assert.equal(recipe?.canonical_name, '鲤鱼炖糯米');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['电饭锅', '隔水炖']);
  assert.deepEqual(recipe?.core_ingredients, ['鲤鱼', '糯米', '枸杞', '红枣', '姜']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /鲤鱼.*去内脏.*糯米洗好/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /枸杞.*红枣.*姜.*腌制1\.5小时/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /糯米.*电饭锅.*隔水炖.*4小时/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /鲤鱼.*糯米饭面.*继续炖2小时/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.url, 'https://www.kaiping.gov.cn/csjdbsc/kjww/wh/content/post_3220203.html');
  assert.equal(source?.publisher, '开平市人民政府 / 江门市文化馆');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance', 'time']);
  assert.equal(source?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /鲤鱼炖糯米.*来源没有给.*固定数量.*安全终点/u);
});

test('records Chengkou cured-pork rice from the local cured-meat source without inventing a full cooking contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'chengkou-cured-pork-rice');
  const source = recipe?.source_refs?.[0];

  assert.equal(recipe?.canonical_name, '煮腊肉饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-CQ']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, []);
  assert.deepEqual(recipe?.core_ingredients, ['腊肉', '青豌豆', '胡萝卜', '糯米']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /清水.*浸泡半小时.*煮十五分钟/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /腊肉.*切成肉丁/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /青豌豆.*胡萝卜.*糯米.*煮腊肉饭/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.url, 'https://m.12371.gov.cn/content/2023-07/22/content_446437.html');
  assert.equal(source?.publisher, '七一网 / 中共重庆市委组织部');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'time']);
  assert.equal(source?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /城口.*腊肉饭.*来源没有给.*固定数量.*电饭煲/u);
});

test('records Tujia she rice in the Qianjiang area without merging another region\'s process', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'qianjiang-tujia-she-rice');
  const source = recipe?.source_refs?.[0];

  assert.equal(recipe?.canonical_name, '土家社饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-CQ']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, []);
  assert.deepEqual(recipe?.core_ingredients, ['糯米', '猪肉', '大蒜', '蒿草']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /糯米.*猪肉.*大蒜.*蒿草.*做成社饭/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.url, 'https://dfzb.abazhou.gov.cn/abzdfsbgs/c104049/201702/bc966f81a6884d95a6ae4ddbadcc549f.shtml');
  assert.equal(source?.publisher, '阿坝藏族羌族自治州地方志办公室');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.equal(source?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /黔江地区.*用糯米.*做成社饭.*没有给出.*固定数量.*电饭煲/u);
});

test('records southeast Chongqing Tujia he rice as a named layered rice meal without inventing quantities', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'southeast-chongqing-tujia-he-rice');
  const source = recipe?.source_refs?.[0];

  assert.equal(recipe?.canonical_name, '合饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-CQ']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['甑子', '鼎罐', '锅']);
  assert.deepEqual(recipe?.core_ingredients, ['米', '肉', '花椒', '盐']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.deepEqual(recipe?.cooking_sequence, [
    { step: 1, instruction: '将肉宰成坨，加花椒、盐等作料调味。', source_ids: ['S-CQ-TUJIA-HE-RICE-1'] },
    { step: 2, instruction: '将米和调味肉一层米一层肉码放数层，蒸熟即成合饭。', source_ids: ['S-CQ-TUJIA-HE-RICE-1'] },
  ]);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.url, 'https://dfz.cq.gov.cn/zqlswh/msmf_417820/202311/t20231102_12510457.html');
  assert.equal(source?.publisher, '重庆市地方志办公室');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.equal(source?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /合饭.*没有给出.*固定数量.*液体.*安全终点.*电饭煲/u);
});

test('records Shixing Yao glutinous vegetable rice from the source-stated staged process', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'shixing-yao-glutinous-vegetable-rice');
  const source = recipe?.source_refs?.[0];

  assert.equal(recipe?.canonical_name, '糯米菜饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['铁锅']);
  assert.deepEqual(recipe?.core_ingredients, ['糯米', '腊肉', '冬笋', '香菇', '蒜苗', '芥菜']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.deepEqual(recipe?.cooking_sequence, [
    { step: 1, instruction: '将腊肉切好放入烧热的铁锅中煸炒出油。', source_ids: ['S-GD-SHIXING-YAO-GLUTINOUS-VEGETABLE-RICE-1'] },
    { step: 2, instruction: '依次加入冬笋、香菇、蒜苗和芥菜翻炒。', source_ids: ['S-GD-SHIXING-YAO-GLUTINOUS-VEGETABLE-RICE-1'] },
    { step: 3, instruction: '加入提前蒸好的糯米饭搅拌，做成瑶乡特色糯米菜饭。', source_ids: ['S-GD-SHIXING-YAO-GLUTINOUS-VEGETABLE-RICE-1'] },
  ]);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.url, 'https://www.qb.gd.gov.cn/mlgd/content/post_1037668.html');
  assert.equal(source?.publisher, '广东省人民政府侨务办公室 / 金羊网');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.equal(source?.access_status, 'search_extract_opened');
  assert.match(recipe?.evidence_notes ?? '', /深渡水瑶族乡.*搜索摘录.*没有给出.*固定数量.*电饭煲/u);
});

test('records Daojiao dragon-boat rice with its named local process and staged grain preparation', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'dongguan-dragon-boat-rice');
  const source = recipe?.source_refs?.[0];

  assert.equal(recipe?.canonical_name, '龙船饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['锅']);
  assert.deepEqual(recipe?.core_ingredients, ['糯米', '粘米', '香菇', '虾米', '腊鸭肝', '腊肠', '瘦肉']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.deepEqual(recipe?.cooking_sequence, [
    { step: 1, instruction: '将香菇、虾米、腊鸭肝、腊肠和瘦肉等配料提前洗净、切碎备用。', source_ids: ['S-GD-DONGGUAN-DRAGON-BOAT-RICE-1'] },
    { step: 2, instruction: '锅中倒油，将切碎的配料快速爆炒出香味。', source_ids: ['S-GD-DONGGUAN-DRAGON-BOAT-RICE-1'] },
    { step: 3, instruction: '糯米和粘米按口感调配比例后浸泡，再蒸熟备用。', source_ids: ['S-GD-DONGGUAN-DRAGON-BOAT-RICE-1'] },
    { step: 4, instruction: '米饭按口味加入油、盐、糖、酱油调味，将炒香配料倒入饭中充分搅拌。', source_ids: ['S-GD-DONGGUAN-DRAGON-BOAT-RICE-1'] },
  ]);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.url, 'https://www.dg.gov.cn/daojiao/jjd40/d40xw/content/post_4220034.html');
  assert.equal(source?.publisher, '东莞市人民政府门户网站 / 道滘镇');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.equal(source?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /道滘.*龙船饭.*来源没有给.*固定数量.*电饭煲/u);
});

test('records Zhangpu Jiangnan vegetable rice as a named Kunshan locality variant', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'kunshan-zhangpu-jiangnan-vegetable-rice');
  const source = recipe?.source_refs?.[0];

  assert.equal(recipe?.canonical_name, '张浦江南菜饭');
  assert.deepEqual(recipe?.aliases, ['江南菜饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-JS']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['柴火土灶']);
  assert.deepEqual(recipe?.core_ingredients, ['大米', '金华村腊肉', '矮脚青菜']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.deepEqual(recipe?.cooking_sequence, [
    { step: 1, instruction: '以张浦本土大米、金华村腊肉和矮脚青菜，经柴火土灶焖煮鲜炒制成江南菜饭。', source_ids: ['S-JS-KUNSHAN-ZHANGPU-JIANGNAN-RICE-1'] },
  ]);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.url, 'https://www.ks.gov.cn/kss/bmdt/202505/b349fef57c6746d9ba9538434d020019.shtml');
  assert.equal(source?.publisher, '昆山市住房和城乡建设局');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.equal(source?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /江南菜饭张浦灶.*来源没有给.*固定数量.*电饭煲/u);
});

test('records Chaoshan ge rice as a named staged rice meal without turning preferred sides into fixed quantities', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'chaoshan-ge-rice');
  const source = recipe?.source_refs?.[0];

  assert.equal(recipe?.canonical_name, '潮汕戈饭');
  assert.deepEqual(recipe?.aliases, ['潮汕香饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, []);
  assert.deepEqual(recipe?.core_ingredients, ['新鲜米饭', '潮汕肉卷', '猪肉粒', '玉米', '香菇']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.deepEqual(recipe?.cooking_sequence, [
    { step: 1, instruction: '将潮汕肉卷用油炸或炒制，并加入猪肉粒、玉米、香菇等配菜炒香。', source_ids: ['S-GD-CHAOSHAN-GE-RICE-1'] },
    { step: 2, instruction: '将炒香的配料拌入新鲜煮熟的米饭。', source_ids: ['S-GD-CHAOSHAN-GE-RICE-1'] },
  ]);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.url, 'https://gzwxb.gov.cn/context/contextId/201941');
  assert.equal(source?.publisher, '广州市委网信办 / 羊城晚报微生活');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.equal(source?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /戈饭.*先.*配菜.*炒香.*拌入.*新鲜煮熟.*来源中的配菜.*固定必选数量/u);
});

test('records Cantonese raw-stir-fried glutinous rice as a named regional rice dish without converting it to a rice-cooker recipe', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'guangdong-raw-stir-fried-glutinous-rice');
  const source = recipe?.source_refs?.[0];

  assert.equal(recipe?.canonical_name, '广式生炒糯米饭');
  assert.deepEqual(recipe?.aliases, ['生炒糯米饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, []);
  assert.deepEqual(recipe?.core_ingredients, ['生糯米', '腊肠', '虾米', '香菇', '泡菇水']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.deepEqual(recipe?.cooking_sequence, [
    { step: 1, instruction: '在炒香的腊肠、虾米和香菇中加入生糯米。', source_ids: ['S-GD-CANTONESE-RAW-STIRRED-GLUTINOUS-RICE-1'] },
    { step: 2, instruction: '一边翻炒一边加入泡菇水，炒至米粒透明，再以蚝油调味。', source_ids: ['S-GD-CANTONESE-RAW-STIRRED-GLUTINOUS-RICE-1'] },
  ]);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.url, 'https://gzwxb.gov.cn/context/contextId/201941');
  assert.equal(source?.publisher, '广州市委网信办 / 羊城晚报微生活');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.equal(source?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /生炒糯米饭.*腊肠.*虾米.*香菇.*生糯米.*来源没有给.*固定数量.*电饭煲/u);
});

test('records Taishan chicken baked rice as a named regional rice meal without inventing a fixed cooker contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'taishan-chicken-baked-rice');
  assert.equal(recipe?.canonical_name, '台山鸡焗饭');
  assert.deepEqual(recipe?.aliases, ['台山特色鸡饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['米', '鸡肉', '腌料酱汁']);
  assert.deepEqual(recipe?.traditional_vessels, ['柴火灶']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /洗锅.*下米.*加水/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /腌制鸡块.*米饭/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /约20分钟/u);
  assert.equal(recipe?.time_contract, null, 'the report gives a restaurant-level duration, not a complete batch contract');
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.source_refs?.[0]?.access_status, 'search_extract_opened');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'process', 'time']);
  assert.match(recipe?.evidence_notes ?? '', /搜索摘录.*未给.*固定.*电饭煲/u);
});

test('records Yanshan broad-bean braised rice from the local media process without inventing quantities or cooker equivalence', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'yanshan-broad-bean-braised-rice');
  assert.equal(recipe?.canonical_name, '砚山豆焖饭');
  assert.deepEqual(recipe?.aliases, ['蚕豆焖饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-YN']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['锅']);
  assert.deepEqual(recipe?.core_ingredients, ['带豆壳青蚕豆', '腊肉或火腿肉', '半熟米饭']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /青蚕豆.*带豆壳/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /腊肉或火腿肉.*切丁/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /半熟米饭.*覆盖/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /小火焖熟.*翻炒拌匀/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://m.yunnan.cn/system/2023/04/06/032535920.shtml');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(recipe?.evidence_notes ?? '', /来源没有给.*固定.*米水比例.*电饭煲/u);
});

test('records Linxiang Boshan bean-braised rice from the local media process without inventing quantities or cooker equivalence', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'linxiang-boshan-bean-braised-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-YN-LINXIANG-BOSHAN-BEAN-RICE-1');

  assert.equal(recipe?.canonical_name, '博尚豆焖饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-YN']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['柴火灶', '锅']);
  assert.deepEqual(recipe?.core_ingredients, ['青蚕豆', '火腿肉或腊肉', '熟米饭']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 5);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /青蚕豆.*清洗/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /火腿肉.*切成丁/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /大米.*煮熟/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /火腿肉.*炒香.*青蚕豆.*翻炒.*熟米饭.*覆盖.*开水/u);
  assert.match(recipe?.cooking_sequence[4]?.instruction ?? '', /小火焖熟.*翻炒拌匀/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.url, 'https://m.yunnan.cn/system/2023/12/09/032866216.shtml');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(recipe?.evidence_notes ?? '', /博尚镇.*没有给.*固定.*米水比例.*电饭煲/u);
});

test('records Fujian beef mustard-greens rice process facts without inventing a beef recipe contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'fujian-beef-mustard-greens-rice');
  assert.equal(recipe?.canonical_name, '牛肉盖菜饭');
  assert.deepEqual(recipe?.aliases, ['盖菜牛肉饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-FJ']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, []);
  assert.deepEqual(recipe?.core_ingredients, ['牛肉', '盖菜', '米饭']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /盖菜.*焯水.*苦味/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /盖菜.*米饭同煮.*咸饭.*焖煮/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://m.thepaper.cn/newsDetail_forward_32454690');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(recipe?.evidence_notes ?? '', /直接列出.*牛肉盖菜饭.*没有给出牛肉投料顺序.*固定.*时间/u);
});

test('records Chikan claypot-rice craft with the government-sourced claypot process without inventing a cooker contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'chikan-claypot-rice-craft');
  const processSource = recipe?.source_refs.find(item => item.source_id === 'S-GD-KAIPING-CHIKAN-CLAYPOT-RICE-2');
  assert.equal(recipe?.canonical_name, '赤坎煲仔饭');
  assert.deepEqual(recipe?.aliases, ['赤坎煲仔饭烹饪技艺']);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['煲仔', '果木柴火']);
  assert.deepEqual(recipe?.core_ingredients, ['十月晚稻米', '肉类或腊味', '本地时令食材']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /挑选.*煲仔.*受热处理.*十月晚稻米/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /浸米.*2小时/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /大火.*煮沸.*中火.*七成熟.*配料/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /熄火.*余温.*焗5分钟.*酱油.*葱花/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'unassessed', roles: [] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://www.kaiping.gov.cn/kpswhgdlytyj/kpwhg/fwzwhyc/fyxm/content/post_2533528.html');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'appliance']);
  assert.equal(processSource?.url, 'https://www.kaiping.gov.cn/jmkpsckz/gkmlpt/content/3/3394/post_3394460.html');
  assert.equal(processSource?.publisher, '江门开平市赤坎镇人民政府');
  assert.deepEqual(processSource?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance', 'time']);
  assert.equal(processSource?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /央视.*浸米2小时.*七成熟.*焗5分钟.*没有给出.*电饭煲/u);
});

test('records Taishan eel rice from the official standard and craft account without inventing a batch or cooker conversion', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'taishan-eel-rice');
  assert.equal(recipe?.canonical_name, '台山黄鳝饭');
  assert.deepEqual(recipe?.aliases, ['台山黄鳝焗饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['砂煲']);
  assert.deepEqual(recipe?.core_ingredients, ['台山本地小农粘米', '鲜活黄鳝', '姜葱', '酱油']);
  assert.equal(recipe?.fixed_batch, null, 'the source gives a rice-to-eel ratio, not an absolute batch');
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /黄鳝.*沸水中煮熟.*过冷河/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /起出黄鳝肉并拆骨.*姜葱.*酱油.*中火翻炒/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /米与黄鳝约1∶1\.5.*米饭.*刚刚煮熟/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /小火焗5分钟.*葱花.*拌匀/u);
  assert.equal(recipe?.time_contract, null, 'the source only fixes the finishing bake, not the full meal duration');
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://www.jiangmen.gov.cn/bmpd/jmswhgdlytyj/zwgk/gzdt/content/post_3145157.html');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'quantity', 'process', 'appliance']);
  assert.match(recipe?.evidence_notes ?? '', /1∶1\.5.*不建立.*电饭锅/u);
});

test('records Shixi luo rice with the local tourism recipe process without inventing a cooker contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'taishan-shixialuo-rice');
  const processSource = recipe?.source_refs?.find(item => item.source_id === 'S-GD-TAISHAN-SHIXIALUO-RICE-2');
  assert.equal(recipe?.canonical_name, '石硖螺饭');
  assert.deepEqual(recipe?.aliases, ['石夹螺饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['砂锅']);
  assert.deepEqual(recipe?.core_ingredients, ['石硖螺肉', '猪肉粒', '米饭']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 5);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /清洗石夹螺.*取出.*泡米半小时/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /爆香.*猪肉粒.*石夹螺肉/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /酱油.*蚝油.*盐.*油/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /砂锅.*饭熟.*再次.*石夹螺肉.*焖8分钟/u);
  assert.match(recipe?.cooking_sequence[4]?.instruction ?? '', /香菜.*葱.*焖2分钟.*拌匀.*焖2分钟/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://www.jiangmen.gov.cn/bmpd/jmswhgdlytyj/ztzl/xwjm/content/post_3385222.html');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients']);
  assert.equal(processSource?.url, 'https://www.chuanshanqundao.com/News/Info-2986.html');
  assert.equal(processSource?.publisher, '川山群岛旅游网');
  assert.deepEqual(processSource?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.equal(processSource?.access_status, 'opened');
  assert.match(recipe?.evidence_notes ?? '', /川山群岛旅游网.*砂锅.*重复写入.*没有给出.*水量.*安全/u);
});

test('records Shisan fish braised rice as a Meixian Hakka intangible-food identity without inventing raw-fish safety or cooker quantities', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'meixian-shisan-fish-braised-rice');
  assert.equal(recipe?.canonical_name, '石扇鱼焖饭');
  assert.deepEqual(recipe?.aliases, ['石扇鱼饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['柴火灶', '高压锅']);
  assert.deepEqual(recipe?.core_ingredients, ['米', '鲩鱼', '鱼血', '葱花', '姜丝', '金不换']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /鱼血.*加入米.*香煎.*鲩鱼/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /柴火.*焖煮.*高压锅/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /葱花.*姜丝.*自制酱料.*金不换/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://www.gdmx.gov.cn/zjmx/mssx/content/post_2903785.html');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(recipe?.evidence_notes ?? '', /鱼血.*安全.*固定数量.*电饭煲/u);
});

test('records Humen duck-triad cured-meat rice as a named one-pot rice process without inventing quantities or safety endpoints', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'humen-duck-triad-cured-rice');
  assert.equal(recipe?.canonical_name, '鸭三宝腊味饭');
  assert.deepEqual(recipe?.aliases, ['虎门鸭三宝饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['煲仔']);
  assert.deepEqual(recipe?.core_ingredients, ['米饭', '腊鸭心', '腊鸭肝', '腊鸭肠', '葱花']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /米饭煮开/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /鸭三宝.*一起煮熟.*腊味香气渗透/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /切成小粒.*葱花.*米饭拌匀/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://nyncj.dg.gov.cn/zzzl/content/post_4479655.html');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(recipe?.evidence_notes ?? '', /虎门.*腊鸭心.*腊鸭肝.*腊鸭肠.*没有固定数量.*安全终点/u);
});

test('records Dalang Hengping goose rice as a named village dish without inventing a batch or cooker contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'dongguan-hengping-goose-rice');
  assert.equal(recipe?.canonical_name, '水平鹅饭');
  assert.deepEqual(recipe?.aliases, ['大朗水平鹅饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['传统土灶', '荔枝树柴火']);
  assert.deepEqual(recipe?.core_ingredients, ['丝苗米', '鹅肉', '酱油', '葱花']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /鹅只肥瘦适中.*丝苗米.*山泉水/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /自家养的鹅.*主食.*生鹅入米.*安全/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /拌匀.*酱油.*葱花/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://www.dg.gov.cn/zjdz/whdz/dztc/content/post_3957867.html');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(recipe?.evidence_notes ?? '', /水平村.*没有固定数量.*电饭煲/u);
});

test('records Shexian millet braised rice with its vegetable branch without inventing a grain batch or liquid contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'shexian-millet-braised-rice');
  assert.equal(recipe?.canonical_name, '涉县小米焖饭');
  assert.deepEqual(recipe?.aliases, ['小米焖饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-HE']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['锅']);
  assert.deepEqual(recipe?.core_ingredients, ['小米', '白菜或茄子']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /白菜或茄子.*时菜.*炒.*小米.*盐.*水.*焖熟/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /纯小米.*胡萝卜条.*土豆丝.*野韭花.*酸菜/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://zhuanti.mct.gov.cn/rxhmxjgn2022/hebei/detail/2790.html');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(recipe?.evidence_notes ?? '', /涉县.*没有给出.*固定数量.*电饭煲/u);
});

test('removes the generic Hebei regional blank once Shexian has a source-backed candidate', () => {
  const blank = sourceBackedCatalog().regional_blanks.find(item => (
    item.region_code === 'CN-HE' && item.candidate_name === '未保留候选'
  ));
  assert.equal(blank, undefined);
});

test('records Wuan lamb millet braised rice with its source-limited cooking sequence', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'wuan-lamb-millet-braised-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-HE-WUAN-LAMB-MILLET-RICE-1');

  assert.equal(recipe?.canonical_name, '武安羊肉小米焖饭');
  assert.deepEqual(recipe?.aliases, ['羊肉小米焖饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-HE']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['砂锅']);
  assert.deepEqual(recipe?.core_ingredients, ['小米', '山羊肉', '胡萝卜', '白菜', '大葱']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /山羊肉.*切片.*小米.*淘洗/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /胡萝卜.*白菜.*煸炒/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /少许清水.*下入小米.*炖至快熟/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /关闭火.*砂锅.*余温.*焖熟/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(recipe?.evidence_notes ?? '', /没有固定数量.*液体量.*总时间.*电饭煲适配/u);
});

test('records Shidian iron-pot ham potato rice while preserving the source vessel wording conflict', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => item.recipe_id === 'shidian-iron-pot-ham-potato-rice');
  assert.equal(recipe?.canonical_name, '铁锅土豆火腿肉焖饭');
  assert.deepEqual(recipe?.aliases, ['罗锅火腿肉土豆焖饭', '铜锅土豆焖饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-YN']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['铁锅', '铜锅']);
  assert.deepEqual(recipe?.core_ingredients, ['大米', '火腿肉', '土豆']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /淘洗好的大米.*适量清水/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /水分收干.*火腿肉.*土豆丁/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /铁锅.*铜锅.*称呼冲突/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://shidian.gov.cn/info/1111/3740813.htm');
  assert.deepEqual(recipe?.source_refs?.[0]?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(recipe?.evidence_notes ?? '', /来源同时写.*铁锅.*铜锅.*没有固定数量.*电饭煲/u);
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

test('records the first-priority source matrix and promotes only the closed Shanghai contract', () => {
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
  assert.equal(shanghai?.status, 'executable');
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
  assert.deepEqual(yangpu?.claim_scopes, ['identity', 'ingredients']);
  assert.match(curedMeat?.evidence_notes ?? '', /WOL.*完整单一版本.*不与.*农粮署/u);
  assert.deepEqual(curedMeat?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 1, unit: '杯' },
    source_ids: ['S-WOL-HK-CURED-CLAYPOT-RICE-1'],
  });
  assert.deepEqual(curedMeat?.time_contract, {
    total_minutes: 75,
    source_ids: ['S-WOL-HK-CURED-CLAYPOT-RICE-1'],
  });
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
  assert.deepEqual(recipe?.time_contract, {
    total_minutes: 60,
    source_ids: ['S-TW-MOA-KIDS-PUMPKIN-RICE-1'],
  }, 'r145 records the same-source 60-minute total duration');
  assert.deepEqual(
    recipe?.safety_endpoints.map(endpoint => endpoint.code).sort(),
    ['pork_fully_cooked', 'shellfish_fully_cooked'],
  );
  assert.equal(source?.claim_scopes.includes('time'), true);
  assert.ok(recipe?.allergen_labels.includes('甲壳类'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('keeps the Ministry of Agriculture pumpkin-rice variant separate from the AFA ratio contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'taiwan-pumpkin-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-TW-MOA-KIDS-PUMPKIN-RICE-1');

  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 1);
  assert.match(source?.evidence_locator ?? '', /南瓜饭.*600克.*白米4杯.*约60分钟.*5杯水.*外锅1米杯水/u);
  assert.equal(source?.claim_scopes.includes('liquid'), true);
  assert.match(recipe?.evidence_notes ?? '', /南瓜600克、白米4杯.*独立版本.*不与.*0\.8倍/u);
  assert.equal(recipe?.fixed_batch, null);
  assert.deepEqual(recipe?.time_contract, {
    total_minutes: 60,
    source_ids: ['S-TW-MOA-KIDS-PUMPKIN-RICE-1'],
  });
});

test('structures and promotes the fixed Shanghai salted-pork vegetable-rice source contract without claiming an electric-cooker adaptation', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'shanghai-salted-pork-vegetable-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-WOL-SHANGHAI-CAIFAN-1');

  assert.equal(recipe?.status, 'executable');
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

test('uses one complete WOL mushroom-chicken claypot-rice version without blending the older evidence variants', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'cantonese-mushroom-chicken-claypot-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-WOL-CHICKEN-MUSHROOM-CLAYPOT-RICE-1');

  assert.equal(recipe?.fixed_batch?.servings, 2);
  assert.deepEqual(recipe?.fixed_batch?.source_ids, ['S-WOL-CHICKEN-MUSHROOM-CLAYPOT-RICE-1']);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '茉莉香米')?.amount?.value, 1);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '去骨去皮鸡腿肉')?.amount?.value, 8);
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 1, unit: '杯低钠鸡高汤或水' },
    source_ids: ['S-WOL-CHICKEN-MUSHROOM-CLAYPOT-RICE-1'],
  });
  assert.equal(recipe?.cooking_sequence.length, 5);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /冬菇.*金针菜.*木耳.*2小时/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /鸡腿肉.*腌.*30分钟/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /米.*25分钟.*1杯.*高汤或水/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /中高火.*3分钟.*小火.*25分钟/);
  assert.match(recipe?.cooking_sequence[4]?.instruction ?? '', /鸡肉和米饭熟透.*葱绿/);
  assert.equal(recipe?.time_contract?.total_minutes, 190);
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'poultry_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.equal(source?.license, 'publisher_copyright');
  assert.equal(source?.evidence_tier, 5);
  assert.deepEqual(source?.claim_scopes, [
    'identity', 'ingredients', 'quantity', 'liquid', 'process', 'appliance', 'time',
  ]);
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
  const techniqueSource = recipe?.source_refs.find(item => item.source_id === 'S-SC-KONGGAN-TECHNIQUE-1');

  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /大米.*半熟.*沥水/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /蔬菜和肉类.*切(?:成)?丁.*八分熟/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /大米.*堆状.*锅边.*适量(?:水|加水)/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /小火.*10.*15分钟.*水或米汤.*蒸发.*锅巴/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.match(recipe?.cooker_adaptation?.notes ?? '', /电饭/);
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(source?.claim_scopes.includes('identity'));
  assert.equal(techniqueSource?.access_status, 'opened');
  assert.deepEqual(techniqueSource?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(recipe?.evidence_notes ?? '', /10至15分钟.*不是从淘米到出锅的完整总时长/);
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
  const batchSource = recipe?.source_refs.find(item => item.source_id === 'S-GZ-TONGREN-SHEFAN-3');

  assert.equal(recipe?.canonical_name, '铜仁社饭');
  assert.deepEqual(recipe?.region_codes, ['CN-GZ']);
  assert.deepEqual(recipe?.fixed_batch, {
    servings: 40,
    ingredients: [
      { name: '腊肉', amount: { value: 30, unit: '斤' }, source_ids: ['S-GZ-TONGREN-SHEFAN-3'] },
      { name: '籼米和糯米', amount: { value: 120, unit: '斤' }, source_ids: ['S-GZ-TONGREN-SHEFAN-3'] },
      { name: '青蒿', amount: { value: 20, unit: '斤' }, source_ids: ['S-GZ-TONGREN-SHEFAN-3'] },
      { name: '野葱', amount: { value: 30, unit: '斤' }, source_ids: ['S-GZ-TONGREN-SHEFAN-3'] },
      { name: '蒜苗', amount: { value: 10, unit: '斤' }, source_ids: ['S-GZ-TONGREN-SHEFAN-3'] },
    ],
    source_ids: ['S-GZ-TONGREN-SHEFAN-3'],
  });
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
  assert.equal(batchSource?.access_status, 'opened');
  assert.equal(batchSource?.publisher, '贵州政协报');
  assert.deepEqual(batchSource?.claim_scopes, ['identity', 'ingredients', 'quantity']);
  assert.match(batchSource?.evidence_locator ?? '', /第44至50行/);
  assert.match(recipe?.evidence_notes ?? '', /40人分量/);
  assert.match(recipe?.evidence_notes ?? '', /没有给出籼米和糯米的比例/);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('uses one complete WOL cured-meat claypot-rice version without blending the older evidence variants', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'cantonese-cured-meat-claypot-rice'
  ));
  const source = recipe?.source_refs.find(item => item.source_id === 'S-WOL-HK-CURED-CLAYPOT-RICE-1');

  assert.deepEqual(source?.claim_scopes, [
    'identity', 'ingredients', 'quantity', 'liquid', 'process', 'appliance', 'time',
  ]);
  assert.equal(source?.evidence_tier, 5);
  assert.equal(recipe?.fixed_batch?.servings, 2);
  assert.deepEqual(recipe?.fixed_batch?.source_ids, ['S-WOL-HK-CURED-CLAYPOT-RICE-1']);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '长粒米')?.amount?.value, 1);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '广式腊肠')?.amount?.unit, '至2条');
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 1, unit: '杯' },
    source_ids: ['S-WOL-HK-CURED-CLAYPOT-RICE-1'],
  });
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /1杯米.*1杯水.*1小时/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /腊肉.*腊肠.*小火.*10分钟/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /酱汁.*3分钟/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /切片.*葱/);
  assert.equal(recipe?.time_contract?.total_minutes, 75);
  assert.match(recipe?.evidence_notes ?? '', /WOL.*完整单一版本.*不与.*农粮署/u);
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
        ['S-SC-KONGGAN-TECHNIQUE-1', '四川传统“箜饭”技艺与孔干饭餐厅', '中华网 / 财讯界', 'https://m.tech.china.com/digi/digi/20221125/202211251185477.html', ['identity', 'ingredients', 'process']],
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
        ['S-HB-XINHUA-ENSHI-SHEFAN-1', '湖北恩施：充满春天味道的土家“社饭”', '新华网', 'https://www.xinhuanet.com/politics/2018-03/14/c_1122537107_5.htm', ['identity', 'ingredients', 'process', 'appliance']],
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

test('records Yangzhou fried rice as a named three-stage process without inventing a home-cooker contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'yangzhou-standard-fried-rice'
  ));
  const standard = recipe?.source_refs.find(item => item.source_id === 'S-JS-YANGZHOU-FRIED-RICE-STANDARD-1');
  const process = recipe?.source_refs.find(item => item.source_id === 'S-JS-YANGZHOU-FRIED-RICE-PROCESS-1');

  assert.equal(recipe?.canonical_name, '扬州炒饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, [
    '籼米饭', '鲜鸡蛋', '水发海参', '熟地方鸡腿肉', '中国火腿肉',
    '水发干贝', '上浆湖虾仁', '水发花菇', '净鲜笋', '青豌豆',
  ]);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /配料.*什锦/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /炒蛋饭/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /蛋饭.*什锦.*合炒/u);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(standard?.access_status, 'opened');
  assert.equal(process?.access_status, 'opened');
  assert.deepEqual(process?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(recipe?.evidence_notes ?? '', /三步工艺.*什锦.*蛋饭.*合炒/u);
  assert.match(recipe?.evidence_notes ?? '', /没有固定家庭批量、液体、时间、安全终点或电饭煲适配/u);
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
  assert.equal(source?.access_status, 'opened');
  assert.ok(source?.claim_scopes.includes('quantity'));
  assert.ok(source?.claim_scopes.includes('liquid'));
  assert.ok(source?.claim_scopes.includes('appliance'));
  assert.ok(source?.claim_scopes.includes('process'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Shenhu salty rice as a separately named source-backed variant', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'shenhu-salty-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-FJ-JINJIANG-SHENHU-HUZAI-1'
  ));

  assert.equal(recipe?.canonical_name, '深沪咸饭');
  assert.deepEqual(recipe?.aliases, ['壶仔咸饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-FJ']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['大米', '三层肉', '干香菇', '干目鱼', '胡萝卜']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /大米浸透.*目鱼.*香菇.*胡萝卜/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /五花肉.*煸油.*目鱼.*香菇.*胡萝卜/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /大米炒匀.*入煲煮熟/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /葱白炸油.*拌入饭中.*葱花/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Zijin stuffed-duck rice from the county food-culture source without inventing broth or safety contracts', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'zijin-stuffed-duck-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-GD-ZIJIN-YANI-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '酿鸭饭');
  assert.deepEqual(recipe?.aliases, ['紫金酿鸭饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['糯米', '番鸭', '五花肉', '鱿鱼', '花生米', '鸭汤']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 5);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /番鸭.*约3公斤.*煮熟.*鸭皮/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /花生米.*鱿鱼.*五花肉/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /糯米.*2至3斤.*鸭汤/);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /鸭皮.*4至6块.*蒸笼.*约30分钟/);
  assert.match(recipe?.cooking_sequence[4]?.instruction ?? '', /花生油.*葱花/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'C',
    roles: ['carbohydrate', 'protein'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'search_extract_opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'quantity', 'process', 'appliance']);
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

test('records Shidian broad-bean ham rice with a source-limited electric-cooker branch', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'shidian-broad-bean-ham-rice'
  ));
  const identitySource = recipe?.source_refs.find(item => (
    item.source_id === 'S-YN-SHIDIAN-BROAD-BEAN-HAM-RICE-1'
  ));
  const methodSource = recipe?.source_refs.find(item => (
    item.source_id === 'S-YN-SHIDIAN-BROAD-BEAN-HAM-RICE-2'
  ));

  assert.equal(recipe?.canonical_name, '施甸蚕豆火腿焖饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.region_codes, ['CN-YN']);
  assert.deepEqual(recipe?.traditional_vessels, ['电饭锅']);
  assert.deepEqual(recipe?.core_ingredients, ['米饭', '蚕豆', '火腿']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 5);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /大米.*淘洗.*泡/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /蚕豆.*火腿.*切/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /猪油.*火腿丁.*蚕豆/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /炒好的火腿蚕豆.*电饭锅.*平时煮米饭的水量/u);
  assert.match(recipe?.cooking_sequence[4]?.instruction ?? '', /保温后再焖十分钟/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.deepEqual(recipe?.cooker_adaptation?.source_ids, ['S-YN-SHIDIAN-BROAD-BEAN-HAM-RICE-2']);
  assert.equal(identitySource?.access_status, 'opened');
  assert.deepEqual(identitySource?.claim_scopes, ['identity', 'ingredients']);
  assert.equal(methodSource?.access_status, 'opened');
  assert.deepEqual(methodSource?.claim_scopes, ['identity', 'ingredients', 'quantity', 'process', 'appliance']);
  assert.ok(recipe?.evidence_notes.includes('两条来源'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Pudong yellow catfish vegetable rice as a named regional dish without inventing cooker parameters', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'pudong-angci-fish-vegetable-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-SH-PUDONG-ANGCI-FISH-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '昂刺鱼菜饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.region_codes, ['CN-SH']);
  assert.deepEqual(recipe?.core_ingredients, ['昂刺鱼', '青菜', '米']);
  assert.deepEqual(recipe?.traditional_vessels, ['炉灶']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /昂刺鱼.*入味/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /炉灶.*(悬|吊).*鱼.*米/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(recipe?.evidence_notes.includes('没有固定数量'));
  assert.ok(recipe?.evidence_notes.includes('电饭煲'));
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.publisher, '上海市文化和旅游局');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Huangshi seasonal radish braised rice with its exact ingredient facts and cooker boundary', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'huangshi-radish-braised-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-HB-HUANGSHI-RADISH-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '萝卜焖饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.region_codes, ['CN-HB']);
  assert.deepEqual(recipe?.traditional_vessels, ['炒锅', '电饭煲']);
  assert.deepEqual(recipe?.core_ingredients, [
    '白萝卜', '三层肉', '大米', '红葱头', '干香菇', '萝卜干', '虾皮',
  ]);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 10);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /白萝卜/);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /干香菇/);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /红葱头/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /三层肉.*煎炒/);
  assert.match(recipe?.cooking_sequence[5]?.instruction ?? '', /电饭煲.*正常煮饭/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.ok(recipe?.evidence_notes.includes('适量清水'));
  assert.ok(recipe?.evidence_notes.includes('未给出份数'));
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.publisher, '黄石市住房和城市更新局');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'quantity', 'process', 'appliance']);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Taihang millet braised rice with its regional ingredient and no invented contracts', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'taihang-millet-braised-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-HA-TAIHANG-MILLET-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '太行小米焖饭');
  assert.deepEqual(recipe?.aliases, ['小米焖饭', '捞饭', '咸米稠饭']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.region_codes, ['CN-HA']);
  assert.deepEqual(recipe?.traditional_vessels, ['锅']);
  assert.deepEqual(recipe?.core_ingredients, [
    '太行山小米', '时令蔬菜', '肉类', '碎粉条',
  ]);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /时令蔬菜.*肉类/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /七八分熟/);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /不搅锅/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(recipe?.evidence_notes.includes('没过米菜'));
  assert.ok(recipe?.evidence_notes.includes('未给出固定重量'));
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.publisher, '中国旅游新闻网');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records the cross-regional Manchu-Xibe dazi rice porridge without inventing a cooker contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'manchu-xibe-dazi-rice-porridge'
  ));
  const identitySource = recipe?.source_refs.find(item => (
    item.source_id === 'S-NM-LOCAL-GAZETTEER-DAZI-PORRIDGE-1'
  ));
  const processSource = recipe?.source_refs.find(item => (
    item.source_id === 'S-XJ-XIBE-DAZI-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '鞑子饭（小肉粥）');
  assert.deepEqual(recipe?.aliases, ['鞑子粥', '小肉饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-NM', 'CN-XJ']);
  assert.deepEqual(recipe?.core_ingredients, ['猪肉', '粳米（大米）或小米']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /猪肉.*粳米.*小米.*煮熟成粥/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'C',
    roles: ['carbohydrate', 'protein'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(identitySource?.access_status, 'search_extract_opened');
  assert.ok(identitySource?.claim_scopes.includes('identity'));
  assert.equal(processSource?.access_status, 'search_extract_opened');
  assert.ok(processSource?.claim_scopes.includes('ingredients'));
  assert.ok(processSource?.claim_scopes.includes('process'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Chaoshan ke rice as a named same-pot seasonal rice dish without merging cooked-rice ge fan', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'chaoshan-ke-rice'
  ));
  const identitySource = recipe?.source_refs.find(item => (
    item.source_id === 'S-GD-CHAOSHAN-KE-RICE-CMA-1'
  ));
  const cookerSource = recipe?.source_refs.find(item => (
    item.source_id === 'S-GD-CHAOSHAN-KE-RICE-PENGPAI-1'
  ));

  assert.equal(recipe?.canonical_name, '潮汕炣饭');
  assert.deepEqual(recipe?.aliases, ['炣饭', '潮汕炣香饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.deepEqual(recipe?.core_ingredients, ['新大米', '猪肉或五花肉', '白萝卜或卷心菜', '板栗或芋头', '花生或虾米/虾仁']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /新大米.*五花肉.*板栗.*白萝卜.*下锅/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /电饭煲.*五花肉.*卷心菜.*芋头.*六成熟/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /五花肉.*芋头.*虾米.*金黄/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /电饭煲.*将熟的米饭.*焖10分钟/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(identitySource?.access_status, 'opened');
  assert.ok(identitySource?.claim_scopes.includes('identity'));
  assert.ok(identitySource?.claim_scopes.includes('process'));
  assert.equal(cookerSource?.access_status, 'opened');
  assert.ok(cookerSource?.claim_scopes.includes('quantity'));
  assert.ok(cookerSource?.claim_scopes.includes('appliance'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Daojiao rice steamed with hehua carp from the town food map without inventing a batch', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'dongguan-daojiao-hehua-carp-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-GD-DONGGUAN-DAOJIAO-HEHUA-CARP-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '禾花鲤炊饭');
  assert.deepEqual(recipe?.aliases, ['禾花鲤腊味炊饭']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.deepEqual(recipe?.traditional_vessels, ['蒸锅']);
  assert.deepEqual(recipe?.core_ingredients, [
    '禾花鲤', '糯米', '粘米', '鲜肉丝', '腊肉', '腊肠', '红枣', '冬菇',
  ]);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /鲜肉丝.*腊肉段.*腊肠.*红枣.*冬菇/);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /糯米/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /一齐蒸熟|一齐炊熟|一起蒸/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(recipe?.evidence_notes.includes('没有固定重量'));
  assert.ok(recipe?.evidence_notes.includes('电饭煲'));
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.publisher, '东莞市道滘镇人民政府');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Yuping Dong family she rice as a regional named variant without inventing contracts', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'yuping-dong-she-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-GZ-YUPING-DONG-SHE-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '玉屏侗家社饭');
  assert.deepEqual(recipe?.aliases, ['玉屏社饭']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.region_codes, ['CN-GZ']);
  assert.deepEqual(recipe?.traditional_vessels, ['铁锅']);
  assert.deepEqual(recipe?.core_ingredients, ['白米', '蒿菜', '野葱', '蒜苗', '腊肉丁']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /白米.*蒿菜.*野葱.*蒜苗.*腊肉丁/);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /混合.*铁锅焖制/);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, {
    grade: 'B',
    roles: ['carbohydrate', 'protein', 'fiber'],
  });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(recipe?.evidence_notes.includes('没有固定重量'));
  assert.ok(recipe?.evidence_notes.includes('电饭煲'));
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.publisher, '玉屏县融媒体中心 / 微铜仁');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /第274至281行/);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('uses the directly opened provincial source for Lianyuan cured-pork red-date bamboo rice', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'lianyuan-bamboo-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-HN-LIANYUAN-BAMBOO-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '涟源腊肉红枣竹筒饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.time_contract?.total_minutes, 20);
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.match(source?.evidence_locator ?? '', /第150至156行/);
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

test('records Pianguan oil-braised millet rice from two independent Shanxi food listings without inventing a cooking contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'pianguan-oil-braised-millet-rice'
  ));
  const official = recipe?.source_refs.find(item => (
    item.source_id === 'S-SX-PIANGUAN-OIL-RICE-1'
  ));
  const media = recipe?.source_refs.find(item => (
    item.source_id === 'S-SX-PIANGUAN-OIL-RICE-2'
  ));

  assert.equal(recipe?.canonical_name, '偏关油焖饭');
  assert.deepEqual(recipe?.aliases, ['油焖小米粥']);
  assert.deepEqual(recipe?.region_codes, ['CN-SX']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, []);
  assert.deepEqual(recipe?.core_ingredients, ['小米', '胡麻油']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /小米.*胡麻油.*焖制/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'C', roles: ['carbohydrate'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(recipe?.evidence_notes.includes('没有固定份量'));
  assert.ok(recipe?.evidence_notes.includes('电饭煲'));
  assert.equal(official?.access_status, 'opened');
  assert.deepEqual(official?.claim_scopes, ['identity']);
  assert.equal(media?.access_status, 'opened');
  assert.deepEqual(media?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(media?.evidence_locator ?? '', /第71至75行/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Jingyuan sanfan as a named mixed-grain staple with its source-stated boil-and-braise process', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'jingyuan-mixed-grain-sanfan'
  ));
  const recipeSource = recipe?.source_refs.find(item => (
    item.source_id === 'S-GS-JINGYUAN-SANFAN-1'
  ));
  const contextSource = recipe?.source_refs.find(item => (
    item.source_id === 'S-GS-JINGYUAN-SANFAN-2'
  ));

  assert.equal(recipe?.canonical_name, '靖远糁饭');
  assert.deepEqual(recipe?.aliases, ['小米糁饭', '黄米糁饭', '白米糁饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-GS']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['锅']);
  assert.deepEqual(recipe?.core_ingredients, ['米（小米、黄米或白米）', '面粉']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /米.*淘净.*锅中.*水.*煮沸/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /七八成.*面粉.*搅拌融合/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /盖上锅盖.*焖/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'C', roles: ['carbohydrate'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(recipe?.evidence_notes.includes('没有固定用量'));
  assert.ok(recipe?.evidence_notes.includes('电饭煲'));
  assert.equal(recipeSource?.access_status, 'opened');
  assert.deepEqual(recipeSource?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(recipeSource?.evidence_locator ?? '', /正文第3至5行/u);
  assert.equal(contextSource?.access_status, 'opened');
  assert.deepEqual(contextSource?.claim_scopes, ['identity', 'ingredients']);
  assert.match(contextSource?.evidence_locator ?? '', /正文第12至16行/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Hequ sour porridge without turning fermented grain facts into a modern safety contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'hequ-sour-porridge'
  ));
  const identitySource = recipe?.source_refs.find(item => (
    item.source_id === 'S-SX-HEQU-SOUR-PORRIDGE-1'
  ));
  const processSource = recipe?.source_refs.find(item => (
    item.source_id === 'S-SX-HEQU-SOUR-PORRIDGE-2'
  ));

  assert.equal(recipe?.canonical_name, '河曲酸粥');
  assert.deepEqual(recipe?.aliases, ['五米酸粥', '酸饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-SX']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['锅', '浆米罐']);
  assert.deepEqual(recipe?.core_ingredients, ['糜子', '大米', '小米', '糯米', '玉米碜子', '酸浆']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /糜子.*酸浆.*泡.*一晚上/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /第二天.*煮熟/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'C', roles: ['carbohydrate'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(recipe?.evidence_notes.includes('家庭发酵背景'));
  assert.ok(recipe?.evidence_notes.includes('不建立家庭发酵安全合同'));
  assert.equal(identitySource?.access_status, 'opened');
  assert.deepEqual(identitySource?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(identitySource?.evidence_locator ?? '', /第36至43行/u);
  assert.equal(processSource?.access_status, 'opened');
  assert.deepEqual(processSource?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(processSource?.evidence_locator ?? '', /第48至60行/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Ningxia lamb tiaohe rice as a named mixed-grain one-pot food without resolving the source title mismatch', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'ningxia-lamb-tiaohe-rice'
  ));
  const official = recipe?.source_refs.find(item => (
    item.source_id === 'S-NX-LAMB-TIAOHE-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '羊肉调和饭');
  assert.deepEqual(recipe?.aliases, ['调和饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-NX']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['锅']);
  assert.deepEqual(recipe?.core_ingredients, ['米', '面', '土豆', '豆类', '豆腐']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /米.*面.*土豆.*豆类.*豆腐.*一起煮/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(recipe?.evidence_notes.includes('标题写'));
  assert.ok(recipe?.evidence_notes.includes('正文材料段未列羊肉'));
  assert.equal(official?.access_status, 'opened');
  assert.deepEqual(official?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(official?.evidence_locator ?? '', /第24至31行/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Liannan Yao bamboo-tube rice with the source-stated charcoal process and no invented meat filling', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'liannan-yao-bamboo-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-GD-LIANNAN-YAO-BAMBOO-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '瑶家竹筒饭');
  assert.deepEqual(recipe?.aliases, ['连南竹筒饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['竹筒', '热火灰']);
  assert.deepEqual(recipe?.core_ingredients, ['米', '盐']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /山泉水.*竹筒.*浸米/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /竹筒口.*木塞.*热火灰/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /约半小时.*取出/u);
  assert.equal(recipe?.time_contract?.total_minutes, 30);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'C', roles: ['carbohydrate'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(recipe?.evidence_notes.includes('山野菜是另行煮熟的伴菜'));
  assert.ok(recipe?.evidence_notes.includes('没有肉类填充'));
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance', 'time']);
  assert.match(source?.evidence_locator ?? '', /正文第22至27行/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Tibetan ginseng-fruit rice from government food-culture sources without inventing an electric-cooker contract', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'tibet-renshenggu-rice'
  ));
  const shannan = recipe?.source_refs.find(item => (
    item.source_id === 'S-XZ-SHANNAN-RENSHENGGU-RICE-1'
  ));
  const aba = recipe?.source_refs.find(item => (
    item.source_id === 'S-XZ-ABA-RENSHENGGU-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '人参果饭');
  assert.deepEqual(recipe?.aliases, ['人参果拌饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-XZ']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['锅', '碗']);
  assert.deepEqual(recipe?.core_ingredients, ['米饭', '人参果', '酥油', '白糖']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /人参果.*煮熟/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /熟.*米饭.*人参果.*各一半.*碗/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /白糖.*滚烫.*酥油/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'unassessed', roles: [] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(recipe?.evidence_notes.includes('没有固定数量'));
  assert.ok(recipe?.evidence_notes.includes('葡萄干'));
  assert.equal(shannan?.access_status, 'opened');
  assert.deepEqual(shannan?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(shannan?.evidence_locator ?? '', /正文第7至19行/u);
  assert.equal(aba?.access_status, 'opened');
  assert.deepEqual(aba?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(aba?.evidence_locator ?? '', /正文第37至40行/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Tibetan Mida naming porridge from the NPC food-culture source without normalizing its ambiguous time wording', () => {
  const recipe = sourceBackedCatalog().recipes.find(item => (
    item.recipe_id === 'tibet-mida-rice-porridge'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-XZ-NPC-MIDA-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '咪达');
  assert.deepEqual(recipe?.aliases, ['命名粥']);
  assert.deepEqual(recipe?.region_codes, ['CN-XZ']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['锅']);
  assert.deepEqual(recipe?.core_ingredients, ['米饭', '盐', '酥油', '肉丁', '红枣', '杏干', '葡萄干']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /米饭.*稀粥/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /盐.*酥油.*肉丁.*红枣.*杏干.*葡萄干/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(recipe?.evidence_notes.includes('对小时'));
  assert.ok(recipe?.evidence_notes.includes('不建立时长'));
  assert.equal(source?.access_status, 'search_extract_opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(source?.evidence_locator ?? '', /搜索摘录.*咪达.*命名粥/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Qinghai highland barley lamb millet soup from the county government food listing without inventing a cooker contract', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => (
    item.recipe_id === 'qinghai-highland-barley-lamb-millet-soup'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-QH-GONGHE-BARLEY-LAMB-MILLET-SOUP-1'
  ));

  assert.equal(recipe?.canonical_name, '高原青稞羊肉麦仁汤');
  assert.deepEqual(recipe?.aliases, ['青稞羊肉麦仁汤']);
  assert.deepEqual(recipe?.region_codes, ['CN-QH']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, []);
  assert.deepEqual(recipe?.core_ingredients, ['青稞', '麦仁', '牛羊肉']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /青稞.*麦仁.*牛羊肉.*一夜熬煮.*相融.*粥/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(recipe?.evidence_notes.includes('一夜'));
  assert.ok(recipe?.evidence_notes.includes('没有固定克数'));
  assert.equal(source?.access_status, 'search_extract_opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(source?.evidence_locator ?? '', /搜索摘录.*青稞羊肉麦仁汤/u);
  assert.ok(!catalog.regional_blanks.some(item => item.region_code === 'CN-QH'));
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Dai fragrant bamboo rice from the national ethnic-affairs source without inventing a modern cooker contract', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => (
    item.recipe_id === 'dai-fragrant-bamboo-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-YN-DAI-FRAGRANT-BAMBOO-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '傣族香竹饭');
  assert.deepEqual(recipe?.aliases, ['傣族竹筒饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-YN']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['香竹筒', '火']);
  assert.deepEqual(recipe?.core_ingredients, ['糯米']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /糯米.*香竹筒.*浸泡15分钟/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /火.*烘烤/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /捶打竹筒.*竹膜.*剖开/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'C', roles: ['carbohydrate'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(recipe?.evidence_notes.includes('浸泡15分钟'));
  assert.ok(recipe?.evidence_notes.includes('没有固定批量'));
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'time', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /第28行.*香竹饭.*竹筒饭/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Xiangxi Miao bamboo-tube rice with its source ratio and traditional steamer boundary', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => (
    item.recipe_id === 'xiangxi-miao-bamboo-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-HN-XIANGXI-MIAO-BAMBOO-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '湘西苗族竹筒饭');
  assert.deepEqual(recipe?.aliases, ['湘西竹筒饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-HN']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['桂竹筒', '甑笼', '柴火']);
  assert.deepEqual(recipe?.core_ingredients, ['米']);
  assert.equal(recipe?.fixed_batch, null);
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'rice_to_water_ratio',
    amount: { value: 2.5, unit: '份水/份米' },
    source_ids: ['S-HN-XIANGXI-MIAO-BAMBOO-RICE-1'],
  });
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /桂竹筒.*两端留节.*锯.*口子/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /米.*盛满水.*1∶2.5/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /甑笼.*蒸煮1个多小时/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /柴火烤.*竹筒烤焦/u);
  assert.equal(recipe?.time_contract, null, 'the source gives a steaming stage, not a complete preparation time');
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'C', roles: ['carbohydrate'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(recipe?.evidence_notes.includes('1∶2.5'));
  assert.ok(recipe?.evidence_notes.includes('不补固定批量'));
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'quantity', 'liquid', 'process', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /第49至61行.*竹筒饭.*1∶2.5/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Jinning boletus braised rice from the Ministry of Culture route without inventing its missing contracts', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => (
    item.recipe_id === 'jinning-boletus-braised-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-YN-JINNING-BOLETUS-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '晋宁牛肝菌焖饭');
  assert.deepEqual(recipe?.aliases, ['牛肝菌焖饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-YN']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['锅']);
  assert.deepEqual(recipe?.core_ingredients, ['大米', '牛肝菌']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /牛肝菌.*晋宁本土大米.*锅中.*小火.*焖煮/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'C', roles: ['carbohydrate', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(recipe?.evidence_notes.includes('晋宁本土大米'));
  assert.ok(recipe?.evidence_notes.includes('不补固定批量'));
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /第30至45行.*牛肝菌焖饭/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Jinshan clay-oven rice from the Shanghai government heritage page without inventing a home-cooker contract', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => (
    item.recipe_id === 'jinshan-clay-oven-rice'
  ));
  const source = recipe?.source_refs.find(item => (
    item.source_id === 'S-SH-JINSHAN-CLAY-OVEN-RICE-1'
  ));

  assert.equal(recipe?.canonical_name, '金山土灶菜饭');
  assert.deepEqual(recipe?.aliases, ['土灶菜饭']);
  assert.deepEqual(recipe?.region_codes, ['CN-SH']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['土灶']);
  assert.deepEqual(recipe?.core_ingredients, ['米', '菜籽油', '猪油', '青菜', '盐', '料酒', '糖']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 1);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /江南.*米.*菜籽油.*猪油.*青菜.*土灶.*慢慢焖煮/u);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'C', roles: ['carbohydrate', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.ok(recipe?.evidence_notes.includes('金山'));
  assert.ok(recipe?.evidence_notes.includes('不补固定批量'));
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /第62至72行.*土灶菜饭/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Taiwan agriculture department millet rice as an electric-cooker one-pot dish without inventing a fixed batch', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'taiwan-millet-root-vegetable-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-TW-MOA-KIDS-MILLET-RICE-1');

  assert.equal(recipe?.canonical_name, '小米炊飯');
  assert.deepEqual(recipe?.aliases, ['小米炊饭']);
  assert.deepEqual(recipe?.region_codes, ['TW']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['电饭锅']);
  assert.deepEqual(recipe?.core_ingredients, ['小米', '白米', '莲藕', '山药', '红枣', '枸杞', '番薯']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null, 'the source gives a 2.5–3 cup range, not one fixed liquid amount');
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /莲藕.*洗净.*切片/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /食材.*放入锅中/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /总米量.*2杯.*2\.5.*3杯.*外锅.*1杯.*焖15分钟/u);
  assert.equal(recipe?.time_contract?.total_minutes, 30);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.ok(recipe?.evidence_notes.includes('2.5～3杯'));
  assert.ok(recipe?.evidence_notes.includes('没有固定份数'));
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 1);
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'quantity', 'liquid', 'process', 'time', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /第623至653行.*小米炊飯.*2\.5～3杯.*外锅1杯/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records NTUH low-sodium Spanish paella as a balanced electric-cooker rice meal', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'ntuh-low-sodium-spanish-paella-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-NTUH-LOW-SODIUM-SPANISH-PAELLA-1');

  assert.equal(recipe?.canonical_name, '低鈉西班牙燉飯');
  assert.deepEqual(recipe?.aliases, ['低钠西班牙炖饭']);
  assert.deepEqual(recipe?.region_codes, ['TW']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['电饭锅']);
  assert.deepEqual(recipe?.core_ingredients, ['鸡里肌肉', '洋葱', '洋菇', '蒜头', '九层塔', '牛蕃茄', '白米', '鲜奶', '鸿喜菇', '起司丝']);
  assert.equal(recipe?.fixed_batch?.servings, 2);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '白米')?.amount?.value, 120);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '鸡里肌肉')?.amount?.value, 90);
  assert.equal(recipe?.liquid_contract, null, 'milk, tomato, and external steam water are not a single pot-water contract');
  assert.equal(recipe?.cooking_sequence.length, 8);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /白米.*鲜奶.*搅拌均匀/u);
  assert.match(recipe?.cooking_sequence[5]?.instruction ?? '', /电饭锅.*外锅.*1杯水/u);
  assert.match(recipe?.cooking_sequence[6]?.instruction ?? '', /跳起.*10.*15分钟.*起司丝.*5.*10分钟/u);
  assert.equal(recipe?.time_contract, null, 'the source gives staged ranges, not a complete total time');
  assert.ok(recipe?.safety_endpoints?.some(item => item.code === 'poultry_fully_cooked'));
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'A', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.ok(recipe?.evidence_notes.includes('2人份'));
  assert.ok(recipe?.evidence_notes.includes('没有完整总时长'));
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 1);
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'quantity', 'process', 'time', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /PDF第1页.*2人份.*鸡里肌肉90.*白米120.*外锅1杯水/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Taiwan agriculture department turmeric chicken risotto as a named electric-pot rice meal', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'taiwan-turmeric-chicken-risotto');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-TW-MOA-KIDS-TURMERIC-CHICKEN-RISOTTO-1');

  assert.equal(recipe?.canonical_name, '薑黃雞腿燉飯');
  assert.deepEqual(recipe?.aliases, ['姜黄鸡腿炖饭']);
  assert.deepEqual(recipe?.region_codes, ['TW']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['大同電鍋']);
  assert.deepEqual(recipe?.core_ingredients, ['雞腿', '洋蔥', '蒜末', '紅蘿蔔', '薑黃粉', '青椒', '米', '高湯', '椰漿']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null, 'the source lists broth and coconut milk but does not establish a single cooker liquid contract');
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /鸡腿.*米.*高汤.*椰浆/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /整锅.*大同电锅.*半小时/u);
  assert.deepEqual(recipe?.time_contract, { total_minutes: 30, source_ids: ['S-TW-MOA-KIDS-TURMERIC-CHICKEN-RISOTTO-1'] });
  assert.ok(recipe?.safety_endpoints?.some(item => item.code === 'poultry_fully_cooked'));
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.ok(recipe?.evidence_notes.includes('不到半小时'));
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 1);
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'quantity', 'process', 'time', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /第636至640行.*薑黃雞腿燉飯.*米1\/2杯.*高湯1\/2杯/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Taiwan agriculture department bottle-gourd mushroom rice with its fixed water amount', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'taiwan-bottle-gourd-mushroom-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-TW-MOA-KIDS-BOTTLE-GOURD-MUSHROOM-RICE-1');

  assert.equal(recipe?.canonical_name, '瓠瓜香菇飯');
  assert.deepEqual(recipe?.aliases, ['瓠瓜香菇饭']);
  assert.deepEqual(recipe?.region_codes, ['TW']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['电饭锅']);
  assert.deepEqual(recipe?.core_ingredients, ['瓠瓜', '乾香菇', '胡蘿蔔', '米']);
  assert.equal(recipe?.fixed_batch, null);
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 3, unit: '杯' },
    source_ids: ['S-TW-MOA-KIDS-BOTTLE-GOURD-MUSHROOM-RICE-1'],
  });
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /瓠瓜.*香菇.*胡萝卜.*米/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /3杯水.*电饭锅/u);
  assert.deepEqual(recipe?.time_contract, {
    total_minutes: 60,
    source_ids: ['S-TW-MOA-KIDS-BOTTLE-GOURD-MUSHROOM-RICE-1'],
  });
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.ok(recipe?.evidence_notes.includes('碳水与膳食纤维'));
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 1);
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'quantity', 'liquid', 'process', 'appliance', 'time']);
  assert.match(source?.evidence_locator ?? '', /第660至663行.*瓠瓜香菇飯.*米3杯.*水3杯/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Philips salmon gomoku rice as a named one-pot rice meal without collapsing a 4-to-5-person range', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'philips-salmon-gomoku-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-PHILIPS-SALMON-GOMOKU-RICE-1');

  assert.equal(recipe?.canonical_name, '鮭魚五目炊飯');
  assert.deepEqual(recipe?.aliases, ['鮭鱼五目炊饭']);
  assert.deepEqual(recipe?.region_codes, []);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['Philips 多功能烹煮鍋']);
  assert.deepEqual(recipe?.core_ingredients, ['無刺鮭魚', '乾香菇', '鴻禧菇', '紅蘿蔔', '牛蒡', '蒟蒻', '白米']);
  assert.equal(recipe?.fixed_batch, null, 'the source states 4-5 people, not one fixed serving count');
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 260, unit: 'mL' },
    source_ids: ['S-PHILIPS-SALMON-GOMOKU-RICE-1'],
  });
  assert.equal(recipe?.time_contract?.total_minutes, 40);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /鮭魚.*醃漬10分鐘.*乾香菇.*蒟蒻.*紅蘿蔔.*牛蒡/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /白米.*260毫升.*所有材料/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /密封烹調.*米飯.*拌均勻/u);
  assert.ok(recipe?.safety_endpoints?.some(item => item.code === 'seafood_fully_cooked'));
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.ok(recipe?.evidence_notes.includes('4至5人份'));
  assert.ok(recipe?.evidence_notes.includes('固定份数'));
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'quantity', 'liquid', 'process', 'appliance', 'time']);
  assert.match(source?.evidence_locator ?? '', /第349至380行.*4至5人.*料理时间40.*鮭魚150克.*白米2杯.*260毫升/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Philips chicken vegetable takikomi rice without inventing a total cooking time', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'philips-chicken-vegetable-takikomi-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-PHILIPS-CHICKEN-VEGETABLE-TAKIKOMI-RICE-1');

  assert.equal(recipe?.canonical_name, '雞汁野菜炊飯');
  assert.deepEqual(recipe?.aliases, ['鸡汁野菜炊饭']);
  assert.deepEqual(recipe?.region_codes, []);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['Philips 多功能烹煮鍋']);
  assert.deepEqual(recipe?.core_ingredients, ['帶皮雞腿肉', '高麗菜', '胡蘿蔔', '舞菇', '薑末', '脫殼栗子', '臘肉', '越光米']);
  assert.equal(recipe?.fixed_batch?.servings, 1);
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 320, unit: 'g' },
    source_ids: ['S-PHILIPS-CHICKEN-VEGETABLE-TAKIKOMI-RICE-1'],
  });
  assert.equal(recipe?.time_contract, null, 'the source gives a staged process but no total cooking duration');
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /雞腿肉.*醃.*10分鐘/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /雞皮面朝下.*約10分鐘.*切小塊/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /薑末.*舞菇.*栗子.*臘肉.*高麗菜.*越光米/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /雞湯.*密封烹調.*米飯.*香油/u);
  assert.ok(recipe?.safety_endpoints?.some(item => item.code === 'poultry_fully_cooked'));
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'quantity', 'liquid', 'process', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /第354至389行.*1人.*帶皮雞腿肉200克.*高麗菜200克.*越光米300克.*雞湯320克.*密封烹調/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Zojirushi mushroom brown-rice meal without collapsing its four-to-five-person range', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'zojirushi-mushroom-brown-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-ZOJIRUSHI-MUSHROOM-BROWN-RICE-1');

  assert.equal(recipe?.canonical_name, '菌菇糙米饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, []);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['象印电饭煲']);
  assert.deepEqual(recipe?.core_ingredients, ['糙米', '杏鲍菇', '蟹味菇', '鸡蛋', '葱花']);
  assert.equal(recipe?.fixed_batch, null, 'the source gives a four-to-five-person range');
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'waterline',
    waterline: { appliance_model: '搭载“糙米饭”菜单的象印电饭煲', scale: 'brown_rice', mark: 3 },
    source_ids: ['S-ZOJIRUSHI-MUSHROOM-BROWN-RICE-1'],
  });
  assert.equal(recipe?.time_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /糙米.*杏鲍菇.*蟹味菇.*糙米饭/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /鸡蛋.*蛋饼.*蛋丝/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /结束.*菌菇糙米饭.*盐.*葱花.*拌匀/u);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'quantity', 'liquid', 'process', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /第12至55行.*4至5人份.*糙米3杯.*杏鲍菇75克.*蟹味菇75克.*糙米饭/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Taishan crucian-carp rice as a named electric-cooker fish-rice process without inventing quantities', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'taishan-crucian-carp-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-GD-TAISHAN-CRUCIAN-CARP-RICE-1');

  assert.equal(recipe?.canonical_name, '台山鲫鱼饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['电饭煲']);
  assert.deepEqual(recipe?.core_ingredients, ['大米', '鲫鱼']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /电饭煲.*米饭.*差不多熟/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /腌制好的鲫鱼.*铺在米饭.*盖上盖子.*几分钟/u);
  assert.ok(recipe?.safety_endpoints?.some(item => item.code === 'seafood_fully_cooked'));
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'search_extract_opened');
  assert.equal(source?.evidence_tier, 2);
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /官方政务页面搜索摘录.*电饭煲.*鲫鱼.*米饭/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Guangdong pumpkin chicken braised rice with its source-stated ingredient quantities and relative water boundary', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'guangdong-pumpkin-chicken-braised-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-GD-PUMPKIN-CHICKEN-BRAISED-RICE-1');

  assert.equal(recipe?.canonical_name, '南瓜鸡肉焖饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-GD']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['电饭煲', '炒锅']);
  assert.deepEqual(recipe?.core_ingredients, ['鸡腿肉', '南瓜', '香菇', '洋葱', '大米']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null, 'the source gives a relative depth, not a fixed liquid amount');
  assert.equal(recipe?.time_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /鸡腿.*腌制15分钟/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /洋葱.*鸡肉.*南瓜.*香菇/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /大米.*电饭煲.*比米高0\.5厘米/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /南瓜.*香菇.*鸡肉.*洋葱.*煮饭键/u);
  assert.ok(recipe?.safety_endpoints?.some(item => item.code === 'poultry_fully_cooked'));
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 2);
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'quantity', 'process', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /第111至114行.*鸡腿3个.*南瓜250g.*香菇50g.*洋葱40g.*大米250g.*米面水高.*0\.5厘米.*煮饭键/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Shanghai broad-bean vegetable rice as a seasonal named rice meal without inventing quantities', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'shanghai-broad-bean-vegetable-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-JN-2');

  assert.equal(recipe?.canonical_name, '蚕豆菜饭');
  assert.deepEqual(recipe?.aliases, []);
  assert.deepEqual(recipe?.region_codes, ['CN-SH']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['饭锅', '电饭煲']);
  assert.deepEqual(recipe?.core_ingredients, ['蚕豆', '猪肉丁', '牛心菜', '饭']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null, 'the source gives a half-hour braise after mixing, not a complete total duration');
  assert.equal(recipe?.cooking_sequence.length, 4);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /蚕豆.*猪大排.*里脊肉.*切成丁/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /猪油.*肉丁.*黄酒.*葱花.*姜末/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /蚕豆.*牛心菜.*半熟/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /饭锅.*饭粒.*蚕豆.*猪肉粒.*焖半小时/u);
  assert.ok(recipe?.safety_endpoints?.some(item => item.code === 'pork_fully_cooked'));
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process', 'appliance', 'time']);
  assert.equal(source?.evidence_tier, undefined);
  assert.equal(source?.evidence_locator, undefined);
  assert.match(source?.url ?? '', /mzj\.sh\.gov\.cn.*20250519/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Hakka creative sweet-potato rice as a named electric-cooker meal without inventing servings or total time', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'hakka-creative-sweet-potato-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-TW-MOA-HAKKA-SWEET-POTATO-RICE-1');

  assert.equal(recipe?.canonical_name, '客家創意地瓜飯');
  assert.deepEqual(recipe?.aliases, ['客家创意地瓜饭']);
  assert.deepEqual(recipe?.region_codes, ['TW-HS']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['电锅', '电子锅', '炒锅']);
  assert.deepEqual(recipe?.core_ingredients, ['米', '地瓜', '義式雞腿肉', '杏鮑菇', '四季豆', '蔥', '蒜頭']);
  assert.equal(recipe?.fixed_batch, null, 'the source gives ingredient amounts but no finished serving count');
  assert.deepEqual(recipe?.liquid_contract, {
    kind: 'added_water',
    amount: { value: 2, unit: '杯' },
    source_ids: ['S-TW-MOA-HAKKA-SWEET-POTATO-RICE-1'],
  });
  assert.equal(recipe?.time_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 5);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /地瓜.*杏鮑菇.*蔥.*雞腿肉/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /米.*2杯熱水.*地瓜.*杏鮑菇.*雞腿肉.*電鍋/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /四季豆.*燙熟/u);
  assert.match(recipe?.cooking_sequence[3]?.instruction ?? '', /蒜頭.*四季豆.*蔥丁.*拌炒/u);
  assert.match(recipe?.cooking_sequence[4]?.instruction ?? '', /四季豆.*蔥.*拌入飯/u);
  assert.ok(recipe?.safety_endpoints?.some(item => item.code === 'poultry_fully_cooked'));
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 1);
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'quantity', 'liquid', 'process', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /第127至139行.*米2杯.*四季豆150g.*地瓜.*雞腿肉.*杏鮑菇.*2杯熱水.*電鍋/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Encounter Happiness taro rice as a named electric-pot meal with its stated two-to-three-person boundary', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'taichung-encounter-happiness-taro-rice');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-TW-MOA-TAICHUNG-TARO-RICE-1');

  assert.equal(recipe?.canonical_name, '遇見幸福芋頭飯');
  assert.deepEqual(recipe?.aliases, ['遇见幸福芋头饭']);
  assert.deepEqual(recipe?.region_codes, ['TW']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, ['电锅', '炒锅']);
  assert.deepEqual(recipe?.core_ingredients, ['大甲芋頭', '台梗9號米', '絞肉或豬肉丁', '香菇', '蝦米']);
  assert.equal(recipe?.fixed_batch, null, 'the source gives a two-to-three-person range, so no midpoint is invented');
  assert.equal(recipe?.liquid_contract, null, 'the source delegates water to the ordinary rice-cooker method');
  assert.equal(recipe?.time_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 3);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /米.*浸泡30分鐘.*芋頭.*香菇.*蝦米/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /香菇.*蝦米.*絞肉.*豬肉丁.*炒.*半熟/u);
  assert.match(recipe?.cooking_sequence[2]?.instruction ?? '', /浸泡過的米.*炒料.*芋頭.*電鍋.*燜15分鐘/u);
  assert.ok(recipe?.safety_endpoints?.some(item => item.code === 'pork_fully_cooked'));
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein', 'fiber'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 1);
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'quantity', 'process', 'appliance']);
  assert.match(source?.evidence_locator ?? '', /第96至110行.*大甲芋頭.*台梗9號米.*1\.5杯.*电锅.*焖15分钟.*2至3人份/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records Longjing glutinous-rice chicken as a named Korean-Chinese rice meal without inventing a cooker contract', () => {
  const catalog = sourceBackedCatalog();
  const recipe = catalog.recipes.find(item => item.recipe_id === 'longjing-jiangmi-chicken');
  const source = recipe?.source_refs.find(item => item.source_id === 'S-JL-LONGJING-JIANGMI-CHICKEN-1');

  assert.equal(recipe?.canonical_name, '江米鸡饭');
  assert.deepEqual(recipe?.aliases, ['江米鸡']);
  assert.deepEqual(recipe?.region_codes, ['CN-JL']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.traditional_vessels, []);
  assert.deepEqual(recipe?.core_ingredients, ['童子鸡', '糯米']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.equal(recipe?.cooking_sequence.length, 2);
  assert.match(recipe?.cooking_sequence[0]?.instruction ?? '', /糯米.*童子鸡.*腹中.*炖/u);
  assert.match(recipe?.cooking_sequence[1]?.instruction ?? '', /鸡肉.*炖得极烂.*糯米.*鸡汤/u);
  assert.ok(recipe?.safety_endpoints?.some(item => item.code === 'poultry_fully_cooked'));
  assert.deepEqual(recipe?.nutrition_structure, { grade: 'B', roles: ['carbohydrate', 'protein'] });
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 2);
  assert.deepEqual(source?.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.match(source?.evidence_locator ?? '', /正文第710至712行.*江米鸡.*童子鸡.*糯米/u);
  assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status));
});

test('records the next Tatung official rice meals without inventing servings, liquid, or cooker facts', () => {
  const catalog = sourceBackedCatalog();
  const cases = [
    {
      id: 'tatung-beef-burdock-takikomi-rice',
      name: '牛肉とごぼうの炊き込みご飯',
      status: 'executable',
      servings: 2,
      minutes: 30,
      liquid: { kind: 'added_water', amount: { value: 2, unit: '杯' } },
      sourceId: 'S-TATUNG-BEEF-BURDOCK-RICE-1',
      sourcePattern: /正文第41至71行.*牛肉.*ごぼう.*2人分.*2カップ.*约30分钟/u,
      processPattern: /(?=.*牛蒡)(?=.*牛肉)(?=.*米)(?=.*炒)(?=.*内锅)(?=.*外锅)(?=.*10分钟)/u,
      safety: 'beef_fully_cooked',
    },
    {
      id: 'tatung-golden-takikomi-rice',
      name: '黄金炊き込みご飯',
      status: 'recipe_fact_checked',
      servings: null,
      minutes: 60,
      liquid: { kind: 'added_water', amount: { value: 1.8, unit: '計量カップ' } },
      sourceId: 'S-TATUNG-GOLDEN-RICE-1',
      sourcePattern: /正文第34至72行.*黄金炊き込みご飯.*2至3人分.*1\.8.*栗.*鸡腿/u,
      processPattern: /鸡腿.*栗.*胡萝卜.*香菇.*内锅.*外锅.*15分/u,
      safety: 'poultry_fully_cooked',
    },
    {
      id: 'tatung-khao-mok-gai',
      name: 'カオ・モック・ガイ',
      status: 'recipe_fact_checked',
      servings: null,
      minutes: 60,
      liquid: { kind: 'added_water', amount: { value: 300, unit: 'ml' } },
      sourceId: 'S-TATUNG-KHAO-MOK-GAI-1',
      sourcePattern: /正文第43至80行.*カオ・モック・ガイ.*2至3人分.*鸡翅根.*300ml.*电锅/u,
      processPattern: /(?=.*米)(?=.*水)(?=.*蒸し皿)(?=.*鸡翅根)(?=.*外锅)(?=.*5分钟)/u,
      safety: 'poultry_fully_cooked',
    },
    {
      id: 'tatung-oyster-mountain-vegetable-rice',
      name: '牡蠣と山菜の炊き込みご飯',
      status: 'recipe_fact_checked',
      servings: 4,
      minutes: 30,
      liquid: null,
      sourceId: 'S-TATUNG-OYSTER-MOUNTAIN-RICE-1',
      sourcePattern: /正文第34至68行.*牡蠣と山菜の炊き込みご飯.*4人分.*牡蛎.*山菜.*300ml.*约30分钟/u,
      processPattern: /(?=.*牡蛎)(?=.*酒)(?=.*蒸)(?=.*牡蛎汤)(?=.*米)(?=.*山菜)(?=.*油豆腐)(?=.*10分钟)/u,
      safety: 'shellfish_fully_cooked',
    },
    {
      id: 'tatung-chicken-cabbage-sesame-rice',
      name: '鶏とキャベツの麻油炊き込みご飯',
      status: 'recipe_fact_checked',
      servings: 3,
      minutes: 60,
      liquid: null,
      sourceId: 'S-TATUNG-CHICKEN-CABBAGE-SESAME-RICE-1',
      sourcePattern: /正文第34至72行.*鶏とキャベツの麻油炊き込みご飯.*3人分.*鶏もも肉.*キャベツ.*1\.5合.*约1小时/u,
      processPattern: /(?=.*香菇)(?=.*鸡肉)(?=.*卷心菜)(?=.*电锅)(?=.*外锅)(?=.*1\.5)(?=.*炒)/u,
      safety: 'poultry_fully_cooked',
    },
  ];

  for (const item of cases) {
    const recipe = catalog.recipes.find(row => row.recipe_id === item.id);
    const source = recipe?.source_refs.find(row => row.source_id === item.sourceId);
    assert.equal(recipe?.canonical_name, item.name, item.id);
    assert.equal(recipe?.status, item.status, item.id);
    assert.equal(recipe?.fixed_batch?.servings ?? null, item.servings, item.id);
    assert.equal(recipe?.time_contract?.total_minutes ?? null, item.minutes, item.id);
    if (item.liquid) assert.deepEqual(recipe?.liquid_contract, { ...item.liquid, source_ids: [item.sourceId] }, item.id);
    else assert.equal(recipe?.liquid_contract, null, item.id);
    assert.ok(recipe?.cooking_sequence?.length >= 3, item.id);
    assert.match(recipe?.cooking_sequence.map(step => step.instruction).join(' '), item.processPattern, item.id);
    assert.ok(recipe?.safety_endpoints?.some(endpoint => endpoint.code === item.safety), item.id);
    assert.equal(recipe?.cooker_adaptation?.status, 'source_limited', item.id);
    assert.equal(source?.access_status, 'opened', item.id);
    assert.equal(source?.evidence_tier, 3, item.id);
    assert.match(source?.evidence_locator ?? '', item.sourcePattern, item.id);
    if (item.status === 'recipe_fact_checked') {
      assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe?.status), item.id);
    }
  }
});

test('r45 collection batch records directly sourced named one-pot meals without promoting research into executable', () => {
  const catalog = sourceBackedCatalog();
  const expected = [
    ['panasonic-oyster-negi-takikomi-rice', '牡蠣とねぎの炊き込みご飯', 'recipe_fact_checked'],
    ['panasonic-tokyo-seafood-pilaf', '炊込みシーフードピラフ', 'recipe_fact_checked'],
    ['panasonic-chicken-cream-pilaf', 'チキンのクリームピラフ', 'recipe_fact_checked'],
    ['taiwan-taro-multigrain-rice', '芋香珍穀飯', 'recipe_fact_checked'],
    ['taiwan-fresh-fish-wild-mushroom-rice', '鮮魚野菇炊飯', 'recipe_fact_checked'],
    ['taiwan-red-amaranth-chicken-rice', '紅鳳菜雞肉炊飯', 'recipe_fact_checked'],
    ['taiwan-high-fiber-pumpkin-rice', '高纖南瓜飯', 'recipe_fact_checked'],
    ['taiwan-provencal-mushroom-chicken-risotto', '普羅旺斯野菇雞起司燉飯', 'recipe_fact_checked'],
    ['joyoung-pumpkin-shiitake-chicken-rice', '南瓜香菇鸡腿焖饭', 'recipe_fact_checked'],
    ['joyoung-millet-corn-multigrain-rice', '小米杂粮饭', 'recipe_fact_checked'],
    ['joyoung-three-color-quinoa-rice', '三色藜麦饭', 'recipe_fact_checked'],
    ['taiwan-burdock-rice', '牛蒡炊飯', 'recipe_fact_checked'],
    ['taiwan-five-grain-rice', '五穀雜糧飯', 'recipe_fact_checked'],
    ['tacheng-air-dried-meat-pilaf', '塔城風乾肉抓飯', 'identity_verified'],
    ['luling-dingpot-rice', '廬陵鼎罐飯', 'identity_verified'],
    ['shizhu-tujia-potato-rice', '石柱土家洋芋飯', 'identity_verified'],
  ];

  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    if (status === 'identity_verified') {
      assert.equal(recipe.fixed_batch, null, recipeId);
      assert.equal(recipe.liquid_contract, null, recipeId);
      assert.deepEqual(recipe.cooking_sequence, [], recipeId);
    } else {
      assert.notEqual(recipe.cooking_sequence.length, 0, recipeId);
      assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(status), recipeId);
    }
    assert.notEqual(status, 'executable', recipeId);
  }
});

test('r48 collection batch records newly opened MAFF and manufacturer one-pot meals', () => {
  const catalog = sourceBackedCatalog();
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');
  assert.equal(catalog.recipes.length, 923);
  const expected = [
    ['maff-ibaraki-hamaguri-gohan', 'はまぐりごはん', 'recipe_fact_checked'],
    ['maff-oita-amimeshi', 'あみめし', 'recipe_fact_checked'],
    ['maff-ishikawa-sazae-meshi', 'さざえめし', 'recipe_fact_checked'],
    ['maff-fukuoka-kashiwa-meshi', 'かしわめし', 'recipe_fact_checked'],
    ['maff-kumamoto-tako-meshi', 'たこ飯', 'recipe_fact_checked'],
    ['maff-hyogo-tofumeshi', 'とふめし', 'recipe_fact_checked'],
    ['maff-niigata-shoyu-okowa', 'しょうゆおこわ', 'recipe_fact_checked'],
    ['maff-hyogo-tanba-black-bean-rice', '丹波黒豆ごはん', 'recipe_fact_checked'],
    ['maff-miyagi-bamboo-shoot-rice', 'たけのこご飯', 'recipe_fact_checked'],
    ['maff-hokkaido-bibai-torimeshi', '美唄のとりめし', 'recipe_fact_checked'],
    ['toshiba-chinese-sticky-rice-rcp30r', '中華風おこわ', 'recipe_fact_checked'],
    ['tiger-oyster-mushroom-rice', 'カキときのこのごはん', 'recipe_fact_checked'],
  ];

  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.ok(recipe?.source_refs?.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs
      .filter(source => source.source_id !== 'S-SAFETY-TEMPERATURES-1')
      .every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.cooking_sequence.length >= 2, recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r49 collection batch records newly opened MAFF regional rice meals without promoting research', () => {
  const catalog = sourceBackedCatalog();
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');
  assert.equal(catalog.recipes.length, 923);
  const expected = [
    ['maff-okinawa-yafara-jushi', 'ヤファラジューシー', 'recipe_fact_checked'],
    ['maff-miyagi-harako-meshi', 'はらこ飯', 'recipe_fact_checked'],
    ['maff-yamaguchi-uni-meshi', 'うに飯', 'recipe_fact_checked'],
    ['maff-wakayama-kakimade-gohan', 'かきまでご飯', 'recipe_fact_checked'],
    ['maff-chiba-takatsu-torimeshi', '高津のとり飯', 'recipe_fact_checked'],
    ['maff-kyoto-kuri-gohan', '栗ごはん', 'recipe_fact_checked'],
    ['maff-shimane-sazae-meshi', 'さざえ飯', 'recipe_fact_checked'],
    ['maff-tokushima-chagome', '茶ごめ', 'recipe_fact_checked'],
  ];

  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs
      .filter(source => source.source_id !== 'S-SAFETY-TEMPERATURES-1')
      .every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients) && recipe.core_ingredients.length >= 2, recipeId);
    assert.ok(Array.isArray(recipe.cooking_sequence) && recipe.cooking_sequence.length >= 2, recipeId);
    assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe.status), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r50 collection batch records newly opened MAFF regional rice meals without promoting research', () => {
  const catalog = sourceBackedCatalog();
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');
  assert.equal(catalog.recipes.length, 923);
  const expected = [
    ['maff-kanagawa-ume-gohan', '梅ごはん', 'recipe_fact_checked'],
    ['maff-kagoshima-karaimo-gohan', 'からいもごはん', 'recipe_fact_checked'],
    ['maff-aomori-goma-gohan', 'ごまご飯', 'recipe_fact_checked'],
    ['maff-chiba-gonjuu', 'ごんじゅう', 'recipe_fact_checked'],
    ['maff-nagasaki-torimeshi', '鶏飯', 'recipe_fact_checked'],
    ['maff-kagoshima-keihan', '鶏飯', 'recipe_fact_checked'],
  ];

  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients) && recipe.core_ingredients.length >= 2, recipeId);
    assert.ok(Array.isArray(recipe.cooking_sequence) && recipe.cooking_sequence.length >= 2, recipeId);
    assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe.status), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r51 collection batch records newly opened regional and manufacturer rice meals without promoting research', () => {
  const catalog = sourceBackedCatalog();
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');
  assert.equal(catalog.recipes.length, 923);
  const expected = [
    ['maff-aichi-tako-meshi', 'たこ飯（たこめし）', 'recipe_fact_checked'],
    ['maff-hiroshima-mihara-tako-meshi', 'たこめし', 'recipe_fact_checked'],
    ['maff-saga-tsugani-meshi', 'つがにめし', 'recipe_fact_checked'],
    ['maff-hyogo-tako-meshi', 'たこめし', 'recipe_fact_checked'],
    ['maff-miyazaki-torimeshi', 'とりめし', 'recipe_fact_checked'],
    ['maff-okayama-todomese', 'とどめせ', 'recipe_fact_checked'],
    ['maff-shiga-shoimeshi', 'しょいめし', 'recipe_fact_checked'],
    ['zojirushi-endo-gohan', 'えんどうご飯', 'recipe_fact_checked'],
    ['zojirushi-corn-risotto', 'コーンリゾット', 'recipe_fact_checked'],
    ['zojirushi-turkish-risotto', 'トルコ風リゾット', 'recipe_fact_checked'],
    ['zojirushi-seafood-paella', '海のパエリア', 'recipe_fact_checked'],
    ['zojirushi-stamina-rice', 'スタミナご飯', 'recipe_fact_checked'],
  ];

  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs
      .filter(source => source.source_id !== 'S-SAFETY-TEMPERATURES-1')
      .every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients) && recipe.core_ingredients.length >= 2, recipeId);
    assert.ok(Array.isArray(recipe.cooking_sequence) && recipe.cooking_sequence.length >= 2, recipeId);
    assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(recipe.status), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r52 collection batch records directly opened Tatung electric-pot rice meals without promoting research', () => {
  const catalog = sourceBackedCatalog();
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');
  assert.equal(catalog.recipes.length, 923);
  const expected = [
    ['tatung-yugao-sakuraebi-rice', '夕顔と桜エビの炊き込みご飯', 'recipe_fact_checked'],
    ['tatung-pork-daikon-rice', '豚バラ大根ご飯', 'executable'],
    ['tatung-tarako-kamameshi', 'たらこの釜めし風', 'recipe_fact_checked'],
    ['tatung-kumamoto-ebimeshi', '熊本えびめし', 'recipe_fact_checked'],
    ['tatung-wakayama-ginger-rice', 'しょうが飯', 'executable'],
    ['tatung-hijiki-umeboshi-rice', 'ひじき煮と梅干しの炊き込みご飯', 'recipe_fact_checked'],
  ];

  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.deepEqual(recipe?.region_codes, ['TW'], recipeId);
    assert.equal(recipe?.cuisine_family, 'tatung-electric-rice-recipes', recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients) && recipe.core_ingredients.length >= 2, recipeId);
    assert.ok(Array.isArray(recipe.cooking_sequence) && recipe.cooking_sequence.length >= 2, recipeId);
    if (status !== 'executable') assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r53 collection batch records directly opened Taiwan official one-pot rice meals without promoting research', () => {
  const catalog = sourceBackedCatalog();
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');
  assert.equal(catalog.recipes.length, 923);
  const expected = [
    ['taiwan-shiitake-tea-oil-vegetable-rice', '香菇茶油菜飯', 'recipe_fact_checked'],
    ['taiwan-tea-oil-vegetable-health-rice', '茶油蔬食養生飯', 'recipe_fact_checked'],
    ['panasonic-taiwan-scallop-five-color-rice', '蔬菜干貝五色炊飯', 'recipe_fact_checked'],
    ['panasonic-taiwan-loofah-dried-fish-rice', '午仔魚一夜干絲瓜炊飯', 'recipe_fact_checked'],
  ];

  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.deepEqual(recipe?.region_codes, ['TW'], recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients) && recipe.core_ingredients.length >= 2, recipeId);
    assert.ok(Array.isArray(recipe.cooking_sequence) && recipe.cooking_sequence.length >= 2, recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r54 collection batch records directly opened Tatung regional and household rice meals without promoting research', () => {
  const catalog = sourceBackedCatalog();
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');
  assert.equal(catalog.recipes.length, 923);
  const expected = [
    ['tatung-fukagawa-rice', '深川飯（あさりの炊き込みご飯）', 'recipe_fact_checked'],
    ['tatung-tomato-pumpkin-rice', 'トマトとかぼちゃの炊き込みご飯', 'recipe_fact_checked'],
    ['tatung-salmon-pumpkin-milk-risotto', 'サーモンとかぼちゃのミルクリゾット', 'executable'],
    ['tatung-seafood-porridge', '海の幸たっぷり海鮮粥', 'executable'],
    ['tatung-tuna-garlic-butter-rice', '背徳のガリバタ飯', 'recipe_fact_checked'],
  ];

  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.deepEqual(recipe?.region_codes, ['TW'], recipeId);
    assert.equal(recipe?.cuisine_family, 'tatung-electric-rice-recipes', recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients) && recipe.core_ingredients.length >= 2, recipeId);
    assert.ok(Array.isArray(recipe.cooking_sequence) && recipe.cooking_sequence.length >= 2, recipeId);
    if (status !== 'executable') assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r55 collection batch records directly opened MAFF named rice meals without promoting research', () => {
  const catalog = sourceBackedCatalog();
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');
  assert.equal(catalog.recipes.length, 923);
  const expected = [
    ['maff-nara-chameshi', '奈良茶飯（ならちゃめし）', 'recipe_fact_checked'],
    ['maff-fukui-chameshi', '茶飯（ちゃめし）', 'recipe_fact_checked'],
    ['maff-aichi-kakimawashi', 'かきまわし／とりめし', 'recipe_fact_checked'],
  ];

  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.ok(recipe?.region_codes?.length === 1 && recipe.region_codes[0].startsWith('JP-'), recipeId);
    assert.equal(recipe?.cuisine_family, 'japanese-regional-rice', recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients) && recipe.core_ingredients.length >= 2, recipeId);
    assert.ok(Array.isArray(recipe.cooking_sequence) && recipe.cooking_sequence.length >= 2, recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r47 collection batch records direct first-party regional and institutional one-pot meals', () => {
  const catalog = sourceBackedCatalog();
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');
  const expected = [
    ['jp-hiroshima-kakimeshi', 'かき飯', 'recipe_fact_checked'],
    ['jp-shiga-amenoio-gohan', 'あめのいおご飯', 'recipe_fact_checked'],
    ['jp-miyagi-hokki-meshi', 'ほっきめし', 'recipe_fact_checked'],
    ['jp-mie-tako-meshi', 'たこ飯', 'recipe_fact_checked'],
    ['jp-ehime-tako-meshi', 'たこ飯', 'recipe_fact_checked'],
    ['jp-tomato-salmon-takikomi-gohan', 'トマトと鮭の炊き込みごはん', 'recipe_fact_checked'],
    ['jp-okinawa-kufa-jushi', 'クファジューシー', 'recipe_fact_checked'],
    ['jp-hotate-daikon-takikomi-gohan', 'ホタテと大根の炊き込みごはん', 'recipe_fact_checked'],
    ['cookpot-japanese-bamboo-tofu-skin-rice', '日式竹筍油豆包炊飯', 'recipe_fact_checked'],
    ['cookpot-beef-wild-mushroom-rice', '牛肉野菇炊飯', 'executable'],
    ['cookpot-taro-chestnut-pork-rice', '芋香栗子炊飯', 'recipe_fact_checked'],
    ['cookpot-gomoku-mixed-rice', '五目炊飯', 'recipe_fact_checked'],
    ['cookpot-salted-mackerel-chicken-claypot-rice', '鹹魚雞粒煲仔飯', 'recipe_fact_checked'],
    ['cookpot-three-cup-chicken-rice', '三杯雞炊飯', 'recipe_fact_checked'],
    ['tiger-pork-bamboo-rice', '豚肉とたけのこごはん', 'executable'],
    ['tiger-pork-kimchi-brown-rice', '豚キムチ玄米ごはん', 'recipe_fact_checked'],
    ['tiger-scallop-pea-rice', 'ほたて貝柱とえんどう豆の炊込みごはん', 'recipe_fact_checked'],
    ['tiger-steak-mushroom-barley-rice', 'ステーキときのこの麦バターライス', 'executable'],
    ['toshiba-mixed-mushroom-ume-rice', 'たっぷりきのこの炊込みご飯', 'recipe_fact_checked'],
    ['toshiba-seafood-paella-rice', 'シーフードパエリア風炊込みご飯', 'recipe_fact_checked'],
    ['toshiba-bibimbap-mixed-rice', '石焼ビビンバ風炊込みご飯', 'recipe_fact_checked'],
    ['ili-pilaf', '伊犁手抓饭', 'recipe_fact_checked'],
  ];

  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients) && recipe.core_ingredients.length >= 2, recipeId);
    if (status === 'recipe_fact_checked') {
      assert.ok(Array.isArray(recipe.cooking_sequence) && recipe.cooking_sequence.length >= 2, recipeId);
      assert.ok(!validator.PUBLIC_SOURCE_BACKED_STATUSES.has(status), recipeId);
    } else {
      assert.ok(recipe.fixed_batch, recipeId);
      assert.ok(recipe.liquid_contract, recipeId);
    }
    if (status !== 'executable') assert.notEqual(status, 'executable', recipeId);
  }
});
