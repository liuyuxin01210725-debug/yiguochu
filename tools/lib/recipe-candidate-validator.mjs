const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUSES = new Set(['candidate', 'research_hold']);
const RISK_LEVELS = new Set(['low', 'moderate', 'high']);
const RIGHTS_NOTE = '事实溯源；不复制页面文字、图片或完整菜谱。';
const ROOT_FIELDS = new Set(['schema_version', 'purpose', 'entries']);
const ENTRY_FIELDS = new Set([
  'id', 'status', 'name', 'region', 'cuisine', 'form', 'traditional_basis',
  'ingredient_pattern', 'technique_pattern', 'risk_level', 'promotion_requirements', 'basis_refs',
]);
const REF_FIELDS = new Set([
  'kind', 'relationship', 'claim', 'source_type', 'title', 'publisher', 'url',
  'retrieved_at', 'rights_note', 'evidence_scope', 'excluded_scope',
]);
const EVIDENCE_SCOPES = new Set(['dish_name', 'region', 'ingredient_pattern', 'high_level_technique', 'cultural_context']);
const EXCLUDED_SCOPES = new Set(['exact_quantities', 'step_text', 'nutrition', 'safety']);
const PROHIBITED_CONTENT_RE = /(?:\d+\s*(?:克|g|毫升|ml|分钟|分|千卡|kcal|卡路里)|营养|热量|蛋白质|脂肪|碳水)/i;

function nonEmpty(value) { return typeof value === 'string' && value.trim().length > 0; }
function https(value) {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}
function strings(value) { return Array.isArray(value) && value.length > 0 && value.every(nonEmpty); }
function unexpectedFields(value, fields, label, errors) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const key of Object.keys(value)) {
    if (!fields.has(key)) errors.push(`${label} has unexpected field ${key}`);
  }
}

export function validateRecipeCandidateLedger(ledger) {
  const errors = [];
  unexpectedFields(ledger, ROOT_FIELDS, 'ledger', errors);
  if (ledger?.schema_version !== 1) errors.push('schema_version must be 1');
  if (!nonEmpty(ledger?.purpose)) errors.push('purpose must be non-empty');
  if (!Array.isArray(ledger?.entries) || ledger.entries.length === 0) {
    errors.push('entries must be non-empty');
    return errors;
  }
  const ids = new Set();
  for (const [index, entry] of ledger.entries.entries()) {
    const label = nonEmpty(entry?.id) ? entry.id : `entry ${index}`;
    unexpectedFields(entry, ENTRY_FIELDS, label, errors);
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
    for (const field of ['traditional_basis', 'ingredient_pattern', 'technique_pattern']) {
      const values = Array.isArray(entry?.[field]) ? entry[field] : [entry?.[field]];
      if (values.some(value => typeof value === 'string' && PROHIBITED_CONTENT_RE.test(value))) {
        errors.push(`${label} ${field} must not contain quantities or nutrition claims`);
      }
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
      unexpectedFields(ref, REF_FIELDS, prefix, errors);
      for (const key of ['kind', 'relationship', 'claim', 'source_type', 'title', 'publisher', 'retrieved_at']) {
        if (!nonEmpty(ref?.[key])) errors.push(`${prefix} missing ${key}`);
      }
      if (typeof ref?.claim === 'string' && PROHIBITED_CONTENT_RE.test(ref.claim)) {
        errors.push(`${prefix} claim must not contain quantities or nutrition claims`);
      }
      if (ref?.kind !== 'cultural_fact') errors.push(`${prefix} kind must be cultural_fact`);
      if (!https(ref?.url)) errors.push(`${prefix} URL must be HTTPS`);
      if (!nonEmpty(ref?.rights_note)) errors.push(`${prefix} missing rights_note`);
      else if (ref.rights_note !== RIGHTS_NOTE) errors.push(`${prefix} rights_note must state facts-only use`);
      for (const key of ['evidence_scope', 'excluded_scope']) {
        if (!strings(ref?.[key])) errors.push(`${prefix} ${key} must be non-empty strings`);
      }
      for (const scope of ref?.evidence_scope || []) {
        if (!EVIDENCE_SCOPES.has(scope)) errors.push(`${prefix} evidence_scope has invalid value ${scope}`);
      }
      for (const scope of ref?.excluded_scope || []) {
        if (!EXCLUDED_SCOPES.has(scope)) errors.push(`${prefix} excluded_scope has invalid value ${scope}`);
      }
    }
  }
  return errors;
}
