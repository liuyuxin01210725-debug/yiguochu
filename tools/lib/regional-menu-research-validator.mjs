const REQUIRED_FIELDS = [
  'atlas_id', 'region_group', 'prototype_name', 'family_id',
  'inclusion_class', 'ingredient_hypothesis', 'adaptation_hypothesis',
  'pantry_gap_items', 'research_questions', 'source_refs',
  'source_confidence', 'product_destination', 'status',
];

const REQUIRED_ARRAY_FIELDS = new Set([
  'ingredient_hypothesis',
  'pantry_gap_items',
  'research_questions',
  'source_refs',
]);

const ALLOWED_ENTRY_FIELDS = new Set(REQUIRED_FIELDS);

const hasText = value => typeof value === 'string' && value.trim().length > 0;

export function validateRegionalMenuResearch(catalog, productionRecipeIds = new Set()) {
  const errors = [];
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) {
    return ['catalog must be an object'];
  }
  if (catalog.schema_version !== 1) errors.push('catalog: schema_version must be 1');
  if (catalog.catalog_version !== 'regional-menu-research-v1-20260725') {
    errors.push('catalog: catalog_version must be regional-menu-research-v1-20260725');
  }
  if (!Array.isArray(catalog.entries)) return [...errors, 'catalog: entries must be an array'];
  if (catalog.entries.length !== 24) errors.push('catalog: entries must contain exactly 24 items');

  const seenIds = new Set();
  for (const entry of catalog.entries) {
    const id = hasText(entry?.atlas_id) ? entry.atlas_id : '<unknown>';
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(`${id}: entry must be an object`);
      continue;
    }
    for (const field of REQUIRED_FIELDS) {
      if (!(field in entry)) {
        errors.push(`${id}: ${field} is required`);
      } else if (REQUIRED_ARRAY_FIELDS.has(field)) {
        if (!Array.isArray(entry[field])) errors.push(`${id}: ${field} must be an array`);
        else if (field === 'research_questions' && entry[field].length !== 5) {
          errors.push(`${id}: research_questions must contain exactly 5 items`);
        } else if (field !== 'source_refs' && entry[field].length === 0) {
          errors.push(`${id}: ${field} must be non-empty`);
        }
        if (
          ['research_questions', 'ingredient_hypothesis', 'pantry_gap_items'].includes(field)
          && Array.isArray(entry[field])
          && !entry[field].every(hasText)
        ) {
          errors.push(`${id}: ${field} items must be non-empty strings`);
        }
      } else if (!hasText(entry[field])) {
        errors.push(`${id}: ${field} must be a non-empty string`);
      }
    }
    if (seenIds.has(entry.atlas_id)) errors.push(`${id}: atlas_id must be unique`);
    seenIds.add(entry.atlas_id);
    if (productionRecipeIds.has(entry.atlas_id)) errors.push(`${id}: overlaps production recipe`);
    if (!['natural_one_pot', 'family_adaptation_hypothesis'].includes(entry.inclusion_class)) {
      errors.push(`${id}: inclusion_class must be natural_one_pot or family_adaptation_hypothesis`);
    }
    if (entry.status !== 'research_queue') errors.push(`${id}: status must be research_queue`);
    if (entry.source_confidence !== 'discovery_only') {
      errors.push(`${id}: source_confidence must be discovery_only`);
    }
    if (entry.product_destination !== 'undecided') {
      errors.push(`${id}: product_destination must be undecided`);
    }
    for (const field of Object.keys(entry)) {
      if (!ALLOWED_ENTRY_FIELDS.has(field)) {
        errors.push(`${id}: ${field} is not allowed in research entries`);
      }
    }
  }
  return errors;
}
