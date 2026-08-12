# r181 厂商液体合同回填

- 基线：`source-backed-one-pot-v1-20260808-global-r180` / 923 条
- 当前：`source-backed-one-pot-v1-20260808-global-r181` / 923 条
- 新增 canonical：0；本批补 3 条既有 `recipe_fact_checked` 的同源液体合同；未新增 executable。

本批仅回填官方厂商原页明确写出的液体对象与数值，不推导普通电饭煲参数，也不把器具边界或锅外收尾步骤抹平：

1. `tiger-sweet-potato-bacon-kombu-rice`：Tiger 日本原页给出米 2 合、水 400cc；登记为 `added_water`，保留“炊后焖 10 分钟”与缺失完整炊煮时长。
2. `zojirushi-endo-gohan`：象印 IH 锅原页给出 4–5 人份、米 3 杯、水 720mL；登记为 `added_water`，保留 `not_adapted` 和 4–5 人范围。
3. `zojirushi-stamina-rice`：象印 IH 锅原页给出米 3 杯、牛肉 150g、水 700mL；登记为 `added_water`，保留主饭同锅与锅外蛋皮收尾边界，仍为 `not_adapted`。

三条均保持原有份数/安全字段边界（本批不猜固定份数、不补安全终点），并通过批次 TDD、目录构建与聚合门禁。
