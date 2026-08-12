const asArray = value => Array.isArray(value) ? value : [];
const list = value => asArray(value).length ? asArray(value).join('、') : '—';
const escapeCell = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');
const row = values => `| ${values.map(escapeCell).join(' | ')} |`;

function claimSummary(claims) {
  return Object.entries(claims || {}).map(([key, value]) => `${key}: ${value?.verdict || '—'}`).join('；');
}

const outcomeLabels = {
  research_family_route: '可进入家族研究',
  manufacturing_step_missing: '缺少成品制造阶段',
  research_only_multistage: '仅多阶段研究',
  staple_sufficiency_unresolved: '主食充足性未解决',
  quick_conflict: '与快手意图冲突',
  ratio_unresolved: '比例未解决',
  regional_identity_missing: '缺少地域身份要素',
  generic_adaptation_only: '仅普通家庭适配',
  content_only_high_friction: '仅内容与高摩擦研究',
  requires_pretreatment: '需要预处理',
  boundary_only: '仅用于边界解释',
};

export function renderMiddleYangtzeMainMealResearchJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderMiddleYangtzeMainMealResearchMarkdown(report) {
  const overview = report?.region_overview || {};
  const summary = report?.summary || {};
  const completion = report?.completion || {};
  const gaps = asArray(report?.province_gap_audits);
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
    '# 长江中游（湖北、湖南、江西）家庭主餐结构研究审计',
    '',
    '来源：`tools/data/middle-yangtze-main-meal-research.v1.json`、现有 72 道 recipe、24 条 regional research ledger、全国地域地图与 regional mapping。',
    '由 `node tools/build-middle-yangtze-main-meal-research.mjs --write` 确定性生成。',
    '',
    '> **边界：这是研究覆盖层，不是生产菜谱。** 本轮不新增 recipe，不修改 Planner、template、taxonomy、Ratio DSL 或运行时代码。',
    '',
    '## 摘要与核心纠偏',
    '',
    `- 地域：${overview.name || '长江中游'}（${list(overview.province_codes)}）`,
    `- 省级空白审计：${summary.province_gap_count ?? 0}`,
    `- 当前生产映射：${summary.production_audit_count ?? 0}`,
    `- 当前候选映射：${summary.candidate_audit_count ?? 0}`,
    `- 具体研究线索：${summary.concrete_research_lead_count ?? 0}`,
    `- 来源：${summary.source_count ?? 0}（A 级 ${summary.source_count_by_grade?.A ?? 0}，B 级 ${summary.source_count_by_grade?.B ?? 0}）`,
    `- 家庭旅程：${summary.household_journey_count ?? 0}（已人工评审 ${summary.human_journey_reviewed_count ?? 0}）`,
    `- 当前状态：${completion.status || 'research_in_progress'}`,
    `- 阻塞项：${list(completion.blockers)}`,
    '',
    '关键纠偏：现成恩施豆皮、南昌米粉与南丰水粉不能从原米在同一顿饭中现场制造；社饭来源比例文字矛盾，禁止直接写入 Ratio DSL；瓦罐汤配米粉是两容器一顿饭；湿米粉若已产生米酵菌酸，加热不能消除。',
    '',
    '## 1. 三省真实空白',
    '',
    '| 省份 | 生产映射 | 候选映射 | 本轮线索 | 地图研究问题 | 空白说明 |',
    '| --- | --- | --- | ---: | --- | --- |',
    ...gaps.map(item => row([`${item.province_name}（${item.province_code}）`, list(item.production_recipe_ids), list(item.candidate_ids), item.lead_count, item.research_question, item.research_gap])),
    '',
    '## 2. 八种不能混写的食物家族',
    '',
    '| 家族 | 结构 | 证据状态 |',
    '| --- | --- | --- |',
    ...families.map(item => row([`${item.name}（${item.family_id}）`, item.meal_structure, item.evidence_status])),
    '',
    '## 3. 八条具体研究线索',
    '',
    '| 地域线索 | 家族/餐型 | 关键形态 | claim 结论 | 禁止捷径 | 去向 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...leads.map(item => row([
      `${item.name}（${item.lead_id}，${item.province_code}）`, `${item.family_id} / ${item.meal_structure}`,
      list(item.ingredient_shapes), claimSummary(item.claims), list(item.forbidden_shortcuts), list(item.product_destinations),
    ])),
    '',
    '## 4. 食材与加工形态矩阵',
    '',
    '| 形态 | 线索 | 省份 | 家族 |',
    '| --- | --- | --- | --- |',
    ...shapes.map(item => row([item.shape, list(item.lead_ids), list(item.province_codes), list(item.family_ids)])),
    '',
    '## 5. 固定来源证据包',
    '',
    '| 来源 | 等级 | 直接证明 | 不证明 |',
    '| --- | --- | --- | --- |',
    ...sources.map(item => row([`[${item.title}](${item.url})（${item.publisher}，${item.published_at}）`, item.source_grade, list(item.proves), list(item.does_not_prove)])),
    '',
    '## 6. 家庭适配与安全边界',
    '',
    '安全来源只支持来源、储存、丢弃、熟透和防交叉污染等原则；本轮不编造项目克数、时长或液体比例。',
    '',
    '| 边界 | 状态 | 说明 |',
    '| --- | --- | --- |',
    ...boundaries.map(item => row([item.boundary_id, item.evidence_status, item.notes])),
    ...safety.map(item => row([item.safety_id, item.evidence_status, `${item.endpoint_note}；控制：${list(item.required_controls)}`])),
    '',
    '## 7. 产品去向决策',
    '',
    '| 类型 | 对象 | 省份 | 状态 | 允许方向 | 未决问题 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...decisions.map(item => row([item.subject_type, item.subject_id, item.province_code, item.state, list(item.product_destinations), item.decision_reason])),
    '',
    '## 8. 15 条家庭食材旅程',
    '',
    '| ID | 省份 | 模式/意图 | 输入 | 允许家族 | 结构 | 研究结论 | 禁止主张 | 说明 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...journeys.map(item => row([
      item.journey_id, item.province_code, `${item.mode}/${item.intent}`, list(item.input_items), list(item.expected_family_ids),
      item.expected_structure, outcomeLabels[item.expected_outcome] || item.expected_outcome, list(item.forbidden_claims), item.reason,
    ])),
    '',
    '## 9. 完成状态',
    '',
    `当前为 \`${completion.status || 'research_in_progress'}\`，阻塞项：${list(completion.blockers)}。这些未完成前，不将研究线索称为已批准菜谱，也不进入运行时。`,
    '',
  ].join('\n');
}

export function renderMiddleYangtzeMainMealJourneyReviewMarkdown(report) {
  const journeys = asArray(report?.household_journeys);
  return [
    '<!-- Generated file: review fields come from the research ledger; do not fabricate results here. -->',
    '',
    '# 长江中游家庭主餐：15 条家庭食材旅程人工评审表',
    '',
    '> 自动测试只校验证据与边界；是否符合家庭直觉、是否值得做、能否在家庭锅具完成，必须由人工记录。',
    '',
    '| ID | 省份 | 模式/意图 | 输入 | 预期结构 | 研究预期 | 人工状态 | 家族匹配 | 家庭可行性 | 身份保留 | 记录 |',
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

export function buildMiddleYangtzeMainMealResearchArtifacts(report) {
  return new Map([
    ['tools/generated/middle-yangtze-main-meal-research.v1.json', renderMiddleYangtzeMainMealResearchJson(report)],
    ['docs/middle-yangtze-main-meal-research.md', renderMiddleYangtzeMainMealResearchMarkdown(report)],
    ['docs/middle-yangtze-main-meal-journey-review.md', renderMiddleYangtzeMainMealJourneyReviewMarkdown(report)],
  ]);
}
