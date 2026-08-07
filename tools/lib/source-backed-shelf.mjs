const CONTRACT_FIELDS = [
  ['fixed_batch', '定量'],
  ['liquid_contract', '液体量'],
  ['time_contract', '总时长'],
  ['safety_endpoints', '安全终点'],
];

const ENDPOINT_NOTES = Object.freeze({
  cured_meat_fully_heated: '腊味：必须彻底加热后食用。',
  pork_fully_cooked: '猪肉：中心温度达到 74°C。',
  shellfish_fully_cooked: '贝类/甲壳类：肉质呈珍珠白或白色且不透明。',
  beef_fully_cooked: '牛肉：中心温度达到 71°C。',
  poultry_fully_cooked: '禽肉：中心温度达到 74°C。',
  seafood_fully_cooked: '鱼类及其他海鲜：中心温度达到 63°C。',
});

const RISK_RULES = Object.freeze([
  { pattern: /鸡(?!蛋)|鸭(?!蛋)|鹅|禽|鶏/u, expected: ['poultry_fully_cooked'], label: '禽肉或禽类食材' },
  { pattern: /猪肉|猪|排骨|腊肉|腊肠|肝肠|豚/u, expected: ['pork_fully_cooked', 'cured_meat_fully_heated'], label: '猪肉或腊味' },
  { pattern: /牛肉|牛腩|牛里脊|牛柳|牛排|牛薄|beef/iu, expected: ['beef_fully_cooked'], label: '牛肉' },
  { pattern: /虾|蝦|蟹|贝|貝|蛤|蚝|蠔|蚌/u, expected: ['shellfish_fully_cooked', 'seafood_fully_cooked'], label: '贝类、甲壳类或虾蟹' },
  { pattern: /鱼|魚|鳗|鰻|鲤|鯉|鲫|鯽|带鱼|鳕|海鲜|海鮮/u, expected: ['seafood_fully_cooked'], label: '鱼类或海鲜' },
  { pattern: /鸡蛋|鸭蛋|鹅蛋|蛋|卵/u, expected: null, label: '蛋类', advisory: '蛋类：加热至蛋液完全凝固。' },
]);

function hasFixedBatch(recipe) {
  return Boolean(recipe?.fixed_batch)
    && Array.isArray(recipe.fixed_batch.ingredients)
    && recipe.fixed_batch.ingredients.length > 0;
}

function hasSteps(recipe) {
  return Array.isArray(recipe?.cooking_sequence) && recipe.cooking_sequence.length > 0;
}

function missingContracts(recipe) {
  return CONTRACT_FIELDS
    .filter(([field]) => field === 'safety_endpoints'
      ? !Array.isArray(recipe?.[field]) || recipe[field].length === 0
      : !recipe?.[field])
    .map(([field]) => field);
}

function ingredientText(recipe) {
  return Array.isArray(recipe?.core_ingredients) ? recipe.core_ingredients.join('、') : '';
}

function safetyNotes(recipe) {
  const endpoints = Array.isArray(recipe?.safety_endpoints) ? recipe.safety_endpoints : [];
  const endpointCodes = new Set(endpoints.map(endpoint => endpoint?.code).filter(Boolean));
  const notes = [];

  for (const endpoint of endpoints) {
    if (!endpoint?.code) continue;
    const note = ENDPOINT_NOTES[endpoint.code];
    if (note) notes.push(note);
    else notes.push(`来源记录了安全终点：${endpoint.code}。`);
  }

  const ingredientNames = ingredientText(recipe);
  // 鱼露/鱼酱是调味料，不应被“鱼类/海鲜”规则当成整条鱼。
  const riskIngredientNames = ingredientNames.replace(/鱼露|魚露|鱼酱|魚醬/gu, '');
  for (const rule of RISK_RULES) {
    const matchedNames = rule.advisory ? ingredientNames : riskIngredientNames;
    if (!rule.pattern.test(matchedNames)) continue;
    if (rule.advisory) {
      notes.push(rule.advisory);
      continue;
    }
    const covered = rule.expected.some(code => endpointCodes.has(code));
    if (!covered) {
      notes.push(`注意：本条含${rule.label}，目录尚未记录对应的独立安全终点；仅供试做记录，不代表安全确认。`);
    }
  }

  return [...new Set(notes)];
}

export function classifySourceBackedRecipe(recipe) {
  const shelf = recipe?.status === 'executable'
    ? 'A'
    : (hasFixedBatch(recipe) && hasSteps(recipe) ? 'B' : 'C');
  const endpoints = Array.isArray(recipe?.safety_endpoints) ? recipe.safety_endpoints : [];
  return {
    ...recipe,
    shelf,
    shelf_label: shelf === 'A'
      ? 'A · 可照做（已签署）'
      : shelf === 'B'
        ? 'B · 试做架（来源有据，未经厨房验证）'
        : 'C · 档案室（只读资料）',
    missing_contracts: missingContracts(recipe),
    missing_contract_labels: missingContracts(recipe).map(field => shelfContractLabels[field]),
    safety_notes: safetyNotes(recipe),
    safety_source_ids: [...new Set(endpoints.flatMap(endpoint => Array.isArray(endpoint?.source_ids) ? endpoint.source_ids : []))],
  };
}

export function buildShelfCatalog(catalog) {
  const records = (Array.isArray(catalog?.recipes) ? catalog.recipes : []).map(classifySourceBackedRecipe);
  const summary = records.reduce((counts, record) => {
    counts[record.shelf] = (counts[record.shelf] || 0) + 1;
    return counts;
  }, { A: 0, B: 0, C: 0 });
  return {
    schema_version: 'source-backed-one-pot-shelf.v1',
    catalog_version: catalog?.catalog_version || null,
    generated_from: 'tools/data/source-backed-one-pot-recipes.v1.json',
    summary: {
      ...summary,
      trial_ready_total: summary.A + summary.B,
    },
    records,
  };
}

export const shelfContractLabels = Object.freeze(Object.fromEntries(CONTRACT_FIELDS));
