# 厂商/官方米饭候选 intake · r113

日期：2026-08-07  
基线：`source-backed-one-pot-v1-20260807-national-r112`，849 条  
范围：只做研究 intake，不改主目录、不改运行时代码、不晋升 `executable`、不部署。

## 本轮规则

- 以下链接均为厂商/官方机构的直达原页，已通过 web-access 打开核对标题及页面字段；不把搜索摘要当作配方事实。
- 用 Node 对 `source_refs[].url` 做了 r112 URL 去重；表中 20 条的直达 URL 当前不在主目录。URL 去重不等于语义去重，正式入库仍须按菜名、核心结构和版本逐条复核。
- `direct_one_pot` 只表示页面描述的器具流程，不表示普通电饭煲都能照搬。需要 Tacook、特定机型、另锅、炒锅或熟饭二次烹的条目均明确标注边界。
- 缺失的份数、时长、水量、程序或安全信息保持“未给出”，不从同品牌/同类页面推算。`B 试做架` 仅给出研究建议，不代表已通过厨房验证。

## 20 条未入目录候选

| # | candidate_id / 具名菜 | 官方直达来源 | 页面直接证明的事实（不扩写） | 流程/器具边界 | 缺口与 B 架判断 |
|---:|---|---|---|---|---|
| 1 | `tiger-usa-keema-curry-chickpeas` · Keema Curry with Chickpeas（キーマ カレー） | [Tiger](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/keema-curry-with-chickpeas/) | 2 杯白米；牛肉末、猪肉末各 1/8 lb；鹰嘴豆 1/3 cup；洋葱、胡萝卜；咖喱粉、番茄酱、姜、汤粉。页面给出 Tacook 板与 Plain/Synchro-Cooking。 | `direct_one_appliance_parallel`；Tacook 板与内锅同时做咖喱和米饭；页面列 JKT-S/JAX-T/JBV/JBX 等机型。 | 份数、米饭水量、总时长未给；肉类安全终点未给。可列 B 研究候选，正式试做前需机型和熟制记录。 |
| 2 | `tiger-usa-century-egg-fish-porridge` · Century Eggs and Fish Fillet Porridge | [Tiger](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/century-eggs-and-fish-fillet-porridge/) | 2 份；5.5 杯机（10 杯机加倍）；米 1/2 cup、白鱼 3.5 oz、皮蛋 1、姜 3 inch；盐、麻油、白胡椒；粥线 0.5、70 min。 | `direct_one_pot`；鱼先拌调味冷藏，米/鱼/皮蛋/姜进内锅，Porridge 70 min。 | 鱼的安全温度未给，鱼腌制时长“a while”未定。可列 B，需补鱼类熟制证据。 |
| 3 | `tiger-usa-filipino-pork-rice` · Filipino Style Pork With Rice | [Tiger](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/filipino-style-pork-with-rice/) | 2 份；5.5 杯机；米 2 cups、猪肉 1/2 lb、蒜、八角；橙汁、糖、酱油、蚝油、醋、甜酱油、绍兴酒等腌料。 | `direct_one_appliance_parallel`；猪肉腌后放 Tacook 板，米和水在内锅，Synchro-Cooking；成品猪肉作为米饭配菜。 | 页面未给米饭水量、总时长；猪肉安全终点未给。可列 B，需确认 Tacook 型号与熟制。 |
| 4 | `tiger-usa-fragrant-jasmine-pilaf` · Fragrant Jasmine Rice Pilaf | [Tiger](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/fragrant-jasmine-rice-pilaf/) | 2 cups 茉莉米；黄油、橄榄油、红葱头、孜然、肉桂、盐；低钠鸡汤 2¼ cups；花生和香菜作表面。 | `direct_one_pot`；所有主体材料入内锅，Quick 程序，结束后去肉桂并加花生/香菜。 | 页面称主菜但正文称 side dish；份数、总时长未给，蛋白不足。暂不进 B，作为米饭配方资料。 |
| 5 | `tiger-usa-tomato-cheese-risotto` · Tomato Cheese Risotto | [Tiger](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/tomato-cheese-risotto/) | 3–4 份；短粒米 2 cups、洋葱、蒜、橄榄油、帕玛森 1 cup、樱桃番茄 25 个；水至普通米 2 线；米浸泡 30 min；Plain 程序。 | `direct_one_pot`；番茄和半量奶酪入锅，出锅拌余下奶酪。 | 总时长未给；奶酪/番茄提供蛋白有限。可作为 B 低优先候选，需厨房验证稠度和份量。 |
| 6 | `tiger-usa-saffron-rice` · Saffron Rice | [Tiger](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/saffron-rice/) | 3–4 份；茉莉米 1 cup、橄榄油、洋葱、蒜、鸡汤 1¾ cup、藏红花 6 丝；Plain 程序；成品加奶酪并焖 5 min。 | `direct_one_pot`；米、汤和调味全部入内锅。 | 页面未给总时长；更像调味米/配饭，缺主蛋白。暂不进 B。 |
| 7 | `tiger-usa-coconut-rice-beans` · Coconut Rice and Beans | [Tiger](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/coconut-rice-and-beans/) | 页面列 3 cups coconut rice、橄榄油、蒜、洋葱、孜然、多香果、甜椒、番茄、罐装红腰豆 3 cups。 | `staged_secondary`；正文是在深煎锅中炒香和加热，另链到“如何做椰香米饭”，不是内锅一锅煮。 | 米的生熟状态、水量、份数、时间均未给；不进入 B，保留为熟饭/另锅边界候选。 |
| 8 | `tiger-usa-seafood-paella` · Seafood Paella（Tiger USA 版本） | [Tiger](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/seafood-paella/) | 4 份；5.5 杯机（10 杯机加倍）；米 3 cups、虾、鱿鱼、贻贝、蛤蜊、鸡腿、洋葱、番茄、甜椒、橄榄、藏红花；白酒 100 ml；Plain 水位 3/Mixed 程序。 | `staged_pan_then_rice_cooker`；贝类另锅白酒蒸取汁，米和鸡肉入锅，出锅前再蒸甜椒/橄榄/番茄并与海鲜合拌。 | 主目录已有 Tiger 日文海鲜炊饭/西班牙饭版本，故本条可能是同一菜的英文器具版本，不能直接当新 canonical；仅作来源版本对照，暂不进 B。 |
| 9 | `panasonic-kayanoya-dashi-rice` · 茅乃舍だし だし炊きごはん | [Panasonic](https://panasonic.jp/cooking/recipe/suihan/0966.html) | 4 份；SR-V10BA/SR-V18BA；白米 2 合、茅乃舍だし 1 袋；水至白米/无洗米 2 线；白米/炊込み程序，出锅翻松。 | `direct_one_pot`；米和调味包同锅。 | 只有碳水/调味，非完整主餐；无总时长。暂不进 B，作为器具程序基线。 |
| 10 | `panasonic-kayanoya-vegetable-dashi-rice` · 茅乃舍 野菜だし だし炊きごはん | [Panasonic](https://panasonic.jp/cooking/recipe/suihan/0968.html) | 4 份；SR-V10BA/SR-V18BA；白米 2 合、野菜だし 1 袋；水至白米/无洗米 2 线；炊込み程序。 | `direct_one_pot`；同锅煮饭。 | 没有可见蔬菜/蛋白，仅调味包；无总时长。暂不进 B。 |
| 11 | `zojirushi-jasmine-tofu-broccoli-edamame` · Jasmine Rice with Tofu, Broccoli and Edamame | [Zojirushi](https://www.zojirushi.com/app/recipe/jasmine-rice-with-tofu-broccoli-and-i-edamame-i-) | 4 份；茉莉米 2 cups、水至 Jasmine 2 线（约 2.5 cups）、盐；豆腐 12 oz、西兰花 1 cup、毛豆 1/2 cup、番茄、酱油/米醋。 | `staged_secondary`；米先在饭煲煮，豆腐腌渍、蔬菜另用微波加热，出锅后拌入。 | 不是一锅同煮；适合作为熟饭二次拌合研究，不进当前 B。 |
| 12 | `zojirushi-tropical-fried-rice` · Tropical Fried Rice | [Zojirushi](https://www.zojirushi.com/app/recipe/tropical-fried-rice) | 4–6 份；茉莉米 2 cups、水至 Jasmine 2 线/约 2.5 cups；另列火腿、鲜虾、菠萝、葡萄干、洋葱胡萝卜及酱料。 | `staged_secondary`；先饭煲煮饭，再用大煎锅炒香料、火腿和虾，最后加入熟饭及水果。 | 明确是熟饭二次烹，非电饭煲单锅；不进入 B。 |
| 13 | `zojirushi-sausage-onion-ketchup-egg-rice` · Rice with Sausage, Onion, Ketchup and Sunny-Side-Up Egg | [Zojirushi](https://www.zojirushi.com/app/recipe/rice-with-sausage-onion-ketchup-and-sunny-side-up-egg) | 4–6 份；白米/糙米 3 cups，水至相应 3 线；香肠、洋葱、混合蔬菜、鸡蛋、鸡汤、番茄酱等。 | `staged_secondary`；米饭煮好后放凉，另锅炒香肠蔬菜，另锅煎蛋，再组合。 | 典型熟饭二次烹，不能伪装成一锅饭；不进 B。 |
| 14 | `zojirushi-italian-sausage-peppers-tomato-rice` · Italian Sausage and Peppers Over Tomato Rice | [Zojirushi](https://www.zojirushi.com/app/recipe/italian-sausage-and-peppers-over-tomato-rice) | 2–3 或 4–6 份；白米 1/2 cups；番茄汁/水分别 5/3 oz 或 10/6 oz；香肠、洋葱、三色甜椒、香草另列。 | `staged_pan_then_rice_cooker`；番茄米饭用 Mixed 程序，香肠和甜椒在煎锅另做，最后覆在米饭上。 | 有明确份数和液体，但并非单锅；不进 B，保留为“饭+浇头”边界。 |
| 15 | `zojirushi-vegetable-chuka-don` · Vegetable Chuka-Don | [Zojirushi](https://www.zojirushi.com/app/recipe/vegetable-chuka-don) | 4 份；熟短/中粒米 5 cups；白菜、胡萝卜、香菇、竹笋、荷兰豆、豆芽、蔬菜高汤 1⅔ cups、淀粉水和中式调味。 | `staged_secondary`；蔬菜在炒锅中炒、煮、勾芡，最后盖在已煮好的米饭上。 | 熟饭浇头，不是米饭一锅出；不进 B。 |
| 16 | `zojirushi-summer-curry-brown-rice` · Summer Curry with Brown Rice | [Zojirushi](https://www.zojirushi.com/app/recipe/summer-curry-with-brown-rice) | 4–6 份；糙米 2 cups、水至 Brown 2 线；猪肉末、洋葱、蒜姜、西葫芦、甜椒、土豆、咖喱粉、蔬菜汤、牛奶、苹果、豌豆等。 | `staged_pan_then_rice_cooker`；糙米饭煲煮，咖喱在煎锅/锅中炒煮约 20+5 min，分开盛装。 | 完整量和流程有据，但需两锅；不进 B。 |
| 17 | `zojirushi-vegetable-brown-rice-zosui` · Vegetable Brown Rice Zosui | [Zojirushi](https://www.zojirushi.com/app/recipe/vegetable-brown-rice-i-zosui-i-japanese-rice-soup-) | 3–4 份；糙米 1 cup、水至 Brown 1 线；鸡汤 3 cups、白菜、竹笋、瑞士甜菜、葱、酱油、味醂、鸡蛋。 | `multi_pot_staged`；糙米在饭煲煮，倒计时后在陶锅/荷兰锅煮汤，加入熟饭和蛋。 | 明确是两锅/后加熟饭；不进 B，保留多锅研究边界。 |
| 18 | `zojirushi-wakame-gohan` · Wakame-Gohan (Seaweed Mixed Rice) | [Zojirushi](https://www.zojirushi.com/app/recipe/-i-wakame-gohan-i-seaweed-mixed-rice--i-wakame-gohan-i-seaweed-mixed-rice-1) | 2 份；白米 1 cup、水至 White 1 线；干裙带菜 2 Tbsp、盐、味醂、香葱、麻油、芝麻；米熟后拌入，合盖静置 5 min。 | `direct_cooker_then_finish`；主体在饭煲，裙带菜和调味在出锅后加入。 | 蛋白不足、属于拌饭型；可作为低风险试做候选，但不宣称全程同锅。 |
| 19 | `zojirushi-eastern-mediterranean-brown-rice` · Eastern Mediterranean Vegetables and Brown Rice | [Zojirushi](https://www.zojirushi.com/app/recipe/eastern-mediterranean-vegetables-and-brown-rice) | 2–3/4–6 份两档；糙米 1.5/3 cups、水至 Brown 1.5/3 线、蔬菜高汤；菠菜、洋蓟、番茄、开心果、乳酪等另列。 | `staged_secondary`；米饭煲煮，蔬菜需另煮/另处理，最后拌合。 | 原页明确“to prepare separately”，不进 B。 |
| 20 | `zojirushi-tofu-jasmine-fragrant-rice` · Tofu Jasmine Fragrant Rice | [Zojirushi](https://www.zojirushi.com/app/recipe/tofu-jasmine-fragrant-rice) | 4–6 份；茉莉米 3 cups、水至 Jasmine 3 线或 3¾ cups；豆腐 1 lb、酱油、香菜、花生、青柠。 | `staged_secondary`；米饭先煮，豆腐另碗腌渍，出锅后拌入。 | 不是同锅炊饭；坚果/豆腐安全与营养需另审，不进 B。 |
| 21 | `zojirushi-sweet-rice-adzuki` · Sweet Rice Cooked with Adzuki Beans（赤飯） | [Zojirushi](https://www.zojirushi.com/app/recipe/sweet-rice-cooked-with-adzuki-beans) | 4–5 份；糯米 3 cups、红小豆 1.5 oz、水、芝麻盐；红小豆先在锅中 2 min+20 min 预煮并留汤，饭煲 Sweet 水位 3 程序。 | `staged_pan_then_rice_cooker`；豆类必须先另锅煮，不能把干豆直接放入压力饭煲。 | 真实具名赤饭，但不是无预处理一锅；可作为 B 的“连续流程”候选，需记录预煮锅和安全。 |

## 只作边界观察、不计入上面的 20 条

| candidate_id / 具名菜 | 官方直达来源 | 为什么不计入主候选 |
|---|---|---|
| `tiger-usa-seafood-paella`（同上） | [Tiger USA](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/seafood-paella/) | 主目录已有 Tiger 日文版海鲜炊饭/西班牙饭；英文版可作独立器具/流程证据，但需先做语义版本合并，不另建 canonical。 |
| `zojirushi-rice-porridge-food-jar` · Rice Porridge | [Zojirushi](https://www.zojirushi.com/app/recipe/rice-porridge) | 这是保温焖烧罐，不是饭煲；页面给 12/17/25 oz 罐体、米量和 90 min，但超出本轮电饭煲主餐边界。 |
| `zojirushi-rice-sprinkles-onigiri` · Rice Sprinkles Onigiri | [Zojirushi](https://www.zojirushi.com/app/recipe/rice-sprinkles-onigiri) | 米饭在饭煲，蔬菜 furikake 另用平底锅炒，再捏成饭团；属于熟饭二次加工/便携饭团，不是锅内主餐。 |
| `zojirushi-furikake-rice-sprinkles` · Furikake (Rice Sprinkles) | [Zojirushi](https://www.zojirushi.com/app/recipe/furikake-rice-sprinkles) | 米饭和 bonito 调味料分锅，页面用途是拌饭调味；不作为一锅主餐。 |

## 结论与下一步

- 本轮写入 **21 条候选**（其中 20 条计入主候选表，1 条 Tiger USA 海鲜西班牙饭作为版本对照；另列 3 条边界观察），均未改主 JSON。
- 建议优先送人工复核的强候选：Tiger 皮蛋鱼片粥、Tiger Keema Tacook、Tiger 番茄芝士烩饭、Panasonic 两条だし炊き饭、Zojirushi 赤饭。它们的页面给出了具名、份数或水位/程序中的至少一组可复核字段，但尚未有厨房观察记录。
- 这批多数是厂商适配配方，不等于地域传统；入库时 `cuisine_family` 只能记 manufacturer/器具来源，不能冒充地方菜。需要另锅、熟饭二次烹或只做配饭的条目，保持 `recipe_fact_checked`/`identity_verified` 或 intake，不得晋升 B/executable。
- 未把任何厂商页面的缺省字段用同品牌其他页面补齐；正式落目录前仍需逐条做来源 scope、访问状态、定位和安全合同审查。

## 校验

```text
基线 JSON parse: ok (r112 / 849)
URL 去重：20 条主候选 URL 均未出现在 source_refs；Tiger USA 海鲜西班牙饭另作语义重复人工复核
git diff --check: 待写入后运行
```
