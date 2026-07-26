# 岭南 M1 菜心与去皮鸡腿食材身份能力设计

日期：2026-07-27

状态：设计已获用户继续执行确认，待用户审阅书面规格

适用范围：Draft PR #1 后续工作。本设计只恢复岭南现有菜单中能被 Pantry Planner V2 现有通用生米焖饭结构诚实承接的两组食材；不新增 recipe，不新增 template，不部署 Preview 或 production，不合并 PR。

相关文档：

- `docs/lingnan-hk-macao-one-pot-research.md`
- `docs/superpowers/specs/2026-07-23-pantry-planner-v2-design.md`
- `docs/superpowers/specs/2026-07-27-planner-menu-coverage-audit-design.md`
- `docs/planner-menu-coverage.md`

## 1. 当前事实与设计结论

当前覆盖审计中，`lingnan_hk_macao` 有 5 道生产菜单，完整单锅覆盖为 0：

| 菜单 | 当前缺口 | M1 决策 |
|---|---|---|
| 广式腊味煲仔饭 | `菜心` 未识别；瓦煲锅巴与普通锅等价未获证 | 恢复为通用腊肠菜心焖饭能力，不宣称煲仔饭复刻 |
| 广式香菇滑鸡煲仔饭 | `去皮鸡腿肉` 未识别；具名后下料结构未建模 | 恢复为通用鸡腿香菇焖饭能力，保留去皮与腿部原词 |
| 广式豆豉排骨煲仔饭 | `豆豉` 未识别，排骨慢熟形态被通用焖饭正确拒绝 | 继续阻止完整规划 |
| 海南定安菜包饭 | `生菜` 未识别；传统结构是熟饭熟馅出锅后包鲜菜叶 | 继续阻止把生菜与生米同锅焖熟 |
| 广西五色糯米饭 | 糯米、分批染色与天然色源规则未建立 | 继续阻止回退普通白米焖饭 |

M1 采用“受控食材身份补齐 + 现有通用 template 复用”：

1. 新增菜心的独立 pantry identity；
2. 给现有 `chicken-leg` 增加明确的“去皮鸡腿肉”市场名别名，不丢失 `raw` 原词和 `leg` 形态；
3. 继续使用 `savory-mixed-rice-pot`，不修改其 slots、Ratio DSL、烹饪顺序或 evidence IDs；
4. 不把“Planner 能安排这组食材”描述成“已复刻广式瓦煲煲仔饭”。

目标是把岭南当前覆盖从 0/5 提升到 2/5。其余 3 道继续以结构化缺口存在。

## 2. 方案取舍

### 2.1 采用：只恢复两组高确定食材

优点：

- `菜心`、`去皮鸡腿肉` 都是家庭高频、边界明确的市售食材；
- 现有 template 已接受叶菜、鸡腿、香菇、腊肠和生米，并已有鸡肉、猪肉熟制终点；
- 只扩充食材语义面，不改规划器排序和模型权限；
- 不用广式菜名为新 template 或固定菜谱制造虚假扩展。

### 2.2 不采用：为煲仔饭立即激活新 template

岭南研究账本已明确：瓦煲、后下具名配料、小火收尾和锅巴是未完成家庭等价与机器比例验证的结构。立即激活 claypot template 会把“广式风味一锅焖饭”写成“煲仔饭复刻”，超出当前证据。

### 2.3 不采用：顺手识别生菜、豆豉或糯米

- 生菜在定安菜包饭中是出锅后的鲜食包裹位，不是生米焖饭快熟菜位；
- 豆豉是发酵调味组件，但当前该菜的排骨慢熟与后下料结构仍不兼容；
- 糯米不能继承普通大米的液体规则，五色糯米饭还要求分批染色和蒸制。

只补这些名词会让系统更容易返回形式上 complete、实际上错误的计划，因此不纳入 M1。

## 3. 范围与非目标

### 3.1 M1 恢复范围

以下两道现有菜单的原始核心食材，必须能够以 `mode:pantry`、`intent:normal`、2 人份形成单锅 `complete`：

1. `cantonese-cured-meat-claypot-rice`：大米、广式腊肠、菜心；
2. `cantonese-mushroom-chicken-claypot-rice`：大米、去皮鸡腿肉、鲜香菇。

恢复的是通用家庭组合能力：

- 可表述为腊肠菜心焖饭、鸡腿香菇焖饭或“广式风味”适配；
- 只有 recipe 页面可以按自身来源和状态展示原地域菜名；
- Planner 不能只凭这组食材自动宣称瓦煲、锅巴或传统煲仔饭身份。

### 3.2 明确保留的缺口

- `生菜` 继续 `recognized:false`，定安菜包饭不得回退成生菜同焖饭；
- `豆豉` 继续未建立规划身份，猪肋排继续以 `unsupported_shape_or_cut` 停在生成前；
- `糯米`、天然植物染液或家庭食品粉色源不得当作大米或基础调味料；
- 普通锅计划不得产生“锅巴”“瓦煲”“后下具名配料可自由换”等声明。

### 3.3 本轮不做

- recipe 仍为 72 道：12 `approved` + 60 `auto_approved`；
- template 仍为 10 active + 6 planned；
- 不新增“腊味煲仔饭模板”或“香菇滑鸡模板”；
- 不修改 recommend/pantry 成功标准、覆盖门槛、多锅上限、排序、换一换或历史策略；
- 不修改 Ratio DSL 数值、操作符或基础补充项；
- 不把研究账本或 recipe 数值当作新的运行时默认值；
- 不增加账号、用户画像、营养追踪、云端用户数据或多 Agent 产品能力；
- 不调用真实 DeepSeek 做 Planner 验收；
- 不部署，不合并 Draft PR #1。

## 4. 食材身份设计

### 4.1 `choy-sum`

```json
{
  "canonical_id": "choy-sum",
  "display_name": "菜心",
  "aliases": [],
  "input_scope": "pantry_input",
  "category": "leafy_vegetable",
  "states": ["raw"],
  "shapes_or_cuts": ["whole"],
  "cook_speed": "fast",
  "moisture_release": "high",
  "texture_behavior": {
    "behavior_code": "wilts_quickly",
    "best_method_codes": ["quick_saute", "simmer"],
    "failure_mode_codes": ["soft_when_overcooked"]
  },
  "cooking_risk": {"risk_code": "none", "required_endpoint_codes": []},
  "compatible_slot_codes": ["vegetable", "fast_cooking_vegetable"],
  "incompatible_slot_codes": []
}
```

`choy-sum` 必须与青菜、小白菜、矮脚黄、芥菜和卷心菜保持独立 identity。本轮不添加“广东菜心”等新别名，避免在没有真实输入需求时扩大语义面。

### 4.2 `chicken-leg` 的受控别名

现有 `chicken-leg` 保持单一机器身份，只在 `aliases` 中新增：

```json
"aliases": ["鸡腿", "去皮鸡腿肉"]
```

输入“去皮鸡腿肉”时必须返回：

```json
{
  "raw": "去皮鸡腿肉",
  "canonical": "鸡肉",
  "display_name": "鸡腿肉",
  "category": "chicken",
  "shape_or_cut": "leg",
  "recognized": true
}
```

这个别名只复用同一部位的烹饪与安全语义；不允许：

- 把去皮鸡腿写成鸡胸、鸡翅或整鸡；
- 在 Planner 展示或 DeepSeek 文案中删掉“去皮”后反向要求使用鸡皮；
- 因去皮而跳过 `raw_poultry` 风险或 `poultry_fully_cooked` 终点；
- 把“鸡肉”忌口与去皮鸡腿分离。

## 5. Template、Ratio 与 evidence 边界

M1 不修改任何 template 业务字段。现有 `savory-mixed-rice-pot` 已明确：

- `staple` 接受 `raw_rice`；
- `protein` 接受 `chicken` 和受控 `cured_pork`；
- `fast_vegetable` 接受 `leafy_vegetable`；
- `mushroom` 接受 `mushroom`；
- `protein_max:1`，高出水食材最多 1 项；
- 烹饪顺序为预处理蛋白质、加生米和测量液体、后加快熟叶菜与菌菇、到达肉类熟制终点；
- 广式腊肠继续触发既有“不预加食用油和盐”条件。

Ratio DSL 保持 `ratio-rules-v1-20260727-r3`，不导入煲仔饭瓦煲水比、锅巴火力或后下料分钟数。

两道恢复菜单都不追加到 template `evidence_recipe_ids`：

- `cantonese-cured-meat-claypot-rice` 恢复后应为 `full_single_pot_ingredient_compatible`；
- `cantonese-mushroom-chicken-claypot-rice` 恢复后应为 `full_single_pot_ingredient_compatible`；
- `claypot-rice` 技法家族在 capability ledger 中仍不得改为完整覆盖；
- 审计的“食材可组合”不等于“地域工艺 evidence 对齐”。

## 6. Planner、生成与错误行为

### 6.1 Pantry 成功

两组目标输入都必须：

- `status:"complete"`；
- `plan_kind:"single_pot"`；
- `unplanned_must_use:[]`；
- `coverage_ratio:1`；
- 返回完整 `normalized_items`，保留 raw、canonical、category、shape/cut 和 recognized；
- `/plan-meal` 调用 DeepSeek 次数为 0。

### 6.2 保留缺口

含生菜的定安菜包饭核心、含豆豉和猪肋排的具名煲仔饭核心，或含糯米与色源的五色糯米饭核心：

- 不得返回冒充完整传统结构的 `complete`；
- 未规划 must-use 必须带结构化 reason code；
- 不得因其他两项食材可识别就静默丢弃第三项；
- `generation_allowed:false`；
- 不调用 DeepSeek；
- 不回退为残缺固定 recipe。

### 6.3 DeepSeek 边界

用户确认有效 plan 后，`/generate-plan` 仍最多调用 DeepSeek 1 次，不自动重试。模型：

- 不得把菜心换成小白菜、芥菜、卷心菜或其他叶菜；
- 不得把去皮鸡腿肉换成普通鸡腿文案后要求使用鸡皮，也不得换成鸡胸、鸡翅或其他蛋白质；
- 不得把广式腊肠换成腊肉或普通猪肉；
- 不得把鲜香菇换成平菇、金针菇或干香菇；
- 不得新增主要食材、锅具、锅巴工艺或未计划的液体；
- 只能表达 Planner 已锁定的食材、克数、液体和安全终点。

模型越界直接返回现有 `model_contract_violation`，不自动修补。

## 7. 版本、迁移与可复现性

本轮预期版本：

- taxonomy：`taxonomy-v1-20260727-r5`；
- template catalog：`templates-v2-20260727-r6`；
- Ratio DSL：保持 `ratio-rules-v1-20260727-r3`；
- Planner 协议：保持 `schema_version:2`、`planner_version:"pantry-planner-v2"`。

Template 业务字段不变，但 catalog 必须绑定新 taxonomy 版本，因此 catalog 版本同步前移。旧 plan token 因 catalog 或 taxonomy 版本变化，继续按现有契约返回 `stale_plan`；不得用新资产静默生成旧计划。

版本事实需要同步到 validator、Worker `/health`、本地 bridge、测试、`CLAUDE.md` 和 `部署说明.md`。不修改 production 地址或部署授权。

## 8. TDD 验收旅程

### 8.1 Identity 与语义

1. 菜心 → canonical 菜心，category `leafy_vegetable`，shape `whole`；
2. 菜心与青菜、小白菜、矮脚黄、芥菜、卷心菜都不得语义去重；
3. 去皮鸡腿肉 → raw 保留，canonical 鸡肉，shape `leg`；
4. 去皮鸡腿肉继承 `raw_poultry` 和 `poultry_fully_cooked`；
5. 鸡胸肉仍为 `breast`，不得与去皮鸡腿去重；
6. 忌口“鸡肉”必须拦截去皮鸡腿肉；
7. 生菜、豆豉、糯米和未受控色源继续保持未规划边界。

### 8.2 Planner 真实旅程

在现有 84 条旅程后增加 J85–J92，目标总数固定为 92：

| ID | 输入 | 预期 |
|---|---|---|
| J85 | 大米、广式腊肠、菜心 | 单锅 complete，3/3 覆盖，覆盖审计为 ingredient-compatible，不预加油盐 |
| J86 | 大米、去皮鸡腿肉、鲜香菇 | 单锅 complete，3/3 覆盖，保留去皮鸡腿原词与 `leg` |
| J87 | 大米、去皮鸡腿肉、菜心 | 单锅 complete，鸡肉安全终点存在 |
| J88 | 大米、去皮鸡腿肉、鲜香菇，忌口鸡肉 | 不得 complete，鸡腿进入 allergen conflict |
| J89 | 大米、生菜、胡萝卜 | 不得把生菜同焖后冒充定安菜包饭 |
| J90 | 大米、猪肋排、豆豉 | 不得 complete，排骨仍为 `unsupported_shape_or_cut` |
| J91 | 糯米、食品级紫薯粉、食品级甜菜粉、食品级菠菜粉、食品级南瓜粉 | 不得回退普通白米焖饭，不调用 DeepSeek |
| J92 | 大米、广式腊肠、菜心、卷心菜 | 两个高出水叶菜不得伪造完整单锅 |

`regional_capability` 分类数量将从 40 增加到 48。所有新旅程的 `/plan-meal` DeepSeek 上限为 0。

### 8.3 Planner、Worker 与生成锁

- 两组目标输入都必须选择 `savory-mixed-rice-pot`，且不允许 fixed recipe selector 决定组合；
- Worker 与 `ai_proxy.py` 对 J85–J92 返回相同状态和计划事实；
- `/generate-plan` 锁定菜心、广式腊肠、去皮鸡腿肉和鲜香菇原词；
- 模型新增小白菜、鸡胸、鸡皮、平菇或腊肉时，现有越界校验必须拒绝；
- `/health` 报告 taxonomy r5、template r6、Ratio r3、10 active + 6 planned、72 recipes、92/92 journeys。

### 8.4 覆盖审计

重建覆盖产物后必须断言：

- recipe 总数仍为 72，状态仍为 12 approved + 60 auto_approved；
- `lingnan_hk_macao` 为 5 道、2 道完整单锅、3 道保持缺口；
- 广式腊味煲仔饭和广式香菇滑鸡煲仔饭都为 `full_single_pot_ingredient_compatible`；
- 广式豆豉排骨煲仔饭、海南定安菜包饭、广西五色糯米饭仍不得成为完整普通生米锅；
- `claypot-rice` 技法家族的 capability 覆盖状态不得因两组通用食材计划而升级；
- 生成的菜单总表、地域 atlas 和覆盖报告 hash 与新 taxonomy 一致。

## 9. 实施顺序与完成门槛

实施顺序固定为：

1. 先写 taxonomy 失败测试，再增加菜心与去皮鸡腿别名；
2. 同步 r5/r6 版本闭包，不改 template 业务内容；
3. 先写 Planner 与生成锁失败测试，再确认两组目标输入完整规划；
4. 把 J85–J92 写入公共旅程，锁定正反边界和 Worker/Python parity；
5. 只向 `raw-rice-braise` capability ledger 补充相关 taxonomy 引用，不扩大 claypot evidence 声明；
6. 用权威 builder 重建 planner coverage、menu master 和 regional atlas；
7. 同步部署事实并运行全量测试、菜谱门禁、92/92 旅程、Python 语法和构建一致性检查；
8. 只更新现有 Draft PR #1，不部署、不合并。

完成不以“测试数量增加”为准，而以以下事实同时成立为准：

- 两组目标食材均完整进入同一个确定性锅；
- 原词、部位、去皮属性和熟制终点没有被模型改写；
- 其余三道菜的结构缺口仍能从响应和审计中看见；
- 不增加 recipe/template，不伪造 claypot 工艺覆盖；
- 全部门禁在最终提交树上退出码为 0。
