# Source-backed one-pot batch r287 — 台湾/香港三条安全终点

- catalog version: `source-backed-one-pot-v1-20260808-global-r287`
- catalog size: 923
- canonical additions: 0
- executable additions: 0
- existing safety fields closed: 3 endpoints on 3 recipes

## Closed fields

| recipe_id | 同源官方事实 | 回填 | 保留边界 |
| --- | --- | --- | --- |
| `r58-taiwan-afa-pumpkin-rice` | 台湾农粮署《南瓜饭》写明猪绞肉先炒熟，再与米、南瓜等进电锅。 | `pork_fully_cooked`，74°C，FoodSafety.gov。 | 仍为电锅原方；固定份数和完整总时长缺失，不改成通用电饭煲合同。 |
| `startsmart-tomato-chicken-congee` | 香港卫生署 StartSmart 写明鸡肉搅碎后加入米粥，煲至熟。 | `poultry_fully_cooked`，74°C，FoodSafety.gov。 | 普通锅煮粥；家庭份量和精确水量缺失，不补猜。 |
| `taiwan-tuna-mushroom-quinoa-rice` | 台湾国民健康署 PDF 写明黑鲔鱼先炒熟，电锅蒸约45分钟，并要求鱼料充分熟透。 | `seafood_fully_cooked`，63°C，FoodSafety.gov。 | 保留前炒后电锅蒸及老人餐来源边界，不泛化为家庭批量。 |

## Sources

- [台湾农粮署：南瓜飯](https://ebook.afa.gov.tw/tefd/ebook5/ebook5-1.html)
- [香港卫生署 StartSmart：番茄雞肉粥](https://www.startsmart.gov.hk/tc/photogalleryDetail.aspx?RecipeID=51)
- [台湾国民健康署：鮪魚菇菇洋蔥紅藜麥炊飯 PDF](https://health99.hpa.gov.tw/storage/pdf/materials/22632.pdf)
- [FoodSafety.gov：Safe Minimum Internal Temperatures](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)

三条均使用现有 `S-SAFETY-TEMPERATURES-1`，不把来源中的“炒熟/煲至熟/充分熟透”冒充为电饭煲程序或总时长证据。

验证：`tools/tests/source-backed-one-pot-batch-r287-safety.test.mjs` 先红后绿；随后运行目录构建、catalog validator、`check-recipes`、专项与全量回归。
