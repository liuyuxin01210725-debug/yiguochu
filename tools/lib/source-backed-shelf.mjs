import { requiresSourceSafetyEndpoint } from './source-backed-safety-applicability.mjs';

const CONTRACT_FIELDS = [
  ['fixed_batch', '定量'],
  ['liquid_contract', '液体量'],
  ['time_contract', '总时长'],
  ['safety_endpoints', '安全终点'],
];

const ENDPOINT_NOTES = Object.freeze({
  cured_meat_fully_heated: '腊味：必须彻底加热后食用。',
  pork_fully_cooked: '猪肉：中心温度达到 74°C。',
  shellfish_fully_cooked: '贝类/甲壳类：肉质呈珍珠白或白色且不透明。',
  beef_fully_cooked: '牛肉：中心温度达到 71°C。',
  poultry_fully_cooked: '禽肉：中心温度达到 74°C。',
  seafood_fully_cooked: '鱼类及其他海鲜：中心温度达到 63°C。',
});

const RISK_RULES = Object.freeze([
  { pattern: /鸡(?!蛋)|鸭(?!蛋)|鹅|禽|鶏/u, expected: ['poultry_fully_cooked'], label: '禽肉或禽类食材' },
  { pattern: /猪肉|猪|排骨|腊肉|腊肠|肝肠|豚/u, expected: ['pork_fully_cooked', 'cured_meat_fully_heated'], label: '猪肉或腊味' },
  { pattern: /牛肉|牛腩|牛里脊|牛柳|牛排|牛薄|beef/iu, expected: ['beef_fully_cooked'], label: '牛肉' },
  { pattern: /虾|蝦|蟹|贝|貝|蛤|蚝|蠔|蚌/u, expected: ['shellfish_fully_cooked', 'seafood_fully_cooked'], label: '贝类、甲壳类或虾蟹' },
  { pattern: /鱼|魚|鳗|鰻|鲤|鯉|鲫|鯽|带鱼|鳕|海鲜|海鮮/u, expected: ['seafood_fully_cooked'], label: '鱼类或海鲜' },
  { pattern: /鸡蛋|鸭蛋|鹅蛋|蛋|卵/u, expected: null, label: '蛋类', advisory: '蛋类：加热至蛋液完全凝固。' },
]);

// Some identity-only records have a distinctive named ingredient but no
// executable recipe contract.  The catalog must keep their canonical fields
// null; the research page can still show a more useful, explicitly estimated
// starting card.  These specs are deliberately separate from the catalog and
// never change shelf classification or the formal 72-recipe library.
const RESEARCH_DRAFT_OVERRIDE_SPECS = Object.freeze({
  'yichang-cured-pork-braised-rice': {
    method_type: 'staged_or_other', template: 'braised', minutes: 55,
    ingredients: [['大米', 300, 'g'], ['腊肉', 160, 'g'], ['青菜', 150, 'g'], ['姜葱', 20, 'g']],
    liquid: ['清水或高汤', 420, 'mL'],
  },
  'jinning-huanglaitou-braised-rice': {
    method_type: 'one_pot_research', template: 'rice_pot', minutes: 50,
    ingredients: [['大米', 300, 'g'], ['黄赖头（种类待来源确认）', 180, 'g']],
    liquid: ['清水', 450, 'mL'],
  },
  'qingyang-yellow-millet-braised-rice': {
    method_type: 'one_pot_research', template: 'millet', minutes: 45,
    ingredients: [['黄米', 300, 'g']], liquid: ['清水', 520, 'mL'],
  },
  'weihui-dashan-millet-braised-rice': {
    method_type: 'one_pot_research', template: 'millet', minutes: 45,
    ingredients: [['小米', 300, 'g']], liquid: ['清水', 520, 'mL'],
  },
  'honghe-hani-five-color-rice': {
    method_type: 'staged_or_other', template: 'steam', minutes: 60,
    ingredients: [['糯米', 300, 'g'], ['植物染色材料（五色，待来源确认）', 100, 'g']],
    liquid: ['蒸锅用水', 1500, 'mL'],
  },
  'lianping-neiguan-braised-chicken-rice': {
    method_type: 'staged_or_other', template: 'poultry_braise', minutes: 60,
    ingredients: [['大米', 300, 'g'], ['鸡肉', 240, 'g'], ['姜葱', 20, 'g']],
    liquid: ['清水或高汤', 450, 'mL'],
  },
  'lianping-neiguan-braised-duck-rice': {
    method_type: 'staged_or_other', template: 'poultry_braise', minutes: 75,
    ingredients: [['大米', 300, 'g'], ['鸭肉', 240, 'g'], ['姜葱', 20, 'g']],
    liquid: ['清水或高汤', 450, 'mL'],
  },
  'shenmu-gua-braised-rice': {
    method_type: 'one_pot_research', template: 'rice_pot', minutes: 50,
    ingredients: [['大米', 300, 'g'], ['瓜类（种类待来源确认）', 200, 'g']],
    liquid: ['清水或高汤', 450, 'mL'],
  },
  'hubei-xinzhou-yellow-catfish-glutinous-rice': {
    method_type: 'staged_or_other', template: 'fish_braise', minutes: 60,
    ingredients: [['糯米', 300, 'g'], ['黄颡鱼', 220, 'g'], ['姜葱', 20, 'g']],
    liquid: ['清水或高汤', 450, 'mL'],
  },
  'zhejiang-changxing-salted-pork-xiuhuajin-rice': {
    method_type: 'staged_or_other', template: 'salted_pork_rice', minutes: 55,
    ingredients: [['大米', 300, 'g'], ['咸肉', 160, 'g'], ['绣花锦青菜', 300, 'g']],
    liquid: ['清水', 420, 'mL'],
  },
  'guangxi-jingxi-pork-glutinous-rice': {
    method_type: 'staged_or_other', template: 'steam', minutes: 60,
    ingredients: [['糯米', 300, 'g'], ['扣肉（状态待来源确认）', 200, 'g']],
    liquid: ['蒸锅用水', 1500, 'mL'],
  },
  'guangxi-jingxi-lotus-leaf-fragrant-rice': {
    method_type: 'staged_or_other', template: 'steam', minutes: 60,
    ingredients: [['糯米', 300, 'g'], ['荷叶', 1, '片']],
    liquid: ['蒸锅用水', 1500, 'mL'],
  },
  'zhengning-braised-rice': {
    method_type: 'one_pot_research', template: 'rice_pot', minutes: 50,
    ingredients: [['大米', 300, 'g'], ['菜/肉配料（来源待核）', 180, 'g']],
    liquid: ['清水或高汤', 450, 'mL'],
  },
  'xinzhou-fragrant-rice-pot-crust-rice': {
    method_type: 'staged_or_other', template: 'claypot', minutes: 55,
    ingredients: [['香米', 300, 'g']], liquid: ['清水', 450, 'mL'],
  },
  'taicang-seafood-pot-crust-rice': {
    method_type: 'staged_or_other', template: 'claypot_seafood', minutes: 55,
    ingredients: [['大米', 300, 'g'], ['海鲜（物种待来源确认）', 220, 'g']],
    liquid: ['清水或高汤', 450, 'mL'],
  },
  'yuping-gongmi-pot-crust-rice': {
    method_type: 'staged_or_other', template: 'claypot', minutes: 55,
    ingredients: [['贡米', 300, 'g']], liquid: ['清水', 450, 'mL'],
  },
  'pinghe-luxi-salted-vegetable-rice': {
    method_type: 'one_pot_research', template: 'salted_vegetable', minutes: 50,
    ingredients: [['大米', 300, 'g'], ['芦溪咸菜', 150, 'g']], liquid: ['清水', 420, 'mL'],
  },
  'youxi-jiumi-salty-rice': {
    method_type: 'one_pot_research', template: 'salted_vegetable', minutes: 50,
    ingredients: [['大米', 300, 'g'], ['咸饭配菜（种类待来源确认）', 180, 'g']], liquid: ['清水', 450, 'mL'],
  },
  'xinyang-green-rice': {
    method_type: 'staged_or_other', template: 'green_rice', minutes: 50,
    ingredients: [['大米', 300, 'g'], ['青米饭原料（青料待来源确认）', 100, 'g']], liquid: ['清水', 450, 'mL'],
  },
  'tianjin-ninghe-braised-meat-rice': {
    method_type: 'staged_or_other', template: 'meat_braise', minutes: 55,
    ingredients: [['大米', 300, 'g'], ['肉类（物种待来源确认）', 180, 'g']], liquid: ['清水或高汤', 450, 'mL'],
  },
  'afa-japanese-chestnut-rice': {
    method_type: 'one_pot_research', template: 'rice_pot', minutes: 50,
    ingredients: [['大米', 300, 'g'], ['栗子', 120, 'g']], liquid: ['清水或高汤', 450, 'mL'],
  },
  'afa-sesame-oil-chicken-rice': {
    method_type: 'staged_or_other', template: 'poultry_braise', minutes: 60,
    ingredients: [['大米', 300, 'g'], ['鸡肉', 240, 'g'], ['麻油', 15, 'mL']], liquid: ['清水或高汤', 450, 'mL'],
  },
  'afa-garlic-fresh-fish-rice': {
    method_type: 'staged_or_other', template: 'fish_braise', minutes: 60,
    ingredients: [['大米', 300, 'g'], ['鲜鱼（物种待来源确认）', 220, 'g'], ['蒜', 15, 'g']], liquid: ['清水或高汤', 450, 'mL'],
  },
  'afa-tomato-pork-rice': {
    method_type: 'staged_or_other', template: 'meat_braise', minutes: 60,
    ingredients: [['大米', 300, 'g'], ['猪肉', 200, 'g'], ['番茄', 200, 'g']], liquid: ['清水或高汤', 450, 'mL'],
  },
  'afa-beef-rice': {
    method_type: 'staged_or_other', template: 'meat_braise', minutes: 60,
    ingredients: [['大米', 300, 'g'], ['牛肉', 200, 'g'], ['洋葱', 100, 'g']], liquid: ['清水或高汤', 450, 'mL'],
  },
  'taiwan-pumpkin-dried-fish-red-shallot-rice': {
    method_type: 'staged_or_other', template: 'rice_pot', minutes: 55,
    ingredients: [['大米', 300, 'g'], ['南瓜', 300, 'g'], ['小鱼干', 20, 'g'], ['红葱头', 30, 'g']], liquid: ['清水', 450, 'mL'],
  },
  'taiwan-sausage-chestnut-rice': {
    method_type: 'staged_or_other', template: 'meat_braise', minutes: 60,
    ingredients: [['大米', 300, 'g'], ['香肠', 150, 'g'], ['栗子', 120, 'g']], liquid: ['清水或高汤', 450, 'mL'],
  },
  'taiwan-sesame-oil-matsusaka-pork-rice': {
    method_type: 'staged_or_other', template: 'meat_braise', minutes: 60,
    ingredients: [['大米', 300, 'g'], ['松阪猪', 200, 'g'], ['麻油', 15, 'mL'], ['姜', 20, 'g']], liquid: ['清水或高汤', 450, 'mL'],
  },
  'baguazhou-luhao-braised-rice': {
    method_type: 'one_pot_research', template: 'salted_vegetable', minutes: 50,
    ingredients: [['大米', 300, 'g'], ['芦蒿', 200, 'g']], liquid: ['清水', 450, 'mL'],
  },
  'mindong-she-black-rice': {
    method_type: 'staged_or_other', template: 'steam', minutes: 60,
    ingredients: [['糯米', 300, 'g'], ['乌饭染色材料（种类待来源确认）', 100, 'g']], liquid: ['蒸锅用水', 1500, 'mL'],
  },
  'qianjiang-xiadao-guoba-rice': {
    method_type: 'staged_or_other', template: 'claypot', minutes: 55,
    ingredients: [['虾稻米（米种）', 300, 'g']], liquid: ['清水', 450, 'mL'],
  },
  'tongcheng-cured-meat-pot-crust-rice': {
    method_type: 'staged_or_other', template: 'claypot_meat', minutes: 55,
    ingredients: [['大米', 300, 'g'], ['腊味（种类待来源确认）', 160, 'g']], liquid: ['清水', 450, 'mL'],
  },
  'shishi-jump-fish-braised-rice': {
    method_type: 'staged_or_other', template: 'fish_braise', minutes: 60,
    ingredients: [['大米', 300, 'g'], ['跳跳鱼', 220, 'g'], ['姜葱', 20, 'g']], liquid: ['清水或高汤', 450, 'mL'],
  },
  'pengshui-zhacai-rice': {
    method_type: 'one_pot_research', template: 'salted_vegetable', minutes: 50,
    ingredients: [['大米', 300, 'g'], ['馇菜/咸菜（种类待来源确认）', 150, 'g']], liquid: ['清水或高汤', 450, 'mL'],
  },
  'r103-cn-guangxi-shangsi-xiangnu-wuse-fan': {
    method_type: 'staged_or_other', template: 'steam', minutes: 60,
    ingredients: [['香糯米', 300, 'g'], ['植物染色材料（五色，待来源确认）', 100, 'g']], liquid: ['蒸锅用水', 1500, 'mL'],
  },
  'r103-cn-zhejiang-longwan-sanjie-nuomi-fan': {
    method_type: 'one_pot_research', template: 'rice_pot', minutes: 50,
    ingredients: [['糯米', 300, 'g'], ['配料（种类待来源确认）', 180, 'g']], liquid: ['清水', 450, 'mL'],
  },
  'r103-cn-shanxi-yangqu-nidun-xiaomi-fan': {
    method_type: 'one_pot_research', template: 'millet', minutes: 50,
    ingredients: [['小米', 300, 'g'], ['时蔬（种类待来源确认）', 180, 'g']], liquid: ['清水', 500, 'mL'],
  },
  'cn-shanxi-qinshui-handmade-soft-rice': {
    method_type: 'one_pot_research', template: 'soft_rice', minutes: 50,
    ingredients: [['大米', 300, 'g'], ['当季配菜（种类待来源确认）', 180, 'g']], liquid: ['清水', 500, 'mL'],
  },
  'hunan-mayang-steamed-glutinous-rice': {
    method_type: 'staged_or_other', template: 'steam', minutes: 60,
    ingredients: [['糯米', 300, 'g'], ['粉蒸配料（肉/菜，待来源确认）', 200, 'g']], liquid: ['蒸锅用水', 1500, 'mL'],
  },
  'afa-douchi-pork-steamed-rice': {
    method_type: 'staged_or_other', template: 'steam', minutes: 55,
    ingredients: [['大米', 300, 'g'], ['豆豉', 20, 'g'], ['肉丁（部位待来源确认）', 180, 'g']], liquid: ['蒸锅用水', 1500, 'mL'],
  },
  'yangzhong-pufferfish-eight-pot-rice': {
    method_type: 'blocked_safety', template: 'blocked', minutes: 1,
    ingredients: [['大米', 300, 'g'], ['河豚（禁止家庭处理，仅作身份核验）', 0, 'g']], liquid: ['不适用（禁止家庭执行）', 0, 'mL'],
    blocked_reason: '河豚涉及专业去毒、许可和来源不明的安全风险；本卡只保留身份，禁止据此采购、处理或烹调。',
  },
  'fujian-oil-braised-meat-rice': {
    method_type: 'staged_or_other', template: 'meat_braise', minutes: 60,
    ingredients: [['大米', 300, 'g'], ['猪肉（部位待来源确认）', 200, 'g'], ['姜葱', 20, 'g']], liquid: ['清水或高汤', 450, 'mL'],
  },
  'wuerhe-awudan-lamb-shank-pilaf': {
    method_type: 'staged_or_other', template: 'pilaf', minutes: 90,
    ingredients: [['大米', 300, 'g'], ['羊拐/羊肉（部位待来源确认）', 220, 'g'], ['胡萝卜或配菜（待来源确认）', 180, 'g']], liquid: ['清水或高汤', 500, 'mL'],
  },
  'shache-pea-meat-pilaf': {
    method_type: 'staged_or_other', template: 'pilaf', minutes: 60,
    ingredients: [['大米', 300, 'g'], ['豌豆', 150, 'g'], ['抓饭肉类（物种/部位待来源确认）', 180, 'g']], liquid: ['清水或高汤', 450, 'mL'],
  },
  'pingjiang-red-army-guerrilla-bamboo-rice': {
    method_type: 'staged_or_other', template: 'bamboo_tube', minutes: 60,
    ingredients: [['大米', 300, 'g'], ['竹筒饭配料（当季肉/菜待来源确认）', 100, 'g']], liquid: ['竹筒用水', 450, 'mL'],
  },
  'cn-yunnan-ruili-dai-steamed-rice-technique': {
    method_type: 'staged_or_other', template: 'steam', minutes: 60,
    ingredients: [['大米', 300, 'g'], ['蒸米配菜（当季菜待来源确认）', 100, 'g']], liquid: ['蒸锅用水', 1500, 'mL'],
  },
  'cn-xinjiang-mulei-chickpea-pilaf': {
    method_type: 'one_pot_research', template: 'pilaf', minutes: 60,
    ingredients: [['大米', 300, 'g'], ['鹰嘴豆', 150, 'g']], liquid: ['清水', 500, 'mL'],
  },
});

// A small set of identity/partial records currently gets a generic add-in
// from name inference (for example “竹筒饭配料”).  That wording looks like an
// ingredient the cook should purchase even though the source never names one.
// Keep the starting card usable with the source-named grain/water only and
// attach an explicit warning instead of inventing a category of food.
const SOURCE_ONLY_INGREDIENT_GUARDRAILS = Object.freeze({
  'dai-fragrant-bamboo-rice': '原文只确认糯米、竹筒和火烤流程；来源未展开配料，不要自行添加。',
  'xiangxi-miao-bamboo-rice': '原文只确认米、水比例和竹筒蒸/烤流程；来源未展开配料，不要自行添加。',
  'changning-kas-dai-bamboo-rice': '来源只确认竹筒蒸熟，未展开米的构成或配料；不要从菜名反推。',
  'wulong-dingpot-sticky-rice-kongfan': '来源只确认鼎罐可煮腊肉或糯米箜饭，未给完整配料合同；不要自行添加或混合分支。',
  'hunan-mayang-steamed-glutinous-rice': '来源只确认粉蒸糯米饭身份，未展开粉蒸配料；不能从菜名反推。',
  'zhengning-braised-rice': '来源只确认焖饭身份，未展开菜/肉构成；不能从菜名反推。',
  'yuping-dong-sticky-rice': '来源只确认糯米饭身份和前一晚制作时间线，未展开配料；不能从菜名反推。',
  'pingjiang-red-army-guerrilla-bamboo-rice': '来源只确认竹筒饭技艺身份，未展开食材；不能从菜名反推。',
  'r103-cn-zhejiang-longwan-sanjie-nuomi-fan': '来源只确认糯米饭项目身份，未公开配料；不能从菜名反推。',
});

function applySourceOnlyIngredientGuardrail(recipe, rows) {
  const explicitWarning = SOURCE_ONLY_INGREDIENT_GUARDRAILS[recipe?.recipe_id];
  if (!Array.isArray(rows)) return { rows, warning: null };
  const unresolvedPattern = /待来源确认|按来源选取|按来源选定|未展开|具体构成待补|种类待来源确认|物种待来源确认|待核/u;
  const filtered = rows.filter(row => {
    const name = textForResearch(row?.name);
    return !/竹筒饭配料|竹筒饭用米与配料|粉蒸配料|菜\/肉配料|配料（种类待来源确认）|配料（种类待来源确认）|配料（当季肉\/菜待来源确认）|蒸米配菜（当季菜待来源确认）/u.test(name);
  });
  const sourceOnlyMarker = '来源未展开具体构成；不能从菜名反推，不要自行添加，先按来源确认。';
  const marked = (filtered.length ? filtered : rows).map(row => {
    const name = textForResearch(row?.name);
    if (!/待来源确认|按来源选取|按来源选定|未展开|具体构成待补|种类待来源确认|物种待来源确认|待核/u.test(name)) return row;
    const note = textForResearch(row?.note);
    return { ...row, note: note ? `${note} ${sourceOnlyMarker}` : sourceOnlyMarker };
  });
  const warning = explicitWarning || (marked.some(row => unresolvedPattern.test(textForResearch(row?.name))) ? sourceOnlyMarker : null);
  return { rows: marked, warning };
}

function sanitizeSourceOnlySteps(steps, warning) {
  if (!warning || !Array.isArray(steps)) return steps;
  const genericIngredient = /竹筒饭配料（[^）]*）|竹筒饭用米与配料（[^）]*）|粉蒸配料（[^）]*）|菜\/肉配料（[^）]*）|配料（[^）]*待来源确认[^）]*）|蒸米配菜（[^）]*待来源确认[^）]*）/gu;
  return steps.map(step => {
    if (!step || step.provenance === 'source' || typeof step.instruction !== 'string') return step;
    if (!genericIngredient.test(step.instruction)) {
      genericIngredient.lastIndex = 0;
      return step;
    }
    genericIngredient.lastIndex = 0;
    return {
      ...step,
      instruction: step.instruction.replace(genericIngredient, '来源未展开的配料（不要自行添加）'),
      note: `${textForResearch(step.note) || '研究草案步骤，不是来源原文。'} ${warning}`,
    };
  });
}

function makeResearchDraftOverride(spec) {
  if (!spec) return null;
  const ingredients = spec.ingredients.map(([name, value, unit]) => ({
    name,
    amount: { value, unit },
    provenance: 'estimated',
    source_ids: [],
    note: `研究起步量 ${value}${unit}，不是来源原方；首次试做前需回到原文确认。`,
  }));
  const [liquidName, liquidValue, liquidUnit] = spec.liquid;
  const liquid = {
    kind: spec.template === 'steam'
      ? 'steam_water'
      : spec.method_type === 'one_pot_research' ? 'added_water' : 'stage_specific',
    amount: { value: liquidValue, unit: liquidUnit },
    provenance: 'estimated',
    note: '研究起步液体，不是来源液体合同；器具、米种和原料状态需实测校正。',
  };
  const step = (instruction, stepNo) => ({
    step: stepNo,
    instruction,
    provenance: 'estimated',
    source_ids: [],
    note: '研究草案步骤，不是来源原文。',
  });
  const grain = spec.ingredients[0]?.[0] || '米';
  const extra = spec.ingredients.slice(1).map(item => item[0]).join('、') || '来源未展开的配料（不擅自添加）';
  const templates = {
    rice_pot: [
      `淘洗${grain}，浸泡20–30分钟；将${extra}按研究起步量切配。`,
      `先把${extra}在锅中炒香或焯至不生；来源未展开的物种和状态不得擅自替换。`,
      `将${grain}、${extra}和${liquidName}${liquidValue}${liquidUnit}放入锅中，按米种调整液面。`,
      '煮沸后转小火（或按原器具启动煮饭程序），至米粒熟透；关火焖10分钟再翻松。',
      '首次试做记录实际水量、总时长、出锅份数和锅底状态，作为下一次校正依据。',
    ],
    millet: [
      `淘洗${grain}并浸泡20–30分钟；${extra}切洗备用。`,
      `锅中加入${grain}、${extra}和${liquidName}${liquidValue}${liquidUnit}，先大火煮沸。`,
      '转小火焖至米粒柔软、液体基本吸收；小米/黄米不要中途大力搅动。',
      '关火焖10分钟后翻松，检查软硬度和是否粘底。',
      '记录米种、吸水量和总时长；本卡数值只作研究起步。',
    ],
    braised: [
      `淘洗${grain}并浸泡20–30分钟；${extra}切块/切片备用。`,
      `先把${extra}煸炒或焯熟至表面不生，保留锅中香味和油脂。`,
      `加入${grain}和${liquidName}${liquidValue}${liquidUnit}，大火煮开后转小火焖煮。`,
      '确认肉类中心达到适用安全终点、米粒熟透后关火，静置10分钟再拌匀。',
      '首次试做记录肉类状态、液体和锅底锅巴情况，不把草案当作来源定量。',
    ],
    poultry_braise: [
      `淘洗${grain}并浸泡20–30分钟；禽肉切小块，姜葱切末。`,
      `先将禽肉煸至表面不生，再加入姜葱炒香；不要把生禽直接当熟肉处理。`,
      `加入${grain}和${liquidName}${liquidValue}${liquidUnit}，大火煮开后转小火焖煮。`,
      '确认禽肉中心达到74°C且米粒熟透，关火焖10分钟再翻松。',
      '记录禽肉部位、实际液体、总时长和锅具；本卡仍是估算试做稿。',
    ],
    fish_braise: [
      `淘洗${grain}并浸泡20–30分钟；鱼类去鳞去内脏并切段，姜葱切好。`,
      `鱼段先煎/焯至表面不生并去腥；物种和状态仍须以原文确认。`,
      `加入${grain}和${liquidName}${liquidValue}${liquidUnit}，转小火焖煮至米粒熟透。`,
      '确认鱼肉中心达到63°C、肉质不透明且无生心，关火焖10分钟。',
      '记录鱼种、实际水量和总时长；未有来源安全终点的条目不得直接上线。',
    ],
    steam: [
      `淘洗${grain}并浸泡2小时；${extra}按来源确认后切配，浸泡水不当作蒸汽用水。`,
      `蒸锅加${liquidName}${liquidValue}${liquidUnit}至沸腾，把${grain}和${extra}放入蒸笼或耐热容器。`,
      '大火上汽后蒸45–50分钟，检查米粒是否完全熟透；染色材料只按来源确认的种类使用。',
      '关火焖10分钟后开盖，记录蒸锅水量、蒸制时间和口感。',
      '本卡保留蒸锅/蒸笼边界，不换算成普通电饭煲。',
    ],
    claypot: [
      `淘洗${grain}并浸泡20–30分钟；${extra}切配备用。`,
      `砂锅/瓦罉加入${grain}和${liquidName}${liquidValue}${liquidUnit}，大火煮至液面收至米面以下。`,
      `把${extra}铺在米面上，转小火加盖焖煮；锅巴只能以锅底形成状态判断，不强行指定火力。`,
      '米粒熟透后关火焖10分钟，开盖检查锅巴和食材熟度。',
      '原器具是砂锅/瓦罉研究边界；不要直接把这张卡当电饭煲程序。',
    ],
    claypot_seafood: [
      `淘洗${grain}并浸泡20–30分钟；海鲜只按来源确认的物种和状态准备。`,
      `砂锅加入${grain}和${liquidName}${liquidValue}${liquidUnit}，大火煮至液面收低。`,
      '放入海鲜后转小火加盖焖熟，贝类需开壳、鱼虾肉质需完全不透明。',
      '关火焖10分钟再检查锅巴；物种不明或生熟不明时不得将本卡当安全终点。',
      '记录海鲜种类、投料时点、液体和总时长，保留瓦罉/砂锅边界。',
    ],
    claypot_meat: [
      `淘洗${grain}并浸泡20–30分钟；腊味切片并先用热水清洗。`,
      `砂锅加入${grain}和${liquidName}${liquidValue}${liquidUnit}，大火煮至液面收低。`,
      `铺上${extra}，转小火加盖焖煮；腊味须彻底加热后再食用。`,
      '米粒熟透、锅巴形成后关火焖10分钟，切片拌饭。',
      '原器具是砂锅/瓦罉研究边界；记录锅底状态和腊味加热时间。',
    ],
    salted_pork_rice: [
      `淘洗${grain}并浸泡20–30分钟；咸肉切薄片，绣花锦青菜切段并焯水。`,
      '先将咸肉煸出香味，再加入青菜快速翻炒；咸肉盐度不同，调味先不额外加盐。',
      `加入${grain}和${liquidName}${liquidValue}${liquidUnit}，按米种焖熟。`,
      '米粒熟透后焖10分钟再拌匀，确认咸肉彻底加热。',
      '首次记录咸度、青菜出水量和锅底状态；本卡为估算起步。',
    ],
    salted_vegetable: [
      `淘洗${grain}并浸泡20–30分钟；${extra}切碎或切段，先尝咸度。`,
      `用少量油把${extra}炒香，若含腌菜先挤去多余盐水。`,
      `加入${grain}和${liquidName}${liquidValue}${liquidUnit}，煮沸后转小火焖熟。`,
      '关火焖10分钟后翻松，按实际咸度再决定是否补调味。',
      '记录腌菜含水量、实际液体和锅底状态；不是来源原方。',
    ],
    green_rice: [
      `淘洗${grain}并浸泡20–30分钟；青料只按来源确认的种类处理。`,
      `将青料与${liquidName}${liquidValue}${liquidUnit}打汁或煮出染液，过滤掉不可食部分。`,
      `把${grain}与染液放入原器具焖煮，水位按米种调整。`,
      '米粒熟透后焖10分钟再翻松；不把青料名称反推为固定植物。',
      '记录青料种类、液体颜色、米水比和总时长。',
    ],
    soft_rice: [
      `淘洗${grain}并浸泡30分钟；${extra}切细备用。`,
      `加入${grain}、${extra}和${liquidName}${liquidValue}${liquidUnit}，先大火煮开。`,
      '转小火焖至米粒软烂、液体基本吸收；需要更软时分次补少量热水。',
      '关火焖10分钟后压松，检查软硬和粘底。',
      '此卡用于传统软米饭的研究起步，不替代原工艺器具。',
    ],
    bamboo_tube: [
      `淘洗${grain}并浸泡约2小时；竹筒先清洁并检查无裂口，${extra}按来源确认后再准备。`,
      `把${grain}和${extra}装入竹筒，装填不超过筒容积的2/3，避免米粒膨胀溢出。`,
      `加入${liquidName}${liquidValue}${liquidUnit}，封口或覆盖后按来源使用蒸锅/炭火加热；不换算为电饭煲。`,
      '加热至米粒完全熟透，离火后静置10分钟；竹筒耐热、火源和食材安全必须先确认。',
      '首次试做记录竹筒容量、加水量、加热时间和米粒熟度，作为下一次小批量校正依据。',
    ],
    blocked: [
      '停止：本条只保留菜名/地域身份，不是家庭可执行菜谱。',
      '不要购买、清洗、切割或烹调河豚；不得用普通鱼类替代后宣称等价。',
      '如需研究，仅限具备许可、专业去毒流程和监管记录的机构核验原始来源。',
      '本项目不提供河豚去毒、分切、加热或安全终点步骤，也不提供家庭电饭煲换算。',
      '研究记录应回填合法来源、专业安全证明和人工评审；在此之前保持 blocked。',
    ],
    meat_braise: [
      `淘洗${grain}并浸泡20–30分钟；${extra}切块/切片备用。`,
      `先将${extra}煸炒至表面不生，再加入${grain}翻匀。`,
      `加入${liquidName}${liquidValue}${liquidUnit}，煮沸后转小火焖至米粒熟透。`,
      '确认肉类中心达到适用安全终点，关火焖10分钟再翻松。',
      '首次试做记录肉类物种、液体和总时长；没有来源安全证明时只作为研究稿。',
    ],
  };
  const steps = (templates[spec.template] || templates.rice_pot).map((text, index) => step(text, index + 1));
  return {
    method_type: spec.method_type,
    blocked_reason: spec.blocked_reason || null,
    ingredients,
    liquid,
    time: { total_minutes: spec.minutes, provenance: 'estimated', note: '研究起步时长，不是来源总时长。' },
    steps,
    note: '本卡仅将具名条目补成可记录、可复核的研究起步稿；来源没有给出的数量、液体、时间和步骤仍须回到原文或厨房试做确认。',
  };
}

function researchDraftOverride(recipe) {
  const spec = RESEARCH_DRAFT_OVERRIDE_SPECS[recipe?.recipe_id];
  return spec ? makeResearchDraftOverride(spec) : null;
}

// The source-backed catalog deliberately keeps missing contracts as null.  The
// research page still needs to be useful when a source only gives a name or a
// partial method, though.  These helpers create a separate, visibly-labelled
// method card for that purpose.  Values marked `estimated` are deterministic
// starting points for a kitchen notebook; they are never copied into the
// executable recipe library and never affect shelf classification.
const GRAIN_RE = /米|饭|飯|粥|稀饭|稀飯|糯|rice|pilaf|risotto|paella|congee|porridge|biryani|jambalaya|takikomi|gohan|meshi|o-kowa|sekihan|おこわ|赤飯|炊飯/iu;
const PORRIDGE_RE = /粥|稀饭|稀飯|汤饭|湯飯|congee|porridge|chagayu|杂炊|ぞうすい|雑炊/iu;
const STAGED_RE = /熟饭|熟飯|剩饭|剩飯|饭团|飯團|米糕|蒸笼|蒸籠|蒸制|烤箱|另锅|另鍋|另配|另用|配饭|配飯|后拌|後拌|先炒|先煮|回锅|回鍋|二次|饭上|飯上|cooked.?rice|second.?cook|extra.?pan|staged|oven|steam|served.?over.?rice/iu;
const GRAIN_NAME_RE = /^(?:米|大米|白米|短粒日本米|日本米|长粒米|長粒米|糙米|玄米|黑米|小米|高粱米|糯米|粳米|杂粮米|五谷米|珍珠米|茉莉米|红米|紅米|紫米|藜麦|藜麥|rice|brown rice|white rice|jasmine rice|sticky rice|glutinous rice|short.?grain rice|long.?grain rice)$/iu;
const PROTEIN_RULES = Object.freeze([
  { pattern: /鸡|鶏|禽|火鸡|turkey|chicken|poultry/iu, name: '鸡肉', amount: 240, unit: 'g' },
  { pattern: /鸭|鴨|duck/iu, name: '鸭肉', amount: 240, unit: 'g' },
  { pattern: /猪|豚|腊|臘|排骨|pork/iu, name: '猪肉', amount: 200, unit: 'g' },
  { pattern: /牛|beef/iu, name: '牛肉', amount: 200, unit: 'g' },
  { pattern: /羊肉|羊腿|羊排|羊肋|lamb|mutton/iu, name: '羊肉', amount: 220, unit: 'g' },
  { pattern: /鱼|魚|鲑|鮭|鳗|鰻|鱼类|海鲜|海鮮|fish|salmon|seafood/iu, name: '鱼肉/海鲜', amount: 220, unit: 'g' },
  { pattern: /虾|蝦|蟹|蚝|蠔|蛤|贝|貝|shrimp|prawn|crab|oyster|clam|scallop/iu, name: '虾/贝类', amount: 180, unit: 'g' },
  { pattern: /蛋|卵|egg/iu, name: '鸡蛋', amount: 2, unit: '个' },
  { pattern: /豆腐|豆类|黄豆|黑豆|红豆|红腰豆|绿豆|鹰嘴豆|扁豆|毛豆|豆子|tofu|beans?|lentil|soy/iu, name: '豆类/豆制品', amount: 200, unit: 'g' },
]);
const EXPLICIT_NAME_HINT_RULES = Object.freeze([
  { pattern: /鼎罐饭|鼎罐飯/iu, name: '鼎罐饭配菜（研究起步）', amount: 180, unit: 'g' },
  { pattern: /粉蒸糯米饭|粉蒸糯米飯/iu, name: '粉蒸配料（肉/菜研究起步）', amount: 200, unit: 'g' },
  { pattern: /柴火饭|柴火飯/iu, name: '当季蔬菜或副食（研究起步）', amount: 180, unit: 'g' },
  { pattern: /傈僳族手抓饭|傈僳族手抓飯/iu, name: '拌饭配菜（当季菜研究起步）', amount: 200, unit: 'g' },
  { pattern: /竹筒饭|竹筒飯/iu, name: '竹筒饭配料（当季肉/菜研究起步）', amount: 100, unit: 'g' },
  { pattern: /蒸米饭制作技艺|蒸米飯製作技藝/iu, name: '蒸米配菜（当季菜研究起步）', amount: 100, unit: 'g' },
  { pattern: /青精饭|青精飯/iu, name: '青精染色原料（植物汁/叶研究起步）', amount: 100, unit: 'g' },
  { pattern: /三色饭|三色飯/iu, name: '三色染色原料（植物汁/叶研究起步）', amount: 100, unit: 'g' },
  { pattern: /软米饭|軟米飯/iu, name: '当季配菜（软米饭研究起步）', amount: 180, unit: 'g' },
  { pattern: /排骨/iu, name: '排骨', amount: 250, unit: 'g' },
  { pattern: /黄颡鱼|黄顙魚/iu, name: '黄颡鱼', amount: 220, unit: 'g' },
  { pattern: /鲫鱼|鯽魚/iu, name: '鲫鱼', amount: 220, unit: 'g' },
  { pattern: /羊拐/iu, name: '羊拐', amount: 220, unit: 'g' },
  { pattern: /扣肉/iu, name: '扣肉', amount: 200, unit: 'g' },
  { pattern: /咸肉|鹹肉/iu, name: '咸肉', amount: 160, unit: 'g' },
  { pattern: /腊肉|臘肉/iu, name: '腊肉', amount: 160, unit: 'g' },
  { pattern: /豌豆肉|豌豆/iu, name: '豌豆', amount: 150, unit: 'g' },
  { pattern: /虾稻米/iu, name: '虾稻米（米种研究起步）', amount: 180, unit: 'g' },
  { pattern: /腊味锅巴饭|腊味鍋巴飯/iu, name: '腊味配料（腊肉/腊肠研究起步）', amount: 200, unit: 'g' },
  { pattern: /诺鲁孜饭|諾魯孜飯/iu, name: '诺鲁孜饭主料（蔬菜/肉禽/干果研究起步）', amount: 520, unit: 'g' },
  { pattern: /荷叶|荷葉/iu, name: '荷叶', amount: 1, unit: '片' },
  { pattern: /香油饭|香油飯/iu, name: '香油', amount: 15, unit: 'mL' },
  { pattern: /枣焖饭|棗燜飯|红枣|紅棗/iu, name: '枣', amount: 50, unit: 'g' },
]);
const SOURCE_IDENTITY_INGREDIENT_HINT_NAMES = Object.freeze([
  '小麦', '大麦', '玉米', '黄米', '高粱', '豌豆', '七种蔬菜', '七种畜禽肉', '多种干果',
]);
const VEGETABLE_RULES = Object.freeze([
  { pattern: /香菇|蘑菇|木耳|菇|mushroom/iu, name: '菌菇', amount: 120, unit: 'g' },
  { pattern: /白菜|青菜|芥菜|菜饭|菠菜|芹菜|cabbage|greens|spinach|celery/iu, name: '青菜', amount: 180, unit: 'g' },
  { pattern: /胡萝卜|胡蘿蔔|萝卜|蘿蔔|carrot/iu, name: '胡萝卜', amount: 120, unit: 'g' },
  { pattern: /南瓜|冬瓜|瓠瓜|芋头|芋頭|pumpkin|squash|taro/iu, name: '瓜/芋类', amount: 180, unit: 'g' },
  { pattern: /竹笋|竹筍|笋|筍|bamboo/iu, name: '竹笋', amount: 150, unit: 'g' },
  { pattern: /豆角|四季豆|豌豆|青豆|毛豆|豆类蔬菜|peas?|beans?/iu, name: '豆类蔬菜', amount: 150, unit: 'g' },
  { pattern: /洋葱|洋蔥|onion/iu, name: '洋葱', amount: 100, unit: 'g' },
]);
// Only concrete food names are allowed here. Broad labels such as “蔬菜” or
// “海鲜” are intentionally excluded because they can describe a group or a
// nutrition line rather than an ingredient. These hints are used only when a
// canonical record has no fixed-batch ingredient list.
const SOURCE_INGREDIENT_HINT_NAMES = Object.freeze([
  '鸡蛋', '鸭蛋', '起司', '奶油', '冬菇', '干贝', '牡蛎', '蛤蜊', '鲑鱼', '鲭鱼',
  '虾', '芋头', '山药', '玉米笋', '黄椒', '红蟳', '油豆腐', '花生', '火腿', '腊肠',
  '竹笋', '豆腐', '四季豆',
]);

// Identity-only records still deserve a useful kitchen starting point, but
// their name or vessel must not silently become a canonical recipe.  These
// profiles keep the original equipment boundary visible while replacing the
// misleading generic “put everything in a rice cooker” sequence with a
// method-shaped research draft.  Every value produced from a profile remains
// `estimated` and is never promoted into the source-backed contracts.
function researchNameProfile(recipe) {
  const search = recipeSearchText(recipe);
  const vessels = Array.isArray(recipe?.traditional_vessels) ? recipe.traditional_vessels.join(' ') : '';
  if (/竹筒/iu.test(search) || /竹筒/iu.test(vessels)) {
    return {
      kind: 'bamboo_tube',
      label: '竹筒装填/加热研究稿',
      boundary: true,
      liquid: { name: '竹筒加水', amount: { value: 450, unit: 'mL' } },
      note: '菜名或器具明确提到竹筒；研究稿保留竹筒装填与加热边界，不换算成普通电饭煲。',
    };
  }
  if (/粉蒸|蒸米饭|蒸飯|三色饭|三色飯|青精饭|青精飯|蒸饭|蒸飯/iu.test(search)) {
    return {
      kind: 'steam',
      label: '蒸锅研究稿',
      boundary: true,
      liquid: { name: '蒸锅用水', amount: { value: 1500, unit: 'mL' } },
      note: '菜名明确含“蒸”；研究稿把水写成蒸汽用水，不把蒸锅水误当成米的吸水量。',
    };
  }
  if (/焗饭|焗飯|焗/iu.test(search)) {
    return {
      kind: 'baked',
      label: '焗/带盖烤制研究稿',
      boundary: true,
      liquid: { name: '清水或高汤', amount: { value: 450, unit: 'mL' } },
      note: '菜名含“焗”；研究稿保留带盖焗/烤或砂锅阶段，不把烤箱/砂锅当作电饭煲等价物。',
    };
  }
  if (/柴火|柴火灶|鼎罐|鼎鍋/iu.test(search) || /柴火|鼎罐|鼎鍋/iu.test(vessels)) {
    return {
      kind: 'hearth_pot',
      label: '传统灶/鼎罐研究稿',
      boundary: true,
      liquid: { name: '清水或高汤', amount: { value: 450, unit: 'mL' } },
      note: '菜名或器具提示柴火灶/鼎罐；研究稿保留大火转小火和原锅边界。',
    };
  }
  if (/抓饭|手抓饭|拌饭|pilaf/iu.test(search)) {
    return {
      kind: 'pilaf',
      label: '抓饭/拌饭研究稿',
      boundary: false,
      liquid: { name: '清水或高汤', amount: { value: 450, unit: 'mL' } },
      note: '菜名提示抓饭或拌饭；研究稿采用先处理配料、再与米焖熟的顺序，物种不明处保留待核。',
    };
  }
  if (PORRIDGE_RE.test(search)) {
    return {
      kind: 'porridge',
      label: '粥/汤饭研究稿',
      boundary: false,
      liquid: { name: '清水或高汤', amount: { value: 900, unit: 'mL' } },
      note: '菜名提示粥或汤饭；研究稿以100g米、900mL液体起步，蛋白和配料状态仍须按来源确认。',
    };
  }
  return {
    kind: 'rice_pot',
    label: '普通锅/电饭煲研究稿',
    boundary: false,
    liquid: { name: '清水或高汤', amount: { value: 450, unit: 'mL' } },
    note: '来源没有足够流程字段时，研究稿使用300g米、450mL液体的普通锅/电饭煲起步模板；不是来源原方或跨器具合同。',
  };
}

function textForResearch(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isLikelyGrainIngredientName(value) {
  const name = textForResearch(value);
  if (!name || /玉米|甜玉米|玉蜀黍|米饭|米飯|米糕|锅巴|鍋巴/iu.test(name)) return false;
  return GRAIN_NAME_RE.test(name);
}

function sourceIngredientRows(recipe) {
  const sourceIngredients = Array.isArray(recipe?.fixed_batch?.ingredients)
    ? recipe.fixed_batch.ingredients : [];
  return sourceIngredients.map(item => ({
    name: textForResearch(item?.name) || '未命名食材',
    amount: item?.amount && typeof item.amount === 'object' ? { ...item.amount } : null,
    provenance: 'source',
    source_ids: Array.isArray(item?.source_ids) ? [...item.source_ids] : [],
  }));
}

function researchIngredientDisplayName(value) {
  const name = textForResearch(value);
  if (/虾稻米/iu.test(name)) return '虾稻米（米种研究起步）';
  if (/腊味.*构成待核/iu.test(name)) return '腊味配料（腊肉/腊肠研究起步）';
  if (/蔬菜副食（种类多样）/iu.test(name)) return '当季蔬菜或副食（按来源选取）';
  if (/咸饭（具体构成待补）/iu.test(name)) return '咸饭配料（米/菜/肉按来源选取）';
  if (/青米饭（具体构成待补）/iu.test(name)) return '青米饭原料（米/青料按来源选取）';
  if (/米（具体构成待补）/iu.test(name)) return '竹筒饭用米与配料（按来源选取）';
  if (/糯米（具体构成待补）/iu.test(name)) return '糯米饭配料（糯米/配菜按来源选取）';
  if (/配菜（具体组合待补）/iu.test(name)) return '钵子饭配菜（按季节选取）';
  if (/七种蔬菜（种类待来源确认）/iu.test(name)) return '七种应季蔬菜（按来源选取）';
  if (/七种畜禽肉（种类待来源确认）/iu.test(name)) return '七种畜禽肉（按来源选定物种）';
  if (/多种干果（种类待来源确认）/iu.test(name)) return '多种干果（按来源选取）';
  if (/物种待来源确认/iu.test(name)) return name.replaceAll('物种待来源确认', '按来源选定物种');
  return name;
}

function coreHintRows(recipe, existingRows) {
  const core = Array.isArray(recipe?.core_ingredients)
    ? recipe.core_ingredients.filter(value => textForResearch(value)) : [];
  const existing = Array.isArray(existingRows) ? existingRows : [];
  return core.filter(name => !existing.some(row => {
    const left = textForResearch(row?.name);
    const right = textForResearch(name);
    if (!left || !right) return false;
    if (left === right || left.includes(right) || right.includes(left)) return true;
    return /米|rice|糯/iu.test(left) && /米|rice|糯/iu.test(right);
  })).map(name => ({
    name: researchIngredientDisplayName(name),
    amount: null,
    provenance: 'source_hint',
    source_ids: [],
    note: '目录核心食材保留了该名称，但当前来源没有可核对用量。',
  }));
}

const QUANTITY_UNIT_RE = '(?:g|克|kg|千克|毫升|ml|mL|升|杯|合|碗|个|只|条|根|颗|枚|朵|片|块|瓣|束|段|包|盒|罐|听|汤匙|湯匙|大匙|大勺|小匙|小勺|茶匙|盎司|磅|oz|lb|cup)';
const QUANTITY_VALUE_RE = '(?:\\d+(?:\\.\\d+)?\\s*(?:又|\\+)\\s*\\d+\\s*\\/\\s*\\d+|\\d+\\s*\\/\\s*\\d+|\\d+(?:\\.\\d+)?|半|[一二两兩三四五六七八九十百千]+)';

function parseResearchQuantityValue(value) {
  const raw = String(value || '').trim();
  const normalized = raw.replace(/\s+/gu, '');
  const mixed = normalized.match(/^(\d+(?:\.\d+)?)(?:又|\+)(\d+)\/(\d+)$/u);
  if (mixed) {
    const whole = Number(mixed[1]);
    const numerator = Number(mixed[2]);
    const denominator = Number(mixed[3]);
    if (denominator > 0 && Number.isFinite(whole) && Number.isFinite(numerator) && Number.isFinite(denominator)) {
      return whole + numerator / denominator;
    }
  }
  if (normalized.includes('/')) {
    const [numerator, denominator] = normalized.split('/').map(Number);
    if (denominator > 0 && Number.isFinite(numerator) && Number.isFinite(denominator)) return numerator / denominator;
  }
  if (normalized === '半') return 0.5;
  if (/^[一二两兩三四五六七八九十百千]+$/u.test(normalized)) {
    const digits = { 一: 1, 二: 2, 两: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
    let total = 0;
    let section = 0;
    let number = 0;
    for (const char of normalized) {
      if (digits[char] != null) {
        number = digits[char];
        continue;
      }
      const unit = { 十: 10, 百: 100, 千: 1000 }[char];
      if (!unit) return null;
      section += (number || 1) * unit;
      number = 0;
      if (unit >= 1000) {
        total += section;
        section = 0;
      }
    }
    const chinese = total + section + number;
    if (chinese > 0) return chinese;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function isRangeQuantityContext(locator, index, matchText) {
  const before = locator.slice(Math.max(0, index - 12), index);
  const after = locator.slice(index + matchText.length, Math.min(locator.length, index + matchText.length + 12));
  return /(?:至|到|~|～|–|—|-)\s*$/u.test(before)
    || /^\s*(?:至|到|~|～|–|—|-)/u.test(after);
}

function quantityNameVariants(name) {
  const text = textForResearch(name);
  if (!text || /或|或者|\/|、/u.test(text)) return [];
  const variants = new Set([text]);
  const scriptMap = {
    雞: '鸡', 鶏: '鸡', 豬: '猪', 鮭: '鲑', 魚: '鱼', 鰻: '鳗',
    蝦: '虾', 蟹: '蟹', 蠔: '蚝', 蛤: '蛤', 貝: '贝', 鮮: '鲜',
    乾: '干', 紅: '红', 綠: '绿', 蘿蔔: '萝卜', 蘿: '萝', 蔔: '卜', 藥: '药',
    胡蘿蔔: '胡萝卜', 洋蔥: '洋葱', 蔥: '葱', 姜: '姜', 薑: '姜',
    香菇: '香菇', 高麗菜: '高丽菜', 芋頭: '芋头', 竹筍: '竹笋',
    番茄: '番茄', 鮮奶: '鲜奶', 高湯: '高汤', 湯: '汤', 水: '水',
  };
  let simplified = text;
  for (const [from, to] of Object.entries(scriptMap)) simplified = simplified.replaceAll(from, to);
  if (simplified !== text) variants.add(simplified);
  if (/米饭|米飯/u.test(text)) variants.add('米');
  if (/^(?:大米|白米|日本米|长粒米|長粒米)$/iu.test(text)) variants.add('米');
  if (/^(?:鲜|新鲜|新鮮|干|乾)/u.test(text) && text.length > 2) variants.add(text.slice(1));
  if (/冬菇|香菇/iu.test(text)) {
    variants.add('香菇');
    variants.add('冬菇');
  }
  if (/肉$/u.test(text) && text.length > 2) variants.add(text.slice(0, -1));
  for (const variant of [...variants]) {
    const withoutPrep = variant.replace(/^(?:去骨|去皮|带骨|帶骨|仿)/u, '');
    if (withoutPrep && withoutPrep !== variant) variants.add(withoutPrep);
    if (/肉$/u.test(withoutPrep) && withoutPrep.length > 2) variants.add(withoutPrep.slice(0, -1));
  }
  return [...variants].filter(Boolean).sort((a, b) => b.length - a.length);
}

function ingredientNamesOverlap(left, right) {
  const leftVariants = quantityNameVariants(left);
  const rightVariants = quantityNameVariants(right);
  return leftVariants.some(leftName => rightVariants.some(rightName => {
    if (leftName === rightName || leftName.includes(rightName) || rightName.includes(leftName)) return true;
    return /鸡|鸡蛋|鸭|猪|牛|羊|鱼|虾|蟹|蚝|蛤|贝/iu.test(leftName)
      && /鸡|鸡蛋|鸭|猪|牛|羊|鱼|虾|蟹|蚝|蛤|贝/iu.test(rightName);
  }));
}

function hasLiquidNameSuffix(locator, candidate, matchIndex) {
  const end = (matchIndex ?? 0) + candidate.length;
  const suffix = locator.slice(end, end + 8);
  return /^(?:水|汤|湯|高汤|高湯|汁|液|water|broth)/iu.test(suffix);
}

function sourceQuantityHintForName(recipe, name, options = {}) {
  const names = quantityNameVariants(name);
  if (!names.length) return null;
  const scopes = Array.isArray(options.scopes) && options.scopes.length ? options.scopes : ['quantity'];
  const acceptMatch = typeof options.acceptMatch === 'function' ? options.acceptMatch : () => true;
  const hits = [];
  for (const source of (Array.isArray(recipe?.source_refs) ? recipe.source_refs : [])) {
    if (source?.access_status !== 'opened'
      || !Array.isArray(source?.claim_scopes)
      || !source.claim_scopes.some(scope => scopes.includes(scope))) continue;
    const locator = textForResearch(source?.evidence_locator);
    if (!locator) continue;
    for (const candidate of names) {
      const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
      const patterns = [
        new RegExp(`${escaped}(?![饭飯])[^\\d/、,，;；]{0,8}(${QUANTITY_VALUE_RE})\\s*(${QUANTITY_UNIT_RE})`, 'iu'),
        new RegExp(`(${QUANTITY_VALUE_RE})\\s*(${QUANTITY_UNIT_RE})[^\\d/、,，;；]{0,4}${escaped}`, 'iu'),
      ];
      for (const pattern of patterns) {
        const match = pattern.exec(locator);
        if (!match) continue;
        if (!acceptMatch(locator, match.index ?? 0, match[0])) continue;
        if (isRangeQuantityContext(locator, match.index ?? 0, match[0])) continue;
        // “香菇水 200mL” is a soaking liquid, not 200mL of mushrooms;
        // likewise “猪肉高汤” must not become a pork quantity hint.
        const candidateIndex = locator.indexOf(candidate, match.index ?? 0);
        // A generic grain alias such as “米” also occurs inside “米酒”.
        // Do not let the seasoning quantity shadow the actual rice quantity.
        if (candidate === '米' && /[酒饭飯糕粥]/u.test(locator[candidateIndex + candidate.length] || '')) continue;
        if (candidateIndex >= 0 && hasLiquidNameSuffix(locator, candidate, candidateIndex)
          && !/水|汤|湯|高汤|高湯|汁|液|water|broth/iu.test(candidate)) continue;
        const value = parseResearchQuantityValue(match[1]);
        const unit = String(match[2] || '').toLowerCase();
        if (!(value > 0) || /人份|份/u.test(unit)) continue;
        hits.push({
          amount: { value, unit: match[2] },
          candidate,
          source_id: textForResearch(source?.source_id),
          title: textForResearch(source?.title) || '原文',
          locator,
        });
        break;
      }
      if (hits.some(hit => hit.locator === locator && hit.source_id === textForResearch(source?.source_id))) break;
    }
  }
  // Prefer a direct match for the requested ingredient name over a shorter
  // alias.  For example, “白米1杯” is authoritative for 白米; the generic
  // alias 米 may also occur in the seasoning name 米酒 and must not create a
  // false quantity conflict.
  const exactHits = hits.filter(hit => hit.candidate === textForResearch(name));
  const scopedHits = exactHits.length ? exactHits : hits;
  const unique = new Map(scopedHits.map(hit => [`${hit.amount.value}|${String(hit.amount.unit).toLowerCase()}`, hit]));
  if (unique.size !== 1) return null;
  const hit = [...unique.values()][0];
  return {
    amount: hit.amount,
    source_ids: [...new Set(scopedHits.map(item => item.source_id).filter(Boolean))],
    note: `原文量线索解析为 ${hit.amount.value}${hit.amount.unit}；该值仍保留为来源线索，未写入 canonical 定量合同。`,
  };
}

function sourceLiquidHint(recipe) {
  const candidates = ['高汤', '高湯', '鸡汤', '雞湯', '出汁', '鲜奶', '鮮奶', '牛奶', '椰浆', '椰漿', '清水', '水'];
  const hints = [];
  for (const name of candidates) {
    const hint = sourceQuantityHintForName(recipe, name, {
      scopes: ['quantity', 'liquid'],
      acceptMatch: (locator, index) => {
        const context = locator.slice(Math.max(0, index - 28), Math.min(locator.length, index + 28));
        return !/外锅|外鍋|内锅|內鍋|内外锅|內外鍋|水位|waterline/iu.test(context);
      },
    });
    if (hint) hints.push({ name, ...hint });
  }
  const unique = new Map(hints.map(hint => [`${hint.amount.value}|${String(hint.amount.unit).toLowerCase()}`, hint]));
  if (unique.size !== 1) return null;
  const hint = [...unique.values()][0];
  return {
    name: hint.name,
    amount: hint.amount,
    source_ids: hint.source_ids,
    note: `原文液体线索解析为${hint.name}${hint.amount.value}${hint.amount.unit}；该值仍保留为来源线索，未写入 canonical 液体合同。`,
  };
}

function attachSourceQuantityHints(recipe, rows) {
  return rows.map(row => {
    if (!row || row.provenance === 'source') return row;
    const isGrain = isLikelyGrainIngredientName(row.name)
      || /米饭|米飯|熟饭|熟飯|白饭|白飯|rice/iu.test(textForResearch(row.name));
    if (row.amount && !isGrain) return row;
    const hint = sourceQuantityHintForName(recipe, row.name);
    if (!hint) return row;
    return {
      ...row,
      amount: hint.amount,
      provenance: 'source_hint',
      source_ids: hint.source_ids,
      note: hint.note,
    };
  });
}

function sourceIngredientHintRows(recipe, existingRows) {
  if (recipe?.fixed_batch) return [];
  const existing = Array.isArray(existingRows) ? existingRows : [];
  return SOURCE_INGREDIENT_HINT_NAMES.map(name => {
    if (existing.some(row => ingredientNamesOverlap(row?.name, name))) return null;
    const hint = sourceQuantityHintForName(recipe, name, { scopes: ['ingredients', 'quantity'] });
    if (!hint) return null;
    return {
      name,
      amount: hint.amount,
      provenance: 'source_hint',
      source_ids: hint.source_ids,
      note: hint.note,
    };
  }).filter(Boolean);
}

function sourceIdentityIngredientHintRows(recipe, existingRows) {
  if (recipe?.fixed_batch) return [];
  const existing = Array.isArray(existingRows) ? existingRows : [];
  const sources = (Array.isArray(recipe?.source_refs) ? recipe.source_refs : [])
    .filter(source => source?.access_status === 'opened'
      && Array.isArray(source?.claim_scopes)
      && source.claim_scopes.includes('ingredients'));
  return SOURCE_IDENTITY_INGREDIENT_HINT_NAMES.map(name => {
    if (existing.some(row => ingredientNamesOverlap(row?.name, name))) return null;
    const source = sources.find(item => textForResearch(item?.evidence_locator).includes(name));
    if (!source) return null;
    const displayName = name === '七种蔬菜'
      ? '七种应季蔬菜（按来源选取）'
      : name === '七种畜禽肉'
        ? '七种畜禽肉（按来源选定物种）'
        : name === '多种干果'
          ? '多种干果（按来源选取）'
          : name;
    return {
      name: displayName,
      amount: null,
      provenance: 'source_hint',
      source_ids: source.source_id ? [source.source_id] : [],
      note: `原文只点名“${name}”，没有可核对定量；研究卡会给出估算起步量，但不能当作原方。`,
    };
  }).filter(Boolean);
}

function replaceGenericLiquidRow(rows, sourceLiquidEstimate, recipe) {
  const hasNamedLiquid = rows.some(row => {
    const name = textForResearch(row?.name);
    return name && !/^(?:清水或高汤|清水或高湯|水或高汤|水或高湯)$/u.test(name)
      && /水|汤|湯|高汤|高湯|broth|water/iu.test(name);
  });
  if (hasNamedLiquid) {
    return rows.filter(row => !/^(?:清水或高汤|清水或高湯|水或高汤|水或高湯)$/u.test(textForResearch(row?.name)));
  }
  if (!sourceLiquidEstimate) return rows;
  let replaced = false;
  return rows.map(row => {
    if (replaced || row?.provenance === 'source' || !/^(?:清水或高汤|清水或高湯|水或高汤|水或高湯)$/u.test(textForResearch(row?.name))) return row;
    replaced = true;
    return {
      ...row,
      name: sourceLiquidEstimate.name,
      amount: sourceLiquidEstimate.amount,
      provenance: 'source_hint',
      source_ids: sourceLiquidEstimate.source_ids,
      note: sourceLiquidEstimate.note,
    };
  });
}

function sourceStepRows(recipe) {
  return (Array.isArray(recipe?.cooking_sequence) ? recipe.cooking_sequence : [])
    .filter(step => step && textForResearch(step.instruction))
    .map((step, index) => ({
      step: Number.isInteger(step.step) && step.step > 0 ? step.step : index + 1,
      instruction: textForResearch(step.instruction),
      provenance: 'source',
      source_ids: Array.isArray(step.source_ids) ? [...step.source_ids] : [],
    }));
}

function sourceProcessHintRows(recipe) {
  const hint = sourceLocatorHints(recipe, 'process')[0];
  if (!hint) return [];
  return [{
    step: 1,
    instruction: '原文流程线索：' + hint.text,
    provenance: 'source_hint',
    source_ids: hint.source_ids,
    note: '来源只提供流程定位摘要；后续步骤仍是研究补充，不等于 canonical 做法。',
  }];
}

function recipeSearchText(recipe) {
  const cookerNotes = textForResearch(recipe?.cooker_adaptation?.notes);
  const nameAndCore = [
    recipe?.canonical_name,
    ...(Array.isArray(recipe?.aliases) ? recipe.aliases : []),
    ...(Array.isArray(recipe?.core_ingredients) ? recipe.core_ingredients : []),
  ].filter(Boolean).join(' ');
  const base = [
    nameAndCore,
    cookerNotes,
  ].filter(Boolean).join(' ');
  const evidence = textForResearch(recipe?.evidence_notes);
  // A few publisher pages contain a copied or misaligned directions block.
  // Do not let the stray word “粥”/“porridge” in that negative evidence turn a
  // rice dish into a porridge research template.  The mismatch remains
  // visible in source facts; it is simply excluded from method-shape
  // inference.
  if (/(?:步骤区|步骤内容|directions?).*(?:错配|不一致|不匹配|mismatch|misalign)|(?:错配|不一致|不匹配|mismatch|misalign).*(?:步骤区|步骤内容|directions?)/iu.test(`${evidence} ${cookerNotes}`)) {
    return nameAndCore;
  }
  return [base, evidence].filter(Boolean).join(' ');
}

// Evidence notes often contain explicit negative statements such as “do not
// expand 羊拐 to 羊肉” or mention an adjacent dish only to exclude it.  They
// remain useful for process/boundary classification, but must not be used as
// positive ingredient hints for a research draft.
function recipeIngredientHintText(recipe) {
  return [
    recipe?.canonical_name,
    ...(Array.isArray(recipe?.aliases) ? recipe.aliases : []),
    ...(Array.isArray(recipe?.core_ingredients) ? recipe.core_ingredients : []),
  ].filter(Boolean).join(' ');
}

function uniqueByName(rows) {
  const seen = new Set();
  return rows.filter(row => {
    const key = textForResearch(row?.name).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function estimatedAmountForHint(name, recipe) {
  const ingredient = textForResearch(name) || '未命名食材';
  const search = recipeIngredientHintText(recipe);
  const porridge = PORRIDGE_RE.test(search);
  const normalized = ingredient.toLowerCase();

  if (/水|高汤|高湯|汤|湯|broth|water/iu.test(ingredient)) {
    return { value: porridge ? 900 : 450, unit: 'mL' };
  }
  if (GRAIN_NAME_RE.test(ingredient) || /米饭|米飯|熟饭|熟飯|白饭|白飯|rice/iu.test(ingredient)) {
    return { value: porridge ? 100 : 300, unit: 'g' };
  }
  const protein = PROTEIN_RULES.find(rule => rule.pattern.test(ingredient));
  if (protein) return { value: protein.amount, unit: protein.unit };
  if (/肉|肉末|肉絲|肉丝|腊|臘|腸|肠|火腿|培根|sausage|ham/iu.test(ingredient)) {
    return { value: 180, unit: 'g' };
  }
  const vegetable = VEGETABLE_RULES.find(rule => rule.pattern.test(ingredient));
  if (vegetable) return { value: vegetable.amount, unit: vegetable.unit };
  // Small preserved/strongly flavoured ingredients should not inherit the
  // generic 100 g fallback.  These are research starting points only; when a
  // source gives an exact amount, sourceIngredientRows() wins before this
  // function is reached.
  if (/豆豉|豆瓣|味噌|豆酱|豆醬|腐乳|酱料|醬料|酱汁|醬汁|miso|bean paste/iu.test(ingredient)) {
    return { value: 20, unit: 'g' };
  }
  if (/虾米|蝦米|虾皮|蝦皮|瑶柱|瑤柱|干贝|乾貝|小鱼干|小魚乾|鱼干|魚乾|海米|dried shrimp|dried scallop/iu.test(ingredient)) {
    return { value: 20, unit: 'g' };
  }
  if (/红枣|紅棗|栗子|板栗|花生|核桃|杏干|杏乾|葡萄干|葡萄乾|坚果|堅果|chestnut|peanut|walnut|raisin/iu.test(ingredient)) {
    return { value: 50, unit: 'g' };
  }
  if (/粉条|粉條|粉丝|粉絲|glass noodle|vermicelli/iu.test(ingredient)) {
    return { value: 60, unit: 'g' };
  }
  if (/油|酱油|醬油|酱汁|醬汁|盐|鹽|糖|醋|料酒|酒|姜|薑|葱|蔥|蒜|咖喱|咖哩|香料|调味|調味|seasoning|oil/iu.test(ingredient)) {
    return { value: /油|oil/iu.test(normalized) ? 15 : 5, unit: /油|oil/iu.test(normalized) ? 'mL' : 'g' };
  }
  if (/蛋|卵|egg/iu.test(ingredient)) return { value: 2, unit: '个' };
  return { value: 100, unit: 'g' };
}

function completeEstimatedIngredientRows(recipe, rows) {
  return rows.map(row => {
    if (row?.amount) return row;
    const amount = estimatedAmountForHint(row?.name, recipe);
    const unresolvedCore = row?.provenance === 'unknown'
      || /主料.*待核|核心食材.*待核/iu.test(textForResearch(row?.name));
    const sourceNamedOnly = row?.provenance === 'source_hint'
      && Array.isArray(row?.source_ids)
      && row.source_ids.length > 0;
    return {
      ...row,
      amount,
      provenance: 'estimated',
      note: unresolvedCore
        ? `原始页面未展开核心食材；这里用研究占位量 ${amount.value}${amount.unit} 仅保证卡片可起步，不能从菜名反推，也不可用泛名替代，必须先回到原文确认。`
        : sourceNamedOnly
          ? `原文只点名“${textForResearch(row?.name)}”，没有可核对定量；这里用研究起步量 ${amount.value}${amount.unit}，不是来源原方。`
        : `原文/目录只提示“${textForResearch(row?.name) || '未命名食材'}”，没有可核对定量；这里用研究起步量 ${amount.value}${amount.unit}，不是来源原方。`,
    };
  });
}

function inferDraftIngredients(recipe) {
  const search = recipeIngredientHintText(recipe);
  const core = Array.isArray(recipe?.core_ingredients)
    ? recipe.core_ingredients.filter(value => textForResearch(value)) : [];
  const rows = [];
  let namedHintFound = false;
  const porridge = PORRIDGE_RE.test(search);
  const sticky = /糯|sticky|glutinous|sekihan|おこわ/iu.test(search);
  const grainName = core.find(name => isLikelyGrainIngredientName(name) && !/饭|飯|粥/iu.test(name))
    || (sticky ? '糯米' : '大米');
  rows.push({
    name: grainName,
    amount: { value: porridge ? 100 : 300, unit: 'g' },
    provenance: 'estimated',
    source_ids: [],
    note: '按2人份研究起步量估算；原文未给可核对的固定米量。',
  });

  const coreRows = uniqueByName(core.map(value => ({ name: value })))
    .filter(item => !(isLikelyGrainIngredientName(item.name) && isLikelyGrainIngredientName(grainName)));
  if (coreRows.length) {
    // Prefer the catalog's own core-ingredient names.  This avoids turning a
    // source hint such as “小豆” into unrelated generic rows like “豆腐/豆类”
    // and “豆类蔬菜”.  The amount is still estimated later and visibly marked.
    rows.push(...coreRows.map(item => {
      const displayName = researchIngredientDisplayName(item.name);
      return {
      ...item,
      name: displayName,
      amount: null,
      provenance: 'source_hint',
      source_ids: [],
      note: '来源/目录保留了该食材名称，但没有可核对用量。',
      };
    }));
  } else {
    const explicitNameHints = EXPLICIT_NAME_HINT_RULES
      .filter(rule => rule.pattern.test(search));
    namedHintFound = explicitNameHints.length > 0;
    rows.push(...explicitNameHints.map(rule => ({
      name: rule.name,
      amount: { value: rule.amount, unit: rule.unit },
      provenance: 'estimated',
      source_ids: [],
      note: `菜名明确提到“${rule.name}”；这里用研究起步量 ${rule.amount}${rule.unit}，不是来源原方，仍需回到原文确认完整配方。`,
    })));
    const explicitProteinHint = explicitNameHints.some(rule => /鱼|羊拐|扣肉|咸肉|腊肉|排骨/iu.test(rule.name));
    const protein = PROTEIN_RULES.find(rule => rule.pattern.test(search));
    if (protein) namedHintFound = true;
    if (protein && !explicitProteinHint) rows.push({
      name: protein.name,
      amount: { value: protein.amount, unit: protein.unit },
      provenance: 'estimated',
      source_ids: [],
      note: '按2人份研究起步量估算；首次试做需按原料状态和锅具调整。',
    });

    if (!protein && !explicitProteinHint && /肉|meat/iu.test(search)) rows.push({
      name: '抓饭肉类（按来源选定物种）',
      amount: { value: 180, unit: 'g' },
      provenance: 'estimated',
      source_ids: [],
      note: '菜名只提示“肉类”而未说明物种或部位；180g仅作研究起步量，首次试做前需按当地来源或实际采购物种确认。',
    });

    const vegetables = [];
    for (const rule of VEGETABLE_RULES) {
      if (rule.pattern.test(search)) vegetables.push(rule);
      if (vegetables.length >= 3) break;
    }
    if (vegetables.length) namedHintFound = true;
    for (const rule of vegetables) rows.push({
      name: rule.name,
      amount: { value: rule.amount, unit: rule.unit },
      provenance: 'estimated',
      source_ids: [],
      note: '按2人份研究起步量估算；来源未给此项固定用量。',
    });
  }
  if (rows.length === 1 && !core.length && !namedHintFound) rows.push({
    name: '菜名未展开的配料（研究起步）',
    amount: { value: 180, unit: 'g' },
    provenance: 'estimated',
    source_ids: [],
    note: '原始页面未展开核心食材；180g仅作研究起步量，不是来源原方，首次试做前必须按原文或实际采购物种确认。',
  });
  if (!porridge) rows.push({
    name: '清水或高汤',
    amount: { value: 450, unit: 'mL' },
    provenance: 'estimated',
    source_ids: [],
    note: '按300g米的研究起步液体量估算；应优先以原锅水位或米种吸水性校正。',
  });
  else rows.push({
    name: '清水或高汤',
    amount: { value: 900, unit: 'mL' },
    provenance: 'estimated',
    source_ids: [],
    note: '按100g米的研究起步粥水量估算；来源未给固定液体。',
  });
  return rows;
}

function applyResearchProfileToIngredients(rows, profile) {
  if (!profile || !Array.isArray(rows)) return rows;
  return rows.map(row => {
    if (!row || !/^(?:清水或高汤|水或高湯|水或高汤)$/u.test(textForResearch(row.name))) return row;
    return {
      ...row,
      name: profile.liquid.name,
      amount: profile.liquid.amount,
      provenance: 'estimated',
      source_ids: [],
      note: `${profile.label}起步量 ${profile.liquid.amount.value}${profile.liquid.amount.unit}；${profile.note}不是来源原方液体定量。`,
    };
  });
}

function sourceFactRows(recipe) {
  const facts = [];
  if (textForResearch(recipe?.evidence_notes)) {
    facts.push({ text: textForResearch(recipe.evidence_notes), source_ids: [] });
  }
  for (const source of (Array.isArray(recipe?.source_refs) ? recipe.source_refs : []).slice(0, 4)) {
    if (textForResearch(source?.evidence_locator)) {
      facts.push({
        text: `${textForResearch(source.title) || '来源'}：${textForResearch(source.evidence_locator)}`,
        source_ids: source.source_id ? [source.source_id] : [],
      });
    }
  }
  return facts;
}

function sourceServingsHint(recipe) {
  if (recipe?.fixed_batch) return null;
  const servingPattern = /(?:\d+(?:\.\d+)?\s*(?:至|到|~|～|–|-))?\s*\d+(?:\.\d+)?\s*(?:人份|份|人分|人前)/u;
  for (const source of (Array.isArray(recipe?.source_refs) ? recipe.source_refs : [])) {
    if (source?.access_status !== 'opened' || !source?.claim_scopes?.includes('quantity')) continue;
    const locator = textForResearch(source?.evidence_locator);
    const match = locator.match(servingPattern);
    if (!match) continue;
    const index = match.index ?? 0;
    const start = Math.max(0, index - 24);
    const end = Math.min(locator.length, index + match[0].length + 24);
    const context = locator.slice(start, end).replace(/^.*?(?=\S)/u, '').trim();
    return {
      text: `${textForResearch(source.title) || '原文'}：${context}`,
      source_ids: source.source_id ? [source.source_id] : [],
      provenance: 'source',
      note: '原文份数提示；若为范围，不压缩成固定批量。',
    };
  }
  return null;
}

function sourceLocatorHints(recipe, scope) {
  const seen = new Set();
  return (Array.isArray(recipe?.source_refs) ? recipe.source_refs : [])
    .filter(source => source?.access_status === 'opened'
      && Array.isArray(source?.claim_scopes)
      && source.claim_scopes.includes(scope)
      && textForResearch(source?.evidence_locator))
    .map(source => {
      const sourceId = textForResearch(source?.source_id);
      const key = `${sourceId}\u0000${textForResearch(source?.evidence_locator)}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return {
        text: `${textForResearch(source?.title) || '来源'}：${textForResearch(source?.evidence_locator)}`,
        source_ids: sourceId ? [sourceId] : [],
        provenance: 'source',
        note: `原文${scope === 'quantity' ? '量' : scope === 'process' ? '流程' : '时间'}线索；未把范围、水位或阶段时间擅自转换成固定合同。`,
      };
    })
    .filter(Boolean)
    .slice(0, 4);
}

function sourceCookingDurationEstimate(recipe) {
  const ranges = [];
  const candidates = [];
  const rangePattern = /(?:总时长|總時長|总调理时间|總調理時間|料理时间|料理時間|制作时间|製作時間|烹调时间|烹調時間|烹煮时间|烹煮時間|烹制时间|烹製時間)\s*[^\d]{0,8}(\d+(?:\.\d+)?)\s*(?:至|到|~|～|–|—|-)\s*(\d+(?:\.\d+)?)\s*(分钟|分|小时|小時|minutes?|hours?)/iu;
  const cookingPattern = /(?:烹煮|烹调|烹調|烹製|炊煮|炊饭|炊飯|精煮|锅煮|鍋煮|煮制|煮製|煮饭|煮飯|cooking(?:\s+time)?)\s*(?:约|約|about)?\s*(\d+(?:\.\d+)?)\s*(分钟|分|小时|小時|minutes?|hours?)/giu;
  for (const source of (Array.isArray(recipe?.source_refs) ? recipe.source_refs : [])) {
    if (source?.access_status !== 'opened'
      || !Array.isArray(source?.claim_scopes)
      || !source.claim_scopes.includes('time')) continue;
    const locator = textForResearch(source?.evidence_locator);
    if (!locator) continue;
    rangePattern.lastIndex = 0;
    const rangeMatch = rangePattern.exec(locator);
    if (rangeMatch) {
      const unit = rangeMatch[3].toLowerCase();
      const multiplier = /小时|小時|hours?/iu.test(unit) ? 60 : 1;
      const min = Number(rangeMatch[1]) * multiplier;
      const max = Number(rangeMatch[2]) * multiplier;
      if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max >= min && max <= 480) {
        ranges.push({
          min,
          max,
          unit: multiplier === 60 ? '分钟' : '分钟',
          source_id: textForResearch(source?.source_id),
        });
      }
    }
    cookingPattern.lastIndex = 0;
    let match;
    while ((match = cookingPattern.exec(locator))) {
      const contextStart = Math.max(0, match.index - 12);
      const contextEnd = Math.min(locator.length, match.index + match[0].length + 12);
      const context = locator.slice(contextStart, contextEnd);
      const afterMatch = locator.slice(match.index + match[0].length, match.index + match[0].length + 8);
      // Preparation, soaking, resting, and a range are not a usable cooking
      // duration.  Keep the locator visible as a hint instead of collapsing
      // it into a false total.
      if (/浸泡|浸?泡|腌|醃|休息|静置|靜置|范围|範圍|以上|以内|以內/iu.test(context)
        || /^\s*(?:至|到|~|～|–|—)/u.test(afterMatch)) continue;
      const rawValue = Number(match[1]);
      const unit = match[2].toLowerCase();
      const minutes = /小时|小時|hours?/iu.test(unit) ? rawValue * 60 : rawValue;
      if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 480) continue;
      candidates.push({
        minutes,
        source_id: textForResearch(source?.source_id),
        title: textForResearch(source?.title) || '原文',
        locator,
      });
    }
  }
  const rangeKeys = [...new Set(ranges.map(range => `${range.min}-${range.max}-${range.unit}`))];
  if (rangeKeys.length === 1 && candidates.length === 0) {
    const [min, max, unit] = rangeKeys[0].split('-');
    return {
      total_minutes: Number(max),
      range: { min: Number(min), max: Number(max), unit },
      provenance: 'estimated',
      source_ids: [...new Set(ranges.map(range => range.source_id).filter(Boolean))],
      note: '原文给出总时长范围；研究起步取范围上限，不把范围压缩成正式固定合同。',
    };
  }
  const values = [...new Set(candidates.map(candidate => candidate.minutes))];
  if (values.length !== 1) return null;
  const sourceIds = [...new Set(candidates.map(candidate => candidate.source_id).filter(Boolean))];
  return {
    total_minutes: values[0],
    provenance: 'estimated',
    source_ids: sourceIds,
    note: '原文给出单一烹煮阶段时间线索；这里作为研究起步时长展示，不等于来源总调理时间或正式合同。',
  };
}

function draftStepRows(recipe, ingredients, methodType, profile = researchNameProfile(recipe)) {
  const search = recipeSearchText(recipe);
  const grain = ingredients.find(item => /米|rice|糯/iu.test(item.name))?.name || '米';
  const liquid = ingredients.find(item => /水|高汤|汤|broth|water/iu.test(item.name)
    && item.amount && item.amount.value !== undefined && item.amount.value !== null);
  const protein = ingredients.find(item => /鸡|鸭|猪|牛|羊|鱼|虾|蟹|蚝|贝|豆腐|肉/iu.test(item.name));
  const isPorridge = PORRIDGE_RE.test(search);
  if (profile?.kind === 'steam') {
    const nonGrain = ingredients.filter(item => item.name !== grain && !/蒸锅用水|水|高汤/iu.test(item.name));
    const rows = [
      { step: 1, instruction: `淘洗${grain}并浸泡约2小时；浸泡液倒掉，避免把浸泡水当成蒸汽用水。` },
      { step: 2, instruction: `把${nonGrain.map(item => item.name).slice(0, 4).join('、') || '菜名提示的配料（按来源选取）'}切配或分色处理；未被来源点名的配料不要擅自补入。` },
      { step: 3, instruction: `蒸锅加水约${profile.liquid.amount.value}${profile.liquid.amount.unit}，水沸后把米和已核配料放入蒸笼，蒸约35–45分钟；这是研究起步值。` },
      { step: 4, instruction: '关火后焖10分钟，检查米粒是否完全熟透；三色/青精等染色原料仍须回到原文确认。' },
      { step: 5, instruction: '首次试做记录浸泡时长、蒸锅水量、蒸制时间和颜色/口感，下一次再校正。' },
    ];
    return rows.map(row => ({ ...row, provenance: 'estimated', source_ids: [], note: '研究草案步骤，不是来源原文；保留蒸锅边界。' }));
  }
  if (profile?.kind === 'bamboo_tube') {
    const nonGrain = ingredients.filter(item => item.name !== grain && !/竹筒加水|水|高汤/iu.test(item.name));
    const rows = [
      { step: 1, instruction: `淘洗${grain}并浸泡约2小时；浸泡液倒掉，竹筒先清洁并检查无裂口。` },
      { step: 2, instruction: `把${nonGrain.map(item => item.name).slice(0, 4).join('、') || '按来源选定的配料'}装入竹筒，米和配料不要超过筒容积的2/3。` },
      { step: 3, instruction: `加入约${profile.liquid.amount.value}${profile.liquid.amount.unit}竹筒用水，封口或覆盖后按原来源的蒸/炭火器具加热；不把此步骤换算成电饭煲。` },
      { step: 4, instruction: '加热至米粒完全熟透，离火后静置10分钟再开筒；首次试做必须确认竹筒耐热和食材安全。' },
      { step: 5, instruction: '记录竹筒容量、实际加水量、加热时间和米粒熟度，作为下一次小批量校正依据。' },
    ];
    return rows.map(row => ({ ...row, provenance: 'estimated', source_ids: [], note: '研究草案步骤，不是来源原文；保留竹筒器具边界。' }));
  }
  if (profile?.kind === 'baked') {
    const rows = [
      { step: 1, instruction: `淘洗${grain}；${protein ? `将${protein.name}先处理至表面熟化并按安全终点核对。` : '菜名未展开蛋白或配料，先按来源或实际采购确认后再加入。'}` },
      { step: 2, instruction: `把${grain}、已核配料和${liquid ? `${liquid.amount.value}${liquid.amount.unit}液体` : '研究起步液体'}放入带盖焗/烤容器；液体数值仅为研究起步量。` },
      { step: 3, instruction: '先以带盖焗/烤或砂锅焖煮约30–40分钟，按原器具观察米粒吸水和锅底状态；不外推普通电饭煲。' },
      { step: 4, instruction: '关火后带盖静置10分钟，检查中心熟度；鱼、肉类必须另行核对安全终点。' },
      { step: 5, instruction: '首次试做记录容器、火力/烤温、实际液体和总时长，作为下一次校正依据。' },
    ];
    return rows.map(row => ({ ...row, provenance: 'estimated', source_ids: [], note: '研究草案步骤，不是来源原文；保留焗/烤器具边界。' }));
  }
  if (profile?.kind === 'hearth_pot') {
    const rows = [
      { step: 1, instruction: `淘洗${grain}，把菜名或来源明确的配料切配；鼎罐/柴火灶先预热，尚未按来源确认的配料不擅自加入。` },
      { step: 2, instruction: `在原锅加入${liquid ? `${liquid.amount.value}${liquid.amount.unit}` : '研究起步量'}水/高汤和米，先大火煮沸；液体数值是研究起步量。` },
      { step: 3, instruction: '转小火焖煮约25–35分钟，观察米粒、锅底和水分；柴火灶火力差异大，不换算成固定电饭煲程序。' },
      { step: 4, instruction: '离火后盖锅静置10分钟，翻松并检查熟度；首次试做记录火力、锅径和锅巴情况。' },
    ];
    return rows.map(row => ({ ...row, provenance: 'estimated', source_ids: [], note: '研究草案步骤，不是来源原文；保留传统灶/鼎罐边界。' }));
  }
  if (profile?.kind === 'pilaf') {
    const rows = [
      { step: 1, instruction: `淘洗${grain}；${protein ? `将${protein.name}切小并按安全要求先处理。` : '肉类或主料物种未核，先按来源确认后再加入。'}` },
      { step: 2, instruction: `先在锅中把${protein?.name || '已核配料'}炒香/煸至不生，再加入${grain}翻炒；这只是抓饭研究顺序，不是来源定量。` },
      { step: 3, instruction: `加入约${liquid ? `${liquid.amount.value}${liquid.amount.unit}` : '450mL'}液体，盖锅焖煮至米粒熟透；水量按米种和锅具校正。` },
      { step: 4, instruction: '关火焖10分钟，翻松后检查肉类/海鲜安全终点；首次试做记录米水比和焖煮时间。' },
      { step: 5, instruction: '若原文要求熟饭后拌合或另锅配料，必须回到来源分段执行，不把研究稿当成同锅等价。' },
    ];
    return rows.map(row => ({ ...row, provenance: 'estimated', source_ids: [], note: '研究草案步骤，不是来源原文；保留抓饭/拌饭边界。' }));
  }
  if (profile?.kind === 'porridge') {
    const rows = [
      { step: 1, instruction: `淘洗${grain}；若米种允许，先浸泡约30分钟，浸泡水量不计入最终粥水。` },
      { step: 2, instruction: `锅中加入${liquid ? `${liquid.amount.value}${liquid.amount.unit}` : '900mL'}水/高汤和${grain}，先煮沸后转小火。` },
      { step: 3, instruction: `把${protein?.name || '已按来源选定的配料'}分批加入，煮至米粒开花、肉/鱼/蛋达到安全终点；物种未确认时不要擅自替换。` },
      { step: 4, instruction: '关火后焖5–10分钟，按来源或试做记录调味；首次试做记录稠度和实际总时长。' },
    ];
    return rows.map(row => ({ ...row, provenance: 'estimated', source_ids: [], note: '研究草案步骤，不是来源原文；保留粥/汤饭边界。' }));
  }
  if (profile?.kind === 'rice_pot') {
    const nonLiquid = ingredients.filter(item => item.name !== grain && item.name !== liquid?.name
      && !/油|盐|鹽|酱|醬|糖|醋|料酒|酒|姜|薑|葱|蔥|蒜|香料|胡椒|芝麻|seasoning|oil/iu.test(item.name));
    const rows = [
      { step: 1, instruction: `淘洗${grain}；将${nonLiquid.map(item => item.name).slice(0, 5).join('、') || '菜名提示的配料（按来源选取）'}切配，未被来源点名的主料先不加入。` },
      { step: 2, instruction: '若配料含生肉、鱼贝或较硬蔬菜，先在锅中煸炒/焯熟至不生；来源没有预处理说明时只把这一步当研究起步方案。' },
      { step: 3, instruction: `把${grain}、已核配料和约${liquid ? `${liquid.amount.value}${liquid.amount.unit}` : '450mL'}水/高汤放入锅中，按米种调整液面；数值是研究起步量。` },
      { step: 4, instruction: '煮沸后转小火焖至米粒熟透（或启动电饭煲普通煮饭程序），关火后静置10分钟再翻松。' },
      { step: 5, instruction: '首次试做记录米种、实际液体、火力/程序、总时长和出锅份数，作为下一次校正依据。' },
    ];
    return rows.map(row => ({ ...row, provenance: 'estimated', source_ids: [], note: '研究草案步骤，不是来源原文；使用普通锅/电饭煲起步模板。' }));
  }
  const prep = isPorridge
    ? `淘洗${grain}；肉类/海鲜如需加入，先按食材安全要求处理并切成小块。`
    : `淘洗${grain}，将菜名/来源提示的配料${ingredients.filter(item => item.name !== grain && item.name !== liquid?.name).map(item => item.name).slice(0, 4).join('、') || '切配'}备好。`;
  const cook = protein
    ? `把${protein.name}先煎/煮至不再生，首次试做必须按包装和温度终点核对；再与米和配料入锅。`
    : '将米、配料和调味液体放入原来源指定的锅具；没有原器具时先按小批量试做。';
  const liquidText = liquid && liquid.amount
    ? `加入${liquid.amount.value}${liquid.amount.unit}液体（研究估算，需按锅具校正）。`
    : '加入来源未给出的水或高汤；研究起步量见上方，不视为原方定量。';
  const finish = isPorridge
    ? '煮至米粒开花、液体达到所需稠度，关火焖5–10分钟后再调味。'
    : '启动炊煮/焖煮程序；结束后静置10分钟，翻松并检查中心熟度。';
  const rows = [
    { step: 1, instruction: prep },
    { step: 2, instruction: cook },
    { step: 3, instruction: liquidText },
    { step: 4, instruction: methodType === 'staged_or_other'
      ? '若原来源要求预炒、蒸制、烤箱或熟饭拌合，按来源器具分段完成，不把此草案当作跨器具等价替代。'
      : finish },
  ];
  if (methodType !== 'staged_or_other' && !isPorridge) rows.push({ step: 5, instruction: '首次试做记录实际水量、总时长、出锅份数和是否糊底，作为下一次校正依据。' });
  return rows.map(row => ({ ...row, provenance: 'estimated', source_ids: [], note: '研究草案步骤，不是来源原文。' }));
}

function completeResearchSteps(recipe, sourceSteps, ingredients, methodType, profile = researchNameProfile(recipe)) {
  if (!sourceSteps.length) return draftStepRows(recipe, ingredients, methodType, profile);
  // Three ordered source steps already form a usable source contract. Adding
  // a generic fourth step would introduce an estimated claim and incorrectly
  // downgrade an otherwise source-complete card. In fragment-only cards we
  // still add the historical research supplement so the card remains an
  // actionable four-step starting point.
  const hasSourceExecutionContract = Boolean(
    recipe?.fixed_batch
    && recipe?.liquid_contract
    && recipe?.time_contract
    && Array.isArray(recipe?.cooking_sequence)
    && recipe.cooking_sequence.length > 0,
  );
  if (sourceSteps.length >= 3 && hasSourceExecutionContract) return sourceSteps;
  if (sourceSteps.length >= 4) return sourceSteps;
  const supplemental = draftStepRows(recipe, ingredients, methodType, profile)
    .slice(0, 4 - sourceSteps.length)
    .map((step, index) => ({
      ...step,
      step: sourceSteps.length + index + 1,
      instruction: `研究补充：${step.instruction}`,
      note: '研究草案步骤，不是来源原文；用于把来源片段补成可试做顺序。',
    }));
  return [...sourceSteps, ...supplemental];
}

export function buildResearchMethod(recipe) {
  const draftOverride = researchDraftOverride(recipe);
  const exactSourceIngredients = sourceIngredientRows(recipe);
  // Once a single source version supplies a fixed batch, use that exact
  // ingredient list as the execution contract.  Do not append generic
  // core_ingredients from other source variants: those labels are useful
  // identity hints when a contract is missing, but would downgrade an
  // otherwise source-complete card to a mixed-source research draft.
  const sourceIngredients = exactSourceIngredients.length
    ? exactSourceIngredients
    : coreHintRows(recipe, exactSourceIngredients);
  const sourceSteps = sourceStepRows(recipe);
  const visibleSourceSteps = sourceSteps.length ? sourceSteps : sourceProcessHintRows(recipe);
  const servingsHint = sourceServingsHint(recipe);
  const search = recipeSearchText(recipe);
  const rawProfile = researchNameProfile(recipe);
  // A name-shaped profile is useful when the source has no ordered steps; if
  // a source already supplies a complete sequence, do not add a redundant
  // template label on top of those source facts. Boundary profiles (steam,
  // bamboo, baked, hearth) remain visible even when the source has a short
  // partial sequence because they prevent an unsafe equipment substitution.
  const profile = rawProfile?.boundary || !sourceSteps.length ? rawProfile : null;
  const hasSourceFacts = exactSourceIngredients.length || sourceSteps.length || recipe?.liquid_contract || recipe?.time_contract;
  const staged = STAGED_RE.test(search) || Boolean(profile?.boundary);
  const methodType = draftOverride?.method_type || (staged ? 'staged_or_other' : 'one_pot_research');
  const sourceMissing = [];
  if (!sourceIngredients.length) sourceMissing.push('fixed_batch');
  if (!recipe?.liquid_contract) sourceMissing.push('liquid_contract');
  if (!sourceSteps.length) sourceMissing.push('cooking_sequence');
  if (!recipe?.time_contract) sourceMissing.push('time_contract');

  const sourceLiquidEstimate = !recipe?.liquid_contract ? sourceLiquidHint(recipe) : null;
  const inferredBase = exactSourceIngredients.length ? sourceIngredients : inferDraftIngredients(recipe);
  const sourceIngredientHints = exactSourceIngredients.length ? [] : sourceIngredientHintRows(recipe, inferredBase);
  const sourceIdentityHints = exactSourceIngredients.length
    ? []
    : sourceIdentityIngredientHintRows(recipe, [...inferredBase, ...sourceIngredientHints]);
  const inferredWithKnownHints = sourceIngredientHints.length || sourceIdentityHints.length
    ? inferredBase.filter(row => !/主料.*待核/iu.test(textForResearch(row?.name)))
    : inferredBase;
  const estimatedBase = exactSourceIngredients.length
    ? inferredBase
    : [...inferredWithKnownHints, ...sourceIngredientHints, ...sourceIdentityHints];
  const defaultEstimatedIngredients = uniqueByName(applyResearchProfileToIngredients(replaceGenericLiquidRow(
    completeEstimatedIngredientRows(recipe, attachSourceQuantityHints(recipe,
      exactSourceIngredients.length
        ? estimatedBase
        : [...estimatedBase, ...coreHintRows(recipe, estimatedBase)])),
    sourceLiquidEstimate,
    recipe,
  ), profile));
  const sourceOnlyIngredientGuardrail = applySourceOnlyIngredientGuardrail(
    recipe,
    draftOverride?.ingredients || defaultEstimatedIngredients,
  );
  const estimatedIngredients = sourceOnlyIngredientGuardrail.rows;
  const unresolvedCoreIngredient = estimatedIngredients.some(item =>
    /主料.*待核|核心食材.*待核|肉类.*待核/iu.test(textForResearch(item?.name))
    || /不能从菜名反推|不可用泛名替代|不能替代来源|擅自指定/iu.test(textForResearch(item?.note)));
  const estimatedSteps = sanitizeSourceOnlySteps(
    draftOverride?.steps || completeResearchSteps(recipe, visibleSourceSteps, estimatedIngredients, methodType, profile),
    sourceOnlyIngredientGuardrail.warning,
  );
  const hasEstimates = estimatedIngredients.some(item => item.provenance !== 'source')
    || estimatedSteps.some(step => step.provenance !== 'source');
  const status = !hasEstimates && sourceMissing.length === 0
    ? 'source_complete'
    : hasSourceFacts
      ? 'source_partial_with_draft'
      : (Array.isArray(recipe?.core_ingredients) && recipe.core_ingredients.length ? 'draft_estimated' : 'identity_only_draft');

  const defaultLiquid = recipe?.liquid_contract
    ? { ...recipe.liquid_contract, provenance: 'source' }
    : sourceLiquidEstimate
      ? {
        kind: methodType === 'one_pot_research' ? 'added_water' : 'stage_specific',
        amount: sourceLiquidEstimate.amount,
        provenance: 'source_hint',
        source_ids: sourceLiquidEstimate.source_ids,
        note: sourceLiquidEstimate.note,
      }
    : profile?.liquid
      ? {
        kind: profile.kind === 'steam' ? 'steam_water' : methodType === 'one_pot_research' ? 'added_water' : 'stage_specific',
        amount: profile.liquid.amount,
        provenance: 'estimated',
        note: `${profile.label}起步液体；${profile.note}不是来源液体合同。`,
      }
    : methodType === 'one_pot_research'
      ? {
        kind: 'added_water',
        amount: { value: PORRIDGE_RE.test(search) ? 900 : 450, unit: 'mL' },
        provenance: 'estimated',
        note: '研究起步量，不是来源定量；请按米种、锅具和来源水位校正。',
      }
      : {
        kind: 'stage_specific',
        research_starting_point: { value: PORRIDGE_RE.test(search) ? 900 : 450, unit: 'mL' },
        provenance: 'estimated',
        note: '来源未给统一液体；该条保留熟饭、预炒、蒸制、烤箱或后拌等原器具/阶段边界。此数值只供生米研究起步，不是来源定量，也不是跨器具换算。',
      };
  const liquid = draftOverride?.liquid || defaultLiquid;
  const sourceTimeEstimate = !recipe?.time_contract ? sourceCookingDurationEstimate(recipe) : null;
  const defaultTime = recipe?.time_contract
    ? { ...recipe.time_contract, provenance: 'source' }
    : sourceTimeEstimate
      ? sourceTimeEstimate
    : {
      total_minutes: PORRIDGE_RE.test(search) ? 50 : 45,
      provenance: 'estimated',
      note: '研究起步时长，不是来源总时长；首次试做需记录实际时间。',
    };
  const time = draftOverride?.time || defaultTime;
  const assumptions = [];
  if (!recipe?.fixed_batch) assumptions.push(servingsHint
    ? '原文给出份数范围；研究卡保留该范围，不压成固定批量，未给定字段仍以研究起步量显示。'
    : '份数与食材用量按2人份起步估算，不能替代原文定量。');
  if (!recipe?.liquid_contract) assumptions.push(sourceLiquidEstimate
    ? '原文给出单一液体量线索，研究卡先展示该线索；仍未形成 canonical 液体合同，且不得把内锅/外锅或分层液体混成一个数。'
    : profile?.liquid
      ? `${profile.label}液体按${profile.liquid.amount.value}${profile.liquid.amount.unit}起步；这不是来源液体定量，首次试做需按器具校正。`
      : '液体按米饭450mL/粥900mL起步估算；若原文给水位或分层液体，应优先按原文。');
  if (!recipe?.time_contract) assumptions.push(sourceTimeEstimate?.range
    ? `原文只给出${sourceTimeEstimate.range.min}–${sourceTimeEstimate.range.max}分钟范围；研究起步取上限${sourceTimeEstimate.total_minutes}分钟，不压缩成正式固定合同。`
    : sourceTimeEstimate
      ? '总时长采用原文单一烹煮阶段线索作为研究起步值；来源未闭合整道总时长，仍需首次试做记录。'
      : '总时长按普通锅/电饭煲研究起步值估算，阶段时间和设备程序仍待核。');
  if (!sourceSteps.length) assumptions.push('步骤为研究草案；需要用原始页面、器具说明或厨房试做继续校正。');
  if (draftOverride?.note) assumptions.push(draftOverride.note);
  if (draftOverride?.blocked_reason) assumptions.push(`安全阻断：${draftOverride.blocked_reason}`);
  if (profile) assumptions.push(profile.note);
  if (sourceOnlyIngredientGuardrail.warning) assumptions.push(sourceOnlyIngredientGuardrail.warning);
  if (unresolvedCoreIngredient) assumptions.push('核心食材仍未被来源展开；卡片中的占位量不能从菜名反推或用泛名替代，必须先回到原文确认后再试做。');
  if (staged) assumptions.push('检测到预炒、蒸制、烤箱、熟饭或拌合边界；不得把草案当作普通电饭煲等价做法。');

  return {
    schema_version: 'research-method.v1',
    status,
    method_type: methodType,
    blocked_reason: draftOverride?.blocked_reason || null,
    research_profile: profile
      ? { kind: profile.kind, label: profile.label, provenance: 'name_or_vessel_hint', note: profile.note }
      : null,
    source_facts: sourceFactRows(recipe),
    servings: recipe?.fixed_batch?.servings
      ? { value: recipe.fixed_batch.servings, unit: '份', provenance: 'source' }
      : { value: 2, unit: '份', provenance: 'estimated', note: '研究起步份数' },
    servings_source_hint: servingsHint,
    source_quantity_hints: sourceLocatorHints(recipe, 'quantity'),
    source_process_hints: sourceLocatorHints(recipe, 'process'),
    source_time_hints: sourceLocatorHints(recipe, 'time'),
    ingredients: estimatedIngredients,
    liquid,
    time,
    steps: estimatedSteps,
    missing_source_fields: sourceMissing,
    assumptions,
    safety_note: draftOverride?.blocked_reason
      ? `禁止家庭执行：${draftOverride.blocked_reason}`
      : Array.isArray(recipe?.safety_endpoints) && recipe.safety_endpoints.length
      ? '来源已有安全终点，请按卡片中的安全提示执行。'
      : '来源未闭合独立安全终点；含生肉、禽肉、鱼贝或蛋类时，首次试做必须自行核对安全终点。',
  };
}

export function buildResearchMethodCoverage(records) {
  const coverage = { total: records.length, source_complete: 0, source_partial_with_draft: 0, draft_estimated: 0, identity_only_draft: 0, estimated_cards: 0 };
  for (const record of records) {
    const status = record.research_method?.status || 'identity_only_draft';
    coverage[status] = (coverage[status] || 0) + 1;
    if (status !== 'source_complete') coverage.estimated_cards += 1;
  }
  const methods = records.map(record => record?.research_method || {});
  const hasQuantities = method => Array.isArray(method.ingredients)
    && method.ingredients.length > 0
    && method.ingredients.every(item => item?.amount && Number.isFinite(item.amount.value) && item.amount.unit);
  const hasLiquidGuidance = method => Boolean(
    method.liquid?.amount
    || method.liquid?.research_starting_point
    || method.liquid?.waterline,
  );
  const hasTime = method => Boolean(method.time?.total_minutes || method.time?.range);
  const hasSteps = method => Array.isArray(method.steps) && method.steps.length >= 3
    && method.steps.every(step => typeof step?.instruction === 'string' && step.instruction.trim());
  coverage.cards_with_quantities = methods.filter(hasQuantities).length;
  coverage.cards_with_liquid_guidance = methods.filter(hasLiquidGuidance).length;
  coverage.cards_with_time = methods.filter(hasTime).length;
  coverage.cards_with_steps = methods.filter(hasSteps).length;
  coverage.complete_research_cards = methods.filter(method => (
    hasQuantities(method) && hasLiquidGuidance(method) && hasTime(method) && hasSteps(method)
  )).length;
  coverage.blocked_cards = methods.filter(method => Boolean(method.blocked_reason)).length;
  coverage.complete_unblocked_research_cards = methods.filter(method => (
    !method.blocked_reason
    && hasQuantities(method) && hasLiquidGuidance(method) && hasTime(method) && hasSteps(method)
  )).length;
  coverage.cards_with_source_quantity_hints = methods.filter(method => Array.isArray(method.source_quantity_hints) && method.source_quantity_hints.length > 0).length;
  coverage.cards_with_source_process_hints = methods.filter(method => Array.isArray(method.source_process_hints) && method.source_process_hints.length > 0).length;
  coverage.cards_with_source_time_hints = methods.filter(method => Array.isArray(method.source_time_hints) && method.source_time_hints.length > 0).length;
  return coverage;
}

function hasFixedBatch(recipe) {
  return Boolean(recipe?.fixed_batch)
    && Array.isArray(recipe.fixed_batch.ingredients)
    && recipe.fixed_batch.ingredients.length > 0;
}

function hasSteps(recipe) {
  return Array.isArray(recipe?.cooking_sequence) && recipe.cooking_sequence.length > 0;
}

function missingContracts(recipe) {
  return CONTRACT_FIELDS
    .filter(([field]) => {
      // A recipe without raw high-risk ingredients has no meaningful food-
      // safety temperature endpoint to cite. Do not show a false missing
      // contract in the read-only shelf; high-risk recipes still require one.
      if (field === 'safety_endpoints' && !requiresSourceSafetyEndpoint(recipe)) return false;
      return field === 'safety_endpoints'
        ? !Array.isArray(recipe?.[field]) || recipe[field].length === 0
        : !recipe?.[field];
    })
    .map(([field]) => field);
}

function ingredientText(recipe) {
  return Array.isArray(recipe?.core_ingredients) ? recipe.core_ingredients.join('、') : '';
}

function safetyNotes(recipe) {
  const endpoints = Array.isArray(recipe?.safety_endpoints) ? recipe.safety_endpoints : [];
  const endpointCodes = new Set(endpoints.map(endpoint => endpoint?.code).filter(Boolean));
  const notes = [];

  for (const endpoint of endpoints) {
    if (!endpoint?.code) continue;
    const note = ENDPOINT_NOTES[endpoint.code];
    if (note) notes.push(note);
    else notes.push(`来源记录了安全终点：${endpoint.code}。`);
  }

  // Broth, stock, sauces, and other already-processed ingredients should not
  // trigger a raw-meat warning merely because their name contains a meat
  // character (for example, “鸡汤”). High-risk raw ingredients still flow
  // through the detailed endpoint checks below.
  if (!requiresSourceSafetyEndpoint(recipe)) return [...new Set(notes)];

  const ingredientNames = ingredientText(recipe);
  // 鱼露/鱼酱是调味料，不应被“鱼类/海鲜”规则当成整条鱼。
  const riskIngredientNames = ingredientNames.replace(/鱼露|魚露|鱼酱|魚醬/gu, '');
  for (const rule of RISK_RULES) {
    const matchedNames = rule.advisory ? ingredientNames : riskIngredientNames;
    if (!rule.pattern.test(matchedNames)) continue;
    if (rule.advisory) {
      notes.push(rule.advisory);
      continue;
    }
    const covered = rule.expected.some(code => endpointCodes.has(code));
    if (!covered) {
      notes.push(`注意：本条含${rule.label}，目录尚未记录对应的独立安全终点；仅供试做记录，不代表安全确认。`);
    }
  }

  return [...new Set(notes)];
}

export function classifySourceBackedRecipe(recipe) {
  const shelf = recipe?.status === 'executable'
    ? 'A'
    : (hasFixedBatch(recipe) && hasSteps(recipe) ? 'B' : 'C');
  const endpoints = Array.isArray(recipe?.safety_endpoints) ? recipe.safety_endpoints : [];
  return {
    ...recipe,
    research_method: buildResearchMethod(recipe),
    shelf,
    shelf_label: shelf === 'A'
      ? 'A · 可照做（已签署）'
      : shelf === 'B'
        ? 'B · 试做架（来源有据，未经厨房验证）'
      : 'C · 研究起步架（来源字段待补）',
    missing_contracts: missingContracts(recipe),
    missing_contract_labels: missingContracts(recipe).map(field => shelfContractLabels[field]),
    safety_notes: safetyNotes(recipe),
    safety_source_ids: [...new Set(endpoints.flatMap(endpoint => Array.isArray(endpoint?.source_ids) ? endpoint.source_ids : []))],
  };
}

export function buildShelfCatalog(catalog) {
  const records = (Array.isArray(catalog?.recipes) ? catalog.recipes : []).map(classifySourceBackedRecipe);
  const summary = records.reduce((counts, record) => {
    counts[record.shelf] = (counts[record.shelf] || 0) + 1;
    return counts;
  }, { A: 0, B: 0, C: 0 });
  return {
    schema_version: 'source-backed-one-pot-shelf.v1',
    catalog_version: catalog?.catalog_version || null,
    generated_from: 'tools/data/source-backed-one-pot-recipes.v1.json',
    summary: {
      ...summary,
      trial_ready_total: summary.A + summary.B,
    },
    method_coverage: buildResearchMethodCoverage(records),
    records,
  };
}

export const shelfContractLabels = Object.freeze(Object.fromEntries(CONTRACT_FIELDS));
