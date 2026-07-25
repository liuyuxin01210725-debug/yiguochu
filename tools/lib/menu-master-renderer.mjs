const CSV_COLUMNS = [
  'library_index', 'id', 'name', 'status', 'cuisine', 'family_id', 'form',
  'staples', 'core_ingredients', 'optional_ingredients',
  'generation_optional_ingredients', 'liquid_ingredients',
  'substitution_slots', 'discouraged', 'technique', 'ratio_rules',
  'safety_rules', 'total_time_minutes', 'purposes', 'source_count',
  'static_status', 'verification_status', 'missing_fields',
];

const list = value => (value || []).join('｜');
const structuredList = value => (value || []).map(item => JSON.stringify(item)).join('｜');
const markdownCell = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function markdownList(items) {
  return items?.length ? items.map(item => `- ${typeof item === 'string' ? item : JSON.stringify(item)}`).join('\n') : '- 无';
}

function markdownSourceLinks(refs) {
  if (!refs?.length) return '- 无';
  return refs.map(ref => ref.url ? `- [${ref.title || ref.url}](${ref.url})${ref.license ? `（${ref.license}）` : ''}` : `- ${ref.title || JSON.stringify(ref)}`).join('\n');
}

export function renderMenuMasterJson(master) {
  return `${JSON.stringify(master, null, 2)}\n`;
}

export function renderMenuMasterMarkdown(master) {
  const summary = master.summary || {};
  const menus = master.production_menus || [];
  const research = master.research_candidates || [];
  const pending = menus.filter(menu => menu.audit?.verification_status === 'pending').length;
  const lines = [
    '<!-- Generated file: do not edit directly. -->',
    '',
    '# 菜单主表',
    '',
    '来源：`tools/data/recipe-library.json`、`tools/data/ingredient-taxonomy.v1.json`、`tools/data/regional-menu-research.v1.json`、`tools/data/menu-verification-cases.v1.json`。',
    '由 `node tools/build-menu-master.mjs --write` 生成。',
    '',
    `生产菜单：${summary.production_count || 0}（approved：${summary.approved_count || 0}；auto_approved：${summary.auto_approved_count || 0}）`,
    `区域研究候选：${summary.research_count || 0}（仅研究，非生产菜单）`,
    `验证状态：${pending}/${menus.length} 个当前菜单待验证。`,
    '',
    '## 生产菜单总览',
    '',
    '| 序号 | 菜名 | 菜系 | 形态 | 主食 | 核心食材 | 可选食材 | 时间（分钟） | 状态 | 验证状态 |',
    '| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | --- |',
    ...menus.map(menu => [
      menu.library_index, menu.name, menu.identity?.cuisine, menu.identity?.form,
      list(menu.ingredients?.staples), list(menu.ingredients?.core), list(menu.ingredients?.optional),
      menu.execution?.total_time_minutes, menu.status, menu.audit?.verification_status,
    ].map(markdownCell).join(' | ').replace(/^/, '| ').replace(/$/, ' |')),
    '',
    '## 生产菜单详情',
  ];

  for (const menu of menus) {
    lines.push(
      '', `### ${menu.library_index}. ${menu.name}`, '',
      `- ID：\`${menu.id}\``,
      `- 状态：${menu.status}；静态检查：${menu.audit?.static_status || ''}；验证：${menu.audit?.verification_status || ''}`,
      `- 菜系/家族/形态：${menu.identity?.cuisine || ''} / \`${menu.identity?.family_id || ''}\` / ${menu.identity?.form || ''}`,
      `- 概要：${menu.identity?.summary || '无'}`,
      `- 改造说明：${menu.identity?.adaptation_note || '无'}`,
      '', '#### 食材边界', '',
      `- 主食：${list(menu.ingredients?.staples) || '无'}`,
      `- 核心：${list(menu.ingredients?.core) || '无'}`,
      `- 可选：${list(menu.ingredients?.optional) || '无'}`,
      `- 生成可选：${list(menu.ingredients?.generation_optional) || '无'}`,
      `- 液体：${list(menu.ingredients?.liquids) || '无'}`,
      '- 替换槽：', markdownList(menu.ingredients?.substitutions),
      '- 不建议规则：', markdownList(menu.ingredients?.discouraged),
      '', '#### 执行与安全', '',
      `- 总时长：${menu.execution?.total_time_minutes ?? ''} 分钟`,
      `- 目的：${list(menu.execution?.purposes) || '无'}`,
      '- 技法：', markdownList(menu.execution?.technique),
      '- 比例规则：', markdownList(menu.execution?.ratio_rules),
      '- 安全规则：', markdownList(menu.execution?.safety_rules),
      '', `#### 来源（${menu.evidence?.source_count || 0}）`, '', markdownSourceLinks(menu.evidence?.source_refs),
    );
  }

  lines.push('', '## 区域研究候选（非生产）', '', '| 区域 | 原型 | 家族 | 食材假设 | 改造假设 | 研究问题 | 状态 |', '| --- | --- | --- | --- | --- | --- | --- |');
  lines.push(...research.map(entry => [
    entry.region_group, entry.prototype_name, entry.family_id, list(entry.ingredient_hypothesis),
    entry.adaptation_hypothesis, list(entry.research_questions), entry.status,
  ].map(markdownCell).join(' | ').replace(/^/, '| ').replace(/$/, ' |')));
  lines.push('', '## 验证汇总', '', `当前验证账本包含 ${summary.verification_case_count || 0} 个案例；${pending}/${menus.length} 个生产菜单均为 pending，待加入正反例验证。`, '');
  return lines.join('\n');
}

export function renderMenuMasterCsv(master) {
  const rows = (master.production_menus || []).map(menu => ({
    library_index: menu.library_index,
    id: menu.id,
    name: menu.name,
    status: menu.status,
    cuisine: menu.identity?.cuisine,
    family_id: menu.identity?.family_id,
    form: menu.identity?.form,
    staples: list(menu.ingredients?.staples),
    core_ingredients: list(menu.ingredients?.core),
    optional_ingredients: list(menu.ingredients?.optional),
    generation_optional_ingredients: list(menu.ingredients?.generation_optional),
    liquid_ingredients: list(menu.ingredients?.liquids),
    substitution_slots: structuredList(menu.ingredients?.substitutions),
    discouraged: structuredList(menu.ingredients?.discouraged),
    technique: list(menu.execution?.technique),
    ratio_rules: list(menu.execution?.ratio_rules),
    safety_rules: list(menu.execution?.safety_rules),
    total_time_minutes: menu.execution?.total_time_minutes,
    purposes: list(menu.execution?.purposes),
    source_count: menu.evidence?.source_count,
    static_status: menu.audit?.static_status,
    verification_status: menu.audit?.verification_status,
    missing_fields: list(menu.audit?.missing_fields),
  }));
  return `${[CSV_COLUMNS.join(','), ...rows.map(row => CSV_COLUMNS.map(column => csvCell(row[column])).join(','))].join('\r\n')}\r\n`;
}

export function buildMenuMasterArtifacts(inputs) {
  const master = inputs.master || inputs;
  return new Map([
    ['tools/generated/menu-master.v1.json', renderMenuMasterJson(master)],
    ['docs/menu-master.md', renderMenuMasterMarkdown(master)],
    ['docs/menu-master.csv', renderMenuMasterCsv(master)],
  ]);
}
