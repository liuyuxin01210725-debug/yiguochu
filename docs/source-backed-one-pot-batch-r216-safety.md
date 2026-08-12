# r216：大同深川蛤蜊饭安全终点回填

- 基线：`source-backed-one-pot-v1-20260808-global-r215` / 923 条
- 结果：`source-backed-one-pot-v1-20260808-global-r216` / 923 条
- 新增 canonical：0
- 新增 executable：0

## 回填条目

### `tatung-fukagawa-rice`

大同官方原页明确蛤蜊先放入大同电锅蒸开，取出蛤蜊肉并保留蛤蜊汁，再用同一内锅复炊米饭。蛤蜊原页用量为 350–400g 范围，本批不把范围压成单值，也不改已有的两阶段大同电锅流程。

本批只挂现有 `S-SAFETY-TEMPERATURES-1` 的贝类开壳终点：`shellfish_fully_cooked` / “蛤蜊烹调时贝壳打开”。该安全来源负责安全检查，官方菜谱来源负责食材状态与器具流程；不从蒸制或复炊时长倒推出温度，不外推普通电饭煲合同。

## 验证

- `tools/tests/source-backed-one-pot-batch-r216-safety.test.mjs`：先红后绿，1/1
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`
- `node tools/check-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-recipes.mjs`
- `git diff --check`

本批仍是已有事实条目的安全字段回填，不代表厨房实测、人工批准或生产上线。
