# C34 Kitchen Pilot Readiness（2026-08-14）

## 结论

C34 尚未开始真实试做。本轮没有新增厨房观察记录、照片、家庭标识、设备记录或生产批准；`tools/data/kitchen-observations.v1.json` 仍为空数组。任何 Coverage dry-run、浏览器点击、Planner 返回和来源页浏览都不计作厨房观察。

## 当前阻断

- Kitchen Trial Catalog 共 34 个候选，严格 `trial_eligible=0`。
- 34 个候选均缺少结构化 `equipment_contract`（品牌/型号/容量/程序/器具边界）；部分候选另有安全合同缺口。
- Runtime catalog 72 条中 `planner_runtime_eligible=0`、`production_approved=0`、`kitchen_observed=0`。
- 没有用户提供或核验过的真实设备 manifest，因此不能选择首批 3–5 道菜开展试做。

## 允许开始 Pilot 01 的前置

每条候选必须在 Trial Catalog 中重新生成并满足：固定批量和食材量、液体或水位、设备品牌/型号/容量/程序、总时长、结构化步骤、可解析的 required safety endpoint、保留器具边界，以及四类 Trial Contract Hash。实际设备 manifest 必须与这些字段逐项匹配。

每次真实试做还必须提交完整 `kitchen-observation.v1`：称量、液体、水位、设备和程序、时间线、步骤偏差、安全测量、口感、份量、旅程回归、证据锚点和独立评审。Hash 或版本不一致时，Observation 与 Promotion Gate 必须 fail closed。

## 下一步

1. 由真实操作者提供可核验的设备 manifest（品牌、型号、容量、程序、地区/电压）。
2. 只为与设备完全匹配的候选补齐结构化 `equipment_contract`，重新生成 Trial Catalog。
3. 仍保持 `production_approved=false`，先完成 3–5 次真实试做和独立复核。

在上述输入出现前，不创建占位 observation，不把 Shadow Coverage 或自动化测试改写成 `kitchen_observed`，也不部署 production。
