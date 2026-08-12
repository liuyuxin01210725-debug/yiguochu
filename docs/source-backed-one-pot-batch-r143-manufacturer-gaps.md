# r143 厂商合同补缺批次

日期：2026-08-08  
目录版本：`source-backed-one-pot-v1-20260808-global-r143`  
基线：r142 / 923 条

## 本批边界

本批不新增 canonical，不改运行时代码、Planner、前端或部署配置；只把已经在目录中的厂商来源事实补回结构化合同。所有没有被官方原页直接证明的字段继续保留 `null`，不从相近机型、相近菜名或不同来源取中值。

## 实际变更

### `tiger-post-196-gomoku-rice`（`recipe_fact_checked`）

- 保持同一 Tiger 官方页面 `S-TIGER-POST-196-GOMOKU-R62` 作为批量、食材、液体水位、步骤和时间的来源。
- 补回 4 人份、米 2 杯及页面列出的配料量；荷兰豆原文为 3–5 片，结构化数据保留范围，不取中值。
- 补回 Tiger 指定型号的白米水位 2、`炊込み` 程序和约 55 分钟；`cooker_adaptation` 明确只适用于页面列出的型号，不外推普通电饭煲。
- 鸡肉熟制终点另引 FoodSafety.gov 的 74°C 来源；这不改变器具或流程边界。
- 仍为 `recipe_fact_checked`，不晋升 `executable`，不宣称地域传统身份。

### 保持边界、不强行闭合的已有记录

- `panasonic-fresh-shiitake-rice-sr-afg`：保留 1 杯米、配料及 1 杯液体的机型资料；原机程序时长随食材变化，固定 `time_contract` 继续为 `null`。
- `panasonic-mixed-chicken-rice-sr-df151`：保留 3 杯米、4 杯液体和配料资料；精煮时长为机型参考且随食材变化，固定时间继续为 `null`。
- `zojirushi-minced-pork-greens-rice-nl-erh`：保留 4–5 人份、水位 3 及 65–71/68–75 分钟的机型范围；不取中值，不伪造单一 servings 或固定时长，字段继续保持原有边界。

## 证据与生成物

- `tools/data/source-backed-one-pot-recipes.v1.json` 版本 bump 至 r143，条目总数仍为 923。
- 已用固定输入重建 `docs/source-backed-one-pot-recipes.md`、`.csv` 和 `docs/source-backed-one-pot-recipe-gaps.md`。
- 新增 TDD 专项：`tools/tests/source-backed-one-pot-batch-r143-manufacturer-gaps.test.mjs`。

## 验证

- r143 专项：4/4 通过。
- 目录 JSON 可解析，Tiger 记录可读取且版本/数量正确。
- 后续目录 validator、`check-recipes` 与 `git diff --check` 由主线收尾时执行；本批不包含 executable 晋升。
