const EVIDENCE_VERSION = 'source-backed-formal-ratio-evidence-v1-20260812-r1';

// These are exact source-contract snapshots, not executable Ratio DSL rules.
// Keeping the list explicit prevents a broad source-card sweep from silently
// turning estimated quantities or cross-appliance conversions into Planner
// defaults.
const TARGET_RECIPE_IDS = Object.freeze([
  'tatung-beef-burdock-takikomi-rice',
  'tiger-pork-bamboo-rice',
  'tatung-pork-daikon-rice',
  'tatung-wakayama-ginger-rice',
  'sichuan-rice-cooker-pork-ribs-rice',
  'philips-cantonese-cured-rice',
  'shanghai-salted-pork-vegetable-rice',
  'toshiba-mixed-chicken-bamboo-rice-rc-dr18t',
  'panasonic-nf-pc400-takikomi-rice',
  'panasonic-khao-man-gai-nf-ac1000',
  'taiwan-tatung-cabbage-rice',
  'zojirushi-pork-vegetable-rice-el-ns23',
  'tatung-hainan-chicken-rice',
  'tatung-pork-jowl-sesame-rice',
  'tiger-chinese-sticky-rice',
  'hk-pumpkin-taro-chicken-claypot-rice',
  'cookpot-beef-wild-mushroom-rice',
  'zojirushi-nonokomeshi-el-mb30',
  'tiger-gomoku-rice-post43',
  'cantonese-mushroom-chicken-claypot-rice',
  'zojirushi-okayama-ebimeshi-el-ns23',
  'tatung-oyster-mountain-vegetable-rice',
  'tatung-paella-style-seafood-rice',
  'tatung-nasi-goreng-style-rice',
  'tiger-chicken-bamboo-rice',
  'tiger-whitefish-mixed-rice',
  'tiger-duck-matsutake-rice',
  'panasonic-claypot-style-chicken-rice',
  'hk-yam-longan-chicken-claypot-rice',
  'hk-taro-shrimp-multigrain-steamed-rice',
  'tatung-avocado-chicken-rice',
  'tiger-steak-mushroom-barley-rice',
  'toshiba-bibimbap-mixed-rice',
  'tatung-salmon-pumpkin-milk-risotto',
  'tefal-chicken-rice-olives-one-pot-pan',
  'tiger-chicken-paella',
  'tefal-homechef-paella',
  'tefal-pilaf-with-lamb-r200302',
  'tefal-paella-r106320',
  'tefal-italian-sundried-tomato-chicken-rice-r942720',
  'hk-mushroom-grass-carp-congee',
  'tefal-spanish-style-chicken-legs-r106521',
  'global-spain-arroz-negro',
  'tamu-turkey-burrito-bowl',
  'illinois-texas-hash',
  'va-pork-rice-skillet',
  'asmi-pink-salmon-rice-bowls',
  'usu-salsa-verde-chicken-rice',
  'nih-medlineplus-chicken-rice',
  'cu-caribbean-jerk-chicken-rice',
  'kidney-care-chicken-tikka-pulao',
  'firststeps-turkey-vegetable-pilaf',
  'au-slhd-oven-baked-biryani',
  'cantonese-cured-meat-claypot-rice',
  'tiger-shirasu-tomato-multigrain-rice',
  'tiger-mackerel-aromatic-barley-rice',
  'tiger-hamo-rice',
  'cuckoo-abalone-pot-rice',
  'instant-pot-spinach-chickpea-rice',
  'toshiba-mixed-mushroom-ume-rice',
  'toshiba-seafood-paella-rice',
  'toshiba-sakuraebi-rice',
  'toshiba-sekihan-rcp30r',
  'toshiba-kuri-okowa',
  'panasonic-sekihan-nf-ac1000',
  'tiger-beef-matsutake-rice',
  'tiger-steamed-abalone-rice',
  'toshiba-chinese-sticky-rice-rcp30r',
  'tiger-oyster-mushroom-rice',
  'maff-aomori-goma-gohan',
  'zojirushi-corn-risotto',
  'zojirushi-turkish-risotto',
  'tatung-yugao-sakuraebi-rice',
  'tatung-tarako-kamameshi',
  'tatung-kumamoto-ebimeshi',
  'tatung-hijiki-umeboshi-rice',
  'tatung-tomato-pumpkin-rice',
  'tatung-seafood-porridge',
  'tatung-tuna-garlic-butter-rice',
  'startsmart-corn-lean-pork-porridge',
  'r58-sharp-matsusaka-pork-mushroom-rice',
  'r58-cookpot-salmon-milk-brown-rice-risotto',
  'r58-cookpot-corn-rice-beef-meatballs',
  'r60-tiger-basic-chicken-congee',
  'r60-tiger-takeout-vegetable-fried-rice',
  'taiwan-brown-rice-sishen-porridge',
  'r61-tiger-dried-shrimp-salted-kelp-brown-rice',
  'r61-tiger-chestnut-brown-rice',
  'r61-tiger-multigrain-medicinal-porridge',
  'r61-tiger-red-can-curry-pilaf',
  'r61-tiger-easy-khao-man-gai',
  'r61-tiger-broad-bean-rice',
  'tiger-post-196-gomoku-rice',
  'tiger-brown-rice-curry-pilaf',
  'maff-tokushima-omiisan',
  'philips-soy-milk-chicken-congee',
  'toshiba-steamed-sekihan-edion-rice-cooker',
  'panasonic-brown-rice-soybean-rice-nf-pc400',
  'tefal-risotto-milanese',
  'tefal-saffron-rice-seafood',
  'tiger-cheese-curry-pilaf',
  'tiger-hotaruika-rice',
  'tefal-homechef-mushroom-risotto',
  'zojirushi-kasuyose-el-mb30',
  'panasonic-nara-chagayu-nf-ac1000',
  'panasonic-bamboo-brown-rice-nf-pc400',
  'panasonic-chinese-sticky-rice-nf-pc400',
  'tefal-risotto-with-peas-r106322',
  'tefal-risotto-with-shrimps-r106225',
  'tefal-602-chicken-pea-risotto',
  'tefal-602-smoked-haddock-kedgeree',
  'tiger-crab-miso-rice-post6',
  'tiger-canned-curry-takikomi-pilaf',
  'tiger-seafood-paella-post118',
  'philips-corn-quinoa-vegetable-rice',
  'tefal-portuguese-rice-r106506',
  'tiger-usa-century-egg-fish-porridge',
  'panasonic-autocooker-seasoned-rice-kit',
  'instant-pot-easy-chicken-rice',
  'instant-pot-chicken-rice-soup',
  'instant-pot-chicken-satay-rice',
  'instant-pot-chicken-enchilada-rice',
  'instant-pot-spanish-chicken-rice',
  'global-greece-mushroom-mageiritsa',
  'qld-one-pot-beans-rice',
  'rda-korea-naengi-panbap',
  'unh-spanish-rice',
  'sdsu-easy-red-beans-rice',
  'urochester-smoky-hoppin-john',
  'firststeps-vegetable-biryani',
  'healthvermont-spinach-carrot-rice-pilaf',
  'ca-health-multigrain-congee',
]);

// These are the first source cards whose original page already gives a
// complete fixed-batch contract.  The contract is intentionally bounded to
// that exact batch/appliance; it is not a per-serving Planner rule and must
// remain non-executable until kitchen and journey evidence exist.
const SOURCE_BOUNDED_TARGET_RECIPE_IDS = Object.freeze([
  'tatung-beef-burdock-takikomi-rice',
  'tiger-pork-bamboo-rice',
  'tatung-pork-daikon-rice',
  'tatung-wakayama-ginger-rice',
  'sichuan-rice-cooker-pork-ribs-rice',
  'philips-cantonese-cured-rice',
  'shanghai-salted-pork-vegetable-rice',
  'toshiba-mixed-chicken-bamboo-rice-rc-dr18t',
  'panasonic-nf-pc400-takikomi-rice',
  'panasonic-khao-man-gai-nf-ac1000',
  'taiwan-tatung-cabbage-rice',
  'zojirushi-pork-vegetable-rice-el-ns23',
  'tatung-hainan-chicken-rice',
  'tatung-pork-jowl-sesame-rice',
  'tiger-chinese-sticky-rice',
  'hk-pumpkin-taro-chicken-claypot-rice',
  'cookpot-beef-wild-mushroom-rice',
  'zojirushi-nonokomeshi-el-mb30',
  'tiger-gomoku-rice-post43',
  'cantonese-mushroom-chicken-claypot-rice',
  'zojirushi-okayama-ebimeshi-el-ns23',
  'tatung-oyster-mountain-vegetable-rice',
  'tatung-paella-style-seafood-rice',
  'tatung-nasi-goreng-style-rice',
  'tiger-chicken-bamboo-rice',
  'tiger-whitefish-mixed-rice',
  'tiger-duck-matsutake-rice',
  'panasonic-claypot-style-chicken-rice',
  'hk-yam-longan-chicken-claypot-rice',
  'hk-taro-shrimp-multigrain-steamed-rice',
  'tatung-avocado-chicken-rice',
  'tiger-steak-mushroom-barley-rice',
  'toshiba-bibimbap-mixed-rice',
  'tatung-salmon-pumpkin-milk-risotto',
  'tefal-chicken-rice-olives-one-pot-pan',
  'tiger-chicken-paella',
  'tefal-homechef-paella',
  'tefal-pilaf-with-lamb-r200302',
  'tefal-paella-r106320',
  'tefal-italian-sundried-tomato-chicken-rice-r942720',
  'hk-mushroom-grass-carp-congee',
  'tefal-spanish-style-chicken-legs-r106521',
  'global-spain-arroz-negro',
  'tamu-turkey-burrito-bowl',
  'illinois-texas-hash',
  'va-pork-rice-skillet',
  'asmi-pink-salmon-rice-bowls',
  'usu-salsa-verde-chicken-rice',
  'nih-medlineplus-chicken-rice',
  'cu-caribbean-jerk-chicken-rice',
  'kidney-care-chicken-tikka-pulao',
  'firststeps-turkey-vegetable-pilaf',
  'au-slhd-oven-baked-biryani',
  'cantonese-cured-meat-claypot-rice',
  'tiger-shirasu-tomato-multigrain-rice',
  'tiger-mackerel-aromatic-barley-rice',
  'tiger-hamo-rice',
  'cuckoo-abalone-pot-rice',
  'instant-pot-spinach-chickpea-rice',
  'toshiba-mixed-mushroom-ume-rice',
  'toshiba-seafood-paella-rice',
  'toshiba-sakuraebi-rice',
  'toshiba-sekihan-rcp30r',
  'toshiba-kuri-okowa',
  'panasonic-sekihan-nf-ac1000',
  'tiger-beef-matsutake-rice',
  'tiger-steamed-abalone-rice',
  'toshiba-chinese-sticky-rice-rcp30r',
  'tiger-oyster-mushroom-rice',
  'maff-aomori-goma-gohan',
  'zojirushi-corn-risotto',
  'zojirushi-turkish-risotto',
  'tatung-yugao-sakuraebi-rice',
  'tatung-tarako-kamameshi',
  'tatung-kumamoto-ebimeshi',
  'tatung-hijiki-umeboshi-rice',
  'tatung-tomato-pumpkin-rice',
  'tatung-seafood-porridge',
  'tatung-tuna-garlic-butter-rice',
  'startsmart-corn-lean-pork-porridge',
  'r58-sharp-matsusaka-pork-mushroom-rice',
  'r58-cookpot-salmon-milk-brown-rice-risotto',
  'r58-cookpot-corn-rice-beef-meatballs',
  'r60-tiger-basic-chicken-congee',
  'r60-tiger-takeout-vegetable-fried-rice',
  'taiwan-brown-rice-sishen-porridge',
  'r61-tiger-dried-shrimp-salted-kelp-brown-rice',
  'r61-tiger-chestnut-brown-rice',
  'r61-tiger-multigrain-medicinal-porridge',
  'r61-tiger-red-can-curry-pilaf',
  'r61-tiger-easy-khao-man-gai',
  'r61-tiger-broad-bean-rice',
  'tiger-post-196-gomoku-rice',
  'tiger-brown-rice-curry-pilaf',
  'maff-tokushima-omiisan',
  'philips-soy-milk-chicken-congee',
  'toshiba-steamed-sekihan-edion-rice-cooker',
  'panasonic-brown-rice-soybean-rice-nf-pc400',
  'tefal-risotto-milanese',
  'tefal-saffron-rice-seafood',
  'tiger-cheese-curry-pilaf',
  'tiger-hotaruika-rice',
  'tefal-homechef-mushroom-risotto',
  'zojirushi-kasuyose-el-mb30',
  'panasonic-nara-chagayu-nf-ac1000',
  'panasonic-bamboo-brown-rice-nf-pc400',
  'panasonic-chinese-sticky-rice-nf-pc400',
  'tefal-risotto-with-peas-r106322',
  'tefal-risotto-with-shrimps-r106225',
  'tefal-602-chicken-pea-risotto',
  'tefal-602-smoked-haddock-kedgeree',
  'tiger-crab-miso-rice-post6',
  'tiger-canned-curry-takikomi-pilaf',
  'tiger-seafood-paella-post118',
  'philips-corn-quinoa-vegetable-rice',
  'tefal-portuguese-rice-r106506',
  'tiger-usa-century-egg-fish-porridge',
  'panasonic-autocooker-seasoned-rice-kit',
  'instant-pot-easy-chicken-rice',
  'instant-pot-chicken-rice-soup',
  'instant-pot-chicken-satay-rice',
  'instant-pot-chicken-enchilada-rice',
  'instant-pot-spanish-chicken-rice',
  'global-greece-mushroom-mageiritsa',
  'qld-one-pot-beans-rice',
  'rda-korea-naengi-panbap',
  'unh-spanish-rice',
  'sdsu-easy-red-beans-rice',
  'urochester-smoky-hoppin-john',
  'firststeps-vegetable-biryani',
  'healthvermont-spinach-carrot-rice-pilaf',
  'ca-health-multigrain-congee',
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function sourceIdsFor(recipe) {
  return asArray(recipe?.source_refs).map(source => source?.source_id).filter(Boolean);
}

function contractSnapshot(recipe) {
  return {
    fixed_batch: clone(recipe?.fixed_batch || null),
    liquid_contract: clone(recipe?.liquid_contract || null),
    cooking_sequence: clone(recipe?.cooking_sequence || []),
    time_contract: clone(recipe?.time_contract || null),
    cooker_adaptation: {
      status: recipe?.cooker_adaptation?.status || null,
      appliance_model: recipe?.cooker_adaptation?.waterline?.appliance_model || null,
      program: recipe?.cooker_adaptation?.waterline?.program || null,
    },
  };
}

function sourceBoundedContract(recipe) {
  return {
    kind: 'exact_source_fixed_batch',
    scaling: 'fixed_batch_only',
    cross_appliance_conversion: false,
    fixed_batch: clone(recipe?.fixed_batch || null),
    liquid_contract: clone(recipe?.liquid_contract || null),
    cooking_sequence: clone(recipe?.cooking_sequence || []),
    time_contract: clone(recipe?.time_contract || null),
    cooker_adaptation: {
      status: recipe?.cooker_adaptation?.status || null,
      appliance_model: recipe?.cooker_adaptation?.waterline?.appliance_model || null,
      program: recipe?.cooker_adaptation?.waterline?.program || null,
      notes: recipe?.cooker_adaptation?.notes || null,
    },
  };
}

export function buildSourceBackedFormalRatioEvidence(catalog) {
  const recipes = asArray(catalog?.recipes);
  const byId = new Map(recipes.map(recipe => [recipe?.recipe_id, recipe]));
  const entries = TARGET_RECIPE_IDS.map(recipeId => {
    const recipe = byId.get(recipeId);
    if (!recipe) {
      return {
        rule_id: `source-evidence-${recipeId}-v1`,
        recipe_id: recipeId,
        source_ids: [],
        compile_status: 'blocked_missing_source_recipe',
        source_contract_snapshot: null,
      };
    }
    const sourceBounded = SOURCE_BOUNDED_TARGET_RECIPE_IDS.includes(recipeId);
    return {
      rule_id: `source-evidence-${recipeId}-v1`,
      recipe_id: recipeId,
      source_ids: sourceIdsFor(recipe),
      compile_status: sourceBounded ? 'source_bounded_non_executable' : 'candidate_evidence_only',
      executable: false,
      source_contract_snapshot: contractSnapshot(recipe),
      ...(sourceBounded ? { source_bounded_contract: sourceBoundedContract(recipe) } : {}),
      notes: [
        '快照只复制同一来源的份数、食材、液体、步骤、时长和器具边界。',
        '不做单位换算、不跨器具换算、不创建 per_serving 默认值。',
        sourceBounded
          ? '当前仅是固定批次来源合同，不是可缩放的 Ratio DSL；仍需厨房试做和真实旅程后才能进入正式 Planner。'
          : '要进入正式 Planner 仍需把此证据编译为模板/Ratio DSL，并完成厨房试做与真实旅程。',
      ],
    };
  });
  return {
    schema_version: 1,
    evidence_version: EVIDENCE_VERSION,
    source_catalog_version: catalog?.catalog_version || null,
    scope: 'source-backed-formal-ratio-evidence-only',
    policy: {
      evidence_only: true,
      no_estimated_values: true,
      no_cross_appliance_conversion: true,
      does_not_activate_formal_planner: true,
    },
    counts: {
      total: entries.length,
      candidate_evidence_only: entries.filter(entry => entry.compile_status === 'candidate_evidence_only').length,
      source_bounded_non_executable: entries.filter(entry => entry.compile_status === 'source_bounded_non_executable').length,
      blocked: entries.filter(entry => !['candidate_evidence_only', 'source_bounded_non_executable'].includes(entry.compile_status)).length,
    },
    entries,
  };
}

export function validateSourceBackedFormalRatioEvidence(evidence, catalog) {
  const errors = [];
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return ['evidence must be an object'];
  if (evidence.schema_version !== 1) errors.push('evidence.schema_version must be 1');
  if (evidence.evidence_version !== EVIDENCE_VERSION) errors.push('evidence.evidence_version is invalid');
  if (evidence.scope !== 'source-backed-formal-ratio-evidence-only') errors.push('evidence.scope is invalid');
  if (evidence.source_catalog_version !== catalog?.catalog_version) errors.push('evidence.source_catalog_version does not match source catalog');
  if (evidence.policy?.evidence_only !== true) errors.push('evidence.policy.evidence_only must be true');
  if (evidence.policy?.no_estimated_values !== true) errors.push('evidence.policy.no_estimated_values must be true');
  if (evidence.policy?.no_cross_appliance_conversion !== true) errors.push('evidence.policy.no_cross_appliance_conversion must be true');
  if (evidence.policy?.does_not_activate_formal_planner !== true) errors.push('evidence.policy.does_not_activate_formal_planner must be true');
  const catalogById = new Map(asArray(catalog?.recipes).map(recipe => [recipe?.recipe_id, recipe]));
  const expectedIds = new Set(TARGET_RECIPE_IDS);
  const seen = new Set();
  for (const entry of asArray(evidence.entries)) {
    if (!entry?.recipe_id) {
      errors.push('evidence entry recipe_id is required');
      continue;
    }
    if (seen.has(entry.recipe_id)) errors.push(`duplicate evidence recipe_id ${entry.recipe_id}`);
    seen.add(entry.recipe_id);
    if (!expectedIds.has(entry.recipe_id)) errors.push(`${entry.recipe_id} is not in the explicit ratio evidence target set`);
    const recipe = catalogById.get(entry.recipe_id);
    if (!recipe) {
      errors.push(`${entry.recipe_id} is not in source catalog`);
      continue;
    }
    const sourceIds = new Set(sourceIdsFor(recipe));
    if (!asArray(entry.source_ids).length) errors.push(`${entry.recipe_id} source_ids must not be empty`);
    for (const sourceId of asArray(entry.source_ids)) {
      if (!sourceIds.has(sourceId)) errors.push(`${entry.recipe_id} evidence source_id ${sourceId} is not attached to the recipe`);
    }
    if (!['candidate_evidence_only', 'source_bounded_non_executable'].includes(entry.compile_status)) {
      errors.push(`${entry.recipe_id} compile_status is invalid`);
    }
    const sourceBounded = SOURCE_BOUNDED_TARGET_RECIPE_IDS.includes(entry.recipe_id);
    if (sourceBounded && entry.compile_status !== 'source_bounded_non_executable') {
      errors.push(`${entry.recipe_id} must use source_bounded_non_executable compile_status`);
    }
    if (!sourceBounded && entry.compile_status !== 'candidate_evidence_only') {
      errors.push(`${entry.recipe_id} must remain candidate_evidence_only`);
    }
    const expectedSnapshot = contractSnapshot(recipe);
    if (JSON.stringify(entry.source_contract_snapshot) !== JSON.stringify(expectedSnapshot)) {
      errors.push(`${entry.recipe_id} source_contract_snapshot does not match source catalog`);
    }
    if (sourceBounded && JSON.stringify(entry.source_bounded_contract) !== JSON.stringify(sourceBoundedContract(recipe))) {
      errors.push(`${entry.recipe_id} source_bounded_contract does not match source catalog`);
    }
  }
  if (seen.size !== expectedIds.size) errors.push(`evidence entries must cover the explicit target set (${expectedIds.size})`);
  const expected = buildSourceBackedFormalRatioEvidence(catalog);
  if (JSON.stringify(evidence) !== JSON.stringify(expected)) errors.push('evidence does not match deterministic build');
  if (evidence.counts?.total !== expected.entries.length) errors.push('evidence counts.total is invalid');
  if (evidence.counts?.candidate_evidence_only !== expected.counts.candidate_evidence_only) errors.push('evidence counts.candidate_evidence_only is invalid');
  if (evidence.counts?.source_bounded_non_executable !== expected.counts.source_bounded_non_executable) errors.push('evidence counts.source_bounded_non_executable is invalid');
  if (evidence.counts?.blocked !== expected.counts.blocked) errors.push('evidence counts.blocked is invalid');
  return errors;
}

export const sourceBackedFormalRatioEvidenceVersion = EVIDENCE_VERSION;
export const sourceBackedFormalRatioEvidenceTargetRecipeIds = TARGET_RECIPE_IDS;
export const sourceBackedFormalRatioEvidenceSourceBoundedTargetRecipeIds = SOURCE_BOUNDED_TARGET_RECIPE_IDS;
