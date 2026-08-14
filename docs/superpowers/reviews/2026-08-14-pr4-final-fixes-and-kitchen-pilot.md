# PR #4 最终工程收口与首批厨房 Pilot 计划

## 目标与边界

PR #4 的工程结构与可审查性已通过，但这不等于 923 条来源卡已经成为可执行菜谱，也不等于 72 条正式索引已经获得生产权限。本阶段只闭合 Runtime、Trial、Coverage 和私有厨房证据的门禁；在真实观察记录产生前，不写入 `kitchen-observations.v1.json`，不提升 `production_approved`，不部署 production `main`。

当前基线应持续如实显示：

| 层 | 当前含义 |
| --- | --- |
| Source catalog | 923 条来源/研究记录，不是生产合同 |
| Formal recipe index | 72 条正式索引 |
| Planner runtime eligible | 0 |
| Trial candidates | 仅经过合同哈希和预览门禁的候选，仍不是正式运行菜谱 |
| Coverage | 只能区分 catalog-enforced、shadow、not_observed；注册表不是执行证据 |
| Kitchen observations | 0；不得用浏览器、脚本或推演结果代替真实厨房记录 |

## C29–C34 交付顺序

### C29：Runtime 页面与私有数据边界

1. Production 页面只显示 `planner_runtime_eligible === true && production_approved === true`。
2. Runtime Preview 页面只显示 `planner_runtime_eligible === true && production_approved === false`，并明确标注“尚未 Production Approved”。
3. Runtime 空状态只返回 Runtime 路由或首页，不链接 `/source-recipes/` 等 Research 路由。
4. `kitchen-observations.v1.json` 永远不进入 Runtime、Research、Calibration 或 Preview Web build。Web 端如需状态，只能使用去标识化聚合统计。

### C30：Candidate-level Runtime Authority

Authority 不能只检查“总数大于零”。每个候选都必须同时对账：

- recipe ID；
- variant ID；
- runtime catalog version；
- source / execution / formalization / formal review contract hash。

该对账覆盖首次规划、换一换、计划恢复、重试/重新生成和缓存恢复。`shadow` 只用于校准/预览，不能写成正式 Runtime 成功；`catalog-enforced` 遇到缺失、未知 ID 或哈希漂移必须 fail closed。

### C31：Trial Contract Hash 与严格 Eligibility

每条试做候选必须保存并校验 source、execution、formalization、formal review 四类合同哈希，以及 trial catalog version。Observation 与 Trial Contract 不一致时返回 `trial_contract_changed` / `observation_requires_revalidation`，旧观察不得支持新合同。

Trial Eligibility 至少要求：固定批量、食材量、液体/水位、器具品牌/型号/程序、时间、步骤、安全端点、器具边界和正式评审行均可解析；缺一项即保持 `trial_eligible=false`。候选数量变化是审计结果，不为保持旧数字而放宽门槛。

### C32：Coverage 执行

建立两套可复现结果：

1. **Catalog-enforced**：当前 eligible 为 0 时，每场景结构化返回 `runtime_catalog_empty` / `no_candidate`，不能标记 passed。
2. **Shadow Preview**：可记录第一候选、全部候选、实际使用/未使用食材、理由、数量/液体/安全合同和 authority 状态，但 `observed=false`、`result_status=not_observed`，不得授权生产。

真实 Worker、浏览器或厨房观察证据要与 dry-run/registry 分开保存。

### C33：结构化安全与器具合同

未来任何条目从 0 进入 Runtime 前，必须同时通过结构化合同：

- `safety_endpoints`：具名 endpoint ID 和 required 标记；
- `equipment_contract`：器具类型、品牌/系列、型号、容量、程序和边界；
- `quantity_contract`：每个核心食材的可核对用量；
- `liquid_contract`：液体量或明确水位线；
- `time_contract`：总时长或可验证程序时长；
- `step_contract`：具名动作步骤；
- `action_profile_ref`：与动作档案 ID/版本精确匹配；
- source contract：保留可追溯的 HTTPS 来源，不因无法映射 923 source ID 而丢失。

自由文本 `safety_rules`、来源摘要、总数门禁和浏览器截图都不能替代这些字段。

### C34：首批真实 Kitchen Pilot

完成 C29–C33 后，才选择 3–5 条做 Pilot 01。选择顺序：

1. Source Contract 完整；
2. 固定批量、液体/水位、时间和步骤完整；
3. 真实设备与 Trial Contract 的品牌、型号、容量、程序一致；
4. 食材常见，安全端点可实际测量；
5. 没有必须另锅、专用蒸篮或无法复现的隐含预处理。

试做前必须先登记设备清单（品牌、型号、容量、电压/地区、程序和配件）。在设备清单缺失时只能生成待选择清单，不能假定 Tiger、Panasonic、象印或大同就是用户拥有的设备。

每次观察使用 `kitchen-observation.v1`，记录称量、液体/水位、器具/程序、时间、步骤偏差、安全终点、口感、份量、反馈、旅程回归和证据锚点。第一轮的目的只是发现合同偏差和复现问题；即使某条达到 `kitchen_observed`，仍保持 `production_approved=false`，直到独立正式评审完成。

## 停止条件

- 任何合同哈希漂移：停止晋升，要求重新试做；
- 任一安全端点无法实际测量：停止试做/保持 blocked；
- 设备型号或程序不匹配：不记录为该 Trial Contract 的观察；
- 私有观察数据进入 Web build：停止部署并清除泄漏路径；
- 任何测试、`node tools/check-recipes.mjs`、source-backed catalog 门禁或 Planner journeys 失败：不提交、不部署。

## 当前决定

PR #4 保持 Draft，作为 PR #3 的正式替代。C29–C33 完成并验证后，可启动 3–5 条真实 Kitchen Pilot；Phase 1 Gate、Phase 2 扩展、Planner V3 和 production `main` 仍保持关闭。
