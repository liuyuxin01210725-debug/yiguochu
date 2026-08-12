const asArray = value => Array.isArray(value) ? value : [];
const list = value => asArray(value).length ? asArray(value).join('、') : '—';
const clean = value => String(value ?? '').replaceAll('|', '｜').replaceAll('\n', '<br>');
const row = cells => `| ${cells.map(clean).join(' | ')} |`;

function claimSummary(claims) {
  return Object.entries(claims || {}).map(([id, claim]) => `${id}：${claim.verdict}`).join('<br>');
}

export function renderNorthwestOnePotResearchJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderNorthwestOnePotResearchMarkdown(report) {
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
    '<!-- Generated file: edit tools/data/northwest-one-pot-research.v1.json and rebuild. -->',
    '',
    '# 西北一锅主餐研究覆盖层',
    '',
    '> 这是研究覆盖层，不是生产菜谱。本轮没有增加或修改生产 recipe、候选、Planner、Ratio DSL 或运行时代码。',
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
    '核心纠偏：陕北腊八软粮使用的软米、软谷米或软黄米不自动等于项目中的普通白米；普通白米只能诚实标为家庭适配，不能宣称传统等价。新疆羊肉抓饭有分阶段羊肉、胡萝卜、洋葱与生米结构的证据，而素抓饭只证实存在分支，不证明当前鹰嘴豆家庭配方或自由替换槽。甘肃、宁夏与新疆的面片／汤饭均只保留各自来源直接支持的身份和结构，彼此不互相证明精确配方、地域身份或单锅等价。',
    '',
    '工艺与排除边界：搅团需要持续手工搅拌，不能改写成无人看管电器；宁夏肉粘饭是肉菜先炒、再与米同蒸，不能泛化为任意肉饭焖煮。烩小吃因预制组件与低摩擦家庭锅边界不清而排除；馓饭／糁饭的命名争议不新建熬饭家族；八宝茶不是本轮一锅主餐对象，和烩小吃一并保持排除。',
    '',
    '## 1. 四个节点的真实覆盖',
    '',
    '| 节点 | 生产 | 候选 | 研究线索 | 地图问题 |',
    '| --- | --- | --- | --- | --- |',
    ...provinces.map(item => row([`${item.province_name}（${item.province_code}）`, list(item.production_recipe_ids), list(item.candidate_ids), list(item.lead_ids), item.research_question])),
    '',
    '## 2. 三道生产菜谱证据审计',
    '',
    '| 菜谱 | 状态 | 核心食材 | 证据结论 | 禁止主张 | 决策 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...production.map(item => row([`${item.recipe_name}（${item.recipe_id}）`, `${item.recipe_status} / ${item.audit_state}`, list(item.recipe_core_ingredients), claimSummary(item.claims), list(item.forbidden_claims), item.decision_reason])),
    '',
    '## 3. 候选账本基线',
    '',
    candidates.length === 0
      ? '当前西北节点没有既有候选可审计；“0 candidates”是基线事实，不以虚构候选补齐。'
      : '| 候选 | 假设食材 | 证据结论 | 禁止主张 | 允许去向 |\n| --- | --- | --- | --- | --- |\n' + candidates.map(item => row([`${item.prototype_name}（${item.candidate_id}）`, list(item.ingredient_hypothesis), claimSummary(item.claims), list(item.forbidden_claims), list(item.product_destinations)])).join('\n'),
    '',
    '## 4. 八条独立研究线索',
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
    '本轮只记录具名工艺、食材形态和熟制原则，不编造克数、液体、火力、分钟数或电器程序。面片／汤饭、搅团、抓饭和肉粘饭均不得越界改写为已验证的家庭单锅方案。',
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
    '## 10. 16 条家庭食材旅程',
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

export function renderNorthwestOnePotJourneyReviewMarkdown(report) {
  const journeys = asArray(report?.household_journeys);
  return [
    '<!-- Generated file: review fields come from the research ledger; do not fabricate results here. -->',
    '',
    '# 西北一锅主餐：16 条家庭食材旅程人工评审表',
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

export function buildNorthwestOnePotResearchArtifacts(report) {
  return new Map([
    ['tools/generated/northwest-one-pot-research.v1.json', renderNorthwestOnePotResearchJson(report)],
    ['docs/northwest-one-pot-research.md', renderNorthwestOnePotResearchMarkdown(report)],
    ['docs/northwest-one-pot-journey-review.md', renderNorthwestOnePotJourneyReviewMarkdown(report)],
  ]);
}
