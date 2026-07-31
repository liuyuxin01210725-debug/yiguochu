import { buildLockedRecipeMeal } from './recipe-runtime-compiler.js';
import { RECIPE_SAFETY_EVIDENCE_PATTERNS } from './recipe-action-registry.js';
import {
  assertCanonicalCustomPlanPresentation,
  assertPlanPresentation,
  buildCustomPlanPresentation,
} from './plan-presentation.js';

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
  add_liquid: ['将{items}倒入同一口锅并搅匀', '同锅加入{items}并搅匀，使液体分布均匀'],
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
const DETERMINISTIC_TEXT_PROFILES = Object.freeze({
  'acid-staple-pot': Object.freeze({
    dish_name_suffixes: Object.freeze(['酸香焖主食', '酸香家常锅']),
    recommendation_reasons: Object.freeze([
      '先把酸香底味炒软，再与主食同锅完成，层次清楚也方便照做。',
      '食材按快慢顺序进入同一口锅，酸香味道能够自然融进主食。',
    ]),
  }),
  'savory-mixed-rice-pot': Object.freeze({
    dish_name_suffixes: Object.freeze(['家常焖饭', '咸香一锅饭']),
    recommendation_reasons: Object.freeze([
      '先处理较慢熟的食材，再与主食一起焖熟，适合一锅完成这顿饭。',
      '食材按熟化速度分步入锅，主食和配菜能够在同一锅里协调完成。',
    ]),
  }),
  'cooked-rice-stir-pot': Object.freeze({
    dish_name_suffixes: Object.freeze(['家常炒饭', '热拌剩饭锅']),
    recommendation_reasons: Object.freeze([
      '利用已经熟的主食快速翻拌加热，步骤短，也与现成主食的状态相符。',
      '配菜先充分受热，再放入熟主食翻匀，适合把现成主食快速做成一餐。',
    ]),
  }),
  'broth-noodle-pot': Object.freeze({
    dish_name_suffixes: Object.freeze(['家常汤面', '暖汤面锅']),
    recommendation_reasons: Object.freeze([
      '汤底和配菜先煮出味道，再放入主食煮熟，顺序直接而且容易掌握。',
      '食材在同一锅汤里依次熟化，最后加入主食，适合做成一顿完整热食。',
    ]),
  }),
  'egg-tofu-vegetable-pot': Object.freeze({
    dish_name_suffixes: Object.freeze(['软嫩蔬菜锅', '软嫩家常锅']),
    recommendation_reasons: Object.freeze([
      '软嫩食材与蔬菜分阶段入锅，既能保持口感，也能把熟制要求说清楚。',
      '先让蔬菜充分受热，再轻放软嫩食材，做法温和，适合家常一锅完成。',
    ]),
  }),
  'mushroom-vegetable-stew-pot': Object.freeze({
    dish_name_suffixes: Object.freeze(['菌蔬炖锅', '家常菌蔬锅']),
    recommendation_reasons: Object.freeze([
      '菌菇先炒软释放香味，再与蔬菜同锅炖熟，味道和口感更协调。',
      '按食材熟化速度安排先后，先出香、后炖软，适合做成温热的一锅。',
    ]),
  }),
  'beef-staple-pot': Object.freeze({
    dish_name_suffixes: Object.freeze(['牛肉主食锅', '家常牛肉一锅餐']),
    recommendation_reasons: Object.freeze([
      '肉类先切成易熟的形状并充分受热，再与主食同锅完成，步骤更稳妥。',
      '先处理肉类的形状与熟度，再衔接主食和配菜，适合按顺序在家完成。',
    ]),
  }),
  'poultry-staple-pot': Object.freeze({
    dish_name_suffixes: Object.freeze(['鸡肉主食锅', '家常鸡肉一锅餐']),
    recommendation_reasons: Object.freeze([
      '禽肉先均匀受热，再与主食和配菜同锅完成，熟制检查也放在明确步骤里。',
      '食材按快慢依次入锅，禽肉熟度和主食口感都有清楚的收尾检查。',
    ]),
  }),
  'broth-rice-pot': Object.freeze({
    dish_name_suffixes: Object.freeze(['家常汤饭', '暖汤主食锅']),
    recommendation_reasons: Object.freeze([
      '先把汤底和配菜煮到合适状态，再加入主食热透，适合做成暖和的一餐。',
      '较慢熟的食材先入汤，主食在后段加入，能够兼顾口感和完成时间。',
    ]),
  }),
  'braised-noodle-pot': Object.freeze({
    dish_name_suffixes: Object.freeze(['家常焖面', '一锅焖面']),
    recommendation_reasons: Object.freeze([
      '配菜和汤汁先形成底味，再铺入主食焖熟，整套做法只用同一口锅。',
      '先把不易熟的食材处理到位，再让主食吸收汤汁，顺序清楚也便于操作。',
    ]),
  }),
  'soft-family-rice-pot': Object.freeze({
    dish_name_suffixes: Object.freeze(['软烩主食锅', '柔软家常饭']),
    recommendation_reasons: Object.freeze([
      '主食与耐煮食材先煮软，易熟食材后放，成品更柔软也方便入口。',
      '通过分阶段入锅控制软硬程度，最后得到质地温和、容易食用的一餐。',
    ]),
  }),
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

function phaseOwnsLockedIngredient(phase, ingredient) {
  if (!phase.slot_ids.includes(ingredient.slot_id)) return false;
  if (!phase.when || phase.when.slot_id !== ingredient.slot_id) return true;
  return ingredient.category === phase.when.category;
}

function uniqueStrings(values) {
  return [...new Set(values)];
}

function stableHash(value) {
  let hash = 0x811c9dc5;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function stableChoice(values, seed) {
  if (!Array.isArray(values) || values.length === 0) throw new Error('deterministic_text_option_missing');
  return values[stableHash(seed) % values.length];
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

function controlledStepTexts(
  phase,
  lockedIngredients,
  phaseActions = new Set(),
  endpointIngredientRefs = new Map(),
) {
  let templates = ACTION_TEXT_TEMPLATES[phase.action_code];
  const phaseIngredients = lockedIngredients
    .filter(item => phase.allowed_ingredient_refs.includes(item.ingredient_ref));
  if (phase.action_code === 'cook_aromatics'
      && phaseIngredients.length > 0
      && phaseIngredients.every(item => item.category === 'oil')) {
    templates = [
      '将{items}加入锅中，中小火加热至油面微微流动',
      '同锅加入{items}，开中小火加热后再进行下一步',
    ];
  }
  if (phase.action_code === 'protein_pretreat') {
    const categories = new Set(phaseIngredients.map(item => item.category));
    const shapes = new Set(phaseIngredients.map(item => item.shape_or_cut));
    if (shapes.has('ground')) {
      templates = [
        '将{items}放入锅中，用锅铲轻轻炒散，避免结成大块',
        '把{items}下锅后及时拨散，使肉末均匀受热',
      ];
    } else if (shapes.has('cured_slice')) {
      templates = [
        '将{items}按原有腌制片形分散铺开，不再重复改刀',
        '把{items}逐片铺开并保持原有形状，放在手边备用',
      ];
    } else if (shapes.has('sausage')) {
      templates = [
        '将{items}保持原形整理好；如锅具空间有限，只切成大小相近的小段',
        '把{items}按原形放好，必要时仅分成均匀小段，不再作其他改刀',
      ];
    } else if (shapes.has('tenderloin') || shapes.has('slice')) {
      templates = [
        '将{items}切成适合入口的薄片，使厚薄尽量一致',
        '把{items}顺着原部位切成薄片，放在手边备用',
      ];
    } else if (categories.has('egg')) {
      templates = ['将{items}打散至蛋液均匀', '把{items}充分搅散，静置在手边备用'];
    } else if (shapes.has('leg') || shapes.has('breast') || shapes.has('whole')) {
      templates = [
        '将{items}按原部位与原有形状整理好，不擅自改成其他肉形',
        '检查{items}的原部位并保持原形，整理后放在手边备用',
      ];
    } else if (categories.has('chicken')) {
      templates = [
        '将{items}切成大小相近的小块，便于均匀熟透',
        '把{items}按原部位整理成均匀小块并备好',
      ];
    } else {
      templates = [
        '将{items}按现有部位与形状整理好，不擅自改变食材形态',
        '检查{items}的原有状态并保持其形态，整理后备用',
      ];
    }
  }
  if (phase.action_code === 'sear_beef' && phaseActions.has('protein_pretreat')) {
    templates = [
      '将{items}平铺入锅翻炒，直至表面均匀变色',
      '把{items}放入锅中摊开，并逐面翻炒至均匀变色',
    ];
  }
  if (phase.action_code === 'add_staple_and_liquid'
      && phaseIngredients.some(item => item.category === 'cooked_rice')) {
    templates = [
      '将{items}加入同一口锅轻轻翻拌，继续加热至水分基本收匀，并确认熟米饭整体热透',
      '同锅加入{items}并翻匀，保持加热至汤汁收匀、熟米饭整体热透',
    ];
  }
  if (!Array.isArray(templates) || templates.length < 2) {
    throw new Error(`locked_action_phrase_missing:${phase.action_code}`);
  }
  const refs = joinedPlaceholders(phase.allowed_ingredient_refs);
  const safety = phase.required_safety_endpoints.map(endpoint => (
    endpointEvidencePhrase(
      endpoint,
      endpointIngredientRefs.get(endpoint) || phase.required_safety_ingredient_refs,
    )
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
    allowed_ingredient_refs: locked.filter(item => phaseOwnsLockedIngredient(phase, item))
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
    const insertionIndex = phases.findIndex(phase => (
      phase.action_code === 'add_staple_and_liquid' || phase.action_code === 'add_noodle'
    ));
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
    const oilPhaseIndex = phases.findIndex(phase => (
      /acid_base_cookdown|cook_aromatics|sear_beef|cook_poultry_through|add_pork|add_mushroom|add_liquid|add_staple.*liquid|add_slow_cooking_items|gentle_set_protein|stir_cooked_rice/u
        .test(phase.action_code)
    ));
    const mixturePhaseIndex = phases.findIndex(phase => (
      /liquid|broth|staple.*liquid|add_noodle|stir_cooked_rice|simmer_until_tender/u.test(phase.action_code)
    ));
    let phaseIndex = ingredient.slot_id === 'oil'
      ? oilPhaseIndex
      : ['liquid', 'seasoning'].includes(ingredient.slot_id) ? mixturePhaseIndex : 0;
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
  const textProfile = DETERMINISTIC_TEXT_PROFILES[pot.template_id];
  if (!textProfile) throw new Error(`deterministic_text_profile_missing:${pot.template_id}`);
  const presentation = context.plan_source === 'custom_template'
    ? assertCanonicalCustomPlanPresentation(context.presentation, {
        mode: context.mode,
        plan: {
          planned_must_use: pot.planned_must_use || [],
          planned_prefer_use: pot.planned_prefer_use || [],
          pots: [pot],
        },
      })
    : assertPlanPresentation(context.presentation, {
        planSource: context.plan_source,
        recipeId: context.recipe_id,
        variantId: context.variant_id,
        identityLevel: context.identity_level,
      });
  const modeReason = context.mode === 'pantry'
    ? '已经安排的食材会按清库存承诺和确认顺序进入这套做法。'
    : '这套做法优先采用本次更适合一起下锅的食材，并按确认顺序完成。';
  const intentReasons = {
    quick: '这份做法按快手目标与已确认顺序执行。',
    fresh: '这份做法按清爽目标与已确认顺序执行。',
    batch: '这份做法按批量备餐目标与已确认顺序执行。',
  };
  const generationTextContract = {
    dish_name_options: [presentation.title],
    steps: phases.map((phase, index) => ({
      order: index + 1,
      allowed_texts: controlledStepTexts(
        phase,
        locked,
        new Set(phases.map(entry => entry.action_code)),
        endpointIngredientRefs,
      ),
    })),
    recommendation_reason_options: uniqueStrings([
      ...textProfile.recommendation_reasons,
      modeReason,
      intentReasons[context.intent],
    ].filter(Boolean)),
  };

  return {
    meal_sequence: pot.meal_sequence,
    servings: pot.servings,
    template_id: pot.template_id,
    plan_source: context.plan_source,
    recipe_id: context.recipe_id,
    variant_id: context.variant_id,
    identity_level: context.identity_level,
    presentation,
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

const CUSTOM_IDENTITY_FIELDS = new Set([
  'plan_source', 'recipe_id', 'variant_id', 'identity_level', 'presentation', 'canonical_name',
]);
const CUSTOM_PLAN_FIELDS = new Set([
  'plan_kind', 'planned_must_use', 'planned_prefer_use', 'unplanned_must_use', 'unused_prefer_use',
  'required_extra_items', 'coverage_ratio', 'recognition_ratio', 'recognized_coverage_ratio',
  'rejection_reason', 'pots', 'plan_id',
]);
const CUSTOM_POT_FIELDS = new Set([
  'ok', 'template_id', 'slot_assignment', 'assignment_key', 'servings', 'time_range', 'safety_endpoints',
  'safety_complete', 'ingredient_amounts', 'required_extra_items', 'liquid_constraints', 'ratio_trace',
  'rejection_reason', 'planned_must_use', 'planned_prefer_use', 'coverage_ratio', 'recognition_ratio',
  'recognized_coverage_ratio', 'single_pot_eligible', 'meal_sequence', 'label', 'remaining_must_use_after',
]);

function assertCustomIdentityClean(value) {
  if (!isPlainObject(value)) throw new Error('custom_plan_identity_invalid');
  const visit = node => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!isPlainObject(node)) return;
    for (const [field, child] of Object.entries(node)) {
      if (CUSTOM_IDENTITY_FIELDS.has(field)) throw new Error('custom_plan_identity_invalid');
      visit(child);
    }
  };
  for (const [field, child] of Object.entries(value)) {
    if (CUSTOM_IDENTITY_FIELDS.has(field)) throw new Error('custom_plan_identity_invalid');
    visit(child);
  }
}

function customAllowlistedPlan(plan) {
  assertCustomIdentityClean(plan);
  const next = {};
  for (const [key, value] of Object.entries(plan)) {
    if (!CUSTOM_PLAN_FIELDS.has(key)) throw new Error(`custom_plan_field_invalid:${key}`);
    if (key !== 'pots') next[key] = structuredClone(value);
  }
  next.pots = plan.pots.map(pot => {
    assertCustomIdentityClean(pot);
    const nextPot = {};
    for (const [key, value] of Object.entries(pot)) {
      if (!CUSTOM_POT_FIELDS.has(key)) throw new Error(`custom_plan_pot_field_invalid:${key}`);
      nextPot[key] = structuredClone(value);
    }
    return nextPot;
  });
  return next;
}

export function buildLockedPlanContract(
  plannerResult, templateCatalog, recipeRuntimeCatalog, ratioCatalog, recipeLibrary, actionProfileCatalog,
) {
  if (!isPlainObject(plannerResult) || !isPlainObject(plannerResult.plan)
      || typeof plannerResult.plan.plan_id !== 'string' || !Array.isArray(plannerResult.plan.pots)) {
    throw new Error('invalid_planner_result');
  }
  if (plannerResult.plan_source === 'named_recipe' || plannerResult.plan_source === 'recipe_variant') {
    if (typeof plannerResult.recipe_runtime_catalog_version !== 'string'
        || plannerResult.recipe_runtime_catalog_version.length === 0
        || plannerResult.recipe_runtime_catalog_version !== recipeRuntimeCatalog?.recipe_runtime_catalog_version) {
      throw new Error('named_recipe_runtime_catalog_stale');
    }
    const runtimeEntry = recipeRuntimeCatalog?.entries?.find(entry => entry?.recipe_id === plannerResult.recipe_id);
    const recipeRecord = recipeLibrary?.recipes?.find(recipe => recipe?.id === plannerResult.recipe_id);
    const meal = buildLockedRecipeMeal(
      plannerResult, runtimeEntry, ratioCatalog, recipeRecord, actionProfileCatalog,
    );
    return structuredClone({
      plan_id: plannerResult.plan.plan_id,
      planner_version: plannerResult.planner_version,
      template_catalog_version: plannerResult.template_catalog_version,
      recipe_runtime_catalog_version: plannerResult.recipe_runtime_catalog_version,
      mode: plannerResult.mode,
      intent: plannerResult.intent,
      plan_source: plannerResult.plan_source,
      recipe_id: plannerResult.recipe_id,
      variant_id: plannerResult.variant_id,
      identity_level: plannerResult.identity_level,
      presentation: meal.presentation,
      plan: plannerResult.plan,
      meals: [meal],
    });
  }
  if ((plannerResult.plan_source ?? 'custom_template') !== 'custom_template'
      || plannerResult.recipe_id != null || plannerResult.variant_id != null
      || (plannerResult.identity_level ?? 'custom') !== 'custom'
      || Object.hasOwn(plannerResult, 'canonical_name')) {
    throw new Error('custom_plan_identity_invalid');
  }
  const presentation = assertCanonicalCustomPlanPresentation(
    plannerResult.presentation,
    plannerResult,
  );
  const lockedCustomPlan = customAllowlistedPlan(plannerResult.plan);
  const templates = new Map((templateCatalog?.templates || []).map(template => [template.template_id, template]));
  const refCounters = { user: 1, extra: 1 };
  const meals = [...plannerResult.plan.pots].sort((left, right) => left.meal_sequence - right.meal_sequence)
    .map(pot => {
      const template = templates.get(pot.template_id);
      if (!template) throw new Error(`locked_template_missing:${pot.template_id}`);
      const mealPresentation = buildCustomPlanPresentation({
        mode: plannerResult.mode,
        plan: {
          planned_must_use: pot.planned_must_use || [],
          planned_prefer_use: pot.planned_prefer_use || [],
          pots: [pot],
        },
      });
      return buildLockedMeal(pot, template, refCounters, {
        mode: plannerResult.mode,
        intent: plannerResult.intent,
        plan_source: 'custom_template',
        recipe_id: null,
        variant_id: null,
        identity_level: 'custom',
        presentation: mealPresentation,
      });
    });
  return structuredClone({
    plan_id: plannerResult.plan.plan_id,
    planner_version: plannerResult.planner_version,
    template_catalog_version: plannerResult.template_catalog_version,
    recipe_runtime_catalog_version: plannerResult.recipe_runtime_catalog_version ?? null,
    mode: plannerResult.mode,
    intent: plannerResult.intent,
    plan_source: 'custom_template',
    recipe_id: null,
    variant_id: null,
    identity_level: 'custom',
    presentation,
    plan: lockedCustomPlan,
    meals,
  });
}

export function validateDeterministicTextProfiles(templateCatalog) {
  const errors = [];
  for (const template of templateCatalog?.templates || []) {
    if (template.activation_status !== 'active' || template.runtime_eligible !== true) continue;
    const profile = DETERMINISTIC_TEXT_PROFILES[template.template_id];
    if (!profile) {
      errors.push(`deterministic_text_profile_missing:${template.template_id}`);
      continue;
    }
    for (const field of ['dish_name_suffixes', 'recommendation_reasons']) {
      const values = profile[field];
      if (!Array.isArray(values) || values.length < 2
          || values.some(value => typeof value !== 'string' || !value.trim())) {
        errors.push(`deterministic_text_profile_invalid:${template.template_id}:${field}`);
      }
    }
  }
  return errors;
}

export function buildDeterministicGeneratedPlan(lockedPlan) {
  if (!isPlainObject(lockedPlan) || typeof lockedPlan.plan_id !== 'string'
      || !Array.isArray(lockedPlan.meals)) {
    throw new Error('invalid_locked_plan');
  }
  return {
    plan_id: lockedPlan.plan_id,
    meals: lockedPlan.meals.map(meal => ({
      meal_sequence: meal.meal_sequence,
      dish_name: stableChoice(
        meal.generation_text_contract?.dish_name_options,
        `${lockedPlan.plan_id}:${meal.meal_sequence}:dish`,
      ),
      ingredient_refs: meal.locked_ingredients.map(item => item.ingredient_ref),
      steps: meal.cooking_order.map((phase, index) => ({
        order: index + 1,
        action_code: phase.action_code,
        text: stableChoice(
          meal.generation_text_contract?.steps?.[index]?.allowed_texts,
          `${lockedPlan.plan_id}:${meal.meal_sequence}:step:${index + 1}`,
        ),
        ingredient_refs: [...phase.allowed_ingredient_refs],
        completed_safety_endpoints: [...phase.required_safety_endpoints],
      })),
      recommendation_reason: stableChoice(
        meal.generation_text_contract?.recommendation_reason_options,
        `${lockedPlan.plan_id}:${meal.meal_sequence}:reason`,
      ),
    })),
  };
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

function safetyEvidenceValid(step, skeleton, lockedMeal) {
  if (!skeleton.required_safety_endpoints.length) return true;
  const refs = new Set(step.ingredient_refs);
  if (skeleton.required_safety_ingredient_refs.some(ref => !refs.has(ref))) return false;
  if (NON_ACHIEVED_SAFETY_RE.test(step.text)) return false;
  const isNamedRecipe = lockedMeal?.plan_source === 'named_recipe';
  return skeleton.required_safety_endpoints.every(endpoint => {
    const pattern = isNamedRecipe
      ? RECIPE_SAFETY_EVIDENCE_PATTERNS[endpoint] ?? SAFETY_EVIDENCE_RULES[endpoint]
      : SAFETY_EVIDENCE_RULES[endpoint];
    return pattern?.test(step.text);
  });
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
        || (Array.isArray(skeleton.locked_numeric_facts)
          && skeleton.locked_numeric_facts.length > 0
          && skeleton.locked_numeric_facts.every(fact => step.text.includes(fact)))
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
        if (!safetyEvidenceValid(step, skeleton, lockedMeal)) return contractFailure('safety_evidence_invalid');
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
    recipe_runtime_catalog_version: lockedPlan.recipe_runtime_catalog_version ?? null,
    plan_id: lockedPlan.plan_id,
    status: plannerResult.status,
    generation_allowed: plannerResult.generation_allowed,
    mode: plannerResult.mode,
    intent: plannerResult.intent,
    plan_source: lockedPlan.plan_source,
    recipe_id: lockedPlan.recipe_id,
    variant_id: lockedPlan.variant_id,
    identity_level: lockedPlan.identity_level,
    presentation: structuredClone(lockedPlan.presentation || null),
    normalized_items: plannerResult.normalized_items,
    commitment: plannerResult.commitment,
    plan: lockedPlan.plan,
    unplanned: plannerResult.unplanned,
    actions: plannerResult.actions,
    meals: lockedPlan.meals.map((lockedMeal, index) => ({
      meal_sequence: lockedMeal.meal_sequence,
      servings: lockedMeal.servings,
      template_id: lockedMeal.template_id,
      plan_source: lockedMeal.plan_source,
      recipe_id: lockedMeal.recipe_id,
      variant_id: lockedMeal.variant_id,
      identity_level: lockedMeal.identity_level,
      presentation: structuredClone(lockedMeal.presentation || null),
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
