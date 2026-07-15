const NUTRIENT_KEYS = ['kcal', 'p', 'fb', 'mg', 'k', 'ca', 'fe', 'zn', 'na', 'vc', 'vd', 'w3'];
// 每 100g 合理上限(防模型把"整道菜总量"误当每100g, 乘 grams 后营养暴涨)
const NUTRIENT_MAX = { kcal: 900, p: 100, fb: 100, mg: 1200, k: 5000, ca: 1500, fe: 50, zn: 50, na: 40000, vc: 2000, vd: 50, w3: 60 };
const RATE_BUCKETS = new Map();

// ===== 菜谱库候选: 只做确定性查表与排序，不额外调用模型。=====
const RECIPE_CACHE = new WeakMap();
const RECIPE_FALLBACK_CACHE = new Map();
const RECIPE_GROUNDING_TOKEN_RE = /\{recipe_grounding\}/gi;

function sanitizePromptText(value, maxLength = 160) {
  return String(value ?? '')
    .replace(RECIPE_GROUNDING_TOKEN_RE, '')
    .replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function baseRecipeIngredient(name) {
  return String(name || '').toLowerCase()
    .replace(/过敏|不吃|忌口|不要/g, '')
    .replace(/（/g, '(').replace(/）/g, ')')
    .replace(/\(.*?\)/g, '').replace(/[\s_-]+/g, '')
    .replace(/丁$|片$|块$|丝$|末$|粒$/g, '');
}

function normalizeRecipeAliases(aliases) {
  const normalized = new Map();
  if (!aliases || typeof aliases !== 'object') return normalized;
  for (const [rawKey, rawValue] of Object.entries(aliases)) {
    const key = baseRecipeIngredient(rawKey);
    const value = baseRecipeIngredient(rawValue);
    if (key && value && !normalized.has(key)) normalized.set(key, value);
  }
  return normalized;
}

function resolveRecipeAlias(norm, aliases) {
  const path = [];
  const firstSeen = new Map();
  let current = norm;
  while (aliases.has(current)) {
    if (firstSeen.has(current)) {
      return path.slice(firstSeen.get(current)).sort()[0] || current;
    }
    firstSeen.set(current, path.length);
    path.push(current);
    current = aliases.get(current);
  }
  return current;
}

function canonicalRecipeIngredient(name, aliases = {}) {
  return resolveRecipeAlias(baseRecipeIngredient(name), normalizeRecipeAliases(aliases));
}

function recipeConstraintList(value) {
  if (Array.isArray(value)) return value.map(item => sanitizePromptText(item, 80)).filter(Boolean);
  if (typeof value === 'string') return value.replace(/[，、]/g, ',').split(',').map(item => sanitizePromptText(item, 80)).filter(Boolean);
  return [];
}

function sanitizeRecipeConstraints(value) {
  const input = value && typeof value === 'object' ? value : {};
  const recentIngredients = input.recent_ingredients && typeof input.recent_ingredients === 'object'
    ? {
      ...input.recent_ingredients,
      recent_proteins: recipeConstraintList(input.recent_ingredients.recent_proteins),
      recent_veggies: recipeConstraintList(input.recent_ingredients.recent_veggies),
      recent_carbs: recipeConstraintList(input.recent_ingredients.recent_carbs),
    }
    : input.recent_ingredients;
  return {
    ...input,
    diet: sanitizePromptText(input.diet, 20),
    purpose: sanitizePromptText(input.purpose, 20),
    pantry: recipeConstraintList(input.pantry),
    dislikes: recipeConstraintList(input.dislikes),
    recent_dishes: recipeConstraintList(input.recent_dishes),
    recent_families: recipeConstraintList(input.recent_families),
    recent_base_recipes: recipeConstraintList(input.recent_base_recipes),
    balance_low: recipeConstraintList(input.balance_low),
    swap_hint: sanitizePromptText(input.swap_hint, 160),
    feedback_hint: sanitizePromptText(input.feedback_hint, 160),
    recent_ingredients: recentIngredients,
  };
}

function selectRecipeCandidates(lib, constraints = {}) {
  const aliases = normalizeRecipeAliases(lib?.ingredient_aliases);
  const canonical = name => resolveRecipeAlias(baseRecipeIngredient(name), aliases);
  const pantry = recipeConstraintList(constraints.pantry);
  const dislikes = new Set(recipeConstraintList(constraints.dislikes)
    .map(canonical)
    .filter(Boolean));
  const recentFamilies = new Set(recipeConstraintList(constraints.recent_families));
  const recentRecipes = new Set(recipeConstraintList(constraints.recent_base_recipes));
  const familyById = new Map((Array.isArray(lib?.families) ? lib.families : [])
    .map(family => [family.id, family]));
  const candidates = [];

  for (const recipe of Array.isArray(lib?.recipes) ? lib.recipes : []) {
    const core = new Set((recipe.core_ingredients || [])
      .map(canonical)
      .filter(Boolean));
    const optional = new Set((recipe.optional_ingredients || [])
      .map(canonical)
      .filter(Boolean));
    const slots = Array.isArray(recipe.substitution_slots) ? recipe.substitution_slots : [];
    const allowed = new Set(slots.flatMap(slot => slot.allowed || [])
      .map(canonical)
      .filter(Boolean));

    const blockedCore = [...core].some(coreItem => {
      if (!dislikes.has(coreItem)) return false;
      return !slots.some(slot => {
        const replacesCore = (slot.replaces || [])
          .map(canonical)
          .includes(coreItem);
        if (!replacesCore) return false;
        return (slot.allowed || []).some(item => {
          const raw = String(item || '').trim();
          const substitute = canonical(raw);
          return substitute && substitute !== coreItem && !dislikes.has(substitute) && !/^不(?:放|加|用)/.test(raw);
        });
      });
    });
    if (blockedCore) continue;

    const discouraged = new Set((recipe.discouraged || [])
      .flatMap(rule => rule.ingredients || [])
      .map(canonical)
      .filter(Boolean));
    const usedPantry = [];
    const unusedPantry = [];
    let score = 0;

    for (const item of pantry) {
      const canonicalItem = canonical(item);
      if (!canonicalItem || dislikes.has(canonicalItem)) {
        unusedPantry.push(item);
        continue;
      }
      if (core.has(canonicalItem)) {
        score += 12;
        usedPantry.push(item);
      } else if (allowed.has(canonicalItem) || optional.has(canonicalItem)) {
        score += 5;
        usedPantry.push(item);
      } else {
        unusedPantry.push(item);
      }
      if (discouraged.has(canonicalItem)) score -= 8;
    }

    if ((recipe.purposes || []).includes(String(constraints.purpose || ''))) score += 3;
    if (recentFamilies.has(recipe.family_id)) score -= 20;
    if (recentRecipes.has(recipe.id)) score -= 100;
    candidates.push({
      recipe,
      family: familyById.get(recipe.family_id),
      ingredientAliases: lib?.ingredient_aliases || {},
      score,
      usedPantry,
      unusedPantry,
    });
  }

  candidates.sort((a, b) => b.score - a.score || String(a.recipe.id).localeCompare(String(b.recipe.id)));
  const selected = [];
  const selectedIds = new Set();
  const selectedFamilies = new Set();
  for (const candidate of candidates) {
    if (selectedIds.has(candidate.recipe.id) || selectedFamilies.has(candidate.recipe.family_id)) continue;
    selected.push(candidate);
    selectedIds.add(candidate.recipe.id);
    selectedFamilies.add(candidate.recipe.family_id);
    if (selected.length === 3) return selected;
  }
  for (const candidate of candidates) {
    if (selectedIds.has(candidate.recipe.id)) continue;
    selected.push(candidate);
    selectedIds.add(candidate.recipe.id);
    if (selected.length === 3) break;
  }
  return selected;
}

function compactRecipeList(value, fallback = '无') {
  const items = Array.isArray(value) ? value.map(item => sanitizePromptText(item, 240)).filter(Boolean) : [];
  return items.length ? items.join('、') : fallback;
}

function buildRecipeGrounding(selection) {
  const recipe = selection?.recipe && typeof selection.recipe === 'object' ? selection.recipe : {};
  const family = selection?.family && typeof selection.family === 'object' ? selection.family : {};
  const slots = (Array.isArray(recipe.substitution_slots) ? recipe.substitution_slots : [])
    .map(slot => `${sanitizePromptText(slot?.slot || '替换位', 80)}[${compactRecipeList(slot?.replaces)}→${compactRecipeList(slot?.allowed)}]`);
  const discouraged = (Array.isArray(recipe.discouraged) ? recipe.discouraged : [])
    .map(rule => `${compactRecipeList(rule?.ingredients)}(${sanitizePromptText(rule?.reason || '不适合基础结构', 240)})`);
  return [
    '【可信基础菜谱】',
    `菜谱家族: ${sanitizePromptText(family.id || recipe.family_id || 'unknown', 100)} ${sanitizePromptText(family.name, 100)}`.trim(),
    `基础菜谱: ${sanitizePromptText(recipe.id || 'unknown', 100)} ${sanitizePromptText(recipe.name, 100)}`.trim(),
    `固定核心: ${compactRecipeList(recipe.core_ingredients)}`,
    `只允许以下替换: ${compactRecipeList(slots)}`,
    `不鼓励: ${compactRecipeList(discouraged)}`,
    `关键技法: ${compactRecipeList(recipe.technique)}`,
    `比例规则: ${compactRecipeList(recipe.ratio_rules)}`,
    `安全规则: ${compactRecipeList(recipe.safety_rules)}`,
    `已选库存: ${compactRecipeList(selection?.usedPantry)}`,
    `舍弃库存: ${compactRecipeList(selection?.unusedPantry)}`,
    '【输出完整性契约】',
    '除获准免提的小用量香辛料外，每个 ingredients[].name 必须至少在一个 steps[] 步骤中出现；优先逐字使用食材表名称。若做法改变形态，同一步必须同时写原名和形态，例如“鸡胸肉切成鸡丝”“大蒜切成蒜末”。',
    `服务器已选库存（${compactRecipeList(selection?.usedPantry)}）必须同时出现在 ingredients 与 steps；服务器舍弃库存（${compactRecipeList(selection?.unusedPantry)}）必须同时从 ingredients 与 steps 排除。`,
    '生的禽肉、猪肉、海鲜和普通鸡蛋必须在相关食材所在步骤写明安全熟制终点，只可用“熟透”“中心不见粉红”“煮熟”“炒熟”“煎熟”“焖熟”“炖熟”或“蒸熟”等明确词；对鸡肉，“表面变色”、只有时长或仅“米熟”均不算。',
    '全程只用一口烹饪容器，不得另起或使用其他锅、平底锅。',
    '返回 JSON 前逐项自查以上跨字段契约；JSON 外不要输出任何文字。',
    '不合适的库存食材不要使用；why可笼统写“有库存不适合”，但不得重复或点名任何舍弃食材。',
    '你必须以这张基础菜谱为底稿，只能在允许替换列表内改动。库存食材不合适时必须舍弃，不得为了全用而改变菜谱结构。来源字段由服务器添加，你不要编造来源。',
  ].join('\n');
}

function validationIngredientNames(meal) {
  if (!Array.isArray(meal?.ingredients)) return [];
  return meal.ingredients.map(item => {
    if (typeof item === 'string') return item.trim();
    if (!item || typeof item !== 'object') return '';
    return String(item.name || '').trim();
  }).filter(Boolean);
}

function validationSteps(meal) {
  if (!Array.isArray(meal?.steps)) return [];
  return meal.steps.map(step => typeof step === 'string' ? step.trim() : '').filter(Boolean);
}

function validationSeasoning(name) {
  const norm = String(name || '').replace(/\s+/g, '');
  return /^(?:生?姜(?:末|片|丝)?|[大小香]?葱(?:花|段|末)?|蒜(?:头|末|蓉|泥|片)?|(?:白|陈|香|米|果)?醋|料酒|.*香料)$/.test(norm);
}

function validationFormName(name) {
  return String(name || '').toLowerCase()
    .replace(/（/g, '(').replace(/）/g, ')')
    .replace(/[\s_-]+/g, '');
}

const VALIDATION_CANONICAL_FORMS = new Map([
  ['鸡腿肉去骨', '鸡腿肉'],
  ['白蘑菇', '蘑菇'],
  ['干黑眼豆', '黑眼豆'],
  ['红甜椒', '甜椒'],
]);

function validationCanonicalIngredient(name, aliases) {
  const bare = validationFormName(name).replace(/\(.*?\)/g, '');
  return canonicalRecipeIngredient(VALIDATION_CANONICAL_FORMS.get(bare) || name, aliases);
}

const VALIDATION_COOKING_OIL_NAMES = new Set([
  '烹调油', '植物油', '食用油', '食用植物油', '蔬菜油', '菜籽油', '花生油', '大豆油', '玉米油',
  '橄榄油', '葵花籽油', '葵花油', '米糠油', '稻米油', '色拉油', '调和油', '芝麻油', '香油', '猪油', '牛油', '黄油',
  '椰子油', '棕榈油', '葡萄籽油', '亚麻籽油',
]);
const VALIDATION_COOKING_OIL_ACTION_RE = new RegExp(
  `(?:热油(?!菜)|(?:加入?|下|倒入?|放入?|淋入?|刷上?|抹上?|(?<!食)用|留底)(?:少许|适量|一点|些许)?(?:${[...VALIDATION_COOKING_OIL_NAMES].sort((a, b) => b.length - a.length).join('|')}|油)(?!菜))`,
);
const VALIDATION_GENERIC_COOKING_OIL_ACTION_RE = /(?:热油(?!菜)|(?:加入?|下|倒入?|放入?|淋入?|刷上?|抹上?|(?<!食)用|留底)(?:少许|适量|一点|些许)?油(?!菜))/;
const VALIDATION_ACTION_NEGATION_RE = /(?:不需要|无需|不用|不要|避免|禁止|切勿|不可|未|不)(?:(?:再|另行)?(?:另(?:起|取|用)(?:一口|一只|一个|一)?|使用|用|加|放|下|倒入?|刷上?|抹上?|留底)?)?$/;
const VALIDATION_EXPLICIT_SECOND_VESSEL_RE = /(?:另(?:起|取|用)(?:一口|一只|一个|一)?|另一口|第二口)(?:炒锅|平底锅|汤锅|锅)/;

function validationActionNegated(text, actionIndex) {
  const prefix = String(text || '').slice(Math.max(0, actionIndex - 18), actionIndex);
  return VALIDATION_ACTION_NEGATION_RE.test(prefix);
}

function validationActiveActionMatches(text, pattern) {
  const matches = [];
  const re = new RegExp(pattern.source, 'g');
  for (const match of String(text || '').matchAll(re)) {
    if (!validationActionNegated(text, match.index)) matches.push(match);
  }
  return matches;
}

function validationControlledTokens(name) {
  const normalized = validationFormName(name);
  const bare = normalized.replace(/\(.*?\)/g, '');
  if (bare === '鸡胸肉') {
    return ['鸡肉', '鸡丝', '鸡丁', '鸡块', '鸡片'];
  }
  if (['去骨鸡腿肉', '鸡腿肉', '鸡腿肉去骨'].includes(bare)) {
    return ['鸡腿肉', '鸡肉', '鸡丝', '鸡丁', '鸡块', '鸡片'];
  }
  if (['猪瘦肉', '瘦猪肉'].includes(bare)) return ['猪肉', '瘦肉', '里脊', '肉丝', '肉丁', '肉片', '肉块'];
  if (bare === '大米') return ['米饭', '米'];
  if (bare === '大蒜') return ['蒜蓉', '蒜末', '蒜'];
  if (VALIDATION_COOKING_OIL_NAMES.has(bare)) return ['油'];
  if (bare.includes('白芸豆') && /(?:罐头|罐装|沥干)/.test(normalized)) return ['白芸豆'];
  if (bare.includes('白豆') && /(?:罐头|罐装|沥干)/.test(normalized)) return ['白豆'];
  return [];
}

function validationPreparedHighRiskExemption(name) {
  return /^(?:鸡高汤|高汤\(鸡高汤\)|浓缩鸡汤|皮蛋)$/.test(validationFormName(name));
}

function validationCookingOilIngredient(name) {
  const bare = validationFormName(name).replace(/\(.*?\)/g, '');
  return VALIDATION_COOKING_OIL_NAMES.has(bare);
}

function validationStepUsesCookingOil(step) {
  const text = validationFormName(step);
  return validationActiveActionMatches(text, VALIDATION_COOKING_OIL_ACTION_RE).length > 0;
}

function validationSearchTokens(name, aliases) {
  const canonical = validationCanonicalIngredient(name, aliases);
  const targetBare = validationFormName(name).replace(/\(.*?\)/g, '');
  const tokens = new Set([baseRecipeIngredient(name), canonical, ...validationControlledTokens(name)].filter(Boolean));
  if (aliases && typeof aliases === 'object') {
    for (const alias of Object.keys(aliases)) {
      const aliasToken = baseRecipeIngredient(alias);
      const conflictingPepperColor = targetBare === '红甜椒' && /^(?:青椒|[黄绿橙]甜椒)$/.test(aliasToken);
      if (!conflictingPepperColor && validationCanonicalIngredient(alias, aliases) === canonical) tokens.add(aliasToken);
    }
  }
  if (tokens.has('鸡蛋')) tokens.add('蛋液');
  if (tokens.has('蛋液')) tokens.add('鸡蛋');
  return [...tokens].filter(Boolean).sort((a, b) => b.length - a.length);
}

function validationTokenPositions(text, token) {
  const positions = [];
  const activeOilPositions = token === '油' ? new Set(validationActiveActionMatches(text, VALIDATION_GENERIC_COOKING_OIL_ACTION_RE)
    .map(match => match.index + match[0].lastIndexOf('油'))) : null;
  let offset = 0;
  while (offset <= text.length - token.length) {
    const index = text.indexOf(token, offset);
    if (index < 0) break;
    const prefix = text.slice(Math.max(0, index - 10), index);
    const negated = /(?:不加|不放|不用|不使用|未加|未放|无|免加|无需)(?:任何|额外|一点|少许)?$/.test(prefix);
    const blockedShortForm = (token === '米' || token === '米饭') && /[玉小]/.test(text[index - 1] || '');
    const blockedGarlicGreen = token === '蒜' && /^(?:苗|苔|薹)/.test(text.slice(index + token.length));
    const blockedChickenSpecies = ['鸡腿肉去骨', '鸡腿肉', '鸡肉', '鸡丝', '鸡丁', '鸡块', '鸡片'].includes(token)
      && text[index - 1] === '火';
    const blockedGenericMeatForm = VALIDATION_GENERIC_MEAT_FORMS.has(token)
      && !validationGenericMeatFormAllowed(text, index);
    const blockedPorkSpecies = ['猪肉', '瘦肉', '里脊'].includes(token)
      && /[牛羊鸡鸭鹅鱼]/.test(text[index - 1] || '');
    const blockedCookingOil = token === '油' && !activeOilPositions.has(index);
    const tokenSuffix = text.slice(index + token.length);
    const tokenPrefix = text[index - 1] || '';
    const blockedControlledForm = (['白蘑菇', '干黑眼豆', '红甜椒', '蘑菇', '黑眼豆', '甜椒'].includes(token)
      && /^(?:酱|粉|汤料)/.test(tokenSuffix))
      || (token === '蘑菇' && /[白毒]/.test(tokenPrefix))
      || (token === '黑眼豆' && tokenPrefix === '干')
      || (token === '甜椒' && /[红青黄绿橙]/.test(tokenPrefix));
    if (!negated && !blockedShortForm && !blockedGarlicGreen && !blockedChickenSpecies && !blockedGenericMeatForm
      && !blockedPorkSpecies && !blockedCookingOil && !blockedControlledForm) positions.push(index);
    offset = index + token.length;
  }
  return positions;
}

function validationTokenMentioned(text, token) {
  return validationTokenPositions(text, token).length > 0;
}

function validationStepMentions(step, name, aliases) {
  const text = String(step || '').toLowerCase().replace(/（/g, '(').replace(/）/g, ')').replace(/[\s_-]+/g, '');
  return validationSearchTokens(name, aliases).some(token => validationTokenMentioned(text, token));
}

const VALIDATION_COOKED_RE = /(?:中心(?:不见|无)粉红色?|煮沸|煮熟|煎熟|炒熟|焖熟|炖熟|蒸熟|烧开|熟透|熟)/;
const VALIDATION_COOKED_NEGATION_RE = /(?:并非|不是|尚未|还未|还没|未|没有|没能|不能|无法)(?:已经|已|完全|真正|实际)*(?:达到|达|确认|保证)?$/;
const VALIDATION_UNHEATED_RELATION_RE = /(?:备用|放一旁|最后拌入|出锅后加入|盛出后加入|装盘后加入)/;
const VALIDATION_DELAYED_ADD_RE = /(?:后加入|后放入|后拌入|再加入|再放入|再拌入)$/;
const VALIDATION_FUTURE_COOKING_SUFFIX_RE = /^(?:需(?:要)?后续|稍后|待会(?:儿)?|之后再|后续再?|随后再)/;
const VALIDATION_FUTURE_COOKING_MARKER_RE = /(?:需(?:要)?后续|稍后|待会(?:儿)?|之后再|后续再?|随后再|(?:未来|将来)(?:应|要|会|将|需)?)/;
const VALIDATION_GENERIC_MEAT_FORMS = new Set(['肉丝', '肉丁', '肉片', '肉块']);
const VALIDATION_GENERIC_MEAT_BOUNDARY_RE = /(?:切成|切为|改刀成|将|把|放入|加入|下入|倒入|取|成)$/;

function validationGenericMeatFormAllowed(text, index) {
  if (index === 0) return true;
  const prefix = text.slice(0, index);
  const clausePrefix = prefix.slice(Math.max(
    prefix.lastIndexOf('，'), prefix.lastIndexOf(','), prefix.lastIndexOf('。'), prefix.lastIndexOf('；'),
    prefix.lastIndexOf(';'), prefix.lastIndexOf('！'), prefix.lastIndexOf('!'), prefix.lastIndexOf('？'), prefix.lastIndexOf('?'),
  ) + 1);
  if (!clausePrefix) return true;
  const boundary = clausePrefix.match(VALIDATION_GENERIC_MEAT_BOUNDARY_RE);
  if (!boundary) return false;
  const sourcePrefix = clausePrefix.slice(0, boundary.index);
  for (const source of sourcePrefix.matchAll(/[\u3400-\u9fff]肉/g)) {
    const throughSource = sourcePrefix.slice(0, source.index + source[0].length);
    if (!/(?:猪瘦肉|瘦猪肉|猪肉|瘦肉)$/.test(throughSource)) return false;
  }
  return true;
}

function validationClauseCooksTarget(clause, name, aliases) {
  const text = String(clause || '').toLowerCase().replace(/（/g, '(').replace(/）/g, ')').replace(/[\s_-]+/g, '');
  const targetPositions = validationSearchTokens(name, aliases)
    .flatMap(token => validationTokenPositions(text, token));
  const unheatedRelation = text.match(VALIDATION_UNHEATED_RELATION_RE);
  const cookedRe = new RegExp(VALIDATION_COOKED_RE.source, 'g');
  for (const cooked of text.matchAll(cookedRe)) {
    const cookedEnd = cooked.index + cooked[0].length;
    const cookedPrefix = text.slice(0, cooked.index);
    const futurePrefix = cookedPrefix;
    const futureSuffix = text.slice(cookedEnd, cookedEnd + 10);
    if (VALIDATION_FUTURE_COOKING_MARKER_RE.test(futurePrefix)
      || VALIDATION_FUTURE_COOKING_SUFFIX_RE.test(futureSuffix)) continue;
    if (VALIDATION_COOKED_NEGATION_RE.test(cookedPrefix)) continue;
    if (unheatedRelation && unheatedRelation.index <= cooked.index) continue;
    const targetIsRice = validationSearchTokens(name, aliases).some(token => token === '大米' || token === '米饭' || token === '米');
    if (!targetIsRice && /(?:大米|米饭|米|饭)(?:(?:完全|彻底|全部|基本|已经|已))*$/.test(cookedPrefix)) continue;
    const belongsToEarlierIngredient = targetPositions.some(targetIndex => (
      targetIndex >= cookedEnd
      && VALIDATION_DELAYED_ADD_RE.test(text.slice(cookedEnd, targetIndex))
    ));
    if (!belongsToEarlierIngredient) return true;
  }
  return false;
}

function validationHighRiskCooked(name, steps, aliases, ingredientNames) {
  const target = validationCanonicalIngredient(name, aliases);
  const otherIngredients = ingredientNames.filter(other => validationCanonicalIngredient(other, aliases) !== target);
  for (const step of steps) {
    const clauses = String(step).split(/[，,。；;！？!?]+/).map(clause => clause.trim()).filter(Boolean);
    for (let index = 0; index < clauses.length; index++) {
      const clause = clauses[index];
      if (!validationStepMentions(clause, name, aliases)) continue;
      if (validationClauseCooksTarget(clause, name, aliases)) return true;
      if (VALIDATION_UNHEATED_RELATION_RE.test(clause)) continue;
      const next = clauses[index + 1] || '';
      const nextNamesAnotherIngredient = otherIngredients.some(other => validationStepMentions(next, other, aliases));
      if (next && !nextNamesAnotherIngredient
        && validationClauseCooksTarget(next, name, aliases)) return true;
    }
  }
  return false;
}

function validateGroundedMeal(meal, selection, constraints = {}) {
  const aliases = selection?.ingredientAliases || {};
  const ingredientNames = validationIngredientNames(meal);
  const steps = validationSteps(meal);
  const flags = new Set();
  const canonicalIngredients = new Set(ingredientNames.map(name => validationCanonicalIngredient(name, aliases)).filter(Boolean));
  const dislikes = recipeConstraintList(constraints?.dislikes)
    .map(name => validationCanonicalIngredient(name, aliases))
    .filter(Boolean);

  for (const name of ingredientNames) {
    const canonical = validationCanonicalIngredient(name, aliases);
    if (dislikes.includes(canonical)) flags.add(`allergen_present:${name}`);
    if (!validationSeasoning(name) && !steps.some(step => validationStepMentions(step, name, aliases))) {
      flags.add(`ingredient_missing_in_steps:${name}`);
    }
    if (!validationPreparedHighRiskExemption(name) && /(?:禽|鸡|鸭|猪|虾|蟹|贝|鱼|蛋)/.test(`${name}${canonical}`)) {
      const cooked = validationHighRiskCooked(name, steps, aliases, ingredientNames);
      if (!cooked) flags.add(`high_risk_not_cooked:${name}`);
    }
  }
  if (!ingredientNames.some(validationCookingOilIngredient) && steps.some(validationStepUsesCookingOil)) {
    flags.add('step_ingredient_missing:烹调油');
  }

  for (const item of Array.isArray(selection?.usedPantry) ? selection.usedPantry : []) {
    const canonical = validationCanonicalIngredient(item, aliases);
    if (canonical && !canonicalIngredients.has(canonical)) flags.add(`used_pantry_missing:${item}`);
  }
  for (const item of Array.isArray(selection?.unusedPantry) ? selection.unusedPantry : []) {
    const canonical = validationCanonicalIngredient(item, aliases);
    if (canonical && canonicalIngredients.has(canonical)) flags.add(`unused_pantry_used:${item}`);
  }

  const anchors = new Set([
    ...(Array.isArray(selection?.recipe?.core_ingredients) ? selection.recipe.core_ingredients : []),
    ...(Array.isArray(selection?.usedPantry) ? selection.usedPantry : []),
  ].map(item => validationCanonicalIngredient(item, aliases)).filter(Boolean));
  const requiredAnchorHits = Math.min(2, anchors.size);
  const anchorHits = [...anchors].filter(anchor => canonicalIngredients.has(anchor)).length;
  if (anchorHits < requiredAnchorHits) flags.add('base_recipe_anchor_missing');
  const namedVessels = new Set();
  for (const step of steps) {
    const clauses = String(step).replace(/\s+/g, '').split(/[，,。；;！！？?]+/).filter(Boolean);
    for (const clause of clauses) {
      const vessels = [...clause.matchAll(/(?:电饭锅|炒锅|平底锅|汤锅)/g)];
      if (vessels.length > 1 && /(?:或|或者|任选|二选一)/.test(clause)) continue;
      for (const vessel of vessels) {
        if (validationActionNegated(clause, vessel.index)) continue;
        namedVessels.add(vessel[0]);
      }
    }
  }
  if (steps.some(step => validationActiveActionMatches(step.replace(/\s+/g, ''), VALIDATION_EXPLICIT_SECOND_VESSEL_RE).length > 0)
    || namedVessels.size > 1) {
    flags.add('multi_pot_step');
  }
  return [...flags];
}

async function getRecipeLib(env, request) {
  const assets = env?.ASSETS;
  if (!assets || typeof assets.fetch !== 'function') throw new Error('recipe_library_unavailable');
  const isWeakKey = (typeof assets === 'object' && assets !== null) || typeof assets === 'function';
  const cache = isWeakKey ? RECIPE_CACHE : RECIPE_FALLBACK_CACHE;
  if (cache.has(assets)) return cache.get(assets);
  const url = new URL('/recipe-library.json', request.url);
  const response = await assets.fetch(new Request(url.toString()));
  if (!response?.ok) throw new Error('recipe_library_unavailable');
  const lib = await response.json();
  if (!Array.isArray(lib.recipes) || !lib.recipes.length) throw new Error('recipe_library_empty');
  cache.set(assets, lib);
  return lib;
}

// ===== 第二层兜底: 台湾食药署食品营养成分库(权威, OGDL-Taiwan-1.0)。模型生成的食材做高置信匹配, 命中即覆盖为权威值。=====
let TW_CACHE = null;
function twNorm(s) { return String(s || '').toLowerCase().replace(/（/g, '(').replace(/）/g, ')').replace(/\s+/g, ''); }
function twBase(s) { return twNorm(s).replace(/\(.*$/, ''); }
async function getTwLib(env, request) {
  if (TW_CACHE) return TW_CACHE;
  TW_CACHE = { idx: new Map(), size: 0 };
  try {
    if (!env.ASSETS) return TW_CACHE;
    const u = new URL('/foods-tw.json', request.url);
    const r = await env.ASSETS.fetch(new Request(u.toString()));
    if (r && r.ok) {
      const arr = await r.json();
      for (const rec of arr) {
        if (rec.n) { const k = twNorm(rec.n); if (!TW_CACHE.idx.has(k)) TW_CACHE.idx.set(k, rec); }
        if (rec.a) for (const a of String(rec.a).split(/[,;、，]/)) { const t = twNorm(a); if (t && !TW_CACHE.idx.has(t)) TW_CACHE.idx.set(t, rec); }
      }
      TW_CACHE.size = arr.length;
    }
  } catch (_e) { /* 库不可用则跳过, 不影响生成 */ }
  return TW_CACHE;
}
function twLookup(lib, name) {
  const q = twNorm(name); if (!q || !lib.idx.size) return null;
  let h = lib.idx.get(q); if (h) return h;                 // 1. 全名精确
  const qb = twBase(name);                                 // 2. 去括号基名精确(且库项基名也相等)
  if (qb.length >= 2) { h = lib.idx.get(qb); if (h && twBase(h.n) === qb) return h; }
  return null;
}
// 调味料集合: 这些即使台湾库命中也不覆盖(其高钠权威值不应计入营养, 与前端 isSeasoning 归零一致)
const TW_SEASONING = new Set(['盐','食盐','酱油','生抽','老抽','蒸鱼豉油','蚝油','料酒','黄酒','米酒','醋','白醋','陈醋','香醋','米醋','姜','生姜','姜末','姜片','姜丝','葱','葱花','香葱','小葱','大葱','蒜','蒜末','蒜蓉','蒜泥','蒜头','咖喱粉','五香粉','十三香','胡椒粉','白胡椒','黑胡椒','胡椒','辣椒粉','干辣椒','花椒','八角','桂皮','香叶','孜然','糖','白糖','冰糖','红糖','味精','鸡精','淀粉','生粉','玉米淀粉','水淀粉','香油','芝麻油','豆瓣酱','郫县豆瓣','番茄酱','鱼露','咖喱酱','油','食用油','色拉油','调和油']);
function twIsSeasoning(name) { return TW_SEASONING.has(twNorm(name)) || TW_SEASONING.has(twBase(name)); }
async function enrichWithTw(meal, env, request) {
  const lib = await getTwLib(env, request);
  if (!lib.idx.size) return meal;
  let matched = 0;
  for (const ing of meal.ingredients) {
    if (twIsSeasoning(ing.name)) continue; // 调味料不覆盖: 避免酱油/蚝油/味精的高钠权威值漏进营养
    const hit = twLookup(lib, ing.name);
    if (!hit) continue;
    for (const key of NUTRIENT_KEYS) if (hit[key] != null) ing[key] = hit[key];
    ing.auth = 'tw'; ing.authCode = hit.code; matched++;
  }
  meal._twMatched = matched;
  return meal;
}

const RECIPE_SYSTEM = `你是家常菜专家+营养师, 熟悉《中国居民膳食指南(2022)》。
你的任务: 生成一道【一日量】的简单家常单品(一锅/一碗即可吃完, 可分 1-2 顿), 一份基本覆盖全天营养主结构(主食+蛋白+多种蔬菜)。
核心要求:
- 菜品形式和菜系都要轮换, 别每次都是中式菜饭。形式换着来: 菜饭/煲仔饭/焖饭、盖浇饭、日式丼饭、石锅拌饭、汤面/汤粉/汤米线、一锅炖菜/烩菜/杂烩汤、家庭一锅煮/麻辣烫式、杂粮谷物碗、咖喱烩饭、印尼炒饭式炒饭、泰式椰浆咖喱烩饭、越式/中式凉拌碗(grain bowl)等。
- 菜系也轮换: 中式家常/泰式/日式/韩式/越南/印尼/粤式 之间换着来——任何国家"一锅或一碗装、多食材、家庭可做"的主餐都符合一锅出。异国成品复合酱(绿咖喱酱/叻沙酱/甜酱油等)钠和热量不可忽略, 一律限1.5勺、其营养标 est 不当权威值现编; 能用"酱油+糖"等基础调味料替代的就替代。
- 排除真火锅, 以及需要特殊高汤/长时间备料/复杂火候的版本。
- 一锅煮 OR 电饭锅 OR 简单炒制 OR 蒸 OR 出锅后凉拌(冷制碗); 烹饪要简单可行。
- 硬约束: 总时长 <= 40 分钟, 做法 <= 4 步, 难度 <= 2; 优先电饭锅/一锅出, 不要另起锅做第二道菜。
- 营养尽量贴近全天目标; 蛋白/纤维/钙优先; 不要奇葩组合。
- **热量硬要求(落实到克数)**: 整锅总热量须达到目标的85%以上。具体: 主食给足(熟饭/熟面/熟杂粮合计≥400g, 或生米生面≥180g, 或薯类≥500g), 蛋白食材(肉/鱼/蛋/豆制品)合计≥250g, 烹调油8-15g。常见错误是只给一锅蔬菜的热量(约800kcal)——那只有目标一半, 不合格。
- **不得依赖提前准备**: 步骤里禁止出现「提前煮好/提前过夜」; 主食要么把烹煮时间计入总时长, 要么明确写用剩饭或免煮快熟主食(如燕麦/快煮杂粮包)。
- **主蛋白必须轮换**: 在 鱼/虾/鸡/鸭/猪/牛/蛋/豆制品 之间换着来, 不要连续几次或总是同一种, **尤其不要默认三文鱼**; 一道菜主蛋白选 1-2 种即可。
- 食材至少 8-10 种, 含主食 + 蛋白 + 3-5 种不同颜色/类型的蔬菜。
- 蔬菜总量尽量 >= 300g, 含绿叶菜、浅色蔬菜、根茎、菌菇、豆荚等不同类型。
- 一道菜总重 800-1500g, 用户可分 1-2 顿吃。
【冷拌/发酵碗(低频形式, 夏季或换口味时偶尔出, 约每5-6次一次)】
- 冷碗热量天生比热菜低, 但绝不能是"一碗菜叶"(≈800kcal=不合格)。靠三件套把它做成一份扎实正餐: ①熟主食≥400g(现成糙米饭/快煮杂粮包/燕麦/熟荞麦面, 偏轻就加到500g, 干米粉/干面≥120g); ②蛋白≥250g; ③必加一个高热量载体——牛油果半个 或 花生酱/芝麻酱约30g 或 坚果30g, 至少选一样; 主蛋白偏瘦(虾仁/鸡胸)时这条尤其不能省。沙拉汁里的油计入总油8-15g。
- 热量尽量堆高(靠加主食/牛油果/坚果, 绝不靠加蔬菜); 但即便达不到全天目标也别虚标营养值充数——按真实份量如实给, app 会如实提示"比一天目标略少"。
- 发酵碗(区别于普通沙拉)须含一样发酵食材(辣白菜/纳豆/酸奶/豆豉)作特色; 发酵益生菌食材必须"出锅后/装碗最后一步"拌入, 不得下锅加热(否则活菌失活)。
- 钠平衡: 用了发酵高钠食材(辣白菜≤120g/豆豉≤15g)时, 额外盐归零、不再加酱油, 用柠檬汁/醋/香料提味; note 里提示"含发酵食材钠偏高, 额外盐请减半或不加"。
- 凉拌也禁止"提前煮好/过夜", 主食烹煮时间计入总时长或用剩饭/免煮快熟主食。
严格 JSON 输出, 不要 JSON 外文字。`;

const RECIPE_TEMPLATE = `生成一道【{meal_name}】一日量的简单家常单品(一锅/一碗式, 形式见系统提示、别总是菜饭), 用户全天营养目标约: 热量{kcal}kcal/蛋白{p}g/纤维{fb}g/钙{ca}mg。(整锅总热量须≥目标的85%)
{constraint_note}{exclude_note}
{season_note}

【强制】食材至少 8 种, 蔬菜至少 3-4 种不同颜色/类型(绿叶/根茎/菌菇/豆荚轮换)。

{recipe_grounding}

返回 JSON:
{
  "dish_name": "菜名(具体, 如「腊肠菜心菜饭」)",
  "ingredients": [
    {"name": "食材名", "grams": 数值, "kcal":数值, "p":数值, "fb":数值, "mg":数值, "k":数值, "ca":数值, "fe":数值, "zn":数值, "na":数值, "vc":数值, "vd":数值, "w3":数值}
  ],
  "steps": ["步骤1", "步骤2", "步骤3"],
  "note": "<30字 这道菜的特色或营养亮点",
  "flavor_tags": ["咸鲜", "微甜", "清爽"],
  "prep_minutes": 35,
  "difficulty": 1,
  "taste_preview": "<40-70字 美食家口吻, 描述入口和余韵的具体口感, 帮用户决定要不要做>",
  "form": "形式(焖饭/盖浇饭/丼饭/汤面/拌饭/一锅炖/grain bowl/凉拌碗等)",
  "why": "<一句温和的「今天为什么适合你」, 可提到用上的食材/本周鱼/想吃的口味; 别说教别堆数据>",
  "has_fish": true,
  "veg_count": 4
}

字段要求:
- flavor_tags: 3-5 个 2-3 字口味标签, 必须诚实。
- prep_minutes: 整数, 从洗菜到出锅的总时长, 目标 <=40, 上限 45。
- difficulty: 1=新手可做, 2=中等; 不要出 3。
- taste_preview: 一句话, 入口口感 -> 中段 -> 余韵, 别空泛, 别全好评。

营养数值契约:
- 每个 ingredient 的 kcal/p/fb/mg/k/ca/fe/zn/na/vc/vd/w3 都是【每 100 克可食部分】的数值, 不是该食材在菜里的总量。
- grams 是该食材在这道菜里用的克数。
- 客户端会用 grams/100 × 营养值计算贡献。
- 营养值取食物成分表标准值, 别按 grams 乘出来。
- 单位: kcal=热量, p=蛋白g, fb=纤维g, mg=镁mg, k=钾mg, ca=钙mg, fe=铁mg, zn=锌mg, na=钠mg, vc=维C mg, vd=维D μg, w3=Omega-3 g。

【最终提交自检】
1. 双向一致：steps提到的每种投入物（尤其食用油、盐、胡椒、淀粉、酱料）必须在ingredients中有同名行和grams；ingredients中除获准小量香辛料外，每个name必须在steps逐字出现。已选库存同时出现在ingredients与steps；未用库存名称不得出现在ingredients、steps或why；why可笼统写“有库存不适合”，但不得点名舍弃食材。
2. 安全终点：每种生禽肉、猪肉、海鲜、普通鸡蛋都必须在含该ingredient原名的步骤写已达到的熟制终点；“表面变色”、只写时长或仅“米熟”不算。普通鸡蛋须写“鸡蛋熟透，蛋白和蛋黄完全凝固，不得流心”；只写蛋白凝固不算。
3. 一锅限时：全程只用一口烹饪容器；禁止提前、过夜或隐藏预处理。主食必须在steps中完成烹煮，或ingredient名明确写剩饭/即食；所有用时计入prep_minutes，steps≤4且总时长≤40分钟。
4. 过敏复核：重查忌口/过敏；其直接名称和带前后缀形态不得出现在模型JSON任何字段，例如米过敏时不得写“配米饭”。
只返回JSON，禁止JSON外文字。`;

function corsHeaders(env, request) {
  const reqOrigin = request?.headers?.get('Origin') || '';
  const configured = String(env.ALLOW_ORIGIN || 'https://yiguochu.pages.dev')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);
  const allowed = new Set(configured.length ? configured : ['https://yiguochu.pages.dev']);
  let origin = allowed.has('https://yiguochu.pages.dev') ? 'https://yiguochu.pages.dev' : [...allowed][0];
  if (reqOrigin === 'null') origin = 'null';
  else if (reqOrigin) {
    try {
      const u = new URL(reqOrigin);
      const isLocal = (u.protocol === 'http:' || u.protocol === 'https:') && (u.hostname === 'localhost' || u.hostname === '127.0.0.1');
      const isProject = u.protocol === 'https:' && (u.hostname === 'yiguochu.pages.dev' || u.hostname.endsWith('.yiguochu.pages.dev'));
      if (allowed.has(reqOrigin) || isLocal || isProject) origin = reqOrigin;
    } catch (_e) {}
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function jsonResponse(data, status, env, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(env, request),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function errorResponse(code, message, status, env, extra = {}, request) {
  return jsonResponse({ error: message, code, ...extra }, status, env, request);
}

function asList(value) {
  let arr = [];
  if (Array.isArray(value)) arr = value;
  else if (typeof value === 'string') arr = value.replace(/[，、]/g, ',').split(',');
  // #12: 每项去换行 + 限长, 列表限项数, 防用户输入注入 prompt
  return arr.map(x => sanitizePromptText(x, 20)).filter(Boolean).slice(0, 20);
}

function safeInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function shanghaiParts(now) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = type => parts.find(p => p.type === type)?.value || '';
  return { day: `${get('year')}-${get('month')}-${get('day')}`, month: Number(get('month')) };
}

function seasonNote(now) {
  const month = shanghaiParts(now).month || (now.getUTCMonth() + 1);
  const seasons = [
    { months: [3, 4, 5], text: '春季(3-5月) 应季: 春笋、香椿、豌豆、蚕豆、芦笋、荠菜、菠菜、韭菜、莴笋、西红柿、草莓' },
    { months: [6, 7, 8], text: '夏季(6-8月) 应季: 丝瓜、冬瓜、苦瓜、黄瓜、茄子、空心菜、苋菜、玉米、绿豆、桃、西瓜、葡萄' },
    { months: [9, 10, 11], text: '秋季(9-11月) 应季: 莲藕、山药、南瓜、芋头、菱角、栗子、白菜、西兰花、菠菜、苹果、梨、柿子' },
    { months: [12, 1, 2], text: '冬季(12-2月) 应季: 大白菜、萝卜、土豆、红薯、芋头、菠菜、油菜、菌菇、橘子、橙子、柚子' },
  ];
  const found = seasons.find(s => s.months.includes(month));
  if (!found) return '';
  return `\n【应季参考】当前 ${month} 月。${found.text}。这是参考清单, 不强制每道菜都用应季, 但平均下来约一半的菜应包含 1-2 种应季食材。优先级低于「不重复最近吃过的」。`;
}

function buildPrompt(mealName, targets, constraints, recipeGrounding) {
  const trustedTemplate = RECIPE_TEMPLATE.replace('{recipe_grounding}', String(recipeGrounding || ''));
  let constraintNote = '';
  const diet = constraints.diet;
  if (diet && diet !== 'omnivore') {
    const label = { ovoLacto: '蛋奶素', vegan: '严格素食', glutenFree: '无麸质' }[diet];
    if (label) constraintNote += `饮食限制: ${label}。`;
  }

  const pantry = asList(constraints.pantry);
  if (pantry.length) {
    constraintNote += `家里现有库存: ${pantry.join(',')}。是否使用以可信基础菜谱的已选/舍弃清单为准；不合适的库存必须舍弃。`;
  }

  const dislikes = asList(constraints.dislikes);
  if (dislikes.length) constraintNote += `不吃/过敏(务必严格避开, 含同类与微量也不要用): ${dislikes.join('、')}。`;

  if (constraints.week_fish_short) {
    constraintNote += '本周可安排一次鱼或海鲜即可(膳食指南建议每周≥2次, 但不必每餐都安排鱼); 若这餐安排鱼, 挑一种最近没吃过的鱼虾贝, 不要默认三文鱼。';
  }

  const balanceLow = asList(constraints.balance_low);
  if (balanceLow.length) {
    constraintNote += `【最近几餐这些偏少, 这一锅请有意识地多补】${balanceLow.join('; ')}。要自然融进菜里, 别为补而牺牲好吃。`;
  }
  if (constraints.balance_high_na) {
    constraintNote += '最近几餐钠偏高, 这一锅请少油少盐、少用腌制/酱料/加工肉。';
  }
  if (constraints.swap_hint) {
    constraintNote += sanitizePromptText(constraints.swap_hint, 160);
  }
  if (constraints.feedback_hint) constraintNote += String(constraints.feedback_hint);

  let excludeNote = '';
  const recent = asList(constraints.recent_dishes).slice(-20);
  if (recent.length) {
    excludeNote += `\n【绝对不要】重复以下最近已推荐的菜名: ${recent.join(', ')}。要换不同菜系/食材的全新菜。`;
  }

  const recentIngredients = constraints.recent_ingredients;
  if (recentIngredients && typeof recentIngredients === 'object') {
    const parts = [];
    const proteins = asList(recentIngredients.recent_proteins).slice(0, 15);
    const veggies = asList(recentIngredients.recent_veggies).slice(0, 20);
    const carbs = asList(recentIngredients.recent_carbs).slice(0, 10);
    if (proteins.length) parts.push(`主蛋白用过: ${proteins.join(', ')}`);
    if (veggies.length) parts.push(`主蔬菜用过: ${veggies.join(', ')}`);
    if (carbs.length) parts.push(`主食用过: ${carbs.join(', ')}`);
    if (parts.length) {
      excludeNote += `\n\n【食材轮换】最近 ${safeInt(recentIngredients.window_size, 0)} 次推荐里:\n-${parts.join('\n-')}\n这次的主蛋白和主蔬菜请明显避开以上列表, 选不同类别。`;
    }
  }

  const prompt = trustedTemplate
    .replace('{meal_name}', sanitizePromptText(mealName, 80))
    .replace('{kcal}', safeInt(targets.kcal, 1800))
    .replace('{p}', safeInt(targets.p, 60))
    .replace('{fb}', safeInt(targets.fb, 25))
    .replace('{ca}', safeInt(targets.ca, 800))
    .replace('{constraint_note}', constraintNote)
    .replace('{exclude_note}', excludeNote)
    .replace('{season_note}', seasonNote(new Date()));
  return prompt.replace(RECIPE_GROUNDING_TOKEN_RE, '');
}

function parseModelJson(text) {
  const raw = String(text || '').trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  try {
    return JSON.parse(raw);
  } catch (_err) {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1));
    throw _err;
  }
}

function normalizeMeal(meal, usage) {
  if (!meal || typeof meal !== 'object') throw new Error('模型返回空结果');
  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
  meal.ingredients = ingredients.slice(0, 14).map(item => {
    const out = { name: String(item?.name || '').trim(), grams: safeInt(item?.grams, 0) };
    for (const key of NUTRIENT_KEYS) {
      const n = Number(item?.[key]);
      out[key] = Number.isFinite(n) ? Math.min(Math.max(n, 0), NUTRIENT_MAX[key] ?? n) : 0;
    }
    return out;
  }).filter(item => item.name && item.grams > 0);
  if (meal.ingredients.length < 3) throw new Error('模型返回食材过少');

  meal.dish_name = String(meal.dish_name || '今日一锅出').trim();
  meal.steps = Array.isArray(meal.steps) ? meal.steps.map(x => String(x).trim()).filter(Boolean).slice(0, 6) : [];
  meal.flavor_tags = Array.isArray(meal.flavor_tags) ? meal.flavor_tags.map(String).slice(0, 5) : [];
  meal.prep_minutes = safeInt(meal.prep_minutes, 35);
  meal.difficulty = Math.min(2, Math.max(1, safeInt(meal.difficulty, 1)));
  meal.note = String(meal.note || '').trim();
  meal.taste_preview = String(meal.taste_preview || '').trim();
  meal.form = String(meal.form || '一锅主餐').trim();
  meal.why = String(meal.why || '').trim();
  meal.has_fish = Boolean(meal.has_fish);
  meal.veg_count = safeInt(meal.veg_count, 3);
  if (usage?.total_tokens) meal._tokens = usage.total_tokens;
  return meal;
}

function attachGroundedMetadata(meal, selection, constraints) {
  const recipe = selection.recipe;
  const aliases = selection.ingredientAliases || {};
  const usedPantry = Array.isArray(selection.usedPantry) ? [...selection.usedPantry] : [];
  const unusedPantry = Array.isArray(selection.unusedPantry) ? [...selection.unusedPantry] : [];
  const fixedCore = new Set((Array.isArray(recipe.core_ingredients) ? recipe.core_ingredients : [])
    .map(item => canonicalRecipeIngredient(item, aliases))
    .filter(Boolean));
  const onlyFixedCore = usedPantry.every(item => fixedCore.has(canonicalRecipeIngredient(item, aliases)));

  meal.family_id = String(recipe.family_id || selection.family?.id || '');
  meal.base_recipe_id = String(recipe.id || '');
  meal.basis_level = onlyFixedCore ? 'classic' : 'adapted';
  meal.pairing_basis = usedPantry.length
    ? `以「${String(recipe.name || recipe.id || '基础菜谱')}」为基础，使用${usedPantry.join('、')}。`
    : `以「${String(recipe.name || recipe.id || '基础菜谱')}」为基础，按原有结构制作。`;
  meal.used_pantry = usedPantry;
  meal.unused_pantry = unusedPantry;
  meal.source_refs = structuredClone(Array.isArray(recipe.source_refs) ? recipe.source_refs : []);
  meal.safety_checks = Array.isArray(recipe.safety_rules) ? [...recipe.safety_rules] : [];
  meal.validation_flags = validateGroundedMeal(meal, selection, constraints);
  return meal;
}

function rateOk(request, env) {
  const limit = safeInt(env.RATE_LIMIT, 300);
  if (limit <= 0) return true;
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const day = shanghaiParts(new Date()).day;
  const key = `${day}:${ip}`;
  const used = RATE_BUCKETS.get(key) || 0;
  if (used >= limit) return false;
  RATE_BUCKETS.set(key, used + 1);
  if (RATE_BUCKETS.size > 5000) {
    for (const oldKey of RATE_BUCKETS.keys()) {
      if (!oldKey.startsWith(day + ':')) RATE_BUCKETS.delete(oldKey);
    }
  }
  return true;
}

// 全局每日预算熔断(跨实例真熔断, 需在 Cloudflare Pages 绑 KV namespace 为 RATE_KV)。
// 无 KV binding 时降级返回 ok(靠 rateOk 内存限流), KV 异常也不阻断生成。
async function budgetConsume(env) {
  if (!env.RATE_KV) return { ok: true, degraded: true };
  try {
    const day = shanghaiParts(new Date()).day;
    const key = 'budget:' + day;
    const cap = safeInt(env.DAILY_BUDGET, 300);
    const used = parseInt((await env.RATE_KV.get(key)) || '0', 10) || 0;
    if (used >= cap) return { ok: false };
    await env.RATE_KV.put(key, String(used + 1), { expirationTtl: 172800 });
    return { ok: true };
  } catch (_e) { return { ok: true, degraded: true }; }
}

async function handleGenerate(request, env) {
  const t0 = Date.now();
  if (!env.DEEPSEEK_API_KEY) return errorResponse('missing_api_key', 'DEEPSEEK_API_KEY 未配置', 500, env, {}, request);
  if (!rateOk(request, env)) return errorResponse('rate_limited', '今天生成次数到上限了，明天再来～', 429, env, {}, request);
  const budget = await budgetConsume(env);
  if (!budget.ok) return errorResponse('budget_exceeded', '今天大家用得有点多，明天再来～', 429, env, {}, request);

  const req = await request.json().catch(() => ({}));
  const targets = req.targets && typeof req.targets === 'object' ? req.targets : {};
  const constraints = sanitizeRecipeConstraints(req.constraints);
  const mealName = String(req.meal_name || '主餐');
  let recipeLib;
  try {
    recipeLib = await getRecipeLib(env, request);
  } catch (_err) {
    return errorResponse('recipe_library_unavailable', '可信菜谱库暂时不可用', 503, env, {}, request);
  }
  const [selection] = selectRecipeCandidates(recipeLib, constraints);
  if (!selection) return errorResponse('recipe_library_unavailable', '没有符合本次限制的可信基础菜谱', 503, env, {}, request);
  const prompt = buildPrompt(mealName, targets, constraints, buildRecipeGrounding(selection));
  const body = {
    model: env.MODEL_NAME || 'deepseek-chat',
    messages: [
      { role: 'system', content: RECIPE_SYSTEM },
      { role: 'user', content: prompt },
    ],
    temperature: 1.0,
    response_format: { type: 'json_object' },
  };

  const upstream = await fetch(env.API_URL || 'https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const raw = await upstream.text();
  if (!upstream.ok) {
    console.error('DeepSeek upstream error', upstream.status, raw.slice(0, 300));
    return errorResponse('upstream_http', '生成服务临时失败，请稍后再试', 502, env, { upstreamStatus: upstream.status }, request);
  }

  const data = JSON.parse(raw);
  const content = data?.choices?.[0]?.message?.content;
  const meal = normalizeMeal(parseModelJson(content), data.usage);
  attachGroundedMetadata(meal, selection, constraints);
  await enrichWithTw(meal, env, request); // 第二层: 台湾权威库覆盖命中食材的营养(标 auth:'tw')
  console.log(JSON.stringify({
    evt: 'gen',
    ok: true,
    base: meal.base_recipe_id,
    family: meal.family_id,
    flags: meal.validation_flags.length,
    tokens: meal._tokens || 0,
    tw: meal._twMatched || 0,
    n: (meal.ingredients || []).length,
    ms: Date.now() - t0,
  }));
  return jsonResponse(meal, 200, env, request);
}

export { buildRecipeGrounding, canonicalRecipeIngredient, selectRecipeCandidates, getRecipeLib, validateGroundedMeal };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(env, request) });
    if (request.method === 'GET' && url.pathname === '/health') {
      let recipeLibrary = 'ok';
      let recipeFamilies = 0;
      let baseRecipes = 0;
      try {
        const lib = await getRecipeLib(env, request);
        recipeFamilies = Array.isArray(lib.families) ? lib.families.length : 0;
        baseRecipes = lib.recipes.length;
      } catch (_err) {
        recipeLibrary = 'unavailable';
      }
      return jsonResponse({
        status: 'ok',
        provider: 'deepseek',
        model: env.MODEL_NAME || 'deepseek-chat',
        budget: env.RATE_KV ? 'kv' : 'memory',
        recipeLibrary,
        recipeFamilies,
        baseRecipes,
      }, 200, env, request);
    }
    if (request.method === 'POST' && url.pathname === '/generate-meal') {
      try {
        return await handleGenerate(request, env);
      } catch (err) {
        console.error('generate worker error', err?.message || String(err));
        return errorResponse('worker_error', '生成服务临时异常，请稍后再试', 500, env, {}, request);
      }
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return jsonResponse({ error: 'not found' }, 404, env, request);
  },
};
