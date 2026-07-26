const asArray = value => Array.isArray(value) ? value : [];
const list = value => asArray(value).length ? asArray(value).join('、') : '—';
const escapeCell = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');
const row = values => `| ${values.map(escapeCell).join(' | ')} |`;
const claimSummary = claims => Object.entries(claims || {}).map(([key, value]) => `${key}: ${value?.verdict || '—'}`).join('；');

export function renderJingjinjiJinmengOnePotResearchJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderJingjinjiJinmengOnePotResearchMarkdown(report) {
  const summary = report.summary || {};
  return [
    '<!-- Generated file: do not edit directly. -->', '',
    '# 京津冀—晋蒙菜粮同锅研究审计', '',
    '来源：固定地域地图、现有 72 道 recipe、24 条 regional research ledger 与 `tools/data/jingjinji-jinmeng-one-pot-research.v1.json`。',
    '由 `node tools/build-jingjinji-jinmeng-one-pot-research.mjs --write` 确定性生成。', '',
    '> **边界：这是研究覆盖层，不是生产菜谱。** 本轮只审计现有 3 道生产映射、4 条候选并补 4 条研究线索；不新增 recipe，不修改 Planner、template、taxonomy、Ratio DSL 或运行时代码。', '',
    '## 摘要与核心纠偏', '',
    `- 地域：${list(report.region_overview?.names)}（${list(report.region_overview?.province_codes)}）`,
    `- 生产审计：${summary.production_audit_count ?? 0}`, `- 候选审计：${summary.candidate_audit_count ?? 0}`, `- 新研究线索：${summary.concrete_research_lead_count ?? 0}`,
    `- 来源：${summary.source_count ?? 0}（A ${summary.source_count_by_grade?.A ?? 0}，B ${summary.source_count_by_grade?.B ?? 0}）`,
    `- 家庭旅程：${summary.household_journey_count ?? 0}（已人工评审 ${summary.human_journey_reviewed_count ?? 0}）`,
    `- 当前状态：${report.completion?.status}`, `- 阻塞项：${list(report.completion?.blockers)}`, '',
    '核心纠偏：熟饼丝不能按生面条处理；粘卷子的生面卷也不是现成面条；天津贴饽饽与蒸卷子仍不能自动视为同一形态或已证明同锅。焖面证据明确跨华北存在，因此不能包装成任何单省独占。', '',
    '## 1. 五个节点的真实覆盖', '',
    '| 节点 | 生产映射 | 研究线索 | 地图问题 | 缺口 |', '| --- | --- | ---: | --- | --- |',
    ...report.province_gap_audits.map(item => row([`${item.province_name}（${item.province_code}）`, list(item.production_recipe_ids), item.lead_count, item.research_question, item.research_gap])), '',
    '## 2. 现有生产与候选审计', '',
    '| 类型 | 对象 | 家族 | claim | 禁止主张 |', '| --- | --- | --- | --- | --- |',
    ...report.production_recipe_audits.map(item => row(['生产', `${item.recipe_name}（${item.recipe_id}）`, item.atlas_primary_family_id, claimSummary(item.claims), list(item.forbidden_claims)])),
    ...report.candidate_audits.map(item => row(['候选', `${item.candidate_name}（${item.candidate_id}）`, item.atlas_primary_family_id, claimSummary(item.claims), list(item.forbidden_claims)])), '',
    '## 3. 四条研究线索与主食形态', '',
    '| 线索 | 地域 | 餐型 | 主食/食材形态 | claim | 禁止捷径 |', '| --- | --- | --- | --- | --- | --- |',
    ...report.concrete_research_leads.map(item => row([`${item.name}（${item.lead_id}）`, item.province_code, item.meal_structure, list(item.ingredient_shapes), claimSummary(item.claims), list(item.forbidden_shortcuts)])), '',
    '## 4. 六种不可混写的家族', '',
    '| 家族 | 结构 | 证据状态 |', '| --- | --- | --- |',
    ...report.family_model.map(item => row([`${item.name}（${item.family_id}）`, item.meal_structure, item.evidence_status])), '',
    '## 5. Claim 与形态矩阵', '',
    '| 对象 | claim | 结论 | 来源 | 理由 |', '| --- | --- | --- | --- | --- |',
    ...report.claim_matrix.map(item => row([`${item.subject_type}:${item.subject_id}`, item.claim_id, item.verdict, list(item.evidence_source_ids), item.reason])), '',
    '| 形态 | 关联对象 |', '| --- | --- |', ...report.ingredient_shape_matrix.map(item => row([item.shape, list(item.subject_ids)])), '',
    '## 6. 固定来源证据包', '',
    '| 来源 | 等级 | 直接证明 | 不证明 |', '| --- | --- | --- | --- |',
    ...report.source_evidence.map(item => row([`[${item.title}](${item.url})（${item.publisher}，${item.published_at || item.date_note}）`, item.source_grade, list(item.proves), list(item.does_not_prove)])), '',
    '## 7. 适配与安全边界', '',
    '所有地方来源只提供身份和高层技法证据；豆角、肉类、鱼类安全采用国家原则，但不由此发明统一分钟、温度、克数或液体量。', '',
    '| 边界 | 状态 | 说明 |', '| --- | --- | --- |',
    ...report.adaptation_boundaries.map(item => row([item.boundary_id, item.evidence_status, item.notes])),
    ...report.safety_boundaries.map(item => row([item.safety_id, item.evidence_status, `${item.endpoint_note}；控制：${list(item.required_controls)}`])), '',
    '## 8. 产品去向', '',
    '| 类型 | 对象 | 状态 | 允许去向 | 未决边界 |', '| --- | --- | --- | --- | --- |',
    ...report.product_decisions.map(item => row([item.subject_type, item.subject_id, item.state, list(item.product_destinations), item.decision_reason])), '',
    '## 9. 15 条家庭食材旅程', '',
    '| ID | 节点 | 模式/意图 | 输入 | 允许家族 | 预期结构 | 研究结论 | 禁止主张 |', '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...report.household_journeys.map(item => row([item.journey_id, item.province_code, `${item.mode}/${item.intent}`, list(item.input_items), list(item.expected_family_ids), item.expected_structure, item.expected_outcome, list(item.forbidden_claims)])), '',
    '## 10. 完成状态', '',
    `当前为 \`${report.completion?.status}\`，阻塞项：${list(report.completion?.blockers)}。完成来源与人工旅程前，不把任何研究线索称为已批准菜谱。`, '',
  ].join('\n');
}

export function renderJingjinjiJinmengOnePotJourneyReviewMarkdown(report) {
  return [
    '<!-- Generated file: review fields come from the research ledger; do not fabricate results here. -->', '',
    '# 京津冀—晋蒙菜粮同锅：15 条家庭食材旅程人工评审表', '',
    '> 自动测试只校验证据边界；家庭是否觉得自然、是否愿意做，必须人工记录。', '',
    '| ID | 节点 | 模式/意图 | 输入 | 预期结构 | 人工状态 | 家族匹配 | 家庭可行性 | 身份保留 | 记录 |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...report.household_journeys.map(item => row([item.journey_id, item.province_code, `${item.mode}/${item.intent}`, list(item.input_items), item.expected_structure, item.human_review?.status === 'pending' ? '待人工评审' : item.human_review?.status, item.human_review?.family_fit || '', item.human_review?.household_feasibility || '', item.human_review?.identity_preserved || '', item.human_review?.notes || ''])), '',
  ].join('\n');
}

export function buildJingjinjiJinmengOnePotResearchArtifacts(report) {
  return new Map([
    ['tools/generated/jingjinji-jinmeng-one-pot-research.v1.json', renderJingjinjiJinmengOnePotResearchJson(report)],
    ['docs/jingjinji-jinmeng-one-pot-research.md', renderJingjinjiJinmengOnePotResearchMarkdown(report)],
    ['docs/jingjinji-jinmeng-one-pot-journey-review.md', renderJingjinjiJinmengOnePotJourneyReviewMarkdown(report)],
  ]);
}
