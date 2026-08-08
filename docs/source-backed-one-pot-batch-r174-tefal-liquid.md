# r174 TEFAL602 海鲜西班牙饭鱼高汤合同回填

- 基线：`source-backed-one-pot-v1-20260808-global-r173` / 923 条
- 当前：`source-backed-one-pot-v1-20260808-global-r174` / 923 条
- 新增 canonical：0
- 回填条目：`tefal-602-seafood-paella`（`Seafood Paella`）

## 本批只回填的事实

TEFAL602 官方食谱 PDF 的第 2–3 页同源给出 4 人份、Paella 米 300 g、鱼高汤 500 mL、海鲜混合 250 g，以及先煮米、约 28 分钟时加入海鲜混合并再加热约 5 分钟的流程。本批只把明确的 500 mL 鱼高汤写入 `liquid_contract`，类型为 `added_broth`，并挂回原 PDF source ID。

海鲜仍按来源分阶段加入，`safety_endpoints` 继续为空；PDF 本地归档、海鲜终点和其他型号适配仍是阻塞项。`fixed_batch` 和 `time_contract` 不因准备/烹调范围或分阶段文字被压成单值，条目继续保持 `recipe_fact_checked`、非 executable。

## 验证

- r174 专项测试：2/2
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`
- `node tools/check-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-recipes.mjs`
- `git diff --check`
