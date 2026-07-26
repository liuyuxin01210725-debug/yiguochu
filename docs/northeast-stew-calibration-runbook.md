<!-- Generated file: do not edit directly. -->

# 东北锅边玉米饼 2/3/4 人份实厨校准执行表

> 本表从 `tools/data/northeast-stew-research.v1.json` 的权威 `calibration_cases` 生成。不得填写生产默认值；代码、AI 或公开来源不得把空白项补成结果。

**执行状态：`blocked_by_safety_endpoints`。排骨与豆角的权威熟制终点仍为 `unresearched`；在两项安全终点完成独立研究、审核并写入受控规则前，禁止开始实厨校准。此表当前只定义未来记录字段，不是烹饪指令。**

每次仅在同一玉米面、锅具和工艺条件下记录一个份数。一次只改变一个变量（例如只改变和面水）；先在执行记录中补充玉米面品牌/粒度和热水温度，再记录锅径、锅深、盖合与贴饼时液位。和面水、炖锅水和贴后时间必须分开称量/计时。任何失败都保持规则 `blocked`。

安全终点获批后，检查代码必须逐项记录：`pork_endpoint_reached`（排骨达到届时批准的熟制终点）与 `beans_endpoint_reached`（豆角达到届时批准的充分熟制终点）。二者任一未达到即记失败，不能用扩大比例范围掩盖。

| calibration_id | 份数 | 状态 | cornmeal_shape_or_cut | cornmeal_brand | preparation_water_temperature_c | wheat_flour_added | fermentation_used | pot_diameter_cm / pot_depth_cm / lid_fit_confirmed | stew_liquid_level_at_paste | cornmeal_grams | preparation_water_grams | stew_water_grams | steam_minutes | dough_holds_shape | center_cooked_through | cake_above_liquid | cake_holds_together | pot_not_scorched | pork_endpoint_reached | beans_endpoint_reached | 备注 |
| --- | ---: | --- | --- | --- | ---: | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| ne-cal-2 | 2 人份 | pending |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ne-cal-3 | 3 人份 | pending |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ne-cal-4 | 4 人份 | pending |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
