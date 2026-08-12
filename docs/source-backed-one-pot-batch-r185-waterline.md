# r185 现有机型水位合同回填

- 基线：r184 / 923 条；当前：r185 / 923 条。
- 本批新增 canonical：0；新增 executable：0；4 条既有 `recipe_fact_checked` 仅回填来源明确的液体合同。

## 回填内容

1. `tatung-hainan-chicken-rice`：大同电锅内锅水位线 2。鸡腿先用外锅水蒸熟并保留鸡汁，再以同源水位线完成米饭；不外推毫升水量或普通电饭煲。
2. `tatung-paella-style-seafood-rice`：大同电锅内锅水位线 2 至 3。贝类先蒸取汤汁，来源保留动态汤汁与水位范围；不把范围压成单值。
3. `tatung-cajun-chicken-rice`：大同电锅内锅米水位线 2 刻度略下。鸡肉腌制、铝箔托盘与外锅水等阶段边界继续保留，不外推跨机型参数。
4. `tiger-bubur-ayam-indonesian-chicken-porridge`：Tiger Porridge 0.5 水位线。鸡高汤 2 杯是材料事实，鸡胸另锅煮熟后作为浇头；不把另锅鸡肉误写成同锅安全合同。

所有合同均保留 `source_ids` 与机型/程序范围；未补猜份数、通用液体毫升数、总时长或安全终点。
