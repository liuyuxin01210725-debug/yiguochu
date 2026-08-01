# Task 1 report — 全国菜饭收集总目录与 Fail-Closed Validator

## Delivered

- 新增机器资产 `tools/data/rice-meal-collection.v1.json`：37 条真实调研候选、8 条明确排除边界、12 个明确空白地域节点，以及现有 11 个运行目录 variant 的追踪记录。
- 新增 fail-closed `validateRiceMealCollection(collection, { taxonomy, catalog })` 与 `assertRiceMealCollection(...)`。它校验候选唯一性、HTTPS 身份来源、核心食材、营养等级、不可执行 blocker、地域节点覆盖、现有 catalog variant 覆盖、taxonomy 食材引用及 collection 内双向运行映射。
- 接入 `tools/check-recipes.mjs`，体检摘要输出候选数、runtime_ready 数、planned 数和显式空白地域数。
- 未修改 `rice-meal-catalog.v1.json`、runtime、Worker 或部署行为。

## TDD evidence

先创建两个测试文件，在 validator 和 JSON 不存在时运行：3/3 失败（`ERR_MODULE_NOT_FOUND` 和数据文件 `ENOENT`），确认 RED；随后实现最小 schema、数据与 validator。

## Fresh verification

```text
node --test tools/tests/rice-meal-collection-validator.test.mjs tools/tests/rice-meal-collection-data.test.mjs
3 pass, 0 fail

node tools/check-recipes.mjs
37 collection candidates · 4 runtime_ready · 7 planned · 12 explicit regional gaps · rice meal collection ok
✅ 菜谱库体检通过
```

## Concerns / intentional boundary

- `catalog_tracking` 与 `runtime_mappings` 是本任务的非运行时追踪层，保持既有 catalog 不变；Task 3 将按计划向每个 catalog variant 加 `collection_candidate_id`，完成跨文件的双向映射。
- 37 条候选均保持调研/计划边界；本任务没有把任何新候选激活为 Preview，也没有补造数量、液体或营养权威数值。

## Fix round 1 — review disposition

- URL 改用 `new URL()`，强制 `https:` 与非空 host；每条候选身份来源现固定记录 `title`、`publisher`、`retrieved_at`、`url`、`supports`，其中 supports 使用受控证据类型。
- 运行追踪与 catalog 状态双向收紧：`preview_ready -> runtime_ready`、`planned -> planned`；四条运行追踪都必须有 candidate 与反向 mapping，候选必须为 A/B、完整数量/液体/器具/安全契约且无 blocker。
- 黔江“适配版”、定安熟饭包裹、涉县小米焖饭和台湾客家熟饭组装均已移入 exclusions；新增三条 requested household-reviewed runtime candidates，并补一个已存在 planned variant 的 household linkage，以维持 37 条候选。
- 地域节点固定为 34 个省级/港澳节点，新增 CN-HK 与 CN-MO 显式 gap；候选与地域节点现作双向一致性校验。
- 两条四川孔干饭保留 `来源当前无法独立复核` blocker；米态仅接受受控米/糯米状态，未证实米态明确标为 `rice-state-unverified`。

Fix round verification: `node --test tools/tests/rice-meal-collection-validator.test.mjs tools/tests/rice-meal-collection-data.test.mjs` reports 13 pass, 0 fail; `node tools/check-recipes.mjs` passes and reports 37 candidates, 4 runtime_ready, 7 planned, 16 explicit regional gaps.

## Fix round 2 — tracking nutrition single source of truth

新增独立红灯测试后，validator 现强制每条带 candidate 的 tracking `nutrition_grade` 与映射 candidate 完全一致；`runtime_ready` tracking 还必须为 A/B。定点测试现为 14 pass, 0 fail，聚合体检通过。
