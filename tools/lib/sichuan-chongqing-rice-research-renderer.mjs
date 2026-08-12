const asArray = value => Array.isArray(value) ? value : [];
const list = value => asArray(value).length ? asArray(value).join('、') : '—';
const clean = value => String(value ?? '').replaceAll('|', '｜').replaceAll('\n', '<br>');
const row = cells => `| ${cells.map(clean).join(' | ')} |`;

function claimSummary(claims) {
  return Object.entries(claims || {}).map(([id, claim]) => `${id}：${claim.verdict}`).join('<br>');
}

export function renderSichuanChongqingRiceResearchJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderSichuanChongqingRiceResearchMarkdown(report) {
  const overview = report.region_overview || {};
  const summary = report.summary || {};
  const completion = report.completion || {};
  const gaps = asArray(report.province_gap_audits);
  const candidates = asArray(report.candidate_audits);
  const leads = asArray(report.concrete_research_leads);
  const families = asArray(report.family_model);
  const claims = asArray(report.claim_matrix);
  const shapes = asArray(report.ingredient_shape_matrix);
  const sources = asArray(report.source_evidence);
  const boundaries = asArray(report.adaptation_boundaries);
  const safety = asArray(report.safety_boundaries);
  const decisions = asArray(report.product_decisions);
  const journeys = asArray(report.household_journeys);
  return [
    '<!-- Generated file: edit tools/data/sichuan-chongqing-rice-research.v1.json and rebuild. -->',
    '',
    '# 川渝孔干饭、洋芋饭与社饭研究覆盖层',
    '',
    '> 这是研究覆盖层，不是生产菜谱。本轮没有增加或修改 72 道生产菜谱，也没有把 3 条新增线索写入候选账本、Planner 或部署包。',
    '',
    `- 地域：${overview.name}（${list(overview.province_codes)}）`,
    `- 生产菜谱审计：${summary.production_audit_count ?? 0}`,
    `- 现有候选审计：${summary.candidate_audit_count ?? 0}`,
    `- 新增研究线索：${summary.concrete_research_lead_count ?? 0}`,
    `- 来源：${summary.source_count ?? 0}（A 级 ${summary.source_count_by_grade?.A ?? 0}，B 级 ${summary.source_count_by_grade?.B ?? 0}）`,
    `- 家庭旅程：${summary.household_journey_count ?? 0}（已人工评审 ${summary.human_journey_reviewed_count ?? 0}）`,
    `- 当前状态：${completion.status}`,
    `- 阻塞项：${list(completion.blockers)}`,
    '',
    '核心纠偏：四川孔／箜干饭中的米先煮至半熟并沥水，再铺到菜料上文火完成；半熟沥米不等于生米直接焖，也不等于熟剩饭炒饭。豌豆、四季豆、洋芋是并列可选菜料，不等于固定共现。玉米粉“金裹银”不等于玉米粒加土豆。重庆柴火洋芋饭的柴火与大铁锅身份成立，但柴火做法不等于电饭煲适配已经验证。',
    '',
    '## 1. 两个节点的真实覆盖',
    '',
    '| 节点 | 生产 | 候选 | 研究线索 | 地图问题 |',
    '| --- | --- | --- | --- | --- |',
    ...gaps.map(item => row([`${item.province_name}（${item.province_code}）`, list(item.production_recipe_ids), list(item.candidate_ids), list(item.lead_ids), item.research_question])),
    '',
    '## 2. 四条旧候选逐条审计',
    '',
    '| 候选 | 假设食材 | 证据结论 | 禁止主张 | 允许去向 |',
    '| --- | --- | --- | --- | --- |',
    ...candidates.map(item => row([`${item.prototype_name}（${item.candidate_id}）`, list(item.ingredient_hypothesis), claimSummary(item.claims), list(item.forbidden_claims), list(item.product_destinations)])),
    '',
    '## 3. 三条独立研究线索',
    '',
    '| 线索 | 家族与餐型 | 关键形态 | 证据结论 | 禁止捷径 |',
    '| --- | --- | --- | --- | --- |',
    ...leads.map(item => row([`${item.name}（${item.lead_id}，${item.province_code}）`, `${item.family_id} / ${item.meal_structure}`, list(item.ingredient_shapes), claimSummary(item.claims), list(item.forbidden_shortcuts)])),
    '',
    '## 4. 四个不能混写的家族',
    '',
    '| 家族 | 结构 | 证据状态 |',
    '| --- | --- | --- |',
    ...families.map(item => row([`${item.name}（${item.family_id}）`, item.meal_structure, item.evidence_status])),
    '',
    '## 5. Claim 与食材形态矩阵',
    '',
    '| 对象 | claim | 结论 | 来源 | 理由 |',
    '| --- | --- | --- | --- | --- |',
    ...claims.map(item => row([`${item.subject_type}:${item.subject_id}`, item.claim_id, item.verdict, list(item.evidence_source_ids), item.reason])),
    '',
    '| 形态 | 候选 | 线索 | 来源层 |',
    '| --- | --- | --- | --- |',
    ...shapes.map(item => row([item.shape, list(item.candidate_ids), list(item.lead_ids), list(item.source_types)])),
    '',
    '## 6. 固定来源证据包',
    '',
    '| 来源 | 等级 | 直接证明 | 不证明 |',
    '| --- | --- | --- | --- |',
    ...sources.map(item => row([`[${item.title}](${item.url})（${item.publisher}，${item.published_at || item.date_note}）`, item.source_grade, list(item.proves), list(item.does_not_prove)])),
    '',
    '## 7. 家庭适配与安全边界',
    '',
    '本轮只记录发芽变绿土豆、四季豆熟透、腊味熟透与高盐控制原则，不编造克数、液体、火力、分钟数或电饭煲程序。',
    '',
    '| 边界 | 状态 | 说明 |',
    '| --- | --- | --- |',
    ...boundaries.map(item => row([item.boundary_id, item.evidence_status, item.notes])),
    ...safety.map(item => row([item.safety_id, item.evidence_status, `${item.endpoint_note}；控制：${list(item.required_controls)}`])),
    '',
    '## 8. 产品去向决策',
    '',
    '| 类型 | 对象 | 状态 | 允许方向 | 未决边界 |',
    '| --- | --- | --- | --- | --- |',
    ...decisions.map(item => row([item.subject_type, item.subject_id, item.state, list(item.product_destinations), item.decision_reason])),
    '',
    '## 9. 12 条家庭食材旅程',
    '',
    '| ID | 节点 | 模式/意图 | 输入 | 允许家族 | 结构 | 研究结论 | 禁止主张 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...journeys.map(item => row([item.journey_id, item.province_code, `${item.mode}/${item.intent}`, list(item.input_items), list(item.expected_family_ids), item.expected_structure, item.expected_outcome, list(item.forbidden_claims)])),
    '',
    '## 10. 完成状态',
    '',
    `当前为 \`${completion.status}\`，阻塞项：${list(completion.blockers)}。来源证明地域家族，不等于项目 Ratio DSL、家庭器具适配或人工厨房验证已经完成。`,
    '',
  ].join('\n');
}

export function renderSichuanChongqingRiceJourneyReviewMarkdown(report) {
  const journeys = asArray(report?.household_journeys);
  return [
    '<!-- Generated file: review fields come from the research ledger; do not fabricate results here. -->',
    '',
    '# 川渝孔干饭、洋芋饭与社饭：12 条家庭食材旅程人工评审表',
    '',
    '> 自动测试只校验证据和边界；家庭直觉、操作负担、味道与身份保留必须由真人记录。',
    '',
    '| ID | 节点 | 模式/意图 | 输入 | 预期结构 | 研究预期 | 人工状态 | 家族匹配 | 家庭可行性 | 身份保留 | 记录 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...journeys.map(item => {
      const review = item.human_review || {};
      return row([item.journey_id, item.province_code, `${item.mode}/${item.intent}`, list(item.input_items), item.expected_structure, item.expected_outcome, review.status === 'pending' ? '待人工评审' : review.status, review.family_fit || '', review.household_feasibility || '', review.identity_preserved || '', review.notes || '']);
    }),
    '',
  ].join('\n');
}

export function buildSichuanChongqingRiceResearchArtifacts(report) {
  return new Map([
    ['tools/generated/sichuan-chongqing-rice-research.v1.json', renderSichuanChongqingRiceResearchJson(report)],
    ['docs/sichuan-chongqing-rice-research.md', renderSichuanChongqingRiceResearchMarkdown(report)],
    ['docs/sichuan-chongqing-rice-journey-review.md', renderSichuanChongqingRiceJourneyReviewMarkdown(report)],
  ]);
}
