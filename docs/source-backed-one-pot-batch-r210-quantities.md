# r210：三条官方定量合同回填

## 变更范围

- 基线：`source-backed-one-pot-v1-20260808-global-r209`，923 条
- 结果：`source-backed-one-pot-v1-20260808-global-r210`，923 条
- 新增 canonical：0
- 新增 executable：0
- 本批只回填已有条目的同源 `fixed_batch`；另为 Tiger 蔬菜饭回填官方页面明确的烹调总时长 65 分钟。

## 回填条目

### `r60-tiger-takeout-vegetable-fried-rice`

- 来源：[Tiger Take Out Style Vegetable Fried Rice](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/take-out-style-vegetable-fried-rice/)
- 原页明确 4 份，5.5 杯机型配方：生白米 2 cups、混合蔬菜 3 cups、酱油 1/4 cup、姜/蒜各 1 tbsp、葱 4 根、鸡汤 1 3/4 cups、芝麻油 2 tsp、豌豆 1/2 cup、鸡蛋 2 个。
- 原页 Cooking 字段为 65 min；步骤同时保留 Mixed 50 分钟与出锅后约 15 分钟焖熟豌豆的边界。
- 没有把步骤中另加的米用水与鸡汤合并成完整液体合同，因此 `liquid_contract` 仍为 `null`。

### `tiger-brown-rice-curry-pilaf`

- 来源：[Tiger 玄米カレーピラフ](https://www.tiger-corporation.com/ja/jpn/feature/recipe/post57/)
- 原页明确 3 人份：玄米 2 cups、香肠 80g、胡萝卜 30g、蘑菇 3 个（30g）；鸡汤 600mL 与 90 分钟合同此前已在目录中。
- 红椒、玉米、葡萄干和黄油是出锅后加入，保持原方连续步骤；不外推普通白米程序。

### `panasonic-taiwan-cabbage-mackerel-rice`

- 来源：[Panasonic Cooking Taiwan 高麗菜鯖魚炊飯](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/3638)
- 原页明确 3 人份：白米 1 杯、高丽菜 4–5 叶、薄盐鲭鱼 1 片、黑木耳 2 小朵、鸿喜菇 1/4 盒、玉米笋 2 根、红萝卜 1/4 小根、毛豆仁 1/4 杯、昆布 5cm、盐/酱油各 1/2 小匙。
- 1.1 杯热水及 NU-SC300B 原味蒸/末 5 分钟投料继续沿用已有合同；这是蒸气烘烤炉版本，不转换成普通电饭煲。
- 鱼类安全终点与总时长仍未无损闭合，继续保留空安全数组和空时间合同。

## 验证

- `tools/tests/source-backed-one-pot-batch-r210-quantities.test.mjs`：3/3
- `node tools/check-source-backed-one-pot-catalog.mjs --check`：923 条、artifacts 一致
- 未晋升 executable，未改 runtime/UI，未部署。
