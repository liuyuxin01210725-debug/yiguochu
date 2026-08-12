import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateRiceMealCollection } from '../lib/rice-meal-collection-validator.mjs';

const readJson = async name => JSON.parse(await readFile(new URL(`../data/${name}`, import.meta.url), 'utf8'));

test('national rice-meal collection records all research candidates, exclusions, regional gaps and current catalog tracking', async () => {
  const [collection, taxonomy, catalog] = await Promise.all([
    readJson('rice-meal-collection.v1.json'),
    readJson('ingredient-taxonomy.v1.json'),
    readJson('rice-meal-catalog.v1.json'),
  ]);
  assert.deepEqual(validateRiceMealCollection(collection, { taxonomy, catalog }), []);
  assert.equal(collection.candidates.length, 68);
  assert.ok(collection.exclusions.length >= 8);
  assert.equal(collection.catalog_tracking.length, 37);
  assert.deepEqual(
    collection.region_nodes.filter(node => node.gap).map(node => node.region_id).sort(),
    ['CN-BJ', 'CN-GS', 'CN-GX', 'CN-HE', 'CN-HI', 'CN-HK', 'CN-HL', 'CN-JL', 'CN-JX', 'CN-LN', 'CN-MO', 'CN-NM', 'CN-QH', 'CN-SD', 'CN-SX', 'CN-XZ'],
  );
  assert.equal(collection.catalog_tracking.filter(row => row.status === 'runtime_ready').length, 8);
  assert.equal(collection.catalog_tracking.filter(row => row.status === 'calibration_ready').length, 26);
  assert.equal(collection.catalog_tracking.filter(row => row.status === 'planned').length, 3);
  assert.equal(collection.runtime_mappings.length, 37);
  for (const candidateId of [
    'household-green-bean-pork-rib-rice',
    'household-mushroom-green-bean-pork-rib-rice',
    'household-cabbage-tofu-rice',
    'household-broccoli-beef-rice',
  ]) {
    const candidate = collection.candidates.find(row => row.candidate_id === candidateId);
    assert.equal(candidate?.status, 'runtime_ready', candidateId);
    assert.equal(candidate?.quantity_liquid_completeness, 'complete', candidateId);
    assert.deepEqual(candidate?.blockers, [], candidateId);
    assert.equal(
      candidate?.traditional_appliance_and_steps,
      '一锅出项目 Preview 家庭测试标准，待真实厨房反馈',
      candidateId,
    );
  }
  assert.ok(collection.candidates.every(candidate => (
    Array.isArray(candidate.core_ingredients)
    && candidate.core_ingredients.every(item => item
      && Object.hasOwn(item, 'canonical_id')
      && typeof item.label === 'string'
      && item.label.trim())
    && !Object.hasOwn(candidate, 'core_ingredient_ids')
  )), 'candidate core ingredients must use the canonical structured source only');
  const variants = catalog.families.flatMap(family => family.variants);
  const trackingByVariantId = new Map(collection.catalog_tracking.map(row => [row.runtime_variant_id, row]));
  const mappingsById = new Map(collection.runtime_mappings.map(row => [row.mapping_id, row]));
  for (const variant of variants) {
    const tracking = trackingByVariantId.get(variant.variant_id);
    assert.ok(variant.collection_candidate_id, `${variant.variant_id} must name its collection candidate`);
    assert.equal(tracking?.candidate_id, variant.collection_candidate_id, `${variant.variant_id} must use the collection tracking candidate`);
    assert.deepEqual(
      mappingsById.get(tracking.reverse_mapping_id),
      { mapping_id: tracking.reverse_mapping_id, candidate_id: variant.collection_candidate_id, tracking_id: tracking.tracking_id },
      `${variant.variant_id} must have one reverse collection mapping`,
    );
    const candidate = collection.candidates.find(row => row.candidate_id === variant.collection_candidate_id);
    assert.deepEqual(candidate.mapped_core, tracking.core_ingredient_ids,
      `${variant.variant_id} mapped_core must be the explicit catalog/tracking mapping`);
  }
});

test('keeps Youzhou she rice as a research candidate with its multi-stage source boundary', async () => {
  const collection = await readJson('rice-meal-collection.v1.json');
  const candidate = collection.candidates.find(item => item.candidate_id === 'youzhou-she-rice');
  assert.deepEqual(candidate?.core_ingredients, [
    { canonical_id: 'raw-rice', label: '米' },
    { canonical_id: null, label: '腊肉' },
    { canonical_id: null, label: '豆干' },
    { canonical_id: null, label: '野菜' },
  ]);
  assert.equal(candidate?.rice_state, 'parboiled-rice');
  assert.equal(candidate?.status, 'research_candidate');
  assert.equal(candidate?.quantity_liquid_completeness, 'identity_only');
  assert.match(candidate?.blockers.join('\n') || '', /野菜控制.*多阶段工艺/);
  assert.deepEqual(candidate?.identity_sources?.[0]?.supports, ['identity']);
  assert.equal(candidate?.identity_sources?.[0]?.url, 'https://youyang.gov.cn/sy_236/yyyw/202506/t20250610_14698997.html');
});

test('keeps Dong侗 steamed she rice separate from Tongren she rice and blocks its unresolved branches', async () => {
  const collection = await readJson('rice-meal-collection.v1.json');
  const candidate = collection.candidates.find(item => item.candidate_id === 'dong-steamed-she-rice');
  assert.deepEqual(candidate?.core_ingredients, [
    { canonical_id: null, label: '糯米/粳米' },
    { canonical_id: null, label: '艾草' },
    { canonical_id: null, label: '腊肉' },
    { canonical_id: null, label: '花生' },
    { canonical_id: null, label: '豆干' },
  ]);
  assert.equal(candidate?.status, 'research_candidate');
  assert.equal(candidate?.quantity_liquid_completeness, 'identity_only');
  assert.match(candidate?.blockers.join('\n') || '', /双工艺.*总克数液体/);
  assert.equal(candidate?.identity_sources?.[0]?.title, '侗族社节');
  assert.deepEqual(candidate?.identity_sources?.[0]?.supports, ['identity']);
});

test('keeps Wanshan she rice ingredients and split-rice process aligned with the official local report', async () => {
  const collection = await readJson('rice-meal-collection.v1.json');
  const candidate = collection.candidates.find(item => item.candidate_id === 'wanshan-she-rice');
  assert.deepEqual(candidate?.core_ingredients, [
    { canonical_id: 'raw-rice', label: '鲜米' },
    { canonical_id: null, label: '糯米' },
    { canonical_id: null, label: '蒿菜' },
    { canonical_id: null, label: '野葱' },
    { canonical_id: null, label: '豆子' },
    { canonical_id: null, label: '花生' },
    { canonical_id: null, label: '腊肉' },
  ]);
  assert.equal(candidate?.status, 'research_candidate');
  assert.equal(candidate?.quantity_liquid_completeness, 'identity_only');
  assert.match(candidate?.blockers.join('\n') || '', /无总数量.*液体.*多阶段/);
  assert.equal(candidate?.identity_sources?.[0]?.title, '网络中国节·清明丨清明时节 社饭飘香');
  assert.deepEqual(candidate?.identity_sources?.[0]?.supports, ['identity']);
});

test('keeps Huixian ground-pot chicken rice aligned with the named local dish report', async () => {
  const collection = await readJson('rice-meal-collection.v1.json');
  const candidate = collection.candidates.find(item => item.candidate_id === 'huixian-ground-pot-chicken-rice');
  assert.deepEqual(candidate?.core_ingredients, [
    { canonical_id: 'raw-rice', label: '生米' },
    { canonical_id: 'chicken-generic', label: '鸡肉' },
    { canonical_id: null, label: '干豆角' },
    { canonical_id: 'shiitake', label: '香菇' },
    { canonical_id: null, label: '粉条' },
  ]);
  assert.equal(candidate?.status, 'research_candidate');
  assert.equal(candidate?.quantity_liquid_completeness, 'identity_only');
  assert.match(candidate?.blockers.join('\n') || '', /没有固定数量.*液体.*时间/);
  assert.equal(candidate?.identity_sources?.[0]?.title, '河南美食No.61|最朴素的乡村地锅，老吃家咋会被一锅米饭惊艳到？');
  assert.deepEqual(candidate?.identity_sources?.[0]?.supports, ['identity']);
});

test('keeps Mayang she rice source terms and rice split explicit', async () => {
  const collection = await readJson('rice-meal-collection.v1.json');
  const candidate = collection.candidates.find(item => item.candidate_id === 'mayang-she-rice');
  assert.deepEqual(candidate?.core_ingredients, [
    { canonical_id: null, label: '粳米' },
    { canonical_id: null, label: '糯米' },
    { canonical_id: null, label: '社蒿菜' },
    { canonical_id: null, label: '腊肉' },
    { canonical_id: null, label: '野藠' },
    { canonical_id: null, label: '大蒜苗' },
  ]);
  assert.equal(candidate?.status, 'research_candidate');
  assert.equal(candidate?.quantity_liquid_completeness, 'identity_only');
  assert.match(candidate?.blockers.join('\n') || '', /3:7.*无固定总量|无固定总量.*3:7/);
  assert.equal(candidate?.identity_sources?.[0]?.title, '[苗族习俗] 饮食');
  assert.deepEqual(candidate?.identity_sources?.[0]?.supports, ['identity']);
});

test('keeps Xiangxi she rice ratio wording unresolved', async () => {
  const collection = await readJson('rice-meal-collection.v1.json');
  const candidate = collection.candidates.find(item => item.candidate_id === 'xiangxi-she-rice');
  assert.deepEqual(candidate?.core_ingredients, [
    { canonical_id: null, label: '粘米' },
    { canonical_id: null, label: '糯米' },
    { canonical_id: null, label: '蒿菜' },
    { canonical_id: null, label: '腊肉' },
    { canonical_id: null, label: '葫葱' },
  ]);
  assert.equal(candidate?.quantity_liquid_completeness, 'identity_only');
  assert.match(candidate?.blockers.join('\n') || '', /三比一.*三分之一.*三分之二/);
  assert.equal(candidate?.identity_sources?.[0]?.title, '地方名小吃：社饭');
  assert.equal(candidate?.identity_sources?.[0]?.retrieved_at, '2026-08-03');
});

test('keeps Xiangjiangyuan bamboo rice thirds and bamboo process explicit', async () => {
  const collection = await readJson('rice-meal-collection.v1.json');
  const candidate = collection.candidates.find(item => item.candidate_id === 'xiangjiangyuan-bamboo-rice');
  assert.deepEqual(candidate?.core_ingredients, [
    { canonical_id: null, label: '糯米' },
    { canonical_id: null, label: '茶豆' },
    { canonical_id: 'ground-pork', label: '猪肉末' },
  ]);
  assert.equal(candidate?.quantity_liquid_completeness, 'partial');
  assert.match(candidate?.traditional_appliance_and_steps || '', /三分之一.*竹筒.*半小时/);
  assert.match(candidate?.blockers.join('\n') || '', /无固定总克数/);
  assert.equal(candidate?.identity_sources?.[0]?.title, '湘聚缘柴火山庄');
  assert.equal(candidate?.identity_sources?.[0]?.retrieved_at, '2026-08-03');
});

test('keeps Lianyuan bamboo rice source wording and roast boundary explicit', async () => {
  const collection = await readJson('rice-meal-collection.v1.json');
  const candidate = collection.candidates.find(item => item.candidate_id === 'lianyuan-bamboo-rice');
  assert.deepEqual(candidate?.core_ingredients, [
    { canonical_id: null, label: '粳米或糯米' },
    { canonical_id: null, label: '腊肉' },
    { canonical_id: null, label: '红枣' },
  ]);
  assert.equal(candidate?.quantity_liquid_completeness, 'identity_only');
  assert.match(candidate?.traditional_appliance_and_steps || '', /温火.*20分钟/);
  assert.match(candidate?.blockers.join('\n') || '', /无固定总克数/);
  assert.equal(candidate?.identity_sources?.[0]?.title, '跟着旅发大会游涟源|来一场舌尖上的美食之旅！');
  assert.equal(candidate?.identity_sources?.[0]?.retrieved_at, '2026-08-03');
});

test('only findings outside the eight approved calibration candidates remain blocked research candidates', async () => {
  const [collection, taxonomy, catalog] = await Promise.all([
    readJson('rice-meal-collection.v1.json'),
    readJson('ingredient-taxonomy.v1.json'),
    readJson('rice-meal-catalog.v1.json'),
  ]);
  assert.deepEqual(validateRiceMealCollection(collection, { taxonomy, catalog }), []);

  const byId = new Map(collection.candidates.map(candidate => [candidate.candidate_id, candidate]));
  const tracked = new Set(collection.catalog_tracking.map(row => row.candidate_id).filter(Boolean));
  const mapped = new Set(collection.runtime_mappings.map(row => row.candidate_id));
  for (const id of [
    'wenzhou-mustard-rice',
    'quanzhou-red-crab-rice',
    'zojirushi-tomato-seafood-rice',
  ]) {
    const candidate = byId.get(id);
    assert.ok(candidate, `${id} must be recorded`);
    assert.equal(candidate.status, 'research_candidate', `${id} must not be activated`);
    assert.ok(candidate.blockers.length > 0, `${id} must retain blockers`);
    assert.equal(tracked.has(id), false, `${id} must not enter catalog tracking`);
    assert.equal(mapped.has(id), false, `${id} must not enter runtime mappings`);
  }

  const tomatoSeafood = byId.get('zojirushi-tomato-seafood-rice');
  assert.equal(tomatoSeafood.quantity_liquid_completeness, 'partial');
  assert.match(tomatoSeafood.blockers.join('\n'), /串页|损坏|矛盾/);
  assert.equal(tomatoSeafood.nutrition_grade, 'C');
  assert.equal(byId.get('quanzhou-red-crab-rice').name, '泉州红蟳饭（红膏蟳饭）');

  for (const id of [
    'taiwan-cabbage-rice',
    'taiwan-pumpkin-rice',
    'joyoung-curry-chicken-rice',
    'joyoung-sausage-mixed-rice',
    'zojirushi-beef-mixed-rice',
    'zojirushi-bamboo-vegetable-rice',
    'panasonic-mixed-chicken-rice',
    'panasonic-fresh-shiitake-rice',
  ]) {
    const candidate = byId.get(id);
    assert.equal(candidate?.status, 'calibration_ready', id);
    assert.equal(candidate?.quantity_liquid_completeness, 'complete', id);
    assert.match(candidate?.blockers.join('\n') || '', /内部校准合同.*实厨试做/u, id);
    assert.equal(tracked.has(id), true, id);
    assert.equal(mapped.has(id), true, id);
  }
});

test('research blockers preserve dish-defining rice state, liquid ambiguity, and raw-versus-cooked safety boundaries', async () => {
  const collection = await readJson('rice-meal-collection.v1.json');
  const byId = new Map(collection.candidates.map(candidate => [candidate.candidate_id, candidate]));

  const nanjing = byId.get('nanjing-duck-greens-rice');
  assert.ok(nanjing.core_ingredients.some(item => item.label === '板鸭丁'));
  assert.equal(nanjing.core_ingredients.some(item => item.label === '熟板鸭'), false);
  assert.ok(nanjing.identity_sources.some(source => source.supports.includes('safety')));
  assert.match(nanjing.blockers.join('\n'), /生熟|熟制/);

  const pilaf = byId.get('xinjiang-lamb-pilaf');
  assert.match(pilaf.blockers.join('\n'), /1:2/);
  assert.match(pilaf.blockers.join('\n'), /分子|分母|米量|份数/);

  for (const id of ['sichuan-pea-kong-rice', 'sichuan-green-bean-kong-rice']) {
    const candidate = byId.get(id);
    assert.match(candidate.traditional_appliance_and_steps, /半熟|六成熟/);
    assert.match(candidate.traditional_appliance_and_steps, /沥米汤/);
    assert.match(candidate.blockers.join('\n'), /沥米汤|回加液体|预煮终点/);
  }

  assert.equal(byId.get('guangzhou-mushroom-chicken-claypot-rice').name, '冬菇滑鸡饭');
  assert.equal(byId.get('guangzhou-black-bean-rib-claypot-rice').name, '豉汁排骨饭');
});

test('keeps the Tengchong copper-pot potato rice candidate aligned with its official ingredient wording', async () => {
  const collection = await readJson('rice-meal-collection.v1.json');
  const candidate = collection.candidates.find(item => (
    item.candidate_id === 'tengchong-copper-pot-potato-rice'
  ));

  assert.deepEqual(candidate?.core_ingredients, [
    { canonical_id: 'raw-rice', label: '米' },
    { canonical_id: 'potato', label: '土豆' },
    { canonical_id: null, label: '绿豆' },
    { canonical_id: null, label: '腊肉' },
  ]);
  assert.equal(candidate?.nutrition_grade, 'C');
  assert.equal(candidate?.identity_sources?.[0]?.title, '北海的年味');
  assert.deepEqual(candidate?.identity_sources?.[0]?.supports, [
    'identity', 'appliance',
  ]);
  assert.equal(candidate?.status, 'research_candidate');
  assert.equal(candidate?.quantity_liquid_completeness, 'identity_only');
});

test('keeps the Mizhi lamb dingding rice candidate aligned with its official ingredient wording', async () => {
  const collection = await readJson('rice-meal-collection.v1.json');
  const candidate = collection.candidates.find(item => (
    item.candidate_id === 'mizhi-lamb-diced-rice'
  ));

  assert.deepEqual(candidate?.core_ingredients, [
    { canonical_id: 'raw-millet', label: '小米' },
    { canonical_id: null, label: '羊肉' },
    { canonical_id: null, label: '羊肉汤' },
  ]);
  assert.equal(candidate?.rice_state, 'rice-state-unverified');
  assert.equal(candidate?.nutrition_grade, 'C');
  assert.equal(candidate?.identity_sources?.[0]?.title, '米脂县地方小吃系列');
  assert.equal(candidate?.identity_sources?.[0]?.publisher, '米脂县人民政府');
  assert.equal(candidate?.identity_sources?.[0]?.retrieved_at, '2026-08-03');
  assert.deepEqual(candidate?.identity_sources?.[0]?.supports, ['identity']);
  assert.equal(candidate?.status, 'research_candidate');
  assert.equal(candidate?.quantity_liquid_completeness, 'identity_only');
});

test('keeps the Nanjing aijiaohuang duck rice candidate aligned with its local gazette wording', async () => {
  const collection = await readJson('rice-meal-collection.v1.json');
  const candidate = collection.candidates.find(item => (
    item.candidate_id === 'nanjing-duck-greens-rice'
  ));

  assert.deepEqual(candidate?.core_ingredients, [
    { canonical_id: null, label: '糯米' },
    { canonical_id: 'aijiaohuang-greens', label: '矮脚黄' },
    { canonical_id: null, label: '板鸭丁' },
    { canonical_id: null, label: '姜' },
  ]);
  assert.equal(candidate?.rice_state, 'glutinous-rice');
  assert.equal(candidate?.nutrition_grade, 'C');
  assert.equal(candidate?.identity_sources?.[0]?.title, '金陵节气诗词：小寒');
  assert.equal(candidate?.identity_sources?.[0]?.publisher, '南京市地方志工作办公室');
  assert.equal(candidate?.identity_sources?.[0]?.retrieved_at, '2026-08-03');
  assert.deepEqual(candidate?.identity_sources?.[0]?.supports, ['identity']);
  assert.equal(candidate?.status, 'identity_only');
  assert.equal(candidate?.quantity_liquid_completeness, 'identity_only');
});

test('keeps the Banshan Lixia wild rice candidate aligned with the intangible-heritage wording', async () => {
  const collection = await readJson('rice-meal-collection.v1.json');
  const candidate = collection.candidates.find(item => (
    item.candidate_id === 'banshan-lixia-wild-rice'
  ));

  assert.deepEqual(candidate?.core_ingredients, [
    { canonical_id: 'raw-rice', label: '米' },
    { canonical_id: 'egg', label: '鸡蛋' },
    { canonical_id: null, label: '韭菜' },
  ]);
  assert.equal(candidate?.rice_state, 'raw-rice');
  assert.equal(candidate?.nutrition_grade, 'C');
  assert.equal(candidate?.identity_sources?.[0]?.title, '拱墅区举办第六届半山立夏节');
  assert.equal(candidate?.identity_sources?.[0]?.publisher, '中国非物质文化遗产网');
  assert.equal(candidate?.identity_sources?.[0]?.retrieved_at, '2026-08-03');
  assert.deepEqual(candidate?.identity_sources?.[0]?.supports, ['identity']);
  assert.equal(candidate?.status, 'research_candidate');
  assert.equal(candidate?.quantity_liquid_completeness, 'identity_only');
});

test('keeps the Shidian broad-bean ham rice candidate aligned with its government source', async () => {
  const collection = await readJson('rice-meal-collection.v1.json');
  const candidate = collection.candidates.find(item => (
    item.candidate_id === 'shidian-broad-bean-ham-rice'
  ));

  assert.deepEqual(candidate?.core_ingredients, [
    { canonical_id: 'raw-rice', label: '米' },
    { canonical_id: null, label: '火腿' },
    { canonical_id: null, label: '蚕豆' },
  ]);
  assert.equal(candidate?.rice_state, 'raw-rice');
  assert.equal(candidate?.nutrition_grade, 'C');
  assert.equal(candidate?.identity_sources?.[0]?.title, '【美味施甸】春味，藏在豆香里');
  assert.equal(candidate?.identity_sources?.[0]?.publisher, '施甸县人民政府');
  assert.equal(candidate?.identity_sources?.[0]?.retrieved_at, '2026-08-03');
  assert.deepEqual(candidate?.identity_sources?.[0]?.supports, ['identity']);
  assert.equal(candidate?.status, 'identity_only');
  assert.equal(candidate?.quantity_liquid_completeness, 'identity_only');
});

test('keeps the Qijiang potato cured-pork kong rice candidate aligned with its government source', async () => {
  const collection = await readJson('rice-meal-collection.v1.json');
  const candidate = collection.candidates.find(item => (
    item.candidate_id === 'qijiang-potato-cured-pork-kong-rice'
  ));

  assert.deepEqual(candidate?.core_ingredients, [
    { canonical_id: 'raw-rice', label: '米' },
    { canonical_id: 'potato', label: '土豆' },
    { canonical_id: null, label: '腊肉' },
  ]);
  assert.equal(candidate?.rice_state, 'rice-state-unverified');
  assert.equal(candidate?.nutrition_grade, 'C');
  assert.equal(candidate?.identity_sources?.[0]?.title, '2000名选手参赛 2025重庆老瀛山越野挑战赛开幕');
  assert.equal(candidate?.identity_sources?.[0]?.publisher, '重庆市人民政府网');
  assert.equal(candidate?.identity_sources?.[0]?.retrieved_at, '2026-08-03');
  assert.deepEqual(candidate?.identity_sources?.[0]?.supports, ['identity']);
  assert.equal(candidate?.status, 'identity_only');
  assert.equal(candidate?.quantity_liquid_completeness, 'identity_only');
});

test('keeps the Ninghe zengxiang pork rice candidate aligned with its Tianjin Daily source', async () => {
  const collection = await readJson('rice-meal-collection.v1.json');
  const candidate = collection.candidates.find(item => (
    item.candidate_id === 'ninghe-zeng-pork-rice'
  ));

  assert.deepEqual(candidate?.core_ingredients, [
    { canonical_id: 'raw-rice', label: '米' },
    { canonical_id: 'pork-generic', label: '猪肉' },
  ]);
  assert.equal(candidate?.rice_state, 'raw-rice');
  assert.equal(candidate?.nutrition_grade, 'C');
  assert.equal(candidate?.identity_sources?.[0]?.title, '望山见水忆乡愁（图）');
  assert.equal(candidate?.identity_sources?.[0]?.publisher, '天津日报');
  assert.equal(candidate?.identity_sources?.[0]?.retrieved_at, '2026-08-03');
  assert.deepEqual(candidate?.identity_sources?.[0]?.supports, [
    'identity', 'appliance',
  ]);
  assert.equal(candidate?.status, 'research_candidate');
  assert.equal(candidate?.quantity_liquid_completeness, 'identity_only');
});

test('keeps the Yichang cured-pork braised rice candidate aligned with the official listing', async () => {
  const collection = await readJson('rice-meal-collection.v1.json');
  const candidate = collection.candidates.find(item => (
    item.candidate_id === 'yichang-cured-pork-braised-rice'
  ));

  assert.deepEqual(candidate?.core_ingredients, [
    { canonical_id: 'raw-rice', label: '米' },
    { canonical_id: null, label: '腊肉' },
  ]);
  assert.equal(candidate?.rice_state, 'rice-state-unverified');
  assert.equal(candidate?.nutrition_grade, 'C');
  assert.equal(candidate?.identity_sources?.[0]?.title, '新华网：江汉大米“链动”三峡 产销合作启新篇');
  assert.equal(candidate?.identity_sources?.[0]?.publisher, '宜昌市发展和改革委员会');
  assert.equal(candidate?.identity_sources?.[0]?.retrieved_at, '2026-08-03');
  assert.deepEqual(candidate?.identity_sources?.[0]?.supports, ['identity']);
  assert.equal(candidate?.status, 'identity_only');
  assert.equal(candidate?.quantity_liquid_completeness, 'identity_only');
});
