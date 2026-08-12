# r338：来源短流程无事实增补拆分

基线为 r293/923。8 条来源合同已经具备固定批量、液体、总时长、安全终点和原文流程，但原页把流程压缩为两段长句，研究卡因此自动添加了估算补充步骤。

本批只把原有句子按原文分号、先后动作和时间边界拆成 3–4 个步骤；每个拆分步骤继续引用原来的 `source_id`，没有新增食材、液体、时间或器具事实，也没有把来源器具改写成普通电饭煲。

涉及：

- `hk-yam-longan-chicken-claypot-rice`
- `hk-taro-shrimp-multigrain-steamed-rice`
- `tefal-chicken-rice-olives-one-pot-pan`
- `tiger-chicken-paella`
- `tiger-seafood-paella-post118`
- `hk-mushroom-grass-carp-congee`
- `global-spain-arroz-negro`
- `illinois-texas-hash`

结果：来源完整执行卡由 115 条增加到 123 条，来源片段研究卡由 761 条降为 753 条；正式 Planner 仍不自动晋升，仍需 taxonomy、Ratio DSL、器具适配、厨房试做和真实旅程证据。

验证：专项 TDD、source-backed 聚合门禁、目录构建和菜谱体检均须通过后才重建预览产物。
