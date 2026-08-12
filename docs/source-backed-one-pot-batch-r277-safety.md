# r277 安全端点批次：大分鶏めし

基线：`source-backed-one-pot-v1-20260808-global-r276` / 923 条

本批不新增 canonical，也不改变生产菜单；仅为既有 `maff-oita-torimeshi` 补一条可追溯的禽肉安全终点。

## 写回

| recipe_id | 原始来源事实 | 写回字段 | 边界 |
| --- | --- | --- | --- |
| `maff-oita-torimeshi` | [日本农林水产省《鶏めし》](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/torimeshi_oita.html) 直页给出 4 人份、米 2 合、地鸡 150g、牛蒡 120g；鸡肉切小后先炒至变白，再与牛蒡煮熟，配料覆到已煮好的米饭上焖约 15 分钟。 | `poultry_fully_cooked`，最低中心温度 74°C；安全依据为 [FoodSafety.gov](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)。 | 保留“先炒煮配料 + 熟饭覆料焖合”的 staged/cooked-rice 流程，不把页面另提的同米同炊变体拼入，不外推普通电饭煲水量或程序。 |

## 验证

- r277 专项 TDD：2/2 通过。
- 安全端点只作用于原页明确的鸡肉组件；没有新增液体、总时长或电饭煲适配合同。
- `status` 保持 `recipe_fact_checked`，不晋升 `executable`。
