# source-backed one-pot batch r131 · global public6

**批次日期**：2026-08-08
**目录版本**：`source-backed-one-pot-v1-20260808-global-r131`
**基线**：r129 / 898 条
**本批新增**：4 条 `recipe_fact_checked`；0 条 `executable`；目录总数 902 条。

## 本批范围

本批只从 `docs/source-backed-one-pot-intake-20260808-global-public6-r130.md` 整合字段和器具边界已经能够结构化表达、且具有明确主餐定位的记录：

1. **Pink Salmon Rice Bowls (One-Pot Rice Cooker Meal)**（Alaska Seafood Marketing Institute）：明确电饭煲、2 份、米水鱼类和蔬菜用量、约 40 分钟；保留可选鸡蛋中途投料，未补鱼类安全温度。
2. **Smoky Hoppin’ John**（University of Rochester Medical Center）：明确普通不粘锅、即食糙米和熟黑眼豆的阶段流程；不把即食米/熟豆改写为普通生米/干豆。
3. **Salsa Verde Chicken**（Utah State University）：明确普通高边有盖锅、鸡腿/米/花椰菜、莎莎酱和鸡汤用量及 30 分钟流程；不外推电饭煲，未补禽肉安全温度。
4. **Chicken and Rice**（MedlinePlus / NHLBI）：明确普通大锅分阶段流程；鸡肉先煮后取出，煮米后回锅，保留 `staged_or_extra_pan` 边界，不压缩成一次投料。

## 未整合记录

- Penn State 的 Leftover Rice, Beans & Greens：从熟饭开始，标记为 `cooked_rice_second_cook`，留在未来熟饭品类 intake。
- USU PDF 的 One-Pot Spinach Rice：PDF 抽取字段与当前页步骤错位，标记为 `archive_or_blocked`，不以邻页字段补齐。

## 证据与门禁说明

- 四条记录均保留官方直达 URL、`access_status: opened`、证据分级和定位信息；未把来源之外的器具、时间或安全参数补写进主目录。
- 四条均保持 `recipe_fact_checked`，不是人工签署的 `executable`，不进入任何生产轮替承诺。
- 运行时、Planner、UI、菜谱生成接口和部署配置均未修改。
