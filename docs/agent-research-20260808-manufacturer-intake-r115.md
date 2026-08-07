# 厂商官方米饭/粥/一锅主餐候选 intake · r115

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260807-national-r114`，854 条
范围：只做研究 intake；不改主目录、不改运行时代码、不晋升 `executable`、不部署。

## 检索与去重纪律

- 本轮通过 web-access 的浏览器 CDP 打开官方页面；Zojirushi 页面直接在浏览器 DOM 读取，Tiger/Philips/Panasonic 页面用官方页面正文核对。
- 下面 25 条的官方直达 URL 均未出现在当前 854 条 `source_refs[].url` 中；URL 去重不等于语义去重，正式入库仍须按菜名、核心结构、器具版本逐条复核。
- `direct_one_pot` 仅表示页面所示器具流程；需要 Tacook、另锅、煎炒、熟饭或烤箱的条目明确标为边界，不伪装成电饭煲单锅。
- 厂商配方只证明厂商页面给出的名称、用量、程序和流程，不证明地域传统；缺失字段保持空缺，不从同品牌其他页面推算。

## A. 具名候选（当前目录未收录）

| # | candidate_id / 具名菜 | 官方直达来源 | 页面直接证明的量/流程/器具 | 边界与缺口 |
|---:|---|---|---|---|
| 1 | `zojirushi-artichoke-mixed-brown-rice` · Artichoke Mixed Brown Rice | [Zojirushi](https://www.zojirushi.com/app/recipe/artichoke-mixed-brown-rice) | 4–6 份；糙米 2 杯；水至 Brown 2 线或 3 杯；洋葱、罐装洋蓟、橄榄油、香草；米饭煲 Brown，完成倒入平底锅炒好的洋蓟。 | `staged_secondary`；洋蓟和洋葱另锅炒，非同锅主餐；无总时长，需确认剩饭分支。 |
| 2 | `zojirushi-asparagus-scallop-rice` · Asparagus Rice with Seared Scallops | [Zojirushi](https://www.zojirushi.com/app/recipe/asparagus-rice-with-seared-scallops) | 4–6 份；长粒米 1 杯，水至 Long Grain 1 线/约 1¼ 杯；芦笋需焯水、冰镇、搅拌成泥；扇贝另锅煎；米饭煲后拌芦笋泥。 | `staged_secondary`；至少水煮、搅拌机、煎锅三段；鱼贝安全终点未给。 |
| 3 | `zojirushi-beef-katsu-don` · Beef Katsu-Don（牛排盖饭） | [Zojirushi](https://www.zojirushi.com/app/recipe/beef-katsu-don-beef-cutlet-bowl) | 4 份；页面要求约 1.5 lb 牛排、5 杯熟饭；卷心菜焯水，牛排裹粉/蛋液/面包糠后 350°F 油炸，再熬酱汁盖在熟饭上。 | `staged_secondary`；熟饭、焯菜、油炸、酱汁均另锅；不进入电饭煲轮替架。 |
| 4 | `zojirushi-bibimbap-korean-rice-bowl` · Bibimbap（韩式拌饭） | [Zojirushi](https://www.zojirushi.com/app/recipe/-i-bibimbap-i-korean-rice-bowl-) | 4 份；白米 2 杯、水至 White 2 线；萝卜、菠菜、豆芽、胡萝卜、牛肉、4 个蛋和辣酱分别处理，米饭煲煮好后径向摆盘。 | `staged_secondary`；焯菜、炒牛肉、煎蛋，明显不是一锅炊饭；无总时长。 |
| 5 | `zojirushi-chicken-vindaloo-rice` · Chicken Vindaloo with Rice | [Zojirushi](https://www.zojirushi.com/app/recipe/chicken-vindaloo-indian-chicken-curry) | 4–6 份；巴斯马蒂米 2 杯/水 3 杯；鸡腿腌 15 分钟–1 小时；洋葱、鸡肉、土豆、番茄和香料在锅中炒煮约 30 分钟；米饭另煮。 | `staged_secondary`；咖喱和米饭分锅；鸡肉终点页面只写 cooked through，需独立安全核对。 |
| 6 | `zojirushi-chili-cheese-rice-hot-dogs` · Chili Cheese Rice and Hot Dogs | [Zojirushi](https://www.zojirushi.com/app/recipe/chili-cheese-rice-and-hot-dogs) | 2–3 或 4–6 份；长粒米 1/2 杯对应 4/8 oz 牛肉汤+水；米饭 Mixed；辣酱/红腰豆另锅加热，洋葱另锅焦糖化，热狗另制，出锅合盘。 | `staged_secondary`；页面虽称 rice recipe，但主体不是锅内一锅；肉类安全需补证。 |
| 7 | `zojirushi-garlic-beef-yakimeshi` · Garlic-Flavored Beef Yakimeshi | [Zojirushi](https://www.zojirushi.com/app/recipe/garlic-flavored-beef-i-yakimeshi-i-stir-fried-rice) | 4–6 份；米 3 杯，水至 White/Brown 3 线；熟饭出锅冲冷、静置 20 分钟，再用炒锅炒蒜、牛肉、瑞士甜菜和米饭。 | `staged_secondary`；明确熟饭二次烹，不可列为生米一锅饭；牛肉熟度未给温度。 |
| 8 | `zojirushi-garlicky-shrimp-on-rice` · Garlicky Shrimp on Rice | [Zojirushi](https://www.zojirushi.com/app/recipe/garlicky-shrimp-on-rice) | 4 份；虾 1 lb 先腌至少 1 小时；白米 2 杯、水至 White 2 线；虾裹粉后在锅中煎，浇在饭上。 | `staged_secondary`；虾与米分开，海鲜安全终点未给，不能宣传为一锅炊饭。 |
| 9 | `zojirushi-gumbo-bowl` · Gumbo Bowl | [Zojirushi](https://www.zojirushi.com/app/recipe/gumbo-bowl) | 4 份；配方用 4 杯熟长粒米；香肠、面糊、蔬菜、汤和虾在大锅中熬煮，最后浇饭。 | `staged_secondary`；原页不是饭煲流程，纯作“米饭主餐/另锅浇汁”边界记录。 |
| 10 | `zojirushi-gyu-donburi` · Gyu-Don（牛肉饭） | [Zojirushi](https://www.zojirushi.com/app/recipe/-i-gyu-don-i-beef-bowl-) | 4 份；牛肉 1 lb、洋葱、出汁 1 杯；牛肉在酱汁锅中煮约 5 分钟；使用 6 杯熟米装碗。 | `staged_secondary`；页面无生米/饭煲步骤；具名饭碗但不是本工具一锅定义。 |
| 11 | `zojirushi-keihan` · Keihan（鸡肉茶泡饭/鸡汤饭） | [Zojirushi](https://www.zojirushi.com/app/recipe/-i-keihan-i-japanese-chicken-soup-with-rice-) | 4 份；白米 2 杯、水至 White 2 线；鸡胸在汤锅煮 10 分钟，香菇另煮 6 分钟，蛋皮另煎，最后把鸡肉、香菇、蛋丝盖在饭上并浇汤。 | `multi_pot_staged`；至少饭煲+汤锅+煎锅；非一锅同煮。 |
| 12 | `zojirushi-kimchi-fried-rice` · Kimchi Fried Rice | [Zojirushi](https://www.zojirushi.com/app/recipe/kimchi-fried-rice) | 4 份；白米 2 杯、水至 White 2 线；米饭煲好后，泡菜、金枪鱼、泡菜汁在炒锅中炒，再混合米饭，另煎 4 个蛋。 | `staged_secondary`；熟饭二次烹，非锅内一锅；鱼蛋安全需补证。 |
| 13 | `zojirushi-portabella-beef-broccoli-rice` · Portabella Mushroom Rice with Beef and Broccoli | [Zojirushi](https://www.zojirushi.com/app/recipe/portabella-mushroom-rice-with-beef-and-broccoli) | 2–3/4–6 份；茉莉米 1.5/3 杯，牛肉汤 12/24 oz；蘑菇在米饭锅中与米同煮；牛肉另锅煎，西兰花微波后拌入。 | `staged_secondary`；部分同锅但牛肉和西兰花另处理；牛肉安全终点未给。 |
| 14 | `zojirushi-caprese-rice-salad` · Caprese Rice Salad | [Zojirushi](https://www.zojirushi.com/app/recipe/caprese-rice-salad) | 4–6 份；长粒米 2 杯、水 2.5 杯；米饭煲好后冷却约 30 分钟，与番茄、马苏里拉、橄榄、松子、罗勒另拌。 | `staged_secondary`；冷饭沙拉/熟饭二次拌合，非热的一锅主餐；乳制品和坚果需单独提示。 |
| 15 | `zojirushi-cauliflower-salmon-rice` · Cauliflower Creamed Rice with Seared Salmon | [Zojirushi](https://www.zojirushi.com/app/recipe/cauliflower-creamed-rice-with-seared-salmon) | 4–6 份；长粒米 2 杯、水至 Long Grain 2 线/2.5 杯；花椰菜、葱蒜另锅煮后打泥，米拌入泥，三文鱼另锅煎。 | `staged_secondary`；锅、搅拌机和煎锅多段；鱼安全温度未给。 |
| 16 | `zojirushi-asparagus-pea-doria` · Green Peas and Asparagus Doria | [Zojirushi](https://www.zojirushi.com/app/recipe/green-peas-and-asparagus-i-doria-i-) | 2 份；白米 1 杯、水至 White 1 线；芦笋/豌豆焯水，米炒成黄油饭，另做白酱，入焗烤盘加帕玛森并以 475°F 烤。 | `multi_pot_staged`；饭煲+煎锅+烤箱，明确超出一锅电饭煲边界。 |
| 17 | `zojirushi-japanese-dry-curry` · Japanese Dry Curry | [Zojirushi](https://www.zojirushi.com/app/recipe/japanese-dry-curry) | 4 份；白米 2 杯、水至 White 2 线；猪/牛绞肉各 5 oz 与洋葱胡萝卜在炒锅炒，调味汁收干，浇在米饭上。 | `staged_secondary`；米饭和咖喱分锅；可作为具名饭的来源对照，不是锅内一锅。 |
| 18 | `zojirushi-loco-moco` · Loco Moco | [Zojirushi](https://www.zojirushi.com/app/recipe/loco-moco) | 4 份；白米 2 杯、水至 White 2 线；牛肉饼、肉汁、煎蛋分别制作，最后叠在饭上。 | `staged_secondary`；多锅组合且含蛋安全问题，非一锅炊饭。 |
| 19 | `zojirushi-spicy-miso-fish-bowl` · Spicy Miso Fish Bowl | [Zojirushi](https://www.zojirushi.com/app/recipe/spicy-miso-fish-bowl) | 4 份；鳕鱼 20 oz，腌 15 分钟–1 小时；使用 5 杯熟米，鱼、青椒、葱和酱汁均在煎锅处理后盖饭。 | `staged_secondary`；熟饭浇头；鱼安全终点未给。 |
| 20 | `zojirushi-teriyaki-chicken-bowl` · Teriyaki Chicken Bowl | [Zojirushi](https://www.zojirushi.com/app/recipe/teriyaki-chicken-bowl) | 4 份；白米 3 杯、水至 White 3 线；照烧汁另煮约 15+2 分钟，蔬菜另锅煮，鸡胸另锅煎约 4+2 分钟，最后盖饭。 | `staged_secondary`；饭、汁、菜、鸡四段；鸡肉安全需补温度。 |
| 21 | `zojirushi-tuna-seafood-pilaf` · Tuna Seafood Pilaf | [Zojirushi](https://www.zojirushi.com/app/recipe/tuna-seafood-pilaf) | 4 份；金枪鱼 10 oz、虾 8 oz、蘑菇、彩椒、熟米 3 杯；全部在大煎锅翻炒约 1–2 分钟。 | `staged_secondary`；明确熟饭炒制，非电饭煲主餐；海鲜安全终点未给。 |
| 22 | `zojirushi-thai-green-chicken-curry` · Thai Green Chicken Curry with Rice | [Zojirushi](https://www.zojirushi.com/app/recipe/thai-green-chicken-curry) | 4–6 份；茉莉米 2 杯、水至 Jasmine 2 线/2.5 杯；鸡肉、椰奶、茄子、竹笋和咖喱酱在锅中煮，米饭另煮。 | `staged_secondary`；页面后半段为汤锅咖喱，非同锅；鸡肉/虾酱过敏需另审。 |
| 23 | `zojirushi-yakiniku-donburi` · Yakiniku-Donburi（烤肉盖饭） | [Zojirushi](https://www.zojirushi.com/app/recipe/yakiniku-donburi-grilled-beef-bowl) | 2 份；牛肉 0.6 lb，腌 15 分钟–1 小时；使用 2.5 杯熟饭，牛肉在煎锅约 40+10 秒，盖在饭上。 | `staged_secondary`；熟饭+煎肉，牛肉形态/安全需单独记录。 |
| 24 | `tiger-carrot-rice` · Carrot Rice | [Tiger](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/carrot-rice/) | 公开页称 3–4 杯容量；糙米 2 杯、鸡/蔬菜高汤粉、胡萝卜、洋葱、油；所有材料入内锅，水至 Brown 2 线，Brown 程序。 | `direct_one_pot`；页面称“side dish / eats like a meal”，蛋白不足；无总时长，需确认实际机型。 |
| 25 | `tiger-saffron-rice` · Saffron Rice | [Tiger](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/saffron-rice/) | 3–4 份；茉莉米 1 杯、鸡汤 1¾ 杯、洋葱、蒜、油、藏红花；除奶酪外全部入内锅，Plain 程序，出锅加奶酪后焖 5 分钟。 | `direct_one_pot`；调味米/配饭，缺主要蛋白；无总时长；保留为一锅米饭边界候选。 |
| 26 | `panasonic-autocooker-seasoned-rice-kit` · 炊き込みごはん（市販の素使用） | [Panasonic](https://panasonic.jp/cooking/recipe/autocooker/1276.html) | NF-AC1000/AC700；3 合；米 450g，市售炊饭料包 3 合用，调味液+水共 650mL；约 55 分钟；米和料包同锅，程序由 App 发送。 | `direct_one_pot`；依赖市售料包，不能宣称单一传统菜；2/4 合版本需 App，不能推算。 |
| 27 | `philips-prawn-tianjin-don` · 蝦仁天津丼 | [Philips Taiwan](https://www.philips.com.tw/c-e/ho/recipe-overview-page/main-courses/prawn-don.html) | 1 人；白饭 300g、虾 10 支、蛋 3 个、笋 50g、鸡高汤 500g；在 Philips 多功能锅内炒虾头、煎虾蛋、煮汤勾芡，最后浇在熟饭上。 | `staged_secondary`；熟饭盖浇饭，至少多段无水烹调；虾蛋安全需补终点。 |
| 28 | `philips-korean-spicy-octopus-fried-rice` · 韓式辣炒章魚飯 | [Philips Taiwan](https://www.philips.com.tw/c-e/ho/recipe-overview-page/main-courses/korean-spicy-fried-octopus-rice.html) | 1 人；熟章鱼 150g、白饭 300g、洋葱/豆芽/辣椒；内锅先煎章鱼和蔬菜，再加入熟饭与酱料翻炒。 | `staged_secondary`；明确熟饭二次烹，不是生米一锅；章鱼只写熟章鱼，不能替换成生章鱼。 |

## 研究结论

- 本轮最终保留 28 条 URL 去重后的新候选；其中 23 条为 Zojirushi 官方海外页，2 条 Tiger 官方页，1 条 Panasonic 官方页，2 条 Philips Taiwan 官方页（表中编号 1–28；厂商数量按页面证据计，不按语义合并）。
- 真正符合“米饭/粥主餐且一锅直达”的强候选很少：Tiger Carrot Rice、Tiger Saffron Rice、Panasonic 市售料包炊饭是直接同锅；其余大多是“米饭+另锅配料”的具名饭碗、熟饭二次烹或多锅流程。不得为了凑一锅数量把它们改写成一锅。
- 这些厂商页面是器具配方或家庭适配，不证明地域传统。若后续入主目录，`cuisine_family` 应标厂商/器具来源；原文没有给出的份数、时间、水位或安全端点保持 `null`，并单独记录另锅/熟饭边界。
- 语义重复需重点复核：`tiger-carrot-rice` 与 `tiger-saffron-rice` 可能属于配饭而非完整主餐；Zojirushi 的盖饭类不得与真正炊饭 canonical 合并；Philips 两条均使用熟饭，不进入当前“生米一锅”轮替池。

## 建议优先级

1. 仅作为研究/边界资料：Zojirushi 盖饭、熟饭炒饭、Doria、Loco Moco、Keihan、Bibimbap 等 18 条 `staged_secondary`。
2. 可送人工复核但不晋升 executable：Tiger Carrot Rice、Tiger Saffron Rice、Panasonic 市售料包炊饭；均需确认营养角色和具体机型边界。
3. 不建议入 B 试做架：缺主蛋白的配饭、需要烤箱/油炸/煎锅的条目、来源只给熟饭输入的条目。

## 校验

```text
基线 JSON parse: ok (r114 / 854)
新增 URL 去重：28/28 不在当前 source_refs
主 JSON: 未修改
运行时代码/UI/Planner: 未修改
```
