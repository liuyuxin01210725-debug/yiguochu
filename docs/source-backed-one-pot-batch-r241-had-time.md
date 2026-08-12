# Source-backed one-pot batch r241

## 本批范围

- 基线：`source-backed-one-pot-v1-20260808-global-r240`，923 条。
- 结果：版本升至 `source-backed-one-pot-v1-20260808-global-r241`，仍 923 条；新增 canonical=0、executable=0。
- 只回填同一官方来源明确写出的单值总时长；份数和水量的范围不压成单值，也不把锅煮流程外推为电饭煲合同。

## 回填条目

### `had-vegetable-pulao`

- 来源：香港民政事务总署，[Home Recipe: Vegetable Pulao](https://www.had.gov.hk/rru/tc_chi/programmes/files/Home_Recipe.pdf)，官方 PDF 第 6 页。
- 原文同时给出 4 至 6 人份、约 4 至 6 杯水、约 30 至 45 分钟煮制，并明确总时长约 60 分钟。
- 回填 `time_contract.total_minutes=60`，来源 ID 为 `S-HAD-HOME-RECIPE-VEGETABLE-PULAO-1`。
- `fixed_batch` 和 `liquid_contract` 继续保持 `null`：来源是范围，不能安全压成单一份数或水量。
- 保留锅煮、蔬菜配方和蛋白不足边界；不建立电饭煲适配、不晋升 executable。

## 验证

- r241 专项测试：1/1 通过。
- 目录结构与来源门禁、`check-recipes`、JSON 解析和 `git diff --check` 在批次收尾时通过。
