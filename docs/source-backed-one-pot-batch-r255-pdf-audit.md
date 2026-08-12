# r255 官方 PDF／HTML 缺口审计

基线为 `source-backed-one-pot-v1-20260808-global-r254`，目录仍 923 条。本批不新增 canonical；只把一条香港卫生署原页从身份档案闭合为 `recipe_fact_checked`，并重新打开台湾农粮署 PDF，确认其中六条仅有课程菜单身份。

## 香港卫生署：焗南瓜海鮮糙米飯

官方 HTML 原页：[EatSmart content_id=388](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=388)。页面 `#content_area` 给出 1 人份材料和 6 步流程：南瓜约 800g、糙米约半碗、橄榄油 2 茶匙、清鱼汤 5 汤匙、秀珍菇 2 隻、海虾 2 隻、鲜鱿鱼 2 片、蓝贻贝 2 隻、鱼柳 2 小块、菜粒 2 汤匙、鲜紫苏叶 6 片，另有适量蒜蓉/白酒和 1/4 茶匙盐；南瓜先焗约 15 分钟，糙米煮至七成熟，海鲜另煮至七成熟，加入配料和米饭 1 分钟后填入南瓜，再焗 5 分钟。

这些事实足以写入固定批量和来源步骤，但不构成电饭煲合同：来源是焗炉 + 分阶段锅具，液体有“清鱼汤 5 汤匙”但步骤另写“适量”，总时长和安全温度终点也没有可直接映射的标量，因此 `liquid_contract`、`time_contract`、`safety_endpoints` 继续保留空值。

## 台湾农粮署：`玩米煮藝一鍋搞定-電鍋飯料理`

官方 PDF：[ids=19409](https://erb.afa.gov.tw/index.php?act=download&ids=19409)。浏览器取得的 PDF 为 5 页活动讲座简章；第 3 页课程表只列示范菜单名称：豆豉肉丁蒸飯、和風栗子飯、麻油雞肉炊飯、蒜味鮮魚炊飯、蕃茄豬肉炊飯、牛肉炊飯。没有这些菜的配料表、米水、步骤、时间或安全终点，不能从菜名补猜。因此六条仍为 `discovered`，但 `source_refs` 已改为 `access_status=opened`、`claim_scopes=[identity]`，准确记录“菜单身份已核实、配方未提供”。

本批未把活动简章中的菜单身份伪装成完整食谱，也未晋升 `executable`。
