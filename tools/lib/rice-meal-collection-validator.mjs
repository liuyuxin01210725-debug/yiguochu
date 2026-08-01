const STATES = new Set(['identity_only', 'research_candidate', 'planned', 'runtime_ready', 'excluded']);
const ADAPTATION_LEVELS = new Set(['E1', 'E2', 'E3', 'E4', 'excluded']);
const NUTRITION_GRADES = new Set(['A', 'B', 'C']);
const RICE_STATES = new Set(['raw-rice', 'soaked-rice', 'glutinous-rice', 'mixed-rice', 'parboiled-rice', 'parboiled-drained-rice', 'rice-state-unverified']);
const COMPLETENESS = new Set(['identity_only', 'partial', 'complete']);
const SOURCE_SUPPORTS = new Set(['identity', 'quantity', 'liquid', 'appliance', 'safety', 'nutrition']);
const REGION_IDS = new Set([
  'CN-AH', 'CN-BJ', 'CN-CQ', 'CN-FJ', 'CN-GD', 'CN-GS', 'CN-GX', 'CN-GZ', 'CN-HA', 'CN-HB', 'CN-HE', 'CN-HI', 'CN-HK', 'CN-HL', 'CN-HN', 'CN-JL', 'CN-JS', 'CN-JX', 'CN-LN', 'CN-MO', 'CN-NM', 'CN-NX', 'CN-QH', 'CN-SC', 'CN-SD', 'CN-SH', 'CN-SN', 'CN-SX', 'CN-TJ', 'CN-TW', 'CN-XJ', 'CN-XZ', 'CN-YN', 'CN-ZJ',
]);
const HOUSEHOLD_NODE_ID = 'HOUSEHOLD';
const HOUSEHOLD_NODE_NAME = '家常标准（非地域）';
const TOP_LEVEL_KEYS = new Set(['schema_version', 'collection_version', 'scope', 'region_nodes', 'candidates', 'exclusions', 'catalog_tracking', 'runtime_mappings']);
const CANDIDATE_KEYS = new Set(['candidate_id', 'name', 'region_codes', 'family', 'core_ingredients', 'rice_state', 'nutrition_grade', 'traditional_appliance_and_steps', 'identity_sources', 'quantity_liquid_completeness', 'adaptation_level', 'blockers', 'runtime_contract', 'status']);
const SOURCE_KEYS = new Set(['title', 'publisher', 'retrieved_at', 'url', 'supports']);

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const present = value => typeof value === 'string' && value.trim().length > 0;

function isHttps(value) {
  if (!present(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && present(url.hostname);
  } catch {
    return false;
  }
}

function checkKeys(object, allowed, path, errors) {
  if (!isObject(object)) return;
  for (const key of Object.keys(object)) if (!allowed.has(key)) errors.push(`${path}: unknown field ${key}`);
}

function validateSource(source, path, errors) {
  if (!isObject(source)) { errors.push(`${path} must be an object`); return; }
  checkKeys(source, SOURCE_KEYS, path, errors);
  for (const key of ['title', 'publisher', 'retrieved_at']) if (!present(source[key])) errors.push(`${path}.${key} is required`);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(source.retrieved_at || '')) errors.push(`${path}.retrieved_at must be YYYY-MM-DD`);
  if (!isHttps(source.url)) errors.push(`${path}.url must be HTTPS with host`);
  if (!Array.isArray(source.supports) || source.supports.length === 0 || source.supports.some(item => !SOURCE_SUPPORTS.has(item))) {
    errors.push(`${path}.supports must contain controlled evidence types`);
  }
}

export function validateRiceMealCollection(collection, { taxonomy, catalog } = {}) {
  const errors = [];
  if (!isObject(collection)) return ['collection must be an object'];
  checkKeys(collection, TOP_LEVEL_KEYS, 'collection', errors);
  if (collection.schema_version !== 1) errors.push('schema_version must equal 1');
  if (!present(collection.collection_version)) errors.push('collection_version is required');
  if (!present(collection.scope)) errors.push('scope is required');
  for (const key of ['region_nodes', 'candidates', 'exclusions', 'catalog_tracking', 'runtime_mappings']) if (!Array.isArray(collection[key])) errors.push(`${key} must be an array`);
  if (errors.length > 0) return errors;

  const candidateIds = new Set();
  const candidateById = new Map();
  collection.candidates.forEach((candidate, index) => {
    const path = `candidates[${index}]`;
    if (!isObject(candidate)) { errors.push(`${path} must be an object`); return; }
    checkKeys(candidate, CANDIDATE_KEYS, path, errors);
    if (!present(candidate.candidate_id)) errors.push(`${path}.candidate_id is required`);
    if (candidateIds.has(candidate.candidate_id)) errors.push(`duplicate candidate_id: ${candidate.candidate_id}`);
    candidateIds.add(candidate.candidate_id); candidateById.set(candidate.candidate_id, candidate);
    for (const key of ['name', 'family', 'traditional_appliance_and_steps']) if (!present(candidate[key])) errors.push(`${path}.${key} is required`);
    if (!Array.isArray(candidate.region_codes) || candidate.region_codes.length === 0) errors.push(`${path}.region_codes must be non-empty`);
    if (!Array.isArray(candidate.core_ingredients) || candidate.core_ingredients.length === 0) errors.push(`${path}.core_ingredients must be non-empty`);
    if (!RICE_STATES.has(candidate.rice_state)) errors.push(`${path}.rice_state is invalid`);
    if (!NUTRITION_GRADES.has(candidate.nutrition_grade)) errors.push(`${path}.nutrition_grade is invalid`);
    if (!COMPLETENESS.has(candidate.quantity_liquid_completeness)) errors.push(`${path}.quantity_liquid_completeness is invalid`);
    if (!ADAPTATION_LEVELS.has(candidate.adaptation_level) || candidate.adaptation_level === 'excluded') errors.push(`${path}.adaptation_level is invalid`);
    if (!STATES.has(candidate.status) || candidate.status === 'excluded') errors.push(`${path}.status is invalid`);
    if (!Array.isArray(candidate.identity_sources) || candidate.identity_sources.length === 0) errors.push(`${path}.identity_sources must be non-empty`);
    else candidate.identity_sources.forEach((source, sourceIndex) => validateSource(source, `${path}.identity_sources[${sourceIndex}]`, errors));
    if (candidate.status !== 'runtime_ready' && (!Array.isArray(candidate.blockers) || candidate.blockers.length === 0)) errors.push(`${path}.${candidate.status} requires blockers`);
    if (candidate.status === 'runtime_ready') {
      const contract = candidate.runtime_contract;
      const completeContract = isObject(contract) && ['quantity', 'liquid', 'appliance', 'safety'].every(key => contract[key] === 'complete');
      const supports = new Set((candidate.identity_sources || []).flatMap(source => Array.isArray(source?.supports) ? source.supports : []));
      if (candidate.nutrition_grade === 'C') errors.push(`${path}.runtime_ready cannot use nutrition grade C`);
      if (candidate.quantity_liquid_completeness !== 'complete' || !completeContract || !['quantity', 'liquid', 'appliance', 'safety'].every(key => supports.has(key))) errors.push(`${path}.runtime_ready requires complete quantity, liquid, appliance and safety contracts`);
      if (!Array.isArray(candidate.blockers) || candidate.blockers.length !== 0) errors.push(`${path}.runtime_ready must have no blockers`);
    } else if (candidate.runtime_contract !== undefined) errors.push(`${path}.runtime_contract is only allowed for runtime_ready`);
  });

  const nodeById = new Map();
  const listedCandidateRegions = new Map();
  collection.region_nodes.forEach((node, index) => {
    const path = `region_nodes[${index}]`;
    if (!isObject(node)) { errors.push(`${path} must be an object`); return; }
    checkKeys(node, new Set(['region_id', 'display_name', 'candidate_ids', 'gap']), path, errors);
    if (!present(node.region_id)) errors.push(`${path}.region_id is required`);
    if (nodeById.has(node.region_id)) errors.push(`duplicate region_id: ${node.region_id}`);
    nodeById.set(node.region_id, node);
    if (!present(node.display_name)) errors.push(`${path}.display_name is required`);
    if (!Array.isArray(node.candidate_ids)) errors.push(`${path}.candidate_ids must be an array`);
    else node.candidate_ids.forEach(id => {
      if (!candidateById.has(id)) errors.push(`${path}.candidate_ids references unknown candidate ${id}`);
      if (!listedCandidateRegions.has(id)) listedCandidateRegions.set(id, new Set());
      listedCandidateRegions.get(id).add(node.region_id);
    });
    if ((!Array.isArray(node.candidate_ids) || node.candidate_ids.length === 0) && !present(node.gap)) errors.push(`${path} must declare candidate_ids or an explicit gap`);
    if (Array.isArray(node.candidate_ids) && node.candidate_ids.length > 0 && node.gap !== null) errors.push(`${path} cannot have both candidates and gap`);
  });
  const householdNode = nodeById.get(HOUSEHOLD_NODE_ID);
  if (nodeById.size !== REGION_IDS.size + 1
    || [...REGION_IDS].some(id => !nodeById.has(id))
    || [...nodeById].some(([id]) => !REGION_IDS.has(id) && id !== HOUSEHOLD_NODE_ID)
    || !householdNode
    || householdNode.display_name !== HOUSEHOLD_NODE_NAME) {
    errors.push('region_nodes must cover the complete supported region set exactly once plus HOUSEHOLD');
  }
  candidateById.forEach((candidate, id) => {
    const declared = new Set(Array.isArray(candidate.region_codes) ? candidate.region_codes : []);
    declared.forEach(regionId => { if (!REGION_IDS.has(regionId) && regionId !== HOUSEHOLD_NODE_ID) errors.push(`candidates ${id} references unsupported region ${regionId}`); });
    const listed = listedCandidateRegions.get(id) || new Set();
    if (declared.size !== listed.size || [...declared].some(regionId => !listed.has(regionId))) errors.push(`candidate-region mismatch for ${id}`);
  });

  const exclusionIds = new Set();
  collection.exclusions.forEach((item, index) => {
    const path = `exclusions[${index}]`;
    if (!isObject(item)) { errors.push(`${path} must be an object`); return; }
    checkKeys(item, new Set(['exclusion_id', 'name', 'reason', 'source_url', 'adaptation_level', 'status']), path, errors);
    if (!present(item.exclusion_id) || exclusionIds.has(item.exclusion_id)) errors.push(`${path}.exclusion_id is required and unique`);
    exclusionIds.add(item.exclusion_id);
    for (const key of ['name', 'reason']) if (!present(item[key])) errors.push(`${path}.${key} is required`);
    if (!isHttps(item.source_url)) errors.push(`${path}.source_url must be HTTPS with host`);
    if (item.adaptation_level !== 'excluded' || item.status !== 'excluded') errors.push(`${path} must use excluded state and adaptation level`);
  });

  const taxonomyIds = new Set(Array.isArray(taxonomy?.items) ? taxonomy.items.map(item => item?.canonical_id) : []);
  const variants = Array.isArray(catalog?.families) ? catalog.families.flatMap(family => Array.isArray(family?.variants) ? family.variants : []) : [];
  const variantById = new Map(variants.map(variant => [variant?.variant_id, variant]));
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
    const variant = variantById.get(row.runtime_variant_id);
    if (!variant) errors.push(`${path}.runtime_variant_id does not exist in catalog`);
    if (variant) {
      if (variant.collection_candidate_id !== row.candidate_id) {
        errors.push(`${path} catalog collection_candidate_id must match tracking candidate_id`);
      }
      const catalogCoreIds = new Set([
        variant.rice?.canonical_ingredient_id,
        ...(Array.isArray(variant.ingredients) ? variant.ingredients.map(item => item?.canonical_ingredient_id) : []),
      ].filter(present));
      const trackingCoreIds = new Set(Array.isArray(row.core_ingredient_ids) ? row.core_ingredient_ids : []);
      if (catalogCoreIds.size !== trackingCoreIds.size || [...catalogCoreIds].some(id => !trackingCoreIds.has(id))) {
        errors.push(`${path} tracking core_ingredient_ids must match catalog variant`);
      }
    }
    const requiredStatus = variant?.status === 'preview_ready' ? 'runtime_ready' : variant?.status === 'planned' ? 'planned' : null;
    if (requiredStatus && row.status !== requiredStatus) errors.push(`${path}.status must match catalog status`);
    if (row.candidate_id !== null && !candidateById.has(row.candidate_id)) errors.push(`${path}.candidate_id references unknown candidate`);
    if (!NUTRITION_GRADES.has(row.nutrition_grade)) errors.push(`${path}.nutrition_grade is invalid`);
    const mappedCandidate = candidateById.get(row.candidate_id);
    if (mappedCandidate && row.nutrition_grade !== mappedCandidate.nutrition_grade) errors.push(`${path}.nutrition_grade must match mapped candidate`);
    if (mappedCandidate?.nutrition_grade === 'C') errors.push(`${path} cannot activate a nutrition grade C candidate`);
    if (mappedCandidate?.status === 'excluded') errors.push(`${path} cannot activate an excluded candidate`);
    if (!['planned', 'runtime_ready'].includes(row.status)) errors.push(`${path}.status must be planned or runtime_ready`);
    if (row.status === 'runtime_ready') {
      const candidate = mappedCandidate;
      if (!present(row.candidate_id) || !present(row.reverse_mapping_id)) errors.push(`${path}.runtime_ready requires candidate_id and reverse_mapping_id`);
      if (!['A', 'B'].includes(row.nutrition_grade)) errors.push(`${path}.runtime_ready nutrition_grade must be A or B`);
      if (!candidate || candidate.status !== 'runtime_ready' || !['A', 'B'].includes(candidate.nutrition_grade)) errors.push(`${path}.runtime_ready must reference an A/B runtime_ready candidate`);
    }
    if (!Array.isArray(row.core_ingredient_ids) || row.core_ingredient_ids.length === 0) errors.push(`${path}.core_ingredient_ids must be non-empty`);
    else row.core_ingredient_ids.forEach(id => { if (!taxonomyIds.has(id)) errors.push(`${path}.core_ingredient_ids references unknown taxonomy item ${id}`); });
    if (row.reverse_mapping_id !== null && !present(row.reverse_mapping_id)) errors.push(`${path}.reverse_mapping_id must be string or null`);
  });
  if (variantById.size && trackingVariantIds.size !== variantById.size) errors.push('catalog_tracking must cover every catalog variant exactly once');

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
