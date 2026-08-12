# 来源菜饭目录 r106 批次记录（2026-08-07）

本批以 `source-backed-one-pot-v1-20260807-national-r105`（824 条）为基线，新增 4 条台湾/日本官方来源记录，目录升至 `source-backed-one-pot-v1-20260807-national-r106`（828 条）。四条均保持 `recipe_fact_checked`，没有晋升 `executable`，没有修改运行时代码、UI、Planner，也没有部署。

## 新增条目

| recipe_id | 菜名 | 官方来源 | 直接证据范围 | 边界与缺口 |
| --- | --- | --- | --- | --- |
| `r106-tw-red-date-rice` | 紅棗飯（红枣饭） | [台湾农业儿童网](https://kids.moa.gov.tw/theme_data.php?theme=kids_cooking&id=200) | 官方页给出白米 3 杯、干红枣约 30 颗；清洗划口、浸泡，米与红枣及泡枣水同入煮饭锅，浸约 15–20 分钟后开关煮，完成时间仅写“十几分钟” | 直接证明煮饭锅流程；没有精确水量、总时长、蛋白质或跨机型参数，保持缺省，不宣称营养均衡 |
| `r106-tw-taro-salted-congee` | 芋頭鹹粥（芋头咸粥） | [台湾农业儿童网](https://kids.moa.gov.tw/theme_data.php?id=203&theme=kids_cooking) | 官方页给出米 1 杯、芋头 250g、芋莖 4 支、猪肉丝 150g、鸡蛋 1 颗、水 1500cc；先煮米芋，转小火约 10 分钟，再分阶段加入芋莖、猪肉丝和鸡蛋 | 原器具是炉上锅，属于分阶段投料；猪肉和鸡蛋熟制终点、完整总时长及电饭煲适配未闭合，不改写成一键电锅做法 |
| `r106-tw-rice-bean-vegetable-mixed-rice` | 米豆鮮蔬拌飯（米豆鲜蔬拌饭） | [台湾农食教育平台](https://fae.moa.gov.tw/theme_data.php?id=3993&sub_theme=recipe&theme=topics)、[国健署饮食手册 PDF 第 62 页](https://fae.moa.gov.tw/files/topics/1383/A02_1.pdf) | 1 人份：糙米 40g、米豆 40g、黑豆 25g、豆干 60g、珊瑚菇 50g、绿花椰 35g、红萝卜 35g、干香菇 1.5g、泡菜 40g、海苔 2.5g；谷豆浸泡至少 12 小时，电锅煮熟后蔬菜用炒锅拌合 | 明确是电锅先煮谷豆、再炒锅拌合的熟饭二次烹；没有跨机型水量和总时长，不包装为单锅生米菜饭 |
| `r106-jp-aichi-mukago-gohan` | むかごご飯（爱知むかご饭） | [爱知县食育网](https://www.pref.aichi.jp/shokuiku/shokuikunet/mind/recipe/recipe010.html) | 4 人份：白米 2 合、糯米 1 合、むかご 200g、盐 1 小匙、昆布 5cm；清洗并浸泡约 30 分钟，按炊饭器刻度加水，加入辅料同锅炊煮 | 直接证明爱知县炊饭器流程；水量只有机内刻度、没有精确毫升数、蛋白质或总时长，也不外推到其他机型 |

## 来源与状态纪律

- 四条均使用官方直达页面或官方 PDF，`access_status: opened`，来源显式分级并带定位；没有用搜索摘录替代原文。
- 结构化字段只写来源明确的事实。缺少水量、总时长、安全终点或跨机型转换时保留 `null` 或边界说明，不从其他菜谱拼接。
- 芋頭鹹粥与米豆鮮蔬拌飯保留炉上分阶段/熟饭二次烹的器具边界；红枣饭与むかごご飯虽有煮饭锅/炊饭器流程，也不把单一来源扩大为通用机型合同。
- 本批四条均为资料资产，不代表我方厨房已验证，也不代表已批准公开照做。

## 验证

- `tools/tests/source-backed-one-pot-batch-r106.test.mjs`：3 个测试通过，覆盖版本、数量、四条来源/状态、直接锅与分阶段边界、去重。
- `validateSourceBackedOnePotCatalog`：828 条目录，0 个结构错误。
- source-backed markdown/CSV/gaps artifacts 由 `node tools/build-source-backed-one-pot-catalog.mjs --write` 重建，并以 `--check` 复核；不改运行时构建产物。
