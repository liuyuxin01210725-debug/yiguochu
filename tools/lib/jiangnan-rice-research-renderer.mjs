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
  research_lead_only: '仅研究线索',
};

function claimSummary(claims) {
  return Object.entries(claims || {}).map(([claimId, claim]) => (
    `${claimId}：${verdictLabel[claim?.verdict] || claim?.verdict || ''}（${claim?.reason || ''}）`
  )).join('<br>');
}

export function renderJiangnanRiceResearchJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderJiangnanRiceResearchMarkdown(report) {
  const summary = report?.summary || {};
  const overview = report?.region_overview || {};
  const audits = asArray(report?.recipe_audits);
  const variants = asArray(report?.variant_relationships);
  const ingredients = asArray(report?.ingredient_coverage_matrix);
  const sources = asArray(report?.source_evidence_pack);
  const boundaries = asArray(report?.home_adaptation_boundaries);
  const decisions = asArray(report?.product_destination_decisions);
  const leads = asArray(report?.province_research_leads);
  const completion = report?.completion_status || {};
  const lines = [
    '<!-- Generated file: do not edit directly. -->',
    '',
    '# 江南菜饭与锅巴饭研究审计',
    '',
    '来源：`tools/data/jiangnan-rice-research.v1.json`、现有 72 道 recipe、candidate ledger、全国地域地图与 regional mapping。',
    '由 `node tools/build-jiangnan-rice-research.mjs --write` 确定性生成。',
    '',
    '> **边界：这是研究资料，不是生产菜谱批准。** 本轮没有新增或修改生产 recipe、template、taxonomy、Ratio DSL 或运行时代码；地域事实有据也不等于生产克数、米水比、安全终点或家庭锅适配已经验证。',
    '',
    '## 摘要',
    '',
    `- 地域：${overview.name || '江南'}（${list(overview.province_codes)}）`,
    `- 现有生产条目审计：${summary.recipe_audit_count ?? 0}`,
    `- 固定来源：${summary.source_count ?? 0}（A 级 ${summary.source_count_by_grade?.A ?? 0}，B 级 ${summary.source_count_by_grade?.B ?? 0}）`,
    `- 安徽当前 0 道生产菜谱，${summary.research_lead_count ?? 0} 条研究线索`,
    `- 家庭旅程：${summary.journey_count ?? 0}（已人工评审 ${summary.journey_reviewed_count ?? 0}）`,
    `- 当前状态：${completion.status || 'research_in_progress'}`,
    `- 阻塞项：${list(completion.blocking_gaps)}`,
    `- 生产菜谱变更：${summary.production_recipe_changes ?? 0}`,
    '',
    '关键纠偏：南京资料使用糯米，生产版普通大米的传统等价性未证明；半山烧野米饭民俗有据，但生产版平菇核心组合未证明；畲族乌饭使用乌稔叶汁，食品级黑米色粉只是项目家庭适配。',
    '',
    '## 1. 四省框架',
    '',
    '| 省级节点 | 研究问题 | 生产条目 | 研究线索 |',
    '| --- | --- | ---: | ---: |',
    ...asArray(overview.provinces).map(item => row([
      `${item.name}（${item.atlas_code}）`, item.research_question,
      item.production_recipe_count, item.research_lead_count,
    ])),
    '',
    '## 2. 现有 8 道生产条目审计',
    '',
    '| 生产条目 | 生产核心食材 | 地域范围 | 审计状态 | claim 结论 | 产品去向 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...audits.map(item => row([
      `${item.recipe_name}（${item.recipe_id}）`,
      list(item.core_ingredients),
      item.province_codes.length ? list(item.province_codes) : item.regional_scope,
      item.audit_state,
      claimSummary(item.claims),
      list(item.product_destinations),
    ])),
    '',
    '## 3. 家族与变体关系',
    '',
    '| 条目 | 家族锚点 | 变体轴 | 边界说明 |',
    '| --- | --- | --- | --- |',
    ...variants.map(item => row([item.recipe_id, item.family_anchor, item.variant_axis, item.notes])),
    '',
    '## 4. 食材覆盖矩阵',
    '',
    '| 食材或形态 | 生产条目 | 角色 | 证据状态 |',
    '| --- | --- | --- | --- |',
    ...ingredients.map(item => row([item.item, list(item.recipe_ids), list(item.roles), list(item.evidence_statuses)])),
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
    '本轮不编造克数、时间、温度或安全终点；`unresearched` 项不能交给模型自由推断。',
    '',
    '| 对象 | 边界类型 | 状态 | 说明 |',
    '| --- | --- | --- | --- |',
    ...boundaries.map(item => row([item.subject, item.boundary_type, item.evidence_status, item.explanation])),
    '',
    '## 7. 安徽研究线索',
    '',
    '> 安徽两项都有官方地方事实，但仍是研究线索，不是新 recipe，也不是 Planner 已支持的方案。',
    '',
    '| 线索 | 已知结构 | 未决问题 | 状态 | 产品去向 |',
    '| --- | --- | --- | --- | --- |',
    ...leads.map(item => row([
      `${item.name}（${item.lead_id}）`, list(item.known_structure),
      list(item.open_questions), item.research_state, list(item.product_destinations),
    ])),
    '',
    '## 8. 产品去向决策',
    '',
    '| 类型 | 对象 | 状态 | 允许沉淀方向 | 总分 | 决策理由 |',
    '| --- | --- | --- | --- | ---: | --- |',
    ...decisions.map(item => row([
      item.subject_type, item.subject_id, item.state, list(item.product_destinations),
      item.priority?.total_score ?? '', item.decision_reason,
    ])),
    '',
    '## 9. 家庭旅程研究结论',
    '',
    '| 旅程 | 模式/意图 | 输入 | 预期使用 | 预期未规划 | 研究结论 | 说明 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...asArray(report?.journey_cases).map(item => row([
      item.journey_id, `${item.mode}/${item.intent}`, list(item.raw_items),
      list(item.expected_used_items), list(item.expected_unplanned_items),
      outcomeLabel[item.expected_research_outcome] || item.expected_research_outcome,
      item.explanation,
    ])),
    '',
  ];
  return lines.join('\n');
}

export function renderJiangnanRiceJourneyReviewMarkdown(report) {
  const journeys = asArray(report?.journey_cases);
  const lines = [
    '<!-- Generated file: review fields come from the assessment ledger; do not fabricate results here. -->',
    '',
    '# 江南菜饭家族：12 条家庭食材旅程人工评审表',
    '',
    '> 当前表只列预期研究边界。自动测试不能代替真人厨房判断，`pending` 不会被自动填成通过。',
    '',
    '| ID | 模式/意图 | 输入 | 预期使用 | 预期未规划 | 研究预期 | 人工状态 | 家庭直觉 | 可操作性 | 味型判断 | 评审人 | 日期 | 记录与结论 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...journeys.map(item => {
      const review = item.human_review || {};
      return row([
        item.journey_id,
        `${item.mode}/${item.intent}`,
        list(item.raw_items),
        list(item.expected_used_items),
        list(item.expected_unplanned_items),
        outcomeLabel[item.expected_research_outcome] || item.expected_research_outcome,
        review.status === 'pending' ? '待人工评审' : review.status,
        review.household_intuition || '',
        review.operability || '',
        review.taste_judgement || '',
        review.reviewer || '',
        review.reviewed_at || '',
        [review.notes, review.conclusion].filter(Boolean).join('；'),
      ]);
    }),
    '',
  ];
  return lines.join('\n');
}

export function buildJiangnanRiceResearchArtifacts(report) {
  return new Map([
    ['tools/generated/jiangnan-rice-research.v1.json', renderJiangnanRiceResearchJson(report)],
    ['docs/jiangnan-rice-research.md', renderJiangnanRiceResearchMarkdown(report)],
    ['docs/jiangnan-rice-journey-review.md', renderJiangnanRiceJourneyReviewMarkdown(report)],
  ]);
}
