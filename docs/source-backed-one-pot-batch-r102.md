# source-backed one-pot · r102 Tiger 官方电饭煲米饭主餐

本批新增 4 条 Tiger Corporation USA 官方米饭/粥主餐。它们均有直达官方页面、具名、食材量和器具流程，但 Tiger Tacook 页面使用上下层同步烹调，不能改写成普通电饭煲内锅焖饭；Bubur Ayam 的鸡肉还需另锅煮熟后作浇头。因此本批全部保持 recipe_fact_checked，不晋升 executable，不修改运行时。

## 状态变化

| 项目 | r101 | r102 |
|---|---:|---:|
| 目录版本 | source-backed-one-pot-v1-20260807-national-r101 | source-backed-one-pot-v1-20260807-national-r102 |
| 总条目 | 799 | 803 |
| recipe_fact_checked | 687 | 691 |
| executable | 12 | 12 |
| identity_verified | 83 | 83 |
| discovered | 17 | 17 |

## 新增条目与证据边界

### Honey Garlic Chicken

- recipe_id: tiger-honey-garlic-chicken
- 直接来源：[Tiger 官方 Honey Garlic Chicken](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/honey-garlic-chicken/)
- 官方页面明确 5.5 杯机型、白米 2 杯、蒜 3 瓣、酱油 1 汤匙、蜂蜜 3 汤匙、米醋 2 茶匙、鸡胸肉 5 盎司；鸡肉腌 15 分钟后放入 Tacook 盘，白米和水按内锅水位线放入，使用 Synchro-Cooking 同步完成。
- 边界：页面没有通用毫升水量、独立份数、总时长或鸡肉安全终点；水位线只对页面机型成立，保持 liquid_contract:null、fixed_batch:null。

### Teriyaki Chicken

- recipe_id: tiger-teriyaki-chicken
- 直接来源：[Tiger 官方 Teriyaki Chicken](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/teriyaki-chicken/)
- 官方页面明确 5.5 杯机型、白米 2 杯、鸡腿半磅、白葱、马铃薯淀粉和照烧调味量；鸡腿与白葱放 Tacook 盘，白米和水在内锅，使用 Plain/Synchro-Cooking 同步完成。
- 边界：水量只按页面机型水位线，装饰用生菜/小番茄/柠檬不改写成锅内食材；没有通用水量、总时长或禽肉安全终点，不晋升 executable。

### Bubur Ayam – Indonesian Chicken Porridge

- recipe_id: tiger-bubur-ayam-indonesian-chicken-porridge
- 直接来源：[Tiger 官方 Bubur Ayam](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/bubur-ayam-indonesian-chicken-porridge/)
- 官方页面明确这是印尼常见鸡肉粥，3–4 份、准备 20 分钟；米半杯、鸡高汤 2 杯、鸡胸肉 1 块及花生/炸洋葱/香草浇头；按 Porridge 0.5 水位线、60 分钟烹调。
- 边界：鸡胸肉必须另锅煮熟后撕碎再加到粥上；份数是范围，故不写固定批量；高汤 2 杯是材料事实，但实际加液仍按页面机型水位线，liquid_contract:null。

### Chicken Meatballs with Grated Daikon

- recipe_id: tiger-chicken-meatballs-grated-daikon
- 直接来源：[Tiger 官方 Chicken Meatballs with Grated Daikon](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/chicken-meatballs-with-grated-daikon/)
- 官方页面明确 3 杯机型、米 1 杯、鸡肉末 1.8 盎司、老豆腐 1/6 块、洋葱 1/4 杯、鸡蛋 1/4 个、面包糠 2 汤匙、白萝卜 1.2 英寸；鸡肉丸和萝卜在 Tacook 盘，米和水按水位线在内锅，Synchro-Cooking 同步完成。
- 边界：没有独立份数、通用水量、总时长或禽肉安全终点；Tacook 上下层是必要器具条件，不外推普通电饭煲。

## 统一边界

- 以上页面是厂商配方来源，不宣称这些菜名是地域传统菜。
- 页面只证明其列出的机型、水位线和程序；不把水位线换算成通用米水比。
- 所有新条目保留 recipe_fact_checked，不得在未补齐安全、器具和合同证据前进入 executable。
- 本批未新增 recipe 的自由组合，不修改 Worker、前端、Planner 或部署产物。

## 测试

- node --test tools/tests/source-backed-one-pot-batch-r102.test.mjs：2/2 通过。
- 目录 validator：本批 0 个结构化错误。
