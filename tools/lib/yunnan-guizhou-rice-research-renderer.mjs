const asArray = value => Array.isArray(value) ? value : [];
const list = value => asArray(value).length ? asArray(value).join('、') : '—';
const clean = value => String(value ?? '').replaceAll('|', '｜').replaceAll('\n', '<br>');
const row = cells => `| ${cells.map(clean).join(' | ')} |`;

function claimSummary(claims) {
  return Object.entries(claims || {}).map(([id, claim]) => `${id}：${claim.verdict}`).join('<br>');
}

export function renderYunnanGuizhouRiceResearchJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderYunnanGuizhouRiceResearchMarkdown(report) {
  const overview = report.region_overview || {};
  const summary = report.summary || {};
  const completion = report.completion || {};
  const provinces = asArray(report.province_coverage_audits);
  const production = asArray(report.production_recipe_audits);
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
    '<!-- Generated file: edit tools/data/yunnan-guizhou-rice-research.v1.json and rebuild. -->',
    '',
    '# 云贵铜锅洋芋饭、菠萝糯米饭与社饭研究覆盖层',
    '',
    '> 这是研究覆盖层，不是生产菜谱。本轮没有增加或修改 72 道生产菜谱，也没有把 3 条研究线索写入候选账本、Planner 或部署包。',
    '',
    `- 地域：${overview.name}（${list(overview.province_codes)}）`,
    `- 生产菜谱审计：${summary.production_audit_count ?? 0}`,
    `- 现有候选审计：${summary.candidate_audit_count ?? 0}`,
    `- 独立研究线索：${summary.concrete_research_lead_count ?? 0}`,
    `- 来源：${summary.source_count ?? 0}（A 级 ${summary.source_count_by_grade?.A ?? 0}，B 级 ${summary.source_count_by_grade?.B ?? 0}）`,
    `- 家庭旅程：${summary.household_journey_count ?? 0}（已人工评审 ${summary.human_journey_reviewed_count ?? 0}）`,
    `- 当前状态：${completion.status}`,
    `- 阻塞项：${list(completion.blockers)}`,
    '',
    '核心纠偏：江川铜锅洋芋饭与贵州侗家社饭都存在半熟或预处理米状态，半熟米不等于生米直接焖，也不等于熟剩饭。铜锅身份成立不等于普通锅或电饭煲已经验证等价。傣族菠萝糯米饭中的菠萝兼具果肉、酸甜、出水与容器作用，菠萝不等于芒果。云南菌类背景不得泛化为未知野生菌通用槽位。',
    '',
    '## 1. 云南与贵州的真实覆盖',
    '',
    '| 节点 | 生产 | 候选 | 研究线索 | 地图问题 |',
    '| --- | --- | --- | --- | --- |',
    ...provinces.map(item => row([`${item.province_name}（${item.province_code}）`, list(item.production_recipe_ids), list(item.candidate_ids), list(item.lead_ids), item.research_question])),
    '',
    '## 2. 两道生产菜谱证据审计',
    '',
    '| 菜谱 | 状态 | 核心食材 | 证据结论 | 禁止主张 | 决策 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...production.map(item => row([`${item.recipe_name}（${item.recipe_id}）`, `${item.recipe_status} / ${item.audit_state}`, list(item.recipe_core_ingredients), claimSummary(item.claims), list(item.forbidden_claims), item.decision_reason])),
    '',
    '## 3. 四条旧候选逐条审计',
    '',
    '| 候选 | 假设食材 | 证据结论 | 禁止主张 | 允许去向 |',
    '| --- | --- | --- | --- | --- |',
    ...candidates.map(item => row([`${item.prototype_name}（${item.candidate_id}）`, list(item.ingredient_hypothesis), claimSummary(item.claims), list(item.forbidden_claims), list(item.product_destinations)])),
    '',
    '## 4. 三条独立研究线索',
    '',
    '| 线索 | 家族与餐型 | 关键形态 | 证据结论 | 禁止捷径 |',
    '| --- | --- | --- | --- | --- |',
    ...leads.map(item => row([`${item.name}（${item.lead_id}，${item.province_code}）`, `${item.family_id} / ${item.meal_structure}`, list(item.ingredient_shapes), claimSummary(item.claims), list(item.forbidden_shortcuts)])),
    '',
    '## 5. 三个不能混写的家族',
    '',
    '| 家族 | 结构 | 证据状态 |',
    '| --- | --- | --- |',
    ...families.map(item => row([`${item.name}（${item.family_id}）`, item.meal_structure, item.evidence_status])),
    '',
    '## 6. Claim 与食材形态矩阵',
    '',
    '| 对象 | claim | 结论 | 来源 | 理由 |',
    '| --- | --- | --- | --- | --- |',
    ...claims.map(item => row([`${item.subject_type}:${item.subject_id}`, item.claim_id, item.verdict, list(item.evidence_source_ids), item.reason])),
    '',
    '| 形态 | 生产 | 候选 | 线索 | 来源层 |',
    '| --- | --- | --- | --- | --- |',
    ...shapes.map(item => row([item.shape, list(item.production_recipe_ids), list(item.candidate_ids), list(item.lead_ids), list(item.source_types)])),
    '',
    '## 7. 固定来源证据包',
    '',
    '| 来源 | 等级 | 直接证明 | 不证明 |',
    '| --- | --- | --- | --- |',
    ...sources.map(item => row([`[${item.title}](${item.url})（${item.publisher}，${item.published_at || item.date_note}）`, item.source_grade, list(item.proves), list(item.does_not_prove)])),
    '',
    '## 8. 家庭适配与安全边界',
    '',
    '本轮只记录米状态、锅具、水分、食品身份和熟制原则，不编造克数、液体、火力、分钟数或电饭煲程序。野生菌不得由地域标签泛化为可食用槽位。',
    '',
    '| 边界 | 状态 | 说明 |',
    '| --- | --- | --- |',
    ...boundaries.map(item => row([item.boundary_id, item.evidence_status, item.notes])),
    ...safety.map(item => row([item.safety_id, item.evidence_status, `${item.endpoint_note}；控制：${list(item.required_controls)}`])),
    '',
    '## 9. 产品去向决策',
    '',
    '| 类型 | 对象 | 状态 | 允许方向 | 未决边界 |',
    '| --- | --- | --- | --- | --- |',
    ...decisions.map(item => row([item.subject_type, item.subject_id, item.state, list(item.product_destinations), item.decision_reason])),
    '',
    '## 10. 12 条家庭食材旅程',
    '',
    '| ID | 节点 | 模式/意图 | 输入 | 允许家族 | 结构 | 研究结论 | 禁止主张 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...journeys.map(item => row([item.journey_id, item.province_code, `${item.mode}/${item.intent}`, list(item.input_items), list(item.expected_family_ids), item.expected_structure, item.expected_outcome, list(item.forbidden_claims)])),
    '',
    '## 11. 完成状态',
    '',
    `当前为 \`${completion.status}\`，阻塞项：${list(completion.blockers)}。来源证明地域家族，不等于项目 Ratio DSL、家庭器具适配或人工厨房验证已经完成。`,
    '',
  ].join('\n');
}

export function renderYunnanGuizhouRiceJourneyReviewMarkdown(report) {
  const journeys = asArray(report?.household_journeys);
  return [
    '<!-- Generated file: review fields come from the research ledger; do not fabricate results here. -->',
    '',
    '# 云贵铜锅洋芋饭、菠萝糯米饭与社饭：12 条家庭食材旅程人工评审表',
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

export function buildYunnanGuizhouRiceResearchArtifacts(report) {
  return new Map([
    ['tools/generated/yunnan-guizhou-rice-research.v1.json', renderYunnanGuizhouRiceResearchJson(report)],
    ['docs/yunnan-guizhou-rice-research.md', renderYunnanGuizhouRiceResearchMarkdown(report)],
    ['docs/yunnan-guizhou-rice-journey-review.md', renderYunnanGuizhouRiceJourneyReviewMarkdown(report)],
  ]);
}
