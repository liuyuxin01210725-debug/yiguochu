# r272 Tiger 海鲜炊込み西班牙饭字段闭合

基线：`source-backed-one-pot-v1-20260808-global-r271` / 923 条。  
本批：`source-backed-one-pot-v1-20260808-global-r272` / 923 条。

本批不新增 canonical，也不把多阶段厂商食谱提升为生产菜谱；只把 Tiger 日本原页已经明确给出的固定批次、机型水位、整道调理时间和安全端点写回既有 `tiger-seafood-paella-post118`。

## 同源原文

Tiger [パエリア風海鮮炊込みごはん](https://www.tiger-corporation.com/ja/jpn/feature/recipe/post118/) 原页明确：

- 4 人份：米 3 杯、有头虾 4 尾、鱿鱼 1/2 杯、贻贝 8 个、蛤蜊 12 粒、白葡萄酒 100mL、橄榄油 2 小匙、鸡腿肉 80g、洋葱 1/2 个、蒜 1 片分、青/红椒各 1 个、黑橄榄 4 粒、小番茄 4 个、藏红花 0.3g、鸡汤粉 1 大匙、盐 2/3 小匙、柠檬 4 切；胡椒、香芹和部分盐写作“适量”，未伪造数值。
- 海鲜先在另锅以油和白葡萄酒蒸至贝壳张开，滤出蒸汁；米和调味料入内锅，加水至白米 3 刻度（180 尺寸机型为 6 刻度），鸡肉、洋葱和蒜铺在米面炊煮，最后加入青/红椒、黑橄榄、小番茄并拌入海鲜。
- 页面标注整道“调理时间 55 分钟”。这是来源明确的总时长，不是把 5 分钟海鲜蒸制或 2 分钟焖置阶段相加推导出来的。

## 保留边界

- `liquid_contract` 只写 Tiger 机型白米水位线，不把海鲜蒸汁、鸡汤粉和水位换算成跨机型毫升数。
- 海鲜、贝类和鸡肉安全端点分别挂已有官方安全来源；端点不替代 Tiger 对另锅蒸海鲜、鸡肉同炊和末段回锅的阶段流程。
- 条目仍为 `recipe_fact_checked`，不是 `executable`，不进入生产 72 道基础菜谱或普通电饭煲轮替承诺。

## 验证

- TDD：`tools/tests/source-backed-one-pot-batch-r272-tiger-seafood-paella.test.mjs` 先在 r271 基线下因版本/字段缺失失败，回填后 2/2 通过。
- 回填后需运行 source-backed catalog validator、`check-recipes`、生成物检查和 `git diff --check`。
