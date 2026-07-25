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

export function buildTaxonomyIndex(taxonomy) {
  const index = new Map();
  for (const item of taxonomy?.items || []) {
    index.set(item.display_name, item);
    for (const alias of item.aliases || []) index.set(alias, item);
  }
  return index;
}

function isStaple(name, taxonomyIndex) {
  const item = taxonomyIndex.get(name);
  return Array.isArray(item?.compatible_slot_codes)
    && item.compatible_slot_codes.includes('staple');
}

export function buildProductionMenuEntry(recipe, index, taxonomyIndex) {
  const missingFields = REQUIRED_RECIPE_FIELDS.filter(field => {
    const value = recipe[field];
    if (value === undefined || value === null) return true;
    if (ARRAY_RECIPE_FIELDS.has(field) && !Array.isArray(value)) return true;
    if (field === 'core_ingredients' && value.length === 0) return true;
    if (field === 'source_refs' && value.length === 0) return true;
    return false;
  });
  const staples = recipe.core_ingredients.filter(name => isStaple(name, taxonomyIndex));
  const core = recipe.core_ingredients.filter(name => !staples.includes(name));
  return {
    library_index: index + 1,
    id: recipe.id,
    name: recipe.name,
    status: recipe.status,
    identity: {
      family_id: recipe.family_id,
      cuisine: recipe.cuisine,
      form: recipe.form,
      summary: recipe.summary || '',
      adaptation_note: recipe.adaptation_note || '',
    },
    ingredients: {
      staples,
      core,
      optional: [...recipe.optional_ingredients],
      generation_optional: [...recipe.generation_optional_ingredients],
      liquids: [...recipe.generation_liquid_ingredients],
      substitutions: structuredClone(recipe.substitution_slots),
      discouraged: structuredClone(recipe.discouraged),
    },
    execution: {
      technique: [...recipe.technique],
      ratio_rules: [...recipe.ratio_rules],
      safety_rules: [...recipe.safety_rules],
      total_time_minutes: recipe.total_time_minutes,
      purposes: [...recipe.purposes],
      protein_class: [...(recipe.protein_class || [])],
      light_level: recipe.light_level || 'unknown',
    },
    evidence: {
      source_count: recipe.source_refs.length,
      source_refs: structuredClone(recipe.source_refs),
    },
    audit: {
      source_status: recipe.source_refs.length ? 'present' : 'pending_review',
      missing_fields: missingFields,
      static_status: missingFields.length ? 'missing_fields' : 'complete',
      verification_status: 'pending',
    },
  };
}

export function buildMenuMaster({ recipeLibrary, taxonomy, regionalResearch, verificationCases }) {
  const taxonomyIndex = buildTaxonomyIndex(taxonomy);
  const productionMenus = (recipeLibrary.recipes || [])
    .map((recipe, index) => buildProductionMenuEntry(recipe, index, taxonomyIndex));
  const researchCandidates = structuredClone(regionalResearch?.entries || []);
  const verificationEntries = structuredClone(verificationCases?.entries || []);

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
  const productionMenus = master.production_menus || [];
  const researchCandidates = master.research_candidates || [];
  const verificationCases = master.verification_cases || [];
  const ids = productionMenus.map(menu => menu.id);
  const libraryIndexes = productionMenus.map(menu => menu.library_index);
  const atlasIds = researchCandidates.map(candidate => candidate.atlas_id);
  const expectedSummary = {
    approved_count: productionMenus.filter(menu => menu.status === 'approved').length,
    auto_approved_count: productionMenus.filter(menu => menu.status === 'auto_approved').length,
    production_count: productionMenus.length,
    research_count: researchCandidates.length,
    verification_case_count: verificationCases.length,
  };

  if (new Set(ids).size !== ids.length) errors.push('duplicate production menu IDs');
  if (new Set(libraryIndexes).size !== libraryIndexes.length) errors.push('duplicate production menu library indexes');
  for (const [field, value] of Object.entries(expectedSummary)) {
    if (master.summary?.[field] !== value) errors.push(`mismatched summary ${field}`);
  }
  const productionIds = new Set(ids);
  if (atlasIds.some(atlasId => productionIds.has(atlasId))) {
    errors.push('production menu IDs overlap research atlas IDs');
  }

  return errors;
}
