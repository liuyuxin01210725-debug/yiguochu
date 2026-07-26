import { createHash } from 'node:crypto';

const PROVINCES = new Set(['CN-QH', 'CN-XZ']);
const PRODUCTION = new Set(['qinghai-hao-fan', 'tibetan-savory-congee', 'tibetan-gutu', 'tibetan-ginseng-fruit-rice']);
const LEADS = new Set(['qinghai-ga-mianpian-broth', 'qinghai-barley-wheatberry-meat-soup', 'tibetan-patu-one-pot', 'tibetan-tuba-barley-thick-bowl', 'lhasa-tibetan-noodle-breakfast']);
const FAMILIES = new Set(['qinghai-grain-porridge-main-bowl', 'qinghai-noodle-piece-broth-main-bowl', 'qinghai-barley-wheatberry-meat-soup', 'tibetan-patu-one-pot-main-bowl', 'tibetan-tuba-barley-thick-main-bowl', 'lhasa-noodle-breakfast-main-bowl']);
const BOUNDARIES = new Set(['qinghai-hao-fan-not-traditional-replica', 'tibetan-savory-congee-not-traditional-replica', 'tibetan-gutu-not-traditional-replica', 'tibetan-ginseng-fruit-rice-not-traditional-replica', 'ga-mianpian-not-production-recipe', 'barley-wheatberry-meat-soup-not-free-grain-slot', 'patu-not-free-noodle-equivalence', 'tuba-manual-thickening-not-unattended-appliance', 'lhasa-noodle-breakfast-not-single-pot-proven']);
const PRODUCTION_PROVINCES = { 'qinghai-hao-fan': 'CN-QH', 'tibetan-savory-congee': 'CN-XZ', 'tibetan-gutu': 'CN-XZ', 'tibetan-ginseng-fruit-rice': 'CN-XZ' };
const LEAD_PROVINCES = { 'qinghai-ga-mianpian-broth': 'CN-QH', 'qinghai-barley-wheatberry-meat-soup': 'CN-QH', 'tibetan-patu-one-pot': 'CN-XZ', 'tibetan-tuba-barley-thick-bowl': 'CN-XZ', 'lhasa-tibetan-noodle-breakfast': 'CN-XZ' };
const AUDIT_STATES = { 'qinghai-hao-fan': 'needs_more_evidence', 'tibetan-savory-congee': 'needs_manual_review', 'tibetan-gutu': 'needs_more_evidence', 'tibetan-ginseng-fruit-rice': 'needs_manual_review' };
const CLAIM_VERDICTS = {
  'production:qinghai-hao-fan:regional_name_context': 'supported', 'production:qinghai-hao-fan:traditional_recipe_equivalence': 'not_proven',
  'production:tibetan-savory-congee:barley_grain_porridge_context': 'supported', 'production:tibetan-savory-congee:traditional_recipe_equivalence': 'not_proven',
  'production:tibetan-gutu:tibetan_noodle_meal_context': 'supported', 'production:tibetan-gutu:traditional_recipe_equivalence': 'not_proven',
  'production:tibetan-ginseng-fruit-rice:barley_region_context': 'supported', 'production:tibetan-ginseng-fruit-rice:traditional_recipe_equivalence': 'not_proven',
  'lead:qinghai-ga-mianpian-broth:qinghai_household_noodle_identity': 'supported', 'lead:qinghai-ga-mianpian-broth:project_single_pot_equivalence': 'not_proven',
  'lead:qinghai-barley-wheatberry-meat-soup:barley_wheatberry_meat_long_simmer_structure': 'supported', 'lead:qinghai-barley-wheatberry-meat-soup:free_grain_or_meat_slot': 'not_proven',
  'lead:tibetan-patu-one-pot:broth_and_noodle_lump_structure': 'supported', 'lead:tibetan-patu-one-pot:tibetan_patu_identity': 'supported', 'lead:tibetan-patu-one-pot:single_pot_equivalence': 'not_proven', 'lead:tibetan-patu-one-pot:project_ratio_time_vessel_equivalence': 'not_proven',
  'lead:tibetan-tuba-barley-thick-bowl:barley_thick_bowl_structure': 'supported', 'lead:tibetan-tuba-barley-thick-bowl:unattended_appliance_equivalence': 'not_proven',
  'lead:lhasa-tibetan-noodle-breakfast:lhasa_breakfast_noodle_and_beef_broth_identity': 'supported', 'lead:lhasa-tibetan-noodle-breakfast:breakfast_context': 'supported', 'lead:lhasa-tibetan-noodle-breakfast:single_pot_complete_meal_equivalence': 'not_proven', 'lead:lhasa-tibetan-noodle-breakfast:project_ratio_time_safety': 'not_proven',
};
const AUXILIARY_EDGES = {
  'safety:animal-food-cook-through-and-separate:principle': { source_id: 'cn-animal-food-safety-2025', direction: 'proves', entity_type: 'safety', entity_id: 'animal-food-cook-through-and-separate' },
  'safety:fresh-bean-cook-through:principle': { source_id: 'cn-cdc-bean-safety-2018', direction: 'proves', entity_type: 'safety', entity_id: 'fresh-bean-cook-through' },
};
const SOURCE_IDENTITIES = {
  'qh-geermu-ga-mianpian-2023': ['尕面片', 'https://www.geermu.gov.cn/details?id=bb5cf28b7bd0297e017c2f524d0e0367', '格尔木市人民政府', '2023-08-18', null, 'A'],
  'qh-gonghe-barley-wheatberry-2023': ['“共和滋味”亮相，十五道精品菜肴，总有一道打动你的胃！', 'https://www.gonghe.gov.cn/xwdt/tpxw/content_48610099', '共和县人民政府', '2023-08-18', null, 'A'],
  'xz-shannan-batu-2026': ['面疙瘩（吧图）', 'https://www.shannan.gov.cn/zjsn/snly/tsms/202603/t20260310_165467.html', '山南市文旅局', '2026-03-10', null, 'A'],
  'xz-gov-patu-2025': ['人间烟火气', 'https://www.xizang.gov.cn/xwzx_406/bmkx/202506/t20250611_483433.html', '西藏自治区人民政府', '2025-06-11', null, 'A'],
  'xz-tibetology-tuba-2022': ['藏族饮食文化 |饭食的类别与制作', 'https://www.tibetology.ac.cn/2022-02/12/content_41875089.htm', '中国藏学研究中心', '2022-02-12', null, 'A'],
  'xz-gov-lhasa-noodle-2024': ['一起探索拉萨的美食世界', 'https://www.xizang.gov.cn/xwzx_406/dsdt/202411/t20241120_448021.html', '西藏自治区人民政府', '2024-11-20', null, 'A'],
  'xz-tourism-lhasa-noodle-2023': ['快收藏！“吃在拉萨”攻略来啦~', 'https://wlt.xizang.gov.cn/xccx/lytg/202312/t20231222_395019.html', '西藏自治区文化和旅游厅', '2023-12-22', null, 'A'],
  'xz-gov-porridge-2025': ['舌尖上的雪域探寻三餐四季的味觉记忆', 'https://www.xizang.gov.cn/xwzx_406/bmkx/202505/t20250528_481144.html', '西藏自治区人民政府', '2025-05-28', null, 'A'],
  'xz-agri-barley-2023': ['2023年西藏计划落实青稞播种面积220万亩', 'https://nynct.xizang.gov.cn/xwzx/xzsn/202311/t20231107_386800.html', '西藏自治区农业农村厅', '2023-11-07', null, 'A'],
  'cn-animal-food-safety-2025': ['食品安全消费提示', 'https://www.xiongan.gov.cn/20250429/7cbd00ffe7bd45668510b7f9fecbdd5d/c.html', '雄安新区综合执法局', '2025-04-29', null, 'A'],
  'cn-cdc-bean-safety-2018': ['豆类蔬菜中哪些豆豆易中毒', 'https://niohp.chinacdc.cn/kpdw/zdkz/201806/t20180601_172888.htm', '中国疾控中心职业卫生与中毒控制所', '2018-06-01', null, 'A'],
};
const SOURCE_CLAIM_EDGES = {
  'qh-geermu-ga-mianpian-2023': { proves: ['production:qinghai-hao-fan:regional_name_context', 'lead:qinghai-ga-mianpian-broth:qinghai_household_noodle_identity'], does_not_prove: ['lead:qinghai-ga-mianpian-broth:project_single_pot_equivalence'], contradicts: [] },
  'qh-gonghe-barley-wheatberry-2023': { proves: ['lead:qinghai-barley-wheatberry-meat-soup:barley_wheatberry_meat_long_simmer_structure'], does_not_prove: ['lead:qinghai-barley-wheatberry-meat-soup:free_grain_or_meat_slot'], contradicts: [] },
  'xz-shannan-batu-2026': { proves: ['lead:tibetan-patu-one-pot:broth_and_noodle_lump_structure'], does_not_prove: ['lead:tibetan-patu-one-pot:project_ratio_time_vessel_equivalence'], contradicts: [] },
  'xz-gov-patu-2025': { proves: ['production:tibetan-gutu:tibetan_noodle_meal_context', 'lead:tibetan-patu-one-pot:tibetan_patu_identity'], does_not_prove: ['production:tibetan-gutu:traditional_recipe_equivalence', 'lead:tibetan-patu-one-pot:single_pot_equivalence'], contradicts: [] },
  'xz-tibetology-tuba-2022': { proves: ['lead:tibetan-tuba-barley-thick-bowl:barley_thick_bowl_structure'], does_not_prove: ['lead:tibetan-tuba-barley-thick-bowl:unattended_appliance_equivalence'], contradicts: [] },
  'xz-gov-lhasa-noodle-2024': { proves: ['lead:lhasa-tibetan-noodle-breakfast:lhasa_breakfast_noodle_and_beef_broth_identity'], does_not_prove: ['lead:lhasa-tibetan-noodle-breakfast:single_pot_complete_meal_equivalence'], contradicts: [] },
  'xz-tourism-lhasa-noodle-2023': { proves: ['lead:lhasa-tibetan-noodle-breakfast:breakfast_context'], does_not_prove: ['lead:lhasa-tibetan-noodle-breakfast:project_ratio_time_safety'], contradicts: [] },
  'xz-gov-porridge-2025': { proves: ['production:tibetan-savory-congee:barley_grain_porridge_context'], does_not_prove: ['production:tibetan-savory-congee:traditional_recipe_equivalence'], contradicts: [] },
  'xz-agri-barley-2023': { proves: ['production:tibetan-ginseng-fruit-rice:barley_region_context'], does_not_prove: ['production:tibetan-ginseng-fruit-rice:traditional_recipe_equivalence'], contradicts: [] },
  'cn-animal-food-safety-2025': { proves: ['safety:animal-food-cook-through-and-separate:principle'], does_not_prove: ['lead:tibetan-patu-one-pot:project_ratio_time_vessel_equivalence'], contradicts: [] },
  'cn-cdc-bean-safety-2018': { proves: ['safety:fresh-bean-cook-through:principle'], does_not_prove: ['production:qinghai-hao-fan:traditional_recipe_equivalence'], contradicts: [] },
};
const FINGERPRINTS = {
  family_model: '9500c94416795385b6bf58ed1b1f32502c51a4ecdbcbbf7de8c48eebef92a994',
  adaptation_boundaries: '51b89b07d46c85a80688946d65ba3e423d8b8ed6ac80a578151dd676e0d548d9',
  safety_boundaries: '3e964edae89b921cc43132fd6e27cfdac0d7ec0e8a41cfb298124e7d15a8bed5',
  journey_cases: '1576c9bf544716d18f61b631d5539edc24b98628a4ed2d5936e562fcb5846571',
};
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const list = value => Array.isArray(value) ? value : [];
const text = value => typeof value === 'string' && value.trim().length > 0;
const sameSet = (values, expected) => values.length === expected.size && new Set(values).size === expected.size && values.every(value => expected.has(value));
const sameArray = (values, expected) => Array.isArray(values) && values.length === expected.length && values.every((value, index) => value === expected[index]);
const directionFor = verdict => verdict === 'supported' ? 'proves' : verdict === 'not_proven' ? 'does_not_prove' : 'contradicts';
const canonicalJson = value => value === null || typeof value !== 'object' ? JSON.stringify(value) : Array.isArray(value) ? `[${value.map(canonicalJson).join(',')}]` : `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
const fingerprint = value => createHash('sha256').update(canonicalJson(value)).digest('hex');

function validateSources(assessment, errors) {
  const ids = new Set(); const directions = new Map(); const rows = list(assessment.source_refs);
  if (!Array.isArray(assessment.source_refs) || rows.length !== 11) errors.push('source_refs must contain exactly 11 items');
  rows.forEach((row, index) => {
    const path = `source_refs[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    for (const field of ['source_id', 'title', 'url', 'publisher', 'published_at', 'retrieved_at', 'source_grade', 'evidence_summary']) if (!text(row[field])) errors.push(`${path}.${field} must be non-empty`);
    if (ids.has(row.source_id)) errors.push(`duplicate source_id ${row.source_id}`); ids.add(row.source_id);
    try { if (new URL(row.url).protocol !== 'https:') errors.push(`${path}.url must use HTTPS`); } catch { errors.push(`${path}.url must be valid`); }
    if (row.published_at !== 'undated' && !/^\d{4}-\d{2}-\d{2}$/.test(row.published_at || '')) errors.push(`${path}.published_at must be YYYY-MM-DD or undated`);
    if (row.published_at === 'undated' && !text(row.date_note)) errors.push(`${path}.date_note is required when published_at is undated`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.retrieved_at || '')) errors.push(`${path}.retrieved_at must be YYYY-MM-DD`);
    const expected = SOURCE_IDENTITIES[row.source_id]; const identity = [row.title, row.url, row.publisher, row.published_at, row.date_note ?? null, row.source_grade];
    if (!expected || expected.some((value, i) => value !== identity[i])) errors.push(`source identity manifest mismatch for ${row.source_id || '<missing>'}`);
    const entry = {};
    for (const direction of ['proves', 'does_not_prove', 'contradicts']) { if (!Array.isArray(row[direction]) || list(row[direction]).some(value => !text(value))) errors.push(`${path}.${direction} must be an array of non-empty strings`); entry[direction] = new Set(list(row[direction])); }
    if ([...entry.proves, ...entry.does_not_prove, ...entry.contradicts].length === 0) errors.push(`source ${row.source_id} must contribute at least one evidence direction`);
    directions.set(row.source_id, entry);
  });
  return { ids, directions };
}

function validateClaims(row, prefix, idField, sourceIds, directions, errors) {
  const claims = row.claims; const tokenBase = `${prefix}:${row[idField]}`;
  if (!isObject(claims) || Object.keys(claims).length === 0) { errors.push(`${tokenBase}.claims must be non-empty`); return; }
  for (const [claimId, claim] of Object.entries(claims)) {
    const token = `${tokenBase}:${claimId}`; const expected = CLAIM_VERDICTS[token];
    if (!isObject(claim) || !['supported', 'not_proven', 'contradicted'].includes(claim.verdict)) { errors.push(`${token} verdict is invalid`); continue; }
    if (claim.verdict !== expected) errors.push(`${token} fixed verdict must remain ${expected}`);
    if (!text(claim.reason) || !Array.isArray(claim.evidence_source_ids) || claim.evidence_source_ids.length === 0) errors.push(`${token} must retain reason and evidence`);
    for (const sourceId of list(claim.evidence_source_ids)) if (!sourceIds.has(sourceId)) errors.push(`${token} references unknown source ${sourceId}`); else if (!directions.get(sourceId)?.[directionFor(claim.verdict)]?.has(token)) errors.push(`${token} verdict ${claim.verdict} must be reverse-indexed under ${directionFor(claim.verdict)} by source ${sourceId}`);
  }
}

function validateRows(rows, expected, prefix, idField, provinces, sourceIds, directions, errors) {
  if (!sameSet(list(rows).filter(isObject).map(row => row[idField]), expected)) errors.push(`${prefix === 'production' ? 'production audit IDs' : 'research lead IDs'} must match the fixed regional baseline`);
  list(rows).forEach(row => {
    if (!isObject(row)) return;
    if (row.province_code !== provinces[row[idField]]) errors.push(`${prefix === 'production' ? 'production' : 'lead'} province mapping must remain fixed`);
    if (prefix === 'production' && row.audit_state !== AUDIT_STATES[row.recipe_id]) errors.push(`production:${row.recipe_id}.audit_state must remain ${AUDIT_STATES[row.recipe_id]}`);
    if (prefix === 'lead' && (row.production_recipe_id !== null || row.candidate_id !== null)) errors.push('research leads cannot reference production recipes or candidates');
    if (prefix === 'lead' && !FAMILIES.has(row.family_id)) errors.push('lead family_id must reference a fixed family');
    if (prefix === 'lead' && !sameSet(list(row.product_destinations), new Set(['new_family_research', 'research_only']))) errors.push('lead product_destinations must remain new_family_research and research_only');
    validateClaims(row, prefix, idField, sourceIds, directions, errors);
  });
}

function validateBaseline({ recipeLibrary, regionalResearch, regionalAtlas, regionalMappings }, errors) {
  const region = list(regionalAtlas?.regions).find(row => row?.region_id === 'qinghai_tibet');
  if (!region || !sameSet(list(region.province_codes), PROVINCES)) errors.push('regional atlas Qinghai Tibet node must retain CN-QH and CN-XZ');
  if (list(recipeLibrary?.recipes).length !== 72) errors.push('recipe library baseline must remain 72');
  const recipes = new Set(list(recipeLibrary?.recipes).map(row => row?.id)); for (const id of PRODUCTION) if (!recipes.has(id)) errors.push(`missing production recipe ${id}`);
  const mappings = list(regionalMappings?.production_recipe_mappings).filter(row => list(row?.region_ids).includes('qinghai_tibet'));
  if (!sameSet(mappings.map(row => row?.source_id), PRODUCTION)) errors.push('regional production mappings must retain the fixed 4-recipe baseline');
  for (const row of mappings) {
    if (!sameArray(row.region_ids, ['qinghai_tibet'])) errors.push('production mapping region scope must remain exactly qinghai_tibet');
    if (!sameArray(row.province_codes, [PRODUCTION_PROVINCES[row.source_id]])) errors.push('production mapping province scope must remain fixed');
  }
  if (list(regionalMappings?.research_candidate_mappings).filter(row => list(row?.region_ids).includes('qinghai_tibet')).length !== 0) errors.push('regional candidate mappings must remain empty');
  if (!Array.isArray(regionalResearch?.entries)) errors.push('regional research ledger must be an array');
  else if (regionalResearch.entries.length !== 24) errors.push('regional research baseline must remain 24');
}

export function validateQinghaiTibetOnePotResearch({ assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings } = {}) {
  if (!isObject(assessment)) return ['assessment must be an object'];
  const errors = [];
  if (assessment.schema_version !== 1 || assessment.assessment_version !== 'qinghai-tibet-one-pot-research-v1-20260726') errors.push('assessment version is invalid');
  if (assessment.region_id !== 'qinghai_tibet' || !sameSet(list(assessment.province_codes), PROVINCES)) errors.push('region ownership must remain Qinghai Tibet CN-QH CN-XZ');
  const { ids, directions } = validateSources(assessment, errors);
  validateRows(assessment.production_recipe_audits, PRODUCTION, 'production', 'recipe_id', PRODUCTION_PROVINCES, ids, directions, errors);
  if (!Array.isArray(assessment.candidate_audits) || assessment.candidate_audits.length !== 0) errors.push('candidate_audits must remain empty');
  validateRows(assessment.concrete_research_leads, LEADS, 'lead', 'lead_id', LEAD_PROVINCES, ids, directions, errors);
  const canonicalTokens = new Set([...Object.keys(CLAIM_VERDICTS), ...Object.keys(AUXILIARY_EDGES)]);
  const claimSources = new Map();
  for (const [prefix, rows, idField] of [['production', list(assessment.production_recipe_audits), 'recipe_id'], ['lead', list(assessment.concrete_research_leads), 'lead_id']]) for (const row of rows) for (const [claimId, claim] of Object.entries(isObject(row?.claims) ? row.claims : {})) claimSources.set(`${prefix}:${row[idField]}:${claimId}`, new Set(list(claim.evidence_source_ids)));
  if (!sameSet([...claimSources.keys()], new Set(Object.keys(CLAIM_VERDICTS)))) errors.push('canonical claim manifest mismatch');
  for (const [sourceId, entry] of directions) for (const direction of ['proves', 'does_not_prove', 'contradicts']) for (const token of entry[direction]) {
    if (!canonicalTokens.has(token)) errors.push(`source ${sourceId} ${direction} token ${token} is not a canonical claim token`);
    if (Object.hasOwn(CLAIM_VERDICTS, token) && CLAIM_VERDICTS[token] !== ({ proves: 'supported', does_not_prove: 'not_proven', contradicts: 'contradicted' })[direction]) errors.push(`source ${sourceId} token ${token} has an invalid evidence direction`);
    if (Object.hasOwn(CLAIM_VERDICTS, token) && !claimSources.get(token)?.has(sourceId)) errors.push(`source ${sourceId} token ${token} does not correspond to claim evidence source`);
    if (Object.hasOwn(AUXILIARY_EDGES, token) && (AUXILIARY_EDGES[token].source_id !== sourceId || AUXILIARY_EDGES[token].direction !== direction)) errors.push(`source ${sourceId} token ${token} does not match its fixed auxiliary evidence edge`);
  }
  if (!sameSet([...directions.keys()], new Set(Object.keys(SOURCE_CLAIM_EDGES)))) errors.push('source-to-claim edge manifest mismatch');
  for (const [sourceId, expected] of Object.entries(SOURCE_CLAIM_EDGES)) for (const direction of ['proves', 'does_not_prove', 'contradicts']) if (!sameSet([...directions.get(sourceId)?.[direction] ?? []], new Set(expected[direction]))) errors.push('source-to-claim edge manifest mismatch');
  for (const [token, edge] of Object.entries(AUXILIARY_EDGES)) {
    if (!directions.get(edge.source_id)?.[edge.direction]?.has(token)) errors.push(`auxiliary token ${token} must remain in ${edge.direction} for ${edge.source_id}`);
    const entity = list(edge.entity_type === 'safety' ? assessment.safety_boundaries : assessment.adaptation_boundaries).find(row => row?.[edge.entity_type === 'safety' ? 'safety_id' : 'boundary_id'] === edge.entity_id);
    if (!entity || !list(entity.source_ids).includes(edge.source_id)) errors.push(`${edge.entity_type} entity ${edge.entity_id} must retain ${edge.source_id}`);
  }
  if (!sameSet(list(assessment.family_model).map(row => row?.family_id), FAMILIES) || list(assessment.family_model).length !== 6) errors.push('family IDs must match the fixed six-family contract');
  if (fingerprint(assessment.family_model) !== FINGERPRINTS.family_model) errors.push('family_model semantic fingerprint mismatch');
  if (!sameSet(list(assessment.adaptation_boundaries).map(row => row?.boundary_id), BOUNDARIES)) errors.push('adaptation boundary IDs must match the fixed regional contract');
  if (list(assessment.adaptation_boundaries).some(row => row?.evidence_status !== 'not_proven')) errors.push('adaptation boundaries must remain not_proven');
  if (fingerprint(assessment.adaptation_boundaries) !== FINGERPRINTS.adaptation_boundaries) errors.push('adaptation_boundaries semantic fingerprint mismatch');
  if (fingerprint(assessment.safety_boundaries) !== FINGERPRINTS.safety_boundaries) errors.push('safety_boundaries semantic fingerprint mismatch');
  const journeys = list(assessment.journey_cases);
  if (journeys.length !== 12) errors.push('journey_cases must contain exactly 12 items');
  if (new Set(journeys.map(row => row?.journey_id)).size !== journeys.length) errors.push('journey_ids must be unique');
  if (journeys.some(row => row?.human_review?.status !== 'pending')) errors.push('journey human reviews must remain pending');
  if (journeys.some(row => !PROVINCES.has(row?.province_code) || list(row?.expected_family_ids).some(id => !FAMILIES.has(id)))) errors.push('journey province or family scope is invalid');
  if (fingerprint(journeys) !== FINGERPRINTS.journey_cases) errors.push('journey_cases semantic fingerprint mismatch');
  validateBaseline({ recipeLibrary, regionalResearch, regionalAtlas, regionalMappings }, errors);
  return errors;
}
