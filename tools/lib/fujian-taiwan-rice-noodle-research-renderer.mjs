const asArray = value => Array.isArray(value) ? value : [];
const list = value => asArray(value).length ? asArray(value).join('、') : '—';
const escapeCell = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');
const row = values => `| ${values.map(escapeCell).join(' | ')} |`;

const outcomeLabels = {
  research_family_route: '可进入家族研究',
  project_adaptation_only: '仅项目家庭适配',
  menu_presence_only: '仅证明菜单存在',
  needs_ingredient_identity: '需先确认食材身份',
  requires_pretreatment: '需要规格与预处理',
  official_family_route: '官方家族结构成立',
  ratio_research_only: '仅比例研究',
  history_supported_formula_unresolved: '历史成立、配方未解决',
  contest_structure_only: '仅活动食谱结构',
  cross_regional_adaptation_only: '仅跨地域家庭适配',
};

function claimSummary(claims) {
  return Object.entries(claims || {}).map(([key, value]) => `${key}: ${value?.verdict || '—'}`).join('；');
}

export function renderFujianTaiwanRiceNoodleResearchJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderFujianTaiwanRiceNoodleResearchMarkdown(report) {
  const overview = report?.region_overview || {};
  const summary = report?.summary || {};
  const completion = report?.completion || {};
  const gaps = asArray(report?.province_gap_audits);
  const audits = asArray(report?.production_recipe_audits);
  const leads = asArray(report?.concrete_research_leads);
  const families = asArray(report?.family_model);
  const claims = asArray(report?.claim_matrix);
  const shapes = asArray(report?.ingredient_shape_matrix);
  const sources = asArray(report?.source_evidence);
  const boundaries = asArray(report?.adaptation_boundaries);
  const safety = asArray(report?.safety_boundaries);
  const decisions = asArray(report?.product_decisions);
  const journeys = asArray(report?.household_journeys);
  return [
    '<!-- Generated file: do not edit directly. -->',
    '',
    '# 闽台咸饭、油饭、炊饭与卤面研究审计',
    '',
    '来源：`tools/data/fujian-taiwan-rice-noodle-research.v1.json`、现有 72 道 recipe、24 条 regional research ledger、全国地域地图与 regional mapping。',
    '由 `node tools/build-fujian-taiwan-rice-noodle-research.mjs --write` 确定性生成。',
    '',
    '> **边界：这是研究覆盖层，不是生产菜谱。** 本轮审计现有 6 道映射、补 3 条研究线索；不新增 recipe，不修改 Planner、template、taxonomy、Ratio DSL 或运行时代码。',
    '',
    '## 摘要与核心纠偏',
    '',
    `- 地域：${overview.name || '闽台'}（${list(overview.province_codes)}）`,
    `- 生产菜谱审计：${summary.production_audit_count ?? 0}（省级 ${summary.province_specific_recipe_count ?? 0}，跨地域 ${summary.cross_regional_recipe_count ?? 0}）`,
    `- 当前候选映射：${summary.candidate_audit_count ?? 0}`,
    `- 具体研究线索：${summary.concrete_research_lead_count ?? 0}`,
    `- 来源：${summary.source_count ?? 0}（A 级 ${summary.source_count_by_grade?.A ?? 0}，B 级 ${summary.source_count_by_grade?.B ?? 0}）`,
    `- 家庭旅程：${summary.household_journey_count ?? 0}（已人工评审 ${summary.human_journey_reviewed_count ?? 0}）`,
    `- 当前状态：${completion.status || 'research_in_progress'}`,
    `- 阻塞项：${list(completion.blockers)}`,
    '',
    '核心纠偏：官方高丽菜饭的 0.8 倍水依赖浸泡沥干米、焯水沥干菜等状态，不能直接等同项目的总保留液体比例；泉州官方是大米、三层肉、豆干与海味的浥饭家族，不等于项目糯米、肉末、无海味版本；学生餐菜单能证明名称存在，但不能证明地域传统；大溪店家荷叶油饭历史存在，不等于项目配方已经获证。',
    '',
    '## 1. 两个地域节点与真实覆盖',
    '',
    '| 节点 | 生产映射 | 候选映射 | 本轮线索 | 地图研究问题 | 缺口 |',
    '| --- | --- | --- | ---: | --- | --- |',
    ...gaps.map(item => row([`${item.province_name}（${item.province_code}）`, list(item.production_recipe_ids), list(item.candidate_ids), item.lead_count, item.research_question, item.research_gap])),
    '',
    '畲族乌饭保留为跨闽浙等地的跨地域生产映射，不把它虚算成福建或台湾单省覆盖。',
    '',
    '## 2. 六道现有生产菜谱逐条审计',
    '',
    '| 菜谱 | 映射 | atlas 家族 | claim 结论 | 禁止主张 | 允许去向 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...audits.map(item => row([
      `${item.recipe_name}（${item.recipe_id}，${item.recipe_status}）`, `${item.mapping_scope} / ${item.province_code || '跨地域'}`,
      item.atlas_primary_family_id, claimSummary(item.claims), list(item.forbidden_claims), list(item.product_destinations),
    ])),
    '',
    '## 3. 三条新增研究线索',
    '',
    '| 线索 | 家族/餐型 | 关键形态 | claim 结论 | 禁止捷径 | 去向 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...leads.map(item => row([
      `${item.name}（${item.lead_id}，${item.province_code}）`, `${item.family_id} / ${item.meal_structure}`,
      list(item.ingredient_shapes), claimSummary(item.claims), list(item.forbidden_shortcuts), list(item.product_destinations),
    ])),
    '',
    '## 4. 七种不能混写的家族',
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
    '| 形态 | 线索 | 省份 | 家族 |',
    '| --- | --- | --- | --- |',
    ...shapes.map(item => row([item.shape, list(item.lead_ids), list(item.province_codes), list(item.family_ids)])),
    '',
    '## 6. 固定来源证据包',
    '',
    '| 来源 | 等级 | 直接证明 | 不证明 |',
    '| --- | --- | --- | --- |',
    ...sources.map(item => row([
      `[${item.title}](${item.url})（${item.publisher}，${item.published_at || item.date_note}）`,
      item.source_grade, list(item.proves), list(item.does_not_prove),
    ])),
    '',
    '## 7. 家庭适配与安全边界',
    '',
    '安全来源只支持食材身份、熟透、过敏原提示、冷藏复热和防交叉污染等原则；本轮不编造项目克数、时长、中心温度或液体比例。',
    '',
    '| 边界 | 状态 | 说明 |',
    '| --- | --- | --- |',
    ...boundaries.map(item => row([item.boundary_id, item.evidence_status, item.notes])),
    ...safety.map(item => row([item.safety_id, item.evidence_status, `${item.endpoint_note}；控制：${list(item.required_controls)}`])),
    '',
    '## 8. 产品去向决策',
    '',
    '| 类型 | 对象 | 省份 | 状态 | 允许方向 | 未决边界 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...decisions.map(item => row([item.subject_type, item.subject_id, item.province_code || '跨地域', item.state, list(item.product_destinations), item.decision_reason])),
    '',
    '## 9. 12 条家庭食材旅程',
    '',
    '| ID | 节点 | 模式/意图 | 输入 | 允许家族 | 结构 | 研究结论 | 禁止主张 | 说明 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...journeys.map(item => row([
      item.journey_id, item.province_code, `${item.mode}/${item.intent}`, list(item.input_items), list(item.expected_family_ids),
      item.expected_structure, outcomeLabels[item.expected_outcome] || item.expected_outcome, list(item.forbidden_claims), item.reason,
    ])),
    '',
    '## 10. 完成状态',
    '',
    `当前为 \`${completion.status || 'research_in_progress'}\`，阻塞项：${list(completion.blockers)}。这些未完成前，不把研究线索称为已批准菜谱，也不把外部家族证据冒充项目精确配方。`,
    '',
  ].join('\n');
}

export function renderFujianTaiwanRiceNoodleJourneyReviewMarkdown(report) {
  const journeys = asArray(report?.household_journeys);
  return [
    '<!-- Generated file: review fields come from the research ledger; do not fabricate results here. -->',
    '',
    '# 闽台咸饭、油饭、炊饭与卤面：12 条家庭食材旅程人工评审表',
    '',
    '> 自动测试只校验证据和边界；是否符合家庭直觉、是否值得做、能否在家庭锅具完成，必须由人工记录。',
    '',
    '| ID | 节点 | 模式/意图 | 输入 | 预期结构 | 研究预期 | 人工状态 | 家族匹配 | 家庭可行性 | 身份保留 | 记录 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...journeys.map(item => {
      const review = item.human_review || {};
      return row([
        item.journey_id, item.province_code, `${item.mode}/${item.intent}`, list(item.input_items), item.expected_structure,
        outcomeLabels[item.expected_outcome] || item.expected_outcome,
        review.status === 'pending' ? '待人工评审' : review.status,
        review.family_fit || '', review.household_feasibility || '', review.identity_preserved || '', review.notes || '',
      ]);
    }),
    '',
  ].join('\n');
}

export function buildFujianTaiwanRiceNoodleResearchArtifacts(report) {
  return new Map([
    ['tools/generated/fujian-taiwan-rice-noodle-research.v1.json', renderFujianTaiwanRiceNoodleResearchJson(report)],
    ['docs/fujian-taiwan-rice-noodle-research.md', renderFujianTaiwanRiceNoodleResearchMarkdown(report)],
    ['docs/fujian-taiwan-rice-noodle-journey-review.md', renderFujianTaiwanRiceNoodleJourneyReviewMarkdown(report)],
  ]);
}
