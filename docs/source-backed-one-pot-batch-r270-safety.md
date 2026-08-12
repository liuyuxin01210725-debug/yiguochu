# r270 安全证据回填

基线：`source-backed-one-pot-v1-20260808-global-r269` / 923 条。  
本批：目录仍 923 条，新增 2 个既有 Tiger 条目的安全端点，未新增 canonical，未晋升 executable，保留电饭煲与 Tacook 边界。

## 回填条目

| recipe_id | 原文可证明的熟制事实 | 回填端点 | 边界 |
| --- | --- | --- | --- |
| `tiger-seafood-pilaf` | Tiger USA 原页列出虾、鱿鱼、章鱼、贻贝等混合海鲜，解冻后置于米和高汤上，选择 Plain 程序同煮。 | `seafood_fully_cooked`；63°C；`S-SAFETY-SEAFOOD-GENERAL-CDC-1` | 保留“海鲜集合”不能自由替换成任意项目槽位，也不补来源未给的固定克重/总时长。 |
| `tiger-usa-chinese-rice-bowl` | Tiger Tacook 原页列出虾、鱿鱼和切块猪肉，装入同步烹调盘，与米饭同步完成。 | `seafood_fully_cooked` 63°C；`pork_fully_cooked` 74°C；分别挂 CDC/FoodSafety.gov | 保留 2 份、Tacook 同步盘、出锅浇汁；米水量和总时长仍为空，不宣传为普通电饭煲单锅合同。 |

安全来源只定义熟制终点，不替代 Tiger 原页对食材、器具和步骤的证明。两条仍为 `recipe_fact_checked`，不能直接进入 executable 轮替。

