import { normalizeRatioGrams } from './ratio-dsl.js';
import { normalizePlannerTaxonomyKey } from './planner-v2.js';
import { canonicalJson, selectRiceMealCandidates, sha256Hex } from './rice-meal-selector.js';
import {
  buildIngredientTermUniverse,
  renderAndValidateDeterministicLockedPlan,
} from './generated-plan-contract.js';

const TOKEN_VERSION = 1;
const TOKEN_PREFIX = 'rm1';
const ACTION_PHASES = Object.freeze(['pre_actions', 'start_actions', 'mid_actions', 'finish_actions']);
const CONTROLLED_SEASONING_IDS = new Set([
  'soy-sauce', 'cooking-wine', 'sesame-oil', 'oyster-sauce',
  'curry-block', 'sugar', 'salt', 'cooking-oil',
]);
const BASIC_EXTRA_IDS = new Set(['water', ...CONTROLLED_SEASONING_IDS]);
const CONTROLLED_SEASONING_COPY = Object.freeze({
  use_controlled_seasoning_outside_cooker: '在锅外处理食材时，加入{{g}}克{{s}}调味。',
  add_controlled_seasoning_before_start: '在启动程序前，把{{g}}克{{s}}加入内胆，与其他食材轻轻拌匀。',
  add_controlled_seasoning_after_cook: '程序结束并确认食材熟制合格后，加入{{g}}克{{s}}拌匀。',
});

const HOUSEHOLD_COPY = Object.freeze({
  'home-chicken-leg-potato-rice': Object.freeze({
    recommendation_reason: '鸡腿和土豆同锅焖熟，大米吸收肉香，按顺序完成就能端上桌。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      cut_chicken_leg_to_small_pieces: '将{{i2}}切成小块，方便在电饭煲中均匀熟透。',
      prepare_vegetables: '将{{i3}}切成大小相近的块，洗去表面淀粉。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}放入内胆，加入约量好的{{e1}}并轻轻铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}已经放好，盖好锅盖，启动标准煮饭程序。',
      rest_lid_closed: '程序结束后，让{{i1}}在盖好锅盖的状态下静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透，内部无粉红；{{i3}}熟软。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}轻轻翻松，盛出即可。',
    }),
  }),
  'home-corn-carrot-chicken-leg-rice': Object.freeze({
    recommendation_reason: '鸡腿、玉米和胡萝卜随大米同锅焖熟，食材搭配完整，适合直接作为一顿主餐。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      cut_chicken_leg_to_small_pieces: '将{{i2}}切成小块，方便在电饭煲中均匀熟透。',
      prepare_vegetables: '将{{i3}}洗净；{{i4}}切成大小均匀的小丁。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}放入内胆，加入约量好的{{e1}}并轻轻铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}已经放好，盖好锅盖，启动标准煮饭程序。',
      rest_lid_closed: '程序结束后，让{{i1}}在盖好锅盖的状态下静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透，内部无粉红；{{i4}}熟软。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}、{{i4}}轻轻翻松，盛出即可。',
    }),
  }),
  'home-green-bean-pork-rib-rice': Object.freeze({
    recommendation_reason: '排骨和豆角按熟化顺序处理，再与大米一起焖熟，适合一锅端上桌。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      pre_cook_pork_ribs_drain_and_discard_liquid: '将{{i2}}在锅外预煮至接近熟透，捞出并充分沥干；预煮液全部弃置，不计入另加清水。',
      drain_prepared_vegetables_before_loading: '将{{i3}}修剪两端后切成小段，洗净并充分沥干再入煲；不把食材自身出水冒充另加清水。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}放入内胆，加入量好的{{e1}}和{{e2}}并轻轻铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}已经放好，盖好锅盖，启动标准煮饭程序。',
      rest_lid_closed: '程序结束后，让{{i1}}在盖好锅盖的状态下静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}最厚可食部位达到74°C并完全熟透；{{i3}}煮熟软化，完全熟软且无生青色和豆腥味。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}轻轻翻松，盛出即可。',
    }),
  }),
  'source-sichuan-pork-ribs-rice': Object.freeze({
    recommendation_reason: '排骨先在锅外熟化，再与大米、玉米和胡萝卜闭盖焖熟；来源合同和项目校准克数分开标注。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      pre_cook_pork_ribs_outside_cooker: '将{{i2}}在锅外焯洗并煎至表面上色，再连同热汤一起准备入内胆。',
      prepare_vegetables: '将{{i3}}切粒、{{i4}}切丁，洗净并沥干。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}放入内胆，加入量好的{{e1}}并铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}已经放好，盖好锅盖，启动标准煮饭程序。',
      rest_lid_closed: '程序结束后，让{{i1}}继续盖好锅盖静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透；{{i4}}熟软。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}、{{i4}}从底部轻轻翻匀，盛出即可。',
    }),
  }),
  'home-mushroom-green-bean-pork-rib-rice': Object.freeze({
    recommendation_reason: '排骨、香菇和豆角按熟化顺序处理，再与大米一起焖熟，能在一锅里兼顾肉、菌菇和蔬菜。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      pre_cook_pork_ribs_drain_and_discard_liquid: '将{{i2}}在锅外预煮至接近熟透，捞出并充分沥干；预煮液全部弃置，不计入另加清水。',
      drain_prepared_vegetables_before_loading: '将{{i3}}切片；{{i4}}修剪两端后切成小段，分别洗净并充分沥干再入煲；不把食材自身出水冒充另加清水。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}放入内胆，加入量好的{{e1}}和{{e2}}并轻轻铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}已经放好，盖好锅盖，启动标准煮饭程序。',
      rest_lid_closed: '程序结束后，让{{i1}}在盖好锅盖的状态下静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}最厚可食部位达到74°C并完全熟透；{{i4}}煮熟软化，完全熟软且无生青色和豆腥味。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}、{{i4}}轻轻翻松，盛出即可。',
    }),
  }),
  'home-cabbage-tofu-rice': Object.freeze({
    recommendation_reason: '老豆腐随大米焖透，白菜在锅外熟制后再拌入，兼顾清爽口感和完整闭盖程序。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      pre_cook_tender_vegetables_drain_and_discard_liquid: '将{{i3}}洗净切好，在锅外加少量水焖至熟透，充分沥干；焖菜液全部弃置，不计入另加清水。',
      load_inner_pot: '把{{i1}}、{{i2}}放入内胆，加入量好的{{e1}}和{{e2}}并轻轻铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}已经放好，盖好锅盖，启动标准煮饭程序并保持锅盖关闭。',
      rest_lid_closed: '程序结束后，让{{i1}}在盖好锅盖的状态下静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}中心热透；锅外熟制的{{i3}}已经熟透且熟软。',
      fold_in_pre_cooked_ingredients: '把保留的{{i3}}拌入煮好的饭中，轻轻翻匀。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}轻轻翻松，盛出即可。',
    }),
  }),
  'home-broccoli-beef-rice': Object.freeze({
    recommendation_reason: '牛肉随大米完整焖熟，西兰花在锅外熟制后再拌入，兼顾一锅主餐和嫩蔬菜口感。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      prepare_raw_ingredients: '将{{i2}}切成薄而均匀的小片，避免叠成厚块。',
      pre_cook_tender_vegetables_drain_and_discard_liquid: '将{{i3}}洗净分成小朵，在锅外加少量水焖至熟透，充分沥干；焖菜液全部弃置，不计入另加清水。',
      load_inner_pot: '把{{i1}}、{{i2}}放入内胆，加入量好的{{e1}}和{{e2}}并轻轻铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}已经放好，盖好锅盖，启动标准煮饭程序并保持锅盖关闭。',
      rest_lid_closed: '程序结束后，让{{i1}}在盖好锅盖的状态下静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}薄片完全熟透且无生肉色；锅外熟制的{{i3}}已经熟透且熟软。',
      fold_in_pre_cooked_ingredients: '把保留的{{i3}}拌入煮好的饭中，轻轻翻匀。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}轻轻翻松，盛出即可。',
    }),
  }),
  'home-greens-minced-pork-rice': Object.freeze({
    recommendation_reason: '猪肉末先炒散熟化后随大米焖煮，青菜在锅外熟制后再拌入，步骤清楚并保持完整闭盖程序。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      brown_ground_pork_outside_cooker: '将{{i2}}放入炒锅中炒散，持续加热至完全变色且没有粉红生肉后备用。',
      pre_cook_tender_vegetables_outside_cooker: '将{{i3}}洗净切好，在炒锅中炒至熟软，保持温热待用。',
      load_inner_pot: '把{{i1}}、{{i2}}放入内胆，加入{{e1}}并轻轻铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}已经放好，盖好锅盖，启动标准煮饭程序并保持锅盖关闭。',
      rest_lid_closed: '程序结束后，让{{i1}}在盖好锅盖的状态下静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透且没有粉红生肉；锅外熟制的{{i3}}已经熟软。',
      fold_in_pre_cooked_ingredients: '把保留的{{i3}}拌入煮好的饭中，轻轻翻匀。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}轻轻翻松，盛出即可。',
    }),
  }),
  'home-taiwan-cabbage-rice': Object.freeze({
    recommendation_reason: '高丽菜、香菇和虾米先在锅外炒香，再与大米同煮；少量虾米只负责提鲜，不夸大它在整锅里的份量。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      prepare_raw_ingredients: '将{{i2}}切成宽丝，{{i3}}切片；{{i4}}快速冲洗后沥干。',
      pre_saute_materials_outside_cooker: '在锅外先将{{i4}}和{{i3}}炒出香味，再加入{{i2}}翻炒至略微变软。',
      load_inner_pot: '把{{i1}}和炒好的{{i2}}、{{i3}}、{{i4}}放入内胆，加入量好的{{e1}}并铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}已经放好，盖好锅盖，启动标准煮饭程序，中途不要开盖。',
      rest_lid_closed: '程序结束后，让{{i1}}继续盖好锅盖静置片刻，把水分吸收均匀。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}已经熟软；{{i4}}已经热透。',
      fluff_and_serve: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}从底部轻轻翻匀，盛出即可。',
    }),
  }),
  'home-taiwan-pumpkin-rice': Object.freeze({
    recommendation_reason: '南瓜、猪肉末、香菇和虾米先炒出香味，再与大米同煮，兼顾主食、蛋白质和蔬菜。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      prepare_raw_ingredients: '将{{i2}}切成小块，{{i3}}拨散，{{i4}}切片；{{i5}}快速冲洗后沥干。',
      pre_saute_materials_outside_cooker: '在锅外先炒散{{i3}}至没有粉红生肉，再加入{{i5}}、{{i4}}和{{i2}}翻炒出香味。',
      load_inner_pot: '把{{i1}}和炒好的{{i2}}、{{i3}}、{{i4}}、{{i5}}放入内胆，加入量好的{{e1}}并铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}已经放好，盖好锅盖，启动标准煮饭程序，中途不要开盖。',
      rest_lid_closed: '程序结束后，让{{i1}}继续盖好锅盖静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}已经熟软；{{i3}}完全熟透且没有粉红生肉；{{i5}}已经热透。',
      fluff_and_serve: '轻轻翻匀{{i1}}、{{i2}}、{{i3}}、{{i4}}和{{i5}}，盛出即可。',
    }),
  }),
  'home-curry-chicken-rice': Object.freeze({
    recommendation_reason: '鸡肉、土豆、胡萝卜和洋葱随咖喱与大米同煮，材料完整，适合作为一顿省事主餐。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      prepare_raw_ingredients: '将{{i2}}切成大小均匀的小块，避免厚块叠在一起。',
      prepare_vegetables: '将{{i3}}、{{i4}}和{{i5}}切成大小接近的小块；{{i4}}切好后冲去表面淀粉。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}放入内胆，加入量好的{{e1}}并铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}已经放好，盖好锅盖，启动标准煮饭程序，中途不要开盖。',
      rest_lid_closed: '程序结束后，让{{i1}}继续盖好锅盖静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透、内部无粉红；{{i3}}、{{i4}}和{{i5}}都已经熟软。',
      fluff_and_serve: '从底部轻轻翻匀{{i1}}、{{i2}}、{{i3}}、{{i4}}和{{i5}}，让咖喱均匀裹住米饭后盛出。',
    }),
  }),
  'home-sausage-mixed-rice': Object.freeze({
    recommendation_reason: '腊肠、青豌豆、香菇、玉米和胡萝卜与大米同煮，材料多样但步骤集中，适合电饭煲一次完成。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      prepare_raw_ingredients: '将{{i2}}切成薄片，避免腊肠叠成厚块。',
      prepare_vegetables: '将{{i3}}洗净，{{i4}}切片，{{i5}}沥干，{{i6}}切成小丁。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}放入内胆，加入量好的{{e1}}并铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}已经放好，盖好锅盖，启动标准煮饭程序，中途不要开盖。',
      rest_lid_closed: '程序结束后，让{{i1}}继续盖好锅盖静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}已经完全熟透；{{i3}}和{{i6}}已经熟软。',
      fluff_and_serve: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}从底部轻轻翻匀，盛出即可。',
    }),
  }),
  'home-beef-mixed-rice': Object.freeze({
    recommendation_reason: '牛肉末、胡萝卜和洋葱与大米同煮，蛋白质和蔬菜份量都按两人主餐校准。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      prepare_raw_ingredients: '将{{i2}}拨散，避免结成厚块。',
      prepare_vegetables: '将{{i3}}切成小丁，{{i4}}切碎。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}放入内胆，加入量好的{{e1}}并铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}和{{i4}}已经放好，盖好锅盖，启动标准煮饭程序，中途不要开盖。',
      rest_lid_closed: '程序结束后，让{{i1}}继续盖好锅盖静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透且没有生肉色；{{i3}}和{{i4}}已经熟软。',
      fluff_and_serve: '把{{i1}}、{{i2}}、{{i3}}和{{i4}}轻轻翻匀，盛出即可。',
    }),
  }),
  'home-bamboo-vegetable-rice': Object.freeze({
    recommendation_reason: '竹笋、木耳、胡萝卜和洋葱占主要份量，少量猪肉末只负责增香，整锅以清爽和丰富口感为主。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      prepare_dried_wood_ear: '按包装说明泡发{{i6}}，修剪硬蒂后另用清水充分冲洗、沥干并切成小片。',
      prepare_raw_ingredients: '将{{i2}}拨散，避免结成厚块。',
      prepare_vegetables: '将{{i3}}切片，{{i4}}和{{i5}}切成小丁。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}放入内胆，加入量好的{{e1}}并铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}已经放好，盖好锅盖，启动标准煮饭程序，中途不要开盖。',
      rest_lid_closed: '程序结束后，让{{i1}}继续盖好锅盖静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透且没有粉红生肉；{{i3}}和{{i5}}已经熟软；{{i6}}已经热透。',
      fluff_and_serve: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}轻轻翻匀，盛出即可。',
    }),
  }),
  'home-mixed-chicken-rice': Object.freeze({
    recommendation_reason: '鸡肉、油炸豆腐、牛蒡、胡萝卜和香菇与大米同煮，蛋白质和蔬菜都达到两人主餐的实质份量。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      prepare_raw_ingredients: '将{{i2}}切成均匀小块，{{i3}}切成容易入口的小块。',
      prepare_vegetables: '将{{i4}}切细条，{{i5}}切成小丁，{{i6}}切片。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}放入内胆，加入量好的{{e1}}并铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}已经放好，盖好锅盖，启动标准煮饭程序，中途不要开盖。',
      rest_lid_closed: '程序结束后，让{{i1}}继续盖好锅盖静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透、内部无粉红；{{i3}}已经热透；{{i4}}和{{i5}}已经熟软。',
      fluff_and_serve: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}轻轻翻匀，盛出即可。',
    }),
  }),
  'home-fresh-shiitake-rice': Object.freeze({
    recommendation_reason: '鲜香菇是这道饭的主角，少量鸡肉只负责增香，芹菜提供清香和蔬菜口感。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      prepare_raw_ingredients: '将{{i2}}切成小丁，避免叠成厚块。',
      prepare_vegetables: '将{{i3}}切片，{{i4}}切成小丁。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}放入内胆，加入量好的{{e1}}并铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}和{{i4}}已经放好，盖好锅盖，启动标准煮饭程序，中途不要开盖。',
      rest_lid_closed: '程序结束后，让{{i1}}继续盖好锅盖静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透、内部无粉红；{{i4}}已经熟软。',
      fluff_and_serve: '把{{i1}}、{{i2}}、{{i3}}和{{i4}}轻轻翻匀，盛出即可。',
    }),
  }),
  'shanghai-salted-pork-rice': Object.freeze({
    recommendation_reason: '这种安排兼顾地方风味、清爽口感和完整熟制。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      prepare_raw_ingredients: '将{{i2}}切成薄而均匀的小片，先试咸味，不额外加盐。',
      prepare_vegetables: '将{{i3}}洗净切段，充分沥干，单独放在手边备用。',
      load_inner_pot: '把{{i1}}和{{i2}}放入内胆，加入约量好的{{e1}}并轻轻铺平。',
      start_closed_lid_program: '确认{{i1}}和{{i2}}已经放好，盖好锅盖，启动标准煮饭程序；确认机器能显示剩余时间，并允许短暂开盖后自动继续。',
      add_reserved_leafy_vegetable: '煮饭程序剩约10分钟时，开盖把{{i3}}铺在饭面，不翻动米饭；30秒内合盖，让原程序继续。',
      rest_lid_closed: '程序结束后，让{{i1}}继续盖好锅盖焖5分钟。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透；{{i3}}已经熟软。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}轻轻翻匀，盛出即可。',
    }),
  }),
  'source-tatung-beef-burdock-rice': Object.freeze({
    recommendation_reason: '牛肉和牛蒡与大米同锅炊熟，保留大同电锅水位与外锅水边界，适合作为两人校准预览。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放入大同内锅。',
      prepare_raw_ingredients: '将{{i2}}切薄片；{{i3}}切丝并浸泡后沥干。',
      pre_saute_materials_outside_cooker: '在锅外先把{{i2}}炒至表面变色并出香味，再准备入内锅。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}放入大同内锅，加入称好的{{e1}}并铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}已经放好，盖好大同锅盖，外锅加入说明量的水，启动炊饭程序并保持锅盖关闭。',
      rest_lid_closed: '程序跳起后保持盖好锅盖，静置片刻让{{i1}}吸收余水。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透、内部无粉红；{{i3}}熟软。',
      fluff_and_serve: '从底部把{{i1}}、{{i2}}、{{i3}}轻轻翻匀，盛出即可。',
    }),
  }),
  'source-tiger-pork-bamboo-rice': Object.freeze({
    recommendation_reason: '五花肉和竹笋随大米在 Tiger 炊込み程序中闭盖完成，先按指定机型做校准预览。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放入 Tiger 内锅。',
      prepare_raw_ingredients: '将{{i2}}切条；{{i3}}切片并沥干。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}放入内锅，加入称好的{{e1}}并铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}已经放好，盖好锅盖，选择 Tiger 炊込み/混合饭程序，启动后保持闭盖。',
      rest_lid_closed: '程序结束后继续焖片刻，让{{i1}}吸收余水。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透；{{i3}}熟软。',
      fluff_and_serve: '从底部轻轻翻松{{i1}}、{{i2}}、{{i3}}，盛出即可。',
    }),
  }),
  'source-tatung-pork-daikon-rice': Object.freeze({
    recommendation_reason: '五花肉、白萝卜、胡萝卜和油炸豆腐与大米同锅焖熟，保留大同水位线边界作为校准预览。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放入大同内锅。',
      prepare_raw_ingredients: '将{{i2}}切片；{{i3}}、{{i4}}切丁；{{i5}}切丁后沥干。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}放入内锅，按来源水位线加入{{e1}}并铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}已经放好，盖好大同锅盖，外锅加入说明量的水，启动炊饭程序并保持闭盖。',
      rest_lid_closed: '程序跳起后保持盖好锅盖焖片刻，让{{i1}}吸收余水。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透；{{i3}}、{{i4}}熟软；{{i5}}热透。',
      fluff_and_serve: '从底部把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}轻轻翻匀，盛出即可。',
    }),
  }),
  'source-tatung-wakayama-ginger-rice': Object.freeze({
    recommendation_reason: '鸡胸肉、生姜、胡萝卜和油炸豆腐与大米同锅炊熟，限定大同器具并保留校准提示。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放入大同内锅。',
      prepare_raw_ingredients: '将{{i2}}切薄片；{{i3}}切片；{{i4}}切丝；{{i5}}切片后沥干。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}放入内锅，按校准合同加入称好的{{e1}}并铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}已经放好，盖好大同锅盖，外锅加入说明量的水，启动炊饭程序并保持闭盖。',
      rest_lid_closed: '程序跳起后继续焖片刻，让{{i1}}吸收余水。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透、内部无粉红；{{i3}}、{{i4}}熟软；{{i5}}热透。',
      fluff_and_serve: '从底部把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}轻轻翻匀，盛出即可。',
    }),
  }),
  'source-taiwan-tatung-cabbage-rice': Object.freeze({
    recommendation_reason: '高丽菜、猪肉、香菇和虾米先炒香，再按大同电锅来源流程与大米同锅完成；项目克数仍是两人校准起点。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}，按来源浸泡后沥干备用。',
      prepare_raw_ingredients: '将{{i2}}切丝并腌制；{{i3}}切丝；{{i4}}泡软切丝；{{i5}}冲洗沥干；{{i6}}切片。',
      pre_saute_materials_outside_cooker: '锅外依序炒香{{i6}}、{{i4}}和{{i5}}，再炒{{i2}}，最后加入{{i3}}拌匀。',
      load_inner_pot: '把炒好的{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}与{{i1}}放入大同内锅，加入称好的{{e1}}并铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}已放好，盖好大同锅盖并启动炊饭程序。',
      rest_lid_closed: '大同开关跳起后让{{i1}}继续盖好锅盖静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透；{{i4}}软化；{{i5}}热透。',
      fluff_and_serve: '从底部把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}轻轻翻匀，盛出即可。',
    }),
  }),
  'source-zojirushi-pork-vegetable-rice': Object.freeze({
    recommendation_reason: '猪肉先按象印来源汆烫调味，再与米、卷心菜、甜椒和生姜在EL-NS23自动菜单中完成；不外推到其他机型。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放入象印EL-NS23内锅。',
      prepare_raw_ingredients: '将{{i2}}切成一口大小并先汆烫、调味；{{i3}}切丝；{{i4}}切丝；{{i5}}切丝。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}放入EL-NS23内锅，加入称好的{{e1}}并铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}已放好，装回象印本体并启动来源自动菜单。',
      rest_lid_closed: '程序结束后保持盖好锅盖静置片刻，让{{i1}}吸收余水。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透且内部无粉红。',
      fluff_and_serve: '先取出{{i2}}，把{{i1}}与{{i3}}、{{i4}}、{{i5}}轻轻拌松后分别盛出。',
    }),
  }),
  'source-panasonic-nf-pc400-takikomi-rice': Object.freeze({
    recommendation_reason: 'Panasonic NF-PC400将鸡腿肉、牛蒡、魔芋和干香菇按来源顺序铺在大米上，使用指定自动调理程序；设备边界不跨机型。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放入Panasonic NF-PC400内锅。',
      prepare_raw_ingredients: '将{{i2}}切小块；{{i3}}切丝浸泡；{{i4}}切丝；{{i5}}泡发切丝；{{i6}}切丝，全部沥干备用。',
      load_inner_pot: '把{{i1}}和{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}按来源铺在内锅米面，加入称好的{{e1}}并保持不混米。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}已按来源铺平，盖好NF-PC400锅盖并启动自动调理程序；压力完全释放前不要开盖。',
      rest_lid_closed: '程序结束并确认压力完全释放后，让{{i1}}在开盖前静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透，内部无粉红；{{i3}}、{{i5}}、{{i6}}熟软；{{i4}}热透。',
      fluff_and_serve: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}轻轻拌匀，按来源不保温并立即盛出。',
    }),
  }),
  'source-panasonic-khao-man-gai': Object.freeze({
    recommendation_reason: '鸡腿与大米同锅完成，使用Panasonic NF-AC1000中压程序；设备边界和禽肉安全终点保持不变。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}，按来源浸泡后充分沥干。',
      prepare_raw_ingredients: '将{{i2}}扎孔并调味；{{i3}}切片；{{i4}}捣泥；{{i5}}切段。',
      load_inner_pot: '把{{i1}}、{{i3}}、{{i4}}、{{i5}}放入NF-AC1000内锅并加入称好的{{e1}}；最后把{{i2}}鸡皮朝下铺在米面。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}已放入，盖好NF-AC1000锅盖，选择来源中压程序并启动；减压完成前不要开盖。',
      rest_lid_closed: '压力完全释放后，让{{i1}}保持锅盖关闭静置片刻，再开盖检查。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透，内部无粉红。',
      fluff_and_serve: '将{{i1}}轻轻翻松，与{{i2}}和{{i3}}、{{i4}}、{{i5}}按来源装盘。',
    }),
  }),
  'source-zojirushi-okayama-ebimeshi': Object.freeze({
    recommendation_reason: '虾和洋葱按象印EL-NS23冈山虾饭来源先炒后炊，鸡蛋出锅后另锅炒熟再拌入；仅限指定机型的来源校准预览。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放入象印EL-NS23内锅。',
      prepare_raw_ingredients: '将{{i2}}去除明显杂质；{{i3}}切丝；{{i4}}打散；{{i5}}切葱花。',
      pre_saute_materials_outside_cooker: '锅外先炒香{{i3}}，再加入{{i2}}炒至表面变色；关火备用。',
      load_inner_pot: '将{{i1}}放入内锅，按校准合同加入称好的{{e1}}，把炒好的{{i2}}和{{i3}}、{{i4}}、{{i5}}铺在米面上。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}已放入，装回象印EL-NS23并启动来源“えびめし”自动菜单；炊饭期间保持闭盖。',
      rest_lid_closed: '程序结束后让{{i1}}保持盖好锅盖静置片刻。',
      verify_safety_endpoints: '开盖检查{{i1}}熟软且无硬芯、{{i2}}完全熟透；另锅炒{{i4}}至完全凝固。',
      fluff_and_serve: '把{{i1}}、{{i2}}与{{i3}}轻轻翻松，拌入已熟的{{i4}}和{{i5}}后盛出。',
    }),
  }),
  'source-cookpot-beef-wild-mushroom-rice': Object.freeze({
    recommendation_reason: '牛肉、洋葱和野菇按鍋寶316电锅来源分层入锅；项目称重合同是两人校准起点，不外推其他机型。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放入鍋寶内锅。',
      prepare_raw_ingredients: '将{{i2}}切薄片；{{i3}}切丝；{{i4}}和{{i5}}泡发或切片后沥干。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}按来源分层放入内锅，加入称好的{{e1}}。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}已放入，鍋寶外锅加来源指定的水并启动煮饭；中途保持闭盖。',
      rest_lid_closed: '开关跳起后让{{i1}}保持盖好锅盖静置片刻。',
      verify_safety_endpoints: '开盖检查{{i1}}熟软且无硬芯，{{i2}}中心完全熟透，{{i4}}和{{i5}}已软化。',
      fluff_and_serve: '从底部把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}轻轻翻匀后盛出。',
    }),
  }),
  'source-tatung-hainan-chicken-rice': Object.freeze({
    recommendation_reason: '海南鸡饭保留大同电锅来源的先蒸鸡、保留第一轮液体、再煮大米分阶段流程；不是普通电饭煲一键同锅承诺。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      prepare_raw_ingredients: '将{{i2}}用{{i3}}、{{i4}}、{{i5}}和来源调味料腌好；保留第一轮产生的液体。',
      load_inner_pot: '第一轮完成后，把{{i1}}放入大同内锅，加入保留液体并补入称好的{{e1}}至水位线，再把{{i2}}和{{i3}}、{{i4}}、{{i5}}按来源处理。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}已按来源放入，大同外锅按来源加水：先完成鸡肉蒸制，再完成第二轮大米炊煮；不在压力或普通电饭煲上套用。',
      rest_lid_closed: '第二轮开关跳起后让{{i1}}保持盖好锅盖静置片刻。',
      verify_safety_endpoints: '切片前检查{{i2}}中心完全熟透、内部无粉红并达到禽肉安全终点，{{i1}}熟软且无硬芯。',
      fluff_and_serve: '把{{i1}}翻松，与切片{{i2}}及{{i3}}、{{i4}}、{{i5}}按来源装盘。',
    }),
  }),
  'source-tatung-pork-jowl-sesame-rice': Object.freeze({
    recommendation_reason: '五花肉、干香菇和虾米先按大同来源炒香，再与大米和保留液体炊饭；仅作大同电锅校准预览。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干备用。',
      prepare_raw_ingredients: '将{{i2}}切片；{{i3}}泡软切片并保留泡发液；{{i4}}冲洗；{{i5}}切片。',
      pre_saute_materials_outside_cooker: '锅外炒香{{i4}}、{{i5}}和{{i3}}，加入{{i2}}炒至表面变色，关火备用。',
      load_inner_pot: '把炒好的{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}放入大同内锅，加入称好的{{e1}}。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}已放入，大同外锅按来源加水并启动炊饭程序；全程保持闭盖。',
      rest_lid_closed: '开关跳起后让{{i1}}保持盖好锅盖静置片刻。',
      verify_safety_endpoints: '开盖检查{{i1}}熟软且无硬芯，{{i2}}中心完全熟透，{{i3}}已软化，{{i4}}热透。',
      fluff_and_serve: '从底部把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}轻轻翻匀后盛出。',
    }),
  }),
  'source-tiger-chinese-sticky-rice': Object.freeze({
    recommendation_reason: '糯米、五花肉和配料按 Tiger 中华おこわ来源先浸泡、锅外炒香，再限指定炊込み机型闭盖完成；项目两人量仅作校准起点。',
    steps: Object.freeze({
      rinse_raw_rice: '将{{i1}}按来源浸泡后沥干备用，不把泡发液直接计入另加水。',
      prepare_raw_ingredients: '将{{i2}}切片，{{i3}}泡发切片，{{i4}}冲洗，{{i5}}和{{i6}}切好并沥干。',
      pre_saute_materials_outside_cooker: '锅外先炒{{i2}}至熟透，再加入{{i3}}、{{i4}}、{{i5}}、{{i6}}炒香，关火备用。',
      load_inner_pot: '把沥干的{{i1}}和炒好的{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}放入指定 Tiger 内锅，加入称好的{{e1}}。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}已按来源装好，选择 Tiger おこわ/炊込み程序并全程闭盖。',
      rest_lid_closed: '程序结束后让{{i1}}继续盖好锅盖静置片刻。',
      verify_safety_endpoints: '开盖检查{{i1}}熟软且无硬芯，{{i2}}完全熟透且内部无粉红，{{i3}}、{{i4}}、{{i5}}、{{i6}}已热透或熟软。',
      fluff_and_serve: '从底部将{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}轻轻翻匀后盛出。',
    }),
  }),
  'source-panasonic-claypot-style-chicken-rice': Object.freeze({
    recommendation_reason: '鸡腿和香菇按 Panasonic Claypot Style Chicken Rice 来源腌制后与米同锅完成；仅限指定 Panasonic 程序，项目两人量是校准起点。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放入指定 Panasonic 内锅。',
      prepare_raw_ingredients: '将{{i2}}按来源腌制后，{{i3}}泡发切片并沥干。',
      load_inner_pot: '把{{i1}}、腌好的{{i2}}和{{i3}}放入内锅，加入称好的{{e1}}并铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}已放入，按来源选择 WHITE RICE/CASSEROLE 程序并保持闭盖。',
      rest_lid_closed: '程序结束后让{{i1}}保持盖好锅盖静置片刻。',
      verify_safety_endpoints: '开盖检查{{i1}}熟软且无硬芯，{{i2}}最厚处完全熟透且内部无粉红，{{i3}}已软化。',
      fluff_and_serve: '从底部将{{i1}}、{{i2}}、{{i3}}轻轻翻匀后盛出。',
    }),
  }),
  'source-tatung-tomato-pumpkin-rice': Object.freeze({
    recommendation_reason: '番茄、南瓜和培根按大同官方炊饭来源与大米同锅完成；项目两人量是大同 M 号指定机型的校准起点。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放入大同 M 号内锅。',
      prepare_raw_ingredients: '将{{i2}}切丁、{{i3}}切块、{{i4}}切段并确认培根来源状态适合加热。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}放入内锅，加入称好的{{e1}}并铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}已放好，按大同 M 号来源程序启动并保持闭盖。',
      rest_lid_closed: '程序结束后让{{i1}}继续盖好锅盖静置片刻。',
      verify_safety_endpoints: '开盖检查{{i1}}熟软且无硬芯，{{i2}}、{{i3}}熟软，{{i4}}已热透。',
      fluff_and_serve: '从底部将{{i1}}、{{i2}}、{{i3}}、{{i4}}轻轻翻匀后盛出。',
    }),
  }),
  'source-nih-medlineplus-chicken-rice': Object.freeze({
    recommendation_reason: 'MedlinePlus/NHLBI来源保留普通大锅分阶段边界；项目两人量只是校准起点，先按页面顺序试做。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，按来源准备备用。',
      prepare_raw_ingredients: '将{{i2}}切块；{{i3}}切块；{{i4}}切丁；{{i5}}切段；{{i6}}切片；{{i7}}沥干备用。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}、{{i7}}装入锅中，加入称好的{{e1}}。',
      start_closed_lid_program: '先加热{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}、{{i7}}；取出{{i2}}后继续加热{{i1}}，末段回锅并保持锅盖关闭。',
      rest_lid_closed: '完成后让{{i1}}静置片刻再翻松。',
      verify_safety_endpoints: '检查{{i1}}熟软且无硬芯；{{i2}}完全熟透，内部无粉红；{{i3}}、{{i4}}、{{i5}}、{{i6}}、{{i7}}熟软。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}、{{i4}}、{{i5}}、{{i6}}、{{i7}}翻松并盛出。',
    }),
  }),
  'source-tiger-chicken-bamboo-rice': Object.freeze({
    recommendation_reason: '指定程序和投料边界已锁定；项目两人量是校准起点，先按页面顺序试做。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放入指定Tiger内锅。',
      prepare_raw_ingredients: '将{{i2}}切成小丁；确认{{i3}}已按来源煮熟去皮后切薄片；{{i4}}切丝备用。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}铺入Tiger内锅，加入称好的{{e1}}并保持米面平整。',
      start_closed_lid_program: '盖好锅盖，将{{i1}}、{{i2}}、{{i3}}、{{i4}}按指定程序完成并保持闭盖。',
      rest_lid_closed: '程序结束后继续盖好锅盖静置片刻，让{{i1}}吸收余液。',
      verify_safety_endpoints: '检查{{i1}}熟软且无硬芯；{{i2}}完全熟透，内部无粉红；{{i3}}熟软；{{i4}}热透。',
      fluff_and_serve: '从底部轻轻翻松{{i1}}、{{i2}}、{{i3}}、{{i4}}后盛出。',
    }),
  }),
});

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function riceMealError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function invalidToken() {
  return riceMealError('invalid_plan_token');
}

function stalePlan() {
  return riceMealError('stale_plan');
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function integerServings(value) {
  return Number.isInteger(value) && value >= 1 && value <= 8 ? value : null;
}

function sortedUniqueStrings(value) {
  if (!Array.isArray(value) || value.some(entry => !nonEmptyString(entry))) return null;
  const trimmed = value.map(entry => entry.trim());
  if (new Set(trimmed).size !== trimmed.length) return null;
  return trimmed.sort((left, right) => left.localeCompare(right, 'en'));
}

function stableRows(value, normalizer) {
  if (!Array.isArray(value)) return null;
  const rows = value.map(normalizer);
  if (rows.some(row => row == null)) return null;
  return rows.sort((left, right) => canonicalJson(left).localeCompare(canonicalJson(right), 'en'));
}

function canonicalActionProtocol(executionActions) {
  if (!isPlainObject(executionActions)) return null;
  const protocol = [];
  for (const phase of ACTION_PHASES) {
    const source = phase === 'mid_actions' && executionActions[phase] === undefined
      ? []
      : executionActions[phase];
    if (!Array.isArray(source)) return null;
    const actions = source.map(action => {
      const ingredientIds = sortedUniqueStrings(action?.ingredient_ids);
      if (!Number.isInteger(action?.order) || action.order < 1
          || !nonEmptyString(action?.action_code) || ingredientIds == null) return null;
      return {
        order: action.order,
        action_code: action.action_code.trim(),
        ingredient_ids: ingredientIds,
        ...(phase === 'mid_actions' ? {
          timing_basis: nonEmptyString(action.timing_basis),
          timing_min: action.timing_min,
          timing_max: action.timing_max,
          max_open_seconds: action.max_open_seconds,
          placement: nonEmptyString(action.placement),
          resume_policy: nonEmptyString(action.resume_policy),
          required_post_close_minutes: action.required_post_close_minutes,
        } : {}),
        ...(phase === 'finish_actions' && action.action_code === 'rest_lid_closed'
          && Number.isInteger(action.rest_minutes) ? { rest_minutes: action.rest_minutes } : {}),
      };
    });
    if (actions.some(action => action == null)) return null;
    if (phase === 'mid_actions' && actions.some(action => (
      !action.timing_basis || !action.placement || !action.resume_policy
      || !Number.isInteger(action.timing_min) || !Number.isInteger(action.timing_max)
      || !Number.isInteger(action.max_open_seconds)
      || !Number.isInteger(action.required_post_close_minutes)
    ))) return null;
    actions.sort((left, right) => left.order - right.order
      || left.action_code.localeCompare(right.action_code, 'en'));
    if (new Set(actions.map(action => action.order)).size !== actions.length) return null;
    protocol.push({ phase, actions });
  }
  return protocol;
}

function canonicalSnapshotItem(row) {
  if (!isPlainObject(row)) return null;
  if (row.kind === 'recognized') {
    const canonicalId = nonEmptyString(row.canonical_id);
    const state = row.state == null ? null : nonEmptyString(row.state);
    const shapeOrCut = row.shape_or_cut == null ? null : nonEmptyString(row.shape_or_cut);
    if (!canonicalId || (row.state != null && !state) || (row.shape_or_cut != null && !shapeOrCut)) return null;
    return {
      kind: 'recognized',
      canonical_id: canonicalId,
      state,
      shape_or_cut: shapeOrCut,
    };
  }
  if (row.kind === 'unrecognized') {
    const raw = nonEmptyString(row.raw);
    if (!raw || normalizePlannerTaxonomyKey(raw) !== raw) return null;
    return { kind: 'unrecognized', raw };
  }
  return null;
}

function canonicalRequestSnapshot(snapshot) {
  if (!isPlainObject(snapshot)) return null;
  const catalogVersion = nonEmptyString(snapshot.catalog_version);
  const riceCatalogScope = nonEmptyString(snapshot.rice_catalog_scope);
  const servings = integerServings(snapshot.servings);
  const normalizedItems = stableRows(snapshot.normalized_items, canonicalSnapshotItem);
  const availableBasicItems = stableRows(snapshot.available_basic_items || [], canonicalSnapshotItem);
  const dislikes = stableRows(snapshot.dislikes, dislike => {
    const normalized = nonEmptyString(dislike);
    return normalized && normalizePlannerTaxonomyKey(normalized) === normalized ? normalized : null;
  });
  if (!catalogVersion || !['ready', 'calibration'].includes(riceCatalogScope)
      || servings == null || normalizedItems == null || availableBasicItems == null || dislikes == null
      || new Set([...normalizedItems, ...availableBasicItems].map(canonicalJson)).size
        !== normalizedItems.length + availableBasicItems.length
      || new Set(dislikes).size !== dislikes.length) return null;
  return {
    catalog_version: catalogVersion,
    rice_catalog_scope: riceCatalogScope,
    servings,
    normalized_items: normalizedItems,
    available_basic_items: availableBasicItems,
    dislikes,
  };
}

function canonicalCandidateFacts(candidate) {
  if (!isPlainObject(candidate) || !isPlainObject(candidate.plan_snapshot)) return null;
  const snapshot = candidate.plan_snapshot;
  const requestSnapshot = canonicalRequestSnapshot(snapshot);
  const substitutions = stableRows(candidate.substitutions, row => {
    const target = nonEmptyString(row?.target_canonical_id);
    const input = nonEmptyString(row?.input_canonical_id);
    const kind = nonEmptyString(row?.kind);
    return target && input && kind ? {
      target_canonical_id: target,
      input_canonical_id: input,
      kind,
    } : null;
  });
  const safetyEndpoints = stableRows(candidate.safety_endpoints, row => {
    const canonicalId = nonEmptyString(row?.canonical_ingredient_id);
    const endpointCode = nonEmptyString(row?.endpoint_code);
    if (!canonicalId || !endpointCode) return null;
    return {
      canonical_ingredient_id: canonicalId,
      endpoint_code: endpointCode,
    };
  });
  const controlledSeasonings = stableRows(candidate.controlled_seasonings, row => {
    const canonicalId = nonEmptyString(row?.canonical_ingredient_id);
    const amountRuleId = nonEmptyString(row?.amount_rule_id);
    const phase = nonEmptyString(row?.phase);
    const actionCode = nonEmptyString(row?.action_code);
    if (!canonicalId || !amountRuleId || row?.required !== true || !phase || !actionCode) return null;
    return {
      canonical_ingredient_id: canonicalId,
      amount_rule_id: amountRuleId,
      required: true,
      phase,
      action_code: actionCode,
    };
  });
  const fields = [
    candidate.plan_id,
    candidate.catalog_version,
    candidate.family_id,
    candidate.variant_id,
    candidate.ratio_catalog_version,
    candidate.ratio_facts_hash,
    candidate.source_evidence_ledger_version,
    candidate.source_evidence_hash,
  ].map(nonEmptyString);
  const taxonomyVersion = nonEmptyString(candidate.taxonomy_version);
  const taxonomyHash = nonEmptyString(candidate.taxonomy_hash);
  const riceCatalogScope = nonEmptyString(candidate.rice_catalog_scope);
  const recipeId = candidate.recipe_id == null ? null : nonEmptyString(candidate.recipe_id);
  const selectedIngredientIds = sortedUniqueStrings(candidate.selected_ingredient_ids);
  const selectedInputIds = sortedUniqueStrings(candidate.selected_input_ids);
  const ratioRuleIds = sortedUniqueStrings(candidate.ratio_rule_ids);
  const actions = canonicalActionProtocol(candidate.execution_actions);
  const servings = integerServings(candidate.servings);
  if (fields.some(value => value == null) || !taxonomyVersion
      || !/^sha256:[a-f0-9]{64}$/u.test(taxonomyHash || '')
      || (candidate.recipe_id != null && recipeId == null)
      || servings == null || requestSnapshot == null
      || riceCatalogScope !== requestSnapshot.rice_catalog_scope
      || !/^sha256:[a-f0-9]{64}$/u.test(fields[5])
      || !/^sha256:[a-f0-9]{64}$/u.test(fields[7]) || substitutions == null || safetyEndpoints == null
      || selectedIngredientIds == null || selectedInputIds == null || ratioRuleIds == null
      || controlledSeasonings == null || actions == null) {
    return null;
  }
  return {
    catalog_version: fields[1],
    plan_id: fields[0],
    family_id: fields[2],
    variant_id: fields[3],
    recipe_id: recipeId,
    servings,
    rice_catalog_scope: riceCatalogScope,
    request: requestSnapshot,
    ratio_catalog_version: fields[4],
    ratio_facts_hash: fields[5],
    source_evidence_ledger_version: fields[6],
    source_evidence_hash: fields[7],
    taxonomy_version: taxonomyVersion,
    taxonomy_hash: taxonomyHash,
    selected_ingredient_ids: selectedIngredientIds,
    selected_input_ids: selectedInputIds,
    substitutions,
    controlled_seasonings: controlledSeasonings,
    ratio_rule_ids: ratioRuleIds,
    action_protocol: actions,
    safety_endpoints: safetyEndpoints,
  };
}

function bytesFromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function concatBytes(...arrays) {
  const length = arrays.reduce((sum, array) => sum + array.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
}

function hmacSha256Hex(secret, message) {
  if (!nonEmptyString(secret)) throw invalidToken();
  let key = new TextEncoder().encode(secret);
  if (key.length > 64) key = bytesFromHex(sha256Hex(key));
  const block = new Uint8Array(64);
  block.set(key);
  const inner = new Uint8Array(64);
  const outer = new Uint8Array(64);
  for (let index = 0; index < 64; index += 1) {
    inner[index] = block[index] ^ 0x36;
    outer[index] = block[index] ^ 0x5c;
  }
  const messageBytes = new TextEncoder().encode(message);
  return sha256Hex(concatBytes(outer, bytesFromHex(sha256Hex(concatBytes(inner, messageBytes)))));
}

function base64UrlEncode(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function base64UrlDecode(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/u.test(value)) return null;
  try {
    const padded = value.replaceAll('-', '+').replaceAll('_', '/')
      + '='.repeat((4 - value.length % 4) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function constantTimeEqual(left, right) {
  const leftText = String(left || '');
  const rightText = String(right || '');
  let difference = leftText.length ^ rightText.length;
  const length = Math.max(leftText.length, rightText.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (leftText.charCodeAt(index) || 0) ^ (rightText.charCodeAt(index) || 0);
  }
  return difference === 0;
}

function tokenPayload(candidate) {
  const facts = canonicalCandidateFacts(candidate);
  if (!facts) throw invalidToken();
  return { version: TOKEN_VERSION, candidate: facts };
}

export function buildRiceMealPlanToken(candidate, secret) {
  const payload = tokenPayload(candidate);
  const encoded = base64UrlEncode(canonicalJson(payload));
  return `${TOKEN_PREFIX}.${encoded}.${hmacSha256Hex(secret, encoded)}`;
}

function parsePlanToken(token, secret) {
  if (typeof token !== 'string') throw invalidToken();
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX || !/^[a-f0-9]{64}$/u.test(parts[2])) throw invalidToken();
  if (!constantTimeEqual(parts[2], hmacSha256Hex(secret, parts[1]))) throw invalidToken();
  const decoded = base64UrlDecode(parts[1]);
  if (!decoded) throw invalidToken();
  let payload;
  try {
    payload = JSON.parse(decoded);
  } catch {
    throw invalidToken();
  }
  if (!isPlainObject(payload) || Object.keys(payload).length !== 2
      || payload.version !== TOKEN_VERSION || !isPlainObject(payload.candidate)
      || !Array.isArray(payload.candidate.action_protocol)
      || base64UrlEncode(canonicalJson(payload)) !== parts[1]) {
    throw invalidToken();
  }
  let facts;
  try {
    facts = canonicalCandidateFacts({
      ...payload.candidate,
      plan_snapshot: payload.candidate.request,
      execution_actions: Object.fromEntries(payload.candidate.action_protocol.map(row => [row.phase, row.actions])),
    });
  } catch {
    throw invalidToken();
  }
  if (!facts || canonicalJson(facts) !== canonicalJson(payload.candidate)) throw invalidToken();
  return facts;
}

function assertAssets(assets) {
  if (!isPlainObject(assets) || !isPlainObject(assets.catalog)
      || !isPlainObject(assets.taxonomy) || !isPlainObject(assets.ratios)
      || !isPlainObject(assets.recipes) || !isPlainObject(assets.sourceEvidence)
      || !['ready', 'calibration'].includes(assets.riceCatalogScope)) {
    throw stalePlan();
  }
}

function sourceEvidenceIdentity(sourceEvidence) {
  if (!nonEmptyString(sourceEvidence?.ledger_version) || !Array.isArray(sourceEvidence?.entries)
      || sourceEvidence.entries.length === 0) throw stalePlan();
  return {
    version: sourceEvidence.ledger_version.trim(),
    hash: `sha256:${sha256Hex(canonicalJson(sourceEvidence))}`,
  };
}

function taxonomyIdentity(taxonomy) {
  if (!nonEmptyString(taxonomy?.taxonomy_version) || !Array.isArray(taxonomy?.items)) throw stalePlan();
  return {
    version: taxonomy.taxonomy_version.trim(),
    hash: `sha256:${sha256Hex(canonicalJson(taxonomy))}`,
  };
}

function recomputeCandidate(facts, assets) {
  assertAssets(assets);
  const evidenceIdentity = sourceEvidenceIdentity(assets.sourceEvidence);
  const currentTaxonomyIdentity = taxonomyIdentity(assets.taxonomy);
  if (facts.catalog_version !== assets.catalog.catalog_version
      || facts.request.catalog_version !== assets.catalog.catalog_version
      || facts.request.rice_catalog_scope !== assets.riceCatalogScope
      || facts.ratio_catalog_version !== assets.ratios.ratio_catalog_version
      || facts.source_evidence_ledger_version !== evidenceIdentity.version
      || facts.source_evidence_hash !== evidenceIdentity.hash
      || facts.taxonomy_version !== currentTaxonomyIdentity.version
      || facts.taxonomy_hash !== currentTaxonomyIdentity.hash
      || facts.servings !== facts.request.servings) throw stalePlan();
  let result;
  try {
    result = selectRiceMealCandidates({
      request: {},
      normalizedRequest: facts.request,
      catalog: assets.catalog,
      taxonomy: assets.taxonomy,
      ratioCatalog: assets.ratios,
      sourceEvidence: assets.sourceEvidence,
      recentPlanIds: [],
      riceCatalogScope: assets.riceCatalogScope,
    });
  } catch {
    throw stalePlan();
  }
  const candidate = (result?.candidates || []).find(row => row.plan_id === facts.plan_id);
  if (!candidate) throw stalePlan();
  const recomputedFacts = canonicalCandidateFacts(candidate);
  if (!recomputedFacts || canonicalJson(recomputedFacts) !== canonicalJson(facts)) throw stalePlan();
  return candidate;
}

export function verifyAndRecomputeRiceMealPlan(envelope, assets, secret) {
  if (!isPlainObject(envelope) || Object.keys(envelope).length !== 1
      || typeof envelope.plan_token !== 'string') throw invalidToken();
  return recomputeCandidate(parsePlanToken(envelope.plan_token, secret), assets);
}

function variantsById(catalog) {
  return new Map((catalog?.families || []).flatMap(family => (family?.variants || []).map(variant => [
    variant.variant_id,
    { family_id: family.family_id, variant },
  ])));
}

function taxonomyById(taxonomy) {
  return new Map((taxonomy?.items || []).map(item => [item.canonical_id, item]));
}

function exactRecipeRule(rule, variant) {
  return rule && rule.execution_mode === 'executable'
    && ((typeof rule.when?.variant_id === 'string'
      && rule.when.variant_id === variant.variant_id
      && !Object.hasOwn(rule.when, 'recipe_id'))
      || (typeof variant.recipe_id === 'string' && variant.recipe_id
        && rule.when?.recipe_id === variant.recipe_id
        && !Object.hasOwn(rule.when, 'variant_id')))
    && Array.isArray(rule.operations)
    && rule.operations.length > 0;
}

function findBasicTaxonomyItem(target, itemIndex) {
  const matches = [...itemIndex.values()].filter(item => (
    item.display_name === target?.name && item.category === target?.category
  ));
  return matches.length === 1 && BASIC_EXTRA_IDS.has(matches[0].canonical_id) ? matches[0] : null;
}

function ratioFailure() {
  throw stalePlan();
}

function compileExactRatioFacts(variant, candidate, assets, materials) {
  const itemIndex = taxonomyById(assets.taxonomy);
  const ruleById = new Map((assets.ratios.rules || []).map(rule => [rule.rule_id, rule]));
  if (candidate.ratio_catalog_version !== assets.ratios.ratio_catalog_version
      || !/^sha256:[a-f0-9]{64}$/u.test(candidate.ratio_facts_hash || '')
      || !Array.isArray(variant.ratio_rule_ids) || variant.ratio_rule_ids.length !== 1
      || canonicalJson([...variant.ratio_rule_ids].sort()) !== canonicalJson([...candidate.ratio_rule_ids].sort())) {
    ratioFailure();
  }
  const rule = ruleById.get(variant.ratio_rule_ids[0]);
  if (!exactRecipeRule(rule, variant)) ratioFailure();
  const liquidContract = rule.liquid_contract;
  if (!isPlainObject(liquidContract)
      || !['added_water', 'total_free_liquid'].includes(liquidContract.kind)
      || liquidContract.measurement !== 'weigh_before_loading'
      || !Number.isSafeInteger(liquidContract.display_rounding_grams)
      || liquidContract.display_rounding_grams <= 0
      || (liquidContract.kind === 'total_free_liquid'
        && canonicalJson(liquidContract.measured_contributor_ids) !== canonicalJson(['water']))) {
    ratioFailure();
  }
  const nearest = rule.rounding?.grams_to_nearest;
  if (!Number.isSafeInteger(nearest) || nearest <= 0) ratioFailure();
  const materialById = new Map(materials.map(item => [item.canonical_id, item]));
  const rawAmounts = new Map();
  const groupLockedCanonicalIds = new Set();
  const basicTargets = new Map();
  const trace = [];
  let liquidCredit = 0;

  const addRawAmount = (canonicalId, grams, basic = null) => {
    if (!Number.isFinite(grams) || grams <= 0 || rawAmounts.has(canonicalId)) ratioFailure();
    rawAmounts.set(canonicalId, grams);
    if (basic) basicTargets.set(canonicalId, basic);
  };
  for (const operation of rule.operations) {
    if (operation?.operator === 'per_serving') {
      const canonicalId = operation.target?.canonical_id;
      const material = materialById.get(canonicalId);
      const grams = operation.grams?.default;
      if (!material || material.state !== operation.target?.state
          || (operation.target?.shape_or_cut && material.shape_or_cut !== operation.target.shape_or_cut)
          || !Number.isFinite(grams) || grams <= 0
          || operation.grams?.min !== grams || operation.grams?.max !== grams) ratioFailure();
      addRawAmount(canonicalId, grams * candidate.servings);
      trace.push({
        rule_id: rule.rule_id,
        operator: 'per_serving',
        canonical_id: canonicalId,
        grams_per_serving: grams,
      });
      continue;
    }
    if (operation?.operator === 'allocate_group_total_per_serving') {
      const targets = operation.member_targets;
      const gramsPerServing = operation.grams?.default;
      if (!Array.isArray(targets) || targets.length < 2
          || operation.allocation_policy !== 'equal_split_ordered_residual'
          || !Number.isFinite(gramsPerServing) || gramsPerServing <= 0
          || operation.grams?.min !== gramsPerServing || operation.grams?.max !== gramsPerServing) {
        ratioFailure();
      }
      const members = targets.map(target => {
        const material = materialById.get(target?.canonical_id);
        if (!material || material.state !== target?.state
            || (target?.shape_or_cut && material.shape_or_cut !== target.shape_or_cut)) ratioFailure();
        return material;
      });
      if (new Set(members.map(material => material.canonical_id)).size !== members.length) ratioFailure();
      const lockedGroupTotal = normalizeRatioGrams(gramsPerServing * candidate.servings, nearest);
      const totalUnits = lockedGroupTotal / nearest;
      if (!Number.isSafeInteger(totalUnits) || totalUnits < members.length) ratioFailure();
      const baseUnits = Math.floor(totalUnits / members.length);
      const residualUnits = totalUnits % members.length;
      const allocated = members.map((material, index) => {
        const grams = (baseUnits + (index < residualUnits ? 1 : 0)) * nearest;
        addRawAmount(material.canonical_id, grams);
        groupLockedCanonicalIds.add(material.canonical_id);
        return { canonical_id: material.canonical_id, grams };
      });
      trace.push({
        rule_id: rule.rule_id,
        operator: 'allocate_group_total_per_serving',
        member_canonical_ids: members.map(material => material.canonical_id),
        group_total_grams: lockedGroupTotal,
        allocation_policy: operation.allocation_policy,
        amount_provenance: 'planner_allocation_not_source_individual_amounts',
        allocated,
      });
      continue;
    }
    // Every supported recipe operation gets a reviewed compiler branch rather
    // than being inferred from recipe prose.
    if (operation?.operator === 'bounded_sum') ratioFailure();
    if (operation?.operator === 'ratio') {
      const denominator = materialById.get(operation.denominator?.canonical_id);
      const target = findBasicTaxonomyItem(operation.target, itemIndex);
      const multiplier = operation.default;
      if (!denominator || operation.denominator?.state !== denominator.state
          || operation.denominator?.measure !== 'grams' || !target
          || operation.numerator?.resource !== (liquidContract.kind === 'added_water'
            ? 'added_water_grams' : 'retained_liquid_grams')
          || !Number.isFinite(multiplier) || multiplier <= 0
          || operation.min !== multiplier || operation.max !== multiplier
          || !rawAmounts.has(denominator.canonical_id)) {
        ratioFailure();
      }
      addRawAmount(target.canonical_id, rawAmounts.get(denominator.canonical_id) * multiplier - liquidCredit, target);
      trace.push({
        rule_id: rule.rule_id,
        operator: 'ratio',
        numerator: operation.numerator.resource,
        denominator_canonical_id: denominator.canonical_id,
        multiplier,
        liquid_credit_grams: liquidCredit,
      });
      continue;
    }
    if (operation?.operator === 'fixed_addition' || operation?.operator === 'scale_by_servings') {
      const target = findBasicTaxonomyItem(operation.target, itemIndex);
      const grams = operation.grams?.default;
      if (!target || !Number.isFinite(grams) || grams <= 0) ratioFailure();
      const multiplier = operation.operator === 'scale_by_servings' ? candidate.servings : 1;
      addRawAmount(target.canonical_id, grams * multiplier, target);
      trace.push({ rule_id: rule.rule_id, operator: operation.operator, canonical_id: target.canonical_id, grams: grams * multiplier });
      continue;
    }
    ratioFailure();
  }
  if (materials.some(item => !rawAmounts.has(item.canonical_id))) ratioFailure();
  const lockedAmounts = new Map();
  for (const [canonicalId, rawGrams] of rawAmounts) {
    const grams = groupLockedCanonicalIds.has(canonicalId) ? rawGrams : normalizeRatioGrams(rawGrams, nearest);
    if (!Number.isSafeInteger(grams) || grams <= 0 || grams > 5000) ratioFailure();
    lockedAmounts.set(canonicalId, grams);
  }
  const extras = [...basicTargets.values()].map(item => ({
    canonical_id: item.canonical_id,
    raw_name: item.display_name,
    display_name: item.display_name,
    canonical: item.canonical_name || item.display_name,
    category: item.category,
    state: item.states?.[0] || 'basic',
    shape_or_cut: item.shapes_or_cuts?.[0] || null,
    moisture_release: item.moisture_release || null,
    source: 'basic_extra',
    grams: lockedAmounts.get(item.canonical_id),
  }));
  const addedWaterGrams = extras.filter(item => item.canonical_id === 'water')
    .reduce((sum, item) => sum + item.grams, 0);
  if (!Number.isSafeInteger(addedWaterGrams) || addedWaterGrams <= 0) ratioFailure();
  const lockedLiquidCreditGrams = normalizeRatioGrams(liquidCredit, nearest);
  return {
    amounts: lockedAmounts,
    extras,
    ratio_trace: trace,
    liquid_constraints: {
      kind: liquidContract.kind,
      measured_contributor_ids: clone(liquidContract.measured_contributor_ids || []),
      ...(liquidContract.kind === 'total_free_liquid'
        ? {
          target_total_free_liquid_grams: addedWaterGrams + lockedLiquidCreditGrams,
        }
        : { added_water_grams: addedWaterGrams }),
      display_precision: liquidContract.display_precision,
      display_grams: normalizeRatioGrams(
        liquidContract.kind === 'total_free_liquid'
          ? addedWaterGrams + lockedLiquidCreditGrams
          : addedWaterGrams,
        liquidContract.display_rounding_grams,
      ),
      liquid_credit_grams: lockedLiquidCreditGrams,
      rounding_grams: nearest,
    },
  };
}

function actualInputFor(targetId, candidate, used) {
  const substitution = (candidate.substitutions || []).find(row => row.target_canonical_id === targetId);
  const actualId = substitution?.input_canonical_id || targetId;
  const item = (candidate.used_items || []).find(row => row.canonical_id === actualId && !used.has(row));
  if (!item) ratioFailure();
  used.add(item);
  return item;
}

function materialRows(variant, candidate, taxonomy) {
  const itemIndex = taxonomyById(taxonomy);
  const requiredMajorIds = new Set((candidate.required_extra_items || [])
    .filter(item => item?.kind === 'major_material')
    .map(item => item.canonical_id));
  const targets = [variant.rice?.canonical_ingredient_id, ...(variant.ingredients || [])
    .map(item => item.canonical_ingredient_id)];
  if (targets.some(id => !id || !itemIndex.has(id))) ratioFailure();
  const used = new Set();
  const majorMaterials = targets.map((canonicalId, index) => {
    const taxonomyItem = itemIndex.get(canonicalId);
    const requiredMajorExtra = index > 0 && requiredMajorIds.has(canonicalId);
    const input = index === 0 || requiredMajorExtra ? null : actualInputFor(canonicalId, candidate, used);
    const rawName = input?.raw || taxonomyItem.display_name;
    const state = input?.state || taxonomyItem.states?.[0] || null;
    const shape = input?.shape_or_cut || taxonomyItem.shapes_or_cuts?.[0] || null;
    return {
      canonical_id: canonicalId,
      raw_name: rawName,
      display_name: input?.display_name || taxonomyItem.display_name,
      canonical: input?.canonical || taxonomyItem.canonical_name || taxonomyItem.display_name,
      category: input?.category || taxonomyItem.category,
      state,
      shape_or_cut: shape,
      moisture_release: input?.moisture_release || taxonomyItem.moisture_release || null,
      source: index === 0 ? 'catalog_staple' : requiredMajorExtra ? 'required_major_extra' : 'user',
      requires_explicit_raw_name: Boolean(input?.raw && shape),
    };
  });
  const controlledIds = (variant.controlled_seasonings || []).map(row => row.canonical_ingredient_id);
  if (controlledIds.some(id => !itemIndex.has(id))
      || new Set([...majorMaterials.map(item => item.canonical_id), ...controlledIds]).size
        !== majorMaterials.length + controlledIds.length) ratioFailure();
  return majorMaterials;
}

function refsForIds(ids, refsByCanonical) {
  const refs = ids.map(id => refsByCanonical.get(id));
  if (refs.some(ref => !ref)) ratioFailure();
  return refs;
}

function lockedPlanForCandidate(candidate, assets) {
  const entry = variantsById(assets.catalog).get(candidate.variant_id);
  const eligibleStatuses = assets.riceCatalogScope === 'calibration'
    ? new Set(['calibration_preview', 'preview_ready', 'pilot_observed', 'production_approved'])
    : new Set(['preview_ready', 'pilot_observed', 'production_approved']);
  if (!entry || entry.family_id !== candidate.family_id || (entry.variant.recipe_id ?? null) !== candidate.recipe_id
      || candidate.rice_catalog_scope !== assets.riceCatalogScope
      || !eligibleStatuses.has(entry.variant.status) || !HOUSEHOLD_COPY[candidate.variant_id]) {
    throw stalePlan();
  }
  const variant = entry.variant;
  if (Array.isArray(variant.supported_servings)
      && !variant.supported_servings.includes(candidate.servings)) ratioFailure();
  const itemIndex = taxonomyById(assets.taxonomy);
  const substitutions = candidate.substitutions || [];
  if (substitutions.some(row => {
    const input = itemIndex.get(row.input_canonical_id);
    return row.kind !== 'generic_slot'
      || row.target_canonical_id !== 'beef-generic'
      || row.input_canonical_id !== 'beef-tenderloin'
      || input?.category !== 'beef'
      || !input.compatible_slot_codes?.includes('generic_beef');
  })) ratioFailure();
  const materials = materialRows(variant, candidate, assets.taxonomy);
  const ratio = compileExactRatioFacts(variant, candidate, assets, materials);
  const extraIds = ratio.extras.map(item => item.canonical_id);
  if (!extraIds.includes('water') || extraIds.some(id => !BASIC_EXTRA_IDS.has(id))
      || new Set(extraIds).size !== extraIds.length) ratioFailure();
  const controlledSeasoningIds = new Set((variant.controlled_seasonings || [])
    .map(row => row.canonical_ingredient_id));
  const allIngredients = [
    ...materials.map((item, index) => ({ ...item, ingredient_ref: `i${index + 1}`, planned_grams: ratio.amounts.get(item.canonical_id) })),
    ...ratio.extras.map((item, index) => ({
      ...item,
      source: controlledSeasoningIds.has(item.canonical_id) ? 'controlled_seasoning' : item.source,
      ingredient_ref: `e${index + 1}`,
      planned_grams: item.grams,
      requires_explicit_raw_name: false,
    })),
  ];
  if (allIngredients.some(item => !Number.isSafeInteger(item.planned_grams) || item.planned_grams <= 0)) ratioFailure();
  const refsByCanonical = new Map(allIngredients.map(item => [item.canonical_id, item.ingredient_ref]));
  const adaptation = variant.cooker_adaptation;
  const midActions = Array.isArray(adaptation?.mid_actions) ? adaptation.mid_actions : [];
  const controlledMidCycle = adaptation?.requires_mid_cook_opening === true
    && variant.variant_id === 'shanghai-salted-pork-rice'
    && JSON.stringify(variant.supported_servings) === JSON.stringify([3])
    && midActions.length === 1
    && midActions[0]?.action_code === 'add_reserved_leafy_vegetable'
    && midActions[0]?.timing_basis === 'program_remaining_minutes'
    && midActions[0]?.timing_min === 10 && midActions[0]?.timing_max === 10
    && midActions[0]?.max_open_seconds === 30
    && midActions[0]?.placement === 'top_no_stir'
    && midActions[0]?.resume_policy === 'same_program_auto_resume'
    && midActions[0]?.required_post_close_minutes === 10
    && midActions[0]?.ingredient_ids?.length === 1
    && midActions[0]?.ingredient_ids?.[0] === 'small-bok-choy';
  const controlledRest = (adaptation?.finish_actions || [])
    .filter(action => action?.action_code === 'rest_lid_closed');
  if (controlledMidCycle && (controlledRest.length !== 1 || controlledRest[0]?.rest_minutes !== 5)) ratioFailure();
  if (!adaptation || adaptation.closed_lid_continuation !== true
      || (adaptation.requires_mid_cook_opening === true && !controlledMidCycle)
      || adaptation.completion_status !== 'complete') ratioFailure();
  const controlledActionsByPhase = new Map(ACTION_PHASES.map(phase => [phase,
    (variant.controlled_seasonings || []).filter(row => row.phase === phase).map(row => ({
      action_code: row.action_code,
      ingredient_ids: [row.canonical_ingredient_id],
      controlled_seasoning: true,
    })),
  ]));
  const catalogActions = ACTION_PHASES.flatMap(phase => {
    const base = (adaptation[phase] || []).slice().sort((left, right) => left.order - right.order);
    const controlled = controlledActionsByPhase.get(phase) || [];
    if (phase === 'pre_actions') {
      const sauteIndex = base.findIndex(action => action.action_code === 'pre_saute_materials_outside_cooker');
      return sauteIndex < 0
        ? [...base, ...controlled]
        : [...base.slice(0, sauteIndex), ...controlled, ...base.slice(sauteIndex)];
    }
    if (phase === 'start_actions') {
      const startIndex = base.findIndex(action => action.action_code === 'start_closed_lid_program');
      return startIndex < 0
        ? [...base, ...controlled]
        : [...base.slice(0, startIndex), ...controlled, ...base.slice(startIndex)];
    }
    if (phase === 'finish_actions') {
      const serveIndex = base.findIndex(action => action.action_code === 'fluff_and_serve');
      return serveIndex < 0
        ? [...base, ...controlled]
        : [...base.slice(0, serveIndex), ...controlled, ...base.slice(serveIndex)];
    }
    return [...base, ...controlled];
  });
  const candidateActions = candidate.execution_actions;
  if (!candidateActions || canonicalJson(canonicalActionProtocol(candidateActions))
      !== canonicalJson(canonicalActionProtocol(adaptation))) ratioFailure();
  const safetyEndpoints = [...new Set((variant.safety_endpoints || []).map(row => row.endpoint_code))];
  if (!safetyEndpoints.length || canonicalJson(stableRows(candidate.safety_endpoints, row => ({
    canonical_ingredient_id: nonEmptyString(row?.canonical_ingredient_id),
    endpoint_code: nonEmptyString(row?.endpoint_code),
  }))) !== canonicalJson(stableRows(variant.safety_endpoints, row => ({
    canonical_ingredient_id: nonEmptyString(row?.canonical_ingredient_id),
    endpoint_code: nonEmptyString(row?.endpoint_code),
  })))) ratioFailure();
  const safetyRefs = refsForIds(variant.safety_endpoints.map(row => row.canonical_ingredient_id), refsByCanonical);
  const copy = HOUSEHOLD_COPY[variant.variant_id];
  const cookingOrder = catalogActions.map(action => {
    const allowed = refsForIds(action.ingredient_ids || [], refsByCanonical);
    if (action.action_code === 'load_inner_pot') {
      for (const extra of ratio.extras.filter(item => !controlledSeasoningIds.has(item.canonical_id))) {
        const ref = refsByCanonical.get(extra.canonical_id);
        if (ref && !allowed.includes(ref)) allowed.push(ref);
      }
    }
    const controlledSeasoningGrams = action.controlled_seasoning
      ? ratio.amounts.get(action.ingredient_ids?.[0]) : null;
    const text = action.controlled_seasoning
      ? CONTROLLED_SEASONING_COPY[action.action_code]
        ?.replace('{{g}}', String(controlledSeasoningGrams))
        .replace('{{s}}', `{{${allowed[0]}}}`)
      : copy.steps[action.action_code];
    if (!text) ratioFailure();
    const requirements = action.action_code === 'verify_safety_endpoints'
      ? { required_safety_endpoints: [...safetyEndpoints], required_safety_ingredient_refs: safetyRefs }
      : { required_safety_endpoints: [], required_safety_ingredient_refs: [] };
    const lockedNumericFacts = action.controlled_seasoning && Number.isSafeInteger(controlledSeasoningGrams)
      ? [`${controlledSeasoningGrams}克`]
      : action.action_code === 'verify_safety_endpoints'
        && safetyEndpoints.includes('pork_fully_cooked')
        && (action.ingredient_ids || []).includes('pork-ribs')
      ? ['74°C']
      : action.action_code === 'add_reserved_leafy_vegetable'
      ? [`${action.timing_min}分钟`, `${action.max_open_seconds}秒`]
      : (action.action_code === 'rest_lid_closed' && Number.isInteger(action.rest_minutes)
        ? [`${action.rest_minutes}分钟`]
        : []);
    return {
      action_code: action.action_code,
      allowed_ingredient_refs: allowed,
      allowed_text: text,
      locked_numeric_facts: lockedNumericFacts,
      ...requirements,
    };
  });
  return {
    plan_id: candidate.plan_id,
    meals: [{
      meal_sequence: 1,
      servings: candidate.servings,
      template_id: `rice-meal:${variant.variant_id}`,
      plan_source: 'rice_meal_catalog',
      recipe_id: variant.recipe_id,
      variant_id: variant.variant_id,
      identity_level: variant.identity_level,
      locked_ingredients: allIngredients,
      slot_assignment: allIngredients.map(item => ({
        slot_id: item.canonical_id,
        ingredient_refs: [item.ingredient_ref],
      })),
      cooking_order: cookingOrder,
      ratio_constraints: clone(ratio.ratio_trace),
      liquid_constraints: clone(ratio.liquid_constraints),
      time_range: {
        active_minutes: adaptation.active_time_minutes,
        total_minutes: adaptation.total_time_minutes,
      },
      safety_endpoints: [...safetyEndpoints],
      safety_endpoint_requirements: variant.safety_endpoints.map(endpoint => ({
        endpoint_code: endpoint.endpoint_code,
        ingredient_refs: [refsByCanonical.get(endpoint.canonical_ingredient_id)],
      })),
      generation_text_contract: {
        dish_name_options: [variant.display_name],
        dish_name_ingredient_exemptions: variant.variant_id === 'shanghai-salted-pork-rice'
          ? ['上海咸肉']
          : variant.variant_id === 'source-tiger-pork-bamboo-rice'
            ? ['猪肉']
            : variant.variant_id === 'source-tatung-pork-daikon-rice'
              ? ['猪肉', '萝卜']
              : [],
        steps: cookingOrder.map((phase, index) => ({
          order: index + 1,
          allowed_texts: [phase.allowed_text],
        })),
        recommendation_reason_options: [copy.recommendation_reason],
      },
    }],
  };
}

export function compileRiceMeal(candidate, assets) {
  const facts = canonicalCandidateFacts(candidate);
  if (!facts) throw invalidToken();
  const recomputed = recomputeCandidate(facts, assets);
  const lockedPlan = lockedPlanForCandidate(recomputed, assets);
  const universe = buildIngredientTermUniverse(assets.taxonomy, assets.recipes);
  const { meals } = renderAndValidateDeterministicLockedPlan(lockedPlan, universe);
  const lockedMeal = lockedPlan.meals[0];
  const requiredControlledIds = new Set((recomputed.required_extra_items || [])
    .filter(item => item?.kind === 'controlled_seasoning')
    .map(item => item.canonical_id));
  const requiredMajorIds = new Set((recomputed.required_extra_items || [])
    .filter(item => item?.kind === 'major_material')
    .map(item => item.canonical_id));
  return clone({
    schema_version: 3,
    catalog_version: assets.catalog.catalog_version,
    status: 'ready',
    generation_allowed: true,
    plan_id: recomputed.plan_id,
    family_id: recomputed.family_id,
    variant_id: recomputed.variant_id,
    recipe_id: recomputed.recipe_id,
    user_notices: clone(recomputed.user_notices || []),
    plan: {
      plan_id: recomputed.plan_id,
      catalog_version: assets.catalog.catalog_version,
      family_id: recomputed.family_id,
      variant_id: recomputed.variant_id,
      recipe_id: recomputed.recipe_id,
      servings: recomputed.servings,
      ingredient_amounts: lockedMeal.locked_ingredients.map(item => ({
        canonical_id: item.canonical_id,
        name: item.raw_name,
        grams: item.planned_grams,
        source: item.source,
      })),
      required_extra_items: lockedMeal.locked_ingredients.filter(item => (
        item.source === 'basic_extra'
        || (item.source === 'required_major_extra' && requiredMajorIds.has(item.canonical_id))
        || (item.source === 'controlled_seasoning' && requiredControlledIds.has(item.canonical_id))
      )).map(item => ({
        canonical_id: item.canonical_id,
        name: item.raw_name,
        grams: item.planned_grams,
        kind: item.source === 'controlled_seasoning'
          ? 'controlled_seasoning'
          : item.source === 'required_major_extra' ? 'major_material' : 'basic_extra',
        allergen_tags: item.source === 'controlled_seasoning' || item.source === 'required_major_extra'
          ? clone(assets.taxonomy.items.find(row => row.canonical_id === item.canonical_id)?.allergen_tags || [])
          : [],
      })),
      ratio_trace: clone(lockedMeal.ratio_constraints),
      liquid_constraints: clone(lockedMeal.liquid_constraints),
      execution_actions: clone(recomputed.execution_actions),
      safety_endpoints: clone(recomputed.safety_endpoints),
      nutrition_inputs: lockedMeal.locked_ingredients.map(item => ({
        name: item.raw_name,
        canonical_id: item.canonical_id,
        state: item.state,
        grams: item.planned_grams,
        source: item.source,
      })),
    },
    meals: lockedPlan.meals.map((meal, index) => ({
      meal_sequence: meal.meal_sequence,
      servings: meal.servings,
      template_id: meal.template_id,
      plan_source: meal.plan_source,
      recipe_id: meal.recipe_id,
      variant_id: meal.variant_id,
      identity_level: meal.identity_level,
      user_notices: clone(recomputed.user_notices || []),
      locked_ingredients: clone(meal.locked_ingredients),
      slot_assignment: clone(meal.slot_assignment),
      ratio_constraints: clone(meal.ratio_constraints),
      liquid_constraints: clone(meal.liquid_constraints),
      time_range: clone(meal.time_range),
      safety_endpoints: clone(meal.safety_endpoints),
      dish_name: meals[index].dish_name,
      steps: meals[index].steps,
      recommendation_reason: meals[index].recommendation_reason,
    })),
  });
}
