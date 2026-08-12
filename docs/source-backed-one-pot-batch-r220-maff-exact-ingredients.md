# r220 MAFF exact-ingredient closure

基线：`source-backed-one-pot-v1-20260808-global-r219` / 923 条。

本批不新增 canonical、不新增 executable，只把同一日本农林水产省原页已经明确写出的定量字段回填到 3 条既有 `recipe_fact_checked` 条目。没有被原页明确给出的水量、总时长或安全终点继续保留为空；传统锅炊、先煮后炊或后拌边界也不外推为普通电饭煲可执行合同。

| recipe_id | 同源闭合字段 | 原页与证据定位 | 保留边界 |
| --- | --- | --- | --- |
| `jp-mie-tako-meshi` | 4 人；调味料：酱油 2 大匙、酒 3 大匙、味醂 1 大匙、盐 1 小匙 | [MAFF たこ飯（三重）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/tako_meshi_mie.html)：4 人、章鱼 350g、米 3 杯及上述调味量；章鱼盐揉、腌 20 分钟后与米和腌汁同炊 | 来源只说标准水量/腌汁，不给可单值化的加水量；电饭煲为来源器具但未新增可执行安全合同 |
| `jp-ehime-tako-meshi` | 4 人；昆布 5cm 角、酱油 3 大匙、味醂/酒各 0.5 大匙、干油豆腐 0.5 枚；米水同量（`米:水=1:1`） | [MAFF たこ飯（爱媛）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/tako_meshi_ehime.html)：米 3 杯、章鱼 200g、根菜各 20g及上述定量；页面明确“米と同量の水” | 章鱼先盐煮、沸腾时入锅，保持锅炊/分阶段边界；不外推电饭煲适配或总时长 |
| `maff-aichi-hebo-meshi` | 4 人；酱油 50mL、糖 0.5 大匙、味醂 1 大匙、酒 1 大匙、盐 0.5 小匙 | [MAFF へぼ飯（爱知）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/hebomeshi_aichi.html)：米 2 杯、蜂蛹 100g及上述定量；水只写至内锅刻度 | 蜂蛹先炒煮成佃煮后拌入饭，水量/时间仍不是单值合同；特殊食材可得性与安全边界未补写 |

专项测试：`tools/tests/source-backed-one-pot-batch-r220-maff-exact-ingredients.test.mjs`。
