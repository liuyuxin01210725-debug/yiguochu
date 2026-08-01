const STATES = new Set(['identity_only', 'research_candidate', 'planned', 'runtime_ready', 'excluded']);
const ADAPTATION_LEVELS = new Set(['E1', 'E2', 'E3', 'E4', 'excluded']);
const NUTRITION_GRADES = new Set(['A', 'B', 'C']);
const TOP_LEVEL_KEYS = new Set(['schema_version', 'collection_version', 'scope', 'region_nodes', 'candidates', 'exclusions', 'catalog_tracking', 'runtime_mappings']);

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const present = value => typeof value === 'string' && value.trim().length > 0;
const isHttps = value => present(value) && /^https:\/\//u.test(value);

function checkKeys(object, allowed, path, errors) {
  if (!isObject(object)) return;
  for (const key of Object.keys(object)) if (!allowed.has(key)) errors.push(`${path}: unknown field ${key}`);
}

export function validateRiceMealCollection(collection, { taxonomy, catalog } = {}) {
  const errors = [];
  if (!isObject(collection)) return ['collection must be an object'];
  checkKeys(collection, TOP_LEVEL_KEYS, 'collection', errors);
  if (collection.schema_version !== 1) errors.push('schema_version must equal 1');
  if (!present(collection.collection_version)) errors.push('collection_version is required');
  if (!present(collection.scope)) errors.push('scope is required');
  for (const key of ['region_nodes', 'candidates', 'exclusions', 'catalog_tracking', 'runtime_mappings']) {
    if (!Array.isArray(collection[key])) errors.push(`${key} must be an array`);
  }
  if (errors.length > 0) return errors;

  const candidateIds = new Set();
  const candidateById = new Map();
  collection.candidates.forEach((candidate, index) => {
    const path = `candidates[${index}]`;
    const allowed = new Set(['candidate_id', 'name', 'region_codes', 'family', 'core_ingredients', 'rice_state', 'nutrition_grade', 'traditional_appliance_and_steps', 'identity_sources', 'quantity_liquid_completeness', 'adaptation_level', 'blockers', 'status']);
    if (!isObject(candidate)) { errors.push(`${path} must be an object`); return; }
    checkKeys(candidate, allowed, path, errors);
    if (!present(candidate.candidate_id)) errors.push(`${path}.candidate_id is required`);
    if (candidateIds.has(candidate.candidate_id)) errors.push(`duplicate candidate_id: ${candidate.candidate_id}`);
    candidateIds.add(candidate.candidate_id); candidateById.set(candidate.candidate_id, candidate);
    for (const key of ['name', 'family', 'rice_state', 'traditional_appliance_and_steps', 'quantity_liquid_completeness']) if (!present(candidate[key])) errors.push(`${path}.${key} is required`);
    if (!Array.isArray(candidate.region_codes) || candidate.region_codes.length === 0) errors.push(`${path}.region_codes must be non-empty`);
    if (!Array.isArray(candidate.core_ingredients) || candidate.core_ingredients.length === 0) errors.push(`${path}.core_ingredients must be non-empty`);
    if (!NUTRITION_GRADES.has(candidate.nutrition_grade)) errors.push(`${path}.nutrition_grade is invalid`);
    if (!ADAPTATION_LEVELS.has(candidate.adaptation_level) || candidate.adaptation_level === 'excluded') errors.push(`${path}.adaptation_level is invalid`);
    if (!STATES.has(candidate.status) || candidate.status === 'excluded') errors.push(`${path}.status is invalid`);
    if (!Array.isArray(candidate.identity_sources) || candidate.identity_sources.length === 0) errors.push(`${path}.identity_sources must be non-empty`);
    else candidate.identity_sources.forEach((source, sourceIndex) => {
      if (!isObject(source) || !isHttps(source.url)) errors.push(`${path}.identity_sources[${sourceIndex}].url must be HTTPS`);
    });
    if (candidate.status !== 'runtime_ready' && (!Array.isArray(candidate.blockers) || candidate.blockers.length === 0)) errors.push(`${path}.${candidate.status} requires blockers`);
    if (candidate.status === 'runtime_ready' && candidate.nutrition_grade === 'C') errors.push(`${path}.runtime_ready cannot use nutrition grade C`);
  });

  const nodeIds = new Set();
  collection.region_nodes.forEach((node, index) => {
    const path = `region_nodes[${index}]`;
    if (!isObject(node)) { errors.push(`${path} must be an object`); return; }
    checkKeys(node, new Set(['region_id', 'display_name', 'candidate_ids', 'gap']), path, errors);
    if (!present(node.region_id)) errors.push(`${path}.region_id is required`);
    if (nodeIds.has(node.region_id)) errors.push(`duplicate region_id: ${node.region_id}`);
    nodeIds.add(node.region_id);
    if (!present(node.display_name)) errors.push(`${path}.display_name is required`);
    if (!Array.isArray(node.candidate_ids)) errors.push(`${path}.candidate_ids must be an array`);
    else node.candidate_ids.forEach(id => { if (!candidateById.has(id)) errors.push(`${path}.candidate_ids references unknown candidate ${id}`); });
    if ((!Array.isArray(node.candidate_ids) || node.candidate_ids.length === 0) && !present(node.gap)) errors.push(`${path} must declare candidate_ids or an explicit gap`);
    if (Array.isArray(node.candidate_ids) && node.candidate_ids.length > 0 && node.gap !== null) errors.push(`${path} cannot have both candidates and gap`);
  });

  const exclusionIds = new Set();
  collection.exclusions.forEach((item, index) => {
    const path = `exclusions[${index}]`;
    if (!isObject(item)) { errors.push(`${path} must be an object`); return; }
    checkKeys(item, new Set(['exclusion_id', 'name', 'reason', 'source_url', 'adaptation_level', 'status']), path, errors);
    if (!present(item.exclusion_id) || exclusionIds.has(item.exclusion_id)) errors.push(`${path}.exclusion_id is required and unique`);
    exclusionIds.add(item.exclusion_id);
    for (const key of ['name', 'reason']) if (!present(item[key])) errors.push(`${path}.${key} is required`);
    if (!isHttps(item.source_url)) errors.push(`${path}.source_url must be HTTPS`);
    if (item.adaptation_level !== 'excluded' || item.status !== 'excluded') errors.push(`${path} must use excluded state and adaptation level`);
  });

  const taxonomyIds = new Set(Array.isArray(taxonomy?.items) ? taxonomy.items.map(item => item?.canonical_id) : []);
  const variants = Array.isArray(catalog?.families) ? catalog.families.flatMap(family => Array.isArray(family?.variants) ? family.variants : []) : [];
  const variantIds = new Set(variants.map(variant => variant?.variant_id));
  const trackingById = new Map();
  const trackingVariantIds = new Set();
  collection.catalog_tracking.forEach((row, index) => {
    const path = `catalog_tracking[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    checkKeys(row, new Set(['tracking_id', 'runtime_variant_id', 'candidate_id', 'nutrition_grade', 'core_ingredient_ids', 'status', 'reverse_mapping_id']), path, errors);
    if (!present(row.tracking_id) || trackingById.has(row.tracking_id)) errors.push(`${path}.tracking_id is required and unique`);
    trackingById.set(row.tracking_id, row);
    if (!present(row.runtime_variant_id) || trackingVariantIds.has(row.runtime_variant_id)) errors.push(`${path}.runtime_variant_id is required and unique`);
    trackingVariantIds.add(row.runtime_variant_id);
    if (!variantIds.has(row.runtime_variant_id)) errors.push(`${path}.runtime_variant_id does not exist in catalog`);
    if (row.candidate_id !== null && !candidateById.has(row.candidate_id)) errors.push(`${path}.candidate_id references unknown candidate`);
    if (!NUTRITION_GRADES.has(row.nutrition_grade)) errors.push(`${path}.nutrition_grade is invalid`);
    if (!STATES.has(row.status) || row.status === 'excluded' || row.status === 'identity_only' || row.status === 'research_candidate') errors.push(`${path}.status must be planned or runtime_ready`);
    if (row.status === 'runtime_ready' && row.nutrition_grade === 'C') errors.push(`${path}.runtime_ready cannot use nutrition grade C`);
    if (!Array.isArray(row.core_ingredient_ids) || row.core_ingredient_ids.length === 0) errors.push(`${path}.core_ingredient_ids must be non-empty`);
    else row.core_ingredient_ids.forEach(id => { if (!taxonomyIds.has(id)) errors.push(`${path}.core_ingredient_ids references unknown taxonomy item ${id}`); });
    if (row.reverse_mapping_id !== null && !present(row.reverse_mapping_id)) errors.push(`${path}.reverse_mapping_id must be string or null`);
  });
  if (variantIds.size && trackingVariantIds.size !== variantIds.size) errors.push('catalog_tracking must cover every catalog variant exactly once');

  const mappingIds = new Set();
  collection.runtime_mappings.forEach((mapping, index) => {
    const path = `runtime_mappings[${index}]`;
    if (!isObject(mapping)) { errors.push(`${path} must be an object`); return; }
    checkKeys(mapping, new Set(['mapping_id', 'candidate_id', 'tracking_id']), path, errors);
    if (!present(mapping.mapping_id) || mappingIds.has(mapping.mapping_id)) errors.push(`${path}.mapping_id is required and unique`);
    mappingIds.add(mapping.mapping_id);
    const tracking = trackingById.get(mapping.tracking_id);
    if (!tracking) errors.push(`${path}.tracking_id references unknown tracking row`);
    if (!candidateById.has(mapping.candidate_id)) errors.push(`${path}.candidate_id references unknown candidate`);
    if (tracking && (tracking.candidate_id !== mapping.candidate_id || tracking.reverse_mapping_id !== mapping.mapping_id)) errors.push(`${path} is not the reverse mapping for ${mapping.tracking_id}`);
  });
  trackingById.forEach((row, id) => {
    if (row.reverse_mapping_id !== null && !mappingIds.has(row.reverse_mapping_id)) errors.push(`catalog_tracking ${id} reverse_mapping_id does not exist`);
    if (row.candidate_id !== null && row.reverse_mapping_id === null) errors.push(`catalog_tracking ${id} candidate mapping lacks reverse_mapping_id`);
  });
  return errors;
}

export function assertRiceMealCollection(collection, dependencies) {
  const errors = validateRiceMealCollection(collection, dependencies);
  if (errors.length > 0) throw new Error(`invalid rice-meal collection:\n${errors.join('\n')}`);
  return collection;
}
