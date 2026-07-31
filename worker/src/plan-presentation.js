export const PLAN_PRESENTATION_KEYS = Object.freeze([
  'badge',
  'title',
  'subtitle',
  'source_label',
  'canonical_path',
]);

export const CANONICAL_RECIPE_SUBTITLE = '按已核验菜谱的用料、比例与熟制顺序呈现。';
export const REVIEWED_VARIANT_SUBTITLE = '采用已复核的食材替换，并以菜谱替换版呈现。';
export const CUSTOM_PLAN_SUBTITLE = '按本次选中的食材与受控家常技法组合。';
export const PROJECT_RECIPE_SOURCE_LABEL = '查看一锅出标准配方';

const TECHNIQUE_BY_TEMPLATE = Object.freeze({
  'acid-staple-pot': '焖饭',
  'savory-mixed-rice-pot': '焖饭',
  'cooked-rice-stir-pot': '快炒饭',
  'broth-noodle-pot': '汤面',
  'egg-tofu-vegetable-pot': '炖锅',
  'mushroom-vegetable-stew-pot': '炖锅',
  'beef-staple-pot': '焖饭',
  'poultry-staple-pot': '焖饭',
  'broth-rice-pot': '汤饭',
  'braised-noodle-pot': '焖面',
  'soft-family-rice-pot': '炖锅',
});
const CONTROLLED_TECHNIQUES = new Set([...Object.values(TECHNIQUE_BY_TEMPLATE), '烩饭']);
const UNSAFE_TEXT_RE = /[<>\u0000-\u001f\u007f]/u;
const NAMED_IMPLICATION_RE = /人工批准|正宗|标准菜谱/u;
const CUSTOM_IDENTITY_RE = /地域|正宗|传统|经典|酸香主食锅|家常主食锅/iu;
const ENGINEERING_LABEL_RE = /(?:[a-z0-9]+-){1,}[a-z0-9-]+/iu;

function exactKeys(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...PLAN_PRESENTATION_KEYS].sort());
}

function exactSafeText(value, maxLength) {
  return typeof value === 'string'
    && value === value.trim()
    && value.length > 0
    && [...value].length <= maxLength
    && !UNSAFE_TEXT_RE.test(value);
}

function exactNullableSafeText(value, maxLength) {
  return value === null || exactSafeText(value, maxLength);
}

function validRecipeId(value) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value);
}

export function projectCanonicalRecipePath(recipeId) {
  return validRecipeId(recipeId) ? `/recipes.html?id=${recipeId}` : null;
}

export function buildNamedRecipePresentation({ recipeId, title, variant = false } = {}) {
  const canonicalPath = projectCanonicalRecipePath(recipeId);
  if (!canonicalPath || !exactSafeText(title, 80)) return null;
  return {
    badge: variant ? '菜谱替换版' : '依据菜谱',
    title,
    subtitle: variant ? REVIEWED_VARIANT_SUBTITLE : CANONICAL_RECIPE_SUBTITLE,
    source_label: PROJECT_RECIPE_SOURCE_LABEL,
    canonical_path: canonicalPath,
  };
}

function plannedUserItems(result) {
  const plan = result?.plan || result || {};
  const preferred = Array.isArray(plan.planned_prefer_use) ? plan.planned_prefer_use : [];
  const required = Array.isArray(plan.planned_must_use) ? plan.planned_must_use : [];
  const selected = result?.mode === 'pantry' ? required : preferred.length ? preferred : required;
  return selected;
}

function plannedPot(result) {
  return result?.plan?.pots?.[0] || result?.pots?.[0] || result || {};
}

function plannedStapleCategory(result) {
  const pot = plannedPot(result);
  const assigned = Array.isArray(pot?.slot_assignment?.staple)
    ? pot.slot_assignment.staple : [];
  const extra = Array.isArray(pot?.required_extra_items)
    ? pot.required_extra_items : [];
  return [...assigned, ...extra].map(item => item?.category)
    .find(category => ['raw_rice','cooked_rice','noodle'].includes(category)) || null;
}

function techniqueForResult(templateId, result) {
  if (templateId === 'acid-staple-pot') {
    const stapleCategory = plannedStapleCategory(result);
    if (stapleCategory === 'noodle') return '汤面';
    if (stapleCategory === 'cooked_rice') return '烩饭';
    if (stapleCategory === 'raw_rice') return '焖饭';
  }
  if (templateId === 'beef-staple-pot' || templateId === 'poultry-staple-pot') {
    const stapleCategory = plannedStapleCategory(result);
    if (stapleCategory === 'noodle') return '汤面';
    if (stapleCategory === 'cooked_rice') return '汤饭';
    if (stapleCategory === 'raw_rice') return '焖饭';
  }
  return TECHNIQUE_BY_TEMPLATE[templateId];
}

function decisiveIngredientNames(result, technique) {
  const items = plannedUserItems(result);
  const inherentStapleCategories = ['汤面','焖面'].includes(technique)
    ? new Set(['noodle'])
    : ['焖饭','烩饭','汤饭','快炒饭'].includes(technique)
      ? new Set(['raw_rice','cooked_rice']) : new Set();
  const visibleItems = items.filter(item => !inherentStapleCategories.has(item?.category));
  const sourceItems = visibleItems.length ? visibleItems : items;
  const names = [];
  for (const item of sourceItems) {
    // A custom plan must keep the cook's own ingredient wording. Canonical
    // identity is for matching and safety, not permission to silently narrow
    // a generic input such as "豆腐" to "老豆腐" in the public title.
    const value = [item?.raw, item?.display_name, item?.canonical]
      .find(candidate => exactSafeText(candidate, 24));
    if (!value || names.includes(value)) continue;
    names.push(value);
    if (names.length === 2) break;
  }
  return names;
}

export function buildCustomPlanPresentation(result = {}) {
  const templateId = result?.plan?.pots?.[0]?.template_id
    || result?.pots?.[0]?.template_id
    || result?.template_id;
  const technique = techniqueForResult(templateId, result);
  const ingredients = decisiveIngredientNames(result, technique);
  if (!technique || ingredients.length === 0) return null;
  const presentation = {
    badge: '自定义方案',
    title: `${ingredients.join('、')}${technique}`,
    subtitle: CUSTOM_PLAN_SUBTITLE,
    source_label: null,
    canonical_path: null,
  };
  return validatePlanPresentation(presentation, {
    planSource: 'custom_template', recipeId: null, variantId: null, identityLevel: 'custom',
  }) ? presentation : null;
}

export function validatePlanPresentation(presentation, identity = {}) {
  if (!exactKeys(presentation)
      || !exactSafeText(presentation.badge, 16)
      || !exactSafeText(presentation.title, 80)
      || !exactSafeText(presentation.subtitle, 160)
      || !exactNullableSafeText(presentation.source_label, 40)
      || !exactNullableSafeText(presentation.canonical_path, 160)) return false;

  const {
    planSource, recipeId, variantId, identityLevel, expectedTitle = null, canonicalTitle = null,
  } = identity;
  if (expectedTitle !== null && presentation.title !== expectedTitle) return false;
  if (planSource === 'custom_template') {
    const technique = [...CONTROLLED_TECHNIQUES].find(value => presentation.title.endsWith(value));
    return identityLevel === 'custom' && recipeId == null && variantId == null
      && presentation.badge === '自定义方案'
      && presentation.source_label === null && presentation.canonical_path === null
      && Boolean(technique)
      && !CUSTOM_IDENTITY_RE.test(`${presentation.title}\n${presentation.subtitle}`)
      && !ENGINEERING_LABEL_RE.test(`${presentation.title}\n${presentation.subtitle}`);
  }
  if (planSource === 'named_recipe') {
    return identityLevel === 'canonical' && variantId == null && validRecipeId(recipeId)
      && presentation.badge === '依据菜谱'
      && presentation.subtitle === CANONICAL_RECIPE_SUBTITLE
      && presentation.source_label === PROJECT_RECIPE_SOURCE_LABEL
      && presentation.canonical_path === projectCanonicalRecipePath(recipeId)
      && !NAMED_IMPLICATION_RE.test(`${presentation.badge}\n${presentation.title}\n${presentation.subtitle}`);
  }
  if (planSource === 'recipe_variant') {
    return ['approved_variant', 'style_adaptation'].includes(identityLevel)
      && validRecipeId(recipeId) && typeof variantId === 'string' && variantId.length > 0
      && presentation.badge === '菜谱替换版'
      && presentation.subtitle === REVIEWED_VARIANT_SUBTITLE
      && presentation.source_label === PROJECT_RECIPE_SOURCE_LABEL
      && presentation.canonical_path === projectCanonicalRecipePath(recipeId)
      && (canonicalTitle === null || presentation.title !== canonicalTitle)
      && !NAMED_IMPLICATION_RE.test(`${presentation.title}\n${presentation.subtitle}`);
  }
  return false;
}

export function assertPlanPresentation(presentation, identity = {}) {
  if (!validatePlanPresentation(presentation, identity)) {
    throw new Error('plan_presentation_invalid');
  }
  return structuredClone(presentation);
}

export function assertCanonicalCustomPlanPresentation(presentation, result = {}) {
  const received = assertPlanPresentation(presentation, {
    planSource: 'custom_template', recipeId: null, variantId: null, identityLevel: 'custom',
  });
  const expected = buildCustomPlanPresentation(result);
  if (!expected || PLAN_PRESENTATION_KEYS.some(key => received[key] !== expected[key])) {
    throw new Error('custom_plan_presentation_mismatch');
  }
  return received;
}
