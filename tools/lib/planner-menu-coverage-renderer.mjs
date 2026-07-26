const asArray = value => Array.isArray(value) ? value : [];
const asObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const cell = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');
const list = values => asArray(values).join('、') || '无';
const percent = value => value === null || value === undefined ? '不适用' : `${Math.round(value * 1000) / 10}%`;

export function renderPlannerMenuCoverageJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function countRows(counts) {
  return Object.entries(asObject(counts)).map(([key, value]) => `| ${cell(key)} | ${value} |`);
}

export function renderPlannerMenuCoverageMarkdown(report) {
  const summary = asObject(report?.summary);
  const recipes = asArray(report?.recipes);
  const priorityRows = recipes.filter(recipe => ['P0', 'P1', 'P2'].includes(recipe.priority_band));
  const lines = [
    '<!-- Generated file: do not edit directly. -->',
    '',
    '# 菜单与 Planner 实际覆盖审计',
    '',
    '> Planner 覆盖审计不等于菜谱复刻、口味验证或人工试做批准。',
    '',
    '本报告把现有 72 道 recipe 的原始核心食材，原样送入当前 Planner V2 的确定性纯函数。它只回答当前 taxonomy、template 与 Ratio DSL 能否识别和规划这些食材；不会用菜名猜食材，也不会把模板兼容写成地方菜复刻。',
    '',
    `- Planner：\`${report?.planner_version || ''}\``,
    `- Template catalog：\`${report?.template_catalog_version || ''}\``,
    `- Taxonomy：\`${report?.taxonomy_version || ''}\``,
    `- Ratio catalog：\`${report?.ratio_catalog_version || ''}\``,
    `- 菜单：${summary.recipe_count || 0}（approved：${summary.approved_count || 0}；auto_approved：${summary.auto_approved_count || 0}）`,
    '- 模型与网络调用：0',
    '',
    '## 审计状态',
    '',
    '| 状态 | 数量 |',
    '| --- | ---: |',
    ...countRows(summary.status_counts),
    '',
    '## 优先级',
    '',
    '| 优先级 | 数量 |',
    '| --- | ---: |',
    ...countRows(summary.priority_counts),
    '',
    '### P0/P1/P2 机器事实',
    '',
    '| 优先级 | 菜单 | 技法家族 | 原始核心食材 | 主状态 | gap codes | 已识别能力状态 | 实际端到端状态 | 锅数 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | ---: |',
    ...priorityRows.map(recipe => `| ${[
      recipe.priority_band,
      recipe.recipe_name,
      recipe.technique_family_id || '无中国地域技法映射',
      list(recipe.raw_core_items),
      recipe.audit_status,
      list(recipe.gap_codes),
      recipe.recognized_only_scenario?.status,
      recipe.raw_core_scenario?.status,
      recipe.raw_core_scenario?.pot_count,
    ].map(cell).join(' | ')} |`),
    '',
    '本节只陈列缺口，不自动给出“应激活哪个模板”的结论。',
    '',
    '## 未识别核心食材',
    '',
    '| 原词 | 涉及菜单数 | 菜单 ID |',
    '| --- | ---: | --- |',
    ...asArray(report?.unclassified_items).map(row => `| ${cell(row.raw)} | ${row.recipe_count} | ${cell(list(row.recipe_ids))} |`),
    '',
    '## Active template 实际命中',
    '',
    '| Template | 被最终计划选中的菜单数 | 直接 evidence 对齐数 |',
    '| --- | ---: | ---: |',
    ...asArray(report?.by_template).map(row => `| \`${cell(row.template_id)}\` | ${row.selected_recipe_count} | ${row.direct_evidence_recipe_count} |`),
    '',
    '## 技法家族覆盖',
    '',
    '| 技法家族 | 菜单数 | 单锅完整覆盖 | taxonomy gap | Planner gap |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...asArray(report?.by_technique_family).map(row => `| \`${cell(row.technique_family_id)}\` | ${row.recipe_count} | ${row.single_pot_full_count} | ${row.taxonomy_gap_count} | ${row.planner_gap_count} |`),
    '',
    '## 地域覆盖',
    '',
    '| 地域 | 菜单数 | 单锅完整覆盖 | taxonomy gap | Planner gap |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...asArray(report?.by_region).map(row => `| \`${cell(row.region_id)}\` | ${row.recipe_count} | ${row.single_pot_full_count} | ${row.taxonomy_gap_count} | ${row.planner_gap_count} |`),
    '',
    '## 72 道菜单逐项结果',
    '',
    '| 菜单 | 原始核心食材 | 身份识别 | 已识别食材覆盖 | 端到端覆盖 | 计划 | Template | Evidence | 优先级 |',
    '| --- | --- | ---: | ---: | ---: | --- | --- | --- | --- |',
    ...recipes.map(recipe => `| ${[
      recipe.recipe_name,
      list(recipe.raw_core_items),
      percent(recipe.identity_recognition_ratio),
      percent(recipe.recognized_only_scenario?.recognized_planner_coverage_ratio),
      percent(recipe.raw_core_scenario?.end_to_end_core_coverage_ratio),
      `${recipe.raw_core_scenario?.plan_kind || 'none'} / ${recipe.raw_core_scenario?.status || ''}`,
      list(recipe.raw_core_scenario?.selected_template_ids),
      recipe.evidence_alignment?.direct_template_evidence ? '直接对齐' : '仅食材兼容或未规划',
      recipe.priority_band,
    ].map(cell).join(' | ')} |`),
    '',
    '## 输入指纹',
    '',
    ...Object.entries(asObject(report?.source_hashes)).map(([path, hash]) => `- \`${path}\`：\`${hash}\``),
    '',
  ];
  return lines.join('\n');
}

export function buildPlannerMenuCoverageArtifacts(report) {
  return new Map([
    ['tools/generated/planner-menu-coverage.v1.json', renderPlannerMenuCoverageJson(report)],
    ['docs/planner-menu-coverage.md', renderPlannerMenuCoverageMarkdown(report)],
  ]);
}
