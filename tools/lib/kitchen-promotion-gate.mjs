import {
  isKitchenObservedReady,
  isIsoDateTime,
  validateKitchenObservationReferences,
} from './kitchen-observation.mjs';
import { isKitchenTrialEntryStrictlyEligible } from './kitchen-trial-catalog.mjs';

export function evaluateKitchenPromotion({ runtimeCatalog, trialCatalog, executionLibrary, observations, formalReview, validatedObservationIds = [] } = {}, recipeId) {
  const reasons = [];
  const runtimeEntry = Array.isArray(runtimeCatalog?.entries)
    ? runtimeCatalog.entries.find(entry => entry?.recipe_id === recipeId)
    : null;
  const trialEntry = Array.isArray(trialCatalog?.entries)
    ? trialCatalog.entries.find(entry => entry?.recipe_id === recipeId)
    : null;
  if (!runtimeEntry && !trialEntry) reasons.push('runtime_or_trial_recipe_missing');
  if (runtimeEntry) {
    if (runtimeEntry.planner_runtime_eligible !== true) reasons.push('runtime_recipe_not_eligible');
    if (runtimeEntry.production_approved === true) reasons.push('runtime_recipe_already_approved');
  } else if (trialEntry && !isKitchenTrialEntryStrictlyEligible(trialEntry)) {
    reasons.push('trial_recipe_not_eligible');
  }

  const observation = Array.isArray(observations)
    ? observations.find(item => item?.recipe?.recipe_id === recipeId && item?.disposition?.status === 'kitchen_observed')
    : null;
  if (!observation) reasons.push('kitchen_observation_missing');
  else {
    const referenceErrors = validateKitchenObservationReferences(observation, { runtimeCatalog, trialCatalog, executionLibrary });
    if (referenceErrors.length > 0) reasons.push('kitchen_observation_reference_invalid');
    // The required endpoint contract belongs to the candidate catalog entry,
    // not to the observationer's self-authored record.  Passing it explicitly
    // prevents a record from omitting `recipe.required_safety_endpoint_codes`
    // and thereby turning a required safety check into an empty optional set.
    const requiredSafetyEndpointCodes = Array.isArray(runtimeEntry?.required_safety_endpoint_codes)
      ? runtimeEntry.required_safety_endpoint_codes
      : (Array.isArray(trialEntry?.required_safety_endpoint_codes)
        ? trialEntry.required_safety_endpoint_codes
        : []);
    if (!isKitchenObservedReady(observation, { requiredSafetyEndpointCodes })) reasons.push('kitchen_observation_incomplete');
  }

  const reviewDateValid = isIsoDateTime(formalReview?.reviewed_at);
  if (formalReview?.approved !== true || formalReview.recipe_id !== recipeId || !formalReview.reviewer_id || !reviewDateValid) {
    reasons.push('independent_formal_approval_missing');
  }
  return { allowed: reasons.length === 0, reasons };
}
