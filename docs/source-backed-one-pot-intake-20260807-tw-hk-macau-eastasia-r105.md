# 来源菜饭搜集 intake · 台湾／香港／澳门及东亚补充批次 r105

> 研究日期：2026-08-07  
> 去重快照：开始任务时要求的 `source-backed-one-pot-v1-20260807-national-r104`；写作时共享工作区已出现 `source-backed-one-pot-v1-20260807-national-r105`、824 条记录。本文件按写作时目录再次去重，仅作 intake，不改主 JSON、运行时代码、轮替池或部署产物。  
> 研究范围：台湾农业部／农粮教育平台、香港卫生署 EatSmart、日本农林水产省／地方政府食育站。澳门本轮未找到能同时直接证明具名饭菜与定量做法的一手页面，保留为下一轮检索缺口。

## 边界和状态

- `direct_one_pot`：来源明确在同一锅、电锅或炊飯器中完成；仍须另行闭合安全、液体和机型条件，不能仅凭“飯”字推断电饭煲。
- `extra_pan_or_steam`：有预炒、预煮、蒸、烤、另锅或分阶段投料；可作有出处的研究资产，不能宣传成一键电锅。
- `cooked_rice_second_cook`：来源以熟饭为前提再炒、浇汁、拌合或包裹；不得改写成生米同锅。
- `archive`：具名／地域／技法事实已找到，但视频未给定量、页面只给身份，或主食结构与本工具边界尚不闭合。
- `new_vs_catalog` 以写作时 r105/824 扫描为准；`variant_existing` 不是新增菜名，不应重复入库。

## 新候选与来源证据

| intake_id | 具名菜 | 官方直达来源 | 来源实际证明的事实 | 器具/边界 | new_vs_catalog | 后续状态建议 |
|---|---|---|---|---|---|---|
| TW-R105-01 | 紅棗飯 | [台湾农业儿童网](https://kids.moa.gov.tw/theme_data.php?theme=kids_cooking&id=200) | 米 3 杯、干红枣约 30 颗；红枣清洗划口、浸泡，米与红枣水同入煮饭锅，加水后浸 15–20 分钟再按开关；页面只写“十几分钟”，没有精确总时长。 | `direct_one_pot`；来源明确为煮饭锅，未说明型号；仅米+果干，蛋白与安全合同缺失。 | 是 | `recipe_fact_checked` 候选；缺精确时间、营养平衡说明。 |
| TW-R105-02 | 芋頭鹹粥 | [台湾农业儿童网](https://kids.moa.gov.tw/theme_data.php?id=203&theme=kids_cooking) | 米 1 杯、芋头 250g、芋莖 4 支、猪肉丝 150g、鸡蛋 1 颗、水 1500cc、胡椒盐和盐；米与芋头先煮，转小火焖约 10 分钟，再分次加芋莖、猪肉、蛋至熟。 | `direct_one_pot`；原文是炉上锅、分阶段投料，不证明电锅程序；猪肉和蛋的熟制终点需另补。 | 是 | `recipe_fact_checked` 候选；安全终点与粥浓度/总时长缺口。 |
| TW-R105-03 | 上海菜飯（台湾农业儿童网版本） | [台湾农业儿童网](https://kids.moa.gov.tw/theme_data.php?id=309&theme=kids_cooking) | 白米 2 杯、青江菜 4–5 株、腊肠/肝肠各 1 条、蒜末 2–3 瓣、姜末 1 小匙、鸡高汤 2 杯、绍兴酒 1 大匙、油 1–2 大匙；页面标示 60 分钟。页面把详细来源指向 iCook，分阶段处理的原文仍需另行打开核对。 | `extra_pan_or_steam`；不能把这张卡缺失的步骤补猜成电饭煲合同。 | `variant_existing`（目录已有上海咸肉菜饭） | 作为来源变体挂接；不新增同名条目，需解决来源授权和器具边界。 |
| TW-R105-04 | 米豆鮮蔬拌飯 | [台湾农食教育平台页面](https://fae.moa.gov.tw/theme_data.php?id=3993&sub_theme=recipe&theme=topics) ／ [国健署手册 PDF（第 62 页）](https://fae.moa.gov.tw/files/topics/1383/A02_1.pdf) | 1 人份营养页；PDF 给出糙米 40g、米豆 40g、黑豆 25g、小方豆干 60g、珊瑚菇 50g、绿花椰 35g、红萝卜 35g、干香菇 1.5g、泡菜 40g、海苔 2.5g及调味料；米豆/糙米/黑豆浸泡至少 12 小时后入电锅，蔬菜另以香菇水焖 2 分钟，再加入一碗煮熟的米豆糙米饭拌炒。 | `cooked_rice_second_cook` + `extra_pan_or_steam`；电锅只负责先煮谷豆，最终要炒锅拌合，不能称一键电锅。 | 是 | `recipe_fact_checked` 候选；浸泡和分阶段安全/时间需显式展示。 |
| TW-R105-05 | 白蝦南瓜燉飯 | [台湾农食教育平台（水产试验所）](https://fae.moa.gov.tw/theme_data.php?id=2525&sub_theme=recipe&theme=topics) | 16 尾留尾白虾仁、熟白饭 1 碗、南瓜 1 个、鸿喜菇 65g、姜 10g、洋葱 20g；南瓜先蒸 10 分钟，炒锅炒姜葱、菇、虾和熟饭，加鲜奶油，填入南瓜再蒸 10 分钟。 | `cooked_rice_second_cook` + `extra_pan_or_steam`；明确先炒后蒸，不是生米同锅。 | 是 | `recipe_fact_checked` 候选；虾类熟制终点待补。 |
| TW-R105-06 | 白蝦鳳梨炒飯 | [台湾农食教育平台（水产试验所）](https://fae.moa.gov.tw/theme_data.php?id=2524&sub_theme=recipe&theme=topics) | 白虾仁 12 尾、熟白饭 300g、蛋 2 颗、凤梨 40g、葱 10g、姜 1g、蒜 6g、洋葱 30g、鱼松 1 匙、花生米 10g；蛋和饭先炒，另锅炒洋葱蒜姜、虾、凤梨，最后合炒。 | `cooked_rice_second_cook`；来源明确另锅处理，不能改造成电锅焖饭。 | 是 | `recipe_fact_checked` 候选；虾、蛋安全和坚果过敏标注待补。 |
| TW-R105-07 | 番茄豆腸咖哩飯 | [国健署植物为主饮食手册](https://fae.moa.gov.tw/theme_data.php?id=4030&sub_theme=recipe&theme=topics) | 官方页确认具名、国健署来源、1 人份营养（346 kcal；碳水、蛋白、脂肪均有记录）及视频/图卡存在；文本页未给出完整用量与步骤。 | `archive`；不能从视频标题推断电锅或米水比例。 | 是 | `archive`；待取得官方图卡/视频逐项定量后再进入事实闭合。 |
| TW-R105-08 | 紅藜孔雀貝南瓜燉飯 | [农试所食农教育目录](https://fae.moa.gov.tw/theme_list.php?page=2&search_data%5Bkeyword%5D=%E8%87%BA%E7%81%A3%E8%BE%B2%E7%94%A2%E5%9C%B0%E5%9C%96%3A%E5%8D%97%E7%93%9C&sub_theme=recipe&theme=topics) | 官方目录列出“食尚好味#28”、红藜主题、影片类型和农试所来源；具体份数、米量、液体与步骤仍在视频/图卡中。 | `archive`；不推导蒸/烤/炊饭器具。 | 是 | `archive`；需取得图卡或视频逐帧记录。 |
| TW-R105-09 | 紫米蓮子南瓜飯 | [农试所食农教育目录](https://fae.moa.gov.tw/theme_list.php?page=2&search_data%5Bkeyword%5D=%E8%87%BA%E7%81%A3%E8%BE%B2%E7%94%A2%E5%9C%B0%E5%9C%96%3A%E5%8D%97%E7%93%9C&sub_theme=recipe&theme=topics) | 官方目录列出“食尚好味#46”、莲子主题、影片类型和农试所来源；未在本轮页面文本中取得定量与器具参数。 | `archive`；仅记录具名与官方存在，不宣称可照做。 | 是 | `archive`；待视频/图卡核对。 |
| TW-R105-10 | 烤雞南瓜嫩飯 | [农试所影音目录](https://www.tari.gov.tw/video/index-1.asp?Parser=17%2C9%2C48%2C%2C%2C%2C60%2C%2C%2C%2C2) | 农试所官方影音目录明确列出“玄转食尚好味 #05 烤鸡南瓜嫩饭”；没有在目录文本取得份数、食材量、液体或程序。 | `archive`；不可从名称推导电锅或烤箱转换。 | 是 | `archive`；待官方视频/刊物合同。 |
| TW-R105-11 | 洋蔥炒虱目魚柳拌飯 | [台湾农食教育搜索结果](https://fae.moa.gov.tw/search.php?search_full%5Bkeyword%5D=%E6%8B%8C%E9%A3%AF) | 农业部平台列为“食谱影片”，来源单位为台湾养殖渔业发展基金会；页面确认具名与鱼柳主题，未取得份数、饭态、用量和步骤。 | `archive`；名称可能是熟饭拌合，不能假定生米同锅。 | 是 | `archive`；先确认是否属于 `cooked_rice_second_cook`。 |
| TW-R105-12 | 紅米香蕉飯 | [台湾农食教育平台（花莲区农业改良场）](https://fae.moa.gov.tw/theme_data.php?id=1929&sub_theme=recipe&theme=topics) | 官方页确认太鲁阁族等南岛饮食背景，红米、香蕉、莲藕揉入米饭并一起蒸煮，可选红藜粉；没有固定份数、米水量或时间。 | `direct_one_pot`（原文只说蒸煮）但 `archive`；目录已有同名条目，本次仅补强文化来源。 | `variant_existing` | 不新增；补来源时保留缺量边界。 |
| HK-R105-01 | 肉粒雞蛋飯 | [香港卫生署 EatSmart](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=862) | 1 人：熟白饭 260g、蛋 70g、免治瘦猪肉 70g、紫菜 2g、葱 2g；蛋炒粒、猪肉另锅以糖豉油清酒煮熟，铺熟饭面。 | `cooked_rice_second_cook`；双锅浇饭，明确不是生米同锅。 | 是 | `recipe_fact_checked` 候选；猪肉/蛋熟制终点待接安全规则。 |
| HK-R105-02 | 蒜蓉貴妃蚌蒸五穀米 | [香港卫生署 EatSmart](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=633) | 4 人：贵妃蚌 4 只、五谷米（黑糯米/糯米/糙米/薏米/珍珠米）4/5 杯、水 3/4 杯、芥兰 375g、蒜蓉和调味；米蒸 2 小时，芥兰焯熟，贝加蒜蓉蒸 3 分钟后铺饭面。 | `extra_pan_or_steam`；蒸米、蒸贝、焯菜分阶段，器具是蒸制流程，不等价电饭煲。 | 是 | `recipe_fact_checked` 候选；贝类安全终点和长时蒸制待复核。 |
| HK-R105-03 | 蘋果鮮雜菜粒炒飯 | [香港卫生署 EatSmart](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=1090) | 2 人：甘笋 20g、西兰花 20g、菜心 40g、蛋 1 只、熟白饭 375g、苹果 1/4 个、油 1/2 茶匙、盐 1/4 茶匙；蔬菜和苹果汆水后与蛋、熟饭在镬中炒匀。 | `cooked_rice_second_cook`；熟饭炒制，不能纳入生米轮替。 | 是 | `recipe_fact_checked` 候选；蛋安全终点待补。 |
| HK-R105-04 | 橄欖雞絲雙色飯糰 | [香港卫生署 EatSmart](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=576) | 1 人：小黄瓜 3 条、鸡胸 25g、瘦猪肉 10g、紫米饭 1/3 碗、糙米饭 1/3 碗、香菜酥 10g；鸡肉焯熟撕丝，猪肉烘干制肉松，双米饭铺保鲜纸包卷；香菜酥另有 900g 批量配方。 | `cooked_rice_second_cook` + `archive`；饭团和预制配料，不是同锅菜饭；含花生/芝麻等过敏边界。 | 是 | `archive`；记录为熟饭再加工，不能假装一锅炊饭。 |
| HK-R105-05 | 香菇魚腩粥 | [香港卫生署 EatSmart](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=864) | 1 人配料：冬菇 1 只、鲩鱼腩 94g、葱、姜丝、盐；粥底约 18 份：白米 600g、水 6.5L、盐和糖；白米加沸水大火煮约 3 小时，再把配料放入粥底烧滚调味。 | `extra_pan_or_steam`；大批量粥底再分份加料；目录已有同名条目，本次作为官方字段复核。 | `variant_existing` | 不新增；可补粥底规模和鱼类安全说明。 |
| HK-R105-06 | 芋頭鮮蝦五穀蒸飯 | [香港卫生署 EatSmart](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=592) | 2 人：红米 1/3 碗、白米 1/3 碗、芋头半碗、水 1 碗、鲜虾 6 只、冬菇 2 只、玉米粒 2 匙；米芋头先在瓦煲煮 30 分钟，再加虾、菇、玉米煮 15 分钟，大火收 1 分钟。 | `extra_pan_or_steam`；瓦煲分阶段投料；目录已有同名条目，本次只做来源交叉核对。 | `variant_existing` | 不新增；保留瓦煲边界和虾类安全。 |
| HK-R105-07 | 焗南瓜海鮮糙米飯 | [香港卫生署 EatSmart](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=388) | 1 人：南瓜约 800g、糙米半碗、鱼汤 5 匙、虾、鱿鱼、青口、鱼柳、菇、菜粒、紫苏；南瓜先焗，米煮至七成熟，海鲜另锅煮至七成熟，合入南瓜再焗 5 分钟。 | `extra_pan_or_steam`；烤箱、锅和南瓜盅多阶段；目录已有相近条目，不能改写电饭煲。 | `variant_existing` | 不新增；用于核对海鲜饭的真实分阶段流程。 |
| JP-R105-01 | バイ飯（富山） | [日本农林水产省「ばいの煮もの」页面](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/37_16_toyama.html) | 页面在富山「ばいの煮もの」的历史段落明确提到以小バイ及煮汁制作的“バイ飯”曾为渔师伙食并获地方推广；该页实际定量/步骤对应的是贝类煮物，不是バイ飯本身。 | `archive`；不能把煮物页面的 30 只小贝、600mL 出汁等数字移植到バイ飯。 | 是 | `identity_verified`/`archive`；另找バイ飯直接菜谱页后才可事实闭合。 |
| JP-R105-02 | むかごご飯（爱知） | [爱知县食育网](https://www.pref.aichi.jp/shokuiku/shokuikunet/mind/recipe/recipe010.html) | 4 人：米 2 合、糯米 1 合、むかご 200g、盐 1 小匙、昆布 5cm；米浸泡约 30 分钟，按炊饭器刻度加水、盐、昆布和むかご后炊熟。 | `direct_one_pot`；地方政府明确炊饭器，但水量以刻度为准，未给克数；蛋白为空。 | 是 | `recipe_fact_checked` 候选；可作为电饭煲直达样本，仍需营养和防过敏说明。 |
| JP-R105-03 | 香茸ご飯（爱知） | [爱知县食育网](https://www.pref.aichi.jp/shokuiku/shokuikunet/mind/recipe/recipe011.html) | 官方路径确认具名为三河/奥三河地方香茸饭；本轮直接打开超时，尚未取得材料表和炊饭步骤。 | `archive`；不根据搜索摘要编造份数或水量。 | 是 | `archive`；下一轮在原站恢复后再逐字段核验。 |
| JP-R105-04 | 北海道赤飯（北海道） | [日本农林水产省](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/sekihan_hokkaido.html) | 4 人：粳米 1.5 杯、糯米 1.5 杯、水 3 杯、甜纳豆 100g、盐、红姜、黑芝麻等；米浸泡约 30 分钟，锅中加水煮米，熄火焖时加入甜纳豆。 | `direct_one_pot`（炉锅炊煮）但目录已有其他地区赤饭，作为北海道变体；不是电锅参数。 | `variant_existing` | 不新增同名主项；若收录应单列地域变体并保留甜味/器具差异。 |

## 计数和优先级

- 本轮记录 23 条：其中 **17 条为当前 r105/824 未命中的新候选**（TW 10、HK 4、JP 3），6 条是已有条目的官方变体／来源复核或身份档案。新候选中 10 条已有定量与流程，7 条只有官方视频/身份线索；即使有定量的条目，也仍需按器具、安全和米水合同分层，不能直接公开承诺。
- 最值得下一步结构化的是：`紅棗飯`、`芋頭鹹粥`、`米豆鮮蔬拌飯`、`白蝦南瓜燉飯`、`白蝦鳳梨炒飯`、`肉粒雞蛋飯`、`蒜蓉貴妃蚌蒸五穀米`、`蘋果鮮雜菜粒炒飯`、`むかごご飯`。其中只有 `紅棗飯`、`むかごご飯` 原文直接指向煮飯鍋/炊飯器；其余均是熟饭二次加工、瓦煲或分阶段蒸炒。
- 本轮没有澳门候选达到“具名 + 直接打开 + 至少一项定量/流程”标准；澳门保持研究缺口，不以旅游介绍页代替菜谱证据。

## 不得发生的推断

1. 不能把 `extra_pan_or_steam` 或 `cooked_rice_second_cook` 改写成“电饭煲一键完成”。
2. 不能把视频标题、营养页或菜名当作完整用量和水量证据；缺字段保留 `null`。
3. 不能把现有条目的变体重复写成新 recipe；应在来源矩阵中挂 `variant_of` 并保留差异。
4. 不能把日本/港台来源的熟制、安全、米水或器具规则跨地区平均推导。
5. 本 intake 不改变 `catalog_version`、不改主 JSON、CSV、运行时代码，不触发轮替池或部署。
