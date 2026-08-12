# 来源菜饭搜集 intake · 台湾/香港/澳门及东亚补充批次 r102

> 研究批次：2026-08-07  
> 去重快照：`source-backed-one-pot-v1-20260807-national-r101`（目录约 799 条；本 intake 不改主 JSON）  
> 目标：补充真实具名的饭、粥、炊饭、釜饭和煲仔饭候选。每条只记录来源实际证明的事实，不把砂锅、釜锅、蒸锅、炒锅或熟饭流程推导成普通电饭煲方案。

## 使用边界

- `direct_one_pot`：来源明确同锅/电锅/炊饭器完成；仍需单独闭合安全、液体和机型条件后才可进入 `executable`。
- `extra_pan_or_steam`：存在预炒、预煮、蒸制、双锅或分阶段流程；可作为菜谱研究资产，不能宣传成一键电饭煲。
- `cooked_rice_second_cook`：来源以熟饭为前提再炒、浇汁或拌合；不改写为生米同锅。
- `archive`：具名和文化/技法事实成立，但主食结构、器具或安全合同尚不适合轮替。

本批来源优先使用香港卫生署 EatSmart 和日本农林水产省（MAFF）直页。缺少水量、时间、份数或安全终点的字段保留为空，不做平均、推断或跨来源拼接。

## 新候选清单（去重 r101）

| intake_id | 具名菜 | 官方直达来源 | 来源实际证明的份数/食材/流程 | 器具与边界 | 状态建议 |
|---|---|---|---|---|---|
| HK-R102-01 | 西紅柿瓜湯西施飯 | [EatSmart 1265](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=1265) | 1 人：灵芝菇 5g、玉米粒 10g、燕麦饭 65g、整只番茄、菜苗、芦笋、冬瓜汤 125ml；冬瓜汤另以冬瓜 305g、胜瓜 38g、姜 3 片、水 500ml 制作；先炒/煮汤，再炒菌菇玉米拌燕麦饭，番茄隔水蒸 6 分钟，最后装配。 | `extra_pan_or_steam`；炒锅、蒸制和另煮汤，不证明电饭煲。 | `recipe_fact_checked` 候选；缺通用电锅参数与安全合同。 |
| HK-R102-02 | 南瓜蝦仁黃金飯 | [EatSmart 1262](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=1262) | 2 人：虾仁 240g、南瓜 1 碗、白米 1/2 杯、燕麦米 1/3 杯、水 1/4 碗、洋葱 1 个；虾腌 10 分钟，南瓜蒸熟，米和燕麦米煮成燕麦饭，炒熟洋葱虾仁后拌入。 | `extra_pan_or_steam`；蒸南瓜、煮饭、炒虾分阶段，不能当单锅生米方案。 | `recipe_fact_checked` 候选；虾类安全终点待闭合。 |
| HK-R102-03 | 番茄蛋鮮牛肉湯泡飯 | [EatSmart 1248](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=1248) | 1 人：大番茄 2 个、薯仔 1 个、姜 3g、水 800ml、鲜牛肉 100g、鸡蛋 1 个、白饭 140g；番茄薯仔煮汤，牛肉入汤，蛋液成汤，最后浇熟饭。 | `cooked_rice_second_cook`；熟饭浇汤，不是电饭煲生米同锅。 | `recipe_fact_checked` 候选；牛肉熟制终点及电锅适配缺失。 |
| HK-R102-04 | 蘋果鮮雜菜粒炒飯 | [EatSmart 1090](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=1090) | 2 人：胡萝卜 20g、西兰花 20g、菜心 40g、蛋 1 个、熟白饭 375g、苹果 1/4 个、油 1/2 茶匙、盐 1/4 茶匙；蔬菜苹果汆水，蛋与熟饭和材料在锅中炒匀。 | `cooked_rice_second_cook`；炒锅熟饭流程。 | `recipe_fact_checked` 候选；不进入生米电锅轮替。 |
| HK-R102-05 | 蘑菇意大利飯配軟芝士 | [EatSmart 982](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=982) | 1 人：意大利米 50g、蔬菜高汤 200ml、西葫芦/番茄/普通蘑菇/冬菇、低脂 Ricotta；高汤煮米约 10 分钟，蔬菜蘑菇煎 1–2 分钟后合煮 5 分钟，拌芝士。 | `extra_pan_or_steam`；炉上高汤、煎锅和分阶段收汁；属于西式米饭候选，不证明电饭煲。 | `recipe_fact_checked` 候选；高汤制备约 1.5 小时、无电锅参数。 |
| HK-R102-06 | 鮮茄牛肉湯飯 | [EatSmart 1244](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=1244) | 1 人：番茄 6oz、牛肉 3oz、玉米粒 1oz、熟白饭 9oz；番茄清汤另用番茄 6oz、水 12oz、糖 1 茶匙，牛肉腌 15 分钟，材料在汤中煮沸 3 分钟后浇白饭。 | `cooked_rice_second_cook`；汤饭装配，不是生米同锅。 | `recipe_fact_checked` 候选；牛肉安全及电锅适配缺失。 |
| HK-R102-07 | 番茄湯田園雜菜泡飯 | [EatSmart 590](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=590) | 4 人：胜瓜 225g、西兰花 15 朵、金菇 1.5 扎、苋菜 225g、娃娃菜 225g、车厘茄 2 粒、玉米粒 1 碗、白饭 4 碗；番茄汤以去皮鸡肉 1/2 只、水 3L、胡萝卜 8 条、番茄 5 个、白萝卜 2 条煲约 1 小时，再把蔬菜放汤煮 3 分钟，浇熟饭。 | `cooked_rice_second_cook`；长时间煲汤后泡饭，熟饭前提。 | `recipe_fact_checked` 候选；禽肉终点和多阶段流程待标注。 |
| HK-R102-08 | 蒜蓉貴妃蚌蒸五穀米 | [EatSmart 633](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=633) | 贵妃蚌 4 只、五谷米（黑糯米/糯米/糙米/薏米/珍珠米）4/5 杯、水 3/4 杯、芥兰 375g；五谷米加水蒸 2 小时，芥兰焯熟，贵妃蚌加蒜蓉蒸 3 分钟后铺饭面。 | `extra_pan_or_steam`；蒸米、蒸贝、焯菜分阶段，不等价电锅。 | `recipe_fact_checked` 候选；贝类安全终点与 2 小时蒸制需复核。 |
| HK-R102-09 | 肉粒雞蛋飯 | [EatSmart 862](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=862) | 1 人：白饭 260g、蛋 70g、免治瘦猪肉 70g、紫菜 2g、葱 2g；蛋炒粒、猪肉另锅加糖豉油清酒煮熟，铺熟饭面。 | `cooked_rice_second_cook`；双锅浇饭。 | `recipe_fact_checked` 候选；不改写为一锅电饭煲。 |
| HK-R102-10 | 粉絲蝦米肉碎蒸蛋配飯 | [EatSmart 752](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=752) | 页面给出 1 人份；粉丝 10g、虾米汤 3g、葱粒 1 茶匙、白饭 1 碗，蛋液与水调匀；粉丝/瘦免治猪肉/虾米入蒸碟，高火蒸约 15 分钟，配白饭。 | `extra_pan_or_steam`；蒸蛋配熟饭，非生米同锅。 | `recipe_fact_checked` 候选；猪肉/虾米熟制和蛋安全需补。 |
| HK-R102-11 | 胡蘿蔔海鮮飯 | [EatSmart 176](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=176) | 4 人：白米 1.5 杯、胡萝卜 1.5 个、洋葱/青椒/红椒各 3/4 个、蛤肉 80g、中虾 100g、鱼肉 100g、鱿鱼 100g、青口 8 只、鸡汤 100ml；米与蛤肉先炒，另一锅炒蔬菜和海鲜，排在饭锅上加鸡汤，小火煮 15 分钟。 | `extra_pan_or_steam`；双锅预炒后饭锅收尾；不推导普通电锅。 | `recipe_fact_checked` 候选；多种海鲜安全终点待闭合。 |
| HK-R102-12 | 意式香草鮮蝦青豆野米飯 | [EatSmart 237](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=237) | 1 人：野米 60g、白米 20g、清汤 4 汤匙、鲜虾 30g、青豆 3/4 杯；米与蒜、清汤煮至七成熟，虾另入锅与野米饭煮熟，再加青豆。 | `extra_pan_or_steam`；七成熟预煮+另锅虾，不是电饭煲一键。 | `recipe_fact_checked` 候选；虾熟制和电锅适配缺口。 |
| JP-R102-01 | さつますもじ（鹿儿岛） | [MAFF 直页](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/satsumasumoji_kagoshima.html) | 4 人：米 280g、水 380cc、醋 45cc、干香菇 8g、干木耳 2g、切干萝卜 40g、牛蒡 50g、胡萝卜 100g、竹笋 50g、萨摩扬/鱼糕、蛋 2 个、地酒 60cc 等；米先炊、配料分别煮/炒，拌寿司饭后再蒸约 20 分钟。 | `extra_pan_or_steam`；具名鹿儿岛寿司饭，但绝非单锅同煮。 | `recipe_fact_checked`/`archive`；保留为地域档案，不能改成电饭煲方案。 |
| JP-R102-02 | 酒ずし（鹿儿岛） | [MAFF 直页](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/sakezushi_kagoshima.html) | 8–10 人：米 5 杯、水 5 杯、昆布、干大根/香菇、竹笋、胡萝卜、蛋、鲷鱼、虾、鱼糕及地酒 3 杯；米先炊，配料分别处理，分层铺入寿司桶，压重石静置 6–8 小时发酵。 | `archive`；酒发酵寿司，非电饭煲主餐。 | `recipe_fact_checked`/`archive`；需单独发酵/生鱼安全边界。 |
| JP-R102-03 | 豚丼（十胜，北海道） | [MAFF 直页](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/butadon_hokkaido.html) | 1 人：猪里脊 150g、葱 1/4 根、酱油 2 大匙、砂糖 1 大匙、味醂 1/2 大匙、熟米饭 200g；猪肉在平底锅煎至熟，另煮酱汁回锅裹匀，盖在熟饭上。 | `cooked_rice_second_cook`；具名地方饭但来源不是米肉同锅。 | `recipe_fact_checked`/`archive`；不推导电饭煲焖饭。 |
| JP-R102-04 | ほうばめし（福井） | [MAFF 直页](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/houba_meshi_fukui.html) | 8 人：熟饭 800g、黄豆粉 4 大匙、砂糖 2 大匙、盐少许、朴叶约 16 张；热饭与甜味黄豆粉包入朴叶，加重物静置使叶香渗入。 | `cooked_rice_second_cook`/`archive`；叶包熟饭，不是炊饭。 | `recipe_fact_checked`/`archive`；只有熟饭及包裹流程。 |
| JP-R102-05 | かきまぶり（和歌山） | [MAFF 直页](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/kaki_maburi_wakayama.html) | 5–6 人：米 4 合、だし 2 杯、高野豆腐 1 块、干香菇 3 枚、竹笋/胡萝卜各 100g、鱼糕、四季豆、蛋 3 个；乾物和蔬菜以调味汁煮至收汁，拌入寿司饭，撒蛋丝/海苔。 | `extra_pan_or_steam`；具名和歌山乡土寿司饭，配料先煮、米另炊。 | `recipe_fact_checked`/`archive`；不等价电饭煲一锅。 |
| JP-R102-06 | もっそうめし（香川） | [MAFF 直页](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/mossou_meshi_kagawa.html) | 20 人：米 1.4kg；油豆腐、胡萝卜、魔芋、竹笋、煮干、牛蒡、干瓢、干香菇等；米先炊，具材以水和酱油/砂糖煮，拌入饭和煮汁，再压入圆柱模。 | `cooked_rice_second_cook`/`archive`；香川祭礼押型饭。 | `recipe_fact_checked`/`archive`；不改成生米同锅。 |

## 初步优先级与缺口

### 可优先进入后续事实闭合

1. **HK-R102-02 南瓜蝦仁黃金飯**：份数、主食/蛋白/蔬菜量完整；缺虾安全终点和电锅边界，适合作为“分阶段电锅”研究而非直接上架。
2. **HK-R102-05 蘑菇意大利飯配軟芝士**：高汤、米、蔬菜和时间明确；可作为炉上“一锅炖饭”档案，不能暗示电饭煲。
3. **HK-R102-11 胡蘿蔔海鮮飯**：4 人、主食与多种蛋白齐全；双锅预炒后饭锅收尾，厨房验证重点是海鲜安全和投料顺序。
4. **HK-R102-01 西紅柿瓜湯西施飯**：蔬菜/燕麦饭结构有营养价值，但连续流程较长，先放试做架。
5. **HK-R102-07 番茄湯田園雜菜泡飯**：具名和营养结构清晰，但以熟饭和长汤为前提，纳入“熟饭二次烹”分区。

### 明确不应伪装为“一锅电饭煲”

HK-R102-03/04/06/07/09/10、JP-R102-01/02/03/04/05/06 都有明确的熟饭浇汁、炒制、蒸制、发酵或押型步骤。它们可以丰富来源档案，但不应进入当前“电饭煲一键轮替”池。

### 下一步缺口

- 所有海鲜、禽肉、猪肉条目补可核验熟制终点；未补前保持 `recipe_fact_checked`/`archive`。
- 香港 EatSmart 菜多以熟饭、煲仔或炒锅为前提；不能从“饭”字推导电饭煲适配。
- MAFF 页面中的“炊饭器/釜/锅”只证明原文器具；任何跨型号米水、水位、程序转换必须另有实做证据。
- 本批不直接写入 `source-backed-one-pot-recipes.v1.json`，不改变目录版本、不改变轮替池。

