const freezeList = values => Object.freeze([...values]);

const action = ({
  exactSlotSets, requiredFacts = [], allowedFacts = requiredFacts,
  produces = [], consumes = [], mustPrecede = [], mustFollow = [], mustPrecedeAny = [],
  mustFollowAny = [], writer,
}) => Object.freeze({
  exact_slot_sets: Object.freeze(exactSlotSets.map(freezeList)),
  required_facts: freezeList(requiredFacts),
  allowed_facts: freezeList(allowedFacts),
  produces_resources: freezeList(produces),
  consumes_resources: freezeList(consumes),
  must_precede: freezeList(mustPrecede),
  must_follow: freezeList(mustFollow),
  must_precede_any: Object.freeze(mustPrecedeAny.map(freezeList)),
  must_follow_any: Object.freeze(mustFollowAny.map(freezeList)),
  writer,
});

export const RECIPE_ACTION_REGISTRY = Object.freeze({
  start_cured_pork_and_rice: action({
    exactSlotSets: [['protein', 'staple']],
    mustPrecede: ['add_locked_liquid'],
    writer: ({ refs }) => `将${refs}放入同一口锅中翻拌加热，至咸肉香气出现`,
  }),
  add_locked_liquid: action({
    exactSlotSets: [['staple'], ['liquid']],
    requiredFacts: ['total_liquid_grams'],
    mustPrecedeAny: [['cook_rice_until_tender', 'cook_rice_until_tender_before_late_greens', 'cook_cabbage_mushroom_rice']],
    writer: ({ refs, facts }) => `向${refs}中加入已锁定的总液体${facts.total_liquid_grams}克`,
  }),
  cook_rice_until_tender: action({
    exactSlotSets: [['staple']],
    mustPrecede: ['complete_recipe_safety'],
    writer: ({ refs }) => `加盖焖煮${refs}，直至米粒熟软且无硬芯`,
  }),
  cook_rice_until_tender_before_late_greens: action({
    exactSlotSets: [['staple']],
    mustFollowAny: [['start_cured_pork_and_rice']],
    mustPrecede: ['add_leafy_vegetable_late', 'complete_recipe_safety'],
    writer: ({ refs }) => `加盖焖煮${refs}，直至米粒熟软且无硬芯`,
  }),
  add_leafy_vegetable_late: action({
    exactSlotSets: [['fast_vegetable']],
    mustFollow: ['cook_rice_until_tender_before_late_greens'],
    mustPrecede: ['complete_recipe_safety'],
    writer: ({ refs }) => `临近收尾时加入${refs}，轻轻翻匀并煮至熟软`,
  }),
  brown_lamb_first: action({
    exactSlotSets: [['protein']],
    mustPrecede: ['cook_onion_and_carrot'],
    writer: ({ refs }) => `先将${refs}在同一口锅中翻炒至表面均匀变色`,
  }),
  cook_onion_and_carrot: action({
    exactSlotSets: [['aromatic', 'slow_vegetable']],
    mustFollow: ['brown_lamb_first'],
    mustPrecede: ['measure_retained_cooked_liquid'],
    writer: ({ refs }) => `加入${refs}同锅翻炒，使香味释放并开始软化`,
  }),
  measure_retained_cooked_liquid: action({
    exactSlotSets: [['protein']],
    requiredFacts: ['total_liquid_grams'],
    produces: ['retained_cooked_liquid'],
    mustFollow: ['cook_onion_and_carrot'],
    mustPrecede: ['add_raw_rice_to_retained_liquid'],
    writer: ({ refs, facts }) => `保留${refs}熟制后的锅内余液，量取锅内熟制余液，不足时补水至总液体${facts.total_liquid_grams}克`,
  }),
  add_raw_rice_to_retained_liquid: action({
    exactSlotSets: [['staple']],
    consumes: ['retained_cooked_liquid'],
    mustFollow: ['measure_retained_cooked_liquid'],
    mustPrecede: ['braise_lamb_rice_until_done'],
    writer: ({ refs }) => `将${refs}加入锅内已量好的熟制余液中，轻轻铺匀`,
  }),
  braise_lamb_rice_until_done: action({
    exactSlotSets: [['protein', 'staple', 'slow_vegetable']],
    mustFollow: ['add_raw_rice_to_retained_liquid'],
    mustPrecede: ['complete_recipe_safety'],
    writer: ({ refs }) => `加盖焖制${refs}，直至米粒熟软无硬芯、胡萝卜熟软且羊肉完全熟透`,
  }),
  start_cabbage_mushroom_and_rice: action({
    exactSlotSets: [['staple', 'mushroom', 'vegetable']],
    mustPrecede: ['add_locked_liquid'],
    writer: ({ refs }) => `将${refs}放入同一口锅中拌匀，使米、蔬菜和菌菇一同开始受热`,
  }),
  cook_cabbage_mushroom_rice: action({
    exactSlotSets: [['staple', 'mushroom', 'vegetable']],
    mustFollow: ['add_locked_liquid'],
    mustFollowAny: [['start_cabbage_mushroom_and_rice']],
    mustPrecede: ['complete_recipe_safety'],
    writer: ({ refs }) => `加盖焖煮${refs}，直至米粒熟软无硬芯、蔬菜和菌菇熟软`,
  }),
  break_up_ground_pork: action({
    exactSlotSets: [['protein']],
    mustPrecede: ['simmer_pork_and_beans'],
    writer: ({ refs }) => `先将${refs}在锅中拨散翻炒，使肉末均匀受热并彻底熟透`,
  }),
  measure_add_initial_and_reserve_liquid: action({
    exactSlotSets: [['liquid']],
    requiredFacts: ['initial_liquid_grams', 'reserve_liquid_grams'],
    produces: ['reserved_liquid'],
    mustPrecede: ['add_reserved_liquid_if_needed'],
    writer: ({ refs, facts }) => `先量好${refs}的全部用量，先加${facts.initial_liquid_grams}克，另留${facts.reserve_liquid_grams}克备用`,
  }),
  simmer_pork_and_beans: action({
    exactSlotSets: [['protein', 'vegetable']],
    mustFollow: ['break_up_ground_pork'],
    mustPrecede: ['add_fresh_noodle'],
    writer: ({ refs }) => `加入${refs}同锅焖煮，直至豆角熟软、猪肉完全熟透`,
  }),
  add_fresh_noodle: action({
    exactSlotSets: [['staple']],
    mustFollow: ['simmer_pork_and_beans'],
    mustPrecede: ['add_reserved_liquid_if_needed', 'complete_recipe_safety'],
    writer: ({ refs }) => `铺入${refs}，继续同锅焖煮至面条熟透无硬芯`,
  }),
  add_reserved_liquid_if_needed: action({
    exactSlotSets: [['liquid']],
    requiredFacts: ['reserve_liquid_grams'],
    consumes: ['reserved_liquid'],
    mustFollow: ['measure_add_initial_and_reserve_liquid', 'add_fresh_noodle'],
    mustPrecede: ['complete_recipe_safety'],
    writer: ({ refs, facts }) => `铺面后检查锅底；只有锅底偏干时，才补入预留的${facts.reserve_liquid_grams}克${refs}，不得另外加水`,
  }),
  complete_recipe_safety: action({
    exactSlotSets: [[]],
    writer: ({ safety }) => `继续同锅加热并逐项确认${safety}`,
  }),
});

export const RECIPE_SAFETY_EVIDENCE_REGISTRY = Object.freeze({
  pork_fully_cooked: refs => `${refs}完全熟透`,
  lamb_fully_cooked: refs => `${refs}完全熟透`,
  grain_tender_no_hard_center: refs => `${refs}熟软且无硬芯`,
  bean_fully_cooked: refs => `${refs}彻底熟透并软化`,
  noodle_tender: refs => `${refs}熟透无硬芯`,
  tender: refs => `${refs}熟软`,
});

// Keep the deterministic writer and the final safety proof on one reviewed
// vocabulary.  The generated-plan validator consumes these matchers for named
// recipes; generic templates retain their existing endpoint matchers.
export const RECIPE_SAFETY_EVIDENCE_PATTERNS = Object.freeze({
  pork_fully_cooked: /完全熟透/u,
  lamb_fully_cooked: /完全熟透/u,
  grain_tender_no_hard_center: /熟软且无硬芯/u,
  bean_fully_cooked: /彻底熟透并软化/u,
  noodle_tender: /熟透无硬芯/u,
  tender: /熟软/u,
});

export const RECIPE_SEASONING_WRITERS = Object.freeze({
  taste_before_salt: () => '先尝味，确认现有咸味后再决定是否需要额外加盐',
  add_locked_salt: ({ refs, facts }) => `加入${facts.salt_grams}克${refs}并拌匀`,
  add_locked_oil: ({ refs, facts }) => `加入${facts.oil_grams}克${refs}并拌匀`,
  omit_extra_salt: () => '保留食材原有咸味，不再额外加盐',
});
