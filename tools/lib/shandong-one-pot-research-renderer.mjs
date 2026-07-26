const asArray = value => Array.isArray(value) ? value : [];
const list = value => asArray(value).length ? asArray(value).join('、') : '—';
const escapeCell = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');
const row = values => `| ${values.map(escapeCell).join(' | ')} |`;

function claimSummary(claims) {
  return Object.entries(claims || {}).map(([key, value]) => `${key}: ${value?.verdict || '—'}`).join('；');
}

const outcomeLabels = {
  supported_family_route: '家族路线有据',
  needs_more_evidence: '需更多证据',
  unsupported_for_family: '不能并入该家族',
  research_lead_only: '仅研究线索',
  unsafe_or_unrecognized: '安全或识别不完整',
};

export function renderShandongOnePotResearchJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderShandongOnePotResearchMarkdown(report) {
  const overview = report?.region_overview || {};
  const summary = report?.summary || {};
  const completion = report?.completion || {};
  const production = asArray(report?.production_recipe_audits);
  const candidates = asArray(report?.candidate_audits);
  const families = asArray(report?.family_model);
  const shapes = asArray(report?.ingredient_shape_matrix);
  const sources = asArray(report?.source_evidence);
  const boundaries = asArray(report?.adaptation_boundaries);
  const safety = asArray(report?.safety_boundaries);
  const leads = asArray(report?.concrete_research_leads);
  const decisions = asArray(report?.product_decisions);
  const journeys = asArray(report?.household_journeys);
  return [
    '<!-- Generated file: do not edit directly. -->',
    '',
    '# 山东家庭主餐结构研究审计',
    '',
    '来源：`tools/data/shandong-one-pot-research.v1.json`、现有 72 道 recipe、24 条 regional research ledger、全国地域地图与 regional mapping。',
    '由 `node tools/build-shandong-one-pot-research.mjs --write` 确定性生成。',
    '',
    '> **边界：这是研究资料，不是生产菜谱批准。** 本轮不新增 recipe，不修改 Planner、template、taxonomy、Ratio DSL 或运行时代码。',
    '',
    '## 摘要与核心纠偏',
    '',
    `- 地域：${overview.name || '山东'}（${list(overview.province_codes)}）`,
    `- 生产条目审计：${summary.production_audit_count ?? 0}`,
    `- 研究候选：${summary.candidate_audit_count ?? 0}`,
    `- 具体研究线索：${summary.concrete_research_lead_count ?? 0}`,
    `- 来源：${summary.source_count ?? 0}（A 级 ${summary.source_count_by_grade?.A ?? 0}）`,
    `- 家庭旅程：${summary.household_journey_count ?? 0}（已人工评审 ${summary.human_journey_reviewed_count ?? 0}）`,
    `- 当前状态：${completion.status || 'research_in_progress'}`,
    `- 阻塞项：${list(completion.blockers)}`,
    '',
    '关键纠偏：豆角焖面保持跨北方身份，山东当代出现不等于山东起源；白菜豆腐大锅的粉条固定核心仍未证明；馒头必须诚实标为锅外现成主食。',
    '',
    '## 1. 生产条目审计',
    '',
    '| 条目 | 核心食材 | 地域决定 | claim 结论 | 去向 |',
    '| --- | --- | --- | --- | --- |',
    ...production.map(item => row([`${item.recipe_name}（${item.recipe_id}）`, list(item.core_ingredients), item.regional_scope_decision, claimSummary(item.claims), list(item.product_destinations)])),
    '',
    '## 2. 四条候选审计',
    '',
    '| 候选 | 原假设 | 食物形态 | claim 结论 | 去向 |',
    '| --- | --- | --- | --- | --- |',
    ...candidates.map(item => row([`${item.prototype_name}（${item.candidate_id}）`, list(item.ingredient_hypothesis), list([...new Set([...asArray(item.ingredient_shapes), ...asArray(item.shape_distinctions)])]), claimSummary(item.claims), list(item.product_destinations)])),
    '',
    '## 3. 五种家庭主餐结构',
    '',
    '| 家族 | 结构 | 证据状态 |',
    '| --- | --- | --- |',
    ...families.map(item => row([`${item.name}（${item.family_id}）`, item.meal_structure, item.evidence_status])),
    '',
    '## 4. 食材与主食形态矩阵',
    '',
    '| 形态 | 生产条目 | 研究候选 |',
    '| --- | --- | --- |',
    ...shapes.map(item => row([item.shape, list(item.production_recipe_ids), list(item.candidate_ids)])),
    '',
    '## 5. 固定来源证据包',
    '',
    '| 来源 | 等级 | 直接证明 | 不证明 |',
    '| --- | --- | --- | --- |',
    ...sources.map(item => row([`[${item.title}](${item.url})（${item.publisher}，${item.published_at}）`, item.source_grade, list(item.proves), list(item.does_not_prove)])),
    '',
    '## 6. 家庭适配与安全边界',
    '',
    '安全来源只支持熟透与交叉污染原则，本轮不编造项目克数、时长或温度。',
    '',
    '| 边界 | 状态 | 说明 |',
    '| --- | --- | --- |',
    ...boundaries.map(item => row([item.boundary_id, item.evidence_status, item.notes])),
    ...safety.map(item => row([item.safety_id, item.evidence_status, item.endpoint_note])),
    '',
    '## 7. 两条具体研究线索',
    '',
    '| 线索 | 已知结构 | 未决问题 | 产品去向 |',
    '| --- | --- | --- | --- |',
    ...leads.map(item => row([`${item.name}（${item.lead_id}）`, list(item.known_structure), list(item.open_questions), list(item.product_destinations)])),
    '',
    '## 8. 产品去向决策',
    '',
    '| 类型 | 对象 | 状态 | 允许方向 | 分数 | 理由 |',
    '| --- | --- | --- | --- | ---: | --- |',
    ...decisions.map(item => row([item.subject_type, item.subject_id, item.state, list(item.product_destinations), item.priority?.total_score ?? '', item.decision_reason])),
    '',
    '## 9. 12 条家庭食材旅程',
    '',
    '| ID | 模式/意图 | 输入 | 预期使用 | 未规划 | 结构 | 研究结论 | 说明 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...journeys.map(item => row([item.journey_id, `${item.mode}/${item.intent}`, list(item.raw_items), list(item.expected_used_items), list(item.expected_unplanned_items), item.expected_structure, outcomeLabels[item.expected_research_outcome] || item.expected_research_outcome, item.explanation])),
    '',
    '## 10. 完成状态',
    '',
    `当前为 \`${completion.status || 'research_in_progress'}\`，阻塞项：${list(completion.blockers)}。这些未完成前，不将研究线索称为已批准菜谱。`,
    '',
  ].join('\n');
}

export function renderShandongOnePotJourneyReviewMarkdown(report) {
  const journeys = asArray(report?.household_journeys);
  return [
    '<!-- Generated file: review fields come from the research ledger; do not fabricate results here. -->',
    '',
    '# 山东家庭主餐：12 条家庭食材旅程人工评审表',
    '',
    '> 自动测试只校验边界；是否符合家庭直觉、好不好做和味型是否成立，必须由人工记录。',
    '',
    '| ID | 模式/意图 | 输入 | 预期结构 | 研究预期 | 人工状态 | 家庭直觉 | 可操作性 | 味型判断 | 评审人 | 日期 | 记录与结论 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...journeys.map(item => {
      const review = item.human_review || {};
      return row([
        item.journey_id, `${item.mode}/${item.intent}`, list(item.raw_items), item.expected_structure,
        outcomeLabels[item.expected_research_outcome] || item.expected_research_outcome,
        review.status === 'pending' ? '待人工评审' : review.status,
        review.household_intuition || '', review.operability || '', review.taste_judgement || '',
        review.reviewer || '', review.reviewed_at || '', [review.notes, review.conclusion].filter(Boolean).join('；'),
      ]);
    }),
    '',
  ].join('\n');
}

export function buildShandongOnePotResearchArtifacts(report) {
  return new Map([
    ['tools/generated/shandong-one-pot-research.v1.json', renderShandongOnePotResearchJson(report)],
    ['docs/shandong-one-pot-research.md', renderShandongOnePotResearchMarkdown(report)],
    ['docs/shandong-one-pot-journey-review.md', renderShandongOnePotJourneyReviewMarkdown(report)],
  ]);
}
