# r303：第十批 5 条来源固定批次正式化推进

本批推进 5 条公共/大学来源：

| recipe_id | 名称 | 原器具/流程边界 |
|---|---|---|
| `va-pork-rice-skillet` | Pork and Rice Skillet | 普通煎锅流程，不外推电饭煲 |
| `asmi-pink-salmon-rice-bowls` | Pink Salmon Rice Bowls | ASMI 电饭煲原方与鱼类安全边界 |
| `usu-salsa-verde-chicken-rice` | Salsa Verde Chicken | USU 普通锅分阶段流程 |
| `nih-medlineplus-chicken-rice` | Chicken and Rice | NIH/MedlinePlus 先取出鸡肉再回锅的阶段边界 |
| `cu-caribbean-jerk-chicken-rice` | One Pot Caribbean Jerk Chicken & Rice | 普通锅/原方器具边界 |

五条均为 `source_bounded_non_executable`。固定批次来源字段已对齐，但还没有厨房观察、旅程回归和生产级可缩放规则；正式 Planner 仍维持 72 道。

验证：r303 专项 2/2；r294–r303 正式化测试、`check-recipes` 和 Planner 旅程门禁通过。
