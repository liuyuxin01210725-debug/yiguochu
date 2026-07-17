const CURRENT_DRAFT_CANDIDATE_IDS = new Map([
  ['shanghai-salted-pork-vegetable-rice-draft', 'shanghai-salted-pork-vegetable-rice'],
  ['nanjing-sausage-greens-rice-draft', 'nanjing-sausage-greens-rice'],
  ['quanzhou-oil-rice-draft', 'quanzhou-oil-rice'],
  ['north-china-green-bean-braised-noodles-draft', 'north-china-green-bean-braised-noodles'],
  ['xinjiang-lamb-pilaf-draft', 'xinjiang-lamb-pilaf'],
  ['guizhou-dong-community-rice-draft', 'guizhou-dong-community-rice'],
  ['jinshan-clay-oven-vegetable-rice-draft', 'jinshan-clay-oven-vegetable-rice'],
  ['taiwan-cabbage-mushroom-rice-draft', 'taiwan-cabbage-mushroom-rice'],
  ['fujian-gai-cai-minced-pork-rice-draft', 'fujian-gai-cai-minced-pork-rice'],
  ['fujian-hyacinth-bean-rice-draft', 'fujian-hyacinth-bean-rice'],
  ['xinjiang-vegetable-pilaf-draft', 'xinjiang-vegetable-pilaf'],
  ['shaanbei-red-date-cowpea-rice-draft', 'shaanbei-red-date-cowpea-rice'],
  ['shanxi-potato-rice-draft', 'shanxi-potato-rice'],
  ['shanxi-nitun-millet-rice-draft', 'shanxi-nitun-millet-rice'],
  ['hainan-cai-bao-rice-draft', 'hainan-cai-bao-rice'],
]);

export function validateExpectedDraftMappings(
  library,
  candidateLedger,
  expectedMappings,
  rejectUnexpectedDrafts = false,
) {
  const errors = [];
  const expectedByDraftId = new Map(expectedMappings);
  const candidatesById = new Map(
    Array.isArray(candidateLedger?.entries)
      ? candidateLedger.entries.map(candidate => [candidate?.id, candidate])
      : [],
  );
  const draftsById = new Map(
    Array.isArray(library?.drafts)
      ? library.drafts.map(draft => [draft?.id, draft])
      : [],
  );

  for (const [draftId, expectedCandidateId] of expectedByDraftId) {
    const draft = draftsById.get(draftId);
    if (!draft) {
      errors.push(`expected draft ${draftId} is missing`);
      continue;
    }
    if (draft.candidate_id !== expectedCandidateId) {
      errors.push(`${draftId} must link candidate_id ${expectedCandidateId}`);
    }
    if (candidatesById.get(draft.candidate_id)?.status !== 'candidate') {
      errors.push(`${draftId} linked candidate ${draft.candidate_id} must have status candidate`);
    }
  }

  if (rejectUnexpectedDrafts) {
    for (const draftId of draftsById.keys()) {
      if (!expectedByDraftId.has(draftId)) {
        errors.push(`unexpected draft ${draftId} is present`);
      }
    }
  }
  return errors;
}

export function validateCurrentDraftReleaseGate(library, candidateLedger) {
  return validateExpectedDraftMappings(library, candidateLedger, CURRENT_DRAFT_CANDIDATE_IDS, false);
}
