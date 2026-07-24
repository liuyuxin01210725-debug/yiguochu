import { BASIC_EXTRA_CATEGORIES, resolveBasicExtraIdentity } from './taxonomy-identity.js';

const ACTIVE = new Set(['acid-staple-pot','savory-mixed-rice-pot','cooked-rice-stir-pot','broth-noodle-pot','egg-tofu-vegetable-pot','mushroom-vegetable-stew-pot','beef-staple-pot','poultry-staple-pot']);
const OPS = new Set(['per_serving','ratio','bounded_sum','fixed_addition','scale_by_servings']);
const PREPARED = new WeakMap();
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim();
const number = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const allowed = (value, keys, label, errors) => { if (object(value)) for (const key of Object.keys(value)) if (!keys.has(key)) errors.push(`${label} unknown key: ${key}`); };
const bounds = (value, label, errors) => {
  if (!object(value)) { errors.push(`${label} must be an object`); return; }
  allowed(value, new Set(['min','default','max']), label, errors);
  for (const key of ['min','default','max']) if (!number(value[key])) errors.push(`${label}.${key} must be finite and non-negative`);
  if (number(value.min) && number(value.default) && number(value.max) && !(value.min <= value.default && value.default <= value.max)) errors.push(`${label} must satisfy min <= default <= max`);
};

export function validateRatioDslCatalog(catalog, templates, taxonomy, recipes) {
  try {
    const errors = [];
    if (!object(catalog)) return ['ratio DSL catalog must be an object'];
    allowed(catalog, new Set(['ratio_dsl_version','ratio_catalog_version','optional_per_serving','rules']), 'ratio DSL catalog', errors);
    if (catalog.ratio_dsl_version !== 1) errors.push('ratio_dsl_version must be 1');
    if (catalog.ratio_catalog_version !== 'ratio-rules-v1-20260724') errors.push('ratio_catalog_version must be ratio-rules-v1-20260724');
    if (!Array.isArray(catalog.rules)) return [...errors, 'rules must be an array'];
    const templateById = new Map((templates?.templates || []).filter(t => text(t?.template_id)).map(t => [t.template_id, t]));
    const recipeIds = new Set((recipes?.recipes || []).map(r => r?.id).filter(text));
    const ids = new Set();
    for (const [index, rule] of catalog.rules.entries()) {
      const label = `rules[${index}]`;
      if (!object(rule)) { errors.push(`${label} must be an object`); continue; }
      allowed(rule, new Set(['rule_id','evidence_recipe_ids','when','operations','rounding','example_context']), label, errors);
      if (!text(rule.rule_id)) errors.push(`${label}.rule_id is invalid`);
      if (ids.has(rule.rule_id)) errors.push(`duplicate rule_id: ${rule.rule_id}`); ids.add(rule.rule_id);
      if (!object(rule.when)) errors.push(`${label}.when must be an object`);
      const template = templateById.get(rule.when?.template_id);
      if (!template) errors.push(`${label}.when has unknown template`);
      const slotCategories = new Set(template?.ingredient_categories?.[rule.when?.slot_id] || []);
      if (!slotCategories.size) errors.push(`${label}.when has unknown slot`);
      if (!slotCategories.has(rule.when?.category)) errors.push(`${label}.when category is not accepted by slot`);
      if (!template?.ratio_constraints?.includes(rule.rule_id)) errors.push(`${label}.when template does not reference rule_id`);
      if (!Array.isArray(rule.evidence_recipe_ids) || !rule.evidence_recipe_ids.length) errors.push(`${label}.evidence_recipe_ids must be a non-empty string array`);
      for (const id of rule.evidence_recipe_ids || []) { if (!recipeIds.has(id)) errors.push(`${label} has unknown evidence recipe`); if (template && !template.evidence_recipe_ids.includes(id)) errors.push(`${label} evidence recipe is not declared by template`); }
      if (!Array.isArray(rule.operations) || !rule.operations.length) { errors.push(`${label}.operations must be a non-empty array`); continue; }
      const requiredUserSlots = (template?.required_slots || []).filter(slot => slot?.source_policy?.includes('user')).map(slot => slot.slot_id);
      const optionalUserSlots = (template?.optional_slots || []).filter(slot => slot?.source_policy?.includes('user')).map(slot => slot.slot_id);
      const allUserSlots = [...requiredUserSlots, ...optionalUserSlots];
      const stage = op => op.operator === 'ratio' || (['fixed_addition','scale_by_servings'].includes(op.operator) && op.target?.category === 'liquid') ? 2 : ['fixed_addition','scale_by_servings'].includes(op.operator) ? 3 : 1;
      let last = 0;
      for (const [opIndex, op] of rule.operations.entries()) {
        const opLabel = `${label}.operations[${opIndex}]`;
        if (!object(op)) { errors.push(`${opLabel} must be an object`); continue; }
        if (!OPS.has(op.operator)) { errors.push(`${opLabel} has unknown operator`); continue; }
        allowed(op, new Set(op.operator === 'per_serving' ? ['operator','target','grams'] : op.operator === 'ratio' ? ['operator','target','numerator','denominator','min','default','max'] : op.operator === 'bounded_sum' ? ['operator','target','grams_per_serving','liquid_credit_grams_per_serving'] : ['operator','target','grams']), opLabel, errors);
        if (stage(op) < last) errors.push(`${label}.operations must be ordered as food, liquid, then basic additions`); last = Math.max(last, stage(op));
        if (op.operator === 'per_serving') { if (!allUserSlots.includes(op.target?.slot_id)) errors.push(`${opLabel}.target must be a declared user slot`); bounds(op.grams, `${opLabel}.grams`, errors); }
        if (op.operator === 'bounded_sum') { bounds(op.grams_per_serving, `${opLabel}.grams_per_serving`, errors); bounds(op.liquid_credit_grams_per_serving, `${opLabel}.liquid_credit_grams_per_serving`, errors); }
        if (op.operator === 'ratio') { bounds({min:op.min,default:op.default,max:op.max}, opLabel, errors); if (!object(op.numerator)) errors.push(`${opLabel}.numerator must be an object`); if (!object(op.denominator)) errors.push(`${opLabel}.denominator must be an object`); if (op.denominator?.slot_id !== rule.when?.slot_id) errors.push(`${opLabel}.denominator must measure rule when.slot_id grams`); if (!resolveBasicExtraIdentity(op.target, taxonomy) || op.target?.category !== 'liquid') errors.push(`${opLabel}.target name category does not match taxonomy`); }
        if (['fixed_addition','scale_by_servings'].includes(op.operator)) { bounds(op.grams, `${opLabel}.grams`, errors); if (!resolveBasicExtraIdentity(op.target, taxonomy)) { errors.push(`${opLabel}.target must be a basic extra`); errors.push(`${opLabel}.target name category does not match taxonomy`); } }
      }
      for (const slotId of requiredUserSlots) if (rule.operations.filter(op => op?.operator === 'per_serving' && op.target?.slot_id === slotId).length !== 1) errors.push(`${label} requires exactly one per_serving for user slot ${slotId}`);
      for (const slotId of optionalUserSlots) {
        const grams = catalog.optional_per_serving?.[template.template_id]?.[slotId];
        if (!number(grams) || grams <= 0) errors.push(`${label} requires exactly one per_serving for user slot ${slotId}`);
      }
      if (template?.liquid_constraints?.retained_in_finished_meal && !rule.operations.some(op => op?.operator === 'ratio' || (['fixed_addition','scale_by_servings'].includes(op?.operator) && op.target?.category === 'liquid'))) errors.push(`${label} missing retained liquid operation`);
      if (!object(rule.rounding) || !Number.isInteger(rule.rounding.grams_to_nearest) || rule.rounding.grams_to_nearest <= 0) errors.push(`${label}.rounding.grams_to_nearest must be a positive integer`);
    }
    const refs = new Set();
    for (const template of templateById.values()) if (ACTIVE.has(template.template_id)) for (const ref of template.ratio_constraints || []) refs.add(ref);
    for (const ref of refs) if (!ids.has(ref)) errors.push(`active template ratio reference is unresolved: ${ref}`);
    for (const id of ids) if (!refs.has(id)) errors.push(`ratio rule is not an active template reference: ${id}`);
    for (const template of templateById.values()) if (ACTIVE.has(template.template_id)) {
      const userRequired = (template.required_slots || []).filter(slot => slot?.source_policy?.includes('user'));
      if (!userRequired.some(slot => { const wanted = new Set(template.ingredient_categories?.[slot.slot_id] || []); const actual = new Set(catalog.rules.filter(rule => rule?.when?.template_id === template.template_id && rule?.when?.slot_id === slot.slot_id).map(rule => rule.when.category)); return wanted.size && wanted.size === actual.size && [...wanted].every(x => actual.has(x)); })) errors.push(`${template.template_id} missing complete required category variant coverage`);
    }
    return errors;
  } catch (error) { return [`ratio DSL validation failed safely: ${error instanceof Error ? error.message : String(error)}`]; }
}

export function prepareRatioCatalog(catalog, context) {
  const errors = validateRatioDslCatalog(catalog, context?.templates, context?.taxonomy, context?.recipes);
  if (errors.length) return { ok:false, errors, catalog:null };
  PREPARED.set(catalog, context);
  return { ok:true, errors:[], catalog };
}

export function preparedRatioCatalogContext(catalog) { return PREPARED.get(catalog) || null; }
