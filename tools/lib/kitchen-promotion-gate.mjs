import {
  isKitchenObservedReady,
  validateKitchenObservationReferences,
} from './kitchen-observation.mjs';

export function evaluateKitchenPromotion({ runtimeCatalog, executionLibrary, observations, formalReview, validatedObservationIds = [] } = {}, recipeId) {
  const reasons = [];
  const runtimeEntry = Array.isArray(runtimeCatalog?.entries)
    ? runtimeCatalog.entries.find(entry => entry?.recipe_id === recipeId)
    : null;
  if (!runtimeEntry) reasons.push('runtime_recipe_missing');
  else if (runtimeEntry.planner_runtime_eligible !== true) reasons.push('runtime_recipe_not_eligible');
  else if (runtimeEntry.production_approved === true) reasons.push('runtime_recipe_already_approved');

  const observation = Array.isArray(observations)
    ? observations.find(item => item?.recipe?.recipe_id === recipeId && item?.disposition?.status === 'kitchen_observed')
    : null;
  if (!observation) reasons.push('kitchen_observation_missing');
  else {
    const referenceErrors = validateKitchenObservationReferences(observation, { runtimeCatalog, executionLibrary });
    if (referenceErrors.length > 0) reasons.push('kitchen_observation_reference_invalid');
    if (!isKitchenObservedReady(observation)) reasons.push('kitchen_observation_incomplete');
  }

  const reviewDateValid = typeof formalReview?.reviewed_at === 'string' && !Number.isNaN(Date.parse(formalReview.reviewed_at));
  if (formalReview?.approved !== true || formalReview.recipe_id !== recipeId || !formalReview.reviewer_id || !reviewDateValid) {
    reasons.push('independent_formal_approval_missing');
  }
  return { allowed: reasons.length === 0, reasons };
}
