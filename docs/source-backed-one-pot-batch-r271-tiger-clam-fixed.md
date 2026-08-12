# r271 固定批次字段回填：Tiger 蛤蜊番茄饭

基线：`source-backed-one-pot-v1-20260808-global-r270` / 923 条。  
结果：只为已有 `tiger-clam-tomato-rice` 回填同一 Tiger 官方原页明确的固定批次；不新增 canonical、不改变液体或总时长合同、不晋升 `executable`。

## 原文事实

Tiger USA [Clam and Tomato Rice](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/clam-and-tomato-rice/) 原页明确：5.5 杯机为 4 份，材料为 Tiger 量杯米 3 杯、蛤蜊 1/2 lb（250g）、白酒 1/2 cup（100mL）、番茄 1 个、罗勒 4 片和鸡汤块 1 个。蛤蜊先用白酒蒸至开壳、取肉并滤汤；米与蛤蜊汤、鸡汤块和番茄按 Tiger Ultra 水位线炊煮，出锅拌回蛤蜊肉与罗勒。

## 回填范围

- `fixed_batch.servings=4`，只写原页有明确数值的六项材料；每项均挂 `S-TIGER-CLAM-TOMATO-RICE-R65` 的 `quantity` 事实。
- `liquid_contract` 继续为 `null`：原页是“蛤蜊汤 + 鸡汤块后加水至 Ultra 3 刻度（10 杯机为 6）”，不是跨机型的固定毫升量；不把刻度换算成通用水量。
- `time_contract` 继续为 `null`：页面没有绑定这道菜的完整程序分钟数。
- 已有的贝类视觉熟制端点保持不变；前置开壳、指定机型和出锅回拌边界继续保留。
- 条目仍为 `recipe_fact_checked`，不是可直接轮替或生产承诺。

## 验证

- TDD：`tools/tests/source-backed-one-pot-batch-r271-tiger-clam-fixed.test.mjs`，先在 r270 基线下按版本断言失败，回填后 1/1 通过。
- 待批次统一重建 `docs/source-backed-one-pot-recipes.md/.csv` 与 `docs/recipe-gaps.md`，并运行目录聚合门禁和全量回归。
