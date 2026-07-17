import { validateRecipeCandidateLedger } from './recipe-candidate-validator.mjs';

export function validateRecipeCandidateReleaseGate(ledger, production) {
  const errors = [...validateRecipeCandidateLedger(ledger)];
  const entries = Array.isArray(ledger?.entries) ? ledger.entries : [];
  if (entries.length !== 30) errors.push('candidate ledger must contain exactly 30 entries');
  if (entries.filter(entry => entry?.status === 'approved').length !== 0) {
    errors.push('candidate ledger must contain zero approved entries');
  }
  const families = Array.isArray(production?.families) ? production.families : [];
  const recipes = Array.isArray(production?.recipes) ? production.recipes : [];
  if (families.length !== 15) errors.push('production library must contain exactly 15 families');
  if (recipes.length !== 42) errors.push('production library must contain exactly 42 recipes');
  if (recipes.some(recipe => recipe?.status !== 'approved')) {
    errors.push('production library recipes must all be approved');
  }
  return errors;
}
