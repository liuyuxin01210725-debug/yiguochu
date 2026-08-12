import { buildShelfCatalog } from './source-backed-shelf.mjs';
import { requiresSourceSafetyEndpoint, sourceSafetyApplicability, sourceSafetyStatus } from './source-backed-safety-applicability.mjs';

const REVIEW_VERSION = 'source-backed-formal-candidate-review-v1-20260812-r2';
const REQUIRED_SOURCE_FIELDS = Object.freeze([
  'fixed_batch',
  'liquid_contract',
  'cooking_sequence',
  'time_contract',
  'safety_endpoints',
]);

const CONTROLLED_LABEL_ALIASES = Object.freeze({
  '米': 'raw-rice',
  '白米': 'raw-rice',
  '生米': 'raw-rice',
  '鸡肉': 'chicken-generic',
  '鸡腿肉': 'chicken-leg',
  '鸡腿': 'chicken-leg',
  '鸡胸肉': 'chicken-breast',
  '鸡胸': 'chicken-breast',
  '猪肉': 'pork-generic',
  '猪肉片': 'pork-generic',
  '猪肉丝': 'pork-generic',
  '虾仁': 'shrimp',
  '鲜虾仁': 'shrimp',
  '高麗菜': 'green-cabbage',
  '醬油': 'soy-sauce',
  '醤油': 'soy-sauce',
  '淡口酱油': 'soy-sauce',
  '淡口醤油': 'soy-sauce',
  '低钠酱油': 'soy-sauce',
  '老抽': 'soy-sauce',
  '调味酱油': 'soy-sauce',
  '小番茄': 'tomato',
  '干虾': 'dried-shrimp',
  '乾蝦': 'dried-shrimp',
  '麻油': 'sesame-oil',
  '橄榄油': 'cooking-oil',
  '沙拉油': 'cooking-oil',
  '沙拉油（炒虾与洋葱）': 'cooking-oil',
  '沙拉油（炒蛋）': 'cooking-oil',
  '料理酒': 'cooking-wine',
  '清酒': 'cooking-wine',
  '米酒': 'cooking-wine',
  '味醂': 'cooking-wine',
  '酒': 'cooking-wine',
  '日式颗粒高汤': 'broth',
  'だし': 'broth',
  '低盐鸡汤': 'chicken-broth',
  '砂糖': 'sugar',
  '豌豆': 'green-peas',
  '冷冻青豆': 'green-peas',
  '油豆腐': 'fried-tofu',
  '粳米': 'raw-rice',
  '蓬莱米': 'raw-rice',
  '丝苗米': 'raw-rice',
  '香米': 'raw-rice',
  '日本米': 'raw-rice',
  '精米': 'raw-rice',
  '珍珠米': 'raw-rice',
  '长粒米': 'raw-rice',
  '长粒白米': 'raw-rice',
  '红萝卜': 'carrot',
  '紅蘿蔔': 'carrot',
  '洋芋': 'potato',
  '水煮竹笋': 'bamboo-shoot',
  '新竹笋（煮熟去皮）': 'bamboo-shoot',
  '鸡脯肉': 'chicken-breast',
  '豬肉絲': 'pork-generic',
  '松阪豬': 'pork-generic',
  '猪颈肉': 'pork-generic',
  '牛肉薄切り': 'beef-generic',
  '牛絞肉': 'beef-ground',
  '有头虾': 'shrimp',
  '红虾': 'shrimp',
  '蝦米': 'dried-shrimp',
  '金針菇': 'enoki-mushroom',
  '鴻禧菇': 'shimeji-mushroom',
  '本しめじ': 'shimeji-mushroom',
  '老薑': 'ginger-root',
  '泰國米': 'jasmine-rice',
  '泰国香米': 'jasmine-rice',
  '中粒白米': 'raw-rice',
  '未煮长粒米': 'raw-rice',
  '黑米': 'black-rice',
  '冷水': 'water',
  '糯米': 'raw-glutinous-rice',
  '腊肠': 'chinese-sausage',
  '港式腊肠': 'chinese-sausage',
  '熟饭': 'cooked-rice',
  // These aliases preserve the same ingredient state and category; they do
  // not collapse distinct products (for example, cured meat or seafood).
  '油': 'cooking-oil',
  '冷冻四季豆': 'green-beans',
  '冷冻豌豆': 'green-peas',
  '干虾': 'dried-shrimp',
  '油豆腐': 'fried-tofu',
  '蚕豆': 'broad-bean',
  '冬菇': 'dried-shiitake',
  '粘米': 'raw-rice',
  '洋蔥': 'onion',
  '鹽': 'salt',
  '胡蘿蔔': 'carrot',
  '彩椒': 'bell-pepper',
  '牛肉薄片': 'beef-generic',
  '鸡翅根': 'chicken-generic',
  '蔥': 'scallion',
  '油揚げ': 'fried-tofu',
  // R8: keep only labels whose ingredient state/category is explicit and
  // already represented by an existing taxonomy row. These aliases do not
  // create a new nutrition item or collapse a product into an unrelated one.
  '腊肉': 'cured-pork',
  '臘肉': 'cured-pork',
  '冬笋': 'bamboo-shoot',
  '冬筍': 'bamboo-shoot',
  '菜籽油': 'cooking-oil',
  'Arborio米': 'raw-rice',
  '熟白饭': 'cooked-rice',
  '熟白飯': 'cooked-rice',
  '白饭': 'cooked-rice',
  '白飯': 'cooked-rice',
  '米飯': 'cooked-rice',
  '未煮糙米': 'brown-rice',
  '低钠鸡汤': 'chicken-broth',
  '低鈉雞湯': 'chicken-broth',
  '虾干': 'dried-shrimp',
  '蝦干': 'dried-shrimp',
  '蝦仁': 'shrimp',
  '薑': 'ginger-root',
  // R8: exact state-safe labels from source cards. These aliases only point
  // at existing taxonomy rows; they do not create nutrition values or merge
  // ambiguous products such as pepper blends, mixed seafood, or meat cuts.
  '干冬菇': 'dried-shiitake',
  '去骨去皮鸡腿肉': 'chicken-leg',
  '绍兴酒': 'cooking-wine',
  '盐（腌料）': 'salt',
  '盐（米饭）': 'salt',
  '猪肉糜': 'ground-pork',
  '牛心菜': 'green-cabbage',
  '海蛎': 'oyster',
  '青豌豆仁': 'green-peas',
  '长糯米': 'raw-glutinous-rice',
  '鲜鸡蛋': 'egg',
  '姜丝': 'ginger-root',
  '大蒜苗': 'garlic-sprout',
  '大葱': 'scallion',
  '春笋': 'bamboo-shoot',
  '雷笋': 'bamboo-shoot',
  '净鲜笋': 'bamboo-shoot',
  '小干贝': 'dried-scallop',
  // R9: exact sugar and broth product names retain their nutrition-bearing
  // category instead of being treated as disposable seasonings.
  '红糖': 'sugar',
  '冰糖': 'sugar',
  '白糖': 'sugar',
  '白だし': 'broth',
  '出汁': 'broth',
  '柴鱼高汤': 'broth',
  '昆布出汁': 'broth',
  '昆布高汤': 'broth',
  // R10: exact state/category aliases from source cards. These preserve the
  // ingredient class without inventing a new nutrition row or changing the
  // source amount/unit.
  '蒜泥': 'garlic',
  '温水': 'water',
  '生白米': 'raw-rice',
  '免洗米': 'raw-rice',
  '短粒米': 'raw-rice',
  '去皮栗子': 'chestnut',
  '姜泥': 'ginger-root',
  '葱绿': 'scallion',
  '洋蔥末': 'onion',
  '鲜虾': 'shrimp',
  '鱼高汤': 'broth',
  'だし汁': 'broth',
  // R11: preserve explicit raw aromatics, grain forms, condiments, produce,
  // and named broth products as their existing taxonomy identities.
  '姜茸': 'ginger-root',
  '长葱': 'scallion',
  '葱叶': 'scallion',
  '蒜（切碎）': 'garlic',
  '蒜蓉': 'garlic',
  '精白米': 'raw-rice',
  '茉莉白米': 'raw-rice',
  '丝苗白米': 'raw-rice',
  '生栗': 'chestnut',
  '去皮栗': 'chestnut',
  '脫殼栗子': 'chestnut',
  '酱油膏': 'soy-sauce',
  '台湾酱油': 'soy-sauce',
  '减盐酱油': 'soy-sauce',
  '紅甜椒': 'bell-pepper',
  '鮮香菇': 'shiitake',
  '小香菇': 'shiitake',
  '小黄瓜': 'cucumber',
  '红藜麦': 'quinoa',
  '多色藜麦': 'quinoa',
  '冷冻玉米': 'sweet-corn',
  '冷冻甜玉米': 'sweet-corn',
  '日式高汤': 'broth',
  '鲣鱼高汤': 'broth',
  '鸡汤块': 'chicken-broth',
  '鸡汤粉': 'chicken-broth',
  // R12: exact raw-grain, aromatic, produce, condiment, tofu and dried-seafood
  // labels. These preserve the source state/category and do not invent a
  // nutrition row or collapse a mixed/ambiguous product into one identity.
  '新米': 'raw-rice',
  '新大米': 'raw-rice',
  '日本短粒米': 'raw-rice',
  '生糯米': 'raw-glutinous-rice',
  '短粒或中粒白米': 'raw-rice',
  '姜片': 'ginger-root',
  '蒜末': 'garlic',
  '蒜頭': 'garlic',
  '新姜': 'ginger-root',
  '野葱': 'scallion',
  '黄洋葱': 'onion',
  '大红洋葱': 'onion',
  '樱桃番茄': 'tomato',
  'Roma番茄': 'tomato',
  '紅蔥頭': 'shallot',
  '三角油豆腐': 'fried-tofu',
  '厚揚げ': 'fried-tofu',
  '豉油': 'soy-sauce',
  '黑麻油': 'sesame-oil',
  '干瑶柱': 'dried-scallop',
  // R13: explicit source labels whose state/category is already represented
  // by the taxonomy. Alternatives and mixed products remain unmapped.
  '虾': 'shrimp',
  '干虾米': 'dried-shrimp',
  '金钩虾': 'dried-shrimp',
  '浓口酱油': 'soy-sauce',
  '低钠盐': 'salt',
  '主锅水': 'water',
  '香料糊用水': 'water',
  '猪肉末': 'ground-pork',
  '猪肉粒': 'pork-generic',
  '猪肉丁': 'pork-generic',
  '鸡肉（切块）': 'chicken-generic',
  '去骨鸡肉': 'chicken-generic',
  '鸡柳': 'chicken-breast',
  '鸡里肌肉': 'chicken-breast',
  '鸡腿排': 'chicken-leg',
  '蔥花': 'scallion',
  '嫩姜（磨碎）': 'ginger-root',
  '嫩姜（切片）': 'ginger-root',
  '配食葱花': 'scallion',
  // R14: explicit cut/state labels for existing poultry, pork, broth, kelp,
  // octopus and cooking-wine taxonomy rows.
  '去骨鸡腿': 'chicken-leg',
  '雞胸肉': 'chicken-breast',
  '猪五花肉': 'pork-belly',
  '猪五花肉（块）': 'pork-belly',
  '鱼汤': 'broth',
  '蔬菜汤': 'broth',
  '出汁昆布': 'kombu',
  '酒（调味料A）': 'cooking-wine',
  '酒（调味料B）': 'cooking-wine',
  '生章鱼': 'octopus',
  '瘦牛肉末': 'beef-ground',
  // R15: explicit poultry cuts from source cards. Keep generic pieces as
  // chicken-generic; only labels that name a leg/cut map to chicken-leg.
  '整只鸡腿': 'chicken-leg',
  '鸡块': 'chicken-generic',
  '鸡件': 'chicken-generic',
  '鸡扒': 'chicken-generic',
  '去骨雞腿排': 'chicken-leg',
  '帶皮雞腿肉': 'chicken-leg',
  '去骨雞腿肉': 'chicken-leg',
  '去脂鸡腿肉': 'chicken-leg',
  '去骨去皮鸡胸': 'chicken-breast',
  '去骨去皮鸡胸肉': 'chicken-breast',
  '舞菇': 'mushroom-generic',
  '舞茸': 'mushroom-generic',
  '洋菇': 'mushroom-generic',
  '雪白菇': 'mushroom-generic',
  // R16: the source names a specific mushroom family or mushroom variety,
  // while the taxonomy has only the existing generic mushroom nutrition row.
  // These aliases preserve the mushroom category without inventing a new
  // nutrition identity or collapsing a non-mushroom mixed product.
  '混合菇': 'mushroom-generic',
  '混合蘑菇': 'mushroom-generic',
  '菌菇': 'mushroom-generic',
  '松茸': 'mushroom-generic',
  '杂菇': 'mushroom-generic',
  '综合菇': 'mushroom-generic',
  '鲜菇': 'mushroom-generic',
  '白蘑菇': 'mushroom-generic',
  '波特贝罗蘑菇': 'mushroom-generic',
  '滑子菇': 'mushroom-generic',
  '牛肝菌': 'mushroom-generic',
  '珊瑚菇': 'mushroom-generic',
  '白菌与灵芝菇': 'mushroom-generic',
  '磨菇': 'mushroom-generic',
  '秀珍菇': 'mushroom-generic',
  '美白菇': 'mushroom-generic',
  '越光米': 'raw-rice',
  '義大利米': 'raw-rice',
  '月光米': 'raw-rice',
});

// These labels are deliberately excluded from the core nutrition taxonomy only
// when the source names an unambiguous small-use spice/acid. They are not
// substitutes for oil, sugar, salt, soy sauce, broth, or any protein/produce;
// those remain required taxonomy matches so their nutrition and allergen
// effects are not silently discarded.
const CONTROLLED_SMALL_USE_SEASONINGS = new Set([
  '白胡椒',
  '胡椒',
  '黑胡椒',
  '胡椒粉',
  '五香粉',
  '辣椒粉',
  '咖喱粉',
  '姜黄粉',
  '姜黄',
  '花椒',
  '香料',
  '醋',
  '米醋',
  '柠檬汁',
  '芫荽（切碎）',
  '新鲜薄荷',
  '八角',
  '肉桂',
  '丁香',
  '绿色小豆蔻',
  '绿色小豆蔻（米饭用）',
  '茴香粉',
  '孜然粉',
  '芫荽粉',
  '豆蔻',
  '黑胡椒粒',
  '香茅',
  '香叶',
  '罗勒',
  '薑黃粉',
]);

const BLOCKER_LABELS = Object.freeze({
  source_contract: '来源执行合同未闭合',
  taxonomy_mapping: '核心食材尚未逐项绑定 taxonomy 身份与营养行',
  ratio_dsl: '尚未建立可编译的 Ratio DSL 与份数边界',
  cooker_boundary: '来源器具边界尚未转换为正式 Planner 适配',
  nutrition_gate: '营养结构尚未满足主餐门槛',
  safety_gate: '食品安全终点未闭合',
  kitchen_observed: '尚未完成厨房试做与人工复核',
  journey_coverage: '尚未完成真实旅程、过敏和替换回归',
  source_status: '来源状态尚未达到正式化阶段',
});

const NEXT_ACTIONS = Object.freeze({
  source_contract: '回到同一来源补齐缺失的固定批量、液体、步骤、总时长或安全终点。',
  taxonomy_mapping: '为每个核心食材绑定现有 taxonomy；无法证实的标签保持待核，不新造营养行。',
  ratio_dsl: '基于来源合同与已验证 taxonomy 编写 Ratio DSL，并跑编译器边界测试。',
  cooker_boundary: '完成同一器具/模式的适配证据；不得把来源水位或程序外推为普通电饭煲。',
  nutrition_gate: '补齐碳水、蛋白质和膳食纤维角色及权威营养映射。',
  safety_gate: '挂接与食材状态对应的权威安全终点；不能用烹调时长替代。',
  kitchen_observed: '完成厨房试做、记录实际水量/时间/出锅状态并人工复核。',
  journey_coverage: '补齐真实旅程、过敏、禁忌、替换与失败回归。',
  source_status: '完成来源打开、归档、身份和事实范围核验。',
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeLabel(value) {
  return String(value || '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\s·・,，。；;:：/\\_\-—()（）［\[\]【】]/gu, '');
}

function taxonomyIndex(taxonomy) {
  const index = new Map();
  for (const item of asArray(taxonomy?.items)) {
    if (!item?.canonical_id) continue;
    for (const label of [item.display_name, ...asArray(item.aliases)]) {
      const key = normalizeLabel(label);
      if (key) index.set(key, item.canonical_id);
    }
  }
  return index;
}

function findTaxonomyMatch(label, index) {
  const direct = index.get(normalizeLabel(label));
  if (direct) return { canonical_id: direct, match: 'exact_label' };
  const controlled = CONTROLLED_LABEL_ALIASES[String(label || '').trim()];
  if (controlled) return { canonical_id: controlled, match: 'controlled_alias' };
  return null;
}

function sourceContract(recipe) {
  const fixed = recipe?.fixed_batch;
  const safetyRequired = requiresSourceSafetyEndpoint(recipe);
  const fields = {
    fixed_batch: Boolean(fixed && Number.isFinite(fixed.servings) && asArray(fixed.ingredients).length > 0),
    liquid_contract: Boolean(recipe?.liquid_contract),
    cooking_sequence: asArray(recipe?.cooking_sequence).length > 0,
    time_contract: Boolean(recipe?.time_contract && Number.isFinite(recipe.time_contract.total_minutes)),
    safety_endpoints: asArray(recipe?.safety_endpoints).length > 0,
  };
  const missingFields = REQUIRED_SOURCE_FIELDS.filter(field => (
    field === 'safety_endpoints' && !safetyRequired ? false : !fields[field]
  ));
  return {
    required_fields: safetyRequired
      ? [...REQUIRED_SOURCE_FIELDS]
      : REQUIRED_SOURCE_FIELDS.filter(field => field !== 'safety_endpoints'),
    present_fields: REQUIRED_SOURCE_FIELDS.filter(field => fields[field]),
    missing_fields: missingFields,
    fields,
    safety_applicability: safetyRequired ? 'required' : 'not_applicable',
  };
}

function mapTaxonomy(recipe, index) {
  const labels = asArray(recipe?.fixed_batch?.ingredients).map(item => item?.name).filter(Boolean);
  const fallback = labels.length ? labels : asArray(recipe?.core_ingredients);
  const matched = [];
  const seasoningIgnored = [];
  const missing = [];
  const seenMatched = new Set();
  const seenMissing = new Set();
  for (const label of fallback) {
    const match = findTaxonomyMatch(label, index);
    if (match) {
      const key = `${label}:${match.canonical_id}`;
      if (!seenMatched.has(key)) {
        matched.push({ source_label: label, ...match });
        seenMatched.add(key);
      }
    } else if (CONTROLLED_SMALL_USE_SEASONINGS.has(String(label || '').trim())) {
      const key = String(label || '').trim();
      if (!seasoningIgnored.some(item => item.source_label === key)) {
        seasoningIgnored.push({
          source_label: key,
          match: 'controlled_small_use_seasoning',
          reason: '明确的小用量香辛料或酸味调味，不作为核心营养食材；不得扩展到油、糖、盐、酱油、高汤或蛋白质。',
        });
      }
    } else if (!seenMissing.has(label)) {
      missing.push(label);
      seenMissing.add(label);
    }
  }
  return {
    matched,
    seasoning_ignored: seasoningIgnored,
    missing,
    status: missing.length ? 'partial' : 'closed',
  };
}

function ratioReview(recipe, ratioCatalog, formalRatioEvidence) {
  const recipeId = recipe?.recipe_id;
  const sourceIds = new Set(asArray(recipe?.source_refs).map(source => source?.source_id).filter(Boolean));
  const compiledOrCandidateRuleIds = asArray(ratioCatalog?.rules)
    .filter(rule => asArray(rule?.evidence_recipe_ids).some(id => id === recipeId || sourceIds.has(id)))
    .map(rule => rule.rule_id)
    .filter(Boolean);
  const evidenceRuleIds = asArray(formalRatioEvidence?.entries)
    .filter(entry => entry?.recipe_id === recipeId
      && ['candidate_evidence_only', 'source_bounded_non_executable'].includes(entry?.compile_status))
    .map(entry => entry.rule_id)
    .filter(Boolean);
  const candidateRuleIds = [...new Set([...compiledOrCandidateRuleIds, ...evidenceRuleIds])];
  const bounded = asArray(formalRatioEvidence?.entries)
    .some(entry => entry?.recipe_id === recipeId && entry?.compile_status === 'source_bounded_non_executable');
  return {
    status: bounded ? 'source_bounded' : candidateRuleIds.length ? 'candidate_evidence_only' : 'unmapped',
    candidate_rule_ids: candidateRuleIds,
    compiled_rule_ids: bounded ? [] : [],
    note: bounded
      ? '固定批次来源合同已逐字段对齐，但仍不可缩放、不可跨器具转换；厨房试做和真实旅程完成前不得进入正式 Planner。'
      : candidateRuleIds.length
        ? '规则只提供同源证据候选，尚未证明该 source-backed 条目的 slot、状态和边界完全一致。'
      : '当前 Ratio DSL 没有直接绑定该 source-backed recipe_id/source_id 的规则。',
  };
}

function nutritionReview(recipe) {
  const nutrition = recipe?.nutrition_structure;
  const roles = asArray(nutrition?.roles);
  const hasCarb = roles.includes('carbohydrate') || roles.includes('carb');
  const hasProtein = roles.includes('protein');
  const hasFiber = roles.includes('fiber') || roles.includes('vegetable');
  const closed = ['A', 'B'].includes(nutrition?.grade) && hasCarb && hasProtein && hasFiber;
  return {
    grade: nutrition?.grade || null,
    roles,
    status: closed ? 'closed' : 'partial_or_missing',
    missing_roles: [
      !hasCarb ? 'carbohydrate' : null,
      !hasProtein ? 'protein' : null,
      !hasFiber ? 'fiber' : null,
    ].filter(Boolean),
  };
}

function buildRecord(recipe, shelfRecord, taxonomy, ratioCatalog, formalRatioEvidence) {
  const sourceContractRecord = sourceContract(recipe);
  const taxonomyMapping = mapTaxonomy(recipe, taxonomy);
  const ratio = ratioReview(recipe, ratioCatalog, formalRatioEvidence);
  const nutrition = nutritionReview(recipe);
  const safety = {
    status: sourceSafetyStatus(recipe),
    applicability: sourceSafetyApplicability(recipe),
    endpoint_codes: asArray(recipe?.safety_endpoints).map(endpoint => endpoint?.code).filter(Boolean),
  };
  const cookerStatus = recipe?.cooker_adaptation?.status || 'unknown';
  const methodStatus = shelfRecord?.research_method?.status || 'unknown';
  const sourceComplete = methodStatus === 'source_complete';
  const blockerCodes = [];
  if (sourceContractRecord.missing_fields.length) blockerCodes.push('source_contract');
  if (taxonomyMapping.missing.length) blockerCodes.push('taxonomy_mapping');
  if (ratio.status !== 'closed') blockerCodes.push('ratio_dsl');
  if (!['direct_adaptation'].includes(cookerStatus)) blockerCodes.push('cooker_boundary');
  if (nutrition.status !== 'closed') blockerCodes.push('nutrition_gate');
  if (safety.status === 'missing') blockerCodes.push('safety_gate');
  blockerCodes.push('kitchen_observed', 'journey_coverage');
  if (!['executable', 'recipe_fact_checked'].includes(recipe?.status)) blockerCodes.push('source_status');

  return {
    recipe_id: recipe.recipe_id,
    canonical_name: recipe.canonical_name,
    source_status: recipe.status,
    method_card_status: methodStatus,
    formal_candidate_status: sourceComplete ? 'source_complete_pending_formal' : 'research_only',
    source_contract: sourceContractRecord,
    taxonomy_mapping: taxonomyMapping,
    ratio_dsl: ratio,
    nutrition,
    safety,
    cooker_boundary: {
      status: cookerStatus,
      preserved: cookerStatus !== 'direct_adaptation',
      appliance: recipe?.cooker_adaptation?.waterline?.appliance_model || null,
    },
    kitchen_observed: {
      status: 'pending',
      evidence_ids: [],
    },
    journey_coverage: {
      status: 'pending',
      journey_ids: [],
    },
    blocker_codes: [...new Set(blockerCodes)],
    blocker_labels: [...new Set(blockerCodes.map(code => BLOCKER_LABELS[code] || code))],
    next_action: [...new Set(blockerCodes.map(code => NEXT_ACTIONS[code]).filter(Boolean))].join(' '),
  };
}

export function buildSourceBackedFormalCandidateReview(catalog, taxonomy, ratioCatalog, formalRatioEvidence = null) {
  const recipes = asArray(catalog?.recipes);
  const shelf = buildShelfCatalog(catalog);
  const shelfById = new Map(shelf.records.map(record => [record.recipe_id, record]));
  const index = taxonomyIndex(taxonomy);
  const records = recipes.map(recipe => buildRecord(recipe, shelfById.get(recipe.recipe_id), index, ratioCatalog, formalRatioEvidence));
  const counts = {
    total: records.length,
    source_complete: records.filter(record => record.formal_candidate_status === 'source_complete_pending_formal').length,
    research_only: records.filter(record => record.formal_candidate_status === 'research_only').length,
    taxonomy: {
      closed: records.filter(record => record.taxonomy_mapping.status === 'closed').length,
      missing: records.filter(record => record.taxonomy_mapping.missing.length > 0).length,
    },
    ratio_dsl: {
      closed: records.filter(record => record.ratio_dsl.status === 'closed').length,
      source_bounded: records.filter(record => record.ratio_dsl.status === 'source_bounded').length,
      candidate_evidence_only: records.filter(record => record.ratio_dsl.status === 'candidate_evidence_only').length,
      unmapped: records.filter(record => record.ratio_dsl.status === 'unmapped').length,
    },
    nutrition: {
      closed: records.filter(record => record.nutrition.status === 'closed').length,
      partial_or_missing: records.filter(record => record.nutrition.status !== 'closed').length,
    },
    safety: {
      closed: records.filter(record => record.safety.status === 'closed').length,
      missing: records.filter(record => record.safety.status === 'missing').length,
      not_applicable: records.filter(record => record.safety.status === 'not_applicable').length,
    },
    cooker_boundary: {
      direct_adaptation: records.filter(record => record.cooker_boundary.status === 'direct_adaptation').length,
      source_limited: records.filter(record => record.cooker_boundary.status === 'source_limited').length,
      other: records.filter(record => !['direct_adaptation', 'source_limited'].includes(record.cooker_boundary.status)).length,
    },
    kitchen_observed: { complete: 0, pending: records.length },
    journey_coverage: { complete: 0, pending: records.length },
    formal_ready: records.filter(record => record.blocker_codes.length === 0).length,
  };
  return {
    schema_version: 1,
    review_version: REVIEW_VERSION,
    source_catalog_version: catalog?.catalog_version || null,
    taxonomy_version: taxonomy?.taxonomy_version || null,
    ratio_catalog_version: ratioCatalog?.ratio_catalog_version || null,
    formal_ratio_evidence_version: formalRatioEvidence?.evidence_version || null,
    scope: 'source-backed-formal-planner-candidate-review',
    policy: {
      no_estimated_value_is_promoted_to_source_contract: true,
      taxonomy_matches_are_exact_or_controlled_alias_only: true,
      controlled_small_use_seasonings_are_explicitly_excluded: true,
      ratio_dsl_requires_recipe_specific_compilation: true,
      kitchen_observation_and_journey_coverage_are_required: true,
    },
    counts,
    records,
  };
}

export function validateSourceBackedFormalCandidateReview(review, catalog, taxonomy, ratioCatalog, formalRatioEvidence = null) {
  const errors = [];
  if (!review || typeof review !== 'object' || Array.isArray(review)) return ['review must be an object'];
  if (review.schema_version !== 1) errors.push('review.schema_version must be 1');
  if (review.review_version !== REVIEW_VERSION) errors.push('review.review_version is invalid');
  if (review.scope !== 'source-backed-formal-planner-candidate-review') errors.push('review.scope is invalid');
  if (review.source_catalog_version !== catalog?.catalog_version) errors.push('review.source_catalog_version does not match source catalog');
  if (review.taxonomy_version !== taxonomy?.taxonomy_version) errors.push('review.taxonomy_version does not match taxonomy');
  if (review.ratio_catalog_version !== ratioCatalog?.ratio_catalog_version) errors.push('review.ratio_catalog_version does not match ratio catalog');
  if (review.formal_ratio_evidence_version !== (formalRatioEvidence?.evidence_version || null)) errors.push('review.formal_ratio_evidence_version does not match formal ratio evidence');
  const sourceIds = new Set(asArray(catalog?.recipes).map(recipe => recipe.recipe_id));
  const seen = new Set();
  for (const row of asArray(review.records)) {
    if (!row?.recipe_id) {
      errors.push('review row recipe_id is required');
      continue;
    }
    if (seen.has(row.recipe_id)) errors.push(`duplicate review recipe_id ${row.recipe_id}`);
    seen.add(row.recipe_id);
    if (!sourceIds.has(row.recipe_id)) errors.push(`${row.recipe_id} not found in source catalog`);
    if (!row.canonical_name) errors.push(`${row.recipe_id} canonical_name is required`);
    if (!['source_complete_pending_formal', 'research_only'].includes(row.formal_candidate_status)) errors.push(`${row.recipe_id} formal_candidate_status is invalid`);
    if (!Array.isArray(row.blocker_codes) || !row.blocker_codes.length) errors.push(`${row.recipe_id} blocker_codes must be non-empty until formally ready`);
    if (!Array.isArray(row.taxonomy_mapping?.matched)
      || !Array.isArray(row.taxonomy_mapping?.seasoning_ignored)
      || !Array.isArray(row.taxonomy_mapping?.missing)) errors.push(`${row.recipe_id} taxonomy mapping is incomplete`);
    if (!['unmapped', 'candidate_evidence_only', 'source_bounded', 'closed'].includes(row.ratio_dsl?.status)) errors.push(`${row.recipe_id} ratio_dsl status is invalid`);
    if (row.kitchen_observed?.status !== 'pending') errors.push(`${row.recipe_id} kitchen_observed must remain pending until evidence is added`);
    if (row.journey_coverage?.status !== 'pending') errors.push(`${row.recipe_id} journey_coverage must remain pending until evidence is added`);
  }
  const expected = buildSourceBackedFormalCandidateReview(catalog, taxonomy, ratioCatalog, formalRatioEvidence);
  if (JSON.stringify(review) !== JSON.stringify(expected)) errors.push('review does not match deterministic formal candidate build');
  if (review.records.length !== sourceIds.size) errors.push(`review records must cover every source recipe (${sourceIds.size})`);
  if (review.counts?.total !== sourceIds.size) errors.push(`review counts.total must be ${sourceIds.size}`);
  return errors;
}

export const sourceBackedFormalCandidateReviewVersion = REVIEW_VERSION;
