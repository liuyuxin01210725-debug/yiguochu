const asArray = value => Array.isArray(value) ? value : [];
const text = value => String(value ?? '');
const list = value => asArray(value).join('、') || '无';
const markdownCell = value => text(value).replaceAll('|', '\\|').replaceAll('\n', '<br>');

function tableRow(values) {
  return `| ${values.map(markdownCell).join(' | ')} |`;
}
export function renderRegionalAtlasJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderRegionalAtlasMarkdown(report) {
  const summary = report?.summary || {};
  const regions = asArray(report?.regions);
  const provinces = asArray(report?.province_coverage);
  const techniques = asArray(report?.technique_coverage);
  const production = asArray(report?.production_audit);
  const research = asArray(report?.research_audit);
  const pantry = asArray(report?.pantry_gap_coverage);
  const overlays = asArray(report?.cultural_overlays);
  const sourceStatus = report?.source_status || {};
  const lines = [
    '<!-- Generated file: do not edit directly. -->',
    '',
    '# 中国一锅主餐全国地域地图',
    '',
    '来源：`tools/data/regional-atlas.v2.json`、`tools/data/regional-menu-mappings.v1.json`、`tools/data/recipe-library.json`、`tools/data/regional-menu-research.v1.json`。',
    '由 `node tools/build-regional-atlas.mjs --write` 确定性生成。',
    '',
    '> **边界：地域地图完成不等于地方菜谱均已验证。** `skeleton_only` 和 `discovery_only` 只表示研究位置，不代表事实核实、人工批准或生产可用。',
    '',
    '## 摘要',
    '',
    `- 地域板块：${summary.region_count ?? 0}`,
    `- 省级节点：${summary.province_count ?? 0}`,
    `- 技法家族：${summary.technique_family_count ?? 0}`,
    `- 生产菜单审计：${summary.production_audit_count ?? 0}`,
    `- 研究候选审计：${summary.research_audit_count ?? 0}`,
    `- 生产地域范围：省级 ${summary.province_specific_count ?? 0}；跨地域 ${summary.cross_regional_chinese_count ?? 0}；全国性家常 ${summary.national_household_count ?? 0}；中国地图外 ${summary.outside_cn_atlas_count ?? 0}`,
    `- 当前空白省级节点：${summary.blank_province_count ?? 0}`,
    '',
    '## 13 个地域板块',
    '',
    '| 地域 | 省级节点 | 生产菜单 | 研究候选 | 覆盖状态 |',
    '| --- | --- | ---: | ---: | --- |',
    ...regions.map(row => tableRow([
      `${row.name}（${row.region_id}）`, list(row.province_codes),
      asArray(row.production_recipe_ids).length, asArray(row.research_candidate_ids).length,
      row.coverage_status,
    ])),
    '',
    '## 34 个省级节点',
    '',
    '| 节点 | 地域 | 生产菜单 | 研究候选 | 状态 | 研究问题或暂缓理由 |',
    '| --- | --- | ---: | ---: | --- | --- |',
    ...provinces.map(row => tableRow([
      `${row.name}（${row.atlas_code}）`, row.region_id,
      asArray(row.production_recipe_ids).length, asArray(row.research_candidate_ids).length,
      row.coverage_status, row.research_question || row.defer_reason || '',
    ])),
    '',
    '## 12 个技法家族',
    '',
    '| 技法 | 主食状态 | 生产菜单 | 研究候选 | 状态 | 研究问题 |',
    '| --- | --- | ---: | ---: | --- | --- |',
    ...techniques.map(row => tableRow([
      `${row.name}（${row.family_id}）`, list(row.staple_states),
      asArray(row.production_recipe_ids).length, asArray(row.research_candidate_ids).length,
      row.coverage_status, row.research_question,
    ])),
    '',
    '## 72 道生产菜单地域范围审计',
    '',
    '`national_household` 表示全国性家常结构；`outside_cn_atlas` 表示菜单保留在产品库，但不伪造中国地域出处。',
    '',
    '| 菜单 | 原菜系 | regional_scope | 地域 | 省级节点 | 主技法 | 来源数 |',
    '| --- | --- | --- | --- | --- | --- | ---: |',
    ...production.map(row => tableRow([
      `${row.name}（${row.source_id}）`, row.cuisine, row.regional_scope,
      list(row.region_ids), list(row.province_codes), row.primary_family_id || '不适用', row.source_count,
    ])),
    '',
    '## 24 条地域研究候选',
    '',
    '以下条目仍是研究候选。`discovery_only` 不等于 `fact_checked`，也不等于生产菜谱。',
    '',
    '| 研究题目 | source_confidence | 地域范围 | 地域 | 省级节点 | 主技法 | pantry 缺口 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...research.map(row => tableRow([
      `${row.prototype_name}（${row.source_id}）`, row.source_confidence, row.regional_scope,
      list(row.region_ids), list(row.province_codes), row.primary_family_id || '未归类', list(row.pantry_gap_items),
    ])),
    '',
    '## Pantry 食材缺口（研究原词）',
    '',
    '该表只统计研究账本中的原词，不做同义词合并，也不修改 ingredient taxonomy。',
    '',
    '| 食材原词 | 候选数 | 研究候选 IDs |',
    '| --- | ---: | --- |',
    ...pantry.map(row => tableRow([row.item, row.research_candidate_count, list(row.research_candidate_ids)])),
    '',
    '## 来源状态',
    '',
    `- 生产菜单有来源记录：${sourceStatus.production?.with_sources ?? 0}`,
    `- 生产菜单无来源记录：${sourceStatus.production?.without_sources ?? 0}`,
    `- 研究候选 discovery_only：${sourceStatus.research?.discovery_only ?? 0}`,
    `- 研究候选 fact_checked：${sourceStatus.research?.fact_checked ?? 0}`,
    `- 研究候选其他状态：${sourceStatus.research?.other ?? 0}`,
    '',
    '## 民族与文化研究覆盖层',
    '',
    '覆盖层只指向研究节点，不复制菜谱原型，也不声称穷尽分布。',
    '',
    '| 覆盖层 | 研究省级节点 | 状态 | 研究问题 |',
    '| --- | --- | --- | --- |',
    ...overlays.map(row => tableRow([
      `${row.name}（${row.overlay_id}）`, list(row.target_province_codes), row.status, row.research_question,
    ])),
    '',
  ];
  return lines.join('\n');
}

export function buildRegionalAtlasArtifacts(report) {
  return new Map([
    ['tools/generated/regional-atlas.v2.json', renderRegionalAtlasJson(report)],
    ['docs/regional-atlas.md', renderRegionalAtlasMarkdown(report)],
  ]);
}
