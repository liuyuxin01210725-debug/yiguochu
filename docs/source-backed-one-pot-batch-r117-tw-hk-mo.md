# Source-backed one-pot batch r117 · 台湾／香港／澳门官方饭食

日期：2026-08-08
目录版本：`source-backed-one-pot-v1-20260807-national-r117`
基线：r116（861 条）
本批新增：3 条
新增后：864 条

## 本批范围

本批只整合已经直接打开核对的官方来源，不新增 recipe、不改运行时代码、不部署。三条均未晋升 `executable`；其中两条为 `recipe_fact_checked`，一条为澳门官方身份档案 `identity_verified`。

| recipe_id | 菜名 | 状态 | 来源与定位 | 已结构化事实 | 器具／产品边界 |
| --- | --- | --- | --- | --- | --- |
| `afa-ebook8-healthy-ten-grain-rice` | 健康十榖米（健康十谷米） | `recipe_fact_checked` | 台湾农粮署北区分署电子书8，`ebook8-1.html 行268至277` | 糙米、黑糯米、莲子、小米、小麦、红薏仁、荞麦米、燕麦、麦片、芡实各100g；莲子和红薏仁泡10分钟；十种谷物等量混合，以1.2倍水煮熟 | `direct_one_pot` 事实有“煮熟”，但来源未指定锅具、份数或时间；`cooker_adaptation=not_adapted`，不外推电饭煲。营养角色仅碳水＋膳食纤维，不宣称完整蛋白主餐 |
| `hk-startsmart-silk-gourd-seafood-soup-rice` | 胜瓜海皇泡饭 | `recipe_fact_checked` | 香港卫生署幼营喜动校园计划 RecipeID=82，`行43至80` | 4人份；胜瓜300g、冬菇50g、虾仁80g、带子80g、熟饭3碗、清水600mL；腌料豉油½茶匙、糖¼茶匙；水煮滚后所有食材煮约10分钟至熟透 | `cooked_rice_second_cook` + `汤锅`；明确是熟饭入汤，不是生米电饭煲。未提供海鲜温度终点，不补写安全合同 |
| `mo-tourism-portuguese-seafood-rice` | 葡式海鲜饭 | `identity_verified` | 澳门特别行政区政府旅游局，页面行61、75至77 | 官方确认主菜名称，并说明在生米中加入番茄蓉、虾、青口、八爪鱼等海鲜熬制；另有番茄蓉或忌廉汤底两类描述 | `direct_one_pot` 仅为身份／技法线索；无份数、克数、液体量、时间、安全终点或器具，`cooker_adaptation=not_adapted`，不提供完整做法 |

## 结构化纪律

- 三条来源均为官方直达页，`access_status=opened`，来源等级和定位已写入主 JSON；没有用搜索摘要代替原文。
- 健康十榖米保留 `liquid_contract=1.2倍水`，但因为原文没有份数，`fixed_batch=null`；不凭“各100g”推造 servings。
- 胜瓜海皇泡饭保留熟饭、清水600mL和10分钟流程；它不是生米配方，不能进入生米电饭煲轮替池。
- 葡式海鲜饭只有身份和粗粒度技法描述，`fixed_batch`、`liquid_contract`、`time_contract`、`safety_endpoints` 均为空，避免把旅游局介绍扩写成可照做菜谱。
- 虾、带子、青口、八爪鱼等海鲜未附项目安全终点；来源写“煮至熟透”不自动转为温度合同。

## 验证

- 新增 TDD：`tools/tests/source-backed-one-pot-batch-r117-tw-hk-mo.test.mjs`，覆盖版本／数量、三条状态、食材、液体、来源定位、普通汤锅／熟饭二次烹边界、澳门档案缺口。
- 专项测试：2/2 通过。
- 本批不修改主 JSON 以外的运行时代码；不部署、不晋升 `executable`。
