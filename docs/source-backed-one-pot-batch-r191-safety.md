# r191 安全端点批次

版本：`source-backed-one-pot-v1-20260808-global-r191`

基线：r190 / 923 条

## 本批变更

为 `philips-crab-congee-all-in-one-cooker` 补充 `shellfish_fully_cooked` 视觉终点，并挂 `S-SAFETY-TEMPERATURES-1`。保留 Philips 智能万用锅、先煮粥后剩5分钟投蟹的阶段边界，状态仍为 `recipe_fact_checked`，不进入 executable。

## TDD 与门禁

先在 r190 基线运行 `tools/tests/source-backed-one-pot-batch-r191-safety.test.mjs`，版本/端点断言按预期失败；回填后专项 2/2 通过。随后重建 source-backed artifacts、同步快照并运行目录/菜谱/全量测试门禁。
