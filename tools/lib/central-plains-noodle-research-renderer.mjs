const asArray = value => Array.isArray(value) ? value : [];
const list = value => asArray(value).length ? asArray(value).join('、') : '—';
const escapeCell = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');
const row = values => `| ${values.map(escapeCell).join(' | ')} |`;

function claimSummary(claims) {
  return Object.entries(claims || {}).map(([key, value]) => `${key}: ${value?.verdict || '—'}`).join('；');
}

const outcomeLabels = {
  research_route_only: '仅研究路线',
  adaptation_only: '仅家庭适配研究',
  supported_family_route: '家族路线有据',
  insufficient_identity: '不足以使用地域菜名',
  new_family_research: '独立新家族研究',
  incompatible_substitution: '替换不兼容',
  safety_conflict: '安全约束冲突',
};

export function renderCentralPlainsNoodleResearchJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderCentralPlainsNoodleResearchMarkdown(report) {
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
    '# 中原（河南）家庭主餐结构研究审计',
    '',
    '来源：`tools/data/central-plains-noodle-research.v1.json`、现有 72 道 recipe、24 条 regional research ledger、全国地域地图与 regional mapping。',
    '由 `node tools/build-central-plains-noodle-research.mjs --write` 确定性生成。',
    '',
    '> **边界：这是研究覆盖层，不是生产菜谱。** 本轮不新增 recipe，不修改 Planner、template、taxonomy、Ratio DSL 或运行时代码。',
    '',
    '## 摘要与核心纠偏',
    '',
    `- 地域：${overview.name || '中原'}（${list(overview.province_codes)}）`,
    `- 生产条目审计：${summary.production_audit_count ?? 0}`,
    `- 研究候选：${summary.candidate_audit_count ?? 0}`,
    `- 具体研究线索：${summary.concrete_research_lead_count ?? 0}`,
    `- 来源：${summary.source_count ?? 0}（A 级 ${summary.source_count_by_grade?.A ?? 0}，B 级 ${summary.source_count_by_grade?.B ?? 0}）`,
    `- 家庭旅程：${summary.household_journey_count ?? 0}（已人工评审 ${summary.human_journey_reviewed_count ?? 0}）`,
    `- 当前状态：${completion.status || 'research_in_progress'}`,
    `- 阻塞项：${list(completion.blockers)}`,
    '',
    '关键纠偏：北方豆角焖面保持跨地域身份，河南当前有卤面不等于河南起源；芹菜猪肉、卷心菜菌菇的固定地域核心仍未证明；发酵酸浆不能用普通豆浆静默替代。',
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
    '## 3. 五种不能混写的家族',
    '',
    '| 家族 | 结构 | 证据状态 |',
    '| --- | --- | --- |',
    ...families.map(item => row([`${item.name}（${item.family_id}）`, item.meal_structure, item.evidence_status])),
    '',
    '## 4. 食材与加工形态矩阵',
    '',
    '| 形态 | 生产条目 | 研究候选 | 具体线索 |',
    '| --- | --- | --- | --- |',
    ...shapes.map(item => row([item.shape, list(item.production_recipe_ids), list(item.candidate_ids), list(item.research_lead_ids)])),
    '',
    '## 5. 固定来源证据包',
    '',
    '| 来源 | 等级 | 直接证明 | 不证明 |',
    '| --- | --- | --- | --- |',
    ...sources.map(item => row([`[${item.title}](${item.url})（${item.publisher}，${item.published_at}）`, item.source_grade, list(item.proves), list(item.does_not_prove)])),
    '',
    '## 6. 家庭适配与安全边界',
    '',
    '安全来源只支持豆角和猪肉熟透、生熟分开等原则，本轮不编造项目克数、时长或液体比例。',
    '',
    '| 边界 | 状态 | 说明 |',
    '| --- | --- | --- |',
    ...boundaries.map(item => row([item.boundary_id, item.evidence_status, item.notes])),
    ...safety.map(item => row([item.safety_id, item.evidence_status, item.endpoint_note])),
    '',
    '## 7. 三条独立研究线索',
    '',
    '| 线索 | 家族 | 已知结构 | 未决问题 | 产品去向 |',
    '| --- | --- | --- | --- | --- |',
    ...leads.map(item => row([`${item.name}（${item.lead_id}）`, item.family_id, list(item.known_structure), list(item.open_questions), list(item.product_destinations)])),
    '',
    '## 8. 产品去向决策',
    '',
    '| 类型 | 对象 | 状态 | 允许方向 | 分数 | 理由 |',
    '| --- | --- | --- | --- | ---: | --- |',
    ...decisions.map(item => row([item.subject_type, item.subject_id, item.state, list(item.product_destinations), item.priority?.total_score ?? '', item.decision_reason])),
    '',
    '## 9. 12 条家庭食材旅程',
    '',
    '| ID | 模式/意图 | 输入 | 允许家族 | 禁止主张 | 研究结论 | 说明 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...journeys.map(item => row([item.journey_id, `${item.mode}/${item.intent}`, list(item.input_items), list(item.expected_family_ids), list(item.forbidden_claims), outcomeLabels[item.expected_outcome] || item.expected_outcome, item.reason])),
    '',
    '## 10. 完成状态',
    '',
    `当前为 \`${completion.status || 'research_in_progress'}\`，阻塞项：${list(completion.blockers)}。这些未完成前，不将研究线索称为已批准菜谱。`,
    '',
  ].join('\n');
}

export function renderCentralPlainsNoodleJourneyReviewMarkdown(report) {
  const journeys = asArray(report?.household_journeys);
  return [
    '<!-- Generated file: review fields come from the research ledger; do not fabricate results here. -->',
    '',
    '# 中原面食：12 条家庭食材旅程人工评审表',
    '',
    '> 自动测试只校验边界；是否符合家庭直觉、能否在家庭锅具中完成、地域身份是否保留，必须由人工记录。',
    '',
    '| ID | 模式/意图 | 输入 | 允许家族 | 研究预期 | 人工状态 | 家族匹配 | 家庭可行性 | 身份保留 | 记录 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...journeys.map(item => {
      const review = item.human_review || {};
      return row([
        item.journey_id, `${item.mode}/${item.intent}`, list(item.input_items), list(item.expected_family_ids),
        outcomeLabels[item.expected_outcome] || item.expected_outcome,
        review.status === 'pending' ? '待人工评审' : review.status,
        review.family_fit ?? '', review.household_feasibility ?? '', review.identity_preserved ?? '', review.notes || '',
      ]);
    }),
    '',
  ].join('\n');
}

export function buildCentralPlainsNoodleResearchArtifacts(report) {
  return new Map([
    ['tools/generated/central-plains-noodle-research.v1.json', renderCentralPlainsNoodleResearchJson(report)],
    ['docs/central-plains-noodle-research.md', renderCentralPlainsNoodleResearchMarkdown(report)],
    ['docs/central-plains-noodle-journey-review.md', renderCentralPlainsNoodleJourneyReviewMarkdown(report)],
  ]);
}
