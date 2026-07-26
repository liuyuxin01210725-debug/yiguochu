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

export function buildNortheastStewNumericEvidenceArtifacts(report) {
  return new Map([
    ['tools/generated/northeast-stew-numeric-evidence.v1.json', renderNortheastStewNumericEvidenceJson(report)],
    ['docs/northeast-stew-numeric-evidence.md', renderNortheastStewNumericEvidenceMarkdown(report)],
  ]);
}
