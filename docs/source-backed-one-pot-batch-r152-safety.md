# r152 澳门带子菜饭安全端点批次

**目录版本**：`source-backed-one-pot-v1-20260808-global-r152`
**基线**：r150 / 923 条（r151 仅为安全 intake，未改目录）
**变更**：1 条既有 `recipe_fact_checked` 记录补贝类视觉安全终点；新增 canonical 0；晋升 `executable` 0；运行时代码/UI 0。

## 共享安全来源

本批复用已打开、tier 1 的 FoodSafety.gov 官方来源：

- [Cook to a Safe Minimum Internal Temperature](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)
- `source_id`: `S-SAFETY-TEMPERATURES-1`
- `access_status`: `opened`
- `evidence_tier`: `1`
- `claim_scopes`: `["safety"]`
- 本批采用页面对虾、龙虾、蟹和扇贝的视觉终点：肉质呈珍珠白或白色且不透明。该来源不替代澳门菜谱的米量、鸡汤量、普通锅流程或营养分析。

## 变更清单

| recipe_id | 原料事实 | 新 endpoint | 原页器具与流程边界 |
|---|---|---|---|
| `macau-scallop-mushroom-vegetable-rice` | 澳门体育局原页「帶子磨菇菜飯」明确 3 人份、鲜带子 100g、白米 1 杯、磨菇 100g、白菜 100g、清鸡汤 300mL；鲜带子在饭滚后加入 | `shellfish_fully_cooked`；视觉终点：肉质呈珍珠白或白色且不透明 | 普通锅、鸡汤分两半；一半先煮白菜和磨菇，另一半加水煮饭，饭滚后加入带子至白饭熟透。不改写成电饭煲或一键闭盖程序 |

## 取舍与不变项

1. 本批只为“鲜带子”补贝类安全终点；不为菜谱补总分钟数或电饭煲参数。
2. 页面没有给扇贝温度数字，因此 endpoint 使用现有视觉合同，不能擅自写入 74°C。
3. 仍保持 `recipe_fact_checked`：安全端点闭合不等于 fixed batch、时间、跨器具液体合同、`executable` 或 `kitchen_observed` 闭合。
4. r151 审计中的于田羊肉、台湾番红花海鲜、Panasonic 牡蛎和东京海鲜综合均未在本批改动；它们的物种/来源缺口继续保留。

## TDD 与门禁

先新增 `tools/tests/source-backed-one-pot-batch-r152-safety.test.mjs`，在 r150 基线下断言版本 r152 和澳门条目安全 endpoint，预期首跑红；写入条目后专项测试 2/2 通过。随后运行：

```text
node --test tools/tests/source-backed-one-pot-batch-r152-safety.test.mjs
node tools/build-source-backed-one-pot-catalog.mjs --write
node tools/check-source-backed-one-pot-catalog.mjs
node tools/check-recipes.mjs
git diff --check
```

本批不改运行时代码、UI、Planner，不新增菜谱，不晋升 executable，不部署 production。
