import {
  PUBLIC_SOURCE_BACKED_STATUSES,
  REQUIRED_EXECUTABLE_SCOPES,
  claimsNamedAppliance,
  containsRawHighRiskIngredient,
  processEvidenceStatus,
  PROCESS_EVIDENCE_WARNING,
} from './source-backed-one-pot-catalog-validator.mjs';

const CLAIM_SCOPES = [
  'identity', 'ingredients', 'quantity', 'liquid',
  'process', 'appliance', 'time', 'safety',
];

const FACT_CHECK_SCOPES = ['ingredients', 'process'];

const FAMILY_LABELS = {
  'manufacturer-rice-cooker-recipes': '厂商电饭煲食谱',
  'manufacturer-one-pot-recipes': '厂商一锅饭食谱',
};

const asArray = value => Array.isArray(value) ? value : [];
const asText = value => typeof value === 'string' && value.trim() ? value.trim() : '（未记录）';
const compareText = (left, right) => {
  const leftText = String(left);
  const rightText = String(right);
  return leftText === rightText ? 0 : (leftText < rightText ? -1 : 1);
};

export function sortedRecipes(catalog) {
  return [...asArray(catalog?.recipes)].sort((left, right) => (
    compareText(left?.cuisine_family, right?.cuisine_family)
    || compareText(asArray(left?.region_codes).join(','), asArray(right?.region_codes).join(','))
    || compareText(left?.canonical_name, right?.canonical_name)
    || compareText(left?.recipe_id, right?.recipe_id)
  ));
}

export function recipeRegionLabel(recipe) {
  const regions = asArray(recipe?.region_codes).filter(code => typeof code === 'string' && code.trim());
  if (regions.length) return regions.join(', ');
  if (recipe?.cuisine_family === 'manufacturer-rice-cooker-recipes') return '非地域·厂商食谱';
  if (recipe?.cuisine_family === 'manufacturer-one-pot-recipes') return '非地域·厂商一锅饭';
  return '非地域（未记录）';
}

export function supportedClaimScopes(recipe) {
  return [...new Set(asArray(recipe?.source_refs).flatMap(source => asArray(source?.claim_scopes)))].filter(
    scope => CLAIM_SCOPES.includes(scope),
  ).sort(compareText);
}

export function requiredPromotionScopes(recipe) {
  const status = recipe?.status;
  if (status === 'discovered') return ['identity'];
  if (status === 'identity_verified') return [...FACT_CHECK_SCOPES];
  if (status !== 'recipe_fact_checked'
    && status !== 'executable'
    && !PUBLIC_SOURCE_BACKED_STATUSES.has(status)) return [];

  const required = new Set(REQUIRED_EXECUTABLE_SCOPES);
  if (claimsNamedAppliance(recipe)) required.add('appliance');
  if (containsRawHighRiskIngredient(recipe)) required.add('safety');
  return CLAIM_SCOPES.filter(scope => required.has(scope));
}

export function promotionBlockerScopes(recipe) {
  const supported = new Set(supportedClaimScopes(recipe));
  return requiredPromotionScopes(recipe).filter(scope => !supported.has(scope));
}

export function missingClaimScopes(recipe) {
  return promotionBlockerScopes(recipe);
}

export function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function formatFamily(family) {
  return FAMILY_LABELS[family] ?? asText(family);
}

function formatStatus(recipe) {
  const status = recipe?.status;
  let label;
  if (PUBLIC_SOURCE_BACKED_STATUSES.has(status)) label = `公开候选（${asText(status)}）`;
  else if (status === 'executable') label = '可执行研究记录（非公开）';
  else label = '研究记录（非公开可执行）';
  if (processEvidenceStatus(recipe) === 'tier6_process_only') {
    label += `；${PROCESS_EVIDENCE_WARNING}`;
  }
  return label;
}

function formatAliases(recipe) {
  const aliases = asArray(recipe?.aliases).filter(alias => typeof alias === 'string' && alias.trim());
  return aliases.length ? aliases.join('；') : '—';
}

function formatSources(recipe) {
  const sources = asArray(recipe?.source_refs);
  if (!sources.length) return '—';
  return sources.map(source => `[${asText(source?.title)}](${asText(source?.url)})`).join('<br>');
}

function renderMarkdown(catalog) {
  const rows = sortedRecipes(catalog);
  const lines = [
    '# 有来源的一锅主餐目录',
    '',
    '> 本文由 `tools/data/source-backed-one-pot-recipes.v1.json` 确定性生成；研究记录不是公开可执行食谱。',
    '',
  ];
  let currentFamily = null;
  for (const recipe of rows) {
    const family = asText(recipe?.cuisine_family);
    if (family !== currentFamily) {
      currentFamily = family;
      lines.push(`## ${formatFamily(family)}`, '');
      lines.push('| 规范名 | 别名 | 地区 | 菜系 | 状态 | 核心食材 | 已支持证据范围 | 当前晋升阻塞 | 直接来源 |');
      lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    }
    const supported = supportedClaimScopes(recipe);
    const blockers = promotionBlockerScopes(recipe);
    lines.push([
      asText(recipe?.canonical_name),
      formatAliases(recipe),
      recipeRegionLabel(recipe),
      formatFamily(family),
      formatStatus(recipe),
      asArray(recipe?.core_ingredients).map(asText).join('；') || '—',
      supported.join('、') || '—',
      blockers.length ? `缺 ${blockers.join('、')}` : '当前状态所需证据已齐',
      formatSources(recipe),
    ].map(value => String(value).replaceAll('|', '\\|')).join(' | ').replace(/^/, '| ').concat(' |'));
  }
  if (!rows.length) lines.push('（没有可渲染的目录条目。）');
  return `${lines.join('\n')}\n`;
}

function csvRows(catalog) {
  const header = [
    'recipe_id', 'canonical_name', 'aliases', 'region_codes', 'cuisine_family', 'status',
    'visibility', 'core_ingredients', 'supported_evidence_scopes', 'promotion_blockers',
    'source_id', 'source_title', 'source_url', 'source_claim_scopes',
  ];
  const rows = [header];
  for (const recipe of sortedRecipes(catalog)) {
    const sources = asArray(recipe?.source_refs);
    for (const source of sources.length ? sources : [null]) {
      rows.push([
        recipe?.recipe_id ?? '', recipe?.canonical_name ?? '', formatAliases(recipe).replaceAll('；', ';'),
        recipeRegionLabel(recipe), recipe?.cuisine_family ?? '', recipe?.status ?? '', formatStatus(recipe),
        asArray(recipe?.core_ingredients).join(';'), supportedClaimScopes(recipe).join(';'), promotionBlockerScopes(recipe).join(';'),
        source?.source_id ?? '', source?.title ?? '', source?.url ?? '', asArray(source?.claim_scopes).join(';'),
      ]);
    }
  }
  return `${rows.map(row => row.map(csvEscape).join(',')).join('\n')}\n`;
}

function renderGapSection(number, scope, recipes) {
  const missing = recipes.filter(recipe => promotionBlockerScopes(recipe).includes(scope));
  const lines = [`## ${number}. Missing ${scope}`, ''];
  if (!missing.length) return `${lines.concat('无。', '').join('\n')}`;
  for (const recipe of missing) {
    lines.push(`- ${asText(recipe?.canonical_name)} (${asText(recipe?.recipe_id)}) — ${recipeRegionLabel(recipe)}`);
  }
  lines.push('');
  return lines.join('\n');
}

function renderGaps(catalog, migration) {
  const recipes = sortedRecipes(catalog);
  const lines = [
    '# 有来源一锅主餐缺口报告',
    '',
    '> 本报告由目录、来源声明范围和迁移台账派生；各段只列出当前状态的晋升阻塞，不将未要求的范围写成通用缺口。',
    '',
  ];
  CLAIM_SCOPES.forEach((scope, index) => lines.push(renderGapSection(index + 1, scope, recipes)));
  lines.push('## 9. Regional blanks', '');
  const blanks = asArray(catalog?.regional_blanks).slice().sort((left, right) => compareText(left?.region_code, right?.region_code));
  if (!blanks.length) lines.push('无。');
  for (const blank of blanks) {
    lines.push(`- ${asText(blank?.region_code)} — ${asText(blank?.reason)}${blank?.searched_at ? `（检索于 ${blank.searched_at}）` : ''}`);
  }
  lines.push('', '## 10. Excluded project-original combinations', '');
  const exclusions = asArray(migration?.items)
    .filter(item => item?.disposition === 'project_original_excluded')
    .sort((left, right) => compareText(left?.legacy_variant_id, right?.legacy_variant_id));
  if (!exclusions.length) lines.push('无。');
  for (const item of exclusions) {
    lines.push(`- ${asText(item?.legacy_display_name)} (${asText(item?.legacy_variant_id)}) — ${asText(item?.reason)}`);
  }
  return `${lines.join('\n')}\n`;
}

export function buildSourceBackedOnePotArtifacts(catalog, migration) {
  return new Map([
    ['docs/source-backed-one-pot-recipes.md', renderMarkdown(catalog)],
    ['docs/source-backed-one-pot-recipes.csv', csvRows(catalog)],
    ['docs/source-backed-one-pot-recipe-gaps.md', renderGaps(catalog, migration)],
  ]);
}
