# r175 TEFAL602 鸡肉豌豆烩饭鸡高汤合同回填

- 基线：`source-backed-one-pot-v1-20260808-global-r174` / 923 条
- 当前：`source-backed-one-pot-v1-20260808-global-r175` / 923 条
- 新增 canonical：0
- 回填条目：`tefal-602-chicken-pea-risotto`（`Chicken & Pea Risotto`）

## 本批只回填的事实

TEFAL602 官方食谱 PDF 第 2 页同源给出 4 人份、Arborio 米 300 g、鸡高汤 650 mL、熟鸡肉 250 g、豌豆 75 g，并规定平底锅预处理以及约 20 分钟后投入熟鸡肉和豌豆。本批只将 650 mL 鸡高汤写入 `liquid_contract`，类型为 `added_chicken_stock`，并挂回原 PDF source ID。

熟鸡肉与平底锅预处理是来源边界，不能改成生鸡肉一锅煮；PDF 本地归档/其他型号适配仍未闭合，安全数组保持空，`fixed_batch` 和 `time_contract` 不因近似时间或阶段流程被压成单值，条目继续为 `recipe_fact_checked`、非 executable。

## 验证

- r175 专项测试：2/2
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`
- `node tools/check-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-recipes.mjs`
- `git diff --check`
