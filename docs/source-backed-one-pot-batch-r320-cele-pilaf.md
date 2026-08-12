# r320：策勒抓饭原文步骤闭合

## 本批范围

- 基线：`source-backed-one-pot-v1-20260810-global-r293` / 923 条
- 新增 canonical：0
- 从 `identity_verified` 升为 `recipe_fact_checked`：1 条
- 新增原文步骤：4 步
- 未补写：固定份数、米/肉克重、可量化液体、总时长、安全终点和普通电饭锅等价合同

## 记录

### `cn-xj-qiele-pilaf` · 策勒抓饭

- 来源：[策勒县人民政府：抓饭](https://www.xjcl.gov.cn/clxrmzf/c118969/201609/6abb0617b5e3449caa8d2b5141fc3834.shtml)
- 原文事实：羊肉切 4 厘米方块；胡萝卜切条、皮芽子切块；羊肉炒至金黄色后加水和调料小火煮 1.5 小时；下米时让汤水刚能盖住米面，加入葡萄干/杏干；大火转微火焖 30 分钟。
- 目录写入：四步 `cooking_sequence` 全部挂 `S-R108-CN-XJ-CELE-PILAF-1`；`status=recipe_fact_checked`。
- 边界：来源没有批量或绝对水量，保留 `fixed_batch=null`、`liquid_contract=null`、`time_contract=null`；研究卡可显示“汤水刚能盖住米面”和估算起步量，但不能把它变成跨机型毫升合同。

## 验证

- TDD：`tools/tests/source-backed-one-pot-research-card-batch-r320-cele-pilaf.test.mjs`，先在 r293 基线失败，再在写入后 2/2 通过。
- 后续需运行目录构建、聚合门禁和全量测试；本批不改运行时代码/UI。
