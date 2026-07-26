import { createHash } from 'node:crypto';

const EXPECTED_ASSESSMENT_VERSION = 'lingnan-hk-macao-one-pot-research-v1-20260726';
const EXPECTED_REGION = 'lingnan_hk_macao';
const EXPECTED_PROVINCES = new Set(['CN-GD', 'CN-GX', 'CN-HI', 'CN-HK', 'CN-MO']);
const EXPECTED_PRODUCTION = new Set([
  'cantonese-black-bean-pork-rib-claypot-rice',
  'cantonese-cured-meat-claypot-rice',
  'cantonese-mushroom-chicken-claypot-rice',
  'guangxi-five-color-glutinous-rice',
  'hainan-cai-bao-rice',
]);
const EXPECTED_LEADS = new Set([
  'cantonese-claypot-rice-technique',
  'guangxi-natural-dye-five-color-glutinous-rice',
  'hainan-coconut-shredded-rice',
  'hainan-dingan-cai-bao-finished-rice',
  'macao-portuguese-style-seafood-rice',
]);
const EXPECTED_FAMILIES = new Set([
  'raw-rice-claypot-late-named-topping',
  'natural-dye-steamed-glutinous-rice',
  'finished-rice-cooked-filling-lettuce-wrap',
  'coconut-shredded-rice-staple',
  'macao-portuguese-style-seafood-rice-unresolved',
]);
const EXPECTED_BOUNDARIES = new Set([
  'claypot-not-generic-covered-pot',
  'named-claypot-branches-not-free-slots',
  'natural-dyes-not-food-powder-equivalence',
  'guangxi-pineapple-rice-unproven',
  'dingan-cai-bao-not-raw-rice-one-pot',
  'hainan-chicken-rice-separate-cook',
  'macao-menu-not-process',
]);
const EXPECTED_BOUNDARY_MEANINGS = {
  'claypot-not-generic-covered-pot': { evidence_status: 'not_proven', verdict: 'not_proven', forbidden_equivalence: 'claypot_equals_ordinary_covered_pot' },
  'named-claypot-branches-not-free-slots': { evidence_status: 'supported_with_boundaries', verdict: 'not_proven', forbidden_equivalence: 'named_toppings_as_free_protein_slot' },
  'natural-dyes-not-food-powder-equivalence': { evidence_status: 'not_proven', verdict: 'not_proven', forbidden_equivalence: 'food_powders_as_traditional_natural_dyes' },
  'guangxi-pineapple-rice-unproven': { evidence_status: 'not_proven', verdict: 'not_proven', forbidden_equivalence: 'guangxi_traditional_pineapple_rice_claim' },
  'dingan-cai-bao-not-raw-rice-one-pot': { evidence_status: 'not_proven', verdict: 'not_proven', forbidden_equivalence: 'raw_rice_all_ingredients_single_vessel' },
  'hainan-chicken-rice-separate-cook': { evidence_status: 'not_proven', verdict: 'not_proven', forbidden_equivalence: 'raw_chicken_and_raw_rice_single_pot_as_traditional_hainan_chicken_rice' },
  'macao-menu-not-process': { evidence_status: 'not_proven', verdict: 'not_proven', forbidden_equivalence: 'menu_presence_as_one_pot_process' },
};
// This manifest is intentionally tied to EXPECTED_ASSESSMENT_VERSION. A legitimate
// evidence update must bump assessment_version, then consciously update this list.
const EXPECTED_SOURCE_IDENTITIES = {
  'gd-cantonese-standard-undated': ['粤菜餐厅西关风情特色服务规范（DB44/T 2423-2023）', 'https://std.samr.gov.cn/db/search/stdDBDetailed?id=FCE664C973E2154EE05397BE0A0A886A', '国家标准信息公共服务平台', 'undated', '标准平台记录用于核验 DB44/T 2423-2023 的标准身份；具体煲仔饭工艺另由征求意见稿记录。', 'A'],
  'gd-xiguan-draft-claypot-rice-undated': ['粤菜餐厅西关风情特色服务规范（征求意见稿）', 'https://com.gd.gov.cn/attachment/0/496/496120/3989095.pdf', '广东省市场监督管理局', 'undated', '征求意见稿 PDF 未提供可用于本研究的明确发布日期。', 'B'],
  'hk-tourism-claypot-food-map-undated': ['香港美食地图：煲仔饭', 'https://www.discoverhongkong.com/content/dam/dhk/intl/plan/traveller-info/e-guidebooks/foodmap-tc.pdf', '香港旅游发展局', 'undated', '旅游指南 PDF 未显示稳定发布日期。', 'B'],
  'gx-foreign-affairs-five-color-rice-2021': ['壮族五色糯米饭', 'https://wsb.gxzf.gov.cn/xwyw_48149/dfws_48154/t8584005.shtml', '广西壮族自治区人民政府外事办公室', '2021-05-12', null, 'A'],
  'gx-baise-tax-five-color-rice-2024': ['壮乡五色糯米饭飘香', 'https://znhd.guangxi.chinatax.gov.cn/baise/gzdt_15440/gzdt_15441/202404/t20240418_400522.html', '国家税务总局百色市税务局', '2024-04-18', null, 'A'],
  'hi-agri-dingan-ich-2024': ['定安三项非遗项目入选省级非遗项目', 'https://agri.hainan.gov.cn/hnsnyt/zt/xczx/xczxdt/202406/t20240614_3680040.html', '海南省农业农村厅', '2024-01-02', null, 'A'],
  'hi-gov-dingan-cai-bao-2026': ['深耕本地特色，定安推动非遗美食香飘出圈', 'https://www.hainan.gov.cn/hainan/sxian/202602/ef2d17adfde24348a7eb4974317058e1.shtml', '海南省人民政府网（来源：海南日报）', '2026-02-08', null, 'A'],
  'hi-gov-coconut-shredded-rice-2024': ['寻找老味道', 'https://www.hainan.gov.cn/hainan/c100643b/202403/679d437de85c40408aee7f67fa1d563e.shtml?ddtab=true', '海南省人民政府网（来源：海南日报）', '2024-03-25', null, 'A'],
  'hi-gov-hainan-chicken-rice-2006': ['海南鸡饭', 'https://www.hainan.gov.cn/hainan/mstc/200606/d1b3748845a84b30b4d9153fdb646140.shtml', '海南省人民政府网', '2006-06-01', null, 'A'],
  'mo-tourism-portuguese-seafood-rice-undated': ['Macanese & Portuguese Dishes', 'https://www.macaotourism.gov.mo/en/dining/taste-of-macao/macanese-and-portuguese-dishes', '澳门特别行政区政府旅游局', 'undated', '旅游介绍页未显示可核验的发布日期；仅用作澳门在地菜单线索。', 'C'],
  'cq-cured-meat-safety-2026': ['腊肉、香肠的消费提示', 'https://scjgj.cq.gov.cn/bkzs/xfts/202602/t20260213_15442166.html', '重庆市市场监督管理局', '2026-02-13', null, 'A'],
  'zs-market-food-safety-2026': ['食品安全消费提示', 'https://www.zs.gov.cn/zszjj/gkmlpt/content/2/2589/post_2589753.html', '中山市市场监督管理局', '2026-01-17', null, 'A'],
};
// These fingerprints lock every rendered semantic field for the fixed version.
// Array order is significant; object keys are canonicalized recursively.
const EXPECTED_SEMANTIC_FINGERPRINTS = {
  family_model: '76d28769c4ad13f022a06ddd4e7d245944b7b404baf2cdbb79e3003f2071e3d2',
  adaptation_boundaries: '533a1d7b23a84b1fe5c967a11f4ded47f719f22b6f759349eba21ef23e2a889a',
  safety_boundaries: 'd8bfd19ce3171656bb4bff33c3c338d2777c892b199bbe6d323efb4867816bfa',
  journey_cases: '0db122c299935efaaf6db716213e20b05150f68dd85aa0a239b23cfb24e6e8fb',
};
const VERDICTS = new Set(['supported', 'not_proven', 'contradicted']);
const DESTINATIONS = new Set(['recipe_evidence', 'template_evidence', 'ratio_rule', 'new_family_research', 'research_only', 'substitution_rule']);
const AUDIT_STATES = new Set(['needs_manual_review', 'needs_more_evidence', 'supported_with_boundaries']);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const asArray = value => Array.isArray(value) ? value : [];
const asObject = value => isObject(value) ? value : {};
const hasText = value => typeof value === 'string' && value.trim().length > 0;

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? '"__undefined__"';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}

function semanticFingerprint(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function sameSet(values, expected) {
  return values.length === expected.size && new Set(values).size === expected.size && values.every(value => expected.has(value));
}

function textArray(value, path, errors, { allowEmpty = false } = {}) {
  if (!Array.isArray(value)) { errors.push(`${path} must be an array`); return []; }
  if (!allowEmpty && value.length === 0) errors.push(`${path} must be non-empty`);
  if (value.some(item => !hasText(item))) errors.push(`${path} must contain non-empty strings`);
  if (new Set(value).size !== value.length) errors.push(`${path} must not contain duplicates`);
  return value.filter(hasText);
}

function validateSources(assessment, errors) {
  const ids = new Set();
  const directions = new Map();
  const rows = asArray(assessment.source_refs);
  if (!Array.isArray(assessment.source_refs)) errors.push('source_refs must be an array');
  if (rows.length !== 12) errors.push('source_refs must contain exactly 12 items');
  rows.forEach((row, index) => {
    const path = `source_refs[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    for (const field of ['source_id', 'title', 'url', 'publisher', 'published_at', 'retrieved_at', 'source_grade', 'evidence_summary']) if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
    if (ids.has(row.source_id)) errors.push(`duplicate source_id ${row.source_id}`);
    if (hasText(row.source_id)) ids.add(row.source_id);
    try {
      const url = new URL(row.url);
      if (url.protocol !== 'https:') errors.push(`${path}.url must use HTTPS`);
      if (url.hostname === 'yiguochu.pages.dev') errors.push('project canonical URL cannot be regional evidence');
    } catch { errors.push(`${path}.url must be valid`); }
    if (row.published_at !== 'undated' && !/^\d{4}-\d{2}-\d{2}$/.test(row.published_at || '')) errors.push(`${path}.published_at must be YYYY-MM-DD or undated`);
    if (row.published_at === 'undated' && !hasText(row.date_note)) errors.push(`${path}.date_note is required when published_at is undated`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.retrieved_at || '')) errors.push(`${path}.retrieved_at must be YYYY-MM-DD`);
    if (!['A', 'B', 'C'].includes(row.source_grade)) errors.push(`${path}.source_grade is invalid`);
    const expectedIdentity = EXPECTED_SOURCE_IDENTITIES[row.source_id];
    const actualIdentity = [row.title, row.url, row.publisher, row.published_at, row.date_note ?? null, row.source_grade];
    if (!expectedIdentity || actualIdentity.some((value, fieldIndex) => value !== expectedIdentity[fieldIndex])) errors.push(`source identity manifest mismatch for ${row.source_id || '<missing>'}`);
    const proves = textArray(row.proves, `${path}.proves`, errors, { allowEmpty: true });
    const doesNotProve = textArray(row.does_not_prove, `${path}.does_not_prove`, errors, { allowEmpty: true });
    const contradicts = row.contradicts === undefined ? [] : textArray(row.contradicts, `${path}.contradicts`, errors, { allowEmpty: true });
    if (new Set([...proves, ...doesNotProve, ...contradicts]).size !== proves.length + doesNotProve.length + contradicts.length) errors.push(`${path} claim directions must not overlap`);
    directions.set(row.source_id, { proves: new Set(proves), does_not_prove: new Set(doesNotProve), contradicts: new Set(contradicts) });
  });
  return { ids, directions };
}

function validateClaims(claims, token, path, sourceIds, directions, errors) {
  if (!isObject(claims) || Object.keys(claims).length === 0) { errors.push(`${path} must be a non-empty object`); return; }
  for (const [claimId, rawClaim] of Object.entries(claims)) {
    const claimPath = `${path}.${claimId}`;
    const claim = asObject(rawClaim);
    if (!VERDICTS.has(claim.verdict)) errors.push(`${claimPath}.verdict is invalid`);
    if (!hasText(claim.reason)) errors.push(`${claimPath}.reason must be non-empty`);
    const evidence = textArray(claim.evidence_source_ids, `${claimPath}.evidence_source_ids`, errors);
    const direction = claim.verdict === 'supported' ? 'proves' : claim.verdict === 'not_proven' ? 'does_not_prove' : 'contradicts';
    for (const sourceId of evidence) {
      if (!sourceIds.has(sourceId)) errors.push(`${claimPath} references unknown source ${sourceId}`);
      if (!directions.get(sourceId)?.[direction]?.has(`${token}:${claimId}`)) errors.push(`${claimPath} verdict ${claim.verdict} must be reverse-indexed under ${direction} by source ${sourceId}`);
    }
  }
}

function validateAudits(assessment, sourceIds, directions, errors) {
  const rows = asArray(assessment.production_recipe_audits);
  if (!sameSet(rows.filter(isObject).map(row => row.recipe_id), EXPECTED_PRODUCTION)) errors.push('production audit IDs must match the fixed regional baseline');
  rows.forEach((row, index) => {
    const path = `production_recipe_audits[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    if (!hasText(row.recipe_id)) errors.push(`${path}.recipe_id must be non-empty`);
    if (!AUDIT_STATES.has(row.audit_state)) errors.push(`${path}.audit_state is invalid`);
    validateClaims(row.claims, `production:${row.recipe_id}`, `${path}.claims`, sourceIds, directions, errors);
    for (const field of ['ingredient_shapes', 'forbidden_claims', 'product_destinations']) textArray(row[field], `${path}.${field}`, errors);
    for (const destination of asArray(row.product_destinations)) if (!DESTINATIONS.has(destination)) errors.push(`${path}.product_destinations contains invalid ${destination}`);
    if (!hasText(row.decision_reason)) errors.push(`${path}.decision_reason must be non-empty`);
  });
  if (!Array.isArray(assessment.candidate_audits) || assessment.candidate_audits.length !== 0) errors.push('candidate_audits must remain empty');
}

function validateLeads(assessment, sourceIds, directions, errors) {
  const rows = asArray(assessment.concrete_research_leads);
  if (!sameSet(rows.filter(isObject).map(row => row.lead_id), EXPECTED_LEADS)) errors.push('research lead IDs must match the fixed regional scope');
  rows.forEach((row, index) => {
    const path = `concrete_research_leads[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    for (const field of ['lead_id', 'name', 'province_code', 'family_id', 'meal_structure', 'decision_reason']) if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
    if (!EXPECTED_PROVINCES.has(row.province_code)) errors.push(`${path}.province_code is invalid`);
    if (row.production_recipe_id !== null) errors.push('research leads cannot reference a production recipe');
    if (row.candidate_id !== null) errors.push('research leads cannot reference a research candidate');
    for (const sourceId of textArray(row.source_ids, `${path}.source_ids`, errors)) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
    validateClaims(row.claims, `lead:${row.lead_id}`, `${path}.claims`, sourceIds, directions, errors);
    for (const field of ['ingredient_shapes', 'known_structure', 'forbidden_shortcuts', 'open_questions', 'product_destinations']) textArray(row[field], `${path}.${field}`, errors);
    for (const destination of asArray(row.product_destinations)) if (!DESTINATIONS.has(destination)) errors.push(`${path}.product_destinations contains invalid ${destination}`);
  });
}

function validateSupport(assessment, sourceIds, directions, errors) {
  const families = asArray(assessment.family_model);
  if (families.length !== 5) errors.push('family_model must contain exactly 5 items');
  if (!sameSet(families.filter(isObject).map(row => row.family_id), EXPECTED_FAMILIES)) errors.push('family IDs must match the fixed regional contract');
  families.forEach((row, index) => {
    const path = `family_model[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    for (const field of ['family_id', 'name', 'meal_structure', 'evidence_status']) if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
  });
  const boundaries = asArray(assessment.adaptation_boundaries);
  if (!Array.isArray(assessment.adaptation_boundaries) || boundaries.length === 0) errors.push('adaptation_boundaries must be a non-empty array');
  if (!sameSet(boundaries.filter(isObject).map(row => row.boundary_id), EXPECTED_BOUNDARIES)) errors.push('adaptation boundary IDs must match the fixed regional contract');
  boundaries.forEach((row, index) => {
    const path = `adaptation_boundaries[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    for (const field of ['boundary_id', 'evidence_status', 'verdict', 'forbidden_equivalence', 'notes']) if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
    if (!VERDICTS.has(row.evidence_status) && row.evidence_status !== 'supported_with_boundaries') errors.push(`${path}.evidence_status is invalid`);
    if (!VERDICTS.has(row.verdict)) errors.push(`${path}.verdict is invalid`);
    const expected = EXPECTED_BOUNDARY_MEANINGS[row.boundary_id];
    if (expected && (row.evidence_status !== expected.evidence_status || row.verdict !== expected.verdict || row.forbidden_equivalence !== expected.forbidden_equivalence)) errors.push(`${row.boundary_id} boundary meaning must remain fixed`);
    if (row.boundary_id === 'hainan-chicken-rice-separate-cook') {
      const sourceList = textArray(row.source_ids, `${path}.source_ids`, errors);
      if (sourceList.length !== 1 || sourceList[0] !== 'hi-gov-hainan-chicken-rice-2006' || !sourceIds.has(sourceList[0])) {
        errors.push('hainan chicken rice boundary must retain its official source');
      }
      const sourceDirections = directions.get('hi-gov-hainan-chicken-rice-2006');
      if (!sourceDirections?.proves?.has('boundary:hainan-chicken-rice-separate-cook:separate_chicken_and_rice_structure')
        || !sourceDirections?.does_not_prove?.has('boundary:hainan-chicken-rice-separate-cook:single_pot_raw_chicken_rice_equivalence')
        || !sourceDirections?.does_not_prove?.has('boundary:hainan-chicken-rice-separate-cook:project_ratio_safety')) {
        errors.push('hainan chicken rice boundary source directions must remain closed');
      }
    }
  });
  if (!Array.isArray(assessment.safety_boundaries) || assessment.safety_boundaries.length === 0) errors.push('safety_boundaries must be a non-empty array');
  asArray(assessment.safety_boundaries).forEach((row, index) => {
    const path = `safety_boundaries[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    if (!hasText(row.safety_id) || row.evidence_status !== 'principle_only') errors.push(`${path} must remain principle_only with safety_id`);
    const sourceList = textArray(row.source_ids, `${path}.source_ids`, errors);
    for (const sourceId of sourceList) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
    if (!sourceList.some(id => directions.get(id)?.proves?.has(`safety:${row.safety_id}:principle`))) errors.push(`${path} lacks safety principle proof`);
    textArray(row.required_controls, `${path}.required_controls`, errors);
    if (!hasText(row.endpoint_note)) errors.push(`${path}.endpoint_note must be non-empty`);
  });
}

function validateFamilyReferences(assessment, errors) {
  asArray(assessment.concrete_research_leads).filter(isObject).forEach((row, index) => {
    if (!EXPECTED_FAMILIES.has(row.family_id)) errors.push(`concrete_research_leads[${index}].family_id must reference a fixed family`);
  });
  asArray(assessment.journey_cases).filter(isObject).forEach((row, index) => {
    for (const familyId of asArray(row.expected_family_ids)) {
      if (!EXPECTED_FAMILIES.has(familyId)) errors.push(`journey_cases[${index}].expected_family_ids contains unknown family ${familyId}`);
    }
  });
}

function validateRequiredClaims(assessment, errors) {
  const production = new Map(asArray(assessment.production_recipe_audits).filter(isObject).map(row => [`production:${row.recipe_id}`, row]));
  const leads = new Map(asArray(assessment.concrete_research_leads).filter(isObject).map(row => [`lead:${row.lead_id}`, row]));
  const required = [
    ['lead:cantonese-claypot-rice-technique', 'late_named_topping_structure', 'supported', 'late named topping structure claim must remain supported'],
    ['lead:cantonese-claypot-rice-technique', 'hong_kong_exclusive_origin', 'not_proven', 'Hong Kong exclusive origin claim must remain not_proven'],
    ['lead:cantonese-claypot-rice-technique', 'named_toppings_as_free_protein_slot', 'not_proven', 'named toppings free protein slot claim must remain not_proven'],
    ['production:guangxi-five-color-glutinous-rice', 'guangxi_pineapple_rice_regional_identity', 'not_proven', 'Guangxi pineapple rice regional identity claim must remain not_proven'],
    ['production:hainan-cai-bao-rice', 'single_vessel_one_pot_equivalence', 'not_proven', 'Dingan cai bao single-vessel claim must remain not_proven'],
    ['lead:hainan-coconut-shredded-rice', 'complete_main_meal_sufficiency', 'not_proven', 'coconut rice meal sufficiency claim must remain not_proven'],
    ['lead:macao-portuguese-style-seafood-rice', 'single_pot_process', 'not_proven', 'Macao seafood rice single-pot claim must remain not_proven'],
  ];
  for (const [subject, claimId, verdict, error] of required) {
    const row = production.get(subject) || leads.get(subject);
    if (row?.claims?.[claimId]?.verdict !== verdict) errors.push(error);
  }
}

function validateJourneys(assessment, errors) {
  const rows = asArray(assessment.journey_cases);
  if (rows.length !== 15) errors.push('journey_cases must contain exactly 15 items');
  if (new Set(rows.filter(isObject).map(row => row.journey_id)).size !== rows.length) errors.push('journey_ids must be unique');
  rows.forEach((row, index) => {
    const path = `journey_cases[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    for (const field of ['journey_id', 'province_code', 'mode', 'intent', 'expected_structure', 'expected_outcome', 'reason']) if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
    if (!EXPECTED_PROVINCES.has(row.province_code)) errors.push(`${path}.province_code is invalid`);
    if (!['recommend', 'pantry'].includes(row.mode)) errors.push(`${path}.mode is invalid`);
    if (!['normal', 'quick', 'fresh', 'batch'].includes(row.intent)) errors.push(`${path}.intent is invalid`);
    for (const field of ['input_items', 'expected_family_ids', 'forbidden_claims']) textArray(row[field], `${path}.${field}`, errors, { allowEmpty: field === 'expected_family_ids' });
    if (!isObject(row.human_review) || row.human_review.status !== 'pending') errors.push(`${path}.human_review.status must remain pending`);
  });
}

function validateBaseline({ recipeLibrary, regionalResearch, regionalAtlas, regionalMappings }, errors) {
  const region = asArray(regionalAtlas?.regions).find(row => row?.region_id === EXPECTED_REGION);
  if (!region || !sameSet(asArray(region.province_codes), EXPECTED_PROVINCES)) errors.push('regional atlas must contain Lingnan Hong Kong Macao region and five province nodes');
  for (const code of EXPECTED_PROVINCES) {
    const node = asArray(regionalAtlas?.province_nodes).find(row => row?.atlas_code === code);
    if (!node || node.region_id !== EXPECTED_REGION) errors.push(`regional atlas must contain ${code} under lingnan_hk_macao`);
  }
  if (asArray(recipeLibrary?.recipes).length !== 72) errors.push('recipe library baseline must remain 72');
  if (asArray(regionalResearch?.entries).length !== 24) errors.push('regional research baseline must remain 24');
  const inScope = row => asArray(row?.region_ids).includes(EXPECTED_REGION);
  const productionMappings = asArray(regionalMappings?.production_recipe_mappings).filter(inScope);
  const candidateMappings = asArray(regionalMappings?.research_candidate_mappings).filter(inScope);
  if (!sameSet(productionMappings.map(row => row.source_id), EXPECTED_PRODUCTION)) errors.push('regional production mappings must remain exactly five');
  if (candidateMappings.length !== 0) errors.push('regional candidate mapping baseline must remain zero');
  const recipeIds = new Set(asArray(recipeLibrary?.recipes).filter(isObject).map(row => row.id));
  for (const id of EXPECTED_PRODUCTION) if (!recipeIds.has(id)) errors.push(`recipe library is missing ${id}`);
}

function validateInvariants(assessment, errors) {
  const production = new Map(asArray(assessment.production_recipe_audits).filter(isObject).map(row => [row.recipe_id, row]));
  const leads = new Map(asArray(assessment.concrete_research_leads).filter(isObject).map(row => [row.lead_id, row]));
  const sources = new Map(asArray(assessment.source_refs).filter(isObject).map(row => [row.source_id, row]));
  if (leads.get('cantonese-claypot-rice-technique')?.claims?.household_vessel_equivalence?.verdict !== 'not_proven') errors.push('household vessel equivalence must remain not_proven');
  if (production.get('guangxi-five-color-glutinous-rice')?.claims?.guangxi_pineapple_rice_regional_identity?.verdict !== 'not_proven') errors.push('Guangxi pineapple rice regional identity must remain not_proven');
  if (production.get('guangxi-five-color-glutinous-rice')?.claims?.food_powder_as_traditional_equivalence?.verdict !== 'not_proven') errors.push('food powder traditional equivalence must remain not_proven');
  if (production.get('hainan-cai-bao-rice')?.claims?.single_vessel_one_pot_equivalence?.verdict !== 'not_proven') errors.push('Dingan cai bao single-vessel equivalence must remain not_proven');
  const chickenRiceBoundary = asArray(assessment.adaptation_boundaries).find(row => row?.boundary_id === 'hainan-chicken-rice-separate-cook');
  if (chickenRiceBoundary?.verdict !== 'not_proven') errors.push('Hainan chicken rice single-pot equivalence must remain not_proven');
  const chickenRiceSource = sources.get('hi-gov-hainan-chicken-rice-2006');
  if (chickenRiceSource?.url !== 'https://www.hainan.gov.cn/hainan/mstc/200606/d1b3748845a84b30b4d9153fdb646140.shtml'
    || chickenRiceSource?.title !== '海南鸡饭'
    || chickenRiceSource?.publisher !== '海南省人民政府网'
    || chickenRiceSource?.published_at !== '2006-06-01'
    || chickenRiceSource?.source_grade !== 'A') {
    errors.push('Hainan chicken rice source must remain official');
  }
  if (leads.get('macao-portuguese-style-seafood-rice')?.claims?.portuguese_chicken_as_rice_pot?.verdict !== 'not_proven') errors.push('Portuguese chicken as rice pot must remain not_proven');
}

export function validateLingnanHkMacaoOnePotResearch({ assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings } = {}) {
  if (!isObject(assessment)) return ['assessment must be an object'];
  const errors = [];
  if (assessment.schema_version !== 1) errors.push('schema_version must be 1');
  if (assessment.assessment_version !== EXPECTED_ASSESSMENT_VERSION) errors.push(`assessment_version must be ${EXPECTED_ASSESSMENT_VERSION}; bump version and update semantic manifests for intentional research changes`);
  if (assessment.region_id !== EXPECTED_REGION) errors.push('region_id must be lingnan_hk_macao');
  if (!sameSet(asArray(assessment.province_codes), EXPECTED_PROVINCES)) errors.push('province_codes must contain CN-GD CN-GX CN-HI CN-HK CN-MO');
  const { ids, directions } = validateSources(assessment, errors);
  validateAudits(assessment, ids, directions, errors);
  validateLeads(assessment, ids, directions, errors);
  validateSupport(assessment, ids, directions, errors);
  validateJourneys(assessment, errors);
  validateFamilyReferences(assessment, errors);
  validateBaseline({ recipeLibrary, regionalResearch, regionalAtlas, regionalMappings }, errors);
  validateInvariants(assessment, errors);
  validateRequiredClaims(assessment, errors);
  for (const [field, expected] of Object.entries(EXPECTED_SEMANTIC_FINGERPRINTS)) {
    if (semanticFingerprint(asArray(assessment[field])) !== expected) errors.push(`${field} semantic fingerprint mismatch for ${EXPECTED_ASSESSMENT_VERSION}`);
  }
  return errors;
}
