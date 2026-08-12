const asArray = value => Array.isArray(value) ? value : [];
const list = value => asArray(value).length ? asArray(value).join('、') : '—';
const clean = value => String(value ?? '').replaceAll('|', '｜').replaceAll('\n', '<br>');
const row = cells => `| ${cells.map(clean).join(' | ')} |`;

function claimSummary(claims) {
  return Object.entries(claims || {}).map(([id, claim]) => `${id}：${claim.verdict}`).join('<br>');
}

export function renderQinghaiTibetOnePotResearchJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderQinghaiTibetOnePotResearchMarkdown(report) {
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
  const critical = asArray(report.critical_boundaries);
  const techniques = asArray(report.technique_boundaries);
  const decisions = asArray(report.product_decisions);
  const journeys = asArray(report.household_journeys);
  return [
    '<!-- Generated file: edit tools/data/qinghai-tibet-one-pot-research.v1.json and rebuild. -->',
    '',
    '# 青藏一锅主餐研究覆盖层',
    '',
    '> 这是研究覆盖层，不是生产菜谱。本轮没有增加或修改 72 道生产 recipe、24 条地域候选、Planner、Ratio DSL 或运行时代码。',
    '',
    `- 地域：${overview.name}（${list(overview.province_codes)}）`,
    `- 生产菜谱审计：${summary.production_audit_count ?? 0}`,
    `- 现有候选审计：${summary.candidate_audit_count ?? 0}`,
    `- 独立研究线索：${summary.concrete_research_lead_count ?? 0}`,
    `- 来源：${summary.source_count ?? 0}（A 级 ${summary.source_count_by_grade?.A ?? 0}，B 级 ${summary.source_count_by_grade?.B ?? 0}，C 级 ${summary.source_count_by_grade?.C ?? 0}）`,
    `- 家庭旅程：${summary.household_journey_count ?? 0}（已人工评审 ${summary.human_journey_reviewed_count ?? 0}）`,
    `- 当前状态：${completion.status}`,
    `- 阻塞项：${list(completion.blockers)}`,
    '',
    '## 五项机器可验证的关键边界',
    '',
    ...critical.flatMap(item => [
      `### ${item.finding_id}（${item.finding_kind}）`,
      '',
      item.statement,
      '',
      `- 对象：${list(asArray(item.subjects).map(subject => `${subject.subject_type}:${subject.subject_id}`))}`,
      `- 来源：${list(item.source_ids)}`,
      `- Claim：${list(item.claim_tokens)}`,
      `- 适配边界：${list(item.boundary_ids)}`,
      `- 禁止生成项：${list(item.prohibited_generated_items)}`,
      '',
    ]),
    '## 三项机器可验证的技法边界',
    '',
    ...techniques.flatMap(item => [
      `### ${item.technique_id}（${item.province_code}）`,
      '',
      item.statement,
      '',
      `- 研究对象：${item.lead_id}`,
      `- 已证事实：${list(item.supported_facts)}`,
      `- 研究假设：${list(item.research_hypotheses)}`,
      `- 硬约束：${list(item.hard_constraints)}`,
      `- 时长分类：${item.duration_class}`,
      `- 禁止 intent：${list(item.forbidden_intents)}`,
      `- 来源：${list(item.source_ids)}`,
      `- Claim：${list(item.claim_tokens)}`,
      `- 适配边界：${list(item.boundary_ids)}`,
      `- 安全终点：${list(item.safety_endpoint_ids)}`,
      '',
    ]),
    '',
    '## 1. 两个节点的真实覆盖',
    '',
    '| 节点 | 生产 | 候选 | 研究线索 | 地图问题 |',
    '| --- | --- | --- | --- | --- |',
    ...provinces.map(item => row([`${item.province_name}（${item.province_code}）`, list(item.production_recipe_ids), list(item.candidate_ids), list(item.lead_ids), item.research_question])),
    '',
    '## 2. 四道生产菜谱证据审计',
    '',
    '| 菜谱 | 状态 | 核心食材 | 证据结论 | 禁止主张 | 决策 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...production.map(item => row([`${item.recipe_name}（${item.recipe_id}）`, `${item.recipe_status} / ${item.audit_state}`, list(item.recipe_core_ingredients), claimSummary(item.claims), list(item.forbidden_claims), item.decision_reason])),
    '',
    '## 3. 候选账本基线',
    '',
    candidates.length === 0
      ? '当前青藏节点没有既有候选可审计；“0 candidates”是基线事实，不以虚构候选补齐。'
      : '| 候选 | 假设食材 | 证据结论 | 禁止主张 | 允许去向 |\n| --- | --- | --- | --- | --- |\n' + candidates.map(item => row([`${item.prototype_name}（${item.candidate_id}）`, list(item.ingredient_hypothesis), claimSummary(item.claims), list(item.forbidden_claims), list(item.product_destinations)])).join('\n'),
    '',
    '## 4. 五条独立研究线索',
    '',
    '| 线索 | 家族与餐型 | 关键形态 | 证据结论 | 禁止捷径 |',
    '| --- | --- | --- | --- | --- |',
    ...leads.map(item => row([`${item.name}（${item.lead_id}，${item.province_code}）`, `${item.family_id} / ${item.meal_structure}`, list(item.ingredient_shapes), claimSummary(item.claims), list(item.forbidden_shortcuts)])),
    '',
    '## 5. 六个不能混写的家族',
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
    '| 形态 | 生产 | 生产证据语境 | 候选 | 线索 | 来源层 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...shapes.map(item => row([item.shape, list(item.production_recipe_ids), list(item.production_evidence_context_recipe_ids), list(item.candidate_ids), list(item.lead_ids), list(item.source_types)])),
    '',
    '## 7. 固定来源证据包',
    '',
    '| 来源 | 等级 | 直接证明 | 不证明 | 反证 |',
    '| --- | --- | --- | --- | --- |',
    ...sources.map(item => row([`[${item.title}](${item.url})（${item.publisher}，${item.published_at || item.date_note}）`, item.source_grade, list(item.proves), list(item.does_not_prove), list(item.contradicts)])),
    '',
    '## 8. 家庭适配与安全边界',
    '',
    '本轮只记录具名工艺、食材形态和通用熟制原则，不编造克数、液体、火力、分钟数、锅具等价或自由替换关系。青稞整粒、糌粑炒制粉、面片、面疙瘩和藏面必须保持各自身份。',
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
    '| ID | 节点 | 类型 | 输入 | 研究对象 | 禁止主张 | 人工状态 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...journeys.map(item => row([item.journey_id, item.province_code, item.journey_kind, list(item.input_items), item.journey_kind === 'production_audit' ? `生产审计：${list(item.audit_recipe_ids)}` : `研究家族：${list(item.expected_family_ids)}`, list(item.forbidden_claims), item.human_review?.status === 'pending' ? '待人工评审' : item.human_review?.status])),
    '',
    '## 11. 完成状态',
    '',
    `当前为 \`${completion.status}\`，阻塞项：${list(completion.blockers)}。来源只证明其直接陈述；它不自动成为项目 Ratio DSL、普通锅适配、完整主餐承诺或真人厨房验证。`,
    '',
  ].join('\n');
}

export function renderQinghaiTibetOnePotJourneyReviewMarkdown(report) {
  const journeys = asArray(report?.household_journeys);
  return [
    '<!-- Generated file: review fields come from the research ledger; do not fabricate results here. -->',
    '',
    '# 青藏一锅主餐：12 条家庭食材旅程人工评审表',
    '',
    '> 自动测试只校验证据和边界；家庭直觉、操作负担、味道与身份保留必须由真人记录。',
    '',
    '| ID | 节点 | 类型 | 输入 | 研究对象 | 禁止主张 | 人工状态 | 对象匹配 | 家庭可行性 | 身份保留 | 记录 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...journeys.map(item => {
      const review = item.human_review || {};
      const target = item.journey_kind === 'production_audit' ? `生产审计：${list(item.audit_recipe_ids)}` : `研究家族：${list(item.expected_family_ids)}`;
      return row([item.journey_id, item.province_code, item.journey_kind, list(item.input_items), target, list(item.forbidden_claims), review.status === 'pending' ? '待人工评审' : review.status, review.family_fit || '', review.household_feasibility || '', review.identity_preserved || '', review.notes || '']);
    }),
    '',
  ].join('\n');
}

export function buildQinghaiTibetOnePotResearchArtifacts(report) {
  return new Map([
    ['tools/generated/qinghai-tibet-one-pot-research.v1.json', renderQinghaiTibetOnePotResearchJson(report)],
    ['docs/qinghai-tibet-one-pot-research.md', renderQinghaiTibetOnePotResearchMarkdown(report)],
    ['docs/qinghai-tibet-one-pot-journey-review.md', renderQinghaiTibetOnePotJourneyReviewMarkdown(report)],
  ]);
}
