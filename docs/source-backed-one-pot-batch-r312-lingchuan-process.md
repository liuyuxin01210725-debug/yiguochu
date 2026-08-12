# Source-backed one-pot research card batch r312 — 陵川柴火饭

基线为 `source-backed-one-pot-v1-20260810-global-r293`，目录总数仍为 923；本批不新增 canonical，也不把柴火灶版本转换成普通电饭煲正式菜谱。

## 本批回填

- `shanxi-lingchuan-firewood-rice`：陵川县人民政府原文称其为“和锅大米”，附城称“一锅出”、潞城称“柴火大米”，以米饭为主体，可放多种蔬菜副食同锅家常制作。
- 上述来源工序已写入 `cooking_sequence`，并把来源引用的 `claim_scopes` 补上 `process`。
- 来源没有固定米量、配菜组合、液体、火候、总时长或安全终点；这些字段继续留空。研究做法卡中的 2 人份、300g 米、450mL 液体、45 分钟仍是估算起步值，不是陵川原方。

## 验证

- TDD：先在未补工序的基线下失败，补入来源步骤后专项测试通过。
- 目录生成物、目录门禁、菜谱门禁与 `git diff --check` 在本批完成后运行。
