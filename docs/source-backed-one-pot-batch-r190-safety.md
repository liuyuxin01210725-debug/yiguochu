# r190 安全端点批次

版本：`source-backed-one-pot-v1-20260808-global-r190`

基线：r189 / 923 条

## 本批变更

- `ntuh-salmon-mixed-mushroom-rice`：新增 `seafood_fully_cooked`、63°C，与台大医院原方的鲑鱼块同锅流程及 FoodSafety.gov 鱼类终点对应。
- `taiwan-pine-nut-chicken-wild-mushroom-rice`：新增 `poultry_fully_cooked`、74°C，与农业部页面的鸡腿先煎、再入电锅并确认熟透流程对应。

两条均保持 `source_limited`、原有批量/液体/时长和器具边界，状态仍为 `recipe_fact_checked`，不进入 executable。

## TDD 与门禁

先在 r189 基线运行 `tools/tests/source-backed-one-pot-batch-r190-safety.test.mjs`，版本/端点断言按预期失败；回填后专项 2/2 通过。随后重建并检查 source-backed artifacts、catalog、recipe gate 与历史快照。
