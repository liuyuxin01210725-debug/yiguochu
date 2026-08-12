const asArray = value => Array.isArray(value) ? value : [];
const text = value => String(value ?? '');
const list = value => asArray(value).join('、') || '无';
const cell = value => text(value).replaceAll('|', '\\|').replaceAll('\n', '<br>');
const row = values => `| ${values.map(cell).join(' | ')} |`;

const verdictLabel = {
  supported: '有直接证据',
  not_proven: '未证明',
  contradicted: '有直接反证',
};

const outcomeLabel = {
  supported_family_route: '家族路径有据',
  needs_more_evidence: '需要更多证据',
  unsupported_for_family: '不适合本家族',
};

export function renderNortheastStewResearchJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderNortheastStewResearchMarkdown(report) {
  const summary = report?.summary || {};
  const overview = report?.region_overview || {};
  const prototypes = asArray(report?.prototype_candidates);
  const variants = asArray(report?.variant_relationships);
  const ingredients = asArray(report?.ingredient_coverage_matrix);
  const sources = asArray(report?.source_evidence_pack);
  const boundaries = asArray(report?.home_adaptation_boundaries);
  const decisions = asArray(report?.product_destination_decisions);
  const machineRules = asArray(report?.machine_rule_readiness);
  const calibrations = asArray(report?.calibration_readiness);
  const capabilityJourneys = asArray(report?.capability_journey_cases);
  const completion = report?.completion_status || {};
  const lines = [
    '<!-- Generated file: do not edit directly. -->',
    '',
    '# 东北铁锅炖与锅边主食研究审计',
    '',
    '来源：`tools/data/northeast-stew-research.v1.json`、全国地域地图与地域研究账本。',
    '由 `node tools/build-northeast-stew-research.mjs --write` 确定性生成。',
    '',
    '> **边界：这是研究资料，不是生产菜谱批准。** 本页记录 M1 的证据与校准准备。结构依据不等于数值比例依据；两条机器规则仍被阻塞，真实 Planner 不会选择该模板。',
    '',
    '## 摘要',
    '',
    `- 地域：${overview.name || '东北'}（${list(overview.province_codes)}）`,
    `- 研究家族：${overview.family_id || ''}`,
    `- 原型候选：${summary.prototype_count ?? 0}`,
    `- 固定来源：${summary.source_count ?? 0}（A 级 ${summary.source_count_by_grade?.A ?? 0}，B 级 ${summary.source_count_by_grade?.B ?? 0}）`,
    `- 家庭旅程：${summary.journey_count ?? 0}（已人工评审 ${summary.journey_reviewed_count ?? 0}）`,
    `- 机器规则候选：${summary.machine_rule_candidate_count ?? 0}（active ${summary.machine_rule_active_count ?? 0}）`,
    `- 厨房校准：${summary.calibration_case_count ?? 0}（passed ${summary.calibration_passed_count ?? 0}）`,
    `- 能力契约旅程：${summary.capability_journey_count ?? 0}（M1 均未激活）`,
    `- 当前状态：${completion.status || 'research_in_progress'}`,
    `- 阻塞项：${list(completion.blocking_gaps)}`,
    `- 生产菜谱变更：${summary.production_recipe_changes ?? 0}`,
    `- 生产 Ratio DSL 变更：${summary.production_ratio_rule_changes ?? 0}`,
    `- 运行时模板变更：${summary.runtime_template_changes ?? 0}`,
    '',
    '关键证据边界：鸡肉、蘑菇、土豆、玉米面饼四项固定组合仍未证明；粘卷子已由北京平谷资料核实，但东北关联仍未核实，不能据此判断东北存在或不存在。',
    '',
    '## 1. 地域与家族概览',
    '',
    '| 省级节点 | 研究问题 |',
    '| --- | --- |',
    ...asArray(overview.provinces).map(item => row([`${item.name}（${item.atlas_code}）`, item.research_question])),
    '',
    '## 2. 四条原型候选',
    '',
    '| 原型 | 状态 | 东北身份 | 固定组合 | 产品去向 | 决策理由 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...prototypes.map(item => row([
      `${item.prototype_name}（${item.atlas_id}）`,
      item.research_state,
      verdictLabel[item.northeast_identity_status] || item.northeast_identity_status,
      verdictLabel[item.exact_combination_status] || item.exact_combination_status,
      list(item.product_destinations),
      item.decision_reason,
    ])),
    '',
    '## 3. 变体关系',
    '',
    '| 原型 | 家族锚点 | 固定组合状态 | 说明 |',
    '| --- | --- | --- | --- |',
    ...variants.map(item => row([item.atlas_id, item.family_anchor, item.exact_combination_status, item.notes])),
    '',
    '## 4. 食材覆盖矩阵',
    '',
    '| 食材或槽位 | 原型 | 角色 | 证据状态 |',
    '| --- | --- | --- | --- |',
    ...ingredients.map(item => row([item.item, list(item.prototype_ids), list(item.roles), list(item.evidence_statuses)])),
    '',
    '## 5. 固定来源证据包',
    '',
    '| 来源 | 等级 | 直接证明 | 不证明 |',
    '| --- | --- | --- | --- |',
    ...sources.map(item => row([
      `[${item.title}](${item.url})（${item.publisher}，${item.published_at}）`,
      item.source_grade,
      list(item.proves),
      list(item.does_not_prove),
    ])),
    '',
    '## 6. 家庭适配边界',
    '',
    '比例、克数、时间和安全终点在取得可执行证据前保持 `unresearched`，不交给模型猜。',
    '',
    '| 对象 | 边界类型 | 状态 | 说明 |',
    '| --- | --- | --- | --- |',
    ...boundaries.map(item => row([item.subject, item.boundary_type, item.evidence_status, item.explanation])),
    '',
    '## 7. 产品去向决策',
    '',
    '| 原型 | 状态 | 允许沉淀方向 | 总分 | 决策理由 |',
    '| --- | --- | --- | ---: | --- |',
    ...decisions.map(item => row([
      item.atlas_id, item.research_state, list(item.product_destinations), item.priority?.total_score ?? '', item.decision_reason,
    ])),
    '',
    '## 8. 机器规则候选（仍被阻塞）',
    '',
    '现有来源只支持家族结构。`supporting_source_ids` 不是克数、含水或时间的依据；生产 Ratio DSL 没有接入这些候选。',
    '',
    '| 规则 | 类型 | 激活状态 | 结构来源 | 数值依据 | 校准状态 | 阻塞原因 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...machineRules.map(item => row([
      item.rule_id,
      item.rule_kind,
      item.activation_status,
      list(item.supporting_source_ids),
      item.evidence_status === 'evidence_ready' ? list(item.numeric_evidence_source_ids) : '缺失',
      item.calibration_status,
      list(item.blocker_codes),
    ])),
    '',
    '## 9. 2/3/4 人份厨房校准',
    '',
    '下表是待真人执行的空记录。自动测试不得填写操作者、克数、水量、时间或验收结论。',
    '',
    '| 份数 | 状态 | 操作者 | 玉米面形态/玉米面品牌 | 和面水温 | 混粉 | 发酵 | 锅径/深/盖 | 贴饼时液位 | 测量值 | 验收结果 |',
    '| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...calibrations.map(item => row([
      `${item.servings} 人份`,
      item.status === 'pending' ? '待校准' : item.status,
      item.operator || '未填写',
      [item.cornmeal_shape_or_cut, item.cornmeal_brand].filter(Boolean).join(' / ') || '未填写',
      item.preparation_water_temperature_c ?? '未填写',
      item.wheat_flour_added ?? '未填写',
      item.fermentation_used ?? '未填写',
      [item.equipment?.pot_diameter_cm, item.equipment?.pot_depth_cm, item.equipment?.lid_fit_confirmed].filter(value => value !== null && value !== undefined).join(' / ') || '未填写',
      item.stew_liquid_level_at_paste ?? '未填写',
      Object.values(item.measurements || {}).every(value => value === null) ? '全部留空' : '已记录',
      Object.values(item.acceptance_checks || {}).every(value => value === null) ? '全部留空' : '已记录',
    ])),
    '',
    '## 10. 能力契约旅程（M1 未激活）',
    '',
    '这些是 M2 获得单独批准后才运行的验收合同，不表示当前 Planner 已经输出相应计划。',
    '',
    '| 旅程 | 模式/意图/份数 | 输入 | M1 预期 | M2 目标 | 预期模板 | 断言 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...capabilityJourneys.map(item => row([
      item.journey_id,
      `${item.mode}/${item.intent}/${item.servings}`,
      list(item.raw_items),
      item.m1_runtime_expectation,
      item.m2_expected_outcome,
      item.expected_template_id || '无',
      list(item.assertion_codes),
    ])),
    '',
    '## 家庭旅程研究结论',
    '',
    '| 旅程 | 输入 | 预期使用 | 预期未规划 | 研究结论 | 说明 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...asArray(report?.journey_cases).map(item => row([
      item.journey_id, list(item.raw_items), list(item.expected_used_items), list(item.expected_unplanned_items),
      outcomeLabel[item.expected_research_outcome] || item.expected_research_outcome, item.explanation,
    ])),
    '',
  ];
  return lines.join('\n');
}

export function renderNortheastStewJourneyReviewMarkdown(report) {
  const journeys = asArray(report?.journey_cases);
  const capabilityJourneys = asArray(report?.capability_journey_cases);
  const lines = [
    '<!-- Generated file: review fields come from the assessment ledger; do not fabricate results here. -->',
    '',
    '# 东北铁锅炖家族：10 条家庭食材旅程人工评审表',
    '',
    '> 当前表只列出预期研究边界。自动测试不能代替真人厨房判断，`pending` 状态不会被自动填成结论。',
    '',
    '| ID | 模式/意图 | 输入 | 预期使用 | 预期未规划 | 研究预期 | 人工状态 | 家庭直觉 | 可操作性 | 味型判断 | 评审人 | 日期 | 记录与结论 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...journeys.map(item => {
      const review = item.human_review || {};
      const status = review.status === 'pending' ? '待人工评审' : review.status;
      return row([
        item.journey_id,
        `${item.mode}/${item.intent}`,
        list(item.raw_items),
        list(item.expected_used_items),
        list(item.expected_unplanned_items),
        outcomeLabel[item.expected_research_outcome] || item.expected_research_outcome,
        status,
        review.household_intuition || '',
        review.operability || '',
        review.taste_judgement || '',
        review.reviewer || '',
        review.reviewed_at || '',
        [review.notes, review.conclusion].filter(Boolean).join('；'),
      ]);
    }),
    '',
    '## 能力契约旅程（M1 未激活）',
    '',
    '> 下列 22 条是未来 M2 的契约验收表；当前统一预期 `template_not_runtime_eligible`，不冒充已经跑通的真人厨房旅程。',
    '',
    '| ID | 模式/意图/份数 | 输入 | M1 预期 | M2 预期 | 预期使用 | 预期未规划 | 原因码 | 断言 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...capabilityJourneys.map(item => row([
      item.journey_id,
      `${item.mode}/${item.intent}/${item.servings}`,
      list(item.raw_items),
      item.m1_runtime_expectation,
      item.m2_expected_outcome,
      list(item.expected_used_items),
      list(item.expected_unplanned_items),
      item.expected_reason_code || '无',
      list(item.assertion_codes),
    ])),
    '',
  ];
  return lines.join('\n');
}

export function buildNortheastStewResearchArtifacts(report) {
  return new Map([
    ['tools/generated/northeast-stew-research.v1.json', renderNortheastStewResearchJson(report)],
    ['docs/northeast-stew-research.md', renderNortheastStewResearchMarkdown(report)],
    ['docs/northeast-stew-journey-review.md', renderNortheastStewJourneyReviewMarkdown(report)],
  ]);
}
