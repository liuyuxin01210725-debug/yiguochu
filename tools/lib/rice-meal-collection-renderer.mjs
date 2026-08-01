const asArray = value => Array.isArray(value) ? value : [];
const stableTextSort = (left, right) => String(left).localeCompare(String(right), 'en');
const markdownCell = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');
const csvCell = value => {
  const text = String(value ?? '');
  return /[",\n\r]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const tableRow = values => `| ${values.map(markdownCell).join(' | ')} |`;
const candidateEvidence = candidate => [...new Set(asArray(candidate.identity_sources).flatMap(source => asArray(source?.supports)))];
const candidateBlockers = candidate => asArray(candidate.blockers).join('；') || '无';
const regionLabel = region => `${region.display_name}（${region.region_id}）`;

function candidatesForRegion(collection, region) {
  const byId = new Map(asArray(collection.candidates).map(candidate => [candidate.candidate_id, candidate]));
  return asArray(region.candidate_ids)
    .map(candidateId => byId.get(candidateId))
    .filter(Boolean)
    .sort((left, right) => stableTextSort(left.family, right.family) || stableTextSort(left.candidate_id, right.candidate_id));
}

export function renderRiceMealCollectionMarkdown(collection) {
  const lines = [
    '<!-- Generated file: do not edit directly. -->',
    '',
    '# 全国咸味菜饭/焖饭：菜单与食材构成审阅表',
    '',
    `范围：${collection.scope}`,
    '',
    '由 `node tools/build-rice-meal-collection.mjs --write` 从 `tools/data/rice-meal-collection.v1.json` 确定性生成。此表用于研究与运行边界审阅，不代表菜谱已人工批准或生产部署。',
    '',
  ];
  for (const region of asArray(collection.region_nodes)) {
    lines.push(`## ${regionLabel(region)}`, '');
    const candidates = candidatesForRegion(collection, region);
    if (candidates.length === 0) {
      lines.push(`显式空白地域：${region.gap}`, '');
      continue;
    }
    const families = new Map();
    for (const candidate of candidates) {
      if (!families.has(candidate.family)) families.set(candidate.family, []);
      families.get(candidate.family).push(candidate);
    }
    for (const [family, familyCandidates] of families) {
      lines.push(`### ${family}`, '');
      lines.push('| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |');
      lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
      for (const candidate of familyCandidates) {
        lines.push(tableRow([
          candidate.name,
          asArray(candidate.core_ingredients).join('、'),
          candidate.nutrition_grade,
          candidate.rice_state,
          candidate.traditional_appliance_and_steps,
          candidateEvidence(candidate).join('、'),
          candidate.quantity_liquid_completeness,
          candidateBlockers(candidate),
          candidate.status,
        ]));
      }
      lines.push('');
    }
  }
  return lines.join('\n');
}

export function renderRiceMealCollectionCsv(collection) {
  const regions = new Map(asArray(collection.region_nodes).map(region => [region.region_id, region]));
  const regionOrder = new Map(asArray(collection.region_nodes).map((region, index) => [region.region_id, index]));
  const rows = [[
    'candidate_id', 'name', 'regions', 'family', 'core_ingredients', 'nutrition_grade', 'rice_state',
    'traditional_appliance_and_steps', 'evidence_status', 'quantity_liquid_completeness', 'blockers', 'runtime_status',
  ]];
  const candidates = [...asArray(collection.candidates)].sort((left, right) => {
    const leftRegion = Math.min(...asArray(left.region_codes).map(code => regionOrder.get(code) ?? Number.MAX_SAFE_INTEGER));
    const rightRegion = Math.min(...asArray(right.region_codes).map(code => regionOrder.get(code) ?? Number.MAX_SAFE_INTEGER));
    return leftRegion - rightRegion || stableTextSort(left.family, right.family) || stableTextSort(left.candidate_id, right.candidate_id);
  });
  for (const candidate of candidates) {
    rows.push([
      candidate.candidate_id,
      candidate.name,
      asArray(candidate.region_codes).map(code => `${regions.get(code)?.display_name || code} (${code})`).join(' / '),
      candidate.family,
      asArray(candidate.core_ingredients).join(' / '),
      candidate.nutrition_grade,
      candidate.rice_state,
      candidate.traditional_appliance_and_steps,
      candidateEvidence(candidate).join(' / '),
      candidate.quantity_liquid_completeness,
      candidateBlockers(candidate),
      candidate.status,
    ]);
  }
  return `${rows.map(row => row.map(csvCell).join(',')).join('\n')}\n`;
}

export function buildRiceMealCollectionArtifacts(collection) {
  return [
    ['docs/rice-meal-collection.md', renderRiceMealCollectionMarkdown(collection)],
    ['docs/rice-meal-collection.csv', renderRiceMealCollectionCsv(collection)],
  ];
}
