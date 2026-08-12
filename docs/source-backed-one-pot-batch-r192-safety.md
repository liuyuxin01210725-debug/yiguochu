# r192 安全端点批次

版本：`source-backed-one-pot-v1-20260808-global-r192`

基线：r191 / 923 条

## 本批变更

- `maff-salmon-green-onion-takikomi`：新增 `seafood_fully_cooked`、63°C；保留普通锅/鲑鱼先轻烤边界。
- `zojirushi-nonokomeshi-el-mb30`：新增 `poultry_fully_cooked`、74°C；保留压力 IH、豆腐皮饭袋和27分钟机型边界。

两条均挂 `S-SAFETY-TEMPERATURES-1`，状态仍为 `recipe_fact_checked`，不进入 executable。

## TDD 与门禁

先在 r191 基线运行 `tools/tests/source-backed-one-pot-batch-r192-safety.test.mjs`，版本/端点断言按预期失败；回填后专项 2/2 通过。随后重建 source-backed artifacts、同步快照并运行目录/菜谱/全量测试门禁。
