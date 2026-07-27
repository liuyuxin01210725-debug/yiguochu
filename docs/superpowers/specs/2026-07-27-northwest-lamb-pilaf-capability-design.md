# 西北羊腿肉抓饭能力设计

## 1. 背景

全国地域框架当前覆盖 13 个地域块、34 个省级节点和 12 个技法家族。西北有 3 道现有生产菜谱，Planner 完整单锅覆盖为 1/3。

`xinjiang-lamb-pilaf` 的核心食材是羊腿肉、洋葱、胡萝卜和大米。后三项已经能进入 `savory-mixed-rice-pot`，羊腿肉仍未识别，所以 pantry 请求只能覆盖 3/4。

现有西北研究账本已支持羊肉、胡萝卜、洋葱、生米的分阶段抓饭结构，也有羊肉彻底熟制和防止交叉污染的安全原则；但它不支持把所有羊肉部位视为等价，也不支持自由果干、坚果槽或从文化来源发明项目克数。

## 2. 选定方案

采用“羊腿肉窄能力”方案：

1. 新增受控的 `lamb-leg` 食材身份；
2. 让现有 `savory-mixed-rice-pot` 接纳这个明确部位；
3. 复用现有生米咸香饭锅 Ratio DSL，不新增抓饭专用猜测数值；
4. 增加羊肉专用熟制终点和模型越界校验；
5. 恢复现有新疆羊肉抓饭的 4/4 单锅覆盖，不新增 recipe 或 template。

不同时恢复陕北红枣豇豆饭：其普通大米适配、红枣用量和液体边界仍未证实。也不先做小米、青稞和杂粮统一比例，因为不同谷物必须分别处理吸水、浸泡和熟制状态。

## 3. 成功条件

完成后必须同时成立：

1. “羊腿肉”和“去骨羊腿肉”归入同一 `lamb-leg` identity，同时保留 raw 原词和 `leg` 部位；
2. pantry/normal 输入羊腿肉、洋葱、胡萝卜、大米，返回 4/4 单锅完整计划；
3. 计划使用 `savory-mixed-rice-pot`，不借用旧 recipe selector 决定组合；
4. 羊腿肉进入 protein，洋葱进入 aromatic，胡萝卜进入 slow_vegetable，大米进入 staple；
5. 使用现有 `savory-mixed-rice-liquid-v1`；
6. 羊腿肉携带 `raw_lamb` 风险和 `lamb_fully_cooked` 终点；
7. 忌口“羊肉”能拦截羊腿肉及受控别名；
8. quick 模式不选择最长 50 分钟的模板；
9. `xinjiang-lamb-pilaf` 不再是 taxonomy gap；
10. 西北完整单锅覆盖由 1/3 提升为 2/3；
11. 地域映射仍为 `northwest` / `CN-XJ`，不增加其他省份或排他性起源声明；
12. recipe 保持 72 道，template 保持 16 个且激活数量不变。

## 4. 非目标

本轮不做：

- 不新增固定菜谱、地域菜名变体或 template；
- 不把“羊肉”“羊排”“羊腩”“羊肉末”“羊肩肉”或“羊肉片”静默当成羊腿肉；
- 不从 recipe substitution slot 自动扩大 Planner template 兼容面；
- 不增加葡萄干、果干、坚果或自由羊肉槽；
- 不恢复陕北红枣豇豆饭或小米、青稞、杂粮路线；
- 不修改 recommend/pantry 成功标准、多锅、换一换或历史策略；
- 不增加账号、用户画像、营养追踪、自然语言场景或多 Agent 产品能力；
- 不调用真实 DeepSeek，不部署，不合并 Draft PR #1。

## 5. 食材身份

新增机器数据：

```json
{
  "canonical_id": "lamb-leg",
  "display_name": "羊腿肉",
  "canonical_name": "羊肉",
  "aliases": ["去骨羊腿肉"],
  "input_scope": "pantry_input",
  "category": "lamb",
  "states": ["raw"],
  "shapes_or_cuts": ["leg"],
  "cook_speed": "medium",
  "moisture_release": "low",
  "texture_behavior": {
    "behavior_code": "tender_when_cooked_through",
    "best_method_codes": ["braise", "simmer"],
    "failure_mode_codes": ["tough_when_overcooked"]
  },
  "cooking_risk": {
    "risk_code": "raw_lamb",
    "required_endpoint_codes": ["lamb_fully_cooked"]
  },
  "compatible_slot_codes": ["generic_lamb"],
  "incompatible_slot_codes": ["ground_meat_required", "rib_required", "brisket_required"]
}
```

不新增泛化 `lamb-generic`。只输入“羊肉”时，Planner 无法知道是腿肉、肩肉、肉末、腩块还是排骨，必须进入 unplanned，不得猜测。

Worker、`ai_proxy.py` 和前端的 `ALLERGEN_GROUPS` 同步增加：

```json
"羊肉": ["羊腿肉", "去骨羊腿肉"]
```

只有忌口词等于类别名“羊肉”时扩展到组成员；忌口“羊腿肉”不反向扩展到未纳入的其他部位。三端 parity 测试必须锁定表和行为。

## 6. Template 变化

`savory-mixed-rice-pot` 只做以下变化：

1. protein 接受 category `lamb`；
2. ingredient category 中加入 `lamb`；
3. lamb 形态只允许 `leg`，拒绝 ground、rib、brisket 和未知形态；
4. safety endpoint 增加 `lamb` 到 `lamb_fully_cooked`；
5. evidence recipe 增加 `xinjiang-lamb-pilaf`。

不改变 slot 数量、容量上限、cooking order、time range、supported intents 或激活状态。

步骤顺序仍为：先处理洋葱，再预处理羊腿肉，再加胡萝卜，然后加入大米和已测量液体，最后检查羊肉与米饭终点。

## 7. Ratio DSL 边界

本轮不新增 Ratio rule，也不改 `savory-mixed-rice-liquid-v1` 的数值和操作顺序。

两人份目标输入应稳定编译为：大米 200g、羊腿肉 200g、胡萝卜 240g、洋葱 80g、保留液体 270g、食用油 10g、盐 3g。

这只是现有通用生米咸香饭锅规则的确定性结果，不得宣称为新疆传统克数。现有 recipe 的 135–150g 可用焖煮液体记录只用于确认默认 1.35 落在已记录范围内，不用于重写通用规则的完整范围。

## 8. 安全与模型合同

有限词表增加 `raw_lamb`、`lamb_fully_cooked` 和适用 category `lamb`。熟制证据必须绑定羊腿肉动作窗口，未来义务、只说表面变色、只说锅内沸腾或只描述米饭熟透都不算羊肉终点。

DeepSeek 只能表达已锁定计划，不能：

- 把羊腿肉换成牛肉、羊肩肉、羊排、羊腩或羊肉末；
- 删除四项用户食材；
- 新增葡萄干、坚果、果干或其他主要食材；
- 修改克数、液体或份数；
- 省略羊肉熟制终点；
- 宣称这是新疆传统配方克数的精确复刻。

任一越界返回 `model_contract_violation`，不自动重试。

## 9. Planner 响应

成功结果必须包含：

- `plan_kind:"single_pot"`；
- `template_id:"savory-mixed-rice-pot"`；
- `coverage_ratio:1`；
- 四项去重的 `planned_must_use`；
- 空的 `unplanned_must_use`；
- 结构化 slot assignment、克数、液体和 ratio trace；
- `lamb_fully_cooked`、`rice_tender` 及适用蔬菜终点。

`/plan-meal` 保持 0 次 DeepSeek；`/generate-plan` 每次最多 1 次且失败不自动重试。笼统羊肉、未支持部位或忌口冲突时，pantry 不得返回 complete，也不得调用 DeepSeek。

## 10. 地域与证据语义

`xinjiang-lamb-pilaf` 继续保持：

- `regional_scope:"province_specific"`；
- region `northwest`；
- province `CN-XJ`；
- primary family `raw-rice-braise`；
- `auto_approved`，不得对外称为人工批准。

恢复覆盖只证明该现有 recipe core 可被当前通用 template 安全规划，不证明所有抓饭变体、所有羊肉部位或传统工艺都已覆盖。

## 11. 版本

实现时原子递增：

- taxonomy：`taxonomy-v1-20260727-r6` 到 `taxonomy-v1-20260727-r7`；
- template：`templates-v2-20260727-r7` 到 `templates-v2-20260727-r8`。

Ratio catalog 保持 `ratio-rules-v1-20260727-r4`。旧 plan token 因 taxonomy/template 版本变化自然返回 `stale_plan`，不得静默注入新能力。

Worker validator、本地 Python bridge、健康检查测试、构建依赖和部署文档必须同步到同一版本闭包。

## 12. 真实旅程

公共旅程从 100 条增加到 108 条，新增 8 条 `regional_capability`：

1. 羊腿肉、洋葱、胡萝卜、大米，pantry/normal，4/4 完整单锅；
2. 去骨羊腿肉别名保持 raw 与 leg 部位；
3. 笼统羊肉不得猜测部位；
4. 羊肩肉不得借 recipe substitution 静默进入 template；
5. 忌口羊肉时返回 allergen conflict 并暂停生成；
6. quick 不得选择该模板；
7. recommend 输入四项加西兰花，选择合理组合并诚实解释 unused；
8. 模型把羊腿肉换成羊肩肉或新增葡萄干，返回 contract violation。

还需锁定 taxonomy、Worker/Python parity、三端忌口 parity、旧 token stale 和地域映射不变。

## 13. 成本控制

- `/plan-meal`：0 次 DeepSeek；
- 规划失败、忌口冲突、quick 排除和 stale plan：0 次；
- `/generate-plan`：确认有效计划后最多 1 次；
- 模型越界或上游失败：不自动重试；
- 测试只使用本地 fake upstream。

## 14. 验收门禁

实现完成前必须同时通过：

1. taxonomy、template、忌口 parity、Planner、Worker/Python parity 和生成合同聚焦测试；
2. 108/108 公共旅程；
3. 全部 Node 测试；
4. `node tools/check-foods.mjs`；
5. `node tools/check-recipes.mjs`；
6. `python3 -m py_compile ai_proxy.py`；
7. canonical dist 构建和隔离测试；
8. 菜谱仍为 72，template 仍为 16（10 active + 6 planned）；
9. Draft PR #1 仍为 Draft、未合并、未部署；
10. 不声称真实 DeepSeek live、人工试吃或人工菜谱批准。

## 15. 后续顺序

本轮通过后，西北剩余现有缺口是陕北红枣豇豆饭。下一轮应先补软谷物与普通大米适配边界、红枣状态和液体 Ratio DSL 的证据，而不是只增加红枣 alias。

其后优先级为：

1. 晋蒙/青藏小米、青稞和杂粮的独立 Ratio DSL；
2. 中原/西北面片汤的面片身份与煮制液体边界；
3. 东北锅边主食在真人 2/3/4 人份校准完成后进入 M2。
