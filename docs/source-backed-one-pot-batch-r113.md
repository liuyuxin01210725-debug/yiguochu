# 来源菜饭目录批次 r113 · Tiger 官方一锅米饭候选

日期：2026-08-07  
目录版本：`source-backed-one-pot-v1-20260807-national-r113`  
基线：`source-backed-one-pot-v1-20260807-national-r112`（849 条）  
本批新增：3 条（均为 `recipe_fact_checked`，未晋升 `executable`）

## 本批范围

本批从 `docs/agent-research-20260807-manufacturer-intake-r113.md` 的 Tiger 官方候选中，挑选 3 条页面直接给出具名、食材与电饭煲流程的主餐：

| recipe_id | 具名菜 | 直接来源 | 结构化边界 |
|---|---|---|---|
| `tiger-usa-century-egg-fish-porridge` | Century Eggs and Fish Fillet Porridge（皮蛋鱼片粥） | [Tiger USA 官方页](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/century-eggs-and-fish-fillet-porridge/) | 5.5 杯机粥程序；2 份、粥 0.5 水位线、70 分钟；鱼类安全另引 FoodSafety.gov |
| `tiger-usa-tomato-cheese-risotto` | Tomato Cheese Risotto（番茄芝士烩饭） | [Tiger USA 官方页](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/tomato-cheese-risotto/) | 3–4 份保持范围；普通米 2 水位线、Plain 程序；总时长未给，不压成固定批量/时间 |
| `tiger-usa-keema-curry-chickpeas` | Keema Curry with Chickpeas（鹰嘴豆咖喱肉酱饭） | [Tiger USA 官方页](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/keema-curry-with-chickpeas/) | Tacook 双腔同步；肉酱在 Tacook 盘、米饭在内锅；份数、米水量、时间未给，不补猜 |

## 证据与边界纪律

- 三条均保留厂商原名和厂商适配范围，`cuisine_family` 记为 `manufacturer-*`，不把 Keema 的日式改编宣称为印度传统原方，也不把番茄芝士烩饭宣称为地域传统菜。
- 皮蛋鱼片粥的白鱼腌渍原文只写“一段时间”，目录不补腌制分钟数；鱼类熟制终点单独引用 FoodSafety.gov 的 63°C 事实。
- 番茄芝士烩饭来源给出 3–4 份，当前 schema 没有范围型 `servings`，因此 `fixed_batch` 保持 `null`；保留水位线、流程和证据说明，不取下限冒充固定份数。
- Keema 来源未给份数、米水量和总时间，`fixed_batch`、`liquid_contract`、`time_contract` 保持 `null`；牛肉末/猪肉末安全终点单独记录，不能由 Tiger 页面推导。
- 三条均为 `recipe_fact_checked`；没有厨房观察记录，也没有进入 `executable` 或轮替试做架的签署授权。

## TDD 与门禁

先写并验证失败的 `tools/tests/source-backed-one-pot-batch-r113.test.mjs`，确认 r112/849 时版本、数量和三条记录断言均失败；写入目录后再转绿。

专项测试：

```text
node --test tools/tests/source-backed-one-pot-batch-r113.test.mjs
3/3 passed
```

目录产物由 `node tools/build-source-backed-one-pot-catalog.mjs --write` 重建；完成后应运行：

```text
node tools/build-source-backed-one-pot-catalog.mjs --check
node tools/check-source-backed-one-pot-catalog.mjs
node tools/check-recipes.mjs
git diff --check
```

本批未修改 Worker、前端、Planner、轮替规则或部署配置。
