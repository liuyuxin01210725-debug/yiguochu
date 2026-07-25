const REQUIRED_RECIPE_FIELDS = [
  'id', 'family_id', 'status', 'name', 'cuisine', 'form',
  'core_ingredients', 'optional_ingredients',
  'generation_optional_ingredients', 'generation_liquid_ingredients',
  'substitution_slots', 'discouraged', 'technique', 'ratio_rules',
  'safety_rules', 'source_refs', 'total_time_minutes', 'purposes',
];

const ARRAY_RECIPE_FIELDS = new Set([
  'core_ingredients', 'optional_ingredients',
  'generation_optional_ingredients', 'generation_liquid_ingredients',
  'substitution_slots', 'discouraged', 'technique', 'ratio_rules',
  'safety_rules', 'source_refs', 'purposes',
]);

const asArray = value => Array.isArray(value) ? value : [];
const asObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export function buildTaxonomyIndex(taxonomy) {
  const index = new Map();
  for (const item of asArray(taxonomy?.items)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    index.set(item.display_name, item);
    for (const alias of asArray(item.aliases)) index.set(alias, item);
  }
  return index;
}

export function summarizeVerificationForMenu(menuId, cases) {
  const owned = asArray(cases).filter(entry => asArray(entry?.recipe_ids).includes(menuId));
  const positive = owned.filter(entry => entry.case_type === 'positive').length;
  const negative = owned.filter(entry => entry.case_type === 'negative').length;
  const crossMenu = owned.filter(entry => entry.case_type === 'cross_menu').length;
  return {
    positive_case_count: positive,
    negative_case_count: negative,
    cross_menu_case_count: crossMenu,
    case_ids: owned.map(entry => entry.case_id).sort(),
    status: positive && negative ? 'covered' : owned.length ? 'in_progress' : 'pending',
  };
}

function isStaple(name, taxonomyIndex) {
  const item = taxonomyIndex.get(name);
  return Array.isArray(item?.compatible_slot_codes)
    && item.compatible_slot_codes.includes('staple');
}

function hasProvenTaxonomyRole(name, taxonomyIndex) {
  const item = taxonomyIndex.get(name);
  return Array.isArray(item?.compatible_slot_codes) && item.compatible_slot_codes.length > 0;
}

export function buildProductionMenuEntry(recipe, index, taxonomyIndex, verificationCases = []) {
  const safeRecipe = asObject(recipe);
  const missingFields = REQUIRED_RECIPE_FIELDS.filter(field => {
    const value = safeRecipe[field];
    if (value === undefined || value === null) return true;
    if (ARRAY_RECIPE_FIELDS.has(field) && !Array.isArray(value)) return true;
    if (field === 'core_ingredients' && value.length === 0) return true;
    if (field === 'source_refs' && value.length === 0) return true;
    return false;
  });
  const arrays = Object.fromEntries(
    [...ARRAY_RECIPE_FIELDS].map(field => [field, asArray(safeRecipe[field])]),
  );
  const proteinClass = asArray(safeRecipe.protein_class);
  const staples = arrays.core_ingredients.filter(name => isStaple(name, taxonomyIndex));
  const core = arrays.core_ingredients.filter(name => !staples.includes(name));
  const unknownRole = core.filter(name => !hasProvenTaxonomyRole(name, taxonomyIndex));
  const verification = summarizeVerificationForMenu(safeRecipe.id, verificationCases);
  return {
    library_index: index + 1,
    id: safeRecipe.id,
    name: safeRecipe.name,
    status: safeRecipe.status,
    identity: {
      family_id: safeRecipe.family_id,
      cuisine: safeRecipe.cuisine,
      form: safeRecipe.form,
      summary: safeRecipe.summary || '',
      adaptation_note: safeRecipe.adaptation_note || '',
    },
    ingredients: {
      staples,
      core,
      unknown_role: unknownRole,
      optional: [...arrays.optional_ingredients],
      generation_optional: [...arrays.generation_optional_ingredients],
      liquids: [...arrays.generation_liquid_ingredients],
      substitutions: structuredClone(arrays.substitution_slots),
      discouraged: structuredClone(arrays.discouraged),
    },
    execution: {
      technique: [...arrays.technique],
      ratio_rules: [...arrays.ratio_rules],
      safety_rules: [...arrays.safety_rules],
      total_time_minutes: safeRecipe.total_time_minutes,
      purposes: [...arrays.purposes],
      protein_class: [...proteinClass],
      light_level: safeRecipe.light_level || 'unknown',
    },
    evidence: {
      source_count: arrays.source_refs.length,
      source_refs: structuredClone(arrays.source_refs),
    },
    audit: {
      source_status: arrays.source_refs.length ? 'present' : 'pending_review',
      missing_fields: missingFields,
      static_status: missingFields.length ? 'missing_fields' : 'complete',
      verification,
      verification_status: verification.status,
    },
  };
}

export function buildMenuMaster({ recipeLibrary, taxonomy, regionalResearch, verificationCases } = {}) {
  const taxonomyIndex = buildTaxonomyIndex(taxonomy);
  const verificationEntries = structuredClone(asArray(verificationCases?.entries));
  const productionMenus = asArray(recipeLibrary?.recipes)
    .map((recipe, index) => buildProductionMenuEntry(recipe, index, taxonomyIndex, verificationEntries));
  const researchCandidates = structuredClone(asArray(regionalResearch?.entries));

  return {
    schema_version: 1,
    production_menus: productionMenus,
    research_candidates: researchCandidates,
    verification_cases: verificationEntries,
    summary: {
      approved_count: productionMenus.filter(menu => menu.status === 'approved').length,
      auto_approved_count: productionMenus.filter(menu => menu.status === 'auto_approved').length,
      production_count: productionMenus.length,
      research_count: researchCandidates.length,
      verification_case_count: verificationEntries.length,
    },
  };
}

export function validateMenuMaster(master) {
  const errors = [];
  const safeMaster = asObject(master);
  const productionMenus = asArray(safeMaster.production_menus);
  const researchCandidates = asArray(safeMaster.research_candidates);
  const verificationCases = asArray(safeMaster.verification_cases);
  if (!Array.isArray(safeMaster.production_menus)) errors.push('production_menus must be an array');
  if (!Array.isArray(safeMaster.research_candidates)) errors.push('research_candidates must be an array');
  if (!Array.isArray(safeMaster.verification_cases)) errors.push('verification_cases must be an array');
  const ids = productionMenus.map(menu => asObject(menu).id);
  const libraryIndexes = productionMenus.map(menu => asObject(menu).library_index);
  const atlasIds = researchCandidates.map(candidate => asObject(candidate).atlas_id);
  const expectedSummary = {
    approved_count: productionMenus.filter(menu => asObject(menu).status === 'approved').length,
    auto_approved_count: productionMenus.filter(menu => asObject(menu).status === 'auto_approved').length,
    production_count: productionMenus.length,
    research_count: researchCandidates.length,
    verification_case_count: verificationCases.length,
  };

  if (new Set(ids).size !== ids.length) errors.push('duplicate production menu IDs');
  if (new Set(libraryIndexes).size !== libraryIndexes.length) errors.push('duplicate production menu library indexes');
  for (const [field, value] of Object.entries(expectedSummary)) {
    if (safeMaster.summary?.[field] !== value) errors.push(`mismatched summary ${field}`);
  }
  const productionIds = new Set(ids);
  if (atlasIds.some(atlasId => productionIds.has(atlasId))) {
    errors.push('production menu IDs overlap research atlas IDs');
  }
  for (const [index, menu] of productionMenus.entries()) {
    const row = asObject(menu);
    if (!menu || typeof menu !== 'object' || Array.isArray(menu)) {
      errors.push(`production menu ${index} must be an object`);
      continue;
    }
    if (typeof row.id !== 'string' || !row.id.trim()) errors.push(`production menu ${index} id must be a non-empty string`);
    if (!Number.isInteger(row.library_index) || row.library_index < 1) errors.push(`production menu ${index} library_index must be a positive integer`);
  }
  for (const [index, candidate] of researchCandidates.entries()) {
    const row = asObject(candidate);
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      errors.push(`research candidate ${index} must be an object`);
      continue;
    }
    if (typeof row.atlas_id !== 'string' || !row.atlas_id.trim()) errors.push(`research candidate ${index} atlas_id must be a non-empty string`);
  }
  for (const [index, entry] of verificationCases.entries()) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) errors.push(`verification case ${index} must be an object`);
  }

  return errors;
}

export function formatMenuMasterSummary(master) {
  const menus = asArray(master?.production_menus);
  const pending = menus.filter(menu => asObject(menu).audit?.verification_status === 'pending').length;
  const summary = asObject(master?.summary);
  return `${summary.production_count ?? menus.length} production menus · ${summary.research_count ?? 0} research candidates · ${pending} pending verification menus`;
}

export function validateMenuMasterBaseline(master, baseline) {
  const errors = [];
  const safeBaseline = asObject(baseline);
  const expectedMenus = asArray(safeBaseline.production_menus);
  const expectedResearchIds = asArray(safeBaseline.research_atlas_ids);
  const expectedSummary = asObject(safeBaseline.expected_summary);
  if (safeBaseline.schema_version !== 1) errors.push('menu master baseline schema_version must be 1');
  if (safeBaseline.baseline_version !== 'menu-master-phase-zero-v1-20260725') errors.push('menu master baseline_version must be menu-master-phase-zero-v1-20260725');
  if (!Array.isArray(safeBaseline.production_menus)) errors.push('menu master baseline production_menus must be an array');
  if (!Array.isArray(safeBaseline.research_atlas_ids)) errors.push('menu master baseline research_atlas_ids must be an array');
  if (!safeBaseline.expected_summary || typeof safeBaseline.expected_summary !== 'object' || Array.isArray(safeBaseline.expected_summary)) errors.push('menu master baseline expected_summary must be an object');
  if (errors.length) return errors;

  const actualMenus = asArray(master?.production_menus).map(menu => ({ id: asObject(menu).id, status: asObject(menu).status }));
  const actualResearchIds = asArray(master?.research_candidates).map(entry => asObject(entry).atlas_id);
  if (JSON.stringify(actualMenus) !== JSON.stringify(expectedMenus)) {
    errors.push('production ID/status set differs from the versioned Phase Zero baseline; intentionally update tools/data/menu-master-baseline.v1.json only after an explicit baseline review');
  }
  if (JSON.stringify(actualResearchIds) !== JSON.stringify(expectedResearchIds)) {
    errors.push('research atlas ID set differs from the versioned Phase Zero baseline; intentionally update tools/data/menu-master-baseline.v1.json only after an explicit baseline review');
  }
  const actualSummary = asObject(master?.summary);
  const pending = asArray(master?.production_menus)
    .filter(menu => asObject(menu).audit?.verification_status === 'pending').length;
  for (const [field, expected] of Object.entries(expectedSummary)) {
    const actual = field === 'pending_verification_menu_count' ? pending : actualSummary[field];
    if (actual !== expected) {
      errors.push(`Phase Zero baseline ${field} expected ${expected}, got ${actual}; intentionally update tools/data/menu-master-baseline.v1.json only after an explicit baseline review`);
    }
  }
  return errors;
}
