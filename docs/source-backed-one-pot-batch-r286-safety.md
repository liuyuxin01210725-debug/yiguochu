# Source-backed one-pot batch r286 — Panasonic 西班牙海鲜炖饭安全终点

- catalog version: `source-backed-one-pot-v1-20260808-global-r286`
- catalog size: 923
- canonical additions: 0
- executable additions: 0
- existing safety fields closed: 2 endpoints on 1 recipe

## Closed field

`r59-panasonic-taiwan-spanish-seafood-risotto`（西班牙海鲜炖饭）来自 Panasonic
Cooking Taiwan 的 NF-MF701 多功能锅原页。页面列出虾仁和鲷鱼菲力，先以白酒、盐、
胡椒腌制；末段将海鲜放入锅中，盖锅焖煮约 8–10 分钟，直到海鲜熟透。r286 只补：

- `seafood_fully_cooked`：鱼类最低中心温度 63°C；
- `shellfish_fully_cooked`：虾肉呈珍珠白或白色且不透明。

两项均挂现有 `S-SAFETY-TEMPERATURES-1`，不把“熟透”或锅具程序伪装成温度证明。

## 边界保留

- `fixed_batch` 仍为 `null`；页面未给稳定份数。
- `time_contract` 仍为 `null`；步骤给出分段焖煮区间，不是可泛化的整道总时长。
- `liquid_contract` 保留已记录的高汤 800mL组件，不把水 150g、白酒 100mL 和高汤合并成单一水位。
- `cooker_adaptation.status` 仍为 `source_limited`，保留 NF-MF701 高温/中高温/低温分段流程，
  不外推普通电饭煲。

## Sources

- [Panasonic Cooking Taiwan：西班牙海鮮燉飯](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/5226)
- [FoodSafety.gov：Safe Minimum Internal Temperatures](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)

验证：`tools/tests/source-backed-one-pot-batch-r286-safety.test.mjs` 先红后绿；随后运行目录
构建、catalog validator、`check-recipes`、专项与全量回归。
