# M1 Runtime Catalog（source-backed）

这是 M1 阶段建立的统一 Runtime Catalog 投影，生成文件为
`tools/data/source-backed-runtime-catalog.v1.json`。

它把来源目录、执行资料库和形式化台账按 `recipe_id` 做确定性连接，作为后续资料库、预览页、Cook Mode 与 Planner V3 的共同状态入口。它不会把研究资料自动晋升为正式 Planner 菜谱，也不会替代现有 72 道正式 Planner 基础菜谱。

## 当前快照

- 来源卡片：923
- `preview_only`：34
- `research_only`：888
- `blocked`：1
- `formal_active`：0
- `kitchen_observed`：0

所有条目都保留来源、执行资料和形式化台账引用；`planner_runtime_eligible` 在本阶段统一为 `false`。只有后续同时满足形式化、厨房观察和发布门禁的条目，才允许改变该字段。

## 构建与门禁

```bash
node tools/build-source-backed-runtime-catalog.mjs
node --test tools/tests/source-backed-runtime-catalog.test.mjs
node tools/check-recipes.mjs
```

`check-recipes.mjs` 会校验版本引用、923 条覆盖、执行/形式化引用完整性、状态枚举以及确定性重建结果。构建时 Runtime Catalog 也会复制到 `dist/source-backed-runtime-catalog.v1.json`，供后续统一运行时接入使用。

