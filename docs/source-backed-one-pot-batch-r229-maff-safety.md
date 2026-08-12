# r229 MAFF 安全终点闭合批次

基线：`source-backed-one-pot-v1-20260808-global-r228` / 923 条。
本批不新增 canonical、不晋升 executable，只为两条已有 `recipe_fact_checked` 的来源明确鸡肉同锅/先处理后炊煮流程补挂既有禽肉安全终点。

## 回填条目

| recipe_id | 一手来源事实 | 回填 | 保留边界 |
| --- | --- | --- | --- |
| `maff-ehime-shoyu-meshi` | [MAFF しょうゆめし](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/shouyu_meshi_ehime.html) 材料为 4 人份，含鸡肉 150g；原页步骤将鸡肉切小、以调味料 B 腌置，再与米、调味料和水同釜炊煮。 | `poultry_fully_cooked`，74°C，来源 `S-SAFETY-TEMPERATURES-1`。 | MAFF 未给加水量；淘米静置时间不是总制作时长；保留原页锅/电饭煲事实，不推导通用程序。 |
| `maff-okayama-todomese` | [MAFF とどめせ](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/41_6_okayama.html) 材料为 8 人份，含鸡肉 200g；原页先将鸡肉与根菜炒煮，再把处理后的具材与米、昆布、酒放入电饭锅炊煮，成品再拌醋调味。 | `poultry_fully_cooked`，74°C，来源 `S-SAFETY-TEMPERATURES-1`。 | 先炒煮、后炊饭、出锅醋拌/配料是来源流程，未压成单一普通电饭煲执行合同。 |

安全来源： [FoodSafety.gov safe minimum internal temperatures](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures) 明确禽肉最低中心温度 165°F / 74°C。此终点只挂到原始来源明确包含鸡肉并给出加热流程的条目，不用于证明未说明生熟状态的海鲜或肉类。

## 验证

- TDD：先在 r228 基线运行 `tools/tests/source-backed-one-pot-batch-r229-maff-safety.test.mjs`，版本断言按预期失败；回填后 2/2 通过。
- 两条记录仍为 `recipe_fact_checked`，无 `executable` 字段；目录总数仍 923。
- 未改运行时代码、UI、Planner 或部署产物；生成目录和全量门禁在批次收尾时执行。
