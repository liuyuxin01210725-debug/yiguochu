import {
  normalizePlannerRequest,
  plannerRequestFromLegacy,
} from './planner-v2.js';

const NUTRIENT_KEYS = ['kcal', 'p', 'fb', 'mg', 'k', 'ca', 'fe', 'zn', 'na', 'vc', 'vd', 'w3'];
// 每 100g 合理上限(防模型把"整道菜总量"误当每100g, 乘 grams 后营养暴涨)
const NUTRIENT_MAX = { kcal: 900, p: 100, fb: 100, mg: 1200, k: 5000, ca: 1500, fe: 50, zn: 50, na: 40000, vc: 2000, vd: 50, w3: 60 };
const RATE_BUCKETS = new Map();

// ===== 菜谱库候选: 只做确定性查表与排序，不额外调用模型。=====
const RECIPE_CACHE = new WeakMap();
const RECIPE_FALLBACK_CACHE = new Map();
const RECIPE_GROUNDING_TOKEN_RE = /\{recipe_grounding\}/gi;
const RICE_ALLERGY_COMPLETE_MAIN_PROFILE_ID = 'rice-allergy-complete-main';
const TRUSTED_RECIPE_SYSTEM_ROLE = '你是可信基础菜谱的一锅出编辑。只按本系统消息中的可信菜谱硬约束和用户消息里的对应 grounding 生成；不得套用通用“主食+蛋白+多蔬菜”模板。返回严格 JSON，JSON 外不要输出文字。';
const TRUSTED_RECIPE_SYSTEM_OVERRIDE = '【可信菜谱最高优先级】当可信基础菜谱与通用的“主食+蛋白+多种蔬菜”或食材数量要求冲突时，必须以可信菜谱的固定核心、可选食材、允许替换和白名单为准。不得为补齐营养或丰富口味擅自添加白名单外的主食、肉蛋奶、豆类或蔬菜；清粥或素炖锅也可按原结构输出。';

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

// 菜谱匹配专用受控语义：只用于“用户现有食材能否满足菜谱要求”，不改写展示名、营养查表名或做法部位。
// 肉类映射是有方向的：这些部位可满足通用肉类要求；特殊部位要求仍由 ingredientMatchesRecipeRequirement 保护。
const RECIPE_MATCH_NORMALIZATION = {
  '牛肉':'牛肉', '牛里脊':'牛肉', '牛里脊肉':'牛肉', '牛柳':'牛肉', '牛肉片':'牛肉',
  '鸡肉':'鸡肉', '鸡胸':'鸡肉', '鸡胸肉':'鸡肉', '鸡腿':'鸡肉', '鸡腿肉':'鸡肉',
  '猪肉':'猪肉', '猪里脊':'猪肉', '猪里脊肉':'猪肉', '猪肉片':'猪肉',
  '嫩豆腐':'嫩豆腐', '南豆腐':'嫩豆腐',
  '老豆腐':'老豆腐', '北豆腐':'老豆腐', '豆腐':'老豆腐',
};
const GENERIC_MEAT_REQUIREMENTS = new Set(['牛肉', '鸡肉', '猪肉']);
const GENERIC_MEAT_COMPATIBLE_SHAPES = {
  '牛肉': new Set(['tenderloin', 'slice']),
  '鸡肉': new Set(['leg', 'breast']),
  '猪肉': new Set(['tenderloin', 'slice']),
};

function recipeMatchForm(name) {
  return String(name || '').toLowerCase()
    .replace(/过敏|不吃|忌口|不要/g, '')
    .replace(/（/g, '(').replace(/）/g, ')')
    .replace(/[\s_-]+/g, '');
}

function controlledMeatFamily(form) {
  if (/(?:牛肉|牛腩|牛腱|牛柳|牛里脊|肥牛|牛排|牛仔骨)/u.test(form)) return '牛肉';
  if (/(?:鸡肉|鸡胸|鸡腿|鸡翅|鸡柳|去皮鸡)/u.test(form) && !/(?:鸡蛋|蛋鸡)/u.test(form)) return '鸡肉';
  if (/(?:猪肉|猪里脊|猪排|猪肋排|排骨|五花肉)/u.test(form)) return '猪肉';
  return '';
}

function controlledMeatShape(form) {
  if (/(?:粗绞|绞肉|肉末|肉馅)/u.test(form)) return 'ground';
  if (/牛腩/u.test(form)) return 'brisket';
  if (/(?:猪肋排|排骨)/u.test(form)) return 'rib';
  if (/鸡腿/u.test(form)) return 'leg';
  if (/鸡胸/u.test(form)) return 'breast';
  if (/(?:牛里脊|牛柳|猪里脊)/u.test(form)) return 'tenderloin';
  if (/(?:牛肉片|猪肉片)/u.test(form)) return 'slice';
  return '';
}

// FNV-1a 32 位哈希(与 ai_proxy.py 逐位一致, parity 测试锁定): 取 UTF-8 字节流,
// offset basis 2166136261, FNV prime 16777619, 全程 32 位无符号; init 允许传入起始 hash 做种子串接。
function fnv1a32(text, init = 2166136261) {
  let hash = init >>> 0;
  for (const byte of new TextEncoder().encode(String(text ?? ''))) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
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

function recipeMatchIdentity(name, aliases = {}) {
  const form = recipeMatchForm(name);
  if (!form) return '';
  if (RECIPE_MATCH_NORMALIZATION[form]) return RECIPE_MATCH_NORMALIZATION[form];
  // 特殊肉类形态不能再经过“去片/末”或宽 alias 折叠，否则牛肉末会被误当成通用牛肉。
  if (controlledMeatFamily(form)) return form;
  return canonicalRecipeIngredient(name, aliases) || baseRecipeIngredient(name);
}

// 有方向的菜谱要求匹配：通用牛/鸡/猪肉可接受受控部位；特殊形态只接受同形态，
// 或由调用方通过 substitution_slots 明确匹配 allowed 项。豆腐按嫩/老两类对齐。
function ingredientMatchesRecipeRequirement(pantryName, requirementName, aliases = {}) {
  const pantryForm = recipeMatchForm(pantryName);
  const requirementForm = recipeMatchForm(requirementName);
  if (!pantryForm || !requirementForm) return false;
  if (pantryForm === requirementForm) return true;

  const pantryControlled = RECIPE_MATCH_NORMALIZATION[pantryForm] || '';
  const requirementControlled = RECIPE_MATCH_NORMALIZATION[requirementForm] || '';
  if (GENERIC_MEAT_REQUIREMENTS.has(requirementForm)) {
    if (pantryControlled === requirementForm) return true;
    if (controlledMeatFamily(pantryForm) !== requirementForm) return false;
    return GENERIC_MEAT_COMPATIBLE_SHAPES[requirementForm]
      ?.has(controlledMeatShape(pantryForm)) || false;
  }
  if (requirementControlled === '嫩豆腐' || requirementControlled === '老豆腐') {
    return pantryControlled === requirementControlled;
  }

  const pantryFamily = controlledMeatFamily(pantryForm);
  const requirementFamily = controlledMeatFamily(requirementForm);
  if (pantryFamily || requirementFamily) {
    if (!pantryFamily || pantryFamily !== requirementFamily) return false;
    const pantryShape = controlledMeatShape(pantryForm);
    const requirementShape = controlledMeatShape(requirementForm);
    return !!pantryShape && pantryShape === requirementShape;
  }
  return canonicalRecipeIngredient(pantryName, aliases) === canonicalRecipeIngredient(requirementName, aliases);
}

function uniqueRecipePantry(value, aliases = {}) {
  const seen = new Set();
  return recipeConstraintList(value).filter(item => {
    const key = recipeMatchIdentity(item, aliases);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ===== 过敏类别表（与 index.html、ai_proxy.py 保持一致，parity 测试锁定）
const ALLERGEN_GROUPS = {
  '海鲜': ['鱼','鲈鱼','鳕鱼','三文鱼','金枪鱼','带鱼','黄花鱼','鲫鱼','鲤鱼','草鱼','鱼头','鱼片','虾','虾仁','虾皮','海米','蟹','螃蟹','蛤蜊','扇贝','干贝','瑶柱','牡蛎','生蚝','鲍鱼','蛏子','鱿鱼','章鱼','墨鱼','海参','海螺','贝类'],
  '蛋': ['鸡蛋','鸭蛋','鹌鹑蛋','皮蛋','咸蛋','咸鸭蛋','蛋白','蛋黄','蛋液'],
  '奶': ['牛奶','羊奶','奶粉','奶酪','芝士','黄油','奶油','淡奶油','酸奶','炼乳'],
  '花生': ['花生','花生米','花生酱'],
  '坚果': ['核桃','杏仁','腰果','开心果','榛子','松子','碧根果','夏威夷果','巴旦木','板栗','芝麻','芝麻酱'],
  '鸡肉': ['鸡肉','鸡腿','鸡腿肉','鸡胸','鸡胸肉','鸡翅','鸡爪','鸡柳','土鸡','乌鸡','三黄鸡','鸡胗','鸡肝','鸡汤'],
  '牛肉': ['牛肉','牛里脊','牛腩','牛腱','肥牛','牛肉片','牛肉末','牛排','牛仔骨'],
  '猪肉': ['猪肉','猪里脊','五花肉','猪排','排骨','猪蹄','猪肝','猪腰','腊肉','腊肠','培根','火腿']
};

// 忌口/过敏统一匹配: 归一化(去空格、半角括号、去括号基名、alias 归一)后双向子串;
// 仅当忌口词等于类别名本身时按组扩展(组成员如「虾仁」不反向牵连同组)。
// 匹配时同时用「原词基名」和「alias 归一名」两路形态: alias(如 豆腐→老豆腐/香菇→鲜香菇)只用于对齐菜谱,
// 不许收窄忌口保护面(单用归一名会让 豆腐≠豆腐干、香菇≠干香菇)。
function allergyMatchForms(name, aliases) {
  const raw = baseRecipeIngredient(name);
  const resolved = canonicalRecipeIngredient(name, aliases);
  return [...new Set([raw, resolved].filter(Boolean))];
}
function matchAllergy(dislikeTerm, ingredientName, aliases = {}) {
  const dForms = allergyMatchForms(dislikeTerm, aliases);
  const iForms = allergyMatchForms(ingredientName, aliases);
  if (!dForms.length || !iForms.length) return false;
  const groupNames = dForms.filter(d => ALLERGEN_GROUPS[d]);
  if (groupNames.length) {
    if (dForms.some(d => iForms.some(i => i === d || (d.length >= 2 && i.includes(d))))) return true;
    return groupNames.some(g => ALLERGEN_GROUPS[g].some(member => {
      const mForms = allergyMatchForms(member, aliases);
      return mForms.some(m => iForms.some(i => i.includes(m) || m.includes(i)));
    }));
  }
  return dForms.some(d => iForms.some(i => i.includes(d) || d.includes(i)));
}

// 可信菜谱状态: approved=人工批准, auto_approved=自动闸门晋升; 选菜、grounding 与校验对两档一视同仁。
function trustedRecipeStatus(status) {
  return status === 'approved' || status === 'auto_approved';
}

function recipeConstraintList(value) {
  if (Array.isArray(value)) return value.map(item => sanitizePromptText(item, 80)).filter(Boolean);
  if (typeof value === 'string') return value.replace(/[，、]/g, ',').split(',').map(item => sanitizePromptText(item, 80)).filter(Boolean);
  return [];
}

// 输入硬上限: pantry/dislikes 各最多 20 项, 超出截断并记录(不整单拒绝, 保持生成可用); 单项 80 字限制不变。
function capRecipeConstraintList(list, field) {
  if (!Array.isArray(list) || list.length <= 20) return list;
  console.warn(JSON.stringify({ evt: 'constraint_cap', field, dropped: list.length - 20 }));
  return list.slice(0, 20);
}

// 换一换意图白名单: 前端发送的 swap_intent 只认这几种, 其余丢弃(与 ai_proxy.py 一致)。
const SWAP_INTENT_KINDS = new Set(['flavor', 'cuisine', 'lighter', 'easier', 'protein', 'any']);

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
  const swapIntent = sanitizePromptText(input.swap_intent, 20);
  return {
    ...input,
    diet: sanitizePromptText(input.diet, 20),
    purpose: sanitizePromptText(input.purpose, 20),
    pantry: capRecipeConstraintList(recipeConstraintList(input.pantry), 'pantry'),
    dislikes: capRecipeConstraintList(recipeConstraintList(input.dislikes), 'dislikes'),
    recent_dishes: recipeConstraintList(input.recent_dishes),
    recent_families: recipeConstraintList(input.recent_families),
    recent_base_recipes: recipeConstraintList(input.recent_base_recipes),
    selected_base_recipe_id: sanitizePromptText(input.selected_base_recipe_id, 100),
    balance_low: recipeConstraintList(input.balance_low),
    swap_hint: sanitizePromptText(input.swap_hint, 160),
    swap_intent: SWAP_INTENT_KINDS.has(swapIntent) ? swapIntent : '',
    feedback_hint: sanitizePromptText(input.feedback_hint, 160),
    recent_ingredients: recentIngredients,
  };
}

function recipeConstraintProfile(recipe, profileId) {
  if (!Array.isArray(recipe?.constraint_profiles)) return null;
  const profile = recipe.constraint_profiles.find(item => (
    item && typeof item === 'object' && item.id === profileId && typeof item.basis === 'string'
  ));
  return profile ? { id: profile.id, basis: profile.basis.trim() } : null;
}

function riceAllergyCompleteMainActive(selection) {
  return selection?.constraintProfile?.id === RICE_ALLERGY_COMPLETE_MAIN_PROFILE_ID;
}

// 选菜短名单上限: 家族去重优先, 不足时再按分补齐(与 ai_proxy.py 一致)。
const RECIPE_SHORTLIST_SIZE = 5;
// 换一换意图分(具名权重): 意图只调序、不越过 pantry/安全——库存覆盖层级、忌口拦截与
// 最近已吃硬排除/近期家族 -20×n 仍是主导, 意图分只在同档候选间换序。判定全部走菜谱结构化字段
// (cuisine/protein_class/light_level/total_time_minutes), 不再按名称正则猜测。
const SWAP_INTENT_WEIGHTS = {
  cuisineNewFamily: 10, // cuisine: recipe.cuisine 不在近期基础菜谱(recent_base_recipes 经 lib 映射)的 cuisine 集合内
  cuisineSameAsLast: -10, // cuisine: 与最近一道基础菜谱同 cuisine
  flavorNewFamily: 8, // flavor: 与最近一道不同家族
  proteinNewClass: 8, // protein: protein_class 与最近一道不相交
  lighterForm: 8, // lighter: light_level 为「清淡」
  easierCore: 8, // easier: total_time_minutes ≤25 或核心 ≤5 项
};

const DEFAULT_MAIN_STAPLE_RE = /(?:大米|米饭|糙米|糯米|小米|面条|面团|粉丝|粉条|米粉|土豆|红薯|芋头|玉米|燕麦|藜麦|扁豆|豇豆|鹰嘴豆|黑眼豆)/u;

function defaultMainMealEligible(recipe) {
  if (!trustedRecipeStatus(recipe?.status)) return true;
  // 兼容精简测试/旧草案对象；生产库 schema 会强制这些结构化字段存在。
  if (!Array.isArray(recipe?.protein_class) || typeof recipe?.light_level !== 'string') return true;
  const proteins = Array.isArray(recipe?.protein_class) ? recipe.protein_class.filter(item => item !== '无') : [];
  const coreText = Array.isArray(recipe?.core_ingredients) ? recipe.core_ingredients.join('、') : '';
  const undersizedLightTofuVermicelli = recipe?.light_level === '清淡'
    && /(?:粉丝|粉条)/u.test(coreText)
    && proteins.length > 0
    && proteins.every(item => item === '豆制品');
  return proteins.length > 0
    && DEFAULT_MAIN_STAPLE_RE.test(coreText)
    && !undersizedLightTofuVermicelli;
}

function selectRecipeCandidates(lib, constraints = {}) {
  const riceAllergyActive = validationRiceAllergenActive(
    constraints.dislikes,
    lib?.ingredient_aliases || {},
  );
  const aliases = normalizeRecipeAliases(lib?.ingredient_aliases);
  const canonical = name => resolveRecipeAlias(baseRecipeIngredient(name), aliases);
  const pantry = uniqueRecipePantry(constraints.pantry, lib?.ingredient_aliases || {});
  const pantryCanonical = new Set(pantry.map(canonical).filter(Boolean));
  // 忌口统一走 matchAllergy(双向子串 + 类别扩展), 不再只做 canonical 精确匹配。
  const dislikeTerms = recipeConstraintList(constraints.dislikes);
  const libAliases = lib?.ingredient_aliases || {};
  const disliked = item => dislikeTerms.some(term => matchAllergy(term, item, libAliases));
  const recentRecipes = new Set(recipeConstraintList(constraints.recent_base_recipes));
  const familyById = new Map((Array.isArray(lib?.families) ? lib.families : [])
    .map(family => [family.id, family]));
  const libRecipes = Array.isArray(lib?.recipes) ? lib.recipes : [];
  const recipeById = new Map(libRecipes.map(recipe => [recipe.id, recipe]));
  // 家族惩罚按 recent_base_recipes 推导: 该家族在最近基础菜谱中每出现一次扣 20(-20×n, n=0 不扣),
  // 历史越长同家族扣分越重, 不再全家均匀平顶; recent_families 入参保留兼容, 不再参与打分
  // (cuisine 意图改由 recent_base_recipes 经 lib 映射 cuisine 集合)。
  const recentIds = recipeConstraintList(constraints.recent_base_recipes);
  const recentFamilyCounts = new Map();
  // 换一换意图: 最近基础菜谱经 lib 查回, cuisine 取全部历史映射出的集合, protein/flavor 对比末位一道。
  const recentCuisines = new Set();
  for (const id of recentIds) {
    const recent = recipeById.get(id);
    if (recent) recentFamilyCounts.set(recent.family_id, (recentFamilyCounts.get(recent.family_id) || 0) + 1);
    if (typeof recent?.cuisine === 'string' && recent.cuisine) recentCuisines.add(recent.cuisine);
  }
  const swapIntent = SWAP_INTENT_KINDS.has(constraints.swap_intent) ? constraints.swap_intent : '';
  const lastRecentRecipe = recentIds.length ? recipeById.get(recentIds[recentIds.length - 1]) || null : null;
  const lastCuisine = typeof lastRecentRecipe?.cuisine === 'string' ? lastRecentRecipe.cuisine : '';
  const lastProteinClasses = new Set(Array.isArray(lastRecentRecipe?.protein_class) ? lastRecentRecipe.protein_class : []);
  const candidates = [];

  for (const recipe of libRecipes) {
    if (constraints.purpose === 'quick'
      && Number.isFinite(recipe.total_time_minutes)
      && recipe.total_time_minutes > 30) continue;
    // 已经换掉或点过「开始做」的基础菜谱在 7 天冷却窗口内不再候选。
    // 这必须是资格过滤，不能只靠 -100 软罚：全局库存覆盖优先后，软罚仍可能
    // 被覆盖层级压过，导致「换一换」原样返回。用户可在候选枯竭页主动清空记录。
    if (recentRecipes.has(recipe.id)) continue;
    // 用户没指定库存时，只从结构完整、非清淡小份的主餐里选默认菜。
    // 这避免把粉丝汤/基础粥一类偏轻方案当成两人完整主餐，再由前端误报为“不安全”。
    if (pantry.length === 0 && !defaultMainMealEligible(recipe)) continue;
    const qualifiedConstraintProfile = recipeConstraintProfile(
      recipe,
      RICE_ALLERGY_COMPLETE_MAIN_PROFILE_ID,
    );
    if (riceAllergyActive && !qualifiedConstraintProfile) continue;
    const constraintProfile = riceAllergyActive ? qualifiedConstraintProfile : null;
    const coreIngredients = recipeConstraintList(recipe.core_ingredients);
    const core = new Set(coreIngredients
      .map(canonical)
      .filter(Boolean));
    // 明确要求“冷藏不超过一天”的专用剩饭菜，只在用户确实提交熟米饭时参与；
    // 普通熟米饭菜仍可作为需补充即食/现成熟饭的方案，避免误伤目标组合覆盖。
    const requiresStoredLeftoverRice = (recipe.safety_rules || [])
      .some(rule => typeof rule === 'string' && /冷藏不超过一天/u.test(rule));
    if (requiresStoredLeftoverRice && !pantryCanonical.has('熟米饭')) continue;
    const optionalIngredients = recipeConstraintList(recipe.optional_ingredients);
    const optional = new Set(optionalIngredients
      .map(canonical)
      .filter(Boolean));
    const slots = Array.isArray(recipe.substitution_slots) ? recipe.substitution_slots : [];
    const allowedIngredients = slots.flatMap(slot => recipeConstraintList(slot?.allowed));
    const allowed = new Set(allowedIngredients
      .map(canonical)
      .filter(Boolean));
    const trustedLiquidIngredients = trustedRecipeLiquidOptions(recipe);
    const trustedLiquids = new Set(trustedLiquidIngredients
      .map(canonical)
      .filter(Boolean));

    const blockedCore = [...core].some(coreItem => {
      if (!disliked(coreItem)) return false;
      return !slots.some(slot => {
        const replacesCore = (slot.replaces || [])
          .map(canonical)
          .includes(coreItem);
        if (!replacesCore) return false;
        return (slot.allowed || []).some(item => {
          const raw = String(item || '').trim();
          const substitute = canonical(raw);
          return substitute && substitute !== coreItem && !disliked(substitute) && !/^不(?:放|加|用)/.test(raw);
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
    const satisfiedCore = new Set();
    let score = 0;

    for (const item of pantry) {
      const canonicalItem = canonical(item);
      if (!canonicalItem || disliked(canonicalItem)) {
        unusedPantry.push(item);
        continue;
      }
      const coreRequirement = coreIngredients.find(requirement => (
        ingredientMatchesRecipeRequirement(item, requirement, libAliases)
      ));
      const allowedRequirement = allowedIngredients.find(requirement => (
        ingredientMatchesRecipeRequirement(item, requirement, libAliases)
      ));
      const optionalRequirement = optionalIngredients.find(requirement => (
        ingredientMatchesRecipeRequirement(item, requirement, libAliases)
      ));
      const liquidRequirement = trustedLiquidIngredients.find(requirement => (
        ingredientMatchesRecipeRequirement(item, requirement, libAliases)
      ));
      if (coreRequirement) {
        score += 12;
        usedPantry.push(item);
        satisfiedCore.add(canonical(coreRequirement));
      } else if (allowedRequirement || optionalRequirement || liquidRequirement) {
        score += 5;
        usedPantry.push(item);
        for (const slot of slots) {
          if (!(slot.allowed || []).some(requirement => (
            ingredientMatchesRecipeRequirement(item, requirement, libAliases)
          ))) continue;
          for (const replaced of (slot.replaces || []).map(canonical)) {
            if (core.has(replaced)) satisfiedCore.add(replaced);
          }
        }
      } else {
        unusedPantry.push(item);
      }
      if (discouraged.has(canonicalItem)) score -= 8;
    }

    // 替换位的 replaces 可能是一组需同时使用的原料（如五色糯米饭的四种食品级粉），
    // 因此必须全部保留。仅在原料侧已命中时排除 allowed；原料侧未命中时，allowed 最多取一个。
    for (const slot of slots) {
      const replaces = new Set((slot.replaces || []).map(canonical).filter(Boolean));
      const alternatives = new Set((slot.allowed || []).map(canonical).filter(Boolean));
      const replaceForms = new Set((slot.replaces || []).map(baseRecipeIngredient).filter(Boolean));
      const alternativeForms = new Set((slot.allowed || []).map(baseRecipeIngredient).filter(Boolean));
      const slotSide = item => {
        const form = baseRecipeIngredient(item);
        if (replaceForms.has(form)) return 'original';
        if (alternativeForms.has(form)) return 'alternative';
        if ((slot.replaces || []).some(requirement => (
          ingredientMatchesRecipeRequirement(item, requirement, libAliases)
        ))) return 'original';
        if ((slot.allowed || []).some(requirement => (
          ingredientMatchesRecipeRequirement(item, requirement, libAliases)
        ))) return 'alternative';
        const value = canonical(item);
        if (replaces.has(value) && !alternatives.has(value)) return 'original';
        if (alternatives.has(value) && !replaces.has(value)) return 'alternative';
        return '';
      };
      const originalsUsed = usedPantry.filter(item => slotSide(item) === 'original');
      const alternativesUsed = usedPantry.filter(item => slotSide(item) === 'alternative');
      const remove = originalsUsed.length ? alternativesUsed : alternativesUsed.slice(1);
      for (const item of remove) {
        const index = usedPantry.indexOf(item);
        if (index >= 0) usedPantry.splice(index, 1);
        score -= core.has(canonical(item)) ? 12 : 5;
      }
    }
    const finalUsedSet = new Set(usedPantry);
    unusedPantry.splice(0, unusedPantry.length, ...pantry.filter(item => !finalUsedSet.has(item)));

    // 没有任何命中库存时，"快点吃上"不能优先落到只有主食的基础粥；
    // 仍保留用户明确提供粥核心食材时的原始偏好。
    const hasCoreProtein = [...core].some(item => /(?:鸡|牛|猪|羊|鱼|虾|蟹|贝|蛋|豆腐|豆干|腐竹|扁豆|黄豆|白豆)/.test(item));
    if (trustedRecipeStatus(recipe.status) && pantry.length === 0
      && constraints.purpose === 'quick' && satisfiedCore.size === 0 && !hasCoreProtein) score -= 6;

    if (trustedRecipeStatus(recipe.status) && dislikeTerms.length === 0) {
      score -= Math.max(0, core.size - satisfiedCore.size);
    }
    if ((recipe.purposes || []).includes(String(constraints.purpose || ''))) score += 3;
    score -= 20 * (recentFamilyCounts.get(recipe.family_id) || 0);
    // 换一换意图分: 只调同档候选的序, 不越过 pantry 命中与安全拦截; 全部读结构化字段。
    if (swapIntent === 'cuisine') {
      const recipeCuisine = typeof recipe.cuisine === 'string' ? recipe.cuisine : '';
      if (!recentCuisines.has(recipeCuisine)) score += SWAP_INTENT_WEIGHTS.cuisineNewFamily;
      if (lastCuisine && recipeCuisine === lastCuisine) score += SWAP_INTENT_WEIGHTS.cuisineSameAsLast;
    } else if (swapIntent === 'flavor') {
      if (lastRecentRecipe && lastRecentRecipe.family_id !== recipe.family_id) score += SWAP_INTENT_WEIGHTS.flavorNewFamily;
    } else if (swapIntent === 'protein') {
      if (lastRecentRecipe) {
        const classes = (Array.isArray(recipe.protein_class) ? recipe.protein_class : [])
          .filter(item => item !== '无');
        // 「换种蛋白」只奖励真实的新蛋白类；「无」不是一种蛋白，不得因为不相交而加分。
        if (classes.length && !classes.some(item => lastProteinClasses.has(item))) {
          score += SWAP_INTENT_WEIGHTS.proteinNewClass;
        }
      }
    } else if (swapIntent === 'lighter') {
      if (recipe.light_level === '清淡') score += SWAP_INTENT_WEIGHTS.lighterForm;
    } else if (swapIntent === 'easier') {
      if ((Number.isFinite(recipe.total_time_minutes) && recipe.total_time_minutes <= 25) || core.size <= 5) {
        score += SWAP_INTENT_WEIGHTS.easierCore;
      }
    }
    candidates.push({
      recipe,
      family: familyById.get(recipe.family_id),
      ingredientAliases: lib?.ingredient_aliases || {},
      score,
      usedPantry,
      unusedPantry,
      constraintProfile,
      dislikes: dislikeTerms,
    });
  }

  // 先在全候选池上守住库存覆盖，再截取 5 个家族短名单。如果先按 score 截断，
  // 一道能同时使用两项库存的菜可能因两项都是 optional(+5+5)，被 5 道只命中
  // 一项 core(+12) 的菜挤出短名单；后续 pick 再分层也无法救回。
  candidates.sort((a, b) => (pantry.length ? b.usedPantry.length - a.usedPantry.length : 0)
    || b.score - a.score
    || String(a.recipe.id).localeCompare(String(b.recipe.id)));
  const selected = [];
  const selectedIds = new Set();
  const selectedFamilies = new Set();
  const requestedRecipeId = sanitizePromptText(constraints?.selected_base_recipe_id, 100);
  const requestedCandidate = requestedRecipeId
    ? candidates.find(candidate => String(candidate.recipe?.id || '') === requestedRecipeId)
    : null;
  if (requestedCandidate) {
    selected.push(requestedCandidate);
    selectedIds.add(requestedCandidate.recipe.id);
    selectedFamilies.add(requestedCandidate.recipe.family_id);
  }
  for (const candidate of candidates) {
    if (selectedIds.has(candidate.recipe.id) || selectedFamilies.has(candidate.recipe.family_id)) continue;
    selected.push(candidate);
    selectedIds.add(candidate.recipe.id);
    selectedFamilies.add(candidate.recipe.family_id);
    if (selected.length === RECIPE_SHORTLIST_SIZE) return selected;
  }
  for (const candidate of candidates) {
    if (selectedIds.has(candidate.recipe.id)) continue;
    selected.push(candidate);
    selectedIds.add(candidate.recipe.id);
    if (selected.length === RECIPE_SHORTLIST_SIZE) break;
  }
  return selected;
}

function pantryItemSatisfiesCoreRequirement(item, requirement, recipe, aliases) {
  if (ingredientMatchesRecipeRequirement(item, requirement, aliases)) return true;
  const slots = Array.isArray(recipe.substitution_slots) ? recipe.substitution_slots : [];
  return slots.some(slot => {
    const replacesRequirement = (slot.replaces || []).some(replaced => (
      recipeMatchForm(replaced) === recipeMatchForm(requirement)
      || canonicalRecipeIngredient(replaced, aliases) === canonicalRecipeIngredient(requirement, aliases)
    ));
    return replacesRequirement && (slot.allowed || []).some(allowed => (
      ingredientMatchesRecipeRequirement(item, allowed, aliases)
    ));
  });
}

function requiredExtraItems(selection, usedItems) {
  const recipe = selection?.recipe || {};
  const aliases = selection?.ingredientAliases || {};
  const used = recipeConstraintList(usedItems);
  return recipeConstraintList(recipe.core_ingredients).filter(requirement => {
    return !used.some(item => pantryItemSatisfiesCoreRequirement(item, requirement, recipe, aliases));
  });
}

function pantryPlanGroup(selection, original, usedItems, unusedItems, order) {
  const recipe = selection?.recipe || {};
  return {
    ...(order ? { order } : {}),
    recipe_id: String(recipe.id || ''),
    recipe_name: String(recipe.name || recipe.id || '一锅方案'),
    cuisine: String(recipe.cuisine || ''),
    used_items: usedItems,
    unused_items: unusedItems,
    required_extra_items: requiredExtraItems(selection, usedItems),
    coverage: usedItems.length,
    total: original.length,
  };
}

// 1–6 种食材返回彼此独立的并列方案，每张卡都与完整 original 比较；超过 6 种才按 remaining
// 连续规划第一锅、第二锅。两种模式都最多给 3 组，并显式返回 used/unused/required extra。
function buildPantryPlan(lib, constraints = {}) {
  const original = uniqueRecipePantry(constraints?.pantry, lib?.ingredient_aliases || {});
  if (original.length <= 6) {
    const independentConstraints = { ...constraints, pantry: original, swap_intent: '' };
    const groups = selectRecipeCandidates(lib, independentConstraints)
      .filter(selection => selection.usedPantry.length)
      .slice(0, 3)
      .map(selection => pantryPlanGroup(
        selection,
        original,
        [...selection.usedPantry],
        [...selection.unusedPantry],
      ));
    const covered = new Set(groups.flatMap(group => group.used_items));
    return {
      kind: 'alternatives',
      original,
      groups,
      unplanned: original.filter(item => !covered.has(item)),
    };
  }

  const groups = [];
  const covered = new Set();
  let remaining = [...original];
  const recentBaseRecipes = recipeConstraintList(constraints?.recent_base_recipes);

  while (remaining.length && groups.length < 3) {
    const groupConstraints = {
      ...constraints,
      pantry: remaining,
      recent_base_recipes: recentBaseRecipes.concat(groups.map(group => group.recipe_id)),
      swap_intent: '',
    };
    const selections = selectRecipeCandidates(lib, groupConstraints);
    const selection = pickRecipeSelection(selections, groupConstraints, {
      riceAllergyActive: validationRiceAllergenActive(
        groupConstraints.dislikes,
        lib?.ingredient_aliases || {},
      ),
    });
    if (!selection || !selection.usedPantry.length) break;
    const usedItems = selection.usedPantry.slice(0, 6);
    const usedSet = new Set(usedItems);
    const unusedItems = remaining.filter(item => !usedSet.has(item));
    for (const item of usedItems) covered.add(item);
    groups.push(pantryPlanGroup(selection, original, usedItems, unusedItems, groups.length + 1));
    remaining = unusedItems;
  }

  return {
    kind: 'sequence',
    original,
    groups,
    unplanned: original.filter(item => !covered.has(item)),
  };
}

// 种子化抖动选取: 种子由库存/忌口/目的/份数/最近基础菜谱/换一换意图决定, 每个候选加
// fnv1a32(recipe.id, init=seed) % 7 的 0-6 分整数抖动。pantry 非空时先按 usedPantry 覆盖数
// 降序分层、同层内再按 score+jitter 降序、平手按 recipe.id 升序——抖动只能翻动食材覆盖数相同
// 的候选, 永远不许为多样性少用一个食材; pantry 为空时维持 score+jitter 降序。同输入+同历史
// 必出同一道(可复现); 历史或意图一变种子就变、可能换菜。抖动只加在返回后的选取环节, 不改
// selectRecipeCandidates 内部排序。
function recipeSelectionSeed(constraints) {
  return fnv1a32(JSON.stringify([
    recipeConstraintList(constraints?.pantry),
    recipeConstraintList(constraints?.dislikes),
    sanitizePromptText(constraints?.purpose, 20),
    constraints?.servings ?? null,
    recipeConstraintList(constraints?.recent_base_recipes),
    sanitizePromptText(constraints?.swap_intent, 20),
  ]));
}

function pickRecipeSelection(selections, constraints, { riceAllergyActive = false } = {}) {
  const list = Array.isArray(selections) ? selections : [];
  if (!list.length) return null;
  const requestedRecipeId = sanitizePromptText(constraints?.selected_base_recipe_id, 100);
  if (requestedRecipeId) {
    const requested = list.find(candidate => String(candidate.recipe?.id || '') === requestedRecipeId);
    if (!requested) return null;
    const requestedPantry = recipeConstraintList(constraints?.pantry);
    if (requestedPantry.length && requested.usedPantry.length !== requestedPantry.length) return null;
    return requested;
  }
  const seed = recipeSelectionSeed(constraints);
  const jittered = list.map(candidate => ({
    candidate,
    finalScore: candidate.score + fnv1a32(candidate.recipe?.id, seed) % 7,
  }));
  const pantry = recipeConstraintList(constraints?.pantry);
  if (pantry.length && !riceAllergyActive) {
    // 分层选取: 库存覆盖数高于多样性, feasible(usedPantry 非空)内先按覆盖数分层。
    const feasible = jittered.filter(item => item.candidate.usedPantry.length > 0);
    if (!feasible.length) return null;
    feasible.sort((a, b) => (b.candidate.usedPantry.length - a.candidate.usedPantry.length)
      || (b.finalScore - a.finalScore)
      || String(a.candidate.recipe?.id).localeCompare(String(b.candidate.recipe?.id)));
    return feasible[0].candidate;
  }
  jittered.sort((a, b) => b.finalScore - a.finalScore);
  return jittered[0].candidate;
}

function compactRecipeList(value, fallback = '无') {
  const items = Array.isArray(value) ? value.map(item => sanitizePromptText(item, 240)).filter(Boolean) : [];
  return items.length ? items.join('、') : fallback;
}

// 呈现给模型的可选/替换项按忌口过滤(安全): 命中忌口的可选项不得进入白名单;
// 固定核心不在此过滤——核心含忌口且不可替换的菜谱已在选菜层被 blockedCore 整菜出局。
function filterTrustedOptionsByDislikes(items, dislikes, aliases = {}) {
  const list = Array.isArray(items) ? items : [];
  const terms = Array.isArray(dislikes) ? dislikes.filter(Boolean) : [];
  if (!terms.length) return list;
  return list.filter(item => !terms.some(term => matchAllergy(term, item, aliases)));
}

function trustedRecipeGenerationOptions(recipe) {
  if (Array.isArray(recipe?.generation_optional_ingredients)
    && recipe.generation_optional_ingredients.length) {
    return recipe.generation_optional_ingredients;
  }
  return Array.isArray(recipe?.optional_ingredients) ? recipe.optional_ingredients : [];
}

function trustedRecipeLiquidOptions(recipe) {
  if (Array.isArray(recipe?.generation_liquid_ingredients)) {
    return recipe.generation_liquid_ingredients;
  }
  return [
    ...(Array.isArray(recipe?.core_ingredients) ? recipe.core_ingredients : []),
    ...trustedRecipeGenerationOptions(recipe),
  ].filter(name => /(?:^|[鸡蔬菜鱼牛猪])高汤$|^水$|^椰奶$/.test(String(name || '').trim()));
}

function trustedRecipeFatOptions(selection) {
  return trustedRecipeIngredientWhitelist(selection)
    .filter(name => /(?:黄油|奶油|牛脂|[橄榄植物食用菜籽花生大豆芝麻香]油)$/.test(String(name || '').trim()));
}

function pantryItemShouldReplaceCoreLabel(item, requirement, recipe, aliases) {
  const itemForm = recipeMatchForm(item);
  const requirementForm = recipeMatchForm(requirement);
  if (!itemForm || !requirementForm) return false;
  if (itemForm === requirementForm) return true;
  if (GENERIC_MEAT_REQUIREMENTS.has(requirementForm)) {
    return ingredientMatchesRecipeRequirement(item, requirement, aliases);
  }
  const requirementControlled = RECIPE_MATCH_NORMALIZATION[requirementForm] || '';
  if (requirementControlled === '嫩豆腐' || requirementControlled === '老豆腐') {
    return ingredientMatchesRecipeRequirement(item, requirement, aliases);
  }
  return (Array.isArray(recipe.substitution_slots) ? recipe.substitution_slots : []).some(slot => (
    (slot.replaces || []).some(replaced => (
      recipeMatchForm(replaced) === requirementForm
      || canonicalRecipeIngredient(replaced, aliases) === canonicalRecipeIngredient(requirement, aliases)
    ))
    && (slot.allowed || []).some(allowed => ingredientMatchesRecipeRequirement(item, allowed, aliases))
  ));
}

function trustedRecipeIngredientWhitelist(selection) {
  const recipe = selection?.recipe && typeof selection.recipe === 'object' ? selection.recipe : {};
  const aliases = selection?.ingredientAliases || {};
  const seen = new Set();
  const core = Array.isArray(recipe.core_ingredients) ? recipe.core_ingredients : [];
  const selectedPantry = Array.isArray(selection?.usedPantry) ? selection.usedPantry : [];
  const consumedSelected = new Set();
  const adaptedCore = core.map(requirement => {
    const selectedIndex = selectedPantry.findIndex((item, index) => (
      !consumedSelected.has(index)
      && pantryItemShouldReplaceCoreLabel(item, requirement, recipe, aliases)
    ));
    if (selectedIndex < 0) return requirement;
    consumedSelected.add(selectedIndex);
    return selectedPantry[selectedIndex];
  });
  const remainingSelected = selectedPantry.filter((_, index) => !consumedSelected.has(index));
  // 可选/液体/库存部分按忌口过滤(W4); 固定核心保持原样(核心安全由选菜层 blockedCore 保证)。
  const optionalPool = filterTrustedOptionsByDislikes([
    ...trustedRecipeGenerationOptions(recipe),
    ...trustedRecipeLiquidOptions(recipe),
  ], selection?.dislikes, aliases);
  return [
    ...adaptedCore,
    ...remainingSelected,
    ...optionalPool,
  ].filter(item => {
    if (/^不(?:放|加|用)/.test(String(item || '').trim())) return false;
    const canonical = canonicalRecipeIngredient(item, aliases);
    if (!canonical || seen.has(canonical)) return false;
    seen.add(canonical);
    return true;
  });
}

function buildTrustedRecipeSystemOverride(selection) {
  const recipe = selection?.recipe && typeof selection.recipe === 'object' ? selection.recipe : {};
  const aliases = selection?.ingredientAliases || {};
  // W4: 呈现给模型的可选/替换/液体项先按忌口过滤, 命中项不得出现在白名单文本里。
  const dislikes = selection?.dislikes;
  const adaptation = sanitizePromptText(recipe.adaptation_note, 400);
  const generationOptions = filterTrustedOptionsByDislikes(
    trustedRecipeGenerationOptions(recipe)
      .filter(item => !/^不(?:放|加|用)/.test(String(item || '').trim())),
    dislikes,
    aliases,
  );
  const generationOptionCount = generationOptions.length === 4 ? '四' : String(generationOptions.length);
  const liquidOptions = filterTrustedOptionsByDislikes(trustedRecipeLiquidOptions(recipe), dislikes, aliases);
  const fatOptions = trustedRecipeFatOptions(selection);
  const liquidRule = liquidOptions.length
    ? `本次留在成品中的主烹调液体只能使用: ${compactRecipeList(liquidOptions)}。${liquidOptions.includes('水') ? '不得加入任何高汤或第二种主液体。' : '不得另加水或第二种高汤。'}`
    : '本次未批准额外水或高汤；ingredients[] 和 steps[] 中都不得添加。';
  const fatRule = fatOptions.length
    ? `本次批准的烹调油脂只有: ${compactRecipeList(fatOptions)}。不得另加食用油或第二种油脂；ingredients[] 列出的油脂必须在 steps[] 逐字出现。`
    : '本次未批准额外烹调油脂；ingredients[] 和 steps[] 中都不得添加食用油或其他油脂。';
  const requiredIngredients = new Set([
    ...(Array.isArray(recipe.core_ingredients) ? recipe.core_ingredients : []),
    ...(Array.isArray(selection?.usedPantry) ? selection.usedPantry : []),
  ].map(name => canonicalRecipeIngredient(name, aliases)).filter(Boolean));
  const usedPantry = new Set((Array.isArray(selection?.usedPantry) ? selection.usedPantry : [])
    .map(name => canonicalRecipeIngredient(name, aliases)).filter(Boolean));
  const substitutionLocks = (Array.isArray(recipe.substitution_slots) ? recipe.substitution_slots : []).flatMap(slot => {
    const locked = (Array.isArray(slot?.replaces) ? slot.replaces : [])
      .filter(name => usedPantry.has(canonicalRecipeIngredient(name, aliases)));
    // allowed 先按忌口过滤; 过滤后全空时按现有空位逻辑处理(不产生锁定消息)。
    const allowed = filterTrustedOptionsByDislikes(
      (Array.isArray(slot?.allowed) ? slot.allowed : [])
        .filter(name => !/^不(?:放|加|用)/.test(String(name || '').trim())),
      dislikes,
      aliases,
    );
    const selectedAllowed = allowed
      .filter(name => usedPantry.has(canonicalRecipeIngredient(name, aliases)));
    if (locked.length && allowed.length) {
      return [`替换位“${sanitizePromptText(slot?.slot || '未命名', 80)}”本次已由库存原料“${compactRecipeList(locked)}”锁定；禁止再用 allowed 替代项“${compactRecipeList(allowed)}”。`];
    }
    if (selectedAllowed.length) {
      return [`替换位“${sanitizePromptText(slot?.slot || '未命名', 80)}”本次已由库存替代项“${compactRecipeList(selectedAllowed)}”锁定；必须删除原料“${compactRecipeList(slot?.replaces)}”，ingredients[]、steps[] 和菜名中都不得再出现。`];
    }
    return [];
  });
  const maxIngredientRows = Math.min(12, requiredIngredients.size + 6);
  return [
    TRUSTED_RECIPE_SYSTEM_OVERRIDE,
    '【本次可信菜谱硬约束】',
    `基础菜谱 ID: ${sanitizePromptText(recipe.id || 'unknown', 100)}。`,
    ...(adaptation ? [`本次一锅改编（必须执行）: ${adaptation}`] : []),
    `本次固定核心和已选库存去重后共 ${requiredIngredients.size} 项，ingredients[] 本次最多 ${maxIngredientRows} 行。`,
    ...substitutionLocks,
    `本次可入锅主料白名单: ${compactRecipeList(trustedRecipeIngredientWhitelist(selection))}。白名单外主料即使能补蛋白质或达成营养目标也不得加入；若基础菜谱是清粥，就不得擅自加肉、蛋或豆类。`,
    `白名单中的${generationOptionCount}项可选配料就是本次唯一允许的可选集合: ${compactRecipeList(generationOptions)}。不得使用基础菜谱中其他 optional 或 allowed 项。`,
    liquidRule,
    fatRule,
    '任何 ingredients[] 行都必须在 steps[] 中明确使用；没有步骤操作的可选食材必须从 ingredients[] 删除。',
    '固定核心和已选库存之外，可选食材与可选调味合计最多 4 项（已单独锁定的主烹调液体、烹调油脂以及有数字克数的水和盐不计入）；超出时删除可选项，不得删固定核心。',
    '一个替换位只能保留 replaces 原料或一个 allowed 替代项，不得同时使用原料和替代料，也不得同时使用多个替代项。',
    '步骤中写入的水、高汤、食用油、盐或胡椒，都必须在 ingredients[] 中有对应 name 和大于 0 的 grams；反向也必须成立。',
    'ingredients[] 最多 12 行，并且已包含水、高汤、食用油、盐、胡椒和香辛料；可选香辛料最多 3 种。超过上限时必须先删除非必需的可选配料，不得让必需的液体或调味行排在第 12 行之后。',
    'ingredients[]中有“盐”时，steps[]必须逐字出现“加盐”；steps[]中有“盐”时，ingredients[]必须有大于 0 grams 的“盐”。胡椒同理；不使用就必须从两处同时删除。',
    '盐只有两种合法模式：A是 ingredients[] 列“盐”和数字 grams，steps[] 写“加盐”；B是 ingredients[] 不列盐，且 steps[] 不得出现“盐”字。禁止“加盐（未列入食材、可不加）”这类自相矛盾表述。',
    '禁止使用“提前”“预先”“事先”“隔夜”“过夜”“已泡好”等措辞或假定。需要长时泡发、预煮的可选食材必须省略；同次做饭可完成的短时处理必须写成“先处理 N 分钟”并计入总时长。',
    '生禽肉、猪肉或海鲜只有在明确加热动作之后才能写“熟透”或“中心不见粉红”；禁止写“切块，中心不见粉红”这种把备料当熟制终点的步骤。',
    '只能使用一口烹饪容器；主食和其他需熟制食材都必须在本次 steps[] 中完成。',
    '返回 JSON 前逐项检查上述规则；冲突时先删除可选食材，不得新增主料。',
  ].join('\n');
}

function buildRecipeGrounding(selection) {
  const recipe = selection?.recipe && typeof selection.recipe === 'object' ? selection.recipe : {};
  const family = selection?.family && typeof selection.family === 'object' ? selection.family : {};
  const aliases = selection?.ingredientAliases || {};
  // W4: 替换位 allowed 与液体项按忌口过滤, 命中项不进 grounding 文本。
  const dislikes = selection?.dislikes;
  const slots = (Array.isArray(recipe.substitution_slots) ? recipe.substitution_slots : [])
    .map(slot => `${sanitizePromptText(slot?.slot || '替换位', 80)}[${compactRecipeList(slot?.replaces)}→${compactRecipeList(filterTrustedOptionsByDislikes(slot?.allowed, dislikes, aliases))}]`);
  const discouraged = (Array.isArray(recipe.discouraged) ? recipe.discouraged : [])
    .map(rule => `${compactRecipeList(rule?.ingredients)}(${sanitizePromptText(rule?.reason || '不适合基础结构', 240)})`);
  const profile = selection?.constraintProfile && typeof selection.constraintProfile === 'object'
    ? selection.constraintProfile
    : null;
  const timeLines = Number.isInteger(recipe.total_time_minutes)
    ? [`总时长基准: ${recipe.total_time_minutes}分钟`] : [];
  const adaptationLines = typeof recipe.adaptation_note === 'string' && recipe.adaptation_note.trim()
    ? [`改编说明: ${sanitizePromptText(recipe.adaptation_note, 400)}`] : [];
  const profileLines = profile ? [
    `受控完整主餐资格: ${sanitizePromptText(profile.id, 100)}`,
    '完整性依据: 红扁豆、土豆和番茄已经组成完整主餐。',
    '安全生成顺序: 同一口锅先处理土豆和番茄，再加入红扁豆和水炖熟；不得先把红扁豆放入另一口锅预煮，也不得倒锅。',
    '稻米过敏安全模式: 严格沿用这张基础菜谱，不得添加或建议搭配任何额外主食。',
    '用户可见 JSON 字段只使用正向描述，不得复述用户的过敏原名称或列举被排除的食物；完整性统一写成“红扁豆、土豆和番茄组成完整主餐”。',
  ] : [];
  const ingredientWhitelist = trustedRecipeIngredientWhitelist(selection);
  const liquidOptions = filterTrustedOptionsByDislikes(trustedRecipeLiquidOptions(recipe), dislikes, aliases);
  const fatOptions = trustedRecipeFatOptions(selection);
  const liquidRule = liquidOptions.length
    ? `本次留在成品中的主烹调液体只能使用: ${compactRecipeList(liquidOptions)}。${liquidOptions.includes('水') ? '不得加入任何高汤或第二种主液体。' : '不得另加水或第二种高汤。'}`
    : '本次未批准额外水或高汤，两个字段都不得添加。';
  const fatRule = fatOptions.length
    ? `本次批准的烹调油脂只有: ${compactRecipeList(fatOptions)}。不得另加食用油或第二种油脂。`
    : '本次未批准额外烹调油脂，两个字段都不得添加食用油或其他油脂。';
  return [
    '【可信基础菜谱】',
    `菜谱家族: ${sanitizePromptText(family.id || recipe.family_id || 'unknown', 100)} ${sanitizePromptText(family.name, 100)}`.trim(),
    `基础菜谱: ${sanitizePromptText(recipe.id || 'unknown', 100)} ${sanitizePromptText(recipe.name, 100)}`.trim(),
    ...timeLines,
    `固定核心: ${compactRecipeList(recipe.core_ingredients)}`,
    `只允许以下替换: ${compactRecipeList(slots)}`,
    `不鼓励: ${compactRecipeList(discouraged)}`,
    `关键技法: ${compactRecipeList(recipe.technique)}`,
    `比例规则: ${compactRecipeList(recipe.ratio_rules)}`,
    `安全规则: ${compactRecipeList(recipe.safety_rules)}`,
    ...adaptationLines,
    `已选库存: ${compactRecipeList(selection?.usedPantry)}`,
    `舍弃库存: ${compactRecipeList(selection?.unusedPantry)}`,
    ...profileLines,
    '【输出完整性契约】',
    `可入锅食材白名单仅由固定核心、生产配料锁和已选库存组成: ${compactRecipeList([...new Set(ingredientWhitelist)])}。白名单外只可加入有数字克数的盐、胡椒和小用量香辛料；水、高汤和烹调油脂必须在白名单内才能使用。`,
    liquidRule,
    fatRule,
    '步骤禁止提前、预先、事先、隔夜、过夜准备，也不得假定食材已经是已泡好、已浸泡或已预煮状态；所有处理必须在本次总时长内完成。',
    '除获准免提的小用量香辛料外，每个 ingredients[].name 必须至少在一个 steps[] 步骤中出现；优先逐字使用食材表名称。若做法改变形态，同一步必须同时写原名和形态，例如“鸡胸肉切成鸡丝”“大蒜切成蒜末”。',
    '白名单内的烹调油脂、主烹调液体、盐和胡椒都必须在 ingredients 有同义 name 和大于0的数字 grams，并在 steps 明确使用；洗、淘后明确倒掉的水可不列。泡发水、浸泡水或浸泡液若保留进成品，必须计入总液体克数并列入 ingredients；未计量的泡发水或浸泡液不得保留。',
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

function validationSmallSeasoning(name) {
  const norm = validationFormName(name).replace(/\(.*?\)/g, '');
  return validationSeasoning(name)
    || /^(?:大蒜(?:末|蓉|泥|片)?|咖喱粉|五香粉|孜然粉|花椒粉|辣椒粉|姜黄粉|肉桂粉|豆蔻粉)$/.test(norm);
}

function validationHighRiskIngredient(name, canonical) {
  const text = validationFormName(name);
  if (/^(?:大豆|植物|豌豆|小麦|乳清)蛋白(?:块|粒|粉)?$/.test(text)) return false;
  return /(?:禽|鸡|鸭|猪|虾|蟹|贝|鱼|蛋)/.test(`${name}${canonical}`);
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

const VALIDATION_RICE_ALLERGEN_ACTIVATORS = new Set([
  '大米', '白米', '糙米', '糯米', '粳米', '籼米', '黑米', '紫米', '红米',
  '米饭', '白米饭', '糙米饭', '糯米饭', '黑米饭', '紫米饭',
  '剩米饭', '隔夜米饭', '即食米饭',
]);
const VALIDATION_RICE_ALLERGEN_TOKENS = [
  '隔夜米饭', '即食米饭', '剩余米饭', '糙米饭', '糯米饭', '黑米饭', '紫米饭', '白米饭', '剩米饭',
  '大米粥', '糙米粥', '糙米粉',
  '煲仔饭', '盖浇饭', '咖喱饭', '香料饭', '番茄饭',
  '大米', '白米', '糙米', '糯米', '粳米', '籼米', '黑米', '紫米', '红米',
  '米饭', '白粥', '米粥', '米粉', '米浆', '米糊', '米线', '河粉', '米皮',
  '年糕', '糍粑', '饭团', '焖饭', '炒饭', '烩饭', '泡饭', '汤饭', '菜饭', '丼饭',
].sort((a, b) => b.length - a.length);
const VALIDATION_RICE_GENERIC_PREFIX_BLOCK_RE = /(?:小|玉|薏|粱)$/;
const VALIDATION_RICE_RAW_TOKEN_SUFFIX_BLOCK_RE = /^(?:椒|醋|酒)/;
const VALIDATION_RICE_ALLERGEN_NEGATION_RE = /(?:不(?:使用|含|要|放|加|配|吃|选|用)|无需(?:使用|加入|搭配)?|避免(?:使用|选择|加入|搭配)?|去掉|排除|无)(?:任何|额外|所有|全部)?$/;
const VALIDATION_RICE_GENERIC_TOKENS = new Set(['米饭', '米粥', '米粉', '米浆', '米糊', '米线']);
const VALIDATION_RICE_RAW_TOKENS = new Set([
  '大米', '白米', '糙米', '糯米', '粳米', '籼米', '黑米', '紫米', '红米',
]);

function validationRiceAllergenActive(dislikes, aliases) {
  return recipeConstraintList(dislikes).some(name => {
    const bare = baseRecipeIngredient(name);
    const canonical = validationCanonicalIngredient(name, aliases);
    return canonical === '大米' || VALIDATION_RICE_ALLERGEN_ACTIVATORS.has(bare);
  });
}

function validationRiceAllergenFields(meal) {
  const fields = [];
  const push = (value, display = '') => {
    if (typeof value !== 'string') return;
    const text = validationFormName(value);
    if (text) fields.push({ text, display });
  };
  push(meal?.dish_name);
  if (Array.isArray(meal?.ingredients)) {
    for (const item of meal.ingredients) {
      if (typeof item === 'string') push(item, item.trim());
      else if (item && typeof item === 'object' && typeof item.name === 'string') {
        push(item.name, item.name.trim());
      }
    }
  }
  if (Array.isArray(meal?.steps)) for (const step of meal.steps) push(step);
  push(meal?.note);
  push(meal?.taste_preview);
  push(meal?.form);
  push(meal?.why);
  if (Array.isArray(meal?.flavor_tags)) for (const tag of meal.flavor_tags) push(tag);
  return fields;
}

function validationRiceAllergenTokenBlocked(text, index, token, strictVisible = false) {
  const prefix = text.slice(Math.max(0, index - 18), index);
  const suffix = text.slice(index + token.length);
  if (!strictVisible && VALIDATION_RICE_ALLERGEN_NEGATION_RE.test(prefix)) return true;
  if (VALIDATION_RICE_GENERIC_TOKENS.has(token)
    && VALIDATION_RICE_GENERIC_PREFIX_BLOCK_RE.test(prefix)) return true;
  if (VALIDATION_RICE_RAW_TOKENS.has(token)
    && VALIDATION_RICE_RAW_TOKEN_SUFFIX_BLOCK_RE.test(suffix)) return true;
  return false;
}

function validationRiceAllergenMatches(text, strictVisible = false) {
  const matches = [];
  for (let index = 0; index < text.length;) {
    const token = VALIDATION_RICE_ALLERGEN_TOKENS.find(candidate => text.startsWith(candidate, index));
    if (!token) {
      index += 1;
      continue;
    }
    if (!validationRiceAllergenTokenBlocked(text, index, token, strictVisible)) matches.push(token);
    index += token.length;
  }
  return matches;
}

function validationRiceAllergenFlags(meal, dislikes, aliases, strictVisible = false) {
  if (!validationRiceAllergenActive(dislikes, aliases)) return [];
  const flags = [];
  const seen = new Set();
  for (const field of validationRiceAllergenFields(meal)) {
    const matches = validationRiceAllergenMatches(field.text, strictVisible);
    if (!matches.length) continue;
    const displays = field.display ? [field.display] : matches;
    for (const display of displays) {
      const flag = `allergen_present:${display}`;
      if (!seen.has(flag)) {
        seen.add(flag);
        flags.push(flag);
      }
    }
  }
  return flags;
}

const VALIDATION_COOKING_OIL_NAMES = new Set([
  '烹调油', '植物油', '食用油', '食用植物油', '蔬菜油', '菜籽油', '花生油', '大豆油', '玉米油',
  '橄榄油', '葵花籽油', '葵花油', '米糠油', '稻米油', '色拉油', '调和油', '芝麻油', '香油', '猪油', '牛油', '黄油',
  '椰子油', '棕榈油', '葡萄籽油', '亚麻籽油',
]);
const VALIDATION_SALT_NAMES = new Set(['盐', '食盐', '海盐', '低钠盐']);
const VALIDATION_PEPPER_NAMES = new Set(['胡椒', '胡椒粉', '黑胡椒', '黑胡椒粉', '白胡椒', '白胡椒粉']);
const VALIDATION_WATER_NAMES = new Set(['水', '清水', '饮用水', '凉开水', '温水', '热水']);
const VALIDATION_SALT_TOKEN_SOURCE = '(?:食盐|海盐|低钠盐|盐)(?!水)';
const VALIDATION_PEPPER_TOKEN_SOURCE = '(?:黑胡椒粉|白胡椒粉|胡椒粉|黑胡椒|白胡椒|胡椒)';
const VALIDATION_SEASONING_TOKEN_SOURCE = `(?:${VALIDATION_SALT_TOKEN_SOURCE}|${VALIDATION_PEPPER_TOKEN_SOURCE})`;
const VALIDATION_SEASONING_INPUT_RE = new RegExp(
  `(?:加入?|放入?|撒入?|撒上?|调入?|拌入?|下)(?:根据口味|按口味|少许|适量|一点|些许)?${VALIDATION_SEASONING_TOKEN_SOURCE}`
  + `(?:(?:和|及|、)${VALIDATION_SEASONING_TOKEN_SOURCE})*(?:调味)?`
  + `|(?:用)?(?:少许|适量|一点|些许)?${VALIDATION_SEASONING_TOKEN_SOURCE}`
  + `(?:(?:和|及|、)${VALIDATION_SEASONING_TOKEN_SOURCE})*调味`,
);
const VALIDATION_SEASONING_NEGATION_RE = /(?:不(?:加|放|撒|用|要)?|无|免)(?:任何|额外|少许|适量)?$/;
const VALIDATION_SALT_TOKEN_RE = new RegExp(VALIDATION_SALT_TOKEN_SOURCE);
const VALIDATION_PEPPER_TOKEN_RE = new RegExp(VALIDATION_PEPPER_TOKEN_SOURCE);
const VALIDATION_RETAINED_WATER_ACTION_RE = /(?:加入?|倒入?|放入?|添入?|注入?|兑入?|补入?|加)(?:[^，,。；;！？!?]{0,32}?)(?:饮用水|凉开水|温水|热水|清水|水)(?!淀粉|果|油|产)/g;
const VALIDATION_RETAINED_SOAKING_LIQUID_RE = /(?:保留|留用|留下|不(?:要)?倒掉)(?:[^，,。；;！？!?]{0,20}?)(?:泡发水|浸泡水|泡豆水|泡菇水|浸泡液|泡发液)/g;
const VALIDATION_WATER_DISCARD_RE = /(?:倒掉|弃去|滤掉|沥干|倒出)/;
const VALIDATION_NEXT_CLAUSE_WATER_DISCARD_RE = /^(?:(?:再|然后|随后|接着))?(?:(?:将|把)(?:焯水|水|汤|汤汁|液体)(?:全部)?(?:倒掉|弃去|滤掉|倒出)|(?:倒掉|弃去|滤掉|倒出)(?:焯水|水|汤|汤汁|液体)|沥干)/;
const VALIDATION_COOKING_OIL_ACTION_RE = new RegExp(
  `(?:热油(?!菜)|(?:加入?|下|倒入?|放入?|淋入?|刷上?|抹上?|(?<!食)用|留底)(?:少许|适量|一点|些许)?(?:${[...VALIDATION_COOKING_OIL_NAMES].sort((a, b) => b.length - a.length).join('|')}|油)(?!菜))`,
);
const VALIDATION_GENERIC_COOKING_OIL_ACTION_RE = /(?:热油(?!菜)|(?:加入?|下|倒入?|放入?|淋入?|刷上?|抹上?|(?<!食)用|留底)(?:少许|适量|一点|些许)?油(?!菜))/;
const VALIDATION_ACTION_NEGATION_RE = /(?:不需要|无需|不用|不要|避免|禁止|切勿|不可|未|不)(?:(?:再|另行)?(?:另(?:起|取|用)(?:一口|一只|一个|一)?|使用|用|加|放|下|倒入?|刷上?|抹上?|留底)?)?$/;
const VALIDATION_EXPLICIT_SECOND_VESSEL_RE = /(?:另(?:起|取|用)(?:一口|一只|一个|一)?|另(?:一口|一只|一个)|第二口)(?:小锅|炒锅|平底锅|汤锅|锅)/;
const VALIDATION_NAMED_VESSEL_NEGATION_RE = /(?:不要|不用|无需|避免|禁止)(?:再|另起|另取|另用|另一口|另一个|另外一个|第二口)?$/;
const VALIDATION_ADVANCE_PREP_RE = /(?:提前|预先|事先|隔夜|过夜|头天|前一(?:天|晚)|已(?:经)?(?:泡好|浸泡好|煮好|预煮好|蒸好|焖好)|(?:浸泡|泡发)[^，,。；;！？!?]{0,12}\d+(?:\.\d+)?\s*小时)/g;
const VALIDATION_ADVANCE_PREP_NEGATION_RE = /(?:不需要|无需|不用|不必|不需|不要|避免|禁止|切勿)(?:任何)?$/;

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

function validationHasAdvancePrep(steps) {
  for (const step of steps) {
    for (const match of String(step || '').matchAll(new RegExp(VALIDATION_ADVANCE_PREP_RE.source, 'g'))) {
      const prefix = String(step || '').slice(Math.max(0, match.index - 12), match.index);
      if (!VALIDATION_ADVANCE_PREP_NEGATION_RE.test(prefix)) return true;
    }
  }
  return false;
}

function validationApprovedIngredientSet(selection, aliases) {
  const recipe = selection?.recipe;
  if (!recipe || !trustedRecipeStatus(recipe.status)) return null;
  return new Set([
    ...(Array.isArray(recipe.core_ingredients) ? recipe.core_ingredients : []),
    ...trustedRecipeGenerationOptions(recipe),
    ...trustedRecipeLiquidOptions(recipe),
    ...(Array.isArray(selection?.usedPantry) ? selection.usedPantry : []),
  ].map(name => validationCanonicalIngredient(name, aliases)).filter(Boolean));
}

function validationIngredientOutsideApprovedBoundary(name, approved, aliases) {
  if (!approved) return false;
  if (validationSmallSeasoning(name)) return false;
  if (validationIngredientMatchesNames(name, VALIDATION_SALT_NAMES)
    || validationIngredientMatchesNames(name, VALIDATION_PEPPER_NAMES)) return false;
  const canonical = validationCanonicalIngredient(name, aliases);
  return Boolean(canonical && !approved.has(canonical));
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
  if (VALIDATION_SALT_NAMES.has(bare)) return [...VALIDATION_SALT_NAMES];
  if (VALIDATION_PEPPER_NAMES.has(bare)) return [...VALIDATION_PEPPER_NAMES];
  if (VALIDATION_WATER_NAMES.has(bare)) return [...VALIDATION_WATER_NAMES];
  if (bare.includes('白芸豆') && /(?:罐头|罐装|沥干)/.test(normalized)) return ['白芸豆'];
  if (bare.includes('白豆') && /(?:罐头|罐装|沥干)/.test(normalized)) return ['白豆'];
  return [];
}

function validationPreparedHighRiskExemption(name) {
  return /^(?:鸡高汤|高汤\(鸡高汤\)|浓缩鸡汤|皮蛋)$/.test(validationFormName(name));
}

function validationCookingOilIngredient(name) {
  const bare = validationFormName(name).replace(/\(.*?\)/g, '');
  return bare === '油' || VALIDATION_COOKING_OIL_NAMES.has(bare);
}

function validationStepUsesCookingOil(step) {
  const text = validationFormName(step);
  return validationActiveActionMatches(text, VALIDATION_COOKING_OIL_ACTION_RE).length > 0;
}

function validationIngredientMatchesNames(name, names) {
  const bare = validationFormName(name).replace(/\(.*?\)/g, '');
  return names.has(bare);
}

function validationStepUsesSeasoningGroup(step, tokenRe) {
  const text = validationFormName(step);
  for (const match of text.matchAll(new RegExp(VALIDATION_SEASONING_INPUT_RE.source, 'g'))) {
    if (!validationActionNegated(text, match.index) && tokenRe.test(match[0])) return true;
  }
  for (const match of text.matchAll(new RegExp(tokenRe.source, 'g'))) {
    const prefix = text.slice(Math.max(0, match.index - 48), match.index);
    if (VALIDATION_SEASONING_NEGATION_RE.test(prefix)) continue;
    const clausePrefix = prefix.slice(Math.max(
      prefix.lastIndexOf('，'), prefix.lastIndexOf(','), prefix.lastIndexOf('。'), prefix.lastIndexOf('；'),
      prefix.lastIndexOf(';'), prefix.lastIndexOf('！'), prefix.lastIndexOf('!'), prefix.lastIndexOf('？'), prefix.lastIndexOf('?'),
    ) + 1);
    if (/(?:加入?|倒入?|放入?|撒入?|撒上?|调入?|拌入?|下|用)/.test(clausePrefix)) return true;
  }
  return false;
}

function validationStepUsesRetainedWater(step) {
  const text = validationFormName(step);
  const clauses = text.split(/[，,。；;！？!?]+/).filter(Boolean);
  for (let clauseIndex = 0; clauseIndex < clauses.length; clauseIndex += 1) {
    const clause = clauses[clauseIndex];
    for (const match of clause.matchAll(new RegExp(VALIDATION_RETAINED_SOAKING_LIQUID_RE.source, 'g'))) {
      if (!validationActionNegated(clause, match.index)) return true;
    }
    for (const match of clause.matchAll(new RegExp(VALIDATION_RETAINED_WATER_ACTION_RE.source, 'g'))) {
      if (validationActionNegated(clause, match.index)) continue;
      const waterEnd = match.index + match[0].length;
      const discardedInClause = VALIDATION_WATER_DISCARD_RE.test(clause.slice(waterEnd));
      const discardedNext = VALIDATION_NEXT_CLAUSE_WATER_DISCARD_RE.test(clauses[clauseIndex + 1] || '');
      if (!discardedInClause && !discardedNext) return true;
    }
  }
  return false;
}

function validationSearchTokens(name, aliases) {
  const canonical = validationCanonicalIngredient(name, aliases);
  const targetBare = validationFormName(name).replace(/\(.*?\)/g, '');
  const tokens = new Set([baseRecipeIngredient(name), canonical, ...validationControlledTokens(name)].filter(Boolean));
  if (aliases && typeof aliases === 'object') {
    for (const alias of Object.keys(aliases)) {
      const aliasToken = baseRecipeIngredient(alias);
      const conflictingPepperColor = targetBare === '红甜椒'
        && /^(?:青椒|彩椒|(?:[黄绿橙紫白黑蓝]|彩色|多彩|五彩)甜椒)$/.test(aliasToken);
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
    const blockedConsumableCompound = (token === '盐' && /^水/.test(tokenSuffix))
      || (token === '水' && /^(?:淀粉|果|油|产)/.test(tokenSuffix));
    const blockedControlledForm = (['白蘑菇', '干黑眼豆', '红甜椒', '蘑菇', '黑眼豆', '甜椒'].includes(token)
      && /^(?:酱|粉|汤料)/.test(tokenSuffix))
      || (token === '蘑菇' && /[白毒]/.test(tokenPrefix))
      || (token === '黑眼豆' && tokenPrefix === '干')
      || (token === '甜椒' && /[红青黄绿橙紫白黑蓝彩色]/.test(tokenPrefix));
    if (!negated && !blockedShortForm && !blockedGarlicGreen && !blockedChickenSpecies && !blockedGenericMeatForm
      && !blockedPorkSpecies && !blockedCookingOil && !blockedConsumableCompound && !blockedControlledForm) positions.push(index);
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
const VALIDATION_HEATING_ACTION_RE = /(?:加热|煮|炒|煎|焖|炖|蒸|烤|烧|汆|烫)/;
const VALIDATION_PREP_ONLY_ACTION_RE = /(?:切块|切丁|切片|切丝|切末|改刀|切)/;
const VALIDATION_COOKED_NEGATION_RE = /(?:并非|不是|仍不|尚未|还未|还没|未|没有|没能|不能|无法)(?:已经|已|完全|彻底|真正|实际)*(?:达到|达|确认|保证)?$/;
const VALIDATION_UNHEATED_RELATION_RE = /(?:备用|放一旁|最后拌入|出锅后加入|盛出后加入|装盘后加入)/;
const VALIDATION_DELAYED_ADD_RE = /(?:后加入|后放入|后拌入|再加入|再放入|再拌入)$/;
const VALIDATION_FUTURE_COOKING_SUFFIX_RE = /^(?:需(?:要)?后续|稍后|待会(?:儿)?|之后再|后续再?|随后再)/;
const VALIDATION_INCOMPLETE_COOKING_SUFFIX_RE = /^(?:(?:的)?(?:状态|标准|程度)?(?:仍|还|尚)?(?:未|没)(?:完全|彻底|真正|实际)?(?:达到|达成|确认|实现)?|(?:的)?(?:状态|标准|目标)?(?:仍|还|尚)?(?:预计|预期|计划|准备)(?:达到|达成|确认|实现)?)/;
const VALIDATION_PLANNED_COOKED_PREFIX_RE = /应(?:当|该)?$/;
const VALIDATION_FUTURE_COOKING_MARKER_RE = /(?:需(?:要)?后续|稍后|待会(?:儿)?|之后再|后续再?|随后再|(?:未来|将来)(?:应|要|会|将|需)?|(?:预计|预期|计划|准备)(?:会|要|将|达到|达成|确认|实现|煮至|煮到|煮|炒|焖|炖|蒸|烧|加热)?|应(?:当|该)?(?:再)?(?:达到|达成|确认|实现|煮至|煮到|煮|炒|焖|炖|蒸|烧|加热))/;
const VALIDATION_EGG_NOT_COAGULATED_RE = /(?:鸡蛋|蛋液|蛋黄)(?:仍|还|尚|依然)?(?:未|没(?:有)?)(?:完全|充分|彻底)?凝固/g;
const VALIDATION_EGG_SOFT_STATE_RE = /(?:流心|溏心|半熟)/g;
const VALIDATION_EGG_SOFT_STATE_NEGATION_RE = /(?:不是|没有|不再|不|无|非|避免|防止|拒绝|杜绝|不要|不得|不可|不能|切勿|别)(?:做成?|成为|出现|保持|带有|有)?$/;
const VALIDATION_EGG_SOFT_STATE_SUBJECT_RE = /(?:鸡蛋|蛋液|蛋黄)(?:仍|还|尚|依然|略|微|稍|有点|呈|为|保持|处于|达到|至|到)?$/;
const VALIDATION_EGG_SAFE_RECOVERY_STATE_RE = /(?:(?:蛋白(?:和|与|及|、)蛋黄)|蛋黄|鸡蛋|蛋液)(?:均|都|已经|已)?(?:完全|充分|彻底)凝固|(?:鸡蛋|蛋液|蛋黄)(?:已经|已)?(?:不再|没有|不是)流心(?:蛋)?/;
const VALIDATION_EGG_HEATING_ACTION_RE = /(?:再(?:继续)?|继续|重新|随后|然后)?(?:加热|煮|焖|蒸|炒|煎)/g;
const VALIDATION_EGG_PLANNED_HEATING_PREFIX_RE = /(?:计划|预计|预期|准备)(?:稍后|随后|之后|后续)?(?:要|将|会)?$/;
const VALIDATION_EGG_RECOVERY_WINDOW = 24;
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
    const futureSuffix = text.slice(cookedEnd, cookedEnd + 16);
    if (VALIDATION_FUTURE_COOKING_MARKER_RE.test(futurePrefix)
      || VALIDATION_FUTURE_COOKING_SUFFIX_RE.test(futureSuffix)) continue;
    if (VALIDATION_PLANNED_COOKED_PREFIX_RE.test(futurePrefix)
      && /^(?:煮熟|煎熟|炒熟|焖熟|炖熟|蒸熟|熟透|熟)/.test(cooked[0])) continue;
    if (VALIDATION_INCOMPLETE_COOKING_SUFFIX_RE.test(futureSuffix)) continue;
    if (VALIDATION_COOKED_NEGATION_RE.test(cookedPrefix)) continue;
    if (VALIDATION_PREP_ONLY_ACTION_RE.test(text) && !VALIDATION_HEATING_ACTION_RE.test(text)) continue;
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

function validationOrdinaryEggIngredient(name, aliases) {
  const bare = validationFormName(name).replace(/\(.*?\)/g, '');
  const canonical = validationCanonicalIngredient(name, aliases);
  return bare === '鸡蛋' || bare === '蛋液' || canonical === '鸡蛋' || canonical === '蛋液';
}

function validationOrdinaryEggIncompleteStates(text) {
  const states = [...text.matchAll(VALIDATION_EGG_NOT_COAGULATED_RE)]
    .map(match => ({ index: match.index, end: match.index + match[0].length }));
  for (const match of text.matchAll(VALIDATION_EGG_SOFT_STATE_RE)) {
    const prefix = text.slice(Math.max(0, match.index - 16), match.index);
    const suffix = text.slice(match.index + match[0].length, match.index + match[0].length + 4);
    if (VALIDATION_EGG_SOFT_STATE_NEGATION_RE.test(prefix)) continue;
    const standaloneEggState = /^蛋/.test(suffix)
      || (match[0] === '溏心' && /^(?:状态|程度)/.test(suffix));
    if (!VALIDATION_EGG_SOFT_STATE_SUBJECT_RE.test(prefix) && !standaloneEggState) continue;
    states.push({ index: match.index, end: match.index + match[0].length });
  }
  return states.sort((a, b) => a.index - b.index);
}

function validationOrdinaryEggSafeRecovery(tail, name, aliases, ingredientNames) {
  const target = validationCanonicalIngredient(name, aliases);
  const otherIngredients = ingredientNames
    .filter(other => validationCanonicalIngredient(other, aliases) !== target);
  const clauses = tail.split(/[，,。；;！！？!?]+/).map(clause => clause.trim()).filter(Boolean);
  for (const clause of clauses) {
    const stateRe = new RegExp(VALIDATION_EGG_SAFE_RECOVERY_STATE_RE.source, 'g');
    for (const state of clause.matchAll(stateRe)) {
      const actionStart = Math.max(0, state.index - VALIDATION_EGG_RECOVERY_WINDOW);
      const actionWindow = clause.slice(actionStart, state.index);
      const actions = [...actionWindow.matchAll(VALIDATION_EGG_HEATING_ACTION_RE)];
      if (!actions.length) continue;
      const action = actions[actions.length - 1];
      const actionIndex = actionStart + action.index;
      if (validationActionNegated(clause, actionIndex)) continue;
      const plannedPrefix = clause.slice(Math.max(0, actionIndex - 16), actionIndex);
      if (VALIDATION_EGG_PLANNED_HEATING_PREFIX_RE.test(plannedPrefix)) continue;
      const actionEnd = actionIndex + action[0].length;
      const actionPrefix = clause.slice(0, actionEnd);
      const bindingSpan = clause.slice(actionIndex, state.index + state[0].length);
      const eggNamedBeforeAction = /(?:鸡蛋|蛋液|蛋黄)/.test(actionPrefix);
      const otherNamedBeforeAction = otherIngredients
        .some(other => validationStepMentions(actionPrefix, other, aliases));
      const otherNamedInBindingSpan = otherIngredients
        .some(other => validationStepMentions(bindingSpan, other, aliases));
      if (otherNamedInBindingSpan || (otherNamedBeforeAction && !eggNamedBeforeAction)) continue;
      return true;
    }
  }
  return false;
}

function validationOrdinaryEggUnsafeFinalState(name, steps, aliases, ingredientNames) {
  if (!validationOrdinaryEggIngredient(name, aliases)) return false;
  const text = steps.map(step => validationFormName(step)).join('。');
  const states = validationOrdinaryEggIncompleteStates(text);
  if (!states.length) return false;
  const tail = text.slice(states[states.length - 1].end);
  return !validationOrdinaryEggSafeRecovery(tail, name, aliases, ingredientNames);
}

function validationHighRiskCooked(name, steps, aliases, ingredientNames) {
  if (validationOrdinaryEggUnsafeFinalState(name, steps, aliases, ingredientNames)) return false;
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
      const prepOnlyTargetClause = VALIDATION_PREP_ONLY_ACTION_RE.test(validationFormName(clause))
        && !VALIDATION_HEATING_ACTION_RE.test(validationFormName(clause));
      if (next && !nextNamesAnotherIngredient
        && !(prepOnlyTargetClause && !VALIDATION_HEATING_ACTION_RE.test(validationFormName(next)))
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
  const riceAllergenActive = validationRiceAllergenActive(constraints?.dislikes, aliases);
  const strictRiceVisible = riceAllergyCompleteMainActive(selection);
  for (const flag of validationRiceAllergenFlags(
    meal,
    constraints?.dislikes,
    aliases,
    strictRiceVisible,
  )) flags.add(flag);
  if (ingredientNames.length > 12) flags.add('ingredient_count_exceeds_ui_limit');
  const canonicalIngredients = new Set(ingredientNames.map(name => validationCanonicalIngredient(name, aliases)).filter(Boolean));
  // 忌口泄漏检查与选菜共用 matchAllergy(双向子串 + 类别扩展)。
  const dislikeTerms = recipeConstraintList(constraints?.dislikes);
  const approvedIngredients = validationApprovedIngredientSet(selection, aliases);
  const requiredIngredients = new Set([
    ...(Array.isArray(selection?.recipe?.core_ingredients) ? selection.recipe.core_ingredients : []),
    ...(Array.isArray(selection?.usedPantry) ? selection.usedPantry : []),
  ].map(name => validationCanonicalIngredient(name, aliases)).filter(Boolean));
  const structuralConsumables = new Set([
    ...trustedRecipeLiquidOptions(selection?.recipe || {}),
    ...trustedRecipeFatOptions(selection),
  ].map(name => validationCanonicalIngredient(name, aliases)).filter(Boolean));
  const optionalIngredients = new Set();
  for (const name of ingredientNames) {
    if (validationIngredientMatchesNames(name, VALIDATION_WATER_NAMES)
      || validationIngredientMatchesNames(name, VALIDATION_SALT_NAMES)) continue;
    const canonical = validationCanonicalIngredient(name, aliases);
    if (canonical && !requiredIngredients.has(canonical) && !structuralConsumables.has(canonical)) {
      optionalIngredients.add(canonical);
    }
  }
  if (trustedRecipeStatus(selection?.recipe?.status) && optionalIngredients.size > 4) {
    flags.add('optional_ingredient_limit_exceeded');
  }
  for (const slot of Array.isArray(selection?.recipe?.substitution_slots) ? selection.recipe.substitution_slots : []) {
    const replaces = Array.isArray(slot?.replaces) ? slot.replaces : [];
    const allowed = (Array.isArray(slot?.allowed) ? slot.allowed : [])
      .filter(name => !/^不(?:放|加|用)/.test(String(name || '').trim()));
    const replaceForms = new Set(replaces.map(baseRecipeIngredient).filter(Boolean));
    const allowedForms = new Set(allowed.map(baseRecipeIngredient).filter(Boolean));
    const replaceCanonical = new Set(replaces.map(name => validationCanonicalIngredient(name, aliases)).filter(Boolean));
    const allowedCanonical = new Set(allowed.map(name => validationCanonicalIngredient(name, aliases)).filter(Boolean));
    const slotSide = name => {
      const form = baseRecipeIngredient(name);
      if (replaceForms.has(form)) return 'original';
      if (allowedForms.has(form)) return 'alternative';
      const value = validationCanonicalIngredient(name, aliases);
      if (replaceCanonical.has(value) && !allowedCanonical.has(value)) return 'original';
      if (allowedCanonical.has(value) && !replaceCanonical.has(value)) return 'alternative';
      return '';
    };
    const originalsPresent = new Set(ingredientNames.filter(name => slotSide(name) === 'original').map(baseRecipeIngredient));
    const alternativesPresent = new Set(ingredientNames.filter(name => slotSide(name) === 'alternative').map(baseRecipeIngredient));
    if ((originalsPresent.size > 0 && alternativesPresent.size > 0) || alternativesPresent.size > 1) {
      flags.add(`substitution_slot_conflict:${sanitizePromptText(slot?.slot || '未命名', 80)}`);
    }
  }

  for (const name of ingredientNames) {
    const canonical = validationCanonicalIngredient(name, aliases);
    const directRiceIngredient = riceAllergenActive
      && validationRiceAllergenMatches(validationFormName(name), strictRiceVisible).length > 0;
    if (!directRiceIngredient && dislikeTerms.some(term => matchAllergy(term, name, aliases))) {
      flags.add(`allergen_present:${name}`);
    }
    if (!validationSeasoning(name) && !steps.some(step => validationStepMentions(step, name, aliases))) {
      flags.add(`ingredient_missing_in_steps:${name}`);
    }
    if (validationIngredientOutsideApprovedBoundary(name, approvedIngredients, aliases)) {
      flags.add(`unapproved_ingredient:${name}`);
    }
    if (!validationPreparedHighRiskExemption(name) && validationHighRiskIngredient(name, canonical)) {
      const cooked = validationHighRiskCooked(name, steps, aliases, ingredientNames);
      if (!cooked) flags.add(`high_risk_not_cooked:${name}`);
    }
  }
  if (validationHasAdvancePrep(steps)) flags.add('advance_prep_step');
  const consumableGroups = [
    ['step_ingredient_missing:烹调油', validationCookingOilIngredient, validationStepUsesCookingOil],
    [
      'step_ingredient_missing:盐',
      name => validationIngredientMatchesNames(name, VALIDATION_SALT_NAMES),
      step => validationStepUsesSeasoningGroup(step, VALIDATION_SALT_TOKEN_RE),
    ],
    [
      'step_ingredient_missing:胡椒',
      name => validationIngredientMatchesNames(name, VALIDATION_PEPPER_NAMES),
      step => validationStepUsesSeasoningGroup(step, VALIDATION_PEPPER_TOKEN_RE),
    ],
    [
      'step_ingredient_missing:水',
      name => validationIngredientMatchesNames(name, VALIDATION_WATER_NAMES),
      validationStepUsesRetainedWater,
    ],
  ];
  for (const [flag, ingredientMatches, stepUses] of consumableGroups) {
    if (!ingredientNames.some(ingredientMatches) && steps.some(stepUses)) flags.add(flag);
  }

  for (const item of Array.isArray(selection?.usedPantry) ? selection.usedPantry : []) {
    if (!ingredientNames.some(name => ingredientMatchesRecipeRequirement(name, item, aliases))) {
      flags.add(`used_pantry_missing:${item}`);
    }
  }
  for (const item of Array.isArray(selection?.unusedPantry) ? selection.unusedPantry : []) {
    if (ingredientNames.some(name => ingredientMatchesRecipeRequirement(name, item, aliases))) {
      flags.add(`unused_pantry_used:${item}`);
    }
  }

  const recipe = selection?.recipe || {};
  const usedPantry = Array.isArray(selection?.usedPantry) ? selection.usedPantry : [];
  const anchors = recipeConstraintList(recipe.core_ingredients).map(requirement => (
    usedPantry.find(item => pantryItemSatisfiesCoreRequirement(item, requirement, recipe, aliases)) || requirement
  ));
  for (const item of usedPantry) {
    if (!anchors.some(anchor => ingredientMatchesRecipeRequirement(item, anchor, aliases))) anchors.push(item);
  }
  const requiredAnchorHits = Math.min(2, anchors.length);
  const anchorHits = anchors.filter(anchor => (
    ingredientNames.some(name => ingredientMatchesRecipeRequirement(name, anchor, aliases))
  )).length;
  if (anchorHits < requiredAnchorHits) flags.add('base_recipe_anchor_missing');
  const namedVessels = new Set();
  for (const step of steps) {
    const clauses = String(step).replace(/\s+/g, '').split(/[，,。；;！！？?]+/).filter(Boolean);
    for (const clause of clauses) {
      const vessels = [...clause.matchAll(/(?:电饭锅|高压锅|平底锅|炒锅|汤锅|砂锅|蒸锅|大锅|小锅)/g)];
      if (vessels.length > 1 && /(?:或|或者|任选|二选一)/.test(clause)) continue;
      for (const vessel of vessels) {
        const vesselPrefix = clause.slice(Math.max(0, vessel.index - 16), vessel.index);
        if (validationActionNegated(clause, vessel.index) || VALIDATION_NAMED_VESSEL_NEGATION_RE.test(vesselPrefix)) continue;
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
// 只跳过小用量香辛料/酸味料；油糖盐和复合酱料应尽量由权威库覆盖热量与钠。
const TW_SEASONING = new Set(['料酒','黄酒','米酒','醋','白醋','陈醋','香醋','米醋','姜','生姜','姜末','姜片','姜丝','葱','葱花','香葱','小葱','大葱','蒜','蒜末','蒜蓉','蒜泥','蒜头','咖喱粉','五香粉','十三香','胡椒粉','白胡椒','黑胡椒','胡椒','辣椒粉','干辣椒','花椒','八角','桂皮','香叶','孜然']);
function twIsSeasoning(name) { return TW_SEASONING.has(twNorm(name)) || TW_SEASONING.has(twBase(name)); }
async function enrichWithTw(meal, env, request) {
  const lib = await getTwLib(env, request);
  if (!lib.idx.size) return meal;
  let matched = 0;
  for (const ing of meal.ingredients) {
    if (twIsSeasoning(ing.name)) continue;
    const hit = twLookup(lib, ing.name);
    if (!hit) continue;
    for (const key of NUTRIENT_KEYS) if (hit[key] != null) ing[key] = hit[key];
    ing.auth = 'tw'; ing.authCode = hit.code; matched++;
  }
  meal._twMatched = matched;
  return meal;
}

const RECIPE_SYSTEM = `你是家常菜专家+营养师, 熟悉《中国居民膳食指南(2022)》。
你的任务: 按用户这一次的做饭场景和份数, 生成一道简单家常主餐(一锅/一碗即可吃完), 主食+蛋白+多种蔬菜基本齐全。
核心要求:
- 菜品形式和菜系都要轮换, 别每次都是中式菜饭。形式换着来: 菜饭/煲仔饭/焖饭、盖浇饭、日式丼饭、石锅拌饭、汤面/汤粉/汤米线、一锅炖菜/烩菜/杂烩汤、家庭一锅煮/麻辣烫式、杂粮谷物碗、咖喱烩饭、印尼炒饭式炒饭、泰式椰浆咖喱烩饭、越式/中式凉拌碗(grain bowl)等。
- 菜系也轮换: 中式家常/泰式/日式/韩式/越南/印尼/粤式 之间换着来——任何国家"一锅或一碗装、多食材、家庭可做"的主餐都符合一锅出。异国成品复合酱(绿咖喱酱/叻沙酱/甜酱油等)钠和热量不可忽略, 一律限1.5勺、其营养标 est 不当权威值现编; 能用"酱油+糖"等基础调味料替代的就替代。
- 排除真火锅, 以及需要特殊高汤/长时间备料/复杂火候的版本。
- 一锅煮 OR 电饭锅 OR 简单炒制 OR 蒸 OR 出锅后凉拌(冷制碗); 烹饪要简单可行。
- 硬约束: 总时长 <= 40 分钟, 做法 <= 4 步, 难度 <= 2; 优先电饭锅/一锅出, 不要另起锅做第二道菜。
- 营养按一顿主餐考虑; 蛋白/纤维优先, 不追求用一锅覆盖全天营养, 不要奇葩组合。
- **份量硬要求(落实到克数)**: 按用户要求的份数给整锅用量。每份主餐约500-750kcal、蛋白质约20-35g; 根据份数同比安排主食、蛋白和蔬菜, 不要生成明显吃不完的全天量。
- **不得依赖提前准备**: 步骤里禁止出现「提前煮好/提前过夜」; 主食要么把烹煮时间计入总时长, 要么明确写用剩饭或免煮快熟主食(如燕麦/快煮杂粮包)。
- **主蛋白必须轮换**: 在 鱼/虾/鸡/鸭/猪/牛/蛋/豆制品 之间换着来, 不要连续几次或总是同一种, **尤其不要默认三文鱼**; 一道菜主蛋白选 1-2 种即可。
- 食材数量要和份数、场景匹配: 1份约5-7种, 2份约6-9种, 3-4份约7-10种; 都要含主食 + 蛋白 + 至少2-4种蔬菜。
- 蔬菜按每份约150-250g安排, 在可操作的前提下尽量有不同颜色/类型。
- 菜名和 form 必须与真实主食、做法一致: 没有面条/米粉就不能叫汤面/汤粉, 用米饭做汤泡饭就明确叫汤饭或泡饭。
【冷拌/发酵碗(低频形式, 夏季或换口味时偶尔出, 约每5-6次一次)】
- 冷碗也必须是扎实主餐, 不能只有菜叶; 按份数给足主食和蛋白, 可用牛油果/芝麻酱/坚果补充口感与能量, 但不要为堆热量给出夸张用量。
- 发酵碗(区别于普通沙拉)须含一样发酵食材(辣白菜/纳豆/酸奶/豆豉)作特色; 发酵益生菌食材必须"出锅后/装碗最后一步"拌入, 不得下锅加热(否则活菌失活)。
- 钠平衡: 用了发酵高钠食材(辣白菜≤120g/豆豉≤15g)时, 额外盐归零、不再加酱油, 用柠檬汁/醋/香料提味; note 里提示"含发酵食材钠偏高, 额外盐请减半或不加"。
- 凉拌也禁止"提前煮好/过夜", 主食烹煮时间计入总时长或用剩饭/免煮快熟主食。
严格 JSON 输出, 不要 JSON 外文字。`;

const RECIPE_TEMPLATE = `生成一道【{meal_name}】简单家常主餐(一锅/一碗式, 形式见系统提示、别总是菜饭), 一共约{servings}份。整锅参考目标: 热量约{kcal}kcal、蛋白约{p}g、纤维约{fb}g。
{constraint_note}{exclude_note}
{season_note}

【强制】食材数量与{servings}份和本次场景相匹配; 每份都应吃到主食、蛋白和蔬菜, 不要为了多样性堆出难操作的配料表。

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
  "why": "<一句温和的「为什么适合这次做」, 可提到用上的食材/省事程度/口味; 别说教别堆数据>",
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
1. 双向一致：steps中的投入物都须在ingredients有同义name和数字grams，留存液体须列入ingredients数字grams；泡发/浸泡液须计入总量，未计量不得保留，倒掉可不列。除获准小量香辛料外，每个ingredient须在steps出现。ingredients有“盐”时，steps必须逐字写“加盐”；否则删除盐行。
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

// 输入硬上限: 份数与营养目标在 safeInt 之后钳到合理区间, 防异常输入撑爆 prompt。
function clampInt(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  if (dislikes.length) constraintNote += `不吃/过敏(本菜谱不得出现这些食材或明显同类): ${dislikes.join('、')}。`;

  const purpose = String(constraints.purpose || 'quick');
  const purposeNote = {
    quick: '本次重点是快点吃上: 步骤≤3、食材≤8、总时长尽量≤25分钟, 少切配、少洗锅。',
    pantry: '本次重点是清库存: 优先真正用上用户填写的食材, 只补少量常见必需食材。',
    fresh: '本次重点是换个口味: 在家常可做的前提下, 给一种和平时明显不同的菜系或形式。',
    batch: '本次重点是多做一些: 选择适合分装、冷藏或冷冻后复热的做法, 避免凉拌、生食和复热后明显变差的食材; note里用一句话给保存和复热方向, 不写绝对保质期。',
  }[purpose];
  if (purposeNote) constraintNote += purposeNote;
  if (constraints.swap_hint) {
    constraintNote += sanitizePromptText(constraints.swap_hint, 160);
  }
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
    .replaceAll('{servings}', clampInt(safeInt(constraints.servings, 2), 1, 8))
    .replace('{kcal}', clampInt(safeInt(targets.kcal, 1300), 300, 5000))
    .replace('{p}', clampInt(safeInt(targets.p, 50), 10, 300))
    .replace('{fb}', clampInt(safeInt(targets.fb, 16), 0, 100))
    .replace('{constraint_note}', constraintNote)
    .replace('{exclude_note}', excludeNote)
    .replace('{season_note}', seasonNote(new Date()));
  return prompt
    .replace(RECIPE_GROUNDING_TOKEN_RE, '')
    .replace('总时长尽量≤25分钟', '总时长尽量≤30分钟');
}

function stripJsonTrailingCommas(text) {
  let output = '';
  let inString = false;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }
    if (char === ',') {
      let next = index + 1;
      while (next < text.length && /\s/.test(text[next])) next += 1;
      if (text[next] === ']' || text[next] === '}') continue;
    }
    output += char;
  }
  return output;
}

function parseModelJson(text) {
  const raw = String(text || '').trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  try {
    return JSON.parse(raw);
  } catch (firstError) {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    const candidate = start >= 0 && end > start ? raw.slice(start, end + 1) : raw;
    if (candidate !== raw) {
      try {
        return JSON.parse(candidate);
      } catch {
        // Fall through to the bounded trailing-comma repair.
      }
    }
    const repaired = stripJsonTrailingCommas(candidate);
    if (repaired !== candidate) return JSON.parse(repaired);
    throw firstError;
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

function groundedSafetyEndpoint(name, rawRiskCategory) {
  if (rawRiskCategory === 'egg') {
    return `继续在原锅加热${name}至熟透并确保蛋白和蛋黄完全凝固且不得流心`;
  }
  if (rawRiskCategory === 'poultry_pork') {
    return `继续在原锅加热${name}至熟透，中心不见粉红`;
  }
  return `继续在原锅加热${name}至熟透`;
}

const VALIDATION_NON_RAW_HIGH_RISK_CATEGORY_RE = /(?:高汤|汤底|汤料|汤|露|酱|汁|膏|粉|精|调味料|油)$/;
const VALIDATION_EXPLICIT_UNSAFE_STATE_RE = /(?:(?:尚未|还未|仍未|还没|尚没|仍没|没(?:有)?|不|未)(?:完全|彻底|充分)?(?:预|煮|炒|煎|焖|炖|蒸|烧)?熟|半熟|[0-9零〇一二两三四五六七八九]分熟)/g;
const VALIDATION_PREPARED_STATE_MARKER_RE = /(?:即食|熟制|预熟|烟熏|罐装|罐头|熟)/;
const VALIDATION_PREPARED_HIGH_RISK_EXACT_FORMS = new Set([
  '炸鸡', '鸡肉松', '鱼丸', '鱼罐头', '虾饺', '蟹棒',
  '皮蛋', '蛋黄酱', '蛋粉', '茶叶蛋', '咸鸭蛋',
]);
const VALIDATION_RAW_EGG_FORMS = new Set([
  '鸡蛋', '蛋液', '鲜鸡蛋', '土鸡蛋', '全蛋液', '鸡蛋液',
]);
const VALIDATION_RAW_POULTRY_PORK_FORMS = new Set([
  '禽肉', '鸡肉', '鸡胸', '鸡胸肉', '鸡腿', '鸡腿肉', '去骨鸡腿肉', '鸡翅', '鸡爪', '鸡胗', '鸡肝',
  '火鸡', '火鸡肉', '鸭肉', '鸭胸', '鸭胸肉', '鸭腿', '鸭腿肉', '鹅肉',
  '猪肉', '猪里脊', '猪里脊肉', '猪瘦肉', '瘦猪肉', '猪五花肉', '五花肉', '猪排骨', '排骨',
]);
const VALIDATION_RAW_SEAFOOD_FORMS = new Set([
  '鱼', '鱼肉', '鱼片', '鲜鱼', '三文鱼', '鲑鱼', '鳕鱼', '鲈鱼', '鲫鱼', '鲤鱼', '草鱼', '黑鱼',
  '鳗鱼', '带鱼', '黄花鱼', '鲳鱼', '鲷鱼', '龙利鱼', '巴沙鱼', '金枪鱼', '鲅鱼', '青花鱼', '沙丁鱼', '秋刀鱼',
  '虾', '虾仁', '鲜虾', '大虾', '蟹', '蟹肉', '螃蟹', '梭子蟹', '大闸蟹',
  '贝', '贝肉', '贝类', '蛤蜊', '花蛤', '扇贝', '牡蛎', '生蚝', '鱿鱼', '章鱼', '墨鱼',
]);

function validationUnsafeStateForm(name) {
  return validationFormName(name).replace(VALIDATION_EXPLICIT_UNSAFE_STATE_RE, '');
}

function validationRawRiskForm(name) {
  return validationUnsafeStateForm(name).replace(/\(.*?\)/g, '');
}

function validationRawRiskCategoryForForm(form) {
  if (VALIDATION_RAW_EGG_FORMS.has(form)) return 'egg';
  if (VALIDATION_RAW_POULTRY_PORK_FORMS.has(form)) return 'poultry_pork';
  if (VALIDATION_RAW_SEAFOOD_FORMS.has(form)) return 'seafood';
  return '';
}

function validationResolveRawAlias(name, aliases) {
  const normalized = new Map();
  if (aliases && typeof aliases === 'object') {
    for (const [rawKey, rawValue] of Object.entries(aliases)) {
      const key = baseRecipeIngredient(rawKey);
      const value = baseRecipeIngredient(rawValue);
      const rawForm = validationFormName(rawValue);
      const unsafeForm = validationUnsafeStateForm(rawValue);
      if (key && value && !normalized.has(key)) {
        normalized.set(key, {
          rawValue,
          value,
          unsafeForm,
          unsafeValue: baseRecipeIngredient(unsafeForm),
          explicitUnsafe: unsafeForm !== rawForm,
        });
      }
    }
  }

  const bare = validationFormName(name).replace(/\(.*?\)/g, '');
  const initial = VALIDATION_CANONICAL_FORMS.get(bare) || name;
  const firstSeen = new Set();
  let current = baseRecipeIngredient(initial);
  let terminalExplicitUnsafe = false;
  const aliased = normalized.has(baseRecipeIngredient(name));
  while (normalized.has(current)) {
    if (firstSeen.has(current)) return { canonical: current, classifiable: false, aliased, explicitUnsafe: false };
    firstSeen.add(current);
    const edge = normalized.get(current);
    if (VALIDATION_PREPARED_STATE_MARKER_RE.test(edge.unsafeForm)) {
      return { canonical: current, classifiable: false, aliased, explicitUnsafe: false };
    }
    if (edge.value === current && edge.explicitUnsafe) {
      return { canonical: edge.unsafeValue, classifiable: true, aliased, explicitUnsafe: true };
    }
    terminalExplicitUnsafe = edge.explicitUnsafe;
    current = edge.value;
  }
  return { canonical: current, classifiable: true, aliased, explicitUnsafe: terminalExplicitUnsafe };
}

function validationRawRiskCategory(name, aliases) {
  const exactNormalized = validationUnsafeStateForm(name);
  if (!exactNormalized || VALIDATION_PREPARED_STATE_MARKER_RE.test(exactNormalized)) return '';
  const exact = validationRawRiskForm(exactNormalized);
  if (!exact || VALIDATION_PREPARED_HIGH_RISK_EXACT_FORMS.has(exact)) return '';
  if (validationCookingOilIngredient(exact) || VALIDATION_NON_RAW_HIGH_RISK_CATEGORY_RE.test(exact)) return '';
  const exactCategory = validationRawRiskCategoryForForm(exact);
  const resolved = validationResolveRawAlias(name, aliases);
  if (exactCategory && !resolved.aliased) return exactCategory;
  if (!resolved.classifiable) return '';
  const canonicalNormalized = validationUnsafeStateForm(resolved.canonical);
  if (!canonicalNormalized) return '';
  const canonical = validationRawRiskForm(canonicalNormalized);
  if (!canonical || (canonical === exact && !resolved.explicitUnsafe) || VALIDATION_PREPARED_HIGH_RISK_EXACT_FORMS.has(canonical)) return '';
  if (validationCookingOilIngredient(canonical) || VALIDATION_NON_RAW_HIGH_RISK_CATEGORY_RE.test(canonical)) return '';
  return validationRawRiskCategoryForForm(canonical);
}

const RICE_SAFE_DESCRIPTION_COPY = {
  note: '红扁豆、土豆和番茄组成完整主餐',
  why: '红扁豆补充蛋白，土豆提供主食感，番茄带来酸甜',
  taste_preview: '番茄酸甜先开胃，土豆绵软，红扁豆炖至细腻，尾段留有温和香料气息。',
  form: '一锅炖',
};
const RICE_SAFE_MULTI_VESSEL_COPY_RE = /(?:(?:[二两三四五六七八九]|[2-9])(?:口|只|个)?锅|多口锅)/;

function joinRecipeNames(names) {
  return names.filter(Boolean).join('、');
}

function riceSafeDescriptionNeedsRepair(value) {
  if (typeof value !== 'string') return false;
  return validationRiceAllergenMatches(validationFormName(value), true).length > 0
    || RICE_SAFE_MULTI_VESSEL_COPY_RE.test(value);
}

function explicitRetainedWaterGrams(steps) {
  const text = steps.join(' ');
  const amountThenWater = text.match(/(\d+(?:\.\d+)?)\s*(毫升|ml|克|g)\s*(?:的)?(?:清水|水)/i);
  const waterThenAmount = text.match(/(?:清水|水)\s*(\d+(?:\.\d+)?)\s*(毫升|ml|克|g)/i);
  const match = amountThenWater || waterThenAmount;
  if (!match) return 0;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount < 50 || amount > 3000) return 0;
  return Math.round(amount);
}

function repairRiceAllergyCompleteMain(meal, selection, constraints = {}) {
  if (!meal || typeof meal !== 'object'
    || !riceAllergyCompleteMainActive(selection)
    || !validationRiceAllergenActive(constraints?.dislikes, selection?.ingredientAliases || {})) {
    return 0;
  }

  let ingredientNames = validationIngredientNames(meal);
  const criticalFields = [
    meal.dish_name,
    ...ingredientNames,
    ...validationSteps(meal),
  ];
  if (criticalFields.some(value => (
    validationRiceAllergenMatches(validationFormName(value), true).length > 0
  ))) {
    return 0;
  }

  let repaired = 0;
  for (const [field, replacement] of Object.entries(RICE_SAFE_DESCRIPTION_COPY)) {
    if (!riceSafeDescriptionNeedsRepair(meal[field])) continue;
    meal[field] = replacement;
    repaired += 1;
  }
  if (Array.isArray(meal.flavor_tags)) {
    const repairedTags = meal.flavor_tags.map(tag => (
      riceSafeDescriptionNeedsRepair(tag)
        ? '醇厚'
        : tag
    ));
    if (repairedTags.some((tag, index) => tag !== meal.flavor_tags[index])) {
      meal.flavor_tags = repairedTags;
      repaired += 1;
    }
  }

  const beforeStructuralFlags = validateGroundedMeal(meal, selection, constraints);
  const hasWaterIngredient = ingredientNames.some(name => (
    validationIngredientMatchesNames(name, VALIDATION_WATER_NAMES)
  ));
  if (beforeStructuralFlags.includes('step_ingredient_missing:水') && !hasWaterIngredient) {
    const grams = explicitRetainedWaterGrams(validationSteps(meal));
    if (grams > 0 && Array.isArray(meal.ingredients)) {
      const water = { name: '水', grams };
      for (const key of NUTRIENT_KEYS) water[key] = 0;
      meal.ingredients.push(water);
      ingredientNames = validationIngredientNames(meal);
      repaired += 1;
    }
  }

  if (!validateGroundedMeal(meal, selection, constraints).includes('multi_pot_step')) {
    return repaired;
  }

  const aliases = selection?.ingredientAliases || {};
  const findCore = canonical => ingredientNames.find(name => (
    validationCanonicalIngredient(name, aliases) === canonical
  ));
  const lentil = findCore('红扁豆');
  const potato = findCore('土豆');
  const tomato = findCore('番茄');
  const waters = ingredientNames.filter(name => (
    validationIngredientMatchesNames(name, VALIDATION_WATER_NAMES)
  ));
  if (!lentil || !potato || !tomato || waters.length === 0) return repaired;

  const coreNames = new Set([lentil, potato, tomato]);
  const fats = ingredientNames.filter(name => validationCookingOilIngredient(name));
  const lateSeasonings = ingredientNames.filter(name => (
    !coreNames.has(name)
    && !fats.includes(name)
    && !waters.includes(name)
    && (
      validationIngredientMatchesNames(name, VALIDATION_SALT_NAMES)
      || validationIngredientMatchesNames(name, VALIDATION_PEPPER_NAMES)
      || /(?:糖|蜂蜜|月桂叶)/.test(name)
    )
  ));
  const sauteExtras = ingredientNames.filter(name => (
    !coreNames.has(name)
    && !fats.includes(name)
    && !waters.includes(name)
    && !lateSeasonings.includes(name)
  ));
  const sauteInputs = [potato, tomato, ...sauteExtras];
  const finishInputs = [lentil, ...waters, ...lateSeasonings];
  const sauteStep = fats.length
    ? `同一口锅加入${joinRecipeNames(fats)}，中火加热；放入${joinRecipeNames(sauteInputs)}翻炒3分钟。`
    : `同一口锅放入${joinRecipeNames(sauteInputs)}，加入少量${waters[0]}翻拌加热3分钟。`;
  const bayLeafTail = lateSeasonings.some(name => name.includes('月桂叶'))
    ? '；月桂叶食用前取出'
    : '';
  meal.steps = [
    `${lentil}冲洗干净；${potato}切小块，${tomato}切块。`,
    sauteStep,
    `继续在同一口锅加入${joinRecipeNames(finishInputs)}，煮沸后转小火加盖炖18-22分钟，至${lentil}熟烂、${potato}中心无硬芯${bayLeafTail}。`,
  ];
  return repaired + 1;
}

function repairGroundedMealSafety(meal, selection, constraints = {}) {
  const aliases = selection?.ingredientAliases || {};
  const ingredientNames = validationIngredientNames(meal);
  const steps = validationSteps(meal);
  const prefix = 'high_risk_not_cooked:';
  const candidates = [...new Set(validateGroundedMeal(meal, selection, constraints)
    .filter(flag => flag.startsWith(prefix))
    .map(flag => flag.slice(prefix.length)))]
    .filter(name => ingredientNames.includes(name))
    .filter(name => steps.some(step => validationStepMentions(step, name, aliases)))
    .map(name => ({ name, category: validationRawRiskCategory(name, aliases) }))
    .filter(candidate => candidate.category);

  if (!candidates.length) return 0;
  const instruction = `安全收尾：${candidates.map(({ name, category }) => groundedSafetyEndpoint(name, category)).join('；')}。`;
  if (!Array.isArray(meal.steps)) meal.steps = [];
  if (meal.steps.length < 4) {
    meal.steps.push(instruction);
  } else {
    const last = meal.steps.length - 1;
    meal.steps[last] = `${String(meal.steps[last] ?? '').trim()} ${instruction}`.trim();
  }
  return candidates.length;
}

const MISSING_SALT_ACTION_RE = /(?:加入|加|放入|放)?(?:少许|适量|一(?:小)?勺|[\d.]+\s*(?:克|g))?(?:食盐|海盐|盐巴|盐)(?:和|、|及|与)?/g;

function repairGroundedMealConsumables(meal, selection, constraints = {}) {
  if (!meal || typeof meal !== 'object' || !Array.isArray(meal.steps)) return 0;
  if (!validateGroundedMeal(meal, selection, constraints).includes('step_ingredient_missing:盐')) return 0;
  const repairedSteps = meal.steps.map(step => String(step || '')
    .replace(MISSING_SALT_ACTION_RE, '')
    .replace(/(?:，|,)\s*(?:，|,)/g, '，')
    .replace(/(?:，|,)\s*(?:。|$)/g, '。')
    .replace(/调味调味/g, '调味')
    .trim());
  const changed = repairedSteps.some((step, index) => step !== String(meal.steps[index] || '').trim());
  if (!changed) return 0;
  const originalSteps = meal.steps;
  meal.steps = repairedSteps;
  if (validateGroundedMeal(meal, selection, constraints).includes('step_ingredient_missing:盐')) {
    meal.steps = originalSteps;
    return 0;
  }
  return 1;
}

function repairSelectedSubstitutionConflicts(meal, selection) {
  if (!meal || typeof meal !== 'object' || !Array.isArray(meal.ingredients)) return 0;
  const recipe = selection?.recipe && typeof selection.recipe === 'object' ? selection.recipe : {};
  const aliases = selection?.ingredientAliases || {};
  const usedPantry = Array.isArray(selection?.usedPantry) ? selection.usedPantry : [];
  const usedCanonical = new Set(usedPantry
    .map(name => canonicalRecipeIngredient(name, aliases))
    .filter(Boolean));
  let repaired = 0;

  for (const slot of Array.isArray(recipe.substitution_slots) ? recipe.substitution_slots : []) {
    const replaces = Array.isArray(slot?.replaces) ? slot.replaces : [];
    const allowed = Array.isArray(slot?.allowed) ? slot.allowed : [];
    const selectedOriginal = replaces.some(name => usedCanonical.has(canonicalRecipeIngredient(name, aliases)));
    const selectedReplacement = usedPantry.find(item => (
      allowed.some(name => canonicalRecipeIngredient(name, aliases) === canonicalRecipeIngredient(item, aliases))
    ));
    if (selectedOriginal || !selectedReplacement) continue;

    const replacedCanonical = new Set(replaces
      .map(name => canonicalRecipeIngredient(name, aliases))
      .filter(Boolean));
    const beforeLength = meal.ingredients.length;
    meal.ingredients = meal.ingredients.filter(item => (
      !replacedCanonical.has(canonicalRecipeIngredient(item?.name, aliases))
    ));
    repaired += beforeLength - meal.ingredients.length;

    const replaceForms = new Set(replaces.map(name => String(name || '').trim()).filter(Boolean));
    for (const rawAlias of Object.keys(aliases)) {
      if (replacedCanonical.has(canonicalRecipeIngredient(rawAlias, aliases))) replaceForms.add(rawAlias);
    }
    const orderedForms = [...replaceForms].sort((a, b) => b.length - a.length);
    const rewrite = value => {
      let text = String(value || '');
      for (const form of orderedForms) text = text.split(form).join(selectedReplacement);
      const duplicate = `${selectedReplacement}、${selectedReplacement}`;
      while (text.includes(duplicate)) text = text.split(duplicate).join(selectedReplacement);
      return text;
    };
    for (const field of ['dish_name', 'note', 'taste_preview', 'why']) {
      if (typeof meal[field] === 'string') meal[field] = rewrite(meal[field]);
    }
    if (Array.isArray(meal.steps)) meal.steps = meal.steps.map(rewrite);
  }
  return repaired;
}

// 通用肉类菜谱命中具体部位后，模型若仍返回“牛肉/鸡肉/猪肉”，确定性改回用户原始名称。
// 只改写与通用核心逐字相同的 ingredient，特殊部位要求不进入这里。
function repairSelectedGenericMeatNames(meal, selection) {
  if (!meal || typeof meal !== 'object' || !Array.isArray(meal.ingredients)) return 0;
  const recipe = selection?.recipe && typeof selection.recipe === 'object' ? selection.recipe : {};
  const aliases = selection?.ingredientAliases || {};
  const usedPantry = Array.isArray(selection?.usedPantry) ? selection.usedPantry : [];
  let repaired = 0;

  for (const requirement of recipeConstraintList(recipe.core_ingredients)) {
    const requirementForm = recipeMatchForm(requirement);
    if (!GENERIC_MEAT_REQUIREMENTS.has(requirementForm)) continue;
    const selected = usedPantry.find(item => (
      recipeMatchForm(item) !== requirementForm
      && ingredientMatchesRecipeRequirement(item, requirement, aliases)
    ));
    if (!selected) continue;
    let replacedIngredient = false;
    for (const ingredient of meal.ingredients) {
      if (recipeMatchForm(ingredient?.name) !== requirementForm) continue;
      ingredient.name = selected;
      replacedIngredient = true;
      repaired += 1;
    }
    if (!replacedIngredient) continue;
    const rewrite = value => String(value || '').split(requirement).join(selected);
    for (const field of ['dish_name', 'note', 'taste_preview', 'why']) {
      if (typeof meal[field] === 'string') meal[field] = rewrite(meal[field]);
    }
    if (Array.isArray(meal.steps)) meal.steps = meal.steps.map(rewrite);
  }
  return repaired;
}

function attachGroundedMetadata(meal, selection, constraints) {
  delete meal.constraint_profile;
  delete meal.constraint_profiles;
  delete meal.active_constraint_profile;
  repairSelectedSubstitutionConflicts(meal, selection);
  repairSelectedGenericMeatNames(meal, selection);
  repairGroundedMealConsumables(meal, selection, constraints);
  repairRiceAllergyCompleteMain(meal, selection, constraints);
  repairGroundedMealSafety(meal, selection, constraints);
  const recipe = selection.recipe;
  meal.adaptation_note = typeof recipe.adaptation_note === 'string'
    ? recipe.adaptation_note.trim().slice(0, 400)
    : '';
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
// fail-closed: 未绑 KV 或 KV 读写异常一律拒绝生成(503 budget_unavailable), 不静默放行。
// 残余风险: KV 读-改-写非原子, 并发突发可有限超支, 但单日总量级仍被钉在预算量级。
// (Cloudflare ratelimit binding 只支持 10s/60s 窗口且按机房本地计数, 不适合日预算, 故保留 KV。)
async function budgetConsume(env) {
  if (!env.RATE_KV) return { ok: false, unavailable: true, reason: 'kv_binding_missing' };
  try {
    const day = shanghaiParts(new Date()).day;
    const key = 'budget:' + day;
    const cap = safeInt(env.DAILY_BUDGET, 300);
    const used = parseInt((await env.RATE_KV.get(key)) || '0', 10) || 0;
    if (used >= cap) return { ok: false };
    await env.RATE_KV.put(key, String(used + 1), { expirationTtl: 172800 });
    return { ok: true };
  } catch (err) {
    console.error('budget kv error', err?.message || String(err));
    return { ok: false, unavailable: true, reason: 'kv_error' };
  }
}

async function handleGenerate(request, env) {
  const t0 = Date.now();
  // 先校验请求体，再进入限流、菜谱选择和预算扣账。非空非法 JSON 不得消耗生成额度。
  const rawBody = await request.text().catch(() => '');
  if (new TextEncoder().encode(rawBody).length > 32 * 1024) {
    return errorResponse('request_too_large', '请求体超过 32KB 上限', 400, env, {}, request);
  }
  let parsed = {};
  if (rawBody.trim()) {
    try {
      parsed = JSON.parse(rawBody);
    } catch (_err) {
      return errorResponse('invalid_json', '请求体不是有效的 JSON', 400, env, {}, request);
    }
  }
  const req = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  if (!env.DEEPSEEK_API_KEY) return errorResponse('missing_api_key', 'DEEPSEEK_API_KEY 未配置', 500, env, {}, request);
  if (!rateOk(request, env)) return errorResponse('rate_limited', '今天生成次数到上限了，明天再来～', 429, env, {}, request);
  const targets = req.targets && typeof req.targets === 'object' ? req.targets : {};
  const constraints = sanitizeRecipeConstraints(req.constraints);
  const mealName = String(req.meal_name || '主餐');
  let recipeLib;
  try {
    recipeLib = await getRecipeLib(env, request);
  } catch (_err) {
    return errorResponse('recipe_library_unavailable', '可信菜谱库暂时不可用', 503, env, {}, request);
  }
  constraints.pantry = uniqueRecipePantry(constraints.pantry, recipeLib?.ingredient_aliases || {});
  const selections = selectRecipeCandidates(recipeLib, constraints);
  const riceAllergyActive = validationRiceAllergenActive(
    constraints.dislikes,
    recipeLib?.ingredient_aliases || {},
  );
  // 种子化抖动选取(W1): 短名单内按 score+jitter 重排后, 仍按原规则取第一个 feasible。
  const selection = pickRecipeSelection(selections, constraints, { riceAllergyActive });
  if (!selection) {
    if (riceAllergyActive) {
      return errorResponse(
        'no_safe_recipe',
        '暂时没有符合这些过敏或忌口条件的可信无米主餐',
        422,
        env,
        {},
        request,
      );
    }
    if (constraints.pantry.length) {
      return errorResponse(
        'no_compatible_pantry_recipe',
        '当前可信菜谱还搭不上这些食材',
        422,
        env,
        {},
        request,
      );
    }
    return errorResponse('recipe_library_unavailable', '没有符合本次限制的可信基础菜谱', 503, env, {}, request);
  }

  if (constraints.pantry.length > 0 && selection.usedPantry.length === 0) {
    if (riceAllergyActive) {
      return errorResponse(
        'no_safe_recipe',
        '暂时没有符合这些过敏或忌口条件的可信无米主餐',
        422,
        env,
        {},
        request,
      );
    }
    return errorResponse(
      'no_compatible_pantry_recipe',
      '当前可信菜谱还搭不上这些食材',
      422,
      env,
      {},
      request,
    );
  }

  // 选中的可信菜谱不能覆盖全部库存，或用户一次给了超过 6 种食材时，先返回可解释的
  // 分组计划，不调用 DeepSeek、不扣预算。用户明确选择一组后，再把该组作为本锅必用食材生成。
  if (constraints.pantry.length > 0
    && (constraints.pantry.length > 6 || selection.usedPantry.length !== constraints.pantry.length)) {
    return jsonResponse({
      error: '这些食材不能稳妥放进同一锅，请先查看本锅方案',
      code: 'pantry_needs_grouping',
      pantry_plan: buildPantryPlan(recipeLib, constraints),
    }, 409, env, request);
  }

  const budget = await budgetConsume(env);
  if (!budget.ok && budget.unavailable) {
    return errorResponse('budget_unavailable', '生成服务暂时不可用，请稍后再试', 503, env, {}, request);
  }
  if (!budget.ok) return errorResponse('budget_exceeded', '今天大家用得有点多，明天再来～', 429, env, {}, request);
  const prompt = buildPrompt(mealName, targets, constraints, buildRecipeGrounding(selection));
  const body = {
    model: env.MODEL_NAME || 'deepseek-chat',
    messages: [
      { role: 'system', content: `${TRUSTED_RECIPE_SYSTEM_ROLE}\n\n${buildTrustedRecipeSystemOverride(selection)}` },
      { role: 'user', content: prompt },
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
  };

  // DeepSeek 30s 硬超时: 超时 504 upstream_timeout, 网络失败或上游非 2xx 一律 502 upstream_error;
  // 错误响应只回状态码, 不回传上游原文(脱敏)。预算预扣限制的是调用尝试, 有意不动。
  let upstream;
  try {
    upstream = await fetch(env.API_URL || 'https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
  } catch (err) {
    console.error('DeepSeek fetch failed', err?.name || 'unknown', err?.message || String(err));
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      return errorResponse('upstream_timeout', '生成服务响应超时，请稍后再试', 504, env, {}, request);
    }
    return errorResponse('upstream_error', '生成服务临时失败，请稍后再试', 502, env, {}, request);
  }

  const raw = await upstream.text();
  if (!upstream.ok) {
    console.error('DeepSeek upstream error', upstream.status, raw.slice(0, 300));
    return errorResponse('upstream_error', '生成服务临时失败，请稍后再试', 502, env, { upstreamStatus: upstream.status }, request);
  }

  const data = JSON.parse(raw);
  const content = data?.choices?.[0]?.message?.content;
  const meal = normalizeMeal(parseModelJson(content), data.usage);
  attachGroundedMetadata(meal, selection, constraints);
  // 硬校验失败不上桌: attachGroundedMetadata 内确定性 repair 后仍有 validation_flags 的,
  // 服务端直接 422 unsafe_recipe(前端已有对应停止页), 不再发出去让前端 scoreDish 拦;
  // 以 repair 后的终态 flags 为准, repair 已修掉的不触发; 不静默重试 DeepSeek。
  if (meal.validation_flags.length) {
    console.log(JSON.stringify({
      evt: 'gen',
      ok: false,
      code: 'unsafe_recipe',
      base: meal.base_recipe_id,
      family: meal.family_id,
      flags: meal.validation_flags.length,
      tokens: meal._tokens || 0,
      n: (meal.ingredients || []).length,
      ms: Date.now() - t0,
    }));
    return errorResponse('unsafe_recipe', '生成的做法没有通过食材或熟制检查', 422, env, {}, request);
  }
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

export {
  buildPantryPlan,
  buildRecipeGrounding,
  canonicalRecipeIngredient,
  fnv1a32,
  matchAllergy,
  pickRecipeSelection,
  recipeSelectionSeed,
  selectRecipeCandidates,
  getRecipeLib,
  repairGroundedMealConsumables,
  repairRiceAllergyCompleteMain,
  repairGroundedMealSafety,
  validateGroundedMeal,
  validationRiceAllergenActive,
  normalizePlannerRequest,
  plannerRequestFromLegacy,
};

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
