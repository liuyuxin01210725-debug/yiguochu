# 厂商官方米饭主餐 intake · r130

**快照基线**：source-backed catalog `r128`，895 条（2026-08-08）。本文件是研究入口，不改主目录，不代表生产收录、`recipe_fact_checked` 或 `executable`。

**检索范围**：Tiger Corporation USA 官方 Rice Cooker recipe API 与其直达页面。页面的产品类别、菜名和链接已从官方页面读取；已在 r128 主目录中以相同 URL 出现的条目不列入本批。来源均为厂商页面，不把厂商改编配方宣称为原产地传统菜。

## 已逐页打开、可进入下一步结构化核验的候选

下表只记录页面明确写出的事实；没有写出的量、时间或安全端点保持“未给出”，不从其他页面补齐。

| 候选 | 直达官方来源 | 页面明确的事实 | 边界判定 | 下一步缺口 |
|---|---|---|---|---|
| Seafood Paella | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/seafood-paella/ | 4 份；米 3 杯；虾、鱿鱼、淡菜、蛤蜊、鸡腿、洋葱、番茄、彩椒、橄榄等；白酒 100 ml；米锅 Mixed；海鲜先在锅中开壳并保留汤，完成后彩椒/橄榄/番茄再蒸 2 分钟 | `staged/extra_pan`，不是单锅直达；Tiger 多型号页面 | 海鲜熟制端点、海鲜锅的器具与时间需独立记录；不可把电饭煲 Mixed 推成普通机型等效 |
| Sekihan（赤饭） | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/sekihan-japanese-sticky-rice-with-azuki-beans/ | 3 杯糯米、红小豆 1/2 杯；红豆先以 2.5 杯水煮两次并留煮豆水；按 Sweet rice 水位 3；Mixed·Sweet 程序；出锅拌芝麻盐 | `staged`（红豆先煮，米锅完成）；Tiger 3-cup cooker | 预煮红豆的时间、熟度及安全边界需单独定位；甜米水位不能移植普通白米 |
| Gyudon（牛丼） | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/gyudon-japanese-beef-bowl/ | 2 份；白米 2 杯、薄切牛肉 1/3 lb、洋葱 1/2 杯；糖 1/2 tbsp、酱油 1 tbsp、味醂 1 tbsp；Tacook 上盘蒸肉汁，内锅煮饭，Plain/Synchro-Cooking | `staged/tacook`，不是普通单内锅；Tiger 3-cup cooker | 牛肉熟制终点和程序时间页面未给；需保持“米饭+上盘牛肉”的结构 |
| Frittata with Rice | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/frittata-with-rice/ | 5.5-cup cooker；鸡蛋 4、火腿 1/3 cup、葱 2、帕玛森 1/4 cup、红椒 1/4、米 2 cups；Tacook 上盘与米同做；Synchro-Cooking | `staged/tacook`，鸡蛋在上盘成型、米在内锅；非单锅混合米饭 | 鸡蛋熟制端点、米的水量和时长页面未给；营养上蛋白主要来自蛋/火腿 |
| Nanakusa Gayu（七草粥） | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/nanakusa-gayu-seven-herb-rice-porridge/ | 2–3 份；白米 1 杯；七草共 5 oz；盐 1/3 tsp；粥水位 1、Porridge 60 min；七草先轻煮、挤水切碎，粥好后加入 | `direct_one_pot` + `staged_topping`；主粥在电饭煲完成 | 七草预煮时间和安全端点未给；不把“养胃/预防疾病”等宣传语作为健康结论 |
| Filipino Style Pork With Rice | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/filipino-style-pork-with-rice/ | 2 份；白米 2 杯、猪肉 1/2 lb、蒜 2–3 瓣、八角 2；腌汁橙汁 3.5 tbsp、糖、酱油、蚝油、醋、甜酱油、绍兴酒；猪肉腌后置 Tacook 上盘，米在内锅，Synchro-Cooking | `staged/tacook`；Tiger 5.5-cup cooker；页面提到 JBX-A 需叠放 cooking plate | 猪肉熟制端点和腌制时长未给；不能把“Filipino style”改写为菲律宾传统身份 |
| Fragrant Jasmine Rice Pilaf | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/fragrant-jasmine-rice-pilaf/ | 2 cups 茉莉米、黄油 1 tbsp、橄榄油 1 tbsp、红葱头、孜然、肉桂、盐、低钠鸡汤 2¼ cups；Quick 程序；完成后撒花生和香菜 | `direct_one_pot`，但页面明确称 side dish，蛋白不足 | 只可作为配饭/档案候选；若进入主餐架，必须明确“不含独立蛋白”，不能包装成均衡主餐 |

## 已在官方索引发现、待逐页抽取原文的新增候选

以下页面均为 Tiger 官方直达页，按 URL 与 r128 主目录去重后未找到。此表只作为 intake；在逐页核对份数、配料、液体、程序、流程前，不得写入主 JSON。

| 候选 | 直达官方来源 | 初步边界（待核） |
|---|---|---|
| Korean Braised Short Ribs in a Rice Cooker | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/korean-braised-short-ribs-in-a-rice-cooker/ | 可能为米锅炖煮/另备米饭；核对是否同锅米饭，避免把“配饭”算直达 |
| Chipotle Chicken Burritos with Mexican Rice | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/chipotle-chicken-burritos-with-mexican-rice/ | 预计含熟饭/卷饼组装；优先标 `staged/extra_pan`，不得假称一锅主餐 |
| Mediterranean Rice Bowl | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/mediterranean-rice-bowl/ | 需核对米、蛋白和浇头是否分锅完成；可能是 rice bowl 组合而非同锅菜饭 |
| Brown Rice Tomato and Kabocha Risotto | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/brown-rice-tomato-and-kabocha-risotto/ | 直接米锅烩饭候选；需抽取米种、液体、程序、番茄/南瓜数量和是否需中途搅拌 |
| Coconut Rice Recipe | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/coconut-rice-recipe/ | 直达椰香米饭，但可能是配饭；需核对是否含蛋白/蔬菜，暂不当主餐 |
| Rice Cooker Sinigang (Filipino Sour Soup) | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/rice-cooker-sinigang-filipino-sour-soup/ | 可能是汤而非米饭；若无米或仅配饭，归 `archive` |
| Coconut Rice and Beans | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/coconut-rice-and-beans/ | 页面做法实际写大深锅/煎锅，椰香米另有链接；`extra_pan`，不应标 direct_one_pot |
| Poke Bowl and Purple Potato Salad | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/poke-bowl-and-purple-potato-salad/ | 预计熟饭后组装生鱼/沙拉；`cooked-rice/staged`，安全端点需单独处理 |
| Seafood Paella | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/seafood-paella/ | 已逐页核验，重复列入索引只为标记候选在官方库；实际入库只保留上表记录 |
| Frittata with Rice | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/frittata-with-rice/ | 已逐页核验；Tacook 双层结构，不应复制成普通电饭煲做法 |
| Okaka Musubi（饭团） | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/okaka-musubi-rice-ball/ | 熟饭成型/拌料，属于 `cooked-rice`，不是一锅菜饭 |
| Yakimeshi（日本炒饭） | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/yakimeshi-japanese-fried-rice/ | 熟饭二次烹或炒制边界待核；按当前边界先放 `cooked-rice`，不进入生米一锅候选 |
| Rice Cooker Vegan Chana Masala | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/rice-cooker-vegan-chana-masala/ | 需核对是否含米；若仅咖喱/豆类，归 archive，不冒充饭 |
| Pearl Couscous Risotto | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/pearl-couscous-risotto/ | 珍珠蒸粗麦粉不是米；作为其他主食档案，不进入米饭轮替 |
| Rice Cooker Baked Ziti | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/rice-cooker-baked-ziti/ | 意面而非米饭，归 archive |
| Rice Cooker Vegetable Thai Curry | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/rice-cooker-vegetable-thai-curry/ | 咖喱菜本体，需核对是否同锅米；默认非米饭候选 |
| Rice Cooker Apple Cinnamon Steel Cut Oats | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/rice-cooker-apple-cinnamon-steel-cut-oats/ | 燕麦早餐，不是米饭主餐，归 archive |
| Rice Cooker Thai Strawberry Sticky Rice | https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/rice-cooker-thai-strawberry-sticky-rice/ | 甜点，不进入主餐目录 |

## 统一边界与后续动作

1. `direct_one_pot` 只允许页面明确把生米/粥米、主要配料和液体放在同一内锅并给出程序；“配饭”“熟饭再拌”“上层 Tacook”“另锅先煮/后炒”必须分别标出。
2. 厂商页面的机型、内锅水位、菜单名称只证明该机型事实；不外推为普通电饭煲的同等水量或时间。
3. 任何含生禽肉、猪肉、海鲜或鸡蛋的条目，若页面没有独立安全终点，先保留缺口，不晋升 `executable`。
4. 厂商改编页只作为“厂商电器适配配方”资产，不宣称地域传统、原产地身份或普适营养均衡。
5. 下一步按上表顺序逐页打开并补充 `servings / ingredients / liquid / program / process / cooker boundary`；补齐前不改主目录。若逐页发现缺米、缺主餐结构或仅为熟饭/甜点，则保留本 intake 记录并关闭候选。
