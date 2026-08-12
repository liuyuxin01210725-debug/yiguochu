# 官方米饭／粥饭候选 intake r4（2026-08-07）

> 本文件仅是独立研究候选，不是生产目录变更。去重基线为 `source-backed-one-pot-v1-20260807-national-r107`（835 条）；本轮不修改主 JSON、运行时代码、轮替池、构建产物或部署。

## 收录边界

- `direct_one_pot`：官方页面明确在同一锅、炊饭器或锅中完成；仍需后续闭合安全、液体与机型字段。
- `cooked_rice_second_cook`：来源以熟饭／饭团为前提，再煮、浇、拌或成型；不能改写成生米炊饭。
- `extra_pan_or_steam`：需要预炒、预煮、焯、烤、蒸或另锅；记录真实流程，不包装成一键电饭煲。
- `archive`：只有具名或文化事实，或主食结构不符合一锅饭；保留线索，不补缺失数字。

## 候选清单（10 条；全部是 r107 未收录 URL）

| intake_id | 具名菜 | 官方直达来源 | 页面直接证明的事实 | 器具／流程边界 | 建议状态 |
|---|---|---|---|---|---|
| R4-MAFF-01 | 新玉ねぎのカラフルリゾット（新洋葱彩色烩饭） | [日本农林水产省](https://www.maff.go.jp/j/seisan/kakou/mezamasi/recipe/recipe292.html) | 2 人份；熟饭 200g、清汤 300mL（其中水 150mL）、新洋葱 60g、冷冻什锦蔬菜 70g、咖喱粉、起司 40g；汤煮沸后加熟饭和洋葱中火约 3–4 分钟，再加蔬菜/调味/起司 | `cooked_rice_second_cook`；普通锅完成，来源没有生米或电饭煲步骤 | `recipe_fact_checked` 候选；不是生米菜饭 |
| R4-MAFF-02 | 白菜とハムのゆずこしょう雑炊（白菜火腿柚子胡椒杂炊） | [日本农林水产省](https://www.maff.go.jp/j/seisan/kakou/mezamasi/recipe/recipe285.html) | 2 人份；白菜 2 片、火腿 3 片、熟饭约 1 碗、鸡蛋 1 个、水 2 杯、鸡汤颗粒、柚子胡椒；白菜先炒，加汤煮沸后熟饭煮 5–6 分钟，依次加入火腿和蛋 | `cooked_rice_second_cook`；单锅汤锅，但熟饭前提与鸡蛋后置必须保留 | `recipe_fact_checked` 候选；鸡蛋熟制提示待后续接入 |
| R4-MAFF-03 | エノキダケとコーンのぽかぽか粥（金针菇玉米暖粥） | [日本农林水产省](https://www.maff.go.jp/j/seisan/kakou/mezamasi/recipe/recipe286.html) | 2 人份；熟饭 200g、金针菇 80g、玉米 60g、蛋液 1 个、鸡汤 400mL；汤沸后熟饭小火煮约 5 分钟，再放玉米/金针菇、勾芡和蛋液 | `cooked_rice_second_cook`；单锅粥锅，来源不证明生米炊饭或电饭煲程序 | `recipe_fact_checked` 候选；蛋类终点待补 |
| R4-MAFF-04 | 人参とアスパラガスのピラフ（胡萝卜芦笋鸡汤焗饭式抓饭） | [日本农林水产省](https://www.maff.go.jp/j/seisan/kakou/mezamasi/recipe/recipe021.html) | 4 人份；免洗米 2 杯、胡萝卜 2 根、洋葱 60g、芦笋 4 根、鸡汤 2 杯、油 2 大匙；洋葱/胡萝卜先炒，加入米拌匀后入炊饭器加汤炊熟，出锅混入预煮芦笋 | `extra_pan_or_steam`；炒锅预处理和芦笋预煮后再进炊饭器，不能宣传为未经处理全投料 | `recipe_fact_checked` 候选；预炒/预煮边界待页面化 |
| R4-MAFF-05 | さつまいも入りお茶漬けリゾット（番薯茶泡饭烩饭） | [日本农林水产省](https://www.maff.go.jp/j/seisan/kakou/mezamasi/recipe/recipe004.html) | 1 人份；熟饭 100g、番薯 20g、水 1 杯、茶泡饭调味包 1 袋、橄榄油 1 小匙；番薯先用油轻炒，再加水、熟饭和调味包煮至软 | `cooked_rice_second_cook`；普通锅短时煮，来源不证明电饭煲或生米流程 | `recipe_fact_checked` 候选；仅碳水/根茎，营养角色需标明 |
| R4-MAFF-06 | 北海道赤飯（北海道甘纳豆赤饭） | [日本农林水产省「うちの郷土料理」](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/sekihan_hokkaido.html) | 4 人份；粳米 1.5 杯、糯米 1.5 杯、水 3 杯、甘纳豆 100g、盐、红姜和食红；米浸泡约 30 分钟，锅中加水煮沸后中火 5 分钟、弱火 10 分钟，熄火焖时加入甘纳豆 | `direct_one_pot`（炉上锅）；具名地域版本，甘纳豆在焖时后置，不能与小豆赤饭混为一条 | `recipe_fact_checked` 候选；甜味主食且无蛋白，需营养标签 |
| R4-MAFF-07 | 物相ずし（大分物相寿司） | [日本农林水产省「うちの郷土料理」](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/mossozushi_oita.html) | 4 人份；米 280g（2 合）、寿司酢、干香菇、油揚げ、牛蒡 50g、胡萝卜 80g、香菇水半杯、白身鱼等；米先煮硬饭拌寿司酢，蔬菜/油揚げ用香菇水煮，再混入寿司饭并用物相箱压制 | `cooked_rice_second_cook` + `extra_pan_or_steam`；多阶段煮料和压模，不是一锅生米饭 | `recipe_fact_checked` 候选；鱼与熟饭边界需显式展示 |
| R4-MAFF-08 | 笹寿司（新潟笹寿司） | [日本农林水产省「うちの郷土料理」](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/sasa_zushi_niigata.html) | 4 人份；米 3 合、鲑鱼 60g、蛋 2 个、干蕨 15g、野泽菜 80g、笹 20–24 枚等；米煮硬后拌寿司酢，各种配料分别浸泡/煮/炒/蒸，再以笹叶铺 30g 寿司饭和配料压制 | `cooked_rice_second_cook` + `extra_pan_or_steam`；不是炊饭器一锅，且有多项预处理 | `recipe_fact_checked` 候选；适合作为地域档案，不进入一锅轮替池 |
| R4-MAFF-09 | まご茶漬け（静冈渔师茶泡饭） | [日本农林水产省「うちの郷土料理」](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/36_24_shizuoka.html) | 4 人份；白米 300g、鲹鱼 1 尾、葱 40g、姜 20g、紫苏 4 片、出汁 600cc、盐和酱油；鱼去骨剁碎，饭盛碗后铺鱼，煮沸出汁冲入 | `cooked_rice_second_cook`；生鱼后置且需热出汁，不是同锅炊饭；生食/熟制风险必须单独提示 | `recipe_fact_checked` 候选；鱼类安全边界待补 |
| R4-MAFF-10 | よこすか海軍カレー（横须贺海军咖喱饭） | [日本农林水产省「うちの郷土料理」](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/35_5_kanagawa.html) | 4 人份；熟饭 600g、牛肉 200g、土豆 250g、胡萝卜 15g、洋葱 300g、水 550mL、番茄 150g及咖喱调味；肉裹粉煎，蔬菜炒后加汤番茄小火约 20 分钟，再将咖喱浇熟饭 | `cooked_rice_second_cook` + `extra_pan_or_steam`；饭与咖喱分开，官方还规定咖喱饭配沙拉和牛奶，不改写成电饭煲焖饭 | `recipe_fact_checked` 候选；区域身份真实但不属于单锅米饭 |

## 证据与去重核对

- 以上 10 个 URL 均已直接打开官方原页：前 5 个来自日本农林水产省“ごはんにぴったりレシピ”，后 5 个来自农林水产省“うちの郷土料理”。官方页面分别给出食材/流程或地域具名，未采用搜索摘要替代原文。
- 以 r107/835 的 `source_refs.url` 与规范化菜名去重，10 条均未命中当前目录；其中没有把已有的广岛牡蛎饭、福岛北寄饭、冲绳ヤファラジューシー等重复写入。
- 页面明确以熟饭为起点的条目（R4-MAFF-01/02/03/05/07/08/09/10）统一标 `cooked_rice_second_cook`；R4-MAFF-04 记录预炒/预煮，R4-MAFF-06 才是本批唯一明确同锅炊煮的地域米饭。
- 缺失份数、总时长、跨机型液体或安全终点不从其他版本补齐；后续结构化时应保持 `null` 并把页面器具限制带入 `cooker_adaptation`。

## 后续建议（本 intake 不执行）

1. 若产品仍只开放“来源菜饭轮替”，优先考虑 R4-MAFF-06（北海道甘纳豆赤饭）和 R4-MAFF-04（炊饭器胡萝卜芦笋抓饭式）进入事实结构化审查；两者仍未经过厨房验证。
2. R4-MAFF-02/03/05 是简单、真实、有量的熟饭粥饭，可作为未来“熟饭二次烹”分区，不应混进生米一锅池。
3. R4-MAFF-07/08/09/10 具地域识别度，但需在 UI 明示“熟饭/另锅/冲泡”，不要用“焖饭”或“电饭煲一键”误导。
