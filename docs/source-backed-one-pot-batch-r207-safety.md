# r207 安全合同回填：Instant Pot 两条鸡肉米饭

基线为 `source-backed-one-pot-v1-20260808-global-r206`，目录仍为 923 条。本批不新增 canonical，也不改变份数、液体、总时长或器具适配；仅为两条已有 `recipe_fact_checked` 记录补挂可复用的禽肉安全终点。

| recipe_id | 原始来源事实 | 回填合同 | 保留边界 |
| --- | --- | --- | --- |
| `instant-pot-easy-chicken-rice` | Instant Pot 官方页给出 1.25 lb 去骨鸡肉，置于分层米饭与鸡汤中，以 High Pressure 6 分钟完成；西兰花和部分奶酪在开盖后加入。 | `poultry_fully_cooked`，74°C；来源为 FoodSafety.gov `S-SAFETY-TEMPERATURES-1`。 | 仅闭合禽肉终点；来源总时长为区间，`time_contract` 继续为 `null`；保留西兰花后加和 Instant Pot 机型，不外推普通电饭煲。 |
| `instant-pot-chicken-rice-soup` | Instant Pot 官方页给出 1/2 lb 去骨去皮鸡胸，与米、蔬菜和 4 杯鸡汤同锅 Pressure Cook，结束后取出撕碎并回锅。 | `poultry_fully_cooked`，74°C；来源为 FoodSafety.gov `S-SAFETY-TEMPERATURES-1`。 | 仅闭合禽肉终点；页面总时长为区间，`time_contract` 继续为 `null`；保留撕鸡回锅和 Instant Pot 压力锅边界。 |

## 验证

- r207 专项测试：2/2 通过。
- 目录构建、目录校验、`node tools/check-recipes.mjs` 与 `git diff --check` 在整合后运行。
- 本批仍是来源合同回填，不等同厨房实测、人工批准或生产上线。
