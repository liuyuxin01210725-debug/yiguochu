# Source-backed one-pot batch r243 — Tiger poultry safety backfill

基线：`source-backed-one-pot-v1-20260808-global-r242` / 923 条。目录版本升至 r243，canonical 数量仍为 923；本批只回填 4 条已有 `recipe_fact_checked` 条目的禽肉安全端点，不新增菜名、不晋升 `executable`，也不把 Tacook 双层设备外推为普通电饭煲。

## 回填条目

| recipe_id | 官方原页事实 | 回填 |
| --- | --- | --- |
| `tiger-usa-chicken-mushroom-rice` | Tiger USA 原页将鸡胸肉与米、香菇、鸡汤同放内锅，选择 Plain；页面给 3–4 份及配料量，但未给固定总时长或可合并的单一液体量。 | `poultry_fully_cooked` = 74°C，FoodSafety.gov `S-SAFETY-TEMPERATURES-1` |
| `tiger-usa-chicken-rice-vegetables` | Tiger USA 原页将鸡肉和蔬菜放入 Tacook 盘，糙米与鸡汤在内锅，选择 Synchro-Cooking 同步烹调；页面未给份数、配料量或总时长。 | `poultry_fully_cooked` = 74°C，FoodSafety.gov `S-SAFETY-TEMPERATURES-1` |
| `tiger-usa-tomato-chicken-melt` | Tiger USA 原页给 2 份、鸡腿 1/3 lb；鸡腿切小块后与蔬菜放入 Tacook 盘，米在内锅同步烹调。米水量与时间仍缺。 | `poultry_fully_cooked` = 74°C，FoodSafety.gov `S-SAFETY-TEMPERATURES-1` |
| `tiger-jujube-chicken-fillet-rice` | Tiger USA 原页给鸡腿切条，与木耳和调味料放 Tacook 盘，米在内锅，Synchro-Cooking 后覆饭；米量、水量和通用程序仍缺。 | `poultry_fully_cooked` = 74°C，FoodSafety.gov `S-SAFETY-TEMPERATURES-1` |

## 证据边界

- 74°C 只由 FoodSafety.gov 的禽肉最低内部温度来源提供；它不是 Tiger 页面宣称的机器温度，也不替代用户对成品中心温度的实测。
- Tiger 页面明确的是指定 Tacook/Plain/Synchro-Cooking 流程；本批不把这些设备参数转换成普通电饭煲水位、分钟数或可执行合同。
- 原页没有提供的 `fixed_batch`、`liquid_contract`、`time_contract` 保持原值；本批不从准备时间、范围或水位线推导单值。

验证：r243 专项测试 4/4 通过；随后需运行目录构建、`check-source-backed-one-pot-catalog`、`check-recipes` 与全量测试。
