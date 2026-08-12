# r150 既有厂商米饭安全端点批次

**目录版本**：`source-backed-one-pot-v1-20260808-global-r150`
**基线**：r149 / 923 条
**变更**：5 条既有 `recipe_fact_checked` 记录补安全端点；新增 canonical 0；晋升 `executable` 0；运行时代码/UI 0。

## 共享安全来源

五条记录均新增同一条 FoodSafety.gov 来源，且仅声明 `safety` scope：

- [Cook to a Safe Minimum Internal Temperature](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)
- `source_id`: `S-SAFETY-TEMPERATURES-1`
- `access_status`: `opened`
- `evidence_tier`: `1`
- `license`: `U.S. government site terms`

该来源只证明安全终点，不替代原厂商页面的菜名、食材、液体、程序或器具事实。

## 变更清单

| recipe_id | 原料风险 | 新 endpoint | 原页流程边界 |
|---|---|---|---|
| `tiger-pork-kimchi-brown-rice` | 猪腿肉薄片 50g | `pork_fully_cooked` / 74°C | Tiger 玄米炊饭；泡菜与麻油出锅后拌入，水量继续以玄米刻度表达。 |
| `philips-pumpkin-minced-pork-congee` | 免治猪肉 80g | `pork_fully_cooked` / 74°C | Philips 迷你电饭煲粥程序 4 小时；0.5 杯粥刻度和无固定份数边界保留。 |
| `tiger-steak-mushroom-barley-rice` | 牛里脊牛排 200g | `beef_fully_cooked` / 71°C | 牛排按原页在平底锅另煎后切块拌入麦饭；保留 `extra_pan` 连续流程，不写成全程同锅。 |
| `philips-japanese-wagyu-beef-rice-bowl` | 和牛片 120g | `beef_fully_cooked` / 71°C | 米饭程序倒数 5 分钟投料；Philips 指定型号与米 2 杯刻度边界保留。 |
| `panasonic-taiwan-salmon-mushroom-rice` | 鲑鱼 250g | `seafood_fully_cooked` / 63°C | Panasonic SR-PAA100；鲑鱼腌制后与米、菇同锅，机型/水量/白米程序不外推。 |

## 取舍与不变项

1. 猪肉、牛肉和鱼的端点分别按项目现有受控 code 写入；没有把牛排另煎、牛肉倒数投料或电饭煲程序当作安全终点。
2. 鱼类使用 FoodSafety.gov 145°F / 63°C；本批没有把干制、腌制、泡菜或熟后拌入食材误判为生鲜风险。
3. 所有条目保持 `recipe_fact_checked`。安全端点闭合不等于固定份数、跨机型液体、总时长、`executable` 或厨房验证闭合。

## TDD 与门禁

先新增并运行 `tools/tests/source-backed-one-pot-batch-r150-safety.test.mjs`，基线 r149 下预期失败；写入五条后专项测试 2/2 通过。随后应运行：

```text
node tools/build-source-backed-one-pot-catalog.mjs --write
node tools/check-source-backed-one-pot-catalog.mjs
node tools/check-recipes.mjs
git diff --check
```

本批不改运行时代码、UI、Planner，不晋升 executable，不部署 production。
