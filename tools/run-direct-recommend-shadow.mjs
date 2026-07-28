import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

import {
  normalizePlannerRequest,
  planMealCandidateBundle,
  planMealWithIdentity,
} from '../worker/src/planner-v2.js';
import {
  canonicalRecipeIngredient,
  selectRecipeCandidates,
} from '../worker/src/worker.js';

const readJson = relative => JSON.parse(fs.readFileSync(new URL(relative, import.meta.url), 'utf8'));

const DEFAULT_ASSETS = Object.freeze({
  taxonomy: readJson('./data/ingredient-taxonomy.v1.json'),
  templates: readJson('./data/meal-templates.v2.json'),
  ratios: readJson('./data/ratio-rules.v1.json'),
  recipes: readJson('./data/recipe-library.json'),
});

const BASIC_EXTRA_CATEGORIES = new Set([
  'raw_rice', 'cooked_rice', 'noodle', 'other_staple',
  'liquid', 'oil', 'seasoning',
]);
const BASIC_EXTRA_NAME_RE = /^(?:大米|白米|糙米|小米|糯米|熟米饭|剩米饭|面条|粉丝|粉条|米粉|水|高汤|清汤|食用油|植物油|盐|糖|酱油|醋|料酒|葱|姜|蒜)$/u;

function plannerRequest(journey, overrides = {}) {
  return normalizePlannerRequest({
    schema_version: 2,
    planner_version: 'pantry-planner-v2',
    constraints: {
      mode: journey.mode,
      intent: journey.intent,
      servings: journey.servings,
      must_use: [],
      prefer_use: journey.prefer_use,
      dislikes: journey.dislikes,
      current_plan_id: null,
      recent_plan_ids: [],
      decision: null,
      ...overrides,
    },
  });
}

function uniqueSubmitted(items) {
  return [...new Set((Array.isArray(items) ? items : []).map(item => String(item).trim()).filter(Boolean))];
}

function v2ExtraMajorItems(plan) {
  return (plan?.required_extra_items || [])
    .filter(item => !BASIC_EXTRA_CATEGORIES.has(String(item?.category || '')))
    .map(item => String(item?.name || '').trim())
    .filter(Boolean);
}

function legacyCoreSatisfied(requirement, selection) {
  const aliases = selection?.ingredientAliases || {};
  const canonicalRequirement = canonicalRecipeIngredient(requirement, aliases);
  const used = selection?.usedPantry || [];
  if (used.some(item => canonicalRecipeIngredient(item, aliases) === canonicalRequirement)) return true;
  return (selection?.recipe?.substitution_slots || []).some(slot => {
    const replaces = (slot?.replaces || []).map(item => canonicalRecipeIngredient(item, aliases));
    if (!replaces.includes(canonicalRequirement)) return false;
    const allowed = (slot?.allowed || []).map(item => canonicalRecipeIngredient(item, aliases));
    return used.some(item => allowed.includes(canonicalRecipeIngredient(item, aliases)));
  });
}

function legacyExtraMajorItems(selection) {
  if (!selection) return [];
  return (selection.recipe?.core_ingredients || [])
    .filter(requirement => !legacyCoreSatisfied(requirement, selection))
    .filter(requirement => !BASIC_EXTRA_NAME_RE.test(String(requirement || '').trim()))
    .map(requirement => String(requirement).trim());
}

function ingredientStateTransitions(plan) {
  const transitions = [];
  for (const pot of plan?.pots || []) {
    const userAssignments = Object.values(pot?.slot_assignment || {})
      .flat()
      .filter(item => item?.source === 'user');
    for (const planned of pot?.planned_prefer_use || []) {
      const assigned = userAssignments.find(item => item.raw === planned.raw);
      if (!assigned) {
        transitions.push(`${planned.raw}→missing`);
        continue;
      }
      const identityChanged = assigned.canonical_id !== planned.canonical_id
        || assigned.state !== planned.state
        || (assigned.shape_or_cut || null) !== (planned.shape_or_cut || null);
      if (identityChanged) {
        transitions.push(`${planned.raw}→${assigned.display_name || assigned.canonical || assigned.raw}`);
      }
    }
  }
  return [...new Set(transitions)];
}

function plannerSafetyFailures(plan) {
  return (plan?.pots || [])
    .filter(pot => pot?.ok !== true || pot?.safety_complete !== true)
    .map(pot => `${pot?.template_id || 'unknown'}:safety_incomplete`);
}

function statusAllowed(expect, status) {
  return !Array.isArray(expect?.allowed_statuses) || expect.allowed_statuses.includes(status);
}

function expectationFailures(journey, result) {
  const expect = journey.expect || {};
  const failures = [];
  if (!statusAllowed(expect, result.status)) failures.push(`status:${result.status}`);
  if (result.best_used_count < Number(expect.minimum_used || 0)) {
    failures.push(`coverage:${result.best_used_count}<${expect.minimum_used}`);
  }
  if (Number.isInteger(expect.expected_unrecognized)) {
    const unrecognized = result.submitted_count - result.recognized_count;
    if (unrecognized !== expect.expected_unrecognized) {
      failures.push(`unrecognized:${unrecognized}!=${expect.expected_unrecognized}`);
    }
  }
  if (result.extra_major_items.length > Number(expect.max_extra_major_items || 0)) {
    failures.push(`extra_major:${result.extra_major_items.join(',')}`);
  }
  if (result.state_transitions.length) failures.push(`state_transition:${result.state_transitions.join(',')}`);
  if (result.safety_failures.length) failures.push(`safety:${result.safety_failures.join(',')}`);
  if (Number.isFinite(expect.max_minutes)) {
    const tooSlow = (result.pot_time_ranges || []).some(range => Number(range?.max_minutes) > expect.max_minutes);
    if (tooSlow) failures.push(`max_minutes:>${expect.max_minutes}`);
  }
  if (expect.swap && result.swap_outcome !== expect.swap) {
    failures.push(`swap:${result.swap_outcome}!=${expect.swap}`);
  }
  return failures;
}

export function scoreShadowJourney({ journey, v2, legacy, status = 'ready', swapOutcome = null, potTimeRanges = [] }) {
  const submittedCount = Number(v2.submitted_count ?? uniqueSubmitted(journey.prefer_use).length);
  const bestUsedCount = Number(v2.best_used_count || 0);
  const legacyUsed = Number(legacy.best_used_count || 0);
  const reviewReasons = [];
  if ((legacy.extra_major_items || []).length && legacyUsed >= bestUsedCount) {
    reviewReasons.push('legacy_apparent_win_depends_on_extra_major_items');
  }
  if (legacyUsed > bestUsedCount && !(legacy.extra_major_items || []).length) {
    reviewReasons.push('legacy_has_higher_clean_coverage');
  }
  const scored = {
    journey_id: journey.id,
    build_source: 'local-assets',
    status,
    recognized_count: Number(v2.recognized_count || 0),
    submitted_count: submittedCount,
    best_used_count: bestUsedCount,
    coverage_ratio: submittedCount ? bestUsedCount / submittedCount : 0,
    extra_major_items: [...(v2.extra_major_items || [])],
    state_transitions: [...(v2.state_transitions || [])],
    safety_failures: [...(v2.safety_failures || [])],
    candidate_count: Number(v2.candidate_count || 0),
    legacy_best_used_count: legacyUsed,
    legacy_extra_major_items: [...(legacy.extra_major_items || [])],
    review_required: reviewReasons.length > 0,
    review_reasons: reviewReasons,
    swap_outcome: swapOutcome,
    pot_time_ranges: potTimeRanges,
  };
  scored.expectation_failures = expectationFailures(journey, scored);
  return scored;
}

async function runOneJourney(journey, assets) {
  const request = plannerRequest(journey);
  const bundle = await planMealCandidateBundle(assets, request, { limit: 3 });
  const best = bundle.candidate_plans?.[0] || (bundle.plan ? bundle : null);
  const normalized = Array.isArray(bundle.normalized_items) ? bundle.normalized_items : [];
  const plan = best?.plan || bundle.plan || null;
  const selections = selectRecipeCandidates(assets.recipes, {
    pantry: journey.prefer_use,
    dislikes: journey.dislikes,
    purpose: journey.intent,
    servings: journey.servings,
    recent_base_recipes: [],
  });
  const legacy = selections[0] || null;
  let swapOutcome = null;
  if (journey.expect?.swap && plan?.plan_id) {
    const swapped = await planMealWithIdentity(assets, plannerRequest(journey, {
      current_plan_id: plan.plan_id,
    }));
    if (swapped.status === 'no_alternative_plan') {
      swapOutcome = 'no_alternative_plan';
    } else if (swapped.plan?.plan_id && swapped.plan.plan_id !== plan.plan_id) {
      const originalUsed = plan.planned_prefer_use?.length || 0;
      const swappedUsed = swapped.plan.planned_prefer_use?.length || 0;
      swapOutcome = swappedUsed >= originalUsed ? 'same_or_better_promise' : 'weaker_promise';
    } else {
      swapOutcome = 'same_plan';
    }
  }
  return scoreShadowJourney({
    journey,
    status: bundle.status,
    swapOutcome,
    potTimeRanges: (plan?.pots || []).map(pot => pot.time_range),
    v2: {
      submitted_count: uniqueSubmitted(journey.prefer_use).length,
      recognized_count: normalized.filter(item => item.recognized && !item.duplicate_of).length,
      best_used_count: plan?.planned_prefer_use?.length || 0,
      extra_major_items: v2ExtraMajorItems(plan),
      state_transitions: ingredientStateTransitions(plan),
      safety_failures: plannerSafetyFailures(plan),
      candidate_count: bundle.candidate_plans?.length || 0,
    },
    legacy: {
      best_used_count: legacy?.usedPantry?.length || 0,
      extra_major_items: legacyExtraMajorItems(legacy),
      state_transitions: [],
      safety_failures: [],
    },
  });
}

export async function runDirectRecommendShadow({
  corpus = readJson('./data/direct-recommend-shadow-v1.json'),
  assets = DEFAULT_ASSETS,
} = {}) {
  const results = [];
  for (const journey of corpus.journeys) results.push(await runOneJourney(journey, assets));
  const hardFailures = results.filter(result => result.expectation_failures.length);
  const reviewItems = results.filter(result => result.review_required);
  return {
    schema_version: 1,
    planner_version: 'pantry-planner-v2',
    template_catalog_version: assets.templates.template_catalog_version,
    taxonomy_version: assets.taxonomy.taxonomy_version,
    ratio_catalog_version: assets.ratios.ratio_catalog_version,
    journey_count: results.length,
    hard_failure_count: hardFailures.length,
    review_required_count: reviewItems.length,
    hard_failure_ids: hardFailures.map(result => result.journey_id),
    review_required_ids: reviewItems.map(result => result.journey_id),
    results,
  };
}

async function main() {
  const summary = await runDirectRecommendShadow();
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (summary.hard_failure_count) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    process.stderr.write(`${error?.stack || error}\n`);
    process.exitCode = 1;
  });
}
