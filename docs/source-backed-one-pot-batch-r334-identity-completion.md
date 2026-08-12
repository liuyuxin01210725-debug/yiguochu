# r334 身份-only 空流程卡补强

本批继续补研究页面，不新增 canonical 菜谱，也不把身份档案晋升为
`recipe_fact_checked` 或 `executable`。

- 基线仍为 923 条；补的是最后 9 条 `cooking_sequence: []` 身份线索。
- 8 条得到菜名针对性的估算起步卡：糯米蒸饭、豆豉肉丁蒸饭、油焖肉饭、羊拐抓饭、豌豆肉抓饭、竹筒饭、傣族蒸米饭、鹰嘴豆抓饭。
- 1 条河豚八煲饭改成 `blocked_safety` 研究卡：显示身份、阻断原因和记录步骤，但不提供购买、去毒、分切、加热或家庭电饭煲换算步骤。
- 所有新数字和步骤均为 `estimated` 研究起步信息；canonical 的 `fixed_batch`、`liquid_contract`、`time_contract`、`cooking_sequence` 保持原值（包括 `null`/空数组）。

验证：`tools/tests/source-backed-one-pot-research-draft-batch-r334.test.mjs`。
