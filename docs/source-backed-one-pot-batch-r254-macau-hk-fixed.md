# r254 澳门／香港官方页面字段闭合

日期：2026-08-10
目录快照：`source-backed-one-pot-v1-20260808-global-r253`（923 条）→ `source-backed-one-pot-v1-20260808-global-r254`（923 条）

## 范围

本批不新增 canonical，也不改变 executable 数量。依据已有澳门体育局、香港卫生署 EatSmart 直达页面及 CookSmart 官方 PDF，把 6 条已经具名且原文同时给出份数、主要量化配料和流程的 `discovered` 记录提升为 `recipe_fact_checked`。未把熟饭、石锅或多器具流程改写为普通电饭煲方案；液体、时间和安全字段仍按原文缺口保留。

## 闭合记录

| recipe_id | 同源可证明字段 | 保留边界 |
|---|---|---|
| `r100-macau-tomato-chicken-rice` | 澳门体育局 4 人份；鸡腿肉 400g、洋葱 1 个、番茄 2 个、鸡蛋 2 只、白饭 4 碗，以及页面列出的汁料量；鸡肉、炒饭、茄汁分开处理后组合。 | 熟饭二次烹、另煮汁；鸡肉终点与总时长未提供。 |
| `r100-macau-high-fiber-brown-fried-rice` | 3 人份；熟糙米饭 185g、菜心 100g、松子仁 15g、粟米粒 30g、蛋白 60g、姜茸 1 茶匙、油 2 茶匙；浸泡煮熟、冷藏至少 30 分钟后炒制。 | 盐和水为适量；熟饭二次烹，不进生米轮替。 |
| `r100-hk-corn-pumpkin-chicken-ball-rice` | 1 人份；南瓜 100g、洋葱 1 个、水 50mL、鸡球 142g、粟米 20g、青椒 20g、熟白饭 285g；南瓜洋葱制汁、鸡球蔬菜汆烫合煮后配饭。 | 熟饭、多阶段酱汁；禽肉安全终点和总时长仍缺。 |
| `r100-hk-scallop-egg-braised-rice` | 2 人份；米 70g、鸡蛋 2 个、瑶柱 15g、菜片 20g、高汤 300g；米另煮，蛋白/瑶柱/菜片烩汁后淋饭。 | “菜片”身份、芡汁和海鲜安全边界未闭合。 |
| `r100-hk-garlic-wild-mushroom-stonepot-rice` | 1 人份；彩椒 100g、熟白饭 1 碗、洋葱 20g、蒜蓉 1 汤匙、杂菜 150g、菌菇 100g、清汤 3 汤匙及调味；蔬菜汆烫炒香后铺石锅熟饭。 | 石锅盛器与熟饭边界不等价于电饭煲；无总时长。 |
| `r100-hk-pumpkin-multigrain-rice` | 2 人份；五谷米 150g、南瓜肉 50g、淡忌廉 50g、清水 50mL、橄榄油 1/2 茶匙、盐 1/3 茶匙、糖 1/5 茶匙；南瓜烤熟、五谷米蒸熟、洋葱蒜炒后拌合。 | 洋葱/蒜量为适量；烤箱、蒸锅、炒锅多阶段，不推导电饭煲。 |

`r100-hk-pumpkin-seafood-brown-rice` 仍只有官方焗烤技法摘要，没有固定份数、液体或时间，因此保持 `discovered`，没有凑数晋升。

## 验证

- TDD：`tools/tests/source-backed-one-pot-batch-r254-macau-hk-fixed.test.mjs` 先在 r253 基线失败，字段写回后 2/2 通过。
- 目录 923 条；状态变为 `executable=36`、`recipe_fact_checked=781`、`identity_verified=99`、`discovered=7`。
- `build-source-backed-one-pot-catalog --write/--check`、`check-source-backed-one-pot-catalog`、`check-recipes`、`git diff --check` 均通过。

本批是来源事实闭合，不是普通电饭煲可执行菜单扩张；来源没有给出的液体、时间和安全终点仍明确保留为空。
