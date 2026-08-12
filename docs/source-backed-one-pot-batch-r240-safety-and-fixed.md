# Source-backed one-pot batch r240

## 本批范围

- 基线：`source-backed-one-pot-v1-20260808-global-r239`，923 条。
- 结果：版本升至 `source-backed-one-pot-v1-20260808-global-r240`，仍 923 条；新增 canonical=0、executable=0。
- 只回填同一官方来源已经明确写出的字段；没有把普通锅/重锅流程外推成电饭煲程序。

## 回填条目

### `sg-healthhub-bubur-lambuk`

- 来源：Singapore Health Promotion Board / HealthHub，[Bubur Lambuk](https://www.healthhub.sg/programmes/korangok/resources/bubur-lambuk)，HTML 第 215–263 行及材料/方法段。
- 回填 `fixed_batch.servings=4`；保留原页材料定量：瘦牛肉末 200g、三色杂粮米 200g、主锅水 1500ml、香料糊用水 100ml，以及香料、玉米、青豆、椰奶等定量。
- 新增 `beef_fully_cooked=71°C`，挂现有 FoodSafety.gov 安全来源；原页在加米前将牛肉末炒至变色，安全端点不改变普通锅边界。
- `time_contract` 保持 `null`：页首写烹调 1 小时，而方法段为先煮 40 分钟、再加配料煮 30 分钟，存在同源口径冲突，不能压成单值合同。
- 鸡蛋明确另锅煎后配食；不把另锅步骤并入主锅，也不外推电饭煲。

### `illinois-governors-mansion-chicken-manoomin`

- 来源：Illinois Governor’s Mansion，[Chicken & Rice](https://governorsmansion.illinois.gov/all-recipes/recipe.chicken-and-rice.html)，官方页面第 34–97 行。
- 原文明确鸡腿肉先煎上色取出，蔬菜炒后鸡肉回锅，再加入鸡汤与野米；检索到的官方正文明确为 cubed boneless chicken thighs。
- 新增 `poultry_fully_cooked=74°C`，挂 FoodSafety.gov；保留重锅分阶段流程。
- 份数、总时长、普通锅到电饭煲的等价参数仍缺失，`fixed_batch`、`time_contract` 保持 `null`。

## 验证

- r240 专项测试：3/3 通过。
- 目录结构与来源门禁、`check-recipes`、JSON 解析和 `git diff --check` 在批次收尾时通过。
