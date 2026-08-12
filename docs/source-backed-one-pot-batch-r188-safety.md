# r188 安全端点批次

版本：`source-backed-one-pot-v1-20260808-global-r188`
基线：r187 / 923 条
结果：923 条（新增 canonical 0；新增 executable 0）

## 本批变更

为两条已有 `recipe_fact_checked` 条目补充同源可追溯的甲壳类视觉安全终点：

- `maff-saga-tsugani-meshi`：河蟹清洗、去鳃、切半后与米同釜炊煮；新增 `shellfish_fully_cooked`，仅视觉终点“肉质呈珍珠白或白色且不透明”。
- `pingtan-golden-crab-glutinous-rice`：活金蟳切块后覆湿糯米蒸熟；新增同一 `shellfish_fully_cooked` 视觉终点。

两条均挂 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov，tier 1，opened，scope=safety），未添加温度字段。传统釜/瓷盆蒸制边界、固定批量、液体、时间和家庭电饭煲适配均不变；状态仍为 `recipe_fact_checked`，不进入 executable。

## TDD 与验证

先在 r187 基线运行 `tools/tests/source-backed-one-pot-batch-r188-safety.test.mjs`，版本/端点断言按预期失败；回填后专项 2/2 通过。随后运行：

- `node tools/build-source-backed-one-pot-catalog.mjs --write`
- `node tools/build-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-recipes.mjs`
- `git diff --check`

历史 source-backed/frontend 快照只同步当前 catalog 版本，不改变历史批次语义。
