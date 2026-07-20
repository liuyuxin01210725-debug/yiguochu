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
  if (families.length !== 21) errors.push('production library must contain exactly 21 families');
  if (recipes.length !== 72) errors.push('production library must contain exactly 72 recipes');
  const approvedCount = recipes.filter(recipe => recipe?.status === 'approved').length;
  const autoApprovedCount = recipes.filter(recipe => recipe?.status === 'auto_approved').length;
  if (approvedCount !== 12 || autoApprovedCount !== 60) {
    errors.push(`production library must contain exactly 12 approved (human-approved) and 60 auto_approved (auto-gate passed, pending human review) recipes; got ${approvedCount} approved and ${autoApprovedCount} auto_approved`);
  }
  return errors;
}
