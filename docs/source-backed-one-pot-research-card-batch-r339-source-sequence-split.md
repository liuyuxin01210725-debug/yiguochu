# r339：来源短流程无事实增补拆分

基线为 r338/923。9 条来源合同已经具备固定批量、液体、总时长和原文流程，但原页把流程压缩为两段长句，研究卡因此自动添加了估算补充步骤。

本批只把原有句子按原文动作、先后顺序和时间边界拆成 3–4 个步骤；每个拆分步骤继续引用原来的 `source_id`，没有新增食材、液体、时间、安全或器具事实，也没有把来源器具改写成普通电饭煲。

涉及：

- `tiger-brown-rice-curry-pilaf`
- `maff-tokushima-omiisan`
- `philips-soy-milk-chicken-congee`
- `tefal-risotto-milanese`
- `tefal-saffron-rice-seafood`
- `tiger-cheese-curry-pilaf`
- `tiger-hotaruika-rice`
- `tiger-canned-curry-takikomi-pilaf`
- `qld-one-pot-beans-rice`

结果目标：来源完整执行卡增加 9 条，来源片段研究卡相应减少 9 条；正式 Planner 不自动晋升，仍需 taxonomy、Ratio DSL、器具适配、厨房试做和真实旅程证据。

验证：专项 TDD、source-backed 聚合门禁、目录构建和菜谱体检均须通过后才重建预览产物。
