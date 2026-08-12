# r142 公开机构一锅饭批次

## 批次范围

- 基线：`source-backed-one-pot-v1-20260808-global-r140` / 920 条。
- 结果：`source-backed-one-pot-v1-20260808-global-r142` / 923 条，新增 3 条。
- 来源：澳大利亚新州地方卫生区、加拿大卫生部等直接打开的一手公开页面/PDF。
- 三条均为 `recipe_fact_checked`，没有条目晋升 `executable`；目录中仍保留缺失字段为 `null`。
- 运行时、Planner、前端、菜谱生成逻辑均未修改；没有把普通锅、微波炉或烤箱参数转换为电饭煲合同。

## 新增条目

| recipe_id | 具名菜 | 原器具与边界 | 结构化事实保留 | 暂不闭合/不外推 |
| --- | --- | --- | --- | --- |
| `au-cclhd-microwave-risotto` | Microwave Risotto | 微波炉单容器；米、鸡汤和蔬菜同一微波安全容器分两段加热 | 4 份；Arborio 米 1 杯、低盐鸡汤 2.5 杯、混合蔬菜 3 杯、芝士 1/3 杯；高火 10 分钟、搅拌后再 10 分钟、静置 5 分钟；可选蛋白必须是已熟鸡肉或罐头鱼 | 来源只给准备时间约 30 分钟，不能从步骤自行计算总时长；微波炉容器不等价电饭煲；无数值安全终点 |
| `ca-health-multigrain-congee` | Multigrain congee with shiitake, ginger and scallion | 原方是普通大锅；原页仅泛称可用 rice cooker/slow cooker，不提供机型、程序或水位 | 4 份；干香菇 6 朵、小麦粒 1/4 杯、白米 1/3 杯、黑米 2 大匙、小米/高粱 1/4 杯、冷水 7 杯；香菇浸泡 12 小时，普通锅煮 75 分钟、每 15 分钟搅拌 | 不把泛称电饭煲提示写成通用程序；无固定蛋白，原页鸡腿只是可选提示；无安全终点 |
| `au-slhd-oven-baked-biryani` | Oven baked biryani | 炉灶预炒后转 180°C 带盖烤盘/烤箱；页面明确改编自 Taste.com.au | 2/4/6 份量表；4 份为油 1 大匙、黄油 1 大匙、洋葱 2 个、咖喱酱 140g、印度香米 1 杯、低盐鸡汤 2 杯、鸡腿 500g、蔬菜 2 杯；预炒约 12 分钟、烤 40 分钟，中途搅拌 | 烤箱/烤盘不等价电饭煲；鸡肉只有“熟透”文字终点、没有数值温度；改编来源不作为传统身份唯一证明 |

## 来源记录

1. [Microwave Risotto（Back to Basics）](https://www.cclhd.health.nsw.gov.au/wp-content/uploads/Back-to-Basics.pdf)：Central Coast Local Health District，PDF 第 27 页（文本行 1064–1089）。来源给出 4 份、准备约 30 分钟、米/汤/蔬菜/芝士量和微波高火 10+10 分钟、静置 5 分钟流程；可选鸡肉/罐头鱼只能在最后 5 分钟加入。目录保持 `time_contract: null`，不把准备时间当总时长。
2. [Multigrain congee with shiitake, ginger and scallion](https://www.canada.ca/en/health-canada/services/food-guide/eating-support/kitchen/recipes/multigrain-congee-shiitake-ginger-scallion.html)：Health Canada 官方 HTML 第 24–60 行。来源给出 4 份、准备 15 分钟、烹调 75 分钟、7 杯水、谷物和香菇用量、普通大锅搅拌流程，并注明可用 rice cooker/slow cooker；目录将总时长记为 90 分钟（准备+烹调），但不生成任何电饭煲程序。
3. [Oven baked biryani](https://slhd.health.nsw.gov.au/yhunger/recipes-tips/soups-stews/oven-baked-biranyi)：Sydney Local Health District，HTML 第 30–67 行。来源给出 2/4/6 人量、4 人准备 10 分钟/烹调 40 分钟、米/鸡汤/鸡肉/蔬菜量，以及炉灶预炒和 180°C 烤箱流程；页面声明改编自 Taste.com.au，目录仅把该公共卫生页面作为本条事实来源并保留改编边界。

## 验证记录

先写失败测试再入库：

```text
node --test tools/tests/source-backed-one-pot-batch-r142-public.test.mjs
```

入库后专项测试 3/3 通过，覆盖目录版本/总数、三条具名菜与官方 URL、来源分级和定位、份数/液体/时间、微波炉/普通锅/烤箱边界，以及不得静默外推电饭煲。随后应重建目录 Markdown/CSV/缺口报告，并运行 `check-source-backed-one-pot-catalog.mjs`、`check-recipes.mjs` 和 `git diff --check`。
