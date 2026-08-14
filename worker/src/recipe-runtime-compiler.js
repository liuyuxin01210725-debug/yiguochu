import { compileRatioPlan } from './planner-v2.js';
import {
  RECIPE_ACTION_REGISTRY,
  RECIPE_SAFETY_EVIDENCE_REGISTRY,
  RECIPE_SEASONING_WRITERS,
} from './recipe-action-registry.js';
import { materializeProfileActions, resolveRecipeActionProfile } from './recipe-action-profile-validator.js';
import { buildNamedRecipePresentation } from './plan-presentation.js';

const BASIC_EXTRA_IDS = new Set(['water', 'salt', 'cooking-oil']);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const unique = values => [...new Set(values)];
const placeholder = ref => `{{${ref}}}`;
const joinRefs = refs => refs.map(placeholder).join('、');

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (isObject(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function assertExact(actual, expected, code) {
  if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error(code);
}

function runtimeEntryFor(plannerResult, entry) {
  if (plannerResult.plan_source === 'recipe_variant') throw new Error('recipe_variant_not_executable');
  if (plannerResult.plan_source !== 'named_recipe') throw new Error('named_recipe_identity_invalid');
  if (!entry || entry.recipe_id !== plannerResult.recipe_id
      || entry.activation_status !== 'preview_enabled') throw new Error('named_recipe_not_executable');
  const expectedPresentation = buildNamedRecipePresentation({
    recipeId: entry?.recipe_id,
    title: entry?.naming?.canonical_name,
  });
  if (plannerResult.identity_level !== 'canonical' || plannerResult.variant_id != null
      || !expectedPresentation
      || canonicalJson(plannerResult.presentation) !== canonicalJson(expectedPresentation)) {
    throw new Error('named_recipe_identity_invalid');
  }
  return entry;
}

function exactUniqueSet(actual, expected) {
  return Array.isArray(actual) && actual.every(value => typeof value === 'string' && value.length > 0)
    && new Set(actual).size === actual.length
    && actual.length === expected.length
    && actual.every(value => expected.includes(value));
}

function exactUniqueSequence(actual, expected) {
  return Array.isArray(actual) && Array.isArray(expected)
    && actual.every(value => typeof value === 'string' && value.length > 0)
    && expected.every(value => typeof value === 'string' && value.length > 0)
    && new Set(actual).size === actual.length
    && new Set(expected).size === expected.length
    && actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);
}

function runtimeContractFailure(detail) {
  throw new Error(`named_recipe_runtime_contract_invalid:${detail}`);
}

function assertRuntimeExecutionContract(entry, profile, { assigned, compiled, retainedCooked }) {
  const graph = materializeProfileActions(profile);
  if (!Array.isArray(graph) || graph.length === 0) runtimeContractFailure('action_profile');
  const assignedSlots = new Set(assigned.map(row => row.slotId));
  const slotByCanonical = new Map(assigned.map(row => [row.item.canonical_id, row.slotId]));
  const reachableSlots = new Set();
  const endpointByCode = new Map();
  for (const endpoint of entry.safety_endpoints || []) {
    if (!endpoint?.endpoint_code || endpointByCode.has(endpoint.endpoint_code)
        || !exactUniqueSet(endpoint.canonical_ids, endpoint.canonical_ids || [])
        || !RECIPE_SAFETY_EVIDENCE_REGISTRY[endpoint.endpoint_code]) {
      runtimeContractFailure('safety_endpoints');
    }
    endpointByCode.set(endpoint.endpoint_code, endpoint);
  }
  if (endpointByCode.size === 0) runtimeContractFailure('safety_endpoints');

  const availableResources = new Set();
  const producedCounts = new Map();
  const consumedCounts = new Map();
  let previousPhase = 0;
  let safetyStepCount = 0;
  for (const [index, step] of graph.entries()) {
    const schema = RECIPE_ACTION_REGISTRY[step?.action_code];
    if (!schema || !Number.isInteger(step.phase) || step.phase <= previousPhase) {
      runtimeContractFailure('phase_or_action');
    }
    previousPhase = step.phase;
    const slotIds = step.slot_ids || [];
    if (!exactUniqueSet(slotIds, slotIds) || slotIds.some(slotId => !assignedSlots.has(slotId))) {
      runtimeContractFailure('slot_ownership');
    }
    let expectedSlotSets = schema.exact_slot_sets;
    const safetyCodes = step.safety_endpoint_codes || [];
    if (step.action_code === 'complete_recipe_safety') {
      safetyStepCount += 1;
      if (index !== graph.length - 1 || !exactUniqueSet(safetyCodes, [...endpointByCode.keys()])) {
        runtimeContractFailure('safety_completion');
      }
      const ownerSlots = [...new Set(safetyCodes.flatMap(code => (
        endpointByCode.get(code).canonical_ids.map(canonicalId => slotByCanonical.get(canonicalId))
      )))].filter(Boolean);
      expectedSlotSets = [ownerSlots];
    } else if (safetyCodes.length) {
      runtimeContractFailure('safety_completion');
    }
    if (!expectedSlotSets.some(expected => exactUniqueSet(slotIds, expected))) {
      runtimeContractFailure(`slot_schema:${step.action_code}`);
    }
    slotIds.forEach(slotId => reachableSlots.add(slotId));
    if (!exactUniqueSet(step.fact_refs || [], schema.required_facts)) {
      runtimeContractFailure(`fact_schema:${step.action_code}`);
    }
    const produces = step.produces_resources || [];
    const consumes = step.consumes_resources || [];
    if (!exactUniqueSet(produces, schema.produces_resources)
        || !exactUniqueSet(consumes, schema.consumes_resources)) {
      runtimeContractFailure(`resource_schema:${step.action_code}`);
    }
    for (const resource of produces) {
      producedCounts.set(resource, (producedCounts.get(resource) || 0) + 1);
      availableResources.add(resource);
    }
    for (const resource of consumes) {
      if (!availableResources.has(resource)) runtimeContractFailure(`resource_order:${resource}`);
      consumedCounts.set(resource, (consumedCounts.get(resource) || 0) + 1);
    }
  }
  if (safetyStepCount !== 1) runtimeContractFailure('safety_completion');
  for (const canonicalId of entry.identity_signature.required_canonical_ids || []) {
    const slotId = slotByCanonical.get(canonicalId);
    if (!slotId || !reachableSlots.has(slotId)) runtimeContractFailure(`unreachable_identity:${canonicalId}`);
  }
  const retainedCountValid = producedCounts.get('retained_cooked_liquid') === 1
    && consumedCounts.get('retained_cooked_liquid') === 1;
  if (retainedCooked !== retainedCountValid) runtimeContractFailure('retained_cooked_liquid');
  const reserveActionCode = compiled.liquid_constraints?.reserve_action_code;
  const stagedLiquid = typeof reserveActionCode === 'string' && reserveActionCode.length > 0;
  const reservedCountValid = producedCounts.get('reserved_liquid') === 1
    && consumedCounts.get('reserved_liquid') === 1;
  if (stagedLiquid !== reservedCountValid
      || (stagedLiquid && !graph.some(action => action.action_code === reserveActionCode))) {
    runtimeContractFailure('reserved_liquid');
  }

  const actions = entry.seasoning_actions || [];
  const actionCodes = actions.map(action => action?.action_code);
  if (!Array.isArray(entry.seasoning_actions) || !exactUniqueSet(actionCodes, actionCodes)
      || actionCodes.some(code => !RECIPE_SEASONING_WRITERS[code])) {
    runtimeContractFailure('seasoning_actions');
  }
  const saltDecisions = actionCodes.filter(code => ['add_locked_salt', 'omit_extra_salt'].includes(code));
  if (saltDecisions.length !== 1) runtimeContractFailure('salt_decision');
  const tasteIndex = actionCodes.indexOf('taste_before_salt');
  const saltIndex = actionCodes.findIndex(code => ['add_locked_salt', 'omit_extra_salt'].includes(code));
  if (tasteIndex >= 0 && tasteIndex > saltIndex) runtimeContractFailure('salt_decision_order');
  const extraNames = new Set((compiled.required_extra_items || []).map(extra => extra.name));
  if (extraNames.has('盐') !== actionCodes.includes('add_locked_salt')
      || (!extraNames.has('盐') && !actionCodes.includes('omit_extra_salt'))
      || extraNames.has('食用油') !== actionCodes.includes('add_locked_oil')) {
    runtimeContractFailure('seasoning_facts');
  }
  for (const action of actions) {
    const expectedSource = ['taste_before_salt', 'omit_extra_salt'].includes(action.action_code)
      ? 'none' : 'ratio_default';
    if (action.amount_source !== expectedSource) runtimeContractFailure('seasoning_amount_source');
  }
}

function executionContract(catalog, profile, entry) {
  return {
    action_profile_catalog_version: catalog.action_profile_catalog_version,
    action_profile_id: profile.action_profile_id,
    profile_version: profile.profile_version,
    instances: structuredClone(profile.instances),
    execution_sequence: [...profile.execution_sequence],
    seasoning_actions: structuredClone(entry.seasoning_actions || []),
    safety_endpoints: structuredClone(entry.safety_endpoints || []),
  };
}

function canonicalAction(action) {
  return {
    action_code: action?.action_code,
    slot_ids: [...(action?.slot_ids || [])],
    fact_refs: [...(action?.fact_refs || [])],
    produces_resources: [...(action?.produces_resources || [])],
    consumes_resources: [...(action?.consumes_resources || [])],
    safety_endpoint_codes: [...(action?.safety_endpoint_codes || [])],
  };
}

function assertLegacyEntryDoesNotContradictProfile(entry, profile) {
  const graph = entry.technique_graph;
  if (Array.isArray(graph) && graph.length > 0) {
    assertExact(graph.map(canonicalAction), materializeProfileActions(profile).map(canonicalAction),
      'named_recipe_runtime_contract_invalid:action_profile_mismatch');
  }
  const sequence = entry.identity_signature?.identity_critical_action_sequence;
  if (Array.isArray(sequence) && sequence.length > 0) {
    assertExact(sequence, materializeProfileActions(profile).map(action => action.action_code),
      'named_recipe_runtime_contract_invalid:action_profile_mismatch');
  }
}

function requiredStateByCanonical(entry) {
  return new Map((entry.identity_signature?.required_states_or_cuts || [])
    .map(requirement => [requirement.canonical_id, requirement.value]));
}

function isBasicExtra(item, canonicalId) {
  return BASIC_EXTRA_IDS.has(canonicalId)
    || item?.source === 'basic_extra' || item?.role === 'basic_extra';
}

function exactAssignedItems(pot, entry) {
  const requiredState = requiredStateByCanonical(entry);
  const assigned = [];
  for (const [slotId, canonicalIds] of Object.entries(entry.slot_assignment || {})) {
    const actual = pot.slot_assignment?.[slotId] || [];
    for (const canonicalId of canonicalIds) {
      const matches = actual.filter(item => item?.canonical_id === canonicalId);
      if (matches.length !== 1) throw new Error(`named_recipe_ingredient_mismatch:${canonicalId}`);
      const item = matches[0];
      const required = requiredState.get(canonicalId);
      if (required && item.state !== required && item.shape_or_cut !== required) {
        throw new Error(`named_recipe_state_or_cut_mismatch:${canonicalId}`);
      }
      assigned.push({ slotId, item, basicExtra: isBasicExtra(item, canonicalId) });
    }
  }
  const expectedKeys = new Set(assigned.map(({ slotId, item }) => `${slotId}\0${item.canonical_id}`));
  const actualItems = Object.entries(pot.slot_assignment || {}).flatMap(([slotId, items]) => (
    (items || []).map(item => ({ slotId, item }))
  ));
  if (actualItems.length !== assigned.length || actualItems.some(({ slotId, item }) => (
    !expectedKeys.has(`${slotId}\0${item?.canonical_id}`)
  ))) throw new Error('named_recipe_extra_ingredient');
  return assigned;
}

function ratioContext(assigned, servings, recipeId) {
  const slots = {};
  for (const { slotId, item, basicExtra } of assigned) {
    if (basicExtra) continue;
    if (!slots[slotId]) slots[slotId] = [];
    slots[slotId].push({
      name: item.display_name,
      category: item.category,
      canonical_id: item.canonical_id,
      ratio_rule_policy: item.ratio_rule_policy,
      state: item.state,
      shape_or_cut: item.shape_or_cut,
      source: item.source,
      role: item.role,
      attributes: {
        cook_speed: item.cook_speed,
        moisture_release: item.moisture_release,
        texture_behavior: item.texture_behavior,
        texture_failure_modes: [...(item.texture_failure_modes || [])],
        cooking_risk: item.cooking_risk,
      },
    });
  }
  return { recipe_id: recipeId, servings, slots };
}

function exactAmount(item, compiled) {
  const matches = compiled.identity_amounts.filter(amount => amount.canonical_id === item.canonical_id
    && amount.state === item.state && amount.shape_or_cut === (item.shape_or_cut ?? null));
  if (matches.length !== 1 || !Number.isSafeInteger(matches[0].grams) || matches[0].grams <= 0) {
    throw new Error(`named_recipe_amount_missing:${item.canonical_id}`);
  }
  return matches[0].grams;
}

function extraCanonicalId(extra) {
  if (extra.name === '水') return 'water';
  if (extra.name === '盐') return 'salt';
  if (extra.name === '食用油') return 'cooking-oil';
  return extra.name;
}

function materializedAmount(item, grams) {
  return {
    name: item.display_name,
    canonical: item.canonical,
    canonical_id: item.canonical_id,
    state: item.state,
    shape_or_cut: item.shape_or_cut ?? null,
    grams,
  };
}

function materializedExtra(extra) {
  return {
    name: extra.name,
    canonical: extra.name,
    canonical_id: extraCanonicalId(extra),
    state: 'basic',
    shape_or_cut: null,
    category: extra.category,
    grams: extra.grams,
  };
}

function safetyPlanFacts(entry, assigned) {
  return entry.safety_endpoints.map(endpoint => {
    const categories = unique(endpoint.canonical_ids.map(canonicalId => assigned
      .find(({ item }) => item.canonical_id === canonicalId)?.item.category).filter(Boolean));
    if (categories.length !== 1) throw new Error(`named_recipe_safety_binding_missing:${endpoint.endpoint_code}`);
    return { applies_to_category: categories[0], endpoint_code: endpoint.endpoint_code };
  });
}

function compiledNamedFacts(plannerResult, entry, ratioCatalog, recipeRecord, actionProfileCatalog) {
  if (!isObject(plannerResult?.plan) || !Array.isArray(plannerResult.plan.pots)
      || plannerResult.plan.pots.length !== 1) throw new Error('named_recipe_plan_invalid');
  const pot = plannerResult.plan.pots[0];
  if (pot.template_id !== entry.template_id) throw new Error('named_recipe_template_mismatch');
  if (!recipeRecord || recipeRecord.id !== entry.recipe_id
      || !Number.isSafeInteger(recipeRecord.total_time_minutes) || recipeRecord.total_time_minutes <= 0) {
    throw new Error('named_recipe_evidence_missing');
  }
  const assigned = exactAssignedItems(pot, entry);
  const profile = resolveRecipeActionProfile(actionProfileCatalog, entry.action_profile_ref);
  assertLegacyEntryDoesNotContradictProfile(entry, profile);
  const compiled = compileRatioPlan(entry.ratio_default_rule_id,
    ratioContext(assigned, pot.servings, entry.recipe_id), ratioCatalog);
  if (!compiled.ok) throw new Error(`named_recipe_ratio_failed:${compiled.code}`);
  const retainedCooked = compiled.ratio_trace.some(trace => (
    trace.operator === 'ratio' && trace.numerator === 'retained_cooked_liquid_grams'
  ));
  const userAmounts = assigned.filter(row => !row.basicExtra)
    .map(({ item }) => materializedAmount(item, exactAmount(item, compiled)));
  const extras = compiled.required_extra_items
    .filter(extra => !(retainedCooked && extra.category === 'liquid'))
    .map(materializedExtra);
  const totalLiquid = compiled.required_extra_items.find(extra => extra.category === 'liquid')?.grams;
  if (!Number.isSafeInteger(totalLiquid) || totalLiquid <= 0) throw new Error('named_recipe_liquid_fact_missing');
  const liquidConstraints = retainedCooked ? {
    resource_code: 'retained_cooked_liquid',
    target_total_grams: totalLiquid,
    top_up: { canonical_id: 'water', mode: 'to_target' },
  } : structuredClone(compiled.liquid_constraints || {});
  return {
    assigned,
    compiled,
    potFacts: {
      slot_assignment: structuredClone(pot.slot_assignment),
      ingredient_amounts: [...userAmounts, ...extras],
      required_extra_items: extras.map(({ name, canonical, canonical_id, state, shape_or_cut, category, grams }) => ({
        name, canonical, canonical_id, state, shape_or_cut, category, grams,
      })),
      ratio_trace: structuredClone(compiled.ratio_trace || []),
      liquid_constraints: liquidConstraints,
      safety_endpoints: safetyPlanFacts(entry, assigned),
      time_range: {
        min_minutes: recipeRecord.total_time_minutes,
        max_minutes: recipeRecord.total_time_minutes,
      },
      execution_contract: executionContract(actionProfileCatalog, profile, entry),
    },
    profile,
    retainedCooked,
    totalLiquid,
  };
}

export function materializeNamedPlanFacts(plannerResult, runtimeEntry, ratioCatalog, recipeRecord, actionProfileCatalog) {
  const entry = runtimeEntryFor(plannerResult, runtimeEntry);
  const next = structuredClone(plannerResult);
  const facts = compiledNamedFacts(next, entry, ratioCatalog, recipeRecord, actionProfileCatalog).potFacts;
  Object.assign(next.plan.pots[0], facts);
  next.plan.required_extra_items = structuredClone(facts.required_extra_items);
  next.plan.plan_id = null;
  next.presentation = buildNamedRecipePresentation({
    recipeId: entry.recipe_id,
    title: entry.naming.canonical_name,
  });
  return next;
}

function verifyMaterializedFacts(plannerResult, entry, ratioCatalog, recipeRecord, actionProfileCatalog) {
  const compiledFacts = compiledNamedFacts(plannerResult, entry, ratioCatalog, recipeRecord, actionProfileCatalog);
  const expected = compiledFacts.potFacts;
  const pot = plannerResult.plan.pots[0];
  for (const field of ['slot_assignment', 'ingredient_amounts', 'required_extra_items', 'ratio_trace',
    'liquid_constraints', 'safety_endpoints', 'time_range', 'execution_contract']) {
    assertExact(pot[field], expected[field], `named_recipe_plan_fact_mismatch:${field}`);
  }
  assertExact(plannerResult.plan.required_extra_items, expected.required_extra_items,
    'named_recipe_plan_fact_mismatch:required_extra_items');
  return compiledFacts;
}

function lockedIngredientFromAssigned(row, amount, counters) {
  const { slotId, item } = row;
  return {
    ingredient_ref: row.basicExtra ? `e${counters.extra++}` : `i${counters.user++}`,
    raw_name: item.raw,
    display_name: item.display_name,
    canonical: item.canonical,
    canonical_id: item.canonical_id,
    state: item.state,
    category: item.category,
    shape_or_cut: item.shape_or_cut ?? null,
    requires_explicit_raw_name: Boolean(item.shape_or_cut),
    source: row.basicExtra ? 'basic_extra' : 'user',
    slot_id: slotId,
    planned_grams: amount.grams,
  };
}

function lockedExtra(extra, counters) {
  return {
    ingredient_ref: `e${counters.extra++}`,
    raw_name: extra.name,
    display_name: extra.name,
    canonical: extra.canonical,
    canonical_id: extra.canonical_id,
    state: extra.state,
    category: extra.category,
    shape_or_cut: null,
    requires_explicit_raw_name: false,
    source: 'basic_extra',
    slot_id: extra.category,
    planned_grams: extra.grams,
  };
}

function safetyRequirements(entry, lockedIngredients) {
  return entry.safety_endpoints.map(endpoint => {
    const refs = endpoint.canonical_ids.map(canonicalId => lockedIngredients
      .find(item => item.canonical_id === canonicalId)?.ingredient_ref).filter(Boolean);
    if (refs.length !== endpoint.canonical_ids.length) throw new Error(`named_recipe_safety_binding_missing:${endpoint.endpoint_code}`);
    return { endpoint_code: endpoint.endpoint_code, ingredient_refs: refs };
  });
}

function factsForAction(action, lockedFacts) {
  const facts = {};
  for (const fact of action.fact_refs || []) {
    const value = lockedFacts[fact];
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`named_recipe_fact_missing:${fact}`);
    }
    facts[fact] = value;
  }
  return facts;
}

function actionStep(action, index, slotRefs, extrasByName, lockedFacts, safetyByCode) {
  const schema = RECIPE_ACTION_REGISTRY[action.action_code];
  const seasoningWriter = RECIPE_SEASONING_WRITERS[action.action_code];
  if (!schema && !seasoningWriter) throw new Error(`named_recipe_action_text_missing:${action.action_code}`);
  const allowedRefs = unique((action.slot_ids || []).flatMap(slotId => slotRefs.get(slotId) || []));
  if (action.action_code === 'add_locked_liquid') allowedRefs.push(...(extrasByName.get('水') || []));
  if (action.action_code === 'add_locked_salt') allowedRefs.push(...(extrasByName.get('盐') || []));
  if (action.action_code === 'add_locked_oil') allowedRefs.push(...(extrasByName.get('食用油') || []));
  const safetyCodes = [...(action.safety_endpoint_codes || [])];
  const safetyRefs = unique(safetyCodes.flatMap(code => safetyByCode.get(code)?.ingredient_refs || []));
  const facts = factsForAction(action, lockedFacts);
  const safety = safetyCodes.map(code => {
    const requirement = safetyByCode.get(code);
    const writer = RECIPE_SAFETY_EVIDENCE_REGISTRY[code];
    if (!requirement || !writer) throw new Error(`named_recipe_safety_text_missing:${code}`);
    return writer(joinRefs(requirement.ingredient_refs));
  }).join('；');
  const textWriter = schema?.writer || seasoningWriter;
  const text = `${textWriter({ refs: joinRefs(unique(allowedRefs)), facts, safety })}。`;
  if (/null|undefined/u.test(text)) throw new Error('named_recipe_text_interpolation_invalid');
  return {
    phase: index + 1,
    instance_id: action.instance_id || `seasoning-${index + 1}`,
    action_code: action.action_code,
    slot_ids: [...(action.slot_ids || [])],
    allowed_ingredient_refs: unique(allowedRefs),
    required_safety_endpoints: safetyCodes,
    required_safety_ingredient_refs: safetyRefs,
    produces_resources: [...(action.produces_resources || [])],
    consumes_resources: [...(action.consumes_resources || [])],
    locked_numeric_facts: Object.values(facts).map(value => `${value}克`),
    allowed_texts: [text],
  };
}

export function buildLockedRecipeMeal(plannerResult, runtimeEntry, ratioCatalog, recipeRecord, actionProfileCatalog) {
  const entry = runtimeEntryFor(plannerResult, runtimeEntry);
  const facts = verifyMaterializedFacts(
    plannerResult, entry, ratioCatalog, recipeRecord, actionProfileCatalog,
  );
  assertRuntimeExecutionContract(entry, facts.profile, facts);
  const { assigned, potFacts, totalLiquid, profile } = facts;
  const lockedFacts = {
    total_liquid_grams: totalLiquid,
    initial_liquid_grams: potFacts.liquid_constraints.initial_liquid_grams,
    reserve_liquid_grams: potFacts.liquid_constraints.reserve_liquid_grams,
    salt_grams: potFacts.required_extra_items.find(extra => extra.canonical_id === 'salt')?.grams,
    oil_grams: potFacts.required_extra_items.find(extra => extra.canonical_id === 'cooking-oil')?.grams,
  };
  const pot = plannerResult.plan.pots[0];
  const counters = { user: 1, extra: 1 };
  const amountById = new Map(potFacts.ingredient_amounts.map(amount => [amount.canonical_id, amount]));
  const lockedIngredients = assigned.map(row => {
    const amount = amountById.get(row.item.canonical_id);
    if (!amount) throw new Error(`named_recipe_amount_missing:${row.item.canonical_id}`);
    return lockedIngredientFromAssigned(row, amount, counters);
  });
  for (const extra of potFacts.required_extra_items) {
    if (lockedIngredients.some(item => item.canonical_id === extra.canonical_id)) continue;
    lockedIngredients.push(lockedExtra(extra, counters));
  }
  const slotRefs = new Map();
  for (const ingredient of lockedIngredients) {
    if (!slotRefs.has(ingredient.slot_id)) slotRefs.set(ingredient.slot_id, []);
    slotRefs.get(ingredient.slot_id).push(ingredient.ingredient_ref);
  }
  const extrasByName = new Map();
  for (const ingredient of lockedIngredients.filter(item => item.source === 'basic_extra')) {
    if (!extrasByName.has(ingredient.raw_name)) extrasByName.set(ingredient.raw_name, []);
    extrasByName.get(ingredient.raw_name).push(ingredient.ingredient_ref);
  }
  const safety = safetyRequirements(entry, lockedIngredients);
  const safetyByCode = new Map(safety.map(requirement => [requirement.endpoint_code, requirement]));
  const profileActions = materializeProfileActions(profile);
  const finalSafetyIndex = profileActions.findIndex(action => action.action_code === 'complete_recipe_safety');
  if (finalSafetyIndex < 0) throw new Error('named_recipe_safety_phase_missing');
  const combinedActions = [
    ...profileActions.slice(0, finalSafetyIndex),
    ...entry.seasoning_actions.map(action => ({
      ...action,
      slot_ids: [],
      fact_refs: action.action_code === 'add_locked_salt' ? ['salt_grams']
        : action.action_code === 'add_locked_oil' ? ['oil_grams'] : [],
    })),
    ...profileActions.slice(finalSafetyIndex),
  ];
  const steps = combinedActions.map((action, index) => (
    actionStep(action, index, slotRefs, extrasByName, lockedFacts, safetyByCode)
  ));
  const referenced = new Set(steps.flatMap(step => step.allowed_ingredient_refs));
  if (lockedIngredients.some(ingredient => !referenced.has(ingredient.ingredient_ref))) {
    throw new Error('named_recipe_locked_ingredient_unreachable');
  }
  const presentation = buildNamedRecipePresentation({
    recipeId: entry.recipe_id,
    title: entry.naming.canonical_name,
  });
  return {
    meal_sequence: pot.meal_sequence,
    servings: pot.servings,
    template_id: pot.template_id,
    plan_source: 'named_recipe',
    recipe_id: entry.recipe_id,
    variant_id: null,
    runtime_candidate_authority: structuredClone(plannerResult.runtime_candidate_authority || null),
    identity_level: 'canonical',
    presentation,
    execution_contract: structuredClone(potFacts.execution_contract),
    locked_ingredients: lockedIngredients,
    slot_assignment: [...slotRefs.entries()].map(([slot_id, ingredient_refs]) => ({ slot_id, ingredient_refs })),
    cooking_order: steps.map(({ allowed_texts, ...step }) => step),
    ratio_constraints: structuredClone(potFacts.ratio_trace),
    liquid_constraints: structuredClone(potFacts.liquid_constraints),
    time_range: structuredClone(potFacts.time_range),
    safety_endpoints: safety.map(requirement => requirement.endpoint_code),
    safety_endpoint_requirements: safety,
    generation_text_contract: {
      dish_name_options: [entry.naming.canonical_name],
      steps: steps.map(step => ({ order: step.phase, allowed_texts: step.allowed_texts })),
      recommendation_reason_options: ['这道做法按已核验菜谱身份、比例、顺序和熟制终点执行。'],
    },
  };
}
