# Source-backed one-pot batch r288 — 泉州／台山／梅县鱼贝安全终点

- 基线：`source-backed-one-pot-v1-20260808-global-r287` / 923 条
- 本批：`source-backed-one-pot-v1-20260808-global-r288` / 923 条
- canonical 新增：0
- executable 新增：0
- 既有安全字段闭合：3 条

## 回填条目

| recipe_id | 原始来源事实 | 回填 | 保留边界 |
| --- | --- | --- | --- |
| `quanzhou-red-xun-rice` | [泉州市世界美食之都专题](https://www.quanzhou.gov.cn/gastronomy/ch/msdh/xwqz/202506/t20250624_3182398.htm) 写明鲜红蟳清洗、宰杀、过油后，与米料走高压锅或蒸笼分支继续加热。 | `shellfish_fully_cooked`：肉质呈珍珠白或白色且不透明。 | 保留高压锅/蒸笼两条原始分支；固定批量、液体、时间和电饭煲适配仍为空。 |
| `taishan-shixialuo-rice` | [川山群岛旅游网石夹螺饭](https://www.chuanshanqundao.com/News/Info-2986.html) 写明石硖螺肉翻炒后随砂锅米饭焖制。 | `shellfish_fully_cooked`：肉质呈珍珠白或白色且不透明。 | 保留砂锅、饭前/饭后投料重复原文；不推导固定批量、总时长或普通电饭煲合同。 |
| `meixian-shisan-fish-braised-rice` | [梅县区人民政府石扇鱼焖饭](https://www.gdmx.gov.cn/zjmx/mssx/content/post_2903785.html) 写明鲩鱼先煎，再以柴火焖煮或高压锅蒸熟。 | `seafood_fully_cooked`：鱼类最低中心温度 63°C。 | 保留鱼血入米、柴火/高压锅边界；来源没有家庭批量、液体、完整时间或电饭煲参数。 |

三条均复用已核验的 [FoodSafety.gov 安全温度表](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)。该公共来源只负责鱼/贝类熟制终点，地方来源继续负责菜名、食材和器具流程；本批不把传统锅具改写成普通电饭煲执行合同。

验证：`tools/tests/source-backed-one-pot-batch-r288-safety.test.mjs` 先在 r287 基线上失败，回填后 2/2 通过；随后运行目录构建、目录校验、`check-recipes`、生成物检查及完整回归。
