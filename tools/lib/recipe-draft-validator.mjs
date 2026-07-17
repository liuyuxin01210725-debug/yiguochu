function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasNonEmptyStrings(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function labelFor(draft, index) {
  return isNonEmptyString(draft?.id) ? draft.id : `draft ${index}`;
}

function candidateIdsFrom(candidateLedger) {
  if (!Array.isArray(candidateLedger?.entries)) return new Set();
  return new Set(candidateLedger.entries.map(entry => entry?.id).filter(isNonEmptyString));
}

export function validateRecipeDraftLibrary(library, candidateLedger) {
  const errors = [];
  if (library?.schema_version !== 1) errors.push('schema_version must be 1');
  if (!isNonEmptyString(library?.purpose)) errors.push('purpose must be non-empty');
  if (!Array.isArray(library?.drafts) || library.drafts.length === 0) {
    errors.push('drafts must be non-empty');
    return errors;
  }

  const knownCandidateIds = candidateIdsFrom(candidateLedger);
  const draftIds = new Set();
  const linkedCandidateIds = new Set();
  for (const [index, draft] of library.drafts.entries()) {
    const label = labelFor(draft, index);
    if (!isNonEmptyString(draft?.id)) errors.push(`${label} missing id`);
    else if (draftIds.has(draft.id)) errors.push(`${label} duplicates id`);
    else draftIds.add(draft.id);

    if (!isNonEmptyString(draft?.candidate_id)) errors.push(`${label} missing candidate_id`);
    else {
      if (linkedCandidateIds.has(draft.candidate_id)) errors.push(`${label} duplicates candidate_id`);
      else linkedCandidateIds.add(draft.candidate_id);
      if (!knownCandidateIds.has(draft.candidate_id)) errors.push(`${label} missing candidate ${draft.candidate_id}`);
    }

    if (draft?.status !== 'draft') errors.push(`${label} status must be draft`);
    for (const key of ['name', 'region', 'form', 'adaptation_summary']) {
      if (!isNonEmptyString(draft?.[key])) errors.push(`${label} missing ${key}`);
    }

    const range = draft?.serving_range;
    if (!Array.isArray(range)
      || range.length !== 2
      || !Number.isInteger(range[0])
      || !Number.isInteger(range[1])
      || range[0] < 1
      || range[0] > range[1]
      || range[1] > 6) {
      errors.push(`${label} serving_range must be integers from 1 to 6 in ascending order`);
    }

    for (const key of [
      'core_ingredients', 'optional_ingredients', 'draft_ratio_rules', 'technique_outline', 'trial_requirements',
    ]) {
      if (!hasNonEmptyStrings(draft?.[key])) errors.push(`${label} ${key} must be non-empty strings`);
    }

    if (!Array.isArray(draft?.substitution_slots) || draft.substitution_slots.length === 0) {
      errors.push(`${label} substitution_slots must be non-empty`);
    } else {
      for (const [slotIndex, slot] of draft.substitution_slots.entries()) {
        const prefix = `${label} substitution slot ${slotIndex}`;
        if (!isNonEmptyString(slot?.slot)) errors.push(`${prefix} missing slot`);
        if (!hasNonEmptyStrings(slot?.replaces)) errors.push(`${prefix} replaces must be non-empty strings`);
        if (!hasNonEmptyStrings(slot?.allowed)) errors.push(`${prefix} allowed must be non-empty strings`);
      }
    }

    if (!Array.isArray(draft?.safety_and_quality_gates) || draft.safety_and_quality_gates.length === 0) {
      errors.push(`${label} safety_and_quality_gates must be non-empty`);
    } else {
      for (const [gateIndex, gate] of draft.safety_and_quality_gates.entries()) {
        const prefix = `${label} safety_and_quality_gate ${gateIndex}`;
        if (!isNonEmptyString(gate?.type)) errors.push(`${prefix} missing type`);
        if (!isNonEmptyString(gate?.requirement)) errors.push(`${prefix} missing requirement`);
      }
    }
  }
  return errors;
}
