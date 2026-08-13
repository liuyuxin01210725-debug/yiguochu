# C3–C5 · 正式化矩阵与 Runtime 场景矩阵

本轮把“923 条来源正式化状态”与“真实用户场景覆盖”拆为两个只读派生资产：

- `tools/data/source-backed-formalization-matrix.v1.json`：923 行，主键为 `recipe_id`，只表达 source / execution / formal / kitchen / journey 门禁。
- `tools/data/runtime-coverage-matrix.v1.json`：101 个场景，主键为 `scenario_id`，来自 17 条 recipe-runtime、54 条 rice-meal 和 30 条 direct-recommend shadow。

两者都由确定性 builder 重建，不进入正式 Planner，不改变 72 道正式菜谱或生产状态。

## C4：Journey 关联

矩阵只读取 `recipe_id`、`selected_recipe_id`、`candidate_recipe_ids`、`runtime_recipe_refs`、`evidence_recipe_ids` 等结构化字段。标题、备注、调试文本和错误信息中的菜名/ID 不构成证据。

因此当前来源矩阵的结构化旅程证据为 1 条 source recipe、9 个 runtime journey 引用；rice-meal 中写在 `expected_first_variant`、备注或 `catalog_gap` 的文本不会被误算成 source recipe evidence。

## C5：Join fail closed

正式化矩阵每行输出 `joins`：

- source / execution / formalization 缺失：`invalid`；
- formal review 缺失：`incomplete`；
- staging 缺失：`pending`；
- 缺失时同时加入对应 `*_join_missing` gap code，并将 execution/formal/kitchen/journey 保持为不可完成状态。

Runtime 场景矩阵把“期望”与“观察”分开：所有当前场景 `observation.observed=false`、`production_eligible=false`；数量、液体、安全在没有观察证据时统一为 `not_observed`。

## 验收

```bash
node tools/build-source-backed-formalization-matrix.mjs
node tools/build-runtime-coverage-matrix.mjs
node --test tools/tests/source-backed-coverage-matrix.test.mjs tools/tests/source-backed-formalization-matrix.test.mjs tools/tests/runtime-coverage-matrix.test.mjs
git diff --check
```

本批测试包含全文文本误命中回归、结构化 ID 精确关联、缺 join fail-closed、101 场景覆盖与确定性重建断言。
