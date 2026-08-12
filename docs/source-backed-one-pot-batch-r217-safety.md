# r217：鲑鱼饭与鸡肉丸饭安全终点回填

- 基线：`source-backed-one-pot-v1-20260808-global-r216` / 923 条
- 结果：`source-backed-one-pot-v1-20260808-global-r217` / 923 条
- 新增 canonical：0
- 新增 executable：0

## 回填条目

### `asmi-pink-salmon-rice-bowls`

阿拉斯加海产协会官方页面给出电饭煲粉红鲑鱼饭：2 份、米和水及鱼/蔬菜定量，鲑鱼与米饭、蔬菜一同进入 steam 或 white rice 程序。本批只挂现有 `S-SAFETY-TEMPERATURES-1` 的鱼类 63°C 终点（`seafood_fully_cooked`），不修改来源的液体、约 40 分钟合同、可选鸡蛋后置蒸制或电饭煲程序边界。

### `tiger-chicken-meatballs-grated-daikon`

Tiger 官方页面明确鸡肉末与豆腐、洋葱、鸡蛋和面包糠拌匀成丸，再与白萝卜放入 Tacook 盘，与内锅白米同步烹调。本批只挂现有 `S-SAFETY-TEMPERATURES-1` 的禽肉 74°C 终点（`poultry_fully_cooked`），不改 Tiger 水位线、Tacook 两层器具边界、份数/总时长缺口。

两条均是已有 `recipe_fact_checked` 条目的安全字段回填，不把外部安全指南伪装成原菜谱步骤，也不外推为普通电饭煲执行合同。

## 验证

- `tools/tests/source-backed-one-pot-batch-r217-safety.test.mjs`：先红后绿，2/2
- `node tools/build-source-backed-one-pot-catalog.mjs --write`
- `node tools/build-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-recipes.mjs`
- `git diff --check`

本批仍是既有事实条目的安全字段回填，不代表厨房实测、人工批准或生产上线。
