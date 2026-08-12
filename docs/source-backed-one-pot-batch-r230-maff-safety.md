# r230 MAFF 生鸡肉安全终点闭合批次

基线为 r229/923。本批不新增 canonical、不晋升 executable，只为 5 条已有 `recipe_fact_checked` 记录补入同源官方流程可支持的禽肉安全终点。

| recipe_id | 官方原页事实 | 保留边界 | 回填 |
| --- | --- | --- | --- |
| `maff-corn-chicken-takikomi-gohan` | 日本农林水产省页面给出 2 人份米、鸡肉末、玉米、玉米汁和鲣鱼高汤，鸡肉末与米同入炊饭器。 | 原页未给完整设备分钟数，不外推时间或通用程序。 | `poultry_fully_cooked`，74°C |
| `maff-daikon-chicken-rice` | MAFF 页面给出 2 人份米、白萝卜、萝卜叶、鸡腿肉和油豆腐，材料同入电饭锅并使用来源快煮流程。 | 萝卜含水量和快煮水位保留原边界，不推导毫升液体或总时长。 | `poultry_fully_cooked`，74°C |
| `maff-chicken-shiitake-chinese-steamed-rice` | 官方页给出 2 人份米、鸡腿肉、香菇和 240cc 水；鸡腿切块腌制后铺在米面，蒸锅强火 25–30 分钟。 | 这是蒸锅配方，不转换成电饭煲合同；原页没有禽肉温度。 | `poultry_fully_cooked`，74°C |
| `maff-irogohan-nara` | MAFF 奈良页面给出 6 人份米、根菜、油炸豆腐、蒟蒻和鸡肉同炊。 | 原页液体出现 900mL 出汁与步骤 500mL 混合液两种表述，继续保持液体缺省。 | `poultry_fully_cooked`，74°C |
| `maff-fukuoka-bamboo-rice` | MAFF 福冈页面给出 2 人份米、竹笋、鸡肉、油豆腐，出汁按米量 1.2 倍，配料同入电饭锅并焖约 10 分钟。 | 保留来源的米杯、水位和焖饭边界，不把它改成普通电饭煲通用参数。 | `poultry_fully_cooked`，74°C |

安全终点统一引用 [FoodSafety.gov 安全最低内部温度表](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures) 的禽肉 165°F/74°C。该来源只支持禽肉终点，不补写原菜谱没有证明的份数、液体、总时间或设备等价关系。

## TDD 与门禁

先在 r229 基线上运行专项测试，版本和 5 条 endpoint 断言按预期失败；写入后 `source-backed-one-pot-batch-r230-maff-safety.test.mjs` 通过 2/2。随后重建 source-backed artifacts，并运行目录 validator、聚合菜谱门禁和 `git diff --check`。
