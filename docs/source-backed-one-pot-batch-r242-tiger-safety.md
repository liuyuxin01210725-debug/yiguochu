# Source-backed one-pot batch r242

## 本批范围

- 基线：`source-backed-one-pot-v1-20260808-global-r241`，923 条。
- 结果：版本升至 `source-backed-one-pot-v1-20260808-global-r242`，仍 923 条；新增 canonical=0、executable=0。
- 只为官方 Tiger Tacook 页面明确放入生鸡肉并同步烹调的两条菜补充禽肉安全终点；不把机型水位线、份数或总时长推导成通用合同。

## 回填条目

### `tiger-honey-garlic-chicken`

- 来源：[Tiger Honey Garlic Chicken](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/honey-garlic-chicken/)；页面给出鸡胸肉腌制后放入 Tacook 盘、白米和水在内锅、Synchro-Cooking 同步烹调。
- 同源 FoodSafety.gov 安全表：[Cook to a Safe Minimum Internal Temperature](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures) 给出禽肉最低核心温度 74°C。
- 回填 `poultry_fully_cooked=74°C`，并将安全来源挂到 `S-SAFETY-TEMPERATURES-1`。
- `fixed_batch`、`liquid_contract` 和 `time_contract` 继续保持 `null`；保留 Tiger Tacook 水位线和机型边界，不晋升 executable。

### `tiger-teriyaki-chicken`

- 来源：[Tiger Teriyaki Chicken](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/teriyaki-chicken/)；页面给出鸡腿切片、裹粉后放入 Tacook 盘、白米和水在内锅、Plain/Synchro-Cooking 同步烹调。
- 同源 FoodSafety.gov 安全表给出禽肉最低核心温度 74°C。
- 回填 `poultry_fully_cooked=74°C`，并将安全来源挂到 `S-SAFETY-TEMPERATURES-1`。
- `fixed_batch`、`liquid_contract` 和 `time_contract` 继续保持 `null`；保留 Tiger Tacook 水位线和机型边界，不晋升 executable。

## 验证

- r242 专项测试：2/2 通过。
- 目录构建、来源门禁、`check-recipes`、JSON 解析和 `git diff --check` 在批次收尾时通过。
