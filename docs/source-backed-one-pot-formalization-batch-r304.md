# r304：显式来源比例证据集合收尾（3 条）

本批完成显式 `ratio-evidence` 集合中最后 3 条的来源固定批次合同：

| recipe_id | 名称 | 原器具/流程边界 |
|---|---|---|
| `kidney-care-chicken-tikka-pulao` | Chicken Tikka Pulao | 原来源普通锅/分阶段流程，不外推电饭煲 |
| `firststeps-turkey-vegetable-pilaf` | Turkey Vegetable Pilaf | 原来源锅具流程，固定批次，不生成 per-serving 缩放规则 |
| `au-slhd-oven-baked-biryani` | Oven Baked Biryani | 炉灶预处理 + 烤箱完成，保留烤箱边界，不改成电饭煲步骤 |

三条均标记为 `source_bounded_non_executable`：只复制同一官方来源已经证明的份数、食材量、液体、步骤、时间和器具边界；不做跨器具转换、不创建估算数值、不启用正式 Planner。这样显式比例证据集合达到 53/53，但仍不是可缩放或可上线的正式 Planner 菜谱。

本批完成后，正式 Planner 仍为 72 道；923 条 source-backed 卡片仍全部有研究层执行字段，后续要晋升正式运行库还必须逐条补齐 taxonomy/营养/安全、真实厨房观察和旅程回归证据。

验证：r304 专项 2/2；r294–r304 正式化测试、`check-recipes`、目录门禁和 Planner 旅程门禁通过。
