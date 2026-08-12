# r302：第九批 5 条来源固定批次正式化推进

本批推进以下公共机构/锅具来源合同：

| recipe_id | 名称 | 原器具/流程边界 |
|---|---|---|
| `hk-mushroom-grass-carp-congee` | 香菇魚腩粥 | 普通锅粥品，不外推电饭煲 |
| `tefal-spanish-style-chicken-legs-r106521` | Spanish Style Chicken Legs | Tefal Cook4me 指定程序 |
| `global-spain-arroz-negro` | Arroz negro | 西班牙 paella 锅与海鲜高汤流程 |
| `tamu-turkey-burrito-bowl` | Turkey Burrito Bowl | 电压力锅/原料阶段边界保留 |
| `illinois-texas-hash` | Texas Hash | 普通锅/煎锅流程，保留原器具 |

五条均为 `source_bounded_non_executable`。它们的固定批次可在来源执行资料库查看，但仍不是可任意换份数的 Planner 配方；正式激活需要厨房观察、旅程回归和相应器具合同。

验证：r302 专项 2/2；r294–r302 正式化测试、`check-recipes` 和 Planner 旅程门禁通过。
