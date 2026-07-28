const TOP_LEVEL_KEYS = ['plan_id', 'meals'];
const MEAL_KEYS = ['meal_sequence', 'dish_name', 'ingredient_refs', 'steps', 'recommendation_reason'];
const STEP_KEYS = ['order', 'action_code', 'text', 'ingredient_refs', 'completed_safety_endpoints'];
const MAX_DISH_NAME = 80;
const MAX_STEP_TEXT = 400;
const MAX_REASON = 300;

// First-stage finite supplement for common culinary words absent from the controlled
// taxonomy and recipe fields. This is intentionally small and reviewable; it is not
// an open-ended food knowledge graph.
const CONTROLLED_BASIC_PROSE_TERMS = Object.freeze([
  '芝士', '奶酪', '料酒', '黄酒', '米酒', '糖', '白糖', '红糖', '冰糖', '蜂蜜',
  '水', '油', '食用油', '植物油', '花生油', '菜籽油', '玉米油', '橄榄油', '香油', '芝麻油',
  '盐', '食盐', '海盐', '酱油', '生抽', '老抽', '蚝油', '豆瓣酱', '味精', '鸡精',
  '醋', '白醋', '陈醋', '香醋', '米醋', '葱', '姜', '蒜', '胡椒粉', '辣椒粉',
  '咖喱粉', '五香粉', '十三香', '花椒', '八角', '桂皮', '香叶', '孜然',
]);
const CONTROLLED_SINGLE_CHARACTER_TERMS = new Set(['水', '油', '盐', '糖', '醋', '葱', '姜', '蒜']);
const RECIPE_INGREDIENT_FIELDS = Object.freeze([
  'core_ingredients',
  'optional_ingredients',
  'generation_optional_ingredients',
  'generation_liquid_ingredients',
]);
const UNPLANNED_APPLIANCE_RE = /烤箱|电烤箱|空气炸锅|微波炉|电压力锅|压力锅|蒸箱/iu;
const SAFETY_EVIDENCE_RULES = Object.freeze({
  egg_fully_set: /完全凝固/u,
  poultry_fully_cooked_no_pink: /完全熟透.*内部无粉红/u,
  beef_fully_cooked: /完全熟透/u,
  pork_fully_cooked: /完全熟透/u,
  lamb_fully_cooked: /完全熟透/u,
  seafood_fully_cooked: /完全熟透/u,
  bean_fully_cooked: /煮熟软化/u,
  heated_through: /热透/u,
  grain_tender_no_hard_center: /熟软且无硬芯/u,
  noodle_tender: /无硬芯|熟透/u,
  tender: /熟软/u,
});
const NON_ACHIEVED_SAFETY_RE = /仍(?:然)?(?:有)?粉红|还有粉红|带粉红|见红|带血|流心|溏心|未凝固|尚未|未熟|没熟|没有熟|(?:并)?(?:未|没有|不是|不算).{0,4}(?:熟|凝固)|(?:不|并非|未能).{0,3}(?:完全|彻底).{0,2}(?:熟|凝固)|夹生|稍后|待会|之后再|后续再|将(?:会|要)|需要继续|需再|才能熟|表面(?:已经)?变色/iu;
const ACTION_TEXT_TEMPLATES = Object.freeze({
  acid_base_cookdown: ['将{items}放入锅中翻炒至变软并释放汁水', '同锅翻炒{items}，直至质地变软、汁水析出'],
  add_broth_and_noodles: ['将{items}放入同一口锅，煮至面条无硬芯', '同锅加入{items}并保持翻动，直至面条熟透'],
  add_fast_cooking_items: ['加入{items}，翻拌至均匀受热', '将{items}加入锅中，翻动至全部热透'],
  add_liquid: ['将{items}倒入同一口锅，与锅内食材拌匀', '同锅加入{items}并搅匀，使液体分布均匀'],
  add_slow_cooking_items: ['先加入{items}翻拌，使较慢熟的食材开始受热', '将{items}先放入锅中翻动，为后续焖煮预留熟化时间'],
  add_mushroom: ['加入{items}，翻炒至变软并充分受热', '将{items}放入锅中翻炒，直至质地变软'],
  add_noodle: ['铺入{items}，保持同锅焖煮至无硬芯', '将{items}加入锅中并轻轻拨散，煮至熟透'],
  add_pork: ['加入{items}，翻炒至各面均匀变色', '将{items}放入锅中翻动加热，使各面受热均匀'],
  add_soft_protein: ['轻轻放入{items}，避免大力翻动并继续同锅加热', '将{items}沿锅边放入，轻推均匀后继续加热'],
  add_staple_and_liquid: [
    '将{items}按计划比例加入同一口锅并拌匀，加盖焖煮至主食熟软无硬芯',
    '同锅加入{items}并轻轻搅匀，随后加盖焖煮到主食完全熟软',
  ],
  add_reserved_liquid_if_needed: [
    '检查锅底；只有出现偏干迹象时，才加入计划预留的{grams}克{items}',
    '如锅底水分不足，仅补入已锁定的{grams}克{items}，不得再额外加水',
  ],
  add_staple_root_and_liquid: [
    '将{items}按已锁定比例放入同一口锅并轻轻搅匀',
    '同锅加入{items}，按已确定比例拌匀后开始加热',
  ],
  add_cooked_legume: [
    '将{items}在后段加入，轻轻搅匀并继续加热',
    '后段加入{items}，同锅翻拌至整体均匀受热',
  ],
  add_leafy_vegetable: [
    '最后加入{items}，轻轻翻拌至叶菜熟软',
    '将{items}在收尾阶段放入锅中，拌匀并加热至熟软',
  ],
  cook_aromatics: ['将{items}放入锅中翻炒至香味释放', '同锅翻炒{items}，直至香味明显释放'],
  cook_poultry_through: ['将{items}放入锅中持续加热并翻动，使各面均匀受热', '同锅加热{items}并适时翻动，确保各面受热'],
  gentle_set_protein: ['加入{items}，保持温和加热至结构稳定', '将{items}放入锅中，轻推并温和加热至定形'],
  protein_pretreat: ['将{items}整理成大小相近的形状，使后续能够均匀受热', '检查{items}的原部位与状态，整理后放在手边备用'],
  quick_breakfast_heat: ['将{items}同锅翻拌加热至整体热透', '同锅加入{items}并快速翻拌，直至全部热透'],
  reach_safety_endpoints: ['继续同锅加热{items}{safety}', '保持同锅加热并检查{items}{safety_alt}'],
  sear_beef: ['将{items}切成适合入口的薄片，平铺入锅翻炒至表面均匀变色', '把{items}切成厚薄相近的薄片，放入锅中摊开并逐面翻炒'],
  simmer_until_staple_tender: ['加盖焖煮{items}，直至主食熟软且无硬芯', '保持同锅焖煮{items}，直到主食完全熟软'],
  simmer_until_tender: ['加盖焖煮{items}，直至食材熟软', '保持同锅小幅翻动并焖煮{items}，直到质地熟软'],
  simmer_soft_grain_and_root: [
    '保持同锅小火焖煮{items}，期间轻搅防糊底',
    '小火继续焖煮{items}，适时轻轻搅动避免粘底',
  ],
  soak_soft_grain: [
    '用细筛淘洗{items}，浸泡30分钟后沥去浸泡水',
    '将{items}放入细筛淘净，加水浸泡30分钟后沥干',
  ],
  soften_family_texture: ['继续焖煮{items}，直至质地柔软易咀嚼', '保持同锅加热{items}，煮到整体柔软易入口'],
  stir_cooked_rice: ['加入{items}，同锅翻拌至米饭松散并均匀热透', '将{items}放入锅中翻拌，直至米饭松散、整体热透'],
});
const DELETION_LANGUAGE_RE = /不使用|不用|不放|不加|丢弃|省略|去掉|移除|留在冰箱|不放入锅/iu;

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value, expected) {
  return isPlainObject(value)
    && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort());
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizedIngredientText(value) {
  return String(value || '').toLowerCase().replace(/[\s_\-（）()]/gu, '');
}

function amountFor(item, pot) {
  const candidates = [item.raw, item.display_name, item.canonical].filter(Boolean);
  const exact = (pot.ingredient_amounts || []).find(amount => candidates.includes(amount.name));
  if (!exact || !Number.isSafeInteger(exact.grams) || exact.grams < 0) {
    throw new Error(`locked_ingredient_amount_missing:${candidates[0] || 'unknown'}`);
  }
  return exact.grams;
}

function templateSlots(template) {
  return [...(template.required_slots || []), ...(template.optional_slots || [])].map(slot => slot.slot_id);
}

function basicExtraSlot(extra, slotByName) {
  if (slotByName.has(extra.name)) return slotByName.get(extra.name);
  if (extra.category === 'liquid') return 'liquid';
  if (extra.category === 'oil') return 'oil';
  if (extra.category === 'seasoning') return 'seasoning';
  return 'basic_extra';
}

function cookingPhaseMatches(phase, slotAssignment) {
  if (!phase?.when) return true;
  return (slotAssignment?.[phase.when.slot_id] || [])
    .some(item => item.category === phase.when.category);
}

function uniqueStrings(values) {
  return [...new Set(values)];
}

function placeholder(ref) {
  return `{{${ref}}}`;
}

function joinedPlaceholders(refs) {
  return refs.map(placeholder).join('、');
}

function endpointEvidencePhrase(endpoint, refs) {
  const ingredients = joinedPlaceholders(refs);
  if (endpoint === 'egg_fully_set') return `${ingredients}完全凝固`;
  if (endpoint === 'poultry_fully_cooked_no_pink') return `${ingredients}完全熟透，内部无粉红`;
  if (endpoint === 'beef_fully_cooked' || endpoint === 'pork_fully_cooked'
      || endpoint === 'lamb_fully_cooked' || endpoint === 'seafood_fully_cooked') {
    return `${ingredients}完全熟透`;
  }
  if (endpoint === 'bean_fully_cooked') return `${ingredients}煮熟软化`;
  if (endpoint === 'heated_through') return `${ingredients}整体热透`;
  if (endpoint === 'grain_tender_no_hard_center') return `${ingredients}熟软且无硬芯`;
  if (endpoint === 'noodle_tender') return `${ingredients}熟透且无硬芯`;
  if (endpoint === 'tender') return `${ingredients}熟软`;
  throw new Error(`locked_safety_endpoint_unsupported:${endpoint}`);
}

function controlledStepTexts(phase, lockedIngredients) {
  let templates = ACTION_TEXT_TEMPLATES[phase.action_code];
  if (phase.action_code === 'protein_pretreat') {
    const categories = new Set(lockedIngredients
      .filter(item => phase.allowed_ingredient_refs.includes(item.ingredient_ref))
      .map(item => item.category));
    if (categories.has('beef') || categories.has('pork') || categories.has('lamb')) {
      templates = [
        '将{items}切成适合入口的薄片，使厚薄尽量一致',
        '把{items}顺着原部位切成薄片，放在手边备用',
      ];
    } else if (categories.has('chicken')) {
      templates = [
        '将{items}切成大小相近的小块，便于均匀熟透',
        '把{items}按原部位整理成均匀小块并备好',
      ];
    } else if (categories.has('egg')) {
      templates = ['将{items}打散至蛋液均匀', '把{items}充分搅散，静置在手边备用'];
    }
  }
  if (!Array.isArray(templates) || templates.length < 2) {
    throw new Error(`locked_action_phrase_missing:${phase.action_code}`);
  }
  const refs = joinedPlaceholders(phase.allowed_ingredient_refs);
  const safety = phase.required_safety_endpoints.map(endpoint => (
    endpointEvidencePhrase(endpoint, phase.required_safety_ingredient_refs)
  ));
  const safetyFact = safety.length ? `，并确认${safety.join('；')}` : '';
  const safetyAlt = safety.length ? `，完成后确认${safety.join('；')}` : '';
  return templates.map(template => `${template
    .replace('{items}', refs)
    .replace('{grams}', String(phase.locked_liquid_grams ?? ''))
    .replace('{safety}', safetyFact)
    .replace('{safety_alt}', safetyAlt)}。`);
}

function taxonomyIdentityTerms(taxonomyItem) {
  return uniqueStrings([
    taxonomyItem?.display_name,
    taxonomyItem?.canonical_name,
    ...(taxonomyItem?.aliases || []),
  ].filter(value => typeof value === 'string' && value.trim()));
}

function addTerm(entries, seen, term, identity, source) {
  const normalized = normalizedIngredientText(term);
  if (!normalized || (normalized.length < 2 && !CONTROLLED_SINGLE_CHARACTER_TERMS.has(normalized))) return;
  const key = `${identity}\u0000${normalized}`;
  if (seen.has(key)) return;
  seen.add(key);
  entries.push({ term: String(term).trim(), normalized, identity, source });
}

export function buildIngredientTermUniverse(taxonomy, recipeLibrary) {
  const entries = [];
  const seen = new Set();
  for (const item of taxonomy?.items || []) {
    const identity = `taxonomy:${item.canonical_id || item.display_name}`;
    for (const term of taxonomyIdentityTerms(item)) addTerm(entries, seen, term, identity, 'taxonomy');
  }
  for (const recipe of recipeLibrary?.recipes || []) {
    for (const field of RECIPE_INGREDIENT_FIELDS) {
      for (const term of recipe?.[field] || []) {
        addTerm(entries, seen, term, `recipe:${normalizedIngredientText(term)}`, 'recipe');
      }
    }
    for (const slot of recipe?.substitution_slots || []) {
      for (const field of ['replaces', 'allowed']) {
        for (const term of slot?.[field] || []) {
          addTerm(entries, seen, term, `recipe:${normalizedIngredientText(term)}`, 'recipe');
        }
      }
    }
    for (const discouraged of recipe?.discouraged || []) {
      for (const term of discouraged?.ingredients || []) {
        addTerm(entries, seen, term, `recipe:${normalizedIngredientText(term)}`, 'recipe');
      }
    }
  }
  for (const [alias, canonical] of Object.entries(recipeLibrary?.ingredient_aliases || {})) {
    const identity = `recipe-alias:${normalizedIngredientText(canonical)}`;
    addTerm(entries, seen, alias, identity, 'recipe_alias');
    addTerm(entries, seen, canonical, identity, 'recipe_alias');
  }
  for (const term of CONTROLLED_BASIC_PROSE_TERMS) {
    addTerm(entries, seen, term, `controlled:${normalizedIngredientText(term)}`, 'controlled_basic');
  }
  return Object.freeze(entries
    .sort((left, right) => right.normalized.length - left.normalized.length
      || left.normalized.localeCompare(right.normalized, 'zh-CN'))
    .map(entry => Object.freeze(entry)));
}

function buildLockedMeal(pot, template, refCounters, context) {
  for (const amount of pot.ingredient_amounts || []) {
    if (!amount || typeof amount.name !== 'string'
        || !Number.isSafeInteger(amount.grams) || amount.grams < 0) {
      throw new Error('locked_plan_amount_invalid');
    }
  }
  for (const extra of pot.required_extra_items || []) {
    if (!extra || typeof extra.name !== 'string'
        || !Number.isSafeInteger(extra.grams) || extra.grams < 0) {
      throw new Error('locked_basic_extra_invalid');
    }
  }
  const slotIds = templateSlots(template);
  const orderedSlotIds = uniqueStrings([...slotIds, ...Object.keys(pot.slot_assignment || {}).sort()]);
  const userIngredients = [];
  const slotByName = new Map();
  for (const slotId of orderedSlotIds) {
    for (const item of pot.slot_assignment?.[slotId] || []) {
      slotByName.set(item.raw, slotId);
      slotByName.set(item.display_name, slotId);
      slotByName.set(item.canonical, slotId);
      if (item.source === 'basic_extra' || item.role === 'basic_extra') continue;
      userIngredients.push({ item, slot_id: slotId });
    }
  }

  const locked = userIngredients.map(({ item, slot_id }) => ({
    ingredient_ref: `i${refCounters.user++}`,
    raw_name: item.raw,
    display_name: item.display_name || item.raw,
    canonical: item.canonical,
    category: item.category,
    shape_or_cut: item.shape_or_cut ?? null,
    requires_explicit_raw_name: Boolean(item.shape_or_cut
      && normalizedIngredientText(item.raw) !== normalizedIngredientText(item.canonical)),
    source: 'user',
    slot_id,
    planned_grams: amountFor(item, pot),
  }));

  for (const extra of pot.required_extra_items || []) {
    if (!extra || typeof extra.name !== 'string'
        || !Number.isSafeInteger(extra.grams) || extra.grams < 0) {
      throw new Error('locked_basic_extra_invalid');
    }
    locked.push({
      ingredient_ref: `e${refCounters.extra++}`,
      raw_name: extra.name,
      display_name: extra.name,
      canonical: extra.canonical || extra.name,
      category: extra.category,
      shape_or_cut: null,
      requires_explicit_raw_name: false,
      source: 'basic_extra',
      slot_id: basicExtraSlot(extra, slotByName),
      planned_grams: extra.grams,
    });
  }

  const requiredEndpointCategories = new Map((template.safety_endpoints || [])
    .map(endpoint => [endpoint.endpoint_code, endpoint.applies_to_category]));
  const endpointSlots = new Map();
  const endpointIngredientRefs = new Map();
  for (const slotId of orderedSlotIds) {
    for (const item of pot.slot_assignment?.[slotId] || []) {
      for (const [endpoint, category] of requiredEndpointCategories) {
        if (item.category === category) endpointSlots.set(endpoint, slotId);
      }
    }
  }
  for (const [endpoint, category] of requiredEndpointCategories) {
    const refs = locked.filter(item => item.category === category).map(item => item.ingredient_ref);
    if (refs.length) endpointIngredientRefs.set(endpoint, refs);
  }
  const requiredEndpoints = [...endpointSlots.keys()].sort();
  let phases = (template.cooking_order || [])
    .filter(phase => cookingPhaseMatches(phase, pot.slot_assignment))
    .map(phase => ({
    phase: phase.phase,
    action_code: phase.action_code,
    slot_ids: [...phase.slot_ids],
    allowed_ingredient_refs: locked.filter(item => phase.slot_ids.includes(item.slot_id))
      .map(item => item.ingredient_ref),
    required_safety_endpoints: [],
    required_safety_ingredient_refs: [],
    }));
  const reserveLiquidGrams = pot.liquid_constraints?.reserve_liquid_grams;
  if (reserveLiquidGrams != null
      && (!Number.isSafeInteger(reserveLiquidGrams) || reserveLiquidGrams < 0)) {
    throw new Error('locked_reserved_liquid_grams_invalid');
  }
  if (reserveLiquidGrams > 0) {
    const liquidRefs = locked.filter(item => item.category === 'liquid')
      .map(item => item.ingredient_ref);
    if (liquidRefs.length !== 1) throw new Error('locked_reserved_liquid_ref_invalid');
    const insertionIndex = phases.findIndex(phase => phase.action_code === 'add_staple_and_liquid');
    if (insertionIndex < 0) throw new Error('locked_reserved_liquid_phase_missing');
    phases.splice(insertionIndex + 1, 0, {
      phase: insertionIndex + 2,
      action_code: pot.liquid_constraints.reserve_action_code,
      slot_ids: ['liquid'],
      allowed_ingredient_refs: liquidRefs,
      locked_liquid_grams: reserveLiquidGrams,
      required_safety_endpoints: [],
      required_safety_ingredient_refs: [],
    });
    phases.forEach((phase, index) => { phase.phase = index + 1; });
  }
  for (const ingredient of locked.filter(item => item.source === 'basic_extra')) {
    if (phases.some(phase => phase.allowed_ingredient_refs.includes(ingredient.ingredient_ref))) continue;
    const mixturePhaseIndex = phases.findIndex(phase => (
      /liquid|broth|staple.*liquid|stir_cooked_rice/u.test(phase.action_code)
    ));
    let phaseIndex = ['liquid', 'oil', 'seasoning'].includes(ingredient.slot_id)
      ? mixturePhaseIndex
      : 0;
    if (phaseIndex < 0) phaseIndex = 0;
    if (phases[phaseIndex]) phases[phaseIndex].allowed_ingredient_refs.push(ingredient.ingredient_ref);
  }
  for (const endpoint of requiredEndpoints) {
    const slotId = endpointSlots.get(endpoint);
    let phaseIndex = phases.findIndex(phase => phase.action_code === 'reach_safety_endpoints'
      && phase.slot_ids.includes(slotId));
    if (phaseIndex < 0) {
      for (let index = phases.length - 1; index >= 0; index -= 1) {
        if (phases[index].slot_ids.includes(slotId)) { phaseIndex = index; break; }
      }
    }
    if (phaseIndex < 0) phaseIndex = phases.length - 1;
    if (phaseIndex >= 0) {
      phases[phaseIndex].required_safety_endpoints.push(endpoint);
      phases[phaseIndex].required_safety_ingredient_refs.push(...(endpointIngredientRefs.get(endpoint) || []));
      phases[phaseIndex].required_safety_ingredient_refs = uniqueStrings(
        phases[phaseIndex].required_safety_ingredient_refs,
      );
    }
  }
  for (const ingredient of locked) {
    if (phases.some(phase => phase.allowed_ingredient_refs.includes(ingredient.ingredient_ref))) continue;
    if (ingredient.source === 'user') {
      throw new Error(`locked_cooking_order_ingredient_missing:${ingredient.ingredient_ref}`);
    }
    if (phases.length) phases[0].allowed_ingredient_refs.push(ingredient.ingredient_ref);
  }
  phases = phases.filter(phase => (
    phase.allowed_ingredient_refs.length > 0 || phase.required_safety_endpoints.length > 0
  ));
  const userRefs = locked.filter(item => item.source === 'user').map(item => item.ingredient_ref);
  const titleRefs = userRefs.length ? userRefs : locked.map(item => item.ingredient_ref);
  const title = joinedPlaceholders(titleRefs);
  const modeReason = context.mode === 'pantry'
    ? '这份做法按清库存承诺与已确认顺序执行。'
    : '这份做法按直接推荐计划与已确认顺序执行。';
  const intentReasons = {
    quick: '这份做法按快手目标与已确认顺序执行。',
    fresh: '这份做法按清爽目标与已确认顺序执行。',
    batch: '这份做法按批量备餐目标与已确认顺序执行。',
  };
  const generationTextContract = {
    dish_name_options: [`${title}一锅主餐`, `${title}家常一锅餐`],
    steps: phases.map((phase, index) => ({
      order: index + 1,
      allowed_texts: controlledStepTexts(phase, locked),
    })),
    recommendation_reason_options: uniqueStrings([
      '食材与顺序均按已确认计划执行。',
      modeReason,
      intentReasons[context.intent],
    ].filter(Boolean)),
  };

  return {
    meal_sequence: pot.meal_sequence,
    servings: pot.servings,
    template_id: pot.template_id,
    locked_ingredients: locked,
    slot_assignment: orderedSlotIds.map(slot_id => ({
      slot_id,
      ingredient_refs: locked.filter(item => item.slot_id === slot_id).map(item => item.ingredient_ref),
    })).filter(slot => slot.ingredient_refs.length),
    cooking_order: phases,
    ratio_constraints: structuredClone(pot.ratio_trace || []),
    liquid_constraints: structuredClone(pot.liquid_constraints || {}),
    time_range: structuredClone(pot.time_range || {}),
    safety_endpoints: requiredEndpoints,
    safety_endpoint_requirements: requiredEndpoints.map(endpoint_code => ({
      endpoint_code,
      ingredient_refs: [...(endpointIngredientRefs.get(endpoint_code) || [])],
    })),
    generation_text_contract: generationTextContract,
  };
}

export function buildLockedPlanContract(plannerResult, templateCatalog) {
  if (!isPlainObject(plannerResult) || !isPlainObject(plannerResult.plan)
      || typeof plannerResult.plan.plan_id !== 'string' || !Array.isArray(plannerResult.plan.pots)) {
    throw new Error('invalid_planner_result');
  }
  const templates = new Map((templateCatalog?.templates || []).map(template => [template.template_id, template]));
  const refCounters = { user: 1, extra: 1 };
  const meals = [...plannerResult.plan.pots].sort((left, right) => left.meal_sequence - right.meal_sequence)
    .map(pot => {
      const template = templates.get(pot.template_id);
      if (!template) throw new Error(`locked_template_missing:${pot.template_id}`);
      return buildLockedMeal(pot, template, refCounters, {
        mode: plannerResult.mode,
        intent: plannerResult.intent,
      });
    });
  return structuredClone({
    plan_id: plannerResult.plan.plan_id,
    planner_version: plannerResult.planner_version,
    template_catalog_version: plannerResult.template_catalog_version,
    mode: plannerResult.mode,
    intent: plannerResult.intent,
    meals,
  });
}

function contractFailure(reason_code) {
  return { ok: false, reason_code };
}

export function lockPlannerOwnedSafetyMetadata(modelOutput, lockedPlan) {
  const output = structuredClone(modelOutput);
  if (!Array.isArray(output?.meals) || !Array.isArray(lockedPlan?.meals)) return output;
  for (let mealIndex = 0; mealIndex < Math.min(output.meals.length, lockedPlan.meals.length); mealIndex += 1) {
    const outputSteps = output.meals[mealIndex]?.steps;
    const lockedPhases = lockedPlan.meals[mealIndex]?.cooking_order;
    if (!Array.isArray(outputSteps) || !Array.isArray(lockedPhases)) continue;
    for (let stepIndex = 0; stepIndex < Math.min(outputSteps.length, lockedPhases.length); stepIndex += 1) {
      if (!isPlainObject(outputSteps[stepIndex])) continue;
      outputSteps[stepIndex].completed_safety_endpoints = [
        ...(lockedPhases[stepIndex]?.required_safety_endpoints || []),
      ];
    }
  }
  return output;
}

function exactStringSet(values, expected) {
  if (!Array.isArray(values) || values.some(value => typeof value !== 'string')) return false;
  if (new Set(values).size !== values.length) return false;
  const sorted = [...values].sort();
  const expectedSorted = [...expected].sort();
  return JSON.stringify(sorted) === JSON.stringify(expectedSorted);
}

function containsNumericClaim(text) {
  const unit = '(?:摄氏度|分钟|小时|毫升|汤匙|茶匙|刻钟|克|g|ml|秒|份|碗|杯|勺|个|只|片|块|根|颗|斤|两|滴|度|℃|°C)';
  return new RegExp(`(?:\\d+(?:\\.\\d+)?\\s*${unit}|\\d+\\s*[:：比]\\s*\\d+|[半一二两三四五六七八九十百]+\\s*${unit})`, 'iu').test(text);
}

function containsMultipleVessels(text) {
  if (UNPLANNED_APPLIANCE_RE.test(String(text))) return true;
  if (/(?:另起|再起|第二)(?:一口|口)?(?:锅|炒锅|汤锅|平底锅)|分成?两锅|第二锅/u.test(text)) return true;
  const vesselKinds = new Set([...String(text).matchAll(/电饭锅|高压锅|平底锅|炒锅|汤锅|砂锅|蒸锅/gu)].map(match => match[0]));
  return vesselKinds.size > 1;
}

function normalizedTermUniverse(termUniverse) {
  if (Array.isArray(termUniverse)) return termUniverse;
  if (Array.isArray(termUniverse?.items)) return buildIngredientTermUniverse(termUniverse, { recipes: [] });
  return [];
}

function allowedProseTerms(meal, termUniverse) {
  const allowed = new Set(meal.locked_ingredients.flatMap(item => [item.raw_name, item.display_name, item.canonical])
    .map(normalizedIngredientText).filter(Boolean));
  const taxonomyEntries = normalizedTermUniverse(termUniverse).filter(entry => entry.source === 'taxonomy');
  for (const item of meal.locked_ingredients) {
    const exactNames = [item.raw_name, item.display_name].map(normalizedIngredientText).filter(Boolean);
    const matchedIdentity = taxonomyEntries.find(entry => exactNames.includes(entry.normalized))?.identity;
    if (!matchedIdentity) continue;
    for (const entry of taxonomyEntries) if (entry.identity === matchedIdentity) allowed.add(entry.normalized);
  }
  return allowed;
}

function proseIngredientViolation(text, meal, termUniverse) {
  const normalized = normalizedIngredientText(text);
  const allowed = allowedProseTerms(meal, termUniverse);
  const lockedExplicit = meal.locked_ingredients.flatMap(item => [item.raw_name, item.display_name])
    .map(normalizedIngredientText).filter(Boolean);
  for (const candidate of normalizedTermUniverse(termUniverse)) {
    const mentioned = candidate.normalized.length === 1
      ? new RegExp(`(?:加|加入|倒|倒入|放|放入|淋|淋入|撒|撒入|调入|拌入|用)${candidate.normalized}`, 'u').test(normalized)
      : normalized.includes(candidate.normalized);
    if (!mentioned) continue;
    if (allowed.has(candidate.normalized)) continue;
    if (lockedExplicit.some(term => term.includes(candidate.normalized))) continue;
    return true;
  }
  return false;
}

function proseMentionsUnreferencedLockedIngredient(text, refs, meal) {
  const normalized = normalizedIngredientText(text);
  const referenced = new Set(refs);
  return meal.locked_ingredients.some(item => {
    const terms = [item.raw_name, item.display_name, item.canonical]
      .map(normalizedIngredientText).filter(term => term.length >= 2);
    return terms.some(term => normalized.includes(term)) && !referenced.has(item.ingredient_ref);
  });
}

function validBoundedText(value, max) {
  const text = cleanText(value);
  return text.length > 0 && text.length <= max && !/[\u0000-\u001f\u007f]/u.test(text);
}

function safetyEvidenceValid(step, skeleton) {
  if (!skeleton.required_safety_endpoints.length) return true;
  const refs = new Set(step.ingredient_refs);
  if (skeleton.required_safety_ingredient_refs.some(ref => !refs.has(ref))) return false;
  if (NON_ACHIEVED_SAFETY_RE.test(step.text)) return false;
  return skeleton.required_safety_endpoints.every(endpoint => SAFETY_EVIDENCE_RULES[endpoint]?.test(step.text));
}

function explicitRawPartsPreserved(outputMeal, lockedMeal) {
  return lockedMeal.locked_ingredients.filter(item => item.requires_explicit_raw_name).every(item => {
    const raw = normalizedIngredientText(item.raw_name);
    if (normalizedIngredientText(outputMeal.dish_name).includes(raw)) return true;
    return outputMeal.steps.some(step => step.ingredient_refs.includes(item.ingredient_ref)
      && normalizedIngredientText(step.text).includes(raw));
  });
}

function placeholderRefs(text) {
  return [...String(text).matchAll(/\{\{([ie]\d+)\}\}/gu)].map(match => match[1]);
}

function ingredientDeletionViolation(text, meal) {
  if (!DELETION_LANGUAGE_RE.test(String(text))) return false;
  const normalized = normalizedIngredientText(text);
  return meal.locked_ingredients.some(item => [
    placeholder(item.ingredient_ref),
    item.raw_name,
    item.display_name,
    item.canonical,
  ].map(normalizedIngredientText).filter(Boolean).some(term => normalized.includes(term)));
}

function controlledMealProseValid(outputMeal, lockedMeal) {
  const contract = lockedMeal.generation_text_contract;
  if (!contract || !contract.dish_name_options.includes(outputMeal.dish_name)
      || !contract.recommendation_reason_options.includes(outputMeal.recommendation_reason)) return false;
  const expectedDishRefs = placeholderRefs(contract.dish_name_options[0]);
  if (!exactStringSet(uniqueStrings(placeholderRefs(outputMeal.dish_name)), expectedDishRefs)) return false;
  if (placeholderRefs(outputMeal.recommendation_reason).length) return false;
  return outputMeal.steps.every((step, index) => (
    contract.steps[index]?.allowed_texts.includes(step.text)
    && exactStringSet(uniqueStrings(placeholderRefs(step.text)), step.ingredient_refs)
  ));
}

function renderControlledMeal(outputMeal, lockedMeal) {
  const names = new Map(lockedMeal.locked_ingredients
    .map(item => [item.ingredient_ref, item.raw_name || item.display_name || item.canonical]));
  const render = value => String(value).replace(/\{\{([ie]\d+)\}\}/gu, (_match, ref) => names.get(ref) || '');
  const rendered = structuredClone(outputMeal);
  rendered.dish_name = render(rendered.dish_name);
  rendered.recommendation_reason = render(rendered.recommendation_reason);
  rendered.steps = rendered.steps.map(step => ({ ...step, text: render(step.text) }));
  if (/\{\{[ie]\d+\}\}/u.test(JSON.stringify(rendered))) throw new Error('placeholder_render_incomplete');
  return rendered;
}

export function validateGeneratedPlan(modelOutput, lockedPlan, termUniverse) {
  if (!exactKeys(modelOutput, TOP_LEVEL_KEYS)) return contractFailure('invalid_top_level_shape');
  if (modelOutput.plan_id !== lockedPlan.plan_id) return contractFailure('plan_id_mismatch');
  if (!Array.isArray(modelOutput.meals) || modelOutput.meals.length !== lockedPlan.meals.length) {
    return contractFailure('meal_count_mismatch');
  }
  const allRefs = new Map();
  for (const meal of lockedPlan.meals) {
    for (const ingredient of meal.locked_ingredients) allRefs.set(ingredient.ingredient_ref, meal.meal_sequence);
  }

  const validatedMeals = [];
  for (let index = 0; index < lockedPlan.meals.length; index += 1) {
    const lockedMeal = lockedPlan.meals[index];
    const outputMeal = modelOutput.meals[index];
    if (!exactKeys(outputMeal, MEAL_KEYS)) return contractFailure('invalid_meal_shape');
    if (outputMeal.meal_sequence !== lockedMeal.meal_sequence) return contractFailure('meal_sequence_mismatch');
    if (!validBoundedText(outputMeal.dish_name, MAX_DISH_NAME)
        || !validBoundedText(outputMeal.recommendation_reason, MAX_REASON)) {
      return contractFailure('invalid_prose_length');
    }
    if (ingredientDeletionViolation(`${outputMeal.dish_name}\n${outputMeal.recommendation_reason}`, lockedMeal)) {
      return contractFailure('ingredient_deletion_in_prose');
    }
    if (containsNumericClaim(outputMeal.dish_name) || containsNumericClaim(outputMeal.recommendation_reason)) {
      return contractFailure('numeric_prose_override');
    }
    if (containsMultipleVessels(outputMeal.dish_name) || containsMultipleVessels(outputMeal.recommendation_reason)) {
      return contractFailure('multiple_vessels');
    }
    if (proseIngredientViolation(`${outputMeal.dish_name}\n${outputMeal.recommendation_reason}`, lockedMeal, termUniverse)) {
      return contractFailure('unplanned_ingredient_in_prose');
    }
    const expectedRefs = lockedMeal.locked_ingredients.map(item => item.ingredient_ref);
    if (!exactStringSet(outputMeal.ingredient_refs, expectedRefs)) return contractFailure('ingredient_ref_set_mismatch');
    if (!Array.isArray(outputMeal.steps) || outputMeal.steps.length !== lockedMeal.cooking_order.length) {
      return contractFailure('action_count_mismatch');
    }
    const referenced = new Set();
    const completedEndpoints = new Set();
    for (let stepIndex = 0; stepIndex < lockedMeal.cooking_order.length; stepIndex += 1) {
      const skeleton = lockedMeal.cooking_order[stepIndex];
      const step = outputMeal.steps[stepIndex];
      if (!exactKeys(step, STEP_KEYS)) return contractFailure('invalid_step_shape');
      if (step.order !== stepIndex + 1 || step.action_code !== skeleton.action_code) {
        return contractFailure('action_order_mismatch');
      }
      const isControlledStepText = lockedMeal.generation_text_contract.steps[stepIndex]
        ?.allowed_texts.includes(step.text) === true;
      const permitsLockedNumeric = isControlledStepText && (
        (skeleton.action_code === 'add_reserved_liquid_if_needed'
          && Number.isFinite(skeleton.locked_liquid_grams)
          && step.text.includes(`${skeleton.locked_liquid_grams}克`))
        || (skeleton.action_code === 'soak_soft_grain' && step.text.includes('30分钟'))
      );
      if (!validBoundedText(step.text, MAX_STEP_TEXT)) return contractFailure('invalid_prose_length');
      if (ingredientDeletionViolation(step.text, lockedMeal)) {
        return contractFailure('ingredient_deletion_in_prose');
      }
      if (containsNumericClaim(step.text) && !permitsLockedNumeric) {
        return contractFailure('numeric_prose_override');
      }
      if (containsMultipleVessels(step.text)) return contractFailure('multiple_vessels');
      if (!isControlledStepText && proseIngredientViolation(step.text, lockedMeal, termUniverse)) {
        return contractFailure('unplanned_ingredient_in_prose');
      }
      if (!Array.isArray(step.ingredient_refs) || new Set(step.ingredient_refs).size !== step.ingredient_refs.length) {
        return contractFailure('invalid_step_refs');
      }
      if (skeleton.required_safety_endpoints.length) {
        const refs = new Set(step.ingredient_refs);
        if (skeleton.required_safety_ingredient_refs.some(ref => !refs.has(ref))) {
          return contractFailure('safety_endpoint_ingredient_ref_missing');
        }
      }
      if (!exactStringSet(step.ingredient_refs, skeleton.allowed_ingredient_refs)) {
        return contractFailure('ingredient_ref_action_mismatch');
      }
      for (const ref of step.ingredient_refs) {
        if (!allRefs.has(ref)) return contractFailure('unknown_ingredient_ref');
        if (allRefs.get(ref) !== lockedMeal.meal_sequence) return contractFailure('cross_meal_reference');
        if (!skeleton.allowed_ingredient_refs.includes(ref)) return contractFailure('ingredient_ref_action_mismatch');
        referenced.add(ref);
      }
      if (proseMentionsUnreferencedLockedIngredient(step.text, step.ingredient_refs, lockedMeal)) {
        return contractFailure('ingredient_prose_ref_mismatch');
      }
      if (!exactStringSet(step.completed_safety_endpoints, skeleton.required_safety_endpoints)) {
        return contractFailure('safety_endpoint_phase_mismatch');
      }
      if (skeleton.required_safety_endpoints.length) {
        if (!safetyEvidenceValid(step, skeleton)) return contractFailure('safety_evidence_invalid');
      }
      for (const endpoint of step.completed_safety_endpoints) {
        if (completedEndpoints.has(endpoint)) return contractFailure('duplicate_safety_endpoint');
        completedEndpoints.add(endpoint);
      }
    }
    if (!exactStringSet([...referenced], expectedRefs)) return contractFailure('ingredient_not_referenced');
    if (!exactStringSet([...completedEndpoints], lockedMeal.safety_endpoints)) {
      return contractFailure('safety_endpoint_set_mismatch');
    }
    if (!controlledMealProseValid(outputMeal, lockedMeal)) return contractFailure('uncontrolled_prose');
    let rendered;
    try {
      rendered = renderControlledMeal(outputMeal, lockedMeal);
    } catch (_error) {
      return contractFailure('placeholder_render_incomplete');
    }
    if (!explicitRawPartsPreserved(rendered, lockedMeal)) return contractFailure('ingredient_part_not_preserved');
    validatedMeals.push(rendered);
  }
  return { ok: true, meals: validatedMeals };
}

export function buildGeneratedPlanResponse(plannerResult, lockedPlan, validatedMeals) {
  return structuredClone({
    schema_version: plannerResult.schema_version,
    planner_version: plannerResult.planner_version,
    template_catalog_version: plannerResult.template_catalog_version,
    plan_id: plannerResult.plan.plan_id,
    status: plannerResult.status,
    generation_allowed: plannerResult.generation_allowed,
    mode: plannerResult.mode,
    intent: plannerResult.intent,
    normalized_items: plannerResult.normalized_items,
    commitment: plannerResult.commitment,
    plan: plannerResult.plan,
    unplanned: plannerResult.unplanned,
    actions: plannerResult.actions,
    meals: lockedPlan.meals.map((lockedMeal, index) => ({
      meal_sequence: lockedMeal.meal_sequence,
      servings: lockedMeal.servings,
      template_id: lockedMeal.template_id,
      locked_ingredients: lockedMeal.locked_ingredients,
      slot_assignment: lockedMeal.slot_assignment,
      ratio_constraints: lockedMeal.ratio_constraints,
      liquid_constraints: lockedMeal.liquid_constraints,
      time_range: lockedMeal.time_range,
      safety_endpoints: lockedMeal.safety_endpoints,
      dish_name: validatedMeals[index].dish_name,
      steps: validatedMeals[index].steps,
      recommendation_reason: validatedMeals[index].recommendation_reason,
    })),
  });
}
