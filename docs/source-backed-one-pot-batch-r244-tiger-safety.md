# Source-backed one-pot batch r244 — Tiger poultry safety backfill

基线：`source-backed-one-pot-v1-20260808-global-r243` / 923 条。目录版本升至 r244，canonical 数量仍为 923；本批只回填 2 条已有 `recipe_fact_checked` 条目的禽肉安全端点，不新增菜名、不晋升 `executable`，也不把另锅或 Tacook 双层设备外推为普通电饭煲。

## 回填条目

| recipe_id | 官方原页事实 | 回填 |
| --- | --- | --- |
| `tiger-hainanese-chicken-rice` | Tiger USA 原页先在锅中加入水、葱、姜、蒜并煮沸，再加入鸡腿以中火煮约 20–30 分钟；鸡肉煮熟后取出，鸡汤另用于米饭，米饭在指定电饭煲中另行炊煮。 | `poultry_fully_cooked` = 74°C，FoodSafety.gov `S-SAFETY-TEMPERATURES-1`；保留另锅煮鸡与电饭煲煮饭边界。 |
| `tiger-usa-autumn-chicken-mushroom-green-bean-pilaf` | Tiger USA 原页将鸡柳切块，与四季豆及蘑菇浓汤放入 Tacook 盘；米和鸡汤在内锅，选择 Synchro-Cooking 同步烹调。 | `poultry_fully_cooked` = 74°C，FoodSafety.gov `S-SAFETY-TEMPERATURES-1`；保留 Tacook 水位/同步烹调边界。 |

## 证据边界

- 74°C 只由 FoodSafety.gov 的禽肉最低内部温度来源提供；它不是 Tiger 页面宣称的机器温度，也不替代用户对成品中心温度的实测。
- 海南鸡饭的鸡肉明确先另锅煮熟，不能改写为全程单锅电饭煲菜饭；Autumn Pilaf 明确使用 Tacook 盘和 Synchro-Cooking，不能把设备水位线转换成普通电饭煲毫升数。
- 原页没有提供的 `fixed_batch`、`liquid_contract`、`time_contract` 保持原值；本批不从“20–30 分钟”或同步程序推导米饭总时长。

验证：r244 专项测试先在 r243 基线下按预期失败，回填后应运行目录构建、`check-source-backed-one-pot-catalog`、`check-recipes`、历史 source-backed 测试与全量串行测试。
