# r246 安全端点回填批次

基线：`source-backed-one-pot-v1-20260808-global-r245` / 923 条
本批：`source-backed-one-pot-v1-20260808-global-r246` / 923 条

本批不新增 canonical 菜谱，只为 4 条已有 `recipe_fact_checked` 记录补挂同一份 FoodSafety.gov 禽肉安全来源。原页均给出鸡肉切块/鸡腿肉并有明确热处理步骤；没有把机型、分段程序、少许水或缺失总时长改写成通用电饭煲合同。

共享安全来源：`S-SAFETY-TEMPERATURES-1`，FoodSafety.gov “Cook to a Safe Minimum Internal Temperature”，opened，tier 1，retrieved 2026-08-10；禽肉最低中心温度 74°C。

| recipe_id | 回填 endpoint | 原始流程边界 |
| --- | --- | --- |
| `taiwan-angelica-sesame-chicken-rice` | `poultry_fully_cooked` / 74°C | 台湾农业部原页写鸡肉块以麻油爆香、加水煮滚，再与米入电锅；水量和总时长仍缺，保留白米/红糯米分支。 |
| `panasonic-taiwan-chicken-curry-rice` | `poultry_fully_cooked` / 74°C | Panasonic 原页写鸡腿肉先腌制，再与洋葱、胡萝卜、马铃薯在内锅热锅拌炒，随后加咖喱块和水完成；液体和总时长仍缺。 |
| `panasonic-taiwan-pumpkin-mushroom-chicken-brown-rice` | `poultry_fully_cooked` / 74°C | Panasonic 原页明确鸡肉洗净切块、腌制并煎至上色，再与糙米、南瓜、菇类进入糙米行程；水 2.5 杯保留，程序总时长仍缺。 |
| `panasonic-taiwan-ginseng-chicken-rice` | `poultry_fully_cooked` / 74°C | Panasonic 原页写去骨仿鸡腿肉切块后直接入锅，与人参水、米同炊；米 200g、鸡肉 200g、热水 500g 保留，总时长仍缺。 |

保守边界：安全端点只表示成品需满足禽肉最低中心温度，不证明来源页已经给出该温度，也不把“未标预熟”写成额外的生熟事实；其余份数、液体、时间和器具合同继续按原目录保留 null 或机型限制。

验证：专项测试先在 r245 基线下失败，再在回填后通过；随后运行 catalog validator、`check-recipes`、生成物检查和 `git diff --check`。
