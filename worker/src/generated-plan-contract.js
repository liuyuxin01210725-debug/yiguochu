const TOP_LEVEL_KEYS = ['plan_id', 'meals'];
const MEAL_KEYS = ['meal_sequence', 'dish_name', 'ingredient_refs', 'steps', 'recommendation_reason'];
const STEP_KEYS = ['order', 'action_code', 'text', 'ingredient_refs', 'completed_safety_endpoints'];
const MAX_DISH_NAME = 80;
const MAX_STEP_TEXT = 400;
const MAX_REASON = 300;

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
  if (!exact || typeof exact.grams !== 'number' || !Number.isFinite(exact.grams) || exact.grams < 0) {
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

function uniqueStrings(values) {
  return [...new Set(values)];
}

function buildLockedMeal(pot, template, refCounters) {
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
    source: 'user',
    slot_id,
    planned_grams: amountFor(item, pot),
  }));

  for (const extra of pot.required_extra_items || []) {
    if (!extra || typeof extra.name !== 'string' || typeof extra.grams !== 'number' || !Number.isFinite(extra.grams)) {
      throw new Error('locked_basic_extra_invalid');
    }
    locked.push({
      ingredient_ref: `e${refCounters.extra++}`,
      raw_name: extra.name,
      display_name: extra.name,
      canonical: extra.canonical || extra.name,
      category: extra.category,
      shape_or_cut: null,
      source: 'basic_extra',
      slot_id: basicExtraSlot(extra, slotByName),
      planned_grams: extra.grams,
    });
  }

  const requiredEndpointCategories = new Map((template.safety_endpoints || [])
    .map(endpoint => [endpoint.endpoint_code, endpoint.applies_to_category]));
  const endpointSlots = new Map();
  for (const slotId of orderedSlotIds) {
    for (const item of pot.slot_assignment?.[slotId] || []) {
      for (const [endpoint, category] of requiredEndpointCategories) {
        if (item.category === category) endpointSlots.set(endpoint, slotId);
      }
    }
  }
  const requiredEndpoints = [...endpointSlots.keys()].sort();
  const phases = (template.cooking_order || []).map(phase => ({
    phase: phase.phase,
    action_code: phase.action_code,
    slot_ids: [...phase.slot_ids],
    allowed_ingredient_refs: locked.filter(item => phase.slot_ids.includes(item.slot_id))
      .map(item => item.ingredient_ref),
    required_safety_endpoints: [],
  }));
  for (const ingredient of locked.filter(item => item.source === 'basic_extra')) {
    if (phases.some(phase => phase.allowed_ingredient_refs.includes(ingredient.ingredient_ref))) continue;
    let phaseIndex = ingredient.slot_id === 'liquid'
      ? phases.findIndex(phase => /liquid|broth|staple_and_liquid/u.test(phase.action_code))
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
    if (phaseIndex >= 0) phases[phaseIndex].required_safety_endpoints.push(endpoint);
  }
  for (const ingredient of locked) {
    if (phases.some(phase => phase.allowed_ingredient_refs.includes(ingredient.ingredient_ref))) continue;
    if (phases.length) phases[0].allowed_ingredient_refs.push(ingredient.ingredient_ref);
  }

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
      return buildLockedMeal(pot, template, refCounters);
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

function exactStringSet(values, expected) {
  if (!Array.isArray(values) || values.some(value => typeof value !== 'string')) return false;
  if (new Set(values).size !== values.length) return false;
  const sorted = [...values].sort();
  const expectedSorted = [...expected].sort();
  return JSON.stringify(sorted) === JSON.stringify(expectedSorted);
}

function containsNumericClaim(text) {
  return /(?:\d+(?:\.\d+)?\s*(?:克|g|毫升|ml|分钟|小时|份|碗|勺)|\d+\s*[:：比]\s*\d+|[一二两三四五六七八九十百]+\s*(?:克|毫升|分钟|小时|份|碗|勺))/iu.test(text);
}

function containsMultipleVessels(text) {
  if (/(?:另起|再起|第二)(?:一口|口)?(?:锅|炒锅|汤锅|平底锅)|分成?两锅|第二锅/u.test(text)) return true;
  const vesselKinds = new Set([...String(text).matchAll(/电饭锅|高压锅|平底锅|炒锅|汤锅|砂锅|蒸锅/gu)].map(match => match[0]));
  return vesselKinds.size > 1;
}

function taxonomyTerms(taxonomy) {
  const terms = [];
  for (const item of taxonomy?.items || []) {
    for (const term of [item.display_name, item.canonical_name, ...(item.aliases || [])]) {
      const normalized = normalizedIngredientText(term);
      if (normalized.length >= 2) terms.push({ term: String(term), normalized });
    }
  }
  return terms.sort((left, right) => right.normalized.length - left.normalized.length);
}

function proseIngredientViolation(text, meal, taxonomy) {
  const normalized = normalizedIngredientText(text);
  const allowed = new Set(meal.locked_ingredients.flatMap(item => [item.raw_name, item.display_name, item.canonical])
    .map(normalizedIngredientText).filter(Boolean));
  for (const candidate of taxonomyTerms(taxonomy)) {
    if (!normalized.includes(candidate.normalized)) continue;
    if (!allowed.has(candidate.normalized)) return true;
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

export function validateGeneratedPlan(modelOutput, lockedPlan, taxonomy) {
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
    if (containsNumericClaim(outputMeal.dish_name) || containsNumericClaim(outputMeal.recommendation_reason)) {
      return contractFailure('numeric_prose_override');
    }
    if (containsMultipleVessels(outputMeal.dish_name) || containsMultipleVessels(outputMeal.recommendation_reason)) {
      return contractFailure('multiple_vessels');
    }
    if (proseIngredientViolation(`${outputMeal.dish_name}\n${outputMeal.recommendation_reason}`, lockedMeal, taxonomy)) {
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
      if (!validBoundedText(step.text, MAX_STEP_TEXT)) return contractFailure('invalid_prose_length');
      if (containsNumericClaim(step.text)) return contractFailure('numeric_prose_override');
      if (containsMultipleVessels(step.text)) return contractFailure('multiple_vessels');
      if (proseIngredientViolation(step.text, lockedMeal, taxonomy)) return contractFailure('unplanned_ingredient_in_prose');
      if (!Array.isArray(step.ingredient_refs) || new Set(step.ingredient_refs).size !== step.ingredient_refs.length) {
        return contractFailure('invalid_step_refs');
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
      for (const endpoint of step.completed_safety_endpoints) {
        if (completedEndpoints.has(endpoint)) return contractFailure('duplicate_safety_endpoint');
        completedEndpoints.add(endpoint);
      }
    }
    if (!exactStringSet([...referenced], expectedRefs)) return contractFailure('ingredient_not_referenced');
    if (!exactStringSet([...completedEndpoints], lockedMeal.safety_endpoints)) {
      return contractFailure('safety_endpoint_set_mismatch');
    }
    validatedMeals.push(structuredClone(outputMeal));
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
