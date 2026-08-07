/**
 * The public rice-meal page rotates only source-backed records that contain
 * enough material to show a recipe: a fixed batch and a cooking sequence.
 * Archive-only records remain available in source-recipes.html, but are not
 * presented as something a user can cook.
 */

const ROTATABLE_SHELVES = new Set(['A', 'B']);

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function hasFixedBatch(recipe) {
  return Boolean(recipe?.fixed_batch)
    && Array.isArray(recipe.fixed_batch.ingredients)
    && recipe.fixed_batch.ingredients.length > 0;
}

function hasSteps(recipe) {
  return Array.isArray(recipe?.cooking_sequence) && recipe.cooking_sequence.length > 0;
}

export function sourceRotationRegionPriority(record) {
  const codes = Array.isArray(record?.region_codes) ? record.region_codes : [];
  if (codes.some(code => /^CN(?:-|$)/.test(text(code)))) return 0;
  if (codes.some(code => /^(?:TW|HK|MO)(?:-|$)/.test(text(code)))) return 1;
  if (codes.some(code => /^KR(?:-|$)/.test(text(code)))) return 2;
  if (codes.some(code => /^JP(?:-|$)/.test(text(code)))) return 3;
  return 4;
}

function stableCompare(left, right) {
  return sourceRotationRegionPriority(left) - sourceRotationRegionPriority(right)
    || text(left?.canonical_name).localeCompare(text(right?.canonical_name), 'zh-CN')
    || text(left?.recipe_id).localeCompare(text(right?.recipe_id));
}

export function rotatableSourceRecipes(shelf) {
  const records = Array.isArray(shelf?.records) ? shelf.records : [];
  return records
    .filter(record => ROTATABLE_SHELVES.has(record?.shelf) && hasFixedBatch(record) && hasSteps(record))
    .slice()
    .sort(stableCompare);
}

export function nextSourceRecipe(records, currentRecipeId = '') {
  const list = Array.isArray(records) ? records : [];
  if (!list.length) return null;
  const currentIndex = list.findIndex(record => record?.recipe_id === currentRecipeId);
  return list[(currentIndex + 1 + list.length) % list.length] || list[0];
}

export function sourceRotationLabel(record) {
  if (record?.shelf === 'A') return '来源菜饭 · 已签署记录';
  if (record?.shelf === 'B') return '来源菜饭 · 试做架';
  return '来源菜饭';
}
