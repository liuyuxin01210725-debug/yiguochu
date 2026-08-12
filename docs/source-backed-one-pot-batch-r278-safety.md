# r278 安全端点批次：兵库もち麦炊饭

基线：`source-backed-one-pot-v1-20260808-global-r277` / 923 条

本批不新增 canonical，只为既有条目补一条同源可解释的禽肉安全终点。

## 写回

| recipe_id | 原始来源事实 | 写回字段 | 边界 |
| --- | --- | --- | --- |
| `japan-hyogo-barley-chicken-vegetable-rice` | [日本农林水产省近畿农政局 PDF](https://www.maff.go.jp/kinki/syouhi/seikatu/syokuiku/attach/pdf/241015-46.pdf) 第 1 页给出 2 人份：白米 130g、もち麦 20g、鸡胸肉 40g；鸡肉切 2cm、腌制后铺到米麦上，用燃气灶/锅炊煮。 | `poultry_fully_cooked`，最低中心温度 74°C；安全依据为 [FoodSafety.gov](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)。 | 保留来源的燃气灶/锅、米麦浸泡和鸡肉铺料流程，不外推普通电饭煲水量或程序；不新增固定液体或总时长。 |

## 验证

- r278 专项 TDD：2/2 通过。
- `status` 保持 `recipe_fact_checked`，不晋升 `executable`。
