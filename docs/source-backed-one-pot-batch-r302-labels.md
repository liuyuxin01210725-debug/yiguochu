# r302 研究卡标签补全

本批不改 923 条 canonical 数量，调整研究卡显示层：将“来源未展开”“来源未注明物种”“构成待核”等不可操作占位名改成带边界的可读研究起步名，例如“竹筒饭配料（当季肉/菜研究起步）”“抓饭肉类（物种待来源确认）”。

所有数值仍是 `estimated` 起步量，来源边界和缺失字段保留在 note/assumptions；没有把泛名转换成正式菜谱食材。

专项测试：`tools/tests/source-backed-one-pot-research-card-batch-r302-labels.test.mjs`。
