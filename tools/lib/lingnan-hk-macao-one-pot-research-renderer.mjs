const asArray = value => Array.isArray(value) ? value : [];
const list = value => asArray(value).length ? asArray(value).join('、') : '—';
const clean = value => String(value ?? '').replaceAll('|', '｜').replaceAll('\n', '<br>');
const row = cells => `| ${cells.map(clean).join(' | ')} |`;

function claimSummary(claims) {
  return Object.entries(claims || {}).map(([id, claim]) => `${id}：${claim.verdict}`).join('<br>');
}

export function renderLingnanHkMacaoOnePotResearchJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderLingnanHkMacaoOnePotResearchMarkdown(report) {
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
    '<!-- Generated file: edit tools/data/lingnan-hk-macao-one-pot-research.v1.json and rebuild. -->',
    '',
    '# 岭南、香港与澳门一锅主餐研究覆盖层',
    '',
    '> 这是研究覆盖层，不是生产菜谱。本轮没有增加或修改 72 道生产菜谱，也没有把 5 条研究线索写入候选账本、Planner 或部署包。',
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
    '核心纠偏：广式煲仔饭的瓦煲、米饭部分熟后加具名浇头、低火收水与锅巴共同构成工艺边界；普通锅或电饭煲只能称“广式风味焖饭”，不能承诺瓦煲锅巴复刻。腊味、香菇滑鸡、豆豉排骨是具名分支，不是任意互换的蛋白槽。香港当前有煲仔饭消费场景，不等于香港独创。广西五色糯米饭的天然植物染色浸米与食品粉家庭适配必须分开；本轮“广西传统菠萝饭”未证实。海南有三条不能混写的线：定安菜包饭是熟饭、熟馅、出锅后生菜包裹的多阶段结构；椰丝饭只证实主食结构，存在完整主餐蛋白与配菜不足的风险；海南鸡饭是鸡饭分熟，白切鸡另烫、饭以鸡汤或鸡油另煮或拌熟饭，不证明生鸡生米全程同锅。澳门葡式海鲜饭仍是菜单研究线索，未证实单锅过程。',
    '',
    '## 1. 五个节点的真实覆盖',
    '',
    '| 节点 | 生产 | 候选 | 研究线索 | 地图问题 |',
    '| --- | --- | --- | --- | --- |',
    ...provinces.map(item => row([`${item.province_name}（${item.province_code}）`, list(item.production_recipe_ids), list(item.candidate_ids), list(item.lead_ids), item.research_question])),
    '',
    '## 2. 五道生产菜谱证据审计',
    '',
    '| 菜谱 | 状态 | 核心食材 | 证据结论 | 禁止主张 | 决策 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...production.map(item => row([`${item.recipe_name}（${item.recipe_id}）`, `${item.recipe_status} / ${item.audit_state}`, list(item.recipe_core_ingredients), claimSummary(item.claims), list(item.forbidden_claims), item.decision_reason])),
    '',
    '## 3. 候选账本基线',
    '',
    candidates.length === 0
      ? '当前岭南、香港与澳门节点没有既有候选可审计；“0 candidates”是基线事实，不以虚构候选补齐。'
      : '| 候选 | 假设食材 | 证据结论 | 禁止主张 | 允许去向 |\n| --- | --- | --- | --- | --- |\n' + candidates.map(item => row([`${item.prototype_name}（${item.candidate_id}）`, list(item.ingredient_hypothesis), claimSummary(item.claims), list(item.forbidden_claims), list(item.product_destinations)])).join('\n'),
    '',
    '## 4. 五条独立研究线索',
    '',
    '| 线索 | 家族与餐型 | 关键形态 | 证据结论 | 禁止捷径 |',
    '| --- | --- | --- | --- | --- |',
    ...leads.map(item => row([`${item.name}（${item.lead_id}，${item.province_code}）`, `${item.family_id} / ${item.meal_structure}`, list(item.ingredient_shapes), claimSummary(item.claims), list(item.forbidden_shortcuts)])),
    '',
    '## 5. 五个不能混写的家族',
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
    '本轮只记录具名工艺、食材形态和熟制原则，不编造克数、液体、火力、分钟数或电饭煲程序。广州瓦煲、广西天然植物染色、海南出锅包裹和澳门菜单线索都不得越界改写成已验证的家庭单锅方案。',
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
    '## 10. 15 条家庭食材旅程',
    '',
    '| ID | 节点 | 模式/意图 | 输入 | 允许家族 | 结构 | 研究结论 | 禁止主张 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...journeys.map(item => row([item.journey_id, item.province_code, `${item.mode}/${item.intent}`, list(item.input_items), list(item.expected_family_ids), item.expected_structure, item.expected_outcome, list(item.forbidden_claims)])),
    '',
    '## 11. 完成状态',
    '',
    `当前为 \`${completion.status}\`，阻塞项：${list(completion.blockers)}。来源只证明其直接陈述；它不自动成为项目 Ratio DSL、普通锅适配、完整主餐承诺或真人厨房验证。`,
    '',
  ].join('\n');
}

export function renderLingnanHkMacaoOnePotJourneyReviewMarkdown(report) {
  const journeys = asArray(report?.household_journeys);
  return [
    '<!-- Generated file: review fields come from the research ledger; do not fabricate results here. -->',
    '',
    '# 岭南、香港与澳门：15 条家庭食材旅程人工评审表',
    '',
    '> 自动测试只校验证据和边界；家庭直觉、操作负担、味道与身份保留必须由真人记录。',
    '',
    '| ID | 节点 | 模式/意图 | 输入 | 预期结构 | 研究预期 | 人工状态 | 家族匹配 | 家庭可行性 | 身份保留 | 记录 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...journeys.map(item => {
      const review = item.human_review || {};
      return row([item.journey_id, item.province_code, `${item.mode}/${item.intent}`, list(item.input_items), item.expected_structure, item.expected_outcome, review.status === 'pending' ? '待人工评审' : review.status, review.family_fit || '', review.household_feasibility || '', review.identity_preserved || '', review.notes || '']);
    }),
    '',
  ].join('\n');
}

export function buildLingnanHkMacaoOnePotResearchArtifacts(report) {
  return new Map([
    ['tools/generated/lingnan-hk-macao-one-pot-research.v1.json', renderLingnanHkMacaoOnePotResearchJson(report)],
    ['docs/lingnan-hk-macao-one-pot-research.md', renderLingnanHkMacaoOnePotResearchMarkdown(report)],
    ['docs/lingnan-hk-macao-one-pot-journey-review.md', renderLingnanHkMacaoOnePotJourneyReviewMarkdown(report)],
  ]);
}
