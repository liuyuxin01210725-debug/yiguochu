# r164 固定批次小批（既有条目）

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260808-global-r163` / 923 条

本批只回填官方原页直接给出的固定人份与定量主料，不新增 canonical、不晋升 `executable`，也不把多种液体压成单一液体合同。

## 已回填（3 条）

| recipe_id | 直接来源事实 | 回填 | 保留边界 |
| --- | --- | --- | --- |
| `maff-tokushima-omiisan` | [日本农林水产省原页](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/44_15_tokushima.html) 明确 4 人份：米100g、煮干15g、出汁4杯、里芋250g、大根200g、大根叶1/2束、味噌40g | `fixed_batch.servings=4`；固定主料与 `added_dashi=4杯` | 德岛传统锅煮米粥；仍未外推电饭煲，前置浸泡出汁时间不并入合同 |
| `instant-pot-spinach-chickpea-rice` | [Instant Pot 原页](https://instantpot.com/blogs/recipes/dump-done-spinach-rice-chickpeas) 明确 4 servings；印度香米、油、姜蒜、青椒、菠菜、番茄、罐头鹰嘴豆和1 cup水有定量 | `fixed_batch.servings=4`；写入原页可单值化的主料 | 页面总时长是 30–60 分钟范围；garam masala、盐、月桂叶和装饰存在范围/无量项，不伪造单值；保留压力锅边界 |
| `instant-pot-coconut-chicken-pineapple-rice` | [Instant Pot 原页](https://instantpot.com/blogs/recipes/coconut-chicken-and-rice-with-pineapple-salsa-0) 明确 4 servings；鸡腿、米、椰奶、水、调味料、甜椒、胡萝卜、菠萝均有原量 | `fixed_batch.servings=4`；写入原页可单值化的主料 | 椰奶与水是两种液体，未合并为单一 `liquid_contract`；鸡肉先煎后回锅、高压与菠萝莎莎另碗流程保留 |

## 明确未回填

`cuckoo-abalone-pot-rice` 原页同时出现 canned abalone 与 cleaned small abalone 的形态冲突；本批只核对来源，不把 4 servings 变成固定配料合同。Instant Pot 椰香鸡肉饭的两种液体也不压成一个水量，避免形成错误的可执行比例。

## 验证

- RED：`tools/tests/source-backed-one-pot-batch-r164-fixed-batch.test.mjs` 在 r163 基线下因版本/固定批次缺失失败。
- GREEN：同一专项 2/2 通过。
- 未修改 runtime、UI、Planner 或部署配置；目录总数保持 923。
