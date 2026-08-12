# r276 MAFF 牛蒡牛肉饭安全字段回填

- 基线：`source-backed-one-pot-v1-20260808-global-r275` / 923 条
- 当前：`source-backed-one-pot-v1-20260808-global-r276` / 923 条
- 新增 canonical：0
- 新增 executable：0
- 回填条目：`maff-gobo-beef-rice`（`ごぼうと牛肉のごはん`）

## 可证明事实

日本农林水产省原页给出 2 人份、米 2 合、牛腿薄片 150g、牛蒡四分之一根、金针菇 1 袋；牛肉切 2cm 并下味，米与调味液加至内釜 2 刻度，再把牛蒡、金针菇和牛肉铺在米面，用电饭锅炊煮。原页没有证明可迁移到普通电饭煲的固定水量或总时长。

FoodSafety.gov 原页规定 beef steaks/roasts/chops 至少 145°F（63°C），并静置 3 分钟。由于 MAFF 记录的是牛腿肌肉薄片而非绞肉，本批以 `beef_fully_cooked` / 63°C 挂接该安全来源；不把绞肉 71°C 规则套入本条。

## 保留边界

- `status` 仍为 `recipe_fact_checked`，不晋升 `executable`。
- `cooker_adaptation.status` 仍为 `not_adapted`；“电饭锅炊饭”是来源事实，不外推通用机型。
- `liquid_contract` 与 `time_contract` 仍为 `null`，不把水位刻度或未知时长改写成毫升/分钟。
- 本批只回填安全端点，不新增菜名，不拼接其他牛肉配方。

专项测试：`tools/tests/source-backed-one-pot-batch-r276-maff-beef-safety.test.mjs`（先红后绿，2/2）。
