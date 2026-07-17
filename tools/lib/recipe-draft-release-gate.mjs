const EXPECTED_CANDIDATE_IDS = new Map([
  ['shanghai-salted-pork-vegetable-rice-draft', 'shanghai-salted-pork-vegetable-rice'],
  ['nanjing-sausage-greens-rice-draft', 'nanjing-sausage-greens-rice'],
  ['quanzhou-oil-rice-draft', 'quanzhou-oil-rice'],
  ['north-china-green-bean-braised-noodles-draft', 'north-china-green-bean-braised-noodles'],
  ['xinjiang-lamb-pilaf-draft', 'xinjiang-lamb-pilaf'],
  ['guizhou-dong-community-rice-draft', 'guizhou-dong-community-rice'],
]);

export function validateSixDraftReleaseGate(library, candidateLedger) {
  const errors = [];
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

  for (const [draftId, expectedCandidateId] of EXPECTED_CANDIDATE_IDS) {
    const draft = draftsById.get(draftId);
    if (!draft) {
      errors.push(`six-draft release gate missing expected draft ${draftId}`);
      continue;
    }
    if (draft.candidate_id !== expectedCandidateId) {
      errors.push(`${draftId} must link candidate_id ${expectedCandidateId}`);
      continue;
    }
    if (candidatesById.get(draft.candidate_id)?.status !== 'candidate') {
      errors.push(`${draftId} linked candidate ${draft.candidate_id} must have status candidate`);
    }
  }
  return errors;
}
