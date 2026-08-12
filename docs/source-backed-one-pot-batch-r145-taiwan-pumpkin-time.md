# r145 批次记录：台湾南瓜饭时间合同回填

日期：2026-08-08  
基线：`source-backed-one-pot-v1-20260808-global-r144` / 923 条  
目标版本：`source-backed-one-pot-v1-20260808-global-r145` / 923 条

## 本批变更

只回填已有 `taiwan-pumpkin-rice` 的 `time_contract`，没有新增 canonical、没有改变状态、没有晋升 `executable`：

- 同一目录条目的台湾农业部农业儿童网来源 `S-TW-MOA-KIDS-PUMPKIN-RICE-1` 原文写明“制作时间约 60 分钟”，因此记录 `total_minutes: 60`。
- `fixed_batch` 仍为 `null`：该来源给白米 4 杯、南瓜 600g，但没有成品份数。
- `liquid_contract` 仍引用原农粮署电子书的 0.8 倍米水版本，不改为儿童网版本的 5 杯内锅水。
- 儿童网版本的 5 杯内锅水与外锅 1 米杯程序水只写入边界说明，不能合并成一个液体合同。
- 原页面是台湾电锅流程；没有将外锅水或约 60 分钟外推到其他电饭煲。

## TDD 与门禁

先新增失败测试 `tools/tests/source-backed-one-pot-batch-r145-pumpkin-time.test.mjs`，再写入 JSON 字段。测试锁定：版本/总数不变、时间来源 ID、fixed_batch 为空、内外锅液体不混合及边界文案。

本批不包含其他候选，也不改运行时代码/UI。
