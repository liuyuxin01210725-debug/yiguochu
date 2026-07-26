const list = values => Array.isArray(values) && values.length ? values.join('、') : '无';
const cell = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');
const row = values => `| ${values.map(cell).join(' | ')} |`;

export function renderNortheastStewNumericEvidenceJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderNortheastStewNumericEvidenceMarkdown(report) {
  return [
    '<!-- Generated file: do not edit directly. -->', '', '# 东北炖锅数值证据账本', '',
    `> 研究专用：${report.conclusion}`, '',
    `- 来源：${report.summary.source_count}`,
    `- 合格同状态来源：${report.summary.qualified_source_count}`,
    `- 被阻塞规则：${report.summary.blocked_rule_count}`,
    `- 待真人校准：${report.summary.pending_calibration_count}`, '',
    '## 来源事实与边界', '',
    '| 来源 | 权利/许可边界 | 分类 | 独立组 | 原料状态 | 数值事实 | 不能证明 |', '| --- | --- | --- | --- | --- | --- | --- |',
    ...report.sources.map(source => row([
      `[${source.title}](${source.url})（${source.publisher}；${source.author}；${source.published_at}；检索 ${source.retrieved_at}${source.doi ? `；DOI ${source.doi}` : ''}）`, source.rights_or_license, source.classification, source.independence_group,
      `${source.ingredient_state.cornmeal}; 小麦粉 ${source.ingredient_state.wheat_flour}; 发酵 ${source.ingredient_state.fermentation}; ${source.ingredient_state.cooking_method}`,
      source.numeric_observations.map(item => `${item.metric}: ${item.value === null ? '区间' : item.value} [${item.min}-${item.max}] ${item.unit}（${item.basis}）`).join('；'), list(source.cannot_prove),
    ])), '', '## 机器规则裁决', '',
    '所有来源均非 `qualified_same_state`：论文仅作 `calibration_start_only`，其余来源仅作 `boundary_only`。不得拼接不同来源的和面水、炖锅水、液位或时间。', '',
    '| 规则 | 状态 | 合格来源 | 候选来源 | 阻塞原因 |', '| --- | --- | --- | --- | --- |',
    ...report.rules.map(rule => row([rule.rule_id, rule.decision_status, list(rule.qualified_source_ids), list(rule.candidate_source_ids), list(rule.blocking_reasons)])), '',
  ].join('\n');
}

export function renderNortheastStewCalibrationRunbook(report) {
  return [
    '<!-- Generated file: do not edit directly. -->', '', '# 东北锅边玉米饼 2/3/4 人份实厨校准执行表', '',
    '> 本表从 `tools/data/northeast-stew-research.v1.json` 的权威 `calibration_cases` 生成。不得填写生产默认值；代码、AI 或公开来源不得把空白项补成结果。', '',
    '**执行状态：`blocked_by_safety_endpoints`。排骨与豆角的权威熟制终点仍为 `unresearched`；在两项安全终点完成独立研究、审核并写入受控规则前，禁止开始实厨校准。此表当前只定义未来记录字段，不是烹饪指令。**', '',
    '每次仅在同一玉米面、锅具和工艺条件下记录一个份数。一次只改变一个变量（例如只改变和面水）；先在执行记录中补充玉米面品牌/粒度和热水温度，再记录锅径、锅深、盖合与贴饼时液位。和面水、炖锅水和贴后时间必须分开称量/计时。任何失败都保持规则 `blocked`。', '',
    '安全终点获批后，检查代码必须逐项记录：`pork_endpoint_reached`（排骨达到届时批准的熟制终点）与 `beans_endpoint_reached`（豆角达到届时批准的充分熟制终点）。二者任一未达到即记失败，不能用扩大比例范围掩盖。', '',
    '| calibration_id | 份数 | 状态 | cornmeal_shape_or_cut | cornmeal_brand | preparation_water_temperature_c | wheat_flour_added | fermentation_used | pot_diameter_cm / pot_depth_cm / lid_fit_confirmed | stew_liquid_level_at_paste | cornmeal_grams | preparation_water_grams | stew_water_grams | steam_minutes | dough_holds_shape | center_cooked_through | cake_above_liquid | cake_holds_together | pot_not_scorched | pork_endpoint_reached | beans_endpoint_reached | 备注 |', '| --- | ---: | --- | --- | --- | ---: | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...report.calibration_cases.map(item => row([
      item.calibration_id, `${item.servings} 人份`, item.status, item.cornmeal_shape_or_cut ?? '', item.cornmeal_brand ?? '', item.preparation_water_temperature_c ?? '', item.wheat_flour_added ?? '', item.fermentation_used ?? '', [item.equipment.pot_diameter_cm, item.equipment.pot_depth_cm, item.equipment.lid_fit_confirmed].filter(value => value !== null).join(' / '), item.stew_liquid_level_at_paste ?? '', item.measurements.cornmeal_grams ?? '', item.measurements.preparation_water_grams ?? '', item.measurements.stew_water_grams ?? '', item.measurements.steam_minutes ?? '',
      item.acceptance_checks.dough_holds_shape ?? '', item.acceptance_checks.center_cooked_through ?? '', item.acceptance_checks.cake_above_liquid ?? '', item.acceptance_checks.cake_holds_together ?? '', item.acceptance_checks.pot_not_scorched ?? '', item.acceptance_checks.pork_endpoint_reached ?? '', item.acceptance_checks.beans_endpoint_reached ?? '', item.notes || '',
    ])), '',
  ].join('\n');
}

export function buildNortheastStewNumericEvidenceArtifacts(report) {
  return new Map([
    ['tools/generated/northeast-stew-numeric-evidence.v1.json', renderNortheastStewNumericEvidenceJson(report)],
    ['docs/northeast-stew-numeric-evidence.md', renderNortheastStewNumericEvidenceMarkdown(report)],
    ['docs/northeast-stew-calibration-runbook.md', renderNortheastStewCalibrationRunbook(report)],
  ]);
}
