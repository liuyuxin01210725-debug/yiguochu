# r189 安全端点批次

版本：`source-backed-one-pot-v1-20260808-global-r189`

基线：r188 / 923 条
结果：923 条（新增 canonical 0；新增 executable 0）

## 本批变更

为 `taiwan-tilapia-edamame-rice` 补充一条可追溯的鱼类安全合同：来源明确罗非鱼先煎、再入电锅与米菜同煮，并要求完成后确认鱼肉全熟；目录新增 `seafood_fully_cooked`、`minimum_core_temperature_c=63`，挂 `S-SAFETY-TEMPERATURES-1`。原有 `source_limited` 器具边界、缺失水量/时长和非 executable 状态保持不变。

## TDD 与门禁

先在 r188 基线运行 `tools/tests/source-backed-one-pot-batch-r189-safety.test.mjs`，版本/端点断言按预期失败；回填后专项 2/2 通过。随后重建并检查 source-backed artifacts、catalog、recipe gate 与历史快照。
