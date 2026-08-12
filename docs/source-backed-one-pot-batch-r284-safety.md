# Source-backed one-pot batch r284 — 阿根廷 NEA 鸡肉炖饭安全终点

- catalog version: `source-backed-one-pot-v1-20260808-global-r284`
- catalog size: 923
- canonical additions: 0
- executable additions: 0
- existing safety fields closed: 1

## Closed field

`global-argentina-nea-arroz-pollo`（Guiso de arroz con pollo）保留阿根廷政府 NEA 食谱册的普通锅分阶段流程：蔬菜先炒，加入鸡块和调味料，再加番茄泥与 0.5 L 热水炖约 30 分钟，土豆接近熟时加入半杯米继续煮约 15 分钟。r284 只新增 `poultry_fully_cooked`、74°C 端点，并挂现有 FoodSafety.gov 安全来源；不改变原器具，不把它改写成电饭煲合同，fixed_batch 与完整总时长仍缺失。

官方原文：阿根廷政府《Recetario NEA》第 61 页明确“加入鸡块”后以 0.5 L 热水炖煮约 30 分钟，再加入米。FoodSafety.gov 的禽肉表提供 74°C（165°F）最低中心温度。

Sources:

- [Argentina.gob.ar：Recetario NEA](https://www.argentina.gob.ar/sites/default/files/2020/09/pnpa_-_2021_-_recetario_nea.pdf)
- [FoodSafety.gov：Safe Minimum Internal Temperatures](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)
