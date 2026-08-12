import { containsRawHighRiskIngredient } from './source-backed-one-pot-catalog-validator.mjs';

export function requiresSourceSafetyEndpoint(recipe) {
  return containsRawHighRiskIngredient(recipe);
}

export function sourceSafetyApplicability(recipe) {
  return requiresSourceSafetyEndpoint(recipe) ? 'required' : 'not_applicable';
}

export function sourceSafetyStatus(recipe) {
  const endpoints = Array.isArray(recipe?.safety_endpoints) ? recipe.safety_endpoints : [];
  if (endpoints.length > 0) return 'closed';
  return sourceSafetyApplicability(recipe) === 'required' ? 'missing' : 'not_applicable';
}
