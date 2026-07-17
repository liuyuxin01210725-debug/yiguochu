const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUSES = new Set(['candidate', 'research_hold']);
const RISK_LEVELS = new Set(['low', 'moderate', 'high']);
const RIGHTS_NOTE = '事实溯源；不复制页面文字、图片或完整菜谱。';

function nonEmpty(value) { return typeof value === 'string' && value.trim().length > 0; }
function https(value) {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}
function strings(value) { return Array.isArray(value) && value.length > 0 && value.every(nonEmpty); }

export function validateRecipeCandidateLedger(ledger) {
  const errors = [];
  if (ledger?.schema_version !== 1) errors.push('schema_version must be 1');
  if (!nonEmpty(ledger?.purpose)) errors.push('purpose must be non-empty');
  if (!Array.isArray(ledger?.entries) || ledger.entries.length === 0) {
    errors.push('entries must be non-empty');
    return errors;
  }
  const ids = new Set();
  for (const [index, entry] of ledger.entries.entries()) {
    const label = nonEmpty(entry?.id) ? entry.id : `entry ${index}`;
    if (!ID_RE.test(entry?.id || '')) errors.push(`${label} has invalid id`);
    if (ids.has(entry?.id)) errors.push(`${label} duplicates id`);
    ids.add(entry?.id);
    if (!STATUSES.has(entry?.status)) errors.push(`${label} status must be candidate or research_hold`);
    for (const key of ['name', 'region', 'cuisine', 'form', 'traditional_basis']) {
      if (!nonEmpty(entry?.[key])) errors.push(`${label} missing ${key}`);
    }
    for (const key of ['ingredient_pattern', 'technique_pattern', 'promotion_requirements']) {
      if (!strings(entry?.[key])) errors.push(`${label} ${key} must be non-empty strings`);
    }
    for (const gate of ['原创标准配方', '安全与适配审核']) {
      if (!entry?.promotion_requirements?.includes(gate)) errors.push(`${label} missing promotion requirement ${gate}`);
    }
    if (!RISK_LEVELS.has(entry?.risk_level)) errors.push(`${label} risk_level must be low, moderate, or high`);
    if (!Array.isArray(entry?.basis_refs) || entry.basis_refs.length === 0) {
      errors.push(`${label} basis_refs must be non-empty`);
      continue;
    }
    for (const [refIndex, ref] of entry.basis_refs.entries()) {
      const prefix = `${label} basis ref ${refIndex}`;
      for (const key of ['kind', 'relationship', 'claim', 'source_type', 'title', 'publisher', 'retrieved_at']) {
        if (!nonEmpty(ref?.[key])) errors.push(`${prefix} missing ${key}`);
      }
      if (!https(ref?.url)) errors.push(`${prefix} URL must be HTTPS`);
      if (!nonEmpty(ref?.rights_note)) errors.push(`${prefix} missing rights_note`);
      else if (ref.rights_note !== RIGHTS_NOTE) errors.push(`${prefix} rights_note must state facts-only use`);
      for (const key of ['evidence_scope', 'excluded_scope']) {
        if (!strings(ref?.[key])) errors.push(`${prefix} ${key} must be non-empty strings`);
      }
    }
  }
  return errors;
}
