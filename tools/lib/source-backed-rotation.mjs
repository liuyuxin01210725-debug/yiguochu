/**
 * The public rice-meal page rotates only source-backed records that contain
 * enough material to show a recipe: a fixed batch and a cooking sequence.
 * Archive-only records remain available in source-recipes.html, but are not
 * presented as something a user can cook.
 */

const ROTATABLE_SHELVES = new Set(['A', 'B']);
// These records remain in the research catalog, but the current product is a
// named one-pot rice-meal rotation. Porridge/congee, rice soup, and leftover
// rice second-cooking are kept in the archive and must not enter this rotation.
const ROTATION_EXCLUDED_FAMILIES = /(?:porridge|congee|rice-soup|leftover-rice)/iu;
const ROTATION_EXCLUDED_RECIPE_IDS = new Set([
  'tatung-seafood-porridge',
  'panasonic-my-century-egg-chicken-congee',
]);
const ROTATION_EXCLUDED_TITLE = /(?:粥|稀饭|汤饭|湯飯|congee|porridge|ぞうすい|雑炊|leftover\s+rice|剩饭)/iu;

const REGION_LABELS = Object.freeze({
  'CN-AH': '安徽', 'CN-BJ': '北京', 'CN-CQ': '重庆', 'CN-FJ': '福建',
  'CN-GD': '广东', 'CN-GS': '甘肃', 'CN-GX': '广西', 'CN-GZ': '贵州',
  'CN-HA': '河南', 'CN-HB': '湖北', 'CN-HE': '河北', 'CN-HI': '海南',
  'CN-HK': '香港', 'CN-HL': '黑龙江', 'CN-HN': '湖南', 'CN-JL': '吉林',
  'CN-JS': '江苏', 'CN-JX': '江西', 'CN-LN': '辽宁', 'CN-MO': '澳门',
  'CN-NM': '内蒙古', 'CN-NX': '宁夏', 'CN-QH': '青海', 'CN-SC': '四川',
  'CN-SD': '山东', 'CN-SH': '上海', 'CN-SN': '陕西', 'CN-SX': '山西',
  'CN-TJ': '天津', 'CN-XJ': '新疆', 'CN-XZ': '西藏', 'CN-YN': '云南',
  'CN-ZJ': '浙江', 'TW': '台湾', 'HK': '香港', 'MO': '澳门', 'JP': '日本',
  'KR': '韩国',
});

const FAMILY_LABELS = Object.freeze({
  'cantonese-claypot-rice': '广东煲仔饭',
  'hong-kong-claypot-rice': '香港煲仔饭',
  'jiangnan-vegetable-rice': '江南菜饭',
  'sichuan-home-style-menfan': '四川焖饭',
  'tongren-seasonal-shefan': '贵州社饭',
  'manufacturer-rice-cooker-recipes': '厂商电饭煲食谱',
  'manufacturer-one-pot-recipes': '厂商一锅饭食谱',
  'tatung-electric-rice-recipes': '大同电锅食谱',
  'taiwan-electric-cooker-rice': '台湾电锅饭',
  'taiwan-vegetable-rice': '台湾菜饭',
});

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

export function isSourceRotationEligible(record) {
  const family = text(record?.cuisine_family);
  const titles = [record?.canonical_name, ...(Array.isArray(record?.aliases) ? record.aliases : [])]
    .map(text)
    .filter(Boolean)
    .join(' ');
  return !ROTATION_EXCLUDED_FAMILIES.test(family)
    && !ROTATION_EXCLUDED_RECIPE_IDS.has(text(record?.recipe_id))
    && !ROTATION_EXCLUDED_TITLE.test(titles);
}

export function sourceRotationRegionPriority(record) {
  const codes = Array.isArray(record?.region_codes) ? record.region_codes : [];
  if (codes.some(code => /^CN(?:-|$)/.test(text(code)))) return 0;
  const chineseTitle = isChineseReadableTitle(record);
  if (codes.some(code => /^(?:TW|HK|MO)(?:-|$)/.test(text(code)))) return chineseTitle ? 1 : 3;
  if (chineseTitle) return 2;
  if (codes.some(code => /^KR(?:-|$)/.test(text(code)))) return 4;
  if (codes.some(code => /^JP(?:-|$)/.test(text(code)))) return 5;
  return 6;
}

function isChineseReadableTitle(record) {
  const name = sourceRotationDisplayName(record);
  return /[\u4e00-\u9fff]/u.test(name)
    && !/[\u3040-\u30ff\uac00-\ud7af]|\b(?:rice|congee|porridge|recipe)\b/iu.test(name);
}

function stableCompare(left, right) {
  return sourceRotationRegionPriority(left) - sourceRotationRegionPriority(right)
    || sourceRotationShelfPriority(left) - sourceRotationShelfPriority(right)
    || sourceRotationTitleLanguagePriority(left) - sourceRotationTitleLanguagePriority(right)
    || text(left?.canonical_name).localeCompare(text(right?.canonical_name), 'zh-CN')
    || text(left?.recipe_id).localeCompare(text(right?.recipe_id));
}

function sourceRotationShelfPriority(record) {
  return record?.shelf === 'A' ? 0 : 1;
}

export function sourceRotationTitleLanguagePriority(record) {
  const name = text(record?.canonical_name);
  return /[\u3040-\u30ff\uac00-\ud7af]|\b(?:rice|congee|porridge|recipe)\b/iu.test(name) ? 1 : 0;
}

export function rotatableSourceRecipes(shelf) {
  const records = Array.isArray(shelf?.records) ? shelf.records : [];
  return records
    .filter(record => ROTATABLE_SHELVES.has(record?.shelf)
      && isSourceRotationEligible(record)
      && hasFixedBatch(record)
      && hasSteps(record))
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
  if (record?.shelf === 'A') return '可直接试做（来源已核对）';
  if (record?.shelf === 'B') return '来源有据（待厨房验证）';
  return '来源菜饭';
}

export function sourceRotationRegionLabel(record) {
  const codes = Array.isArray(record?.region_codes) ? record.region_codes : [];
  const labels = codes.map(code => REGION_LABELS[text(code)]).filter(Boolean);
  if (labels.length) return [...new Set(labels)].join('、');
  if (text(record?.cuisine_family) === 'manufacturer-rice-cooker-recipes') return '厂商电饭煲食谱';
  if (text(record?.cuisine_family) === 'manufacturer-one-pot-recipes') return '厂商一锅饭食谱';
  return '地域未注明';
}

export function sourceRotationFamilyLabel(record) {
  return FAMILY_LABELS[text(record?.cuisine_family)] || '来源记录的菜饭';
}

export function sourceRotationDisplayName(record) {
  const raw = text(record?.canonical_name) || '未命名菜饭';
  return raw.replace(/^〖[^〗]+〗/u, '').trim() || '未命名菜饭';
}
