const cell = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');
const row = values => `| ${values.map(cell).join(' | ')} |`;
const list = values => Array.isArray(values) && values.length ? values.join('、') : '无';
const endpointText = endpoint => {
  const value = typeof endpoint.value === 'boolean' ? (endpoint.value ? '是' : '否') : endpoint.value;
  return `${endpoint.metric} ${endpoint.operator} ${value}${endpoint.unit === 'boolean' ? '' : ` ${endpoint.unit}`}（${endpoint.measurement}）`;
};

export function renderNortheastStewSafetyEvidenceJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderNortheastStewSafetyEvidenceMarkdown(report) {
  return [
    '<!-- Generated file: do not edit directly. -->', '', '# 东北炖锅安全终点证据', '',
    `> ${report.conclusion}`, '',
    `- 官方安全来源：${report.summary.official_source_count}`,
    `- 可进入实厨校准的安全分支：${report.summary.calibration_ready_branch_count}`,
    `- 待完成校准：${report.summary.pending_calibration_count}`,
    `- 已激活生产规则：${report.summary.production_rules_activated}`, '',
    '- 排骨：最厚可食部位（避开骨头）至少 63 C，并在离火后静置至少 3 分钟。',
    '- 普通豆角：在受控加水盖焖方法下保持 100 C 小火焖超过 10 分钟，并确认均匀受热、无生绿色和豆腥味。',
    '- 油豆角：确认豆荚蔫软、转暗绿、无豆腥味并继续彻底烹熟；官方来源未给出分钟数，因此本规则不填分钟默认值。', '',
    '## 官方来源与适用边界', '',
    '| 来源 | 直接适用食材 | 证据分类 | 终点摘要 | 不能证明 |',
    '| --- | --- | --- | --- | --- |',
    ...report.sources.map(source => row([
      `[${source.title}](${source.url})（${source.publisher}；${source.author}；${source.published_at}；检索 ${source.retrieved_at}）`,
      list(source.applies_to_canonical_ids), source.classification, source.endpoint_summary, list(source.cannot_prove),
    ])), '',
    '## 受控安全规则', '',
    '所有 `all_of` 条件必须同时满足。排骨的官方参考时长不能替代温度计；普通豆角与油豆角分别走自己的规则，不能互借分钟数。', '',
    '| 规则 | 状态 | 食材 | 全部必需终点 | 方法约束 | 不能证明 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...report.rules.map(rule => row([
      rule.rule_id, rule.decision_status, list(rule.applies_to_canonical_ids),
      rule.all_of.map(endpointText).join('；'), list(rule.method_constraints), list(rule.cannot_prove),
    ])), '',
    '## 准入结论', '',
    `状态：\`${report.calibration_admission.status}\`。安全终点已经满足实厨校准的记录前提，但仍有：${list(report.calibration_admission.remaining_blockers)}。`, '',
    '本结论不激活 Ratio DSL、模板或生产生成链路。', '',
  ].join('\n');
}

export function renderNortheastStewCalibrationRunbook(report) {
  const cases = report.calibration_admission.calibration_cases;
  return [
    '<!-- Generated file: do not edit directly. -->', '', '# 东北锅边玉米饼 2/3/4 人份实厨校准执行表', '',
    '> 本表由东北数值证据和安全证据台账共同约束。不得填写生产默认值；代码、AI 或公开来源不得把空白项补成校准结果。', '',
    '**执行状态：`ready_for_kitchen_calibration`。排骨与豆角安全终点已建立，但仍未完成比例规则与 2/3/4 人份实厨校准；模板继续保持非运行状态。**', '',
    '安全检查必须按所用食材分支执行：排骨达到 `pork-ribs-safe-endpoint-v1`；普通豆角达到 `green-beans-fully-cooked-v1`；油豆角达到 `oil-beans-fully-cooked-v1`。任一必需条件未达到，当前试验即失败，不得用扩大比例范围掩盖。', '',
    '每次仅在同一玉米面、锅具和工艺条件下记录一个份数。一次只改变一个变量（例如只改变和面水）；先记录玉米面品牌/粒度和热水温度，再记录锅径、锅深、盖合与贴饼时液位。和面水、炖锅水和贴后时间必须分开称量/计时。', '',
    '| calibration_id | 份数 | 状态 | cornmeal_shape_or_cut | cornmeal_brand | preparation_water_temperature_c | wheat_flour_added | fermentation_used | pot_diameter_cm / pot_depth_cm / lid_fit_confirmed | stew_liquid_level_at_paste | cornmeal_grams | preparation_water_grams | stew_water_grams | steam_minutes | dough_holds_shape | center_cooked_through | cake_above_liquid | cake_holds_together | pot_not_scorched | pork_endpoint_reached | beans_endpoint_reached | 备注 |',
    '| --- | ---: | --- | --- | --- | ---: | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...cases.map(item => row([
      item.calibration_id, `${item.servings} 人份`, item.status, item.cornmeal_shape_or_cut ?? '', item.cornmeal_brand ?? '',
      item.preparation_water_temperature_c ?? '', item.wheat_flour_added ?? '', item.fermentation_used ?? '',
      [item.equipment.pot_diameter_cm, item.equipment.pot_depth_cm, item.equipment.lid_fit_confirmed].filter(value => value !== null).join(' / '),
      item.stew_liquid_level_at_paste ?? '', item.measurements.cornmeal_grams ?? '', item.measurements.preparation_water_grams ?? '',
      item.measurements.stew_water_grams ?? '', item.measurements.steam_minutes ?? '', item.acceptance_checks.dough_holds_shape ?? '',
      item.acceptance_checks.center_cooked_through ?? '', item.acceptance_checks.cake_above_liquid ?? '',
      item.acceptance_checks.cake_holds_together ?? '', item.acceptance_checks.pot_not_scorched ?? '',
      item.acceptance_checks.pork_endpoint_reached ?? '', item.acceptance_checks.beans_endpoint_reached ?? '', item.notes || '',
    ])), '',
  ].join('\n');
}

export function buildNortheastStewSafetyEvidenceArtifacts(report) {
  return new Map([
    ['tools/generated/northeast-stew-safety-evidence.v1.json', renderNortheastStewSafetyEvidenceJson(report)],
    ['docs/northeast-stew-safety-evidence.md', renderNortheastStewSafetyEvidenceMarkdown(report)],
    ['docs/northeast-stew-calibration-runbook.md', renderNortheastStewCalibrationRunbook(report)],
  ]);
}
