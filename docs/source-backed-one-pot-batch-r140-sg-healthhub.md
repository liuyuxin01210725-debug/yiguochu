# r140 Singapore HealthHub 一锅饭批次

## 批次范围

- 基线：`source-backed-one-pot-v1-20260808-global-r137` / 916 条。
- 结果：`source-backed-one-pot-v1-20260808-global-r140` / 920 条，新增 4 条。
- 来源边界：新加坡 Health Promotion Board / HealthHub 的官方页面或官方 PDF；状态全部为 `recipe_fact_checked`，没有条目晋升 `executable`。
- 运行时、Planner、前端、菜谱生成逻辑均未修改。

## 新增条目

| recipe_id | 具名菜 | 原器具与边界 | 结构化事实保留 | 暂不闭合/不外推 |
| --- | --- | --- | --- | --- |
| `sg-healthhub-nasi-kuning` | Nasi Kuning | 先用 wok 炒米和香料，再转 rice cooker；熟后拌入吞拿鱼、番茄、青豆 | 500 ml 水、炒锅→电饭煲→后拌流程、35 分钟 | 来源无固定份数与数值安全终点；不改写成单一电饭煲同锅 |
| `sg-healthhub-chicken-briyani` | Chicken Briyani | 鸡肉先炒至约八成熟；米另锅煮至半熟；新锅/电饭煲内锅分层收尾 | 4 份、完整原料量、40+60 分钟、半熟米和分层步骤 | 水/鸡汤量未给；不把另锅半熟米改成直接电饭煲；无安全温度 |
| `sg-healthhub-brown-rice-chicken-congee` | Brown Rice Chicken Congee | 电饭煲分阶段投料；鸡肉后段加入并拆丝回锅 | 4 份、糙米 180 g、鸡肉 150 g、蔬菜各 50 g、水 10 cup | 总时长与数值禽肉安全终点未给；不外推其他机型 |
| `sg-healthhub-bubur-lambuk` | Bubur Lambuk | 普通锅煮粥；鸡蛋另用不粘锅煎后配食 | 主锅水 1500 ml、三色米/牛肉末/玉米/青豆/椰奶和分阶段流程 | 来源无固定份数、总时长及数值安全终点；不把另锅煎蛋并入主锅或外推电饭煲 |

## 来源记录

1. [Nasi Kuning](https://www.healthhub.sg/well-being-and-lifestyle/food-diet-and-nutrition/nasi-kuning)：Health Promotion Board 原页 HTML 第 185–245 行。来源明确白米/糙米、姜黄和香料先在 wok 炒，转 rice cooker，加入 2 杯/500 ml 水，熟后拌入吞拿鱼、番茄、青豆；prep 5 分钟、cook 30 分钟。没有固定 yield，不在目录中编造份数。
2. [Chicken Briyani](https://ch-api.healthhub.sg/api/public/content/dcd55c4444624855949b0b1cfaa4e86c?v=5eb0cb6f)：Health Promotion Board 官方 PDF 第 1–2 页。来源明确 prep 40 分钟、cook 60 分钟、4 pax；图片型食材页给出完整香料、1 kg 鸡肉、2 cups 全谷物印度香米、2/3 cup 酸奶、2/3 cup 淡奶等定量；流程明确鸡肉八成熟、米另锅半熟、分层后以普通锅或 rice cooking mode 收尾。水/鸡汤量没有给出，`liquid_contract` 保持 `null`。
3. [Brown Rice Chicken Congee](https://ch-api.healthhub.sg/api/public/content/6f3ac74473de451faa5ed46fdb084ce5?v=57588ce9)：Health Promotion Board `HPB-Asian Recipe v4` 第 17 页（转文本第 669–700 行）。来源明确 4 份、糙米 180 g、鸡肉 150 g、胡萝卜/白菜/蟹味菇各 50 g、水 10 cups；电饭煲先煮米，再分阶段加入鸡肉、蔬菜，鸡肉拆丝回锅。来源未给可复现总时长。
4. [Bubur Lambuk](https://www.healthhub.sg/programmes/korangok/resources/bubur-lambuk)：Health Promotion Board 原页 HTML 第 225–286 行。来源明确香料糊用水 100 ml、牛肉末 200 g、三色米 200 g、主锅水 1500 ml、玉米 150 g、青豆 150 g、椰奶 200 g；普通锅约 40 分钟后再煮约 30 分钟，鸡蛋另锅煎作配食。页面没有固定份数和总时长合同。

## 验证记录

先写失败测试再入库：

```text
node --test tools/tests/source-backed-one-pot-batch-r140-sg-healthhub.test.mjs
```

入库后专项测试 3/3 通过；随后重建目录 Markdown/CSV/缺口报告，并运行目录检查、菜谱聚合门禁和 `git diff --check`。本批不改运行时代码、不部署、不晋升 executable。
