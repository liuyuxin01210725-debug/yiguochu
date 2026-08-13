# M1.4 Kitchen Gate 审计与观察契约

日期：2026-08-13  
范围：只读审计现有 source execution cards、Runtime Catalog、Coverage Matrix、rice-meal journeys、recipe-runtime journeys 与 calibration 记录。本文件不修改主 JSON、Worker 或前端，也不把浏览器旅程当成真实下厨证据。

## 1. 当前基线

本次审计使用以下结构化资产：

| 资产 | 版本/现状 | 对厨房门的含义 |
| --- | --- | --- |
| source catalog | `source-backed-one-pot-v1-20260812-global-r297` | 923 条来源研究卡；来源身份和来源事实仍是研究层真源。 |
| execution library | `source-backed-execution-v1-20260811-r1` | 923 张执行卡，其中 138 张 `source_complete`；`source_complete` 仍只是可送审/预览候选。 |
| formalization ledger | `source-backed-formalization-v1-20260811-r2` | 34 条 `preview_candidate`、889 条阻断；923 条均有执行记录，但 1 条安全阻断。 |
| Runtime Catalog | `source-backed-runtime-v1-20260813-m1` | 923 条；34 `preview_only`、888 `research_only`、1 `blocked`、`kitchen_observed=0`。 |
| Coverage Matrix | `source-backed-coverage-matrix-v1-20260813-m1` | 923 行；`kitchen.pending=922`、`kitchen.blocked=1`；已有的 journey 证据是 shadow evidence，不是厨房观察。 |
| rice-meal catalog / journeys | catalog `rice-meal-catalog-v1-20260802-r7`；54 条菜饭旅程 | 目前 calibration/preview 变体可以走确定性页面旅程；页面能完成不代表有人按配方做完。 |
| recipe-runtime journeys | `recipe-runtime-task7-synthetic-journeys`；17 条 | 只证明运行时输入、匹配和输出合同；不得填充 `kitchen_observed`。 |

已有 calibration 记录要求实厨至少记录“实际食材与称重、品牌型号、是否按步骤、米饭口感、蛋白熟制、蔬菜口感、味道、是否完成主餐、是否愿意再做、原话/照片、处理”。这一组字段是本门的最小人工记录起点；本审计把它扩展为可校验的结构化观察契约。

## 2. `kitchen-observation.v1` 建议 schema

每次真实试做一条记录；不要把同一道菜的多次试做覆盖在同一条 JSON 里。照片、测温计读数和用户原话应以独立证据引用保存，不能只写一句“成功”。字段中的 `source_*` 是来源合同，`observed_*` 是本次真实测量，两者必须分列。

```json
{
  "schema_version": "kitchen-observation.v1",
  "observation_id": "ko-20260813-<recipe-or-variant>-<attempt>",
  "recorded_at": "2026-08-13T00:00:00+08:00",
  "observer": {"operator_id": "", "household_id": "", "role": "cook|reviewer"},
  "recipe": {
    "recipe_id": "",
    "variant_id": "",
    "canonical_name": "",
    "catalog_version": "",
    "runtime_catalog_ref": "",
    "execution_card_ref": "",
    "source_status_at_attempt": "",
    "formalization_status_at_attempt": ""
  },
  "claim_scope": {"servings_claimed": 2, "servings_observed": 2, "supported_batch_only": true},
  "ingredients": [],
  "liquid": {},
  "equipment": {},
  "timeline": {},
  "process_adherence": {},
  "safety_endpoints": [],
  "sensory_result": {},
  "feedback": {},
  "journey_regression": {},
  "disposition": {},
  "evidence_refs": []
}
```

### 2.1 必填字段定义

#### A. 身份、批量与证据锚点

- `recipe_id`、`variant_id`、`canonical_name`：必须能回指唯一 source execution card；不能只填展示名。
- `catalog_version`、`runtime_catalog_ref`、`execution_card_ref`：锁定本次试做所依据的构建，避免之后改比例后仍引用旧结果。
- `servings_claimed`、`servings_observed`、`supported_batch_only`：若只观察了固定批量，必须把支持范围锁在该批量，不得据一次结果宣称任意份数可缩放。
- `evidence_refs`：至少能引用称重记录、设备/程序照片、时间记录、安全测量和成品/反馈记录；敏感照片可只保留受控 hash 或本地凭证路径。

#### B. 食材称量（`ingredients[]`）

每项至少记录：

```json
{
  "canonical_id": "",
  "raw_label": "",
  "state": "raw|soaked|cooked|canned|drained|other",
  "source_amount": {"value": 0, "unit": "g"},
  "observed_amount": {"value": 0, "unit": "g"},
  "measurement_method": "scale|count|volume|waterline",
  "deviation_reason": "",
  "used": true,
  "substitution": null
}
```

必须逐项称量核心食材、米、油、糖、盐、酱料和高含水配料；“一把”“适量”只能作为来源原文提示，不能在观察记录中伪装为克数。发生替换时记录 `replaces`、实际食材、批准槽位和原因；未批准替换一律记为失败或回退，不得默默改配方。

#### C. 液体与水位（`liquid`）

- `source_contract`：来源规定的水/汤/奶/泡发液类型和量；水位线要保留机型、刻度和米种。
- `observed_added_amount`、`observed_retained_liquid`、`observed_absorbed_or_remaining`：分别记录实际加入、成品剩余和是否溢出/不足。
- `waterline`：`appliance_model`、`scale`、`mark`；来源只有水位线时不得换算成通用毫升。
- `liquid_phase_split`：先炒/焯锅外液体、锅内液体、压力锅泄压后的液体分别记；不得把多个阶段合并成一个“总水量”。
- `liquid_deviation`：如需补水、减水或回添，记录发生步骤、克数和触发观察。

#### D. 器具与程序（`equipment`）

记录 `brand`、`model`、`capacity`、`vessel_type`、`program`、`pressure_or_heat_mode`、`accessories`、`voltage_or_region_if_relevant` 和 `max_fill_or_waterline_limit`。普通电饭煲、指定型号电气锅、压力锅、砂锅和普通锅不得互相代替；没有同器具证据就只能把结果标为该器具/该程序的观察。

#### E. 时间线（`timeline`）

至少记录 `prep_started_at`、`cook_started_at`、`program_elapsed_minutes`、`pressure_release_or_jump_at`、`rest_minutes`、`finish_at`、`manual_intervention_at`。来源总时长、机器显示时间、实际总耗时三者分列；“程序结束”不是“安全终点已达”。

#### F. 步骤遵循（`process_adherence`）

每个步骤有 `step`、`completed`、`observed_at`、`deviation`、`deviation_reason`、`external_vessel_action`。必须显式标记锅外预处理、回锅、另锅炒蛋、完全泄压后开盖等阶段；任何为“让它成功”而临时增加的动作都要进入记录，不能回写成原配方步骤。

#### G. 安全终点（`safety_endpoints[]`）

```json
{
  "ingredient_or_hazard": "鸡腿肉",
  "required_endpoint": {"kind": "internal_temperature_c", "minimum": 74},
  "observed": {"value": 75, "unit": "C", "instrument_id": "", "location": "最厚处", "measured_at": ""},
  "result": "pass|fail|not_applicable",
  "evidence_ref": ""
}
```

禽肉、猪肉、牛羊肉、鱼贝、蛋、豆类/高风险腌腊等必须有与食材状态匹配的终点；视觉终点要写清楚“什么外观、在哪里看”。温度计缺失时不能把分钟数当作温度证据。一次 `fail` 即暂停该变体，不能用另一道菜成功或自动测试通过抵消。

#### H. 成品口感与主餐完成（`sensory_result`）

固定枚举与可选原话并存：

- 米饭：`夹生|偏硬|合适|偏软|过湿|糊底`；
- 蛋白：`不足|合适|过老|不适用`；
- 蔬菜/菌菇/根菜：`不足|合适|过软|不适用`；
- 液体/锅底：`干|合适|汤多|溢出|焦糊`；
- 味道：`偏淡|合适|偏咸|油重|其他`；
- `portion_complete`：是否形成一顿主餐；`yield_observed`：实际成品量/份数；`photos_or_notes`：证据引用。

#### I. 用户反馈（`feedback`）

记录 `instruction_clarity`、`missing_ingredient_or_tool`、`effort_level`、`would_repeat`、`quote`、`photo_refs`、`reported_safety_or_discomfort`。原话不可由审查者改写成分数；如果用户需要解释才能完成，应记为可用但需解释，不能直接算通过。

#### J. 真实旅程回归（`journey_regression`）

至少关联一个真实 Planner journey，并按适用性记录：`journey_id`、`mode`、`intent`、`servings`、`input_items`、`dislikes_or_allergens`、`expected_plan_status`、`actual_plan_status`、`used_items`、`unused_items_and_reason`、`substitution_result`、`failure_code`、`browser_evidence_ref`。浏览器点击、Node 测试或编译器结果只能填 `browser_evidence_ref`，不能替代 `kitchen_observation`。

## 3. 状态与晋升门

### `kitchen_observed`

一条记录进入 `kitchen_observed` 前，至少满足：

1. 在来源指定的同一器具/程序和声明批量下完成真实下厨；称量、液体、水位、时间线、步骤偏差和成品状态齐全。
2. 所有适用安全终点均有实测或明确视觉证据并通过；安全失败、缺测或设备不匹配保持阻断。
3. 记录至少一个真实 Planner 旅程；若有过敏、禁忌或替换合同，须同步记录相应成功或拒绝结果。
4. 任何改动不被静默吸收到配方；若结果依赖临时补水、延时或改食材，状态为 `repeat_required`/`fail_quality`，不直接晋升。
5. 审查者能用证据重放本次观察，且 `evidence_refs` 不为空。

### `production_approved`

`production_approved` 不是“执行卡完整”或“自动门全绿”的别名。建议只有以下条件全部满足才允许：

1. 来源合同、taxonomy、Ratio DSL、营养、安全、器具边界和替换槽位全部闭合；任何估算值逐字段标记，不能把未查证数字当权威值。
2. Runtime Catalog 状态为 `preview_only` 以上的可晋升候选，且 formalization ledger、Coverage Matrix 和正式 Planner 引用完全一致；不能直接从 923 条研究卡跳到生产。
3. 至少一次完整 `kitchen_observed`；高风险（禽肉、猪肉、海鲜、蛋、压力锅或需锅外/回锅）的候选建议在不同日期或由第二位操作者完成独立复测。未复测时保持预览范围，不扩大份数或器具范围。
4. 声明的每个支持份数/设备范围都有观察证据；没有证据的范围从产品合同中删除，而不是用比例猜测补齐。
5. 真实 Planner 旅程覆盖：正常输入、缺料/未使用说明、过敏/禁忌拒绝、批准替换和至少一个失败回归；“必须使用”路径必须 100% 兑现，否则结构化拒绝。
6. 没有安全失败、未解释的质量失败、隐藏必需工具或关键步骤歧义；用户可依页面完成并明确给出 `approve_for_production=true`。用户批准记录应带版本和观察证据引用。
7. 变更后重新构建并通过 `node tools/check-recipes.mjs`、相关 journey 套件、全量测试和人工审阅；自动通过只能作为必要条件，不能取代厨房记录。

任何一项不满足，都只能保留 `preview_only`、`kitchen_observed`、`repeat_required` 或 `blocked`，不得改成 `production_approved`。

## 4. 首批三条建议试做

按风险递增安排，先验证容易复现的电锅流程，再验证外锅预处理，最后验证压力锅与禽肉终点。三条都不是当前已批准生产菜谱。

| 顺序 | recipe / calibration variant | 当前证据 | 首轮必须回答的问题 | 选择理由 |
| --- | --- | --- | --- | --- |
| 1 | `taiwan-tatung-cabbage-rice` / `source-taiwan-tatung-cabbage-rice`（高丽菜饭） | execution `source_complete`、formal `preview_candidate`；大同电锅固定 2 人份，内锅 2 杯水/外锅 1 杯水；猪肉 74°C、虾米视觉终点；已有 `RM-347-source-taiwan-tatung-cabbage-rice` shadow journey。 | 预炒后的含水高丽菜是否让米饭夹生/过湿；内外锅液体是否按记录可重现；猪肉与虾米终点是否同时达到；跳起后焖 10 分钟是否足够。 | 有最完整的首轮观察合同和现成旅程入口，风险可控；先用它建立观察记录模板，而不是直接晋升。 |
| 2 | `sichuan-rice-cooker-pork-ribs-rice` / `source-sichuan-pork-ribs-rice`（排骨焖饭） | execution `source_complete`、source status `recipe_fact_checked`、formal `preview_candidate`；已有 R1 校准文档，明确 2 人份项目起点（生米/排骨各 100g/人、1.5 倍水）和锅外排骨处理；排骨 74°C。 | 1.5 倍水在实际米种/锅型下是否足够；锅外焯/煎排骨后回锅是否改变液体；排骨熟度、米饭软硬、锅底焦糊和最终汤汁是否可接受；2 人份是否可完整做成主餐。 | 已有独立校准说明，能验证“来源量 → 项目校准量 → 实际成品”的边界；风险高于高丽菜饭，适合第二轮，不把项目换算冒充来源事实。 |
| 3 | `panasonic-khao-man-gai-nf-ac1000` / `source-panasonic-khao-man-gai`（Panasonic NF-AC1000 海南鸡饭） | execution `source_complete`、formal `preview_candidate`；明确 NF-AC1000 中压 8 分钟、来源 4 人批量与鸡腿肉 74°C 终点；项目 calibration batch 保留指定机型边界。 | 压力完全释放后开盖时鸡腿最厚处是否达到 74°C；米水/鸡油对米饭软硬的影响；压力锅容量与铺料高度是否安全；中压程序结束到装盘的静置和回温是否需要保留。 | 用一条指定压力锅/禽肉候选验证最容易被错误外推的边界；若机型或程序不一致，必须拒绝而不是转写成“普通电饭煲版”。 |

三条完成后才决定是否扩到其他机型或份数。任一条出现安全失败、设备边界不符或必须靠未记录的临时补救才能完成，先修正该变体并保持阻断，不以另外两条成功抵消。

## 5. 审计结论

当前厨房门是明确的真实缺口：923 条 Runtime Catalog 记录中 `kitchen_observed=0`，Coverage Matrix 仍为 922 pending/1 blocked。现有 17 条 recipe-runtime journeys、54 条 rice-meal journeys、浏览器 smoke 和 138/138 等自动门结果，只能证明软件路径或结构化契约，不能把任何 source card 或 calibration preview 变成 `production_approved`。

本审计建议先落地 `kitchen-observation.v1` 的记录表和三条试做，不改生产状态、不扩展 72 道正式 Planner 基线；观察证据、真实反馈和用户批准回填后，再由独立门禁决定是否晋升。
