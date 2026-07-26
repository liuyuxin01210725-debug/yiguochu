# 熟米饭汤饭能力设计

日期：2026-07-27

状态：待用户审阅；审阅通过前不进入实现

适用范围：Draft PR #1；本规格不授权部署 Preview、production 或合并 PR

## 1. 决策摘要

全国地域框架已经覆盖 13 个区域、34 个省级单元和 12 类一锅技法。下一步不新增固定 recipe，而是把 `cooked-rice-stew` 从“只有番茄酸味烩饭可运行”推进为可处理普通剩米饭汤饭的确定性能力。

本轮只激活 `broth-rice-pot` 的 `cooked_rice` 分支：

```text
剩米饭 / 熟米饭
  ↓ taxonomy 精确识别
蛋白、耐煮蔬菜、快熟叶菜独立入槽
  ↓ Template Planner
按类别计算食材克数与 1.8 倍汤水
  ↓ Ratio DSL
锁定食材、顺序、份量与安全终点
  ↓ 用户确认
DeepSeek 只从有限文案契约中表达做法
```

`raw_rice` 不进入本次能力。生米粥的约 1:11 液体结构与熟饭汤饭的约 1:1.8 汤水结构必须继续分开，不得因为共用“汤饭”字样而共用比例规则。

## 2. 为什么优先做这项能力

当前 `cooked-rice-stew` 只有 `acid-staple-pot` 可运行，意味着一般汤饭必须先有番茄等酸味底。它会漏掉“剩米饭 + 白菜 + 鸡蛋”“剩米饭 + 鸡腿肉 + 土豆”等常见家庭组合。

现有生产 recipe 已提供一致且可审计的证据：

- `cabbage-egg-soup-rice`：每 100 克熟米饭约 180 克汤水，配约 35 克蛋液与 60 克白菜；
- `tomato-chicken-leg-soup-rice`：每 100 克熟米饭约 180 克汤水，配约 50 克鸡腿肉与 60 克番茄；使用土豆时约 40–50 克；
- 两条都要求熟米饭充分复热，并分别提供鸡蛋或鸡肉的熟制终点。

这不是把两道 recipe 复制成更多固定菜名。recipe 只提供技法、比例和安全 evidence；实际组合能力仍由 template rules + taxonomy + Ratio DSL 决定。

## 3. 采用方案与未采用方案

### 3.1 采用：熟米饭专用汤饭分支

`broth-rice-pot` 只接受 `cooked_rice`。蛋白、耐煮根茎和快熟叶菜分别受控入槽，Planner 决定组合，DeepSeek 不参与选材。

优点：直接补齐剩饭清库存能力，数据边界清楚，并能复用现有 V2 计划、换一换和生成校验链路。

### 3.2 不采用：同时支持生米和熟米

生米要吸水并经历糊化，熟米只需要吸收部分汤汁并充分复热。两者共用一条比例会导致粥、烩饭和汤饭互相污染。

### 3.3 不采用：先新增更多汤饭 recipe

固定 recipe 只能增加有限组合，不能解决用户输入变化后的覆盖问题，还会重新走回“72 道扩到 300 道”的旧路线。

### 3.4 不采用：所有蛋白使用同一个每份克数

当前 Ratio DSL 的 `per_serving` 对整个槽位只给一个克数。如果鸡蛋和鸡肉共用 `protein` 槽位，就会被迫使用同一份量。该结果与 evidence 不符，因此本轮必须先增加受控的按类别份量操作符。

## 4. 第一阶段产品承诺

### 4.1 支持范围

- 主食：`cooked_rice`，来源可以是用户现有食材或允许的基础主食补充；
- 蛋白：`egg`、`chicken`，一锅最多一种；
- 耐煮蔬菜：`root_vegetable`，一锅最多一种；
- 快熟蔬菜：`leafy_vegetable`，一锅最多一种；
- intent：`normal`、`fresh`、`batch`；
- 份数：沿用 V2 的 1–8 份输入边界；
- 模板每锅最多覆盖 4 项用户食材；
- 一锅至少需要 2 项用户食材，避免给用户返回只有白饭加水、没有清库存意义的方案。

### 4.2 明确不支持

- `raw_rice`、小米、杂粮或其他生谷物；
- 面条、粉丝、米粉；
- 豆腐、牛肉、猪肉、海鲜、菌菇和十字花科蔬菜；
- 两种蛋白同时进入一锅；
- `quick` intent；
- 来源状态不可靠的剩米饭；
- DeepSeek自行增加高汤、肉类、豆腐或其他主要食材。

这些是第一阶段证据边界，不是永久否定。新增类别必须有独立 evidence、份量规则和安全校验后再开放。

## 5. Template 机器契约

`broth-rice-pot` 的生产形态改为：

```json
{
  "template_id": "broth-rice-pot",
  "activation_status": "active",
  "runtime_eligible": true,
  "required_slots": [
    {
      "slot_id": "staple",
      "min_items": 1,
      "max_items": 1,
      "source_policy": ["user", "basic_extra"],
      "accepts_categories": ["cooked_rice"]
    },
    {
      "slot_id": "liquid",
      "min_items": 1,
      "max_items": 1,
      "source_policy": ["basic_extra"],
      "accepts_categories": ["liquid"]
    }
  ],
  "optional_slots": [
    {
      "slot_id": "protein",
      "min_items": 0,
      "max_items": 1,
      "source_policy": ["user"],
      "accepts_categories": ["egg", "chicken"]
    },
    {
      "slot_id": "slow_vegetable",
      "min_items": 0,
      "max_items": 1,
      "source_policy": ["user"],
      "accepts_categories": ["root_vegetable"]
    },
    {
      "slot_id": "fast_vegetable",
      "min_items": 0,
      "max_items": 1,
      "source_policy": ["user"],
      "accepts_categories": ["leafy_vegetable"]
    }
  ],
  "slot_limits": {
    "total_user_items_min": 2,
    "total_user_items_max": 4,
    "protein_max": 1,
    "slow_vegetable_max": 1,
    "fast_vegetable_max": 1
  },
  "ratio_constraints": ["broth-rice-liquid-v1"],
  "supported_intents": ["normal", "fresh", "batch"],
  "evidence_recipe_ids": [
    "cabbage-egg-soup-rice",
    "tomato-chicken-leg-soup-rice"
  ]
}
```

完整 catalog 仍必须包含 compatibility、shape/cut、cooking order、liquid constraints、time range 与 safety endpoints。上面的片段只展示本轮关键边界。

### 5.1 烹饪顺序

机器顺序按实际蛋白类别确定：

1. 汤水与 `slow_vegetable` 先入锅，使根茎先开始软化；
2. `protein=chicken` 时加入均匀小块鸡肉并开始煮制；`protein=egg` 时跳过这一阶段；
3. 加入熟米饭并充分复热；
4. `protein=egg` 时加入蛋液并温和加热至凝固；`protein=chicken` 时跳过蛋液阶段；随后加入 `fast_vegetable`；
5. 最后统一检查全部安全终点。

为此，`cooking_order` 的 phase 新增唯一一个可选机器条件：

```ts
type CookingOrderCondition = {
  slot_id: string;
  category: string;
};

type ConditionalCookingPhase = {
  phase: number;
  action_code: string;
  slot_ids: string[];
  when?: CookingOrderCondition;
};
```

边界：

- `when.slot_id` 必须同时出现在该 phase 的 `slot_ids` 和 template 已声明槽位中；
- `when.category` 必须是该槽位接受的 category；
- Planner 锁定槽位后，只保留条件命中的阶段；无条件阶段始终保留；
- 条件未命中不是模型选择，也不得被模型重新加入；
- 未声明字段、多个条件、任意表达式、脚本和自然语言条件全部拒绝；
- 条件过滤后，每个已分配用户食材仍必须至少出现在一个保留阶段中，否则计划 fail closed。

本轮新增有限 action code `add_broth_protein`，其受控文案由已锁定 category 决定：鸡肉分支描述均匀小块入汤加热，鸡蛋分支描述蛋液沿锅加入并温和凝固。不得把“鸡肉早于熟饭、鸡蛋晚于熟饭”的差异交给 DeepSeek自由理解。

### 5.2 形态边界

鸡肉只允许当前 taxonomy 已识别的 `breast`、`leg` 形态。不得把整鸡、带骨大块或鸡肉末无条件套入同一时间路径。用户原始名称和部位继续保留到生成结果中。

## 6. Ratio DSL 扩展

### 6.1 新操作符

新增有限操作符 `per_serving_by_category`：

```ts
type PerServingByCategory = {
  operator: 'per_serving_by_category';
  target: { slot_id: string };
  grams_by_category: Record<string, {
    min: number;
    default: number;
    max: number;
  }>;
};
```

校验规则：

- `target.slot_id` 必须是 template 声明的用户槽位；
- `grams_by_category` 的 key 必须与该槽位接受类别完全一致，不得缺项或多项；
- 每个 bounds 都必须是有限非负数，满足 `min <= default <= max`；
- 编译时只能按已锁定食材的 category 取值；
- 未知 category、重复赋值或结果为 0 时 fail closed；
- 该操作符仍是纯数据解释器，不接受表达式、脚本或自然语言公式。

本次只在 `broth-rice-liquid-v1` 使用该操作符。不得顺手改写其他模板的现有比例。

### 6.2 新规则

`broth-rice-liquid-v1` 使用以下 evidence 推导的默认量：

| 槽位/类别 | 每份默认量 | 推导 |
| --- | ---: | --- |
| 熟米饭 | 180 克 | 沿用 V2 熟饭一份默认量 |
| 鸡蛋 | 65 克 | 35 克/100 克熟饭 × 180 克，按 5 克取整 |
| 鸡肉 | 90 克 | 50 克/100 克熟饭 × 180 克 |
| 根茎蔬菜 | 80 克 | 土豆 40–50 克/100 克熟饭，采用 45 × 1.8 后按 5 克取整 |
| 叶菜 | 110 克 | 白菜 60 克/100 克熟饭 × 180 克，按 5 克取整 |
| 水 | 熟米饭克数 × 1.8 | 两条 evidence 均为 180 克汤水/100 克熟饭 |

第一阶段没有足够证据支持数值浮动，因此这些项目的 `min/default/max` 先保持相同。后续只有获得独立证据或实厨校准后才允许扩大范围，不能用“口味可调”作为虚构区间的理由。

液体仍通过 `ratio` 操作符计算；`numerator.resource` 继续为 `retained_liquid_grams`，`denominator` 必须是 `staple` 的克数。水属于允许的基础补充项。

## 7. 安全契约

模板必须声明并在生成文本契约中落实：

- `cooked_rice` → `heated_through`；
- `egg` → `egg_fully_set`；
- `chicken` → `poultry_fully_cooked_no_pink`；
- `root_vegetable` → `tender`。

此外，生成结果必须带一条受控的剩饭前提：只使用做熟后及时冷藏且保存状态可靠的熟米饭。该前提属于 Planner 锁定的安全要求，不能让 DeepSeek自行决定是否出现。

如果生成文本漏掉任一实际食材所需终点，返回 `model_contract_violation`，不展示残缺做法，也不自动重试。

## 8. Planner 与产品行为

### 8.1 recommend

输入多个 `prefer_use` 时，Planner 可以选择熟饭汤饭，也可以选择覆盖更高、兼容性更好的其他 active template。结果必须如实显示 `planned_prefer_use` 与 `unused_prefer_use`，不得承诺全部使用。

### 8.2 pantry

完整成功仍要求全部可识别 `must_use` 被一锅或多锅计划覆盖。该模板不能覆盖的食材继续进入其他 pot 或 `unplanned_must_use`，不得静默丢弃。

### 8.3 排序

现有排序原则保持：must-use 覆盖、安全、时间、基础补充项数量。激活新模板后不得增加“汤饭固定优先”的特殊分数。它必须靠真实覆盖和约束自然胜出。

### 8.4 换一换

换一换重新运行 Planner，不调用 DeepSeek。有效替代计划必须满足 template、槽位分配、锅数结构或锅顺序至少一项不同。只有文案不同不算新计划。

如果当前组合只有一套满足相同承诺的计划，返回 `no_alternative_plan`，沿用现有明确用户路径，不降级成通用生成失败。

## 9. DeepSeek 输入输出边界

输入仍只包含已确认的：

- `template_id`；
- `slot_assignment`；
- `ingredient_amounts`；
- `required_extra_items`；
- `cooking_order`；
- `liquid_constraints`；
- `safety_endpoints`；
- 有限 `generation_text_contract`。

DeepSeek 不得：

- 把鸡胸换成鸡腿或把鸡肉换成其他肉；
- 新增豆腐、菌菇、高汤等主要食材；
- 删除未使用但已锁定的食材；
- 修改 1.8 倍汤水、克数、入锅顺序或安全终点；
- 把普通汤饭包装成未经证据支持的地域名菜。

服务端继续验证模型输出食材集合等于 Planner 锁定集合加允许基础补充项，并验证每个步骤只能从有限 options 中选择。

## 10. 版本、身份与迁移

实现需原子更新：

- `template_catalog_version`；
- `ratio_catalog_version`；
- template validator、Ratio DSL validator 与 Worker/本地代理所读取的资产；
- Planner 两处 active-template allowlist；
- health 输出中的 active/planned 数量；
- regional capability ledger 与 atlas 派生产物；
- build manifest 与 parity 快照。

`plan_id` 继续由规范化计划内容 hash 生成。由于 template catalog 与 ratio catalog 版本进入计划身份，旧计划必须在重新打开或生成时返回 `stale_plan`，不能静默使用旧比例。

完成后 `cooked-rice-stew` 能力映射应变为：

- `coverage_level: "full"`；
- `runtime_template_ids: ["acid-staple-pot", "broth-rice-pot"]`；
- `candidate_template_ids: []`；
- `promotion_status: "covered_by_active_template"`；
- `resolved_ratio_rule_ids` 同时包含酸味熟饭与普通汤饭规则；
- `blocker_codes: []`。

旧 V1 请求兼容策略不变：旧 `purpose` 先映射到 V2 mode/intent，再由同一 Planner 处理。不得为旧请求单独开放生米汤饭回退。

## 11. TDD 实施顺序

每组先写失败测试并确认失败原因，再写最小实现：

1. Ratio DSL validator 拒绝未知操作符之前，新增 `per_serving_by_category` 的失败测试；
2. 校验 category key 缺失、多余、非数值、越界与未声明槽位；
3. 编译器按锁定食材 category 选择克数，并 fail closed；
4. template validator 先拒绝未声明条件，再实现唯一受控的 `when:{slot_id,category}`；
5. generation contract 只保留条件命中的 cooking phase，并验证食材阶段覆盖不丢失；
6. template validator 证明 `broth-rice-pot` 只接受熟米饭且安全终点齐全；
7. Planner 激活 template，并验证单锅、多锅、换一换与 plan identity；
8. Worker 与 `ai_proxy.py` HTTP parity；
9. 前端只消费现有 V2 plan schema，不新增入口或功能；
10. 区域能力账本、atlas 与构建产物同步。

不得先改 catalog 再补测试，也不得通过修改旧断言来掩盖覆盖退化。

## 12. 真实用户旅程

至少覆盖：

1. `熟米饭 + 鸡蛋 + 白菜`，pantry：一锅完整覆盖，2 人份约为熟饭 360 克、鸡蛋 130 克、白菜 220 克、水 650 克；
2. `剩米饭 + 鸡腿肉 + 土豆`，pantry：一锅完整覆盖，保留“鸡腿肉”原始部位，2 人份约为鸡肉 180 克、土豆 160 克；
3. `熟米饭 + 鸡蛋`，pantry：不得退化为只使用熟米饭；
4. `白菜 + 鸡蛋`，pantry：允许把熟米饭列为基础主食补充，并完整覆盖两项用户食材；
5. `熟米饭 + 鸡蛋 + 白菜 + 土豆`，pantry：四项全部进入有顺序的一锅；
6. `熟米饭 + 鸡蛋 + 鸡腿肉`，pantry：不得把两种蛋白强塞同一 protein 槽；
7. `大米 + 白菜 + 鸡蛋`：`broth-rice-pot` 不得把生米当熟饭；
8. `熟米饭 + 西兰花`：本模板不越界接受十字花科；Planner 可选择其他可靠模板或明确未规划；
9. `熟米饭 + 老豆腐 + 白菜`：本模板不越界吸收豆腐；
10. `熟米饭 + 鸡蛋 + 白菜`，recommend：允许与其他计划比较，诚实显示未使用项；
11. 同一输入换一换：返回真正不同 plan，或 `no_alternative_plan`；
12. 模型新增香菇、把鸡胸改鸡腿、删除白菜或漏掉熟制终点：全部返回 `model_contract_violation`；
13. 模板或比例版本变化后提交旧 token：返回 `stale_plan`；
14. 本地代理与 Worker 对同一请求返回相同计划语义；
15. `quick` 请求不得选择该 40 分钟上限模板。

数值断言以机器规则计算并按 5 克取整；不得在测试中复制一套独立计算器，让测试与实现同时犯同一个错误。

## 13. 验收门槛

实现完成的最低证据：

- 新增真实旅程全部通过；
- 现有全部 Node 测试通过；
- `node tools/check-recipes.mjs` 通过；
- `node tools/run-pantry-planner-v2-journeys.mjs` 通过；
- `python3 -m py_compile ai_proxy.py` 通过；
- `node tools/build-dist.mjs --out-dir <temp> --build-id <ascii-id>` 通过；
- 构建一致性与 Worker/代理 parity 通过；
- recipe 总数仍为 72；
- regional research 原始资产不进入 `dist/`；
- PR 保持 Draft；
- 不部署 Preview 或 production，不合并 PR。

门禁全绿只证明工程契约成立，不等于真实厨房验证或 production 发布批准。

## 14. 明确非目标

本轮不新增 recipe、地域菜名、template、账号、用户画像、营养追踪、多 Agent 或新的前端功能；不顺手修正其他 active template 的通用蛋白份量历史债务；不启动东北锅边玉米主食的数值校准，也不部署任何环境。
