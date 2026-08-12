# Source-backed formal calibration R1：排骨焖饭

日期：2026-08-11  
范围：`source-sichuan-pork-ribs-rice` 这一条 `calibration_preview` 变体；不改变正式 Planner 基础库的 72 条计数。

## 这次实际闭合的内容

- 原始来源：Woks of Love 的 [One-Pot Rice Cooker Pork Ribs and Rice](https://woksoflove.com/one-pot-rice-cooker-pork-ribs-and-rice/)。来源页给出 3 人份、1 US cup 米、300g 排骨、30g 玉米、30g 胡萝卜和 300mL 水，并描述了外锅处理排骨后进入电饭煲的流程。
- 项目校准变体：固定为 2 人份；每人 100g 生米、100g 排骨、20g 玉米、20g 胡萝卜，加水按 1.5 倍生米合同起步。项目换算和程序参数是显式校准值，不冒充来源原方。
- 已通过：canonical taxonomy、ratio DSL、液体契约、执行步骤、安全终点、营养 carb+protein 角色、collection tracking/reverse mapping。
- 预览步骤：洗米；锅外焯/煎排骨；准备玉米和胡萝卜；全部装入内胆；闭盖标准煮饭；完成后闭盖静置；确认米饭软熟和排骨全熟；翻松出锅。

## 仍然没有上线的原因

这条目前是 `calibration_preview` / `calibration_ready`，不是 `preview_ready`、`runtime_ready` 或正式 `recipe-library.json` 菜谱。原因是还缺：

1. 至少一次真实厨房试做记录（成品米饭软硬、排骨熟度、液体是否足够、锅巴/溢锅情况）。
2. 至少一条真实 Planner 旅程覆盖该变体，并验证用户输入缺料、忌口和份数边界。
3. 目前只保留来源明确支持的外锅预处理边界，不外推到所有电饭煲型号。

因此，这批是把一条 923 条来源资产推进到“可审、可校准、可追踪”的下一层，不是把它伪装成已批准生产菜谱。
