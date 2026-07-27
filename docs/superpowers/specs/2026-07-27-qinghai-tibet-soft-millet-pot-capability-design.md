# 青藏小米软谷物家庭锅能力设计

## 1. 背景

全国地域框架当前覆盖 13 个地域块、34 个省级节点和 12 个技法家族。青藏地域已有 4 道生产菜谱审计，但当前 Planner 完整单锅覆盖为 0/4：

- `qinghai-hao-fan`：小米、土豆、熟鹰嘴豆；
- `tibetan-savory-congee`：大米、牛奶；
- `tibetan-gutu`：小麦面团、小白菜、水；
- `tibetan-ginseng-fruit-rice`：食品级蕨麻、大米。

四道菜的缺口不是同一种问题。小米和熟鹰嘴豆缺受控食材身份与可执行比例；牛奶涉及乳制品分支；面团块需要独立汤面结构；蕨麻需要食品级身份、来源和吸水验证。本轮只恢复第一组能够被独立证据支撑的家庭通用能力，不为提高覆盖数字而合并其余状态。

`qinghai-hao-fan` 的地域研究账本已明确：现有生产条目是项目原创的“青海熬饭风味家庭适配版”，公开地域来源并不证明“小米、土豆、熟鹰嘴豆”是传统青海熬饭的固定配方。因此，本能力只能生成通用家庭小米软谷物锅，不得声称传统复刻或固定青海配方。

## 2. 选定方案

采用“现有 planned template 的小米窄激活”方案：

1. 建立小米、干鹰嘴豆和熟鹰嘴豆的受控身份；
2. 把泛称“鹰嘴豆”定义为干/熟状态歧义，不静默猜测；
3. 将现有 `soft-family-rice-pot` 从 planned 改为 active，但第一阶段仅接受小米、根茎蔬菜、可选熟鹰嘴豆和可选叶菜；
4. 新增一条只命中 `raw_millet` 的机器 Ratio DSL；
5. 固定小米浸泡、根茎同煮、熟豆后加和熟制终点；
6. DeepSeek 只表达已确定计划，不决定食材、克数、顺序、安全终点或地域名称；
7. 恢复 `qinghai-hao-fan` 原始核心食材的 3/3 单锅规划能力，但只把它解释为食材兼容的家庭方案。

不采用以下方案：

- 只增加 alias：会让系统“认识”食材但仍无法做饭；
- 把小米归入 `raw_rice`：会错误复用大米液体比例；
- 同时支持牛奶、青稞、蕨麻或面团：这些分支的比例、状态或安全证据尚未完成；
- 新增“小米土豆鹰嘴豆固定菜谱”：template 应表达组合规则，不应退化为固定菜单扩张。

## 3. 成功条件

完成后必须同时成立：

1. “小米”命中 `raw-millet`，保留 raw 原词、`raw` 状态和 `whole_grain` 形态；
2. “熟鹰嘴豆”“煮熟鹰嘴豆”命中 `cooked-chickpea-seed`；
3. “干鹰嘴豆”命中 `dry-chickpea-seed`，但不能进入本轮 active template；
4. 泛称“鹰嘴豆”进入 `ambiguous_ingredient_state`，可选项只包含“干鹰嘴豆”“熟鹰嘴豆”；
5. pantry/normal 输入小米、土豆、熟鹰嘴豆时返回 3/3 单锅完整计划；
6. pantry/normal 输入小米、土豆时返回 2/2 单锅完整计划；
7. `pantry+quick` 不选择该模板；
8. 小麦面团、牛奶、青稞、蕨麻不因本轮改动获得运行时能力；
9. 计划数量、液体、烹饪顺序和安全终点全部由 Planner 决定；
10. 模型不能新增牛奶、肉类或干豆，不能删除熟鹰嘴豆，也不能修改机器克数；
11. `qinghai-hao-fan` 的端到端覆盖由 0% 提升为 100%；
12. 青藏完整单锅覆盖由 0/4 提升为至少 1/4；
13. recipe 保持 72 道，template 总数保持 16 个；
14. template 状态变为 11 active + 5 planned；
15. 只更新现有 Draft PR #1，不部署 Preview 或 production，不合并。

## 4. 非目标

本轮不做：

- 不新增或修改固定 recipe；
- 不把生成结果命名为“传统青海熬饭”或声称地方唯一做法；
- 不支持生/干鹰嘴豆的泡发和完整熟制；
- 不支持牛奶粥、青稞粥、杂粮粥、蕨麻饭、古突或面片汤；
- 不修改 recommend/pantry 成功标准、多锅、换一换或历史策略；
- 不增加账号、用户画像、营养追踪、自然语言场景或多 Agent 产品能力；
- 不自动重试 DeepSeek；
- 不把离线测试称为真人厨房验证或人工菜谱批准。

## 5. 证据与数值推导

### 5.1 固定来源

| source_id | 来源 | 直接支持 | 不支持 |
| --- | --- | --- | --- |
| `tw-moa-millet-porridge-2023` | 台湾农业部农业知识入口网《小米粥》 | 小米与水 1:7 体积比；小火熬煮或电锅蒸煮 | 土豆、熟鹰嘴豆、项目地域名称 |
| `tw-moa-millet-map-2026` | 台湾农业部食农教育资讯整合平台《小米（粟）》 | 小米清洗、浸泡约 30 分钟；小米可煮饭或粥 | 本项目完整组合和克数 |
| `usda-sr28-millet-cup-2015` | USDA SR28 Cereal Grains and Pasta | 生小米 1 cup = 200 g | 烹饪比例和时间 |
| `usda-water-intake-conversion-2011` | USDA ARS Drinking Water Intake in the U.S. | 水 1 mL = 1 g；1 US cup = 237 mL | 食谱与稠度 |
| `tw-mohw-food-exchange-2019` | 台湾卫生福利部《食物代换表》 | 小米等生谷物 1/8 米杯约 20 g；中型马铃薯半个约 90 g | 本项目地域身份 |
| `usda-fped-legume-2016` | USDA FPED 2015–2016 | 熟鹰嘴豆 1 cup equivalent = 175 g | 与小米同锅的地域传统性 |
| `usda-myplate-protein-2026` | USDA MyPlate Protein Foods | 1/4 cup 熟豆为 1 oz-equivalent | 本项目必须使用的份数 |
| `usda-leftovers-2025` | USDA FSIS Leftovers and Food Safety | 冷藏熟食再加热至 165°F/74°C | 常温新开罐熟豆必须按剩菜处理 |

固定 URL：

- <https://kmweb.moa.gov.tw/subject/subject.php?id=39541>
- <https://fae.moa.gov.tw/map/food_item.php?id=93&type=AS07>
- <https://www.ars.usda.gov/ARSUserFiles/80400525/Data/SR/SR28/reports/sr28fg20.pdf>
- <https://www.ars.usda.gov/ARSUserFiles/80400530/pdf/DBrief/7_water_intakes_0508.pdf>
- <https://mlunch.nat.gov.tw/manasystem/files/news/092903%E9%99%84%E4%BB%B6%E9%A3%9F%E7%89%A9%E4%BB%A3%E6%8F%9B%E8%A1%A82019.pdf>
- <https://www.ars.usda.gov/arsuserfiles/80400530/pdf/fped/fped_1516.pdf>
- <https://www.myplate.gov/web/web/eat-healthy/protein-foods>
- <https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety>

### 5.2 水量推导

公开小米粥来源给出体积比，不直接给克重。本项目 Ratio DSL 只接受克，因此必须把换算步骤写死，而不能让模型理解：

```text
1 cup 生小米 = 200 g
1 cup 水 = 237 g
1 cup 小米 : 7 cup 水
质量比 = (7 × 237) / 200 = 8.295
DSL default = 8.3
```

允许范围 `8.0–8.5` 只用于吸收量杯和四舍五入差异；第一阶段 UI 使用 default，不允许模型自由选择区间。

### 5.3 每人默认量

| 槽位 | min | default | max | 依据与边界 |
| --- | ---: | ---: | ---: | --- |
| 小米 | 35 g | 40 g | 45 g | 20 g 食物代换单位的受控倍数；与高水量共同形成软谷物锅 |
| 根茎蔬菜 | 80 g | 90 g | 100 g | 马铃薯官方代换份量 90 g |
| 熟鹰嘴豆 | 70 g | 88 g | 100 g | USDA 175 g/cup；默认半杯，不把它解释为地域传统定量 |
| 可选叶菜 | 80 g | 100 g | 120 g | 只在用户提供时加入，不作为基础补充项 |

两人份默认：小米 80 g、土豆 180 g、熟鹰嘴豆 176 g、水 664 g、食用油 10 g、盐 3 g。required extras 只允许水、油和盐。

## 6. Taxonomy r9

### 6.1 小米

```json
{
  "canonical_id": "raw-millet",
  "display_name": "小米",
  "aliases": ["黄小米"],
  "input_scope": "pantry_input",
  "category": "raw_millet",
  "states": ["raw"],
  "shapes_or_cuts": ["whole_grain"],
  "cook_speed": "medium",
  "moisture_release": "low",
  "texture_behavior": {
    "behavior_code": "absorbs_liquid_and_thickens",
    "best_method_codes": ["soak", "simmer"],
    "failure_mode_codes": ["hard_center_when_undercooked", "scorches_without_stirring"]
  },
  "cooking_risk": {
    "risk_code": "raw_grain",
    "required_endpoint_codes": ["grain_tender_no_hard_center"]
  },
  "compatible_slot_codes": ["soft_grain_staple"],
  "incompatible_slot_codes": ["raw_rice_required", "cooked_rice_required", "noodle_required"]
}
```

### 6.2 干鹰嘴豆与熟鹰嘴豆

`dry-chickpea-seed` 保留 `dry` / `whole_seed`、慢熟、需泡发和完全熟制的语义，只兼容未来 `dry_legume_required`，本轮不进入 active template。

`cooked-chickpea-seed` 保留 `cooked` / `whole_seed`、快热、过度搅拌易碎的语义，只兼容 `cooked_legume`。aliases 只包含“煮熟鹰嘴豆”和“罐装鹰嘴豆（沥干）”，不得包含泛称“鹰嘴豆”。

泛称状态：

```json
{
  "ambiguity_id": "chickpea-state",
  "input": "鹰嘴豆",
  "aliases": [],
  "reason_code": "ambiguous_ingredient_state",
  "reason": "“鹰嘴豆”可能是干豆或已经煮熟的豆，请改写为“干鹰嘴豆”或“熟鹰嘴豆”。",
  "eligible_items": ["干鹰嘴豆", "熟鹰嘴豆"]
}
```

歧义代表项沿用 `ambiguity:${ambiguity_id}` 去重；“鹰嘴豆”不能与其自身重复输入抬高 pantry 分母。

## 7. Template catalog r9

不新增 template ID。修改 `soft-family-rice-pot`：

- `activation_status: active`；
- `runtime_eligible: true`；
- required `staple`：只接受 `raw_millet`；
- required `root_vegetable`：只接受 `root_vegetable`，1 项；
- optional `cooked_legume`：只接受 `cooked_legume`，最多 1 项；
- optional `leafy_vegetable`：只接受 `leafy_vegetable`，最多 1 项；
- `total_user_items_min: 2`，`total_user_items_max: 4`；
- supported intents：`normal`、`fresh`、`batch`；
- forbidden intent：`quick`；
- time range：35–50 分钟；
- evidence recipe IDs 保留 `chinese-congee`、`qinghai-hao-fan`；
- template 的用户可见身份是“家庭小米软谷物锅”，不是地域菜名。

不得继续接受旧的 `raw_rice` 类别。普通大米软粥仍缺独立 Ratio DSL，不能因模板激活而意外进入候选。

## 8. Ratio DSL r5

新增唯一规则 `soft-family-millet-liquid-v1`：

```json
{
  "when": {
    "template_id": "soft-family-rice-pot",
    "slot_id": "staple",
    "category": "raw_millet",
    "canonical_ids": ["raw-millet"]
  }
}
```

operations 必须包含：

- staple `per_serving` 35/40/45 g；
- root vegetable `per_serving` 80/90/100 g；
- cooked legume `per_serving` 70/88/100 g；
- leafy vegetable `per_serving` 80/100/120 g；
- water `ratio` 8.0/8.3/8.5；
- oil `fixed_addition` 8/10/12 g；
- salt `scale_by_servings` 1/1.5/2 g；
- rounding 1 g。

本轮不新增液体抵扣。土豆、熟豆和叶菜不从小米基础水量中自动扣水，避免未经厨房验证的复杂含水补偿。

## 9. 确定性烹饪合同

Planner 固定以下约束进入 plan：

1. 小米用细筛清洗，浸泡约 30 分钟后沥干；
2. 土豆切小丁，与小米和定量水同锅；
3. 煮开后转小火熬煮，中途搅动防糊底；
4. 熟鹰嘴豆在后段加入，只承担加热与组合，不重新解释为干豆熟制；
5. 可选叶菜最后加入；
6. 小米和土豆必须无硬芯；
7. 熟鹰嘴豆必须整体热透；若输入明确为冷藏熟食，则达到 74°C；
8. 不得输出浸泡干豆、临时把干豆煮熟或压力锅捷径；
9. 不得加入牛奶、肉类、蕨麻、青稞或用户未提供的主要食材。

## 10. DeepSeek 输入输出边界

DeepSeek 接收：template ID、槽位分配、ingredient amounts、required extras、顺序约束、安全终点和通用命名边界。

DeepSeek只能输出：

- 不带传统性主张的用户可见菜名；
- 对确定步骤的自然语言表达；
- 基于已使用食材和 intent 的推荐理由。

服务端必须校验：

- 模型食材集合等于 Planner 食材集合加允许基础补充项；
- 每项克数等于 Planner 值；
- 小米、土豆、熟豆的顺序和 endpoint 没有丢失；
- 菜名和依据不含“传统青海熬饭”“正宗”“地道复刻”等声明；
- 不把熟鹰嘴豆写成干鹰嘴豆，也不把小米换成大米或青稞。

越界统一返回 `model_contract_violation`，不自动重试。

## 11. 状态与用户路径

| 输入 | 状态 | 文案与动作 |
| --- | --- | --- |
| 小米、土豆、熟鹰嘴豆 | `complete` | 完整清库存计划，可进入生成 |
| 小米、土豆 | `complete` | 完整清库存计划，可进入生成 |
| 小米、土豆、鹰嘴豆 | `needs_user_decision` | 请确认干豆或熟豆；保留已规划锅，不调用 DeepSeek |
| 小米、土豆、干鹰嘴豆 | `needs_user_decision` | 保留小米土豆锅，干鹰嘴豆进入 `unplanned_must_use`，不调用 DeepSeek |
| 干鹰嘴豆 | `no_valid_plan` | 没有可执行锅；明确本轮不负责泡发和生豆熟制 |
| 小米、牛奶 | `no_valid_plan` | 当前模板不支持奶粥，不调用 DeepSeek |
| 小米、土豆、牛奶 | `needs_user_decision` | 保留小米土豆锅，牛奶进入 `unplanned_must_use` |
| pantry + quick | `no_valid_plan` | 这组食材无法在 30 分钟内可靠完成 |
| recommend + 多食材 | `ready` | 可选择小米家庭锅，并诚实解释 unused |
| 换一换无第二个结构 | `no_alternative_plan` | 当前组合只有一个可靠的一锅方案 |

## 12. 版本与旧计划

- taxonomy：`taxonomy-v1-20260727-r8` → `taxonomy-v1-20260727-r9`；
- template catalog：`templates-v2-20260727-r8` → `templates-v2-20260727-r9`；
- Ratio catalog：`ratio-rules-v1-20260727-r4` → `ratio-rules-v1-20260727-r5`；
- Planner version 和 schema version 不变；
- plan ID 已包含三个资产版本，因此旧 plan token 服务端重算后进入 `stale_plan`；
- `/health` 必须报告 11 active、5 planned、总数 16；
- Worker、Python bridge、本地 CLI 和前端不建立第二份 taxonomy 事实源。

## 13. 真实旅程测试

在现有 J001–J116 后增加连续编号旅程，至少覆盖：

1. pantry/normal/2 人：小米、土豆、熟鹰嘴豆，3/3 complete；
2. pantry/normal/2 人：小米、土豆，2/2 complete；
3. pantry/normal/3 人：默认克数精确缩放；
4. pantry/normal/4 人：默认克数精确缩放；
5. 同一输入顺序变化，plan ID 不变；
6. “鹰嘴豆”触发 `ambiguous_ingredient_state`；
7. “鹰嘴豆”“鹰嘴豆”去重后 promise denominator 为 1；
8. 干鹰嘴豆不进入 `cooked_legume`；
9. 小米、牛奶不生成奶粥；
10. 小米、土豆、牛奶保留 pot 并列出牛奶未规划；
11. 小米、土豆、熟鹰嘴豆、小白菜 4/4 complete；
12. pantry/quick 不选择 soft template；
13. recommend/normal 选择合理组合并解释 unused；
14. 换一换没有同等承诺时返回 `no_alternative_plan`；
15. model 新增牛奶被拒绝；
16. model 删除熟鹰嘴豆被拒绝；
17. model 修改水量被拒绝；
18. model 把熟豆写成干豆被拒绝；
19. 小米不命中大米 Ratio rule；
20. 青稞、蕨麻和小麦面团继续不被本模板接纳；
21. Worker/Python 对正常、歧义、干豆和 quick 四组请求语义一致；
22. 覆盖审计确认 `qinghai-hao-fan` 100%，青藏至少 1/4。

新增旅程数量以实施计划实际断言拆分为准，但不得删除或改写既有 J001–J116。

## 14. 成本控制

- `/plan-meal`：0 次 DeepSeek；
- 歧义、quick 排除、缺少可靠 plan、stale plan：0 次；
- `/generate-plan`：确认有效计划后最多 1 次；
- 模型越界或上游失败：不自动重试；
- 测试只使用本地 fake upstream。

## 15. 生成产物与门禁

实施时需要同步刷新：

- Planner 真实旅程 corpus 与 runner；
- `tools/generated/planner-menu-coverage.v1.json`；
- `docs/planner-menu-coverage.md`；
- 由 taxonomy/template 版本变化影响的菜单总表与部署基线文档；
- `/health` 版本和模板计数断言。

完成前必须通过：

1. taxonomy、template、Ratio DSL、Planner、plan identity、Worker/Python parity 和生成合同聚焦测试；
2. 全部真实旅程；
3. 全部 Node 测试；
4. `node tools/check-foods.mjs`；
5. `node tools/check-recipes.mjs`；
6. `python3 -m py_compile ai_proxy.py`；
7. canonical dist 构建与字节一致性；
8. 独立数据审计确认 72 recipes、16 templates、11/5 状态和新资产版本；
9. Draft PR #1 仍为 Draft/Open、未部署、未合并。

## 16. 诚实边界

该能力通过后只证明：确定性 Planner 能把小米、土豆和已经熟制的鹰嘴豆组成一套有机器比例和安全终点的家庭软谷物锅。

它不证明：

- 这是传统青海熬饭；
- 口味已经真人试做认可；
- 8.3 倍水量适合所有小米品种和锅具；
- 青藏其余三道菜单已经恢复；
- `auto_approved` 菜谱已经人工批准；
- Draft PR 已获 Preview 或 production 发布授权。

首次 Preview 厨房验证应记录 2、3、4 人份的实际稠度、糊底情况、谷物硬芯、土豆软熟、熟豆完整度和成品总量。未经记录，不扩大 Ratio DSL 区间，也不把这一规则推广到青稞、杂粮或普通大米粥。
