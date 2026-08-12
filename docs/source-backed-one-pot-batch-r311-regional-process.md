# Source-backed one-pot research card batch r311 — 张家界腊味煲仔饭

基线为 `source-backed-one-pot-v1-20260810-global-r293`，目录总数仍为 923；本批不新增 canonical，也不把传统砂锅菜晋升为生产轮替或电饭煲菜谱。

## 本批回填

- `zhangjiajie-cured-meat-claypot-rice`：铜仁网转载的张家界美食介绍明确写出“优质米饭和各种腊味，搭配特制调料，煲制而成”。这条来源工序已进入 `cooking_sequence`，并保留砂锅边界。
- 来源没有固定米量、腊味克数、液体对象、总时长或安全终点，所以这些字段继续为 `null`/空数组；研究做法卡显示的 2 人、300g 米、450mL 起步液体和 45 分钟仍属于 `estimated`，不能当作张家界原方。
- 不把粤式腊味煲仔饭、其他砂锅版本或电饭煲合同拼进本条。

## 验证

- TDD：先在 r310 基线下验证研究卡仍为 `draft_estimated`，再补来源工序；补入后专项测试通过。
- 目录与菜谱门禁、生成产物检查及 `git diff --check` 在本批完成后运行。
