# 闽台生米菜饭 M1 食材身份与肉末形态能力设计

日期：2026-07-27

状态：设计已获用户继续执行确认，待用户审阅书面规格

适用范围：Draft PR #1 后续工作。本设计只恢复闽台现有菜单与 Pantry Planner V2 之间能够被现有通用生米焖饭结构诚实承接的部分；不新增 recipe，不新增 template，不部署 Preview 或 production，不合并 PR。

相关文档：

- `docs/fujian-taiwan-rice-noodle-research.md`
- `docs/superpowers/specs/2026-07-23-pantry-planner-v2-design.md`
- `docs/superpowers/specs/2026-07-27-planner-menu-coverage-audit-design.md`
- `docs/planner-menu-coverage.md`

## 1. 当前事实与设计结论

当前覆盖审计中，`fujian_taiwan` 有 6 道生产菜单，完整单锅覆盖为 0：

| 菜单 | 当前缺口 | M1 决策 |
|---|---|---|
| 高丽菜香菇炊饭 | `卷心菜` 未识别 | 恢复为通用卷心菜菌菇焖饭能力 |
| 福建盖菜肉末咸饭 | `芥菜`、`猪肉末` 未识别 | 恢复为通用芥菜肉末焖饭能力 |
| 福建扁豆饭 | `扁豆` 未识别且具体豆种未获证 | 继续阻止完整规划 |
| 泉州浥饭（油饭） | `泡发糯米`、`猪肉末` 未识别，米种和项目版本与来源不等价 | 继续阻止完整规划 |
| 大溪荷叶油饭 | `糯米`、`猪肉末`、`食品级干荷叶` 未识别，器具和比例未解决 | 继续阻止完整规划 |
| 畲族乌饭家庭适配版 | `糯米`、`食品级黑米色粉` 未识别，传统色源不等价 | 继续阻止完整规划 |

M1 采用“受控身份补齐 + 现有模板窄扩形态”的方案：

1. 新增卷心菜、芥菜和猪肉末三个明确 pantry identity；
2. 继续使用 `savory-mixed-rice-pot`，只让其猪肉槽接受受控 `ground` 形态；
3. 不修改 Ratio DSL 数值，不把研究资料中的状态依赖比例强塞进通用规则；
4. 不把“Planner 能做这组食材”描述成“已复刻福建或台湾传统菜”。

目标是把闽台当前覆盖从 0/6 提升到 2/6。其余 4 道继续以结构化缺口存在。

## 2. 方案取舍

### 2.1 采用：只恢复确定身份的两道

优点：

- 解决真实常见输入 `卷心菜／高丽菜`、`芥菜／盖菜`、`猪肉末`；
- 复用已经验证的生米焖饭液体和高出水食材修正规则；
- 不要求新 UI、新模板或新模型权限；
- 不伪造扁豆豆种、糯米比例或荷叶工艺。

### 2.2 不采用：把“扁豆”直接归入通用豆荚

闽台研究账本明确记录 `bean_species_identity:not_proven`，并要求记录商品名或豆种。泛称“扁豆”可能对应不同食材形态、熟制风险和吸水表现。M1 不把它静默归入四季豆、豇豆、红扁豆或某个英文物种。

### 2.3 暂不采用：新增豆种澄清交互

让用户选择具体豆种是合理的长期路径，但会引入新的前端状态、请求字段和用户决策流程。当前目标是验证既有 Planner 架构，不在本轮增加该功能。

## 3. 范围与非目标

### 3.1 M1 恢复范围

以下两道现有菜单的原始核心食材，必须能够以 `mode:pantry`、`intent:normal`、2 人份形成单锅 `complete`：

1. `taiwan-cabbage-mushroom-rice`：大米、卷心菜、鲜香菇；
2. `fujian-gai-cai-minced-pork-rice`：大米、芥菜、猪肉末。

恢复的是通用家庭组合能力：

- 第一组可表述为卷心菜香菇焖饭或高丽菜香菇炊饭；
- 第二组可表述为芥菜肉末焖饭；
- 只有 recipe 页面可以按自身来源和状态展示地域菜单名；
- Planner 不能仅凭食材自动宣称传统地域身份。

### 3.2 明确保留的缺口

- 普通输入“扁豆”继续 `recognized:false`，进入 `unplanned_must_use`；
- `糯米`、`泡发糯米`不得归入普通大米；
- `食品级干荷叶`不得当作普通调味料或容器后静默忽略；
- `食品级黑米色粉`不得当作传统乌稔树叶汁；
- 泉州浥饭不得因猪肉末被识别而冒充完整可规划；
- 大溪荷叶油饭和畲族乌饭不得回退为普通生米焖饭。

### 3.3 本轮不做

- recipe 仍为 72 道：12 `approved` + 60 `auto_approved`；
- template 仍为 10 active + 6 planned；
- 不新增“高丽菜饭模板”或“芥菜肉末饭模板”；
- 不修改 recommend/pantry 成功标准、多锅上限、排序、换一换或历史策略；
- 不修改 Ratio DSL 数值、操作符或基础补充项；
- 不添加外部营养数字；
- 不增加账号、用户画像、营养追踪、云端用户数据或多 Agent 产品能力；
- 不调用 DeepSeek 做 Planner 验收；
- 不部署，不合并 Draft PR #1。

## 4. 食材身份设计

### 4.1 `green-cabbage`

```json
{
  "canonical_id": "green-cabbage",
  "display_name": "卷心菜",
  "aliases": ["高丽菜"],
  "input_scope": "pantry_input",
  "category": "leafy_vegetable",
  "states": ["raw"],
  "shapes_or_cuts": ["whole", "slice"],
  "default_shape_or_cut": "whole",
  "cook_speed": "fast",
  "moisture_release": "high",
  "texture_behavior": {
    "behavior_code": "wilts_quickly",
    "best_method_codes": ["simmer", "quick_saute"],
    "failure_mode_codes": ["watery_when_overloaded"]
  },
  "cooking_risk": {"risk_code": "none", "required_endpoint_codes": []},
  "compatible_slot_codes": ["vegetable", "fast_cooking_vegetable"],
  "incompatible_slot_codes": []
}
```

它必须与 `napa-cabbage`（白菜）保持独立 identity。输入“高丽菜”时，归一化结果为 `raw:"高丽菜"`、`canonical:"卷心菜"`、`display_name:"卷心菜"`；最终计划和生成文案优先使用 `raw`，因此用户仍看到“高丽菜”，且任何层都不得把它改写成白菜。

### 4.2 `mustard-greens`

```json
{
  "canonical_id": "mustard-greens",
  "display_name": "芥菜",
  "aliases": ["盖菜"],
  "input_scope": "pantry_input",
  "category": "leafy_vegetable",
  "states": ["raw"],
  "shapes_or_cuts": ["whole", "slice"],
  "default_shape_or_cut": "whole",
  "cook_speed": "fast",
  "moisture_release": "high",
  "texture_behavior": {
    "behavior_code": "wilts_quickly",
    "best_method_codes": ["simmer", "quick_saute"],
    "failure_mode_codes": ["soft_when_overcooked"]
  },
  "cooking_risk": {"risk_code": "none", "required_endpoint_codes": []},
  "compatible_slot_codes": ["vegetable", "fast_cooking_vegetable"],
  "incompatible_slot_codes": []
}
```

“盖菜”只作为本项目受控市场别名指向芥菜；不得进一步推断具体栽培品种或地域传统身份。

### 4.3 `ground-pork`

```json
{
  "canonical_id": "ground-pork",
  "display_name": "猪肉末",
  "canonical_name": "猪肉",
  "aliases": ["猪绞肉"],
  "input_scope": "pantry_input",
  "category": "pork",
  "states": ["raw"],
  "shapes_or_cuts": ["ground"],
  "cook_speed": "fast",
  "moisture_release": "low",
  "texture_behavior": {
    "behavior_code": "crumbles_when_cooked",
    "best_method_codes": ["quick_saute", "short_simmer"],
    "failure_mode_codes": ["chewy_when_undercooked"]
  },
  "cooking_risk": {
    "risk_code": "raw_pork",
    "required_endpoint_codes": ["pork_fully_cooked"]
  },
  "compatible_slot_codes": ["generic_pork", "ground_meat_required"],
  "incompatible_slot_codes": ["rib_required"]
}
```

`canonical_name:"猪肉"` 只允许通用猪肉做法接受猪肉末；原始形态 `ground` 必须一直保留。猪肉末：

- 不得替换排骨；
- 不得替换需要整片、肉丁、里脊或腌腊切片的专用做法；
- 必须执行 `pork_fully_cooked`；
- 不得因颗粒小而跳过生熟分开和彻底加热要求。

## 5. Template 边界

M1 只修改现有 `savory-mixed-rice-pot` 的猪肉形态约束：

- `protein` 槽仍最多 1 项；
- `pork` 的 `allowed_shapes` 增加 `ground`；
- `rib` 继续禁止；
- `ground-pork` 通过 `generic_pork` 进入槽位；
- 现有烹饪顺序 `protein_pretreat` → 加慢熟食材 → 加米和液体 → 后加快熟叶菜保持不变；
- 高出水食材仍最多 1 项，因此卷心菜和芥菜不能与第二个高出水食材在同一生米锅中静默全收。

Template 不增加地域菜名，不新增固定组合，也不把 `fujian-gai-cai-minced-pork-rice` 加入 `evidence_recipe_ids`。后者恢复后应标记为 `full_single_pot_ingredient_compatible`，而不是伪造直接 evidence 对齐。

`taiwan-cabbage-mushroom-rice` 已是 `savory-mixed-rice-pot` 的直接 evidence recipe。其恢复后可标记 `full_single_pot_evidence_aligned`，但这只表示项目 template 引用了该 recipe，不表示官方来源逐字支持项目全部食材和比例。

## 6. Ratio DSL 与份量边界

本轮保持 `ratio-rules-v1-20260727-r3` 不变：

- 大米每份默认 100 克；
- 猪肉末进入现有 protein 每份区间；
- 芥菜和卷心菜进入 fast vegetable 每份区间；
- 鲜香菇进入 mushroom 每份区间；
- 单个高出水叶菜继续触发现有液体扣减；
- 食用油和盐继续作为普通非腌制组合的基础补充项；
- 猪肉末不触发江南腌肉的跳过油盐条件。

研究资料中“浸泡沥干米、焯菜后 0.8 倍水”的状态依赖规则不进入本轮 Ratio DSL，因为当前 Planner 输入没有证明用户执行了这些预处理状态。不得用该数字覆盖通用总保留液体规则。

## 7. Planner、生成与错误行为

### 7.1 Pantry 成功

两组目标输入都必须：

- `status:"complete"`；
- `plan_kind:"single_pot"`；
- `unplanned_must_use:[]`；
- `coverage_ratio:1`；
- 返回完整 `normalized_items`，保留 raw、canonical、category、shape/cut 和 recognized；
- `/plan-meal` 调用 DeepSeek 次数为 0。

### 7.2 保留缺口

含普通“扁豆”、糯米、泡发糯米、食品级干荷叶或食品级黑米色粉的 pantry 请求，只要仍有未规划 must-use：

- 返回 `needs_user_decision` 或当前更严格的 `no_valid_plan`；
- 不得返回 `complete`；
- 未规划项必须带结构化 reason code；
- `generation_allowed:false`；
- 不调用 DeepSeek；
- 不回退为残缺固定 recipe。

### 7.3 DeepSeek 边界

用户确认有效 plan 后，`/generate-plan` 仍最多调用 DeepSeek 1 次，不自动重试。模型：

- 不得把卷心菜换成白菜；
- 不得把高丽菜换成其他青菜；
- 不得把芥菜换成菠菜或油菜；
- 不得把猪肉末换成猪肉片、排骨或其他蛋白；
- 不得新增主要食材；
- 只能表达 Planner 已锁定的食材、克数、液体和安全终点。

模型输出的食材集合仍必须等于 Planner 确定集合加允许的基础补充项；越界直接失败，不自动修补。

## 8. 版本与迁移

本轮预期版本：

- taxonomy：`taxonomy-v1-20260727-r4`；
- template catalog：`templates-v2-20260727-r5`；
- Ratio DSL：保持 `ratio-rules-v1-20260727-r3`；
- Planner 协议：保持 `schema_version:2`、`planner_version:"pantry-planner-v2"`。

Template catalog 必须绑定新的 taxonomy 版本。旧 plan token 因 catalog 或 taxonomy 版本变化，继续按现有契约返回 `stale_plan`；不得用新资产静默生成旧计划。

版本事实需要同步到 Worker `/health`、本地 bridge、测试、`CLAUDE.md` 和 `部署说明.md`。不修改 production 地址或部署授权。

## 9. TDD 验收旅程

### 9.1 Identity 与形态

1. 卷心菜 → canonical 卷心菜，category `leafy_vegetable`；
2. 高丽菜 → canonical 卷心菜，但 raw/display 保留高丽菜；
3. 白菜仍是 `napa-cabbage`，不得与卷心菜合并；
4. 芥菜 → canonical 芥菜；
5. 盖菜 → canonical 芥菜，但 raw 保留盖菜；
6. 猪肉末 → canonical 猪肉，shape `ground`；
7. 猪绞肉 → canonical 猪肉，shape `ground`；
8. 猪肉片仍是 `slice`；猪肋排仍是 `rib`；
9. 扁豆继续 `recognized:false`；
10. 糯米、泡发糯米、食品级干荷叶、食品级黑米色粉继续 `recognized:false`。

### 9.2 Planner 真实旅程

在现有 76 条旅程后增加 J77–J84，目标总数固定为 84：

| ID | 输入 | 预期 |
|---|---|---|
| J77 | 大米、卷心菜、鲜香菇 | 单锅 complete，3/3 覆盖，`savory-mixed-rice-pot` |
| J78 | 大米、高丽菜、鲜香菇 | 单锅 complete，保留高丽菜原名 |
| J79 | 大米、芥菜、猪肉末 | 单锅 complete，3/3 覆盖，猪肉末彻底熟制 |
| J80 | 大米、盖菜、猪绞肉 | 单锅 complete，别名与形态保持 |
| J81 | 大米、扁豆 | 不得 complete；扁豆进入 `unplanned_must_use` |
| J82 | 泡发糯米、猪肉末、鲜香菇 | 不得因猪肉末已识别而回退普通生米锅 |
| J83 | 糯米、猪肉末、食品级干荷叶 | 不得 complete，不调用 DeepSeek |
| J84 | 大米、卷心菜、芥菜、猪肉末 | 两个高出水叶菜不得被伪造成一个完整生米锅；按真实 Planner 返回多锅或 `needs_user_decision` |

### 9.3 形态负例

- 猪肉末可以进入通用生米焖饭 protein 槽；
- 猪肉末不能进入 `rib_required`；
- 猪肋排不能因同属 pork 获得 `ground` 兼容性；
- 把 template 的 `ground` 从允许形态移除时，J79/J80 必须失败；
- taxonomy 的 `ground-pork` 错设为 `slice` 时，validator 或 parity 测试必须失败。

### 9.4 Worker / Python / 生成 parity

- Worker 与 `ai_proxy.py` 共享同一 Planner 纯函数，对 J77–J84 返回一致状态；
- `/plan-meal` 为 0 次 DeepSeek；
- `/generate-plan` 锁定卷心菜／高丽菜、芥菜／盖菜和猪肉末／猪绞肉的原始身份；
- 模型新增白菜、替换猪肉片或删除芥菜时，现有越界校验拒绝；
- `/health` 报告 taxonomy r4、template r5、Ratio r3、10 active + 6 planned、72 recipes。

### 9.5 覆盖审计

重建覆盖产物后必须断言：

- recipe 总数仍为 72，状态仍为 12 approved + 60 auto_approved；
- `fujian_taiwan` 为 6 道、2 道完整单锅、4 道仍有缺口；
- `taiwan-cabbage-mushroom-rice` 为 `full_single_pot_evidence_aligned`；
- `fujian-gai-cai-minced-pork-rice` 为 `full_single_pot_ingredient_compatible`；
- `fujian-hyacinth-bean-rice` 仍为 taxonomy gap；
- 泉州浥饭、大溪荷叶油饭、畲族乌饭仍不得成为完整普通生米锅；
- 生成的菜单主表和覆盖报告 hash 与新 taxonomy 一致。

## 10. 文件责任边界

预期修改：

- `tools/data/ingredient-taxonomy.v1.json`
- `worker/src/ingredient-taxonomy-validator.js`（只同步版本；有限词表已有所需值）
- `tools/data/meal-templates.v2.json`
- `worker/src/meal-template-validator.js`
- `tools/data/pantry-planner-v2-journeys.json`
- `tools/run-pantry-planner-v2-journeys.mjs`
- 相关 taxonomy、template、Planner、bridge、生成契约与覆盖审计测试
- `tools/generated/planner-menu-coverage.v1.json`
- `docs/planner-menu-coverage.md`
- `tools/generated/menu-master.v1.json`
- `docs/menu-master.md`
- `docs/menu-master.csv`
- `CLAUDE.md`
- `部署说明.md`

除版本同步外，预计不修改：

- `tools/data/ratio-rules.v1.json`
- `worker/src/ratio-dsl.js`
- `tools/data/recipe-library.json`
- `index.html`
- `ai_proxy.py`
- 任何部署配置或线上状态。

## 11. 完成门禁

实施完成前必须有新鲜证据证明：

1. 每个行为修改均经历失败测试 → 最小实现 → 绿灯；
2. 全量 Node 测试通过；
3. `node tools/check-recipes.mjs` 通过；
4. `node tools/run-pantry-planner-v2-journeys.mjs` 报告 84/84；
5. `python3 -m py_compile ai_proxy.py` 通过；
6. `node tools/build-planner-menu-coverage.mjs --check` 通过；
7. `node tools/build-menu-master.mjs --check` 通过；
8. `node tools/build-dist.mjs` 与构建测试通过；
9. `git diff --check` 通过；
10. recipe 仍为 72，template 仍为 10 active + 6 planned；
11. Draft PR #1 保持 Open + Draft；
12. 没有 Preview 或 production 部署。

这些门禁只证明确定性规划和工程边界正确，不代表两道地方菜单已人工试做，也不把 `auto_approved` 升为人工批准。
