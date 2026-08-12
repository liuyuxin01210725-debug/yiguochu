# 全球公共机构一锅米饭来源搜集 Intake（r124-public）

**研究日期**：2026-08-08
**去重基线**：主目录 r118/867；另核对 r119–r123 intake。印度、巴基斯坦、土耳其、西班牙、阿根廷、乌兹别克斯坦本轮不重复。
**本批性质**：研究 intake；只写本文件，不修改主 JSON、CSV、运行时代码或 UI，不晋升 executable，不部署。
**来源范围**：大学 extension/食物教育、国家/地方农业与卫生机构、官方旅游与文化机构。官方页面能证明“有这道菜”不等于能证明完整可执行做法。

## 判定口径

- `direct_one_pot`：原文明确在同一锅/同一普通炊具内完成生米与主要配料；仅记录原器具事实，不把普通锅参数推导成电饭煲参数。
- `extra_pan_or_steam`：有预炒、另锅、蒸笼、烤箱或分组件；成品可以是一锅饭，但不能伪装成直接投料。
- `cooked_rice_second_cook`：先煮熟饭，再炒/拌/回锅；属于“熟饭二次烹”候选，不进入生米一锅轮替。
- `archive`：当前一手页面只证明菜名、地域或文化身份，或页面/PDF尚不能直接复核完整字段；只进资料档案。

所有数量、份数、时间、水量均只按来源原文记录。`null` 代表来源没有证明，不允许跨来源补猜。`B试做架`仅表示研究候选，不表示电饭煲可做或已经厨房验证。

## 候选清单

| # | 建议 ID / 具名菜 | 地域 | 直达来源与定位 | 来源实际证明 | 边界 / 缺口 | 建议状态 |
|---:|---|---|---|---|---|---|
| 1 | `global-philrice-kabute-bistek-paella` / Kabute Bistek con Paella | 菲律宾 | [PhilRice](https://www.philrice.gov.ph/must-try-rice-based-recipes-yuletide-season/)（正文候选区） | 2–3 份；米 250g、淡奶 2 杯、水 2 杯、黄油、蒜洋葱、四季豆、番茄、两种蘑菇；页面给出米在奶/水中煮及配料流程。 | 蘑菇 bistek 另行煎制，属于 `extra_pan_or_steam`；未给安全终点，器具不是电饭煲。 | `recipe_fact_checked` 候选；B 否 |
| 2 | `global-philippines-one-pot-chicken-meal` / One-Pot Chicken Meal | 菲律宾 | [菲律宾国家营养委员会 NNC](https://nnc.gov.ph/luzon-region/neda-roi-stirs-for-healthy-diet/)（竞赛报道） | 官方报道确认获奖菜单名称，并按 GO（米）、GROW（鸡）、GLOW（蔬菜）构成完整一锅餐。 | 仅报道身份与营养分组，没有食材量、液体、步骤、时间；`archive`，不当做完整食谱。 | `identity_verified` / archive |
| 3 | `global-philippines-paella-nnc` / Filipino Paella（菲律宾式） | 菲律宾 | [菲律宾 NNC](https://nnc.gov.ph/luzon-region/what-s-for-noche-buena-top-pinoy-favorites/)（Paella 段） | 官方页说明菲律宾式 paella 以糯米为基础，可配鸡肉、chorizo、虾、淡菜等。 | 页面没有单一版本的量、液体、流程或安全终点；多海鲜版本不合并，`archive`。 | `identity_verified` / archive |
| 4 | `global-nwu-one-pot-chicken-rice` / One-Pot Chicken and Rice | 南非（North-West University） | [NWU Consumer Sciences Recipe Book 2024](https://health-sciences.nwu.ac.za/sites/health-sciences.nwu.ac.za/files/files/Consumer_Sciences/Documents/Resepteboek_2024_B5.pdf)，PDF pp.37–38 | 4 份；鸡腿 450g、白米 200g、冷冻蔬菜 225g、洋葱 240g、水 500ml、鸡汤块 20g；鸡肉和蔬菜入锅后加米、汤和水，低火 20–30 分钟。 | `direct_one_pot` 但原文是普通炉灶锅；鸡肉安全终点未写，不能推导电饭煲。 | `recipe_fact_checked` 候选；B 普通锅 |
| 5 | `global-nwu-chicken-fried-rice-lentils` / Chicken Fried Rice with Lentils | 南非（NWU） | 同上，PDF pp.34–35 | 4 份、65 分钟；生米 225g、扁豆 200g、鸡柳 300g、蛋 3 个、蔬菜及水 1250ml，页面给出分别煮米/扁豆、煎鸡肉、炒蛋菜后混合。 | `cooked_rice_second_cook` + 多锅；不进入生米一锅轮替，鸡肉安全终点缺失。 | `recipe_fact_checked` 候选；B 否 |
| 6 | `global-nwu-rice-stir-fried-chicken` / Rice and Stir-Fried Chicken | 南非（NWU） | 同上，PDF pp.33–34 | 4 份、35 分钟；米 200g/水 750ml、鸡肉 350g、蔬菜等；米单独煮，鸡肉蔬菜另锅炒后与米搭配。 | `extra_pan_or_steam`；明确不是一锅完成，作为边界资料，不进入 B。 | `recipe_fact_checked` / archive |
| 7 | `global-nwu-subayai-fried-rice` / Subayai Fried Rice | 南非（NWU） | 同上，PDF p.39 | 页面明确称“one-pot dish of cooked rice, vegetables, eggs, chicken and seasoning”；米 300g、鸡 100g、蛋 2 个、蔬菜 150g、油 25ml 等。 | 实际流程先煮米，再在平底锅煎鸡、蔬菜和蛋，最后混合；`cooked_rice_second_cook`，不是生米同锅。 | `recipe_fact_checked` / archive |
| 8 | `global-nwu-tomato-egg-rice-stir` / Tomato and Egg Rice Stir | 南非（NWU） | 同上，PDF p.65 | 4 份、27 分钟；米 250g、番茄 160g、蛋 1 个、青椒 170g、洋葱 250g、油 45ml；页面写明先煮饭、炒蔬菜、加蛋，再把米回锅。 | `cooked_rice_second_cook`；蛋类终点和熟饭来源边界需另记。 | `recipe_fact_checked` / archive |
| 9 | `global-fnde-arroz-colorido-soy` / Arroz Colorido com Carne de Soja | 巴西（FNDE 学校供餐） | [巴西国家教育发展基金 FNDE PDF](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnae/campanhas/concurso-melhores-receitas/receitas/to-1/receita_escola_blandina.pdf/)（p.1） | 10 份、90 分钟；米 700g、胡萝卜 900g、玉米 560g、葡萄干 200g、大豆蛋白 200g、番茄 400g 等；原文给大豆蛋白浸泡、同一锅炒香后加入米和蔬菜，加热水至覆盖并焖熟。 | `direct_one_pot`（普通锅）；“水至覆盖”不是固定液体合同，安全端点缺失。 | `recipe_fact_checked` 候选；B 普通锅 |
| 10 | `global-fnde-galinhada-ora-pro-nobis` / Galinhada Nutritiva com Ora-Pró-Nóbis e Farofa de Baru | 巴西（FNDE 学校供餐） | [FNDE recipe PDF](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnae/campanhas/concurso-melhores-receitas/receitas/to-1/e93412ac036ebd71e34b8cae593d33f2_receita.pdf/) | 10 份、60 分钟；鸡腿 1.2kg、米、ora-pro-nóbis、baru 等，页面给出先煎鸡，再加洋葱/胡萝卜/米和热水焖煮。 | 来源把 farofa/salad 作为另备组件；`extra_pan_or_steam`。米重量在 PDF 中显示“500KG”异常，必须保留原文并在入库前复核，不能自行改成 500g。 | `recipe_fact_checked` 候选；B 否 |
| 11 | `global-brazil-galinhada-pequi` / Galinhada com Pequi | 巴西（卫生部 Saúde Brasil） | [巴西卫生部](https://www.gov.br/saude/pt-br/assuntos/saude-brasil/eu-quero-me-alimentar-melhor/noticias/2021/caminhos-do-pequi-um-alimento-que-e-a-cara-do-cerrado-brasileiro)（搜索页可见完整摘要，原页需复核） | 半只鸡、桃榄 10 个、水 2.5 杯、米 1.25 杯、洋葱蒜等；原文描述烤鸡、煮桃榄、锅内炒鸡后用桃榄水煮米。 | `extra_pan_or_steam`（烤箱/煮桃榄/锅）；搜索摘要可见但需原页直接打开与安全终点复核。 | `recipe_fact_checked` 待复核 |
| 12 | `global-irga-risoto-frango-legumes` / Risoto de Frango com Legumes | 巴西南里奥格兰德州 IRGA | [IRGA](https://irga.rs.gov.br/risoto-de-frango-com-legumes) | 4 份、每份 360g；米 300g、鸡肉 300g、花椰菜 300g、红椒、乳酪、蔬菜汤 1.5L 等；同一大锅中炒洋葱、米、鸡肉，分次加热汤并收至完成。 | `direct_one_pot` 普通锅；原文未给总时长和禽肉终点，不外推电饭煲。 | `recipe_fact_checked` 候选；B 普通锅 |
| 13 | `global-fundepar-arroz-verdinho` / Arroz Verdinho | 巴西巴拉那州教育供餐 | [Fundepar Recipe Book PDF](https://www.fundepar.pr.gov.br/sites/fundepar/arquivos_restritos/files/documento/2026-04/livro_de_receitas_-_remessas_2025.pdf) | 目录列出 Arroz Verdinho，并给米饭与蔬菜茎叶的组合。 | 页面为 PDF/目录型来源，菜名和分步细节需逐页归档；现阶段按 `cooked_rice_second_cook`/另锅处理，不进入 B。 | `identity_verified` / archive |
| 14 | `global-peru-minsa-arroz-pollo` / Arroz con Pollo（CENAN 版本） | 秘鲁 | [秘鲁卫生部 Minsa](https://www.gob.pe/institucion/minsa/noticias/42250-el-pollo-es-una-importante-fuente-de-fosforo-y-potasio)（HTML 19–39 行） | 1 份；豌豆 20g、胡萝卜 30g、鸡肉 100g、香菜/菠菜、洋葱、米 100g、油 8cc、调味料；原文给先炒香料，再加鸡、豌豆、胡萝卜，降火让米熟。 | `direct_one_pot` 普通锅；液体量、总时长、禽肉安全终点未写；名称为常见 canonical，需与目录去重后再决定是否登记变体。 | `recipe_fact_checked` 候选；B 普通锅 |
| 15 | `global-mexico-senasica-arroz-pollo` / Arroz con Pollo（SENASICA 版本） | 墨西哥 | [SENASICA](https://www.gob.mx/senasica/articulos/te-gusta-la-carne-de-pollo-entonces-esta-receta-es-para-ti)（官方搜索摘要；原页访问受限） | 鸡 5 块、米 3 杯、水 3.5 杯、sofrito、番茄酱、橄榄/酸豆等；原文摘要描述先煎鸡，再在同锅处理 sofrito/米/水，回锅鸡肉焖熟。 | `extra_pan_or_steam`（先取出鸡再回锅）；无固定份数、禽肉终点；需原页直接打开再建事实矩阵。 | `recipe_fact_checked` 待复核 |
| 16 | `global-mexico-sectur-arroz-huerfano` / Arroz Huérfano estilo Saltillo | 墨西哥科阿韦拉·萨尔蒂约 | [墨西哥旅游部 SECTUR](https://www.gob.mx/sectur/es/articulos/arroz-huerfano)（官方搜索摘要；原页访问受限） | 米 2 杯、约 1L 水、培根 100g、牛肉 100g、火腿 50g、坚果；摘要给出米先炒后加液体，肉类另行煎制再合并。 | `extra_pan_or_steam`；无固定份数、安全及完整步骤定位，不能当电饭煲做法。 | `recipe_fact_checked` 待复核 |
| 17 | `global-mexico-agri-arroz-tumbada` / Arroz a la Tumbada | 墨西哥韦拉克鲁斯 | [墨西哥农业部](https://www.gob.mx/agricultura/es/articulos/no-se-te-antoja-un-delicioso-arroz-a-la-tumbada?idiom=es)（官方搜索摘要；原页访问受限） | 米 500g、鱼汤 2L、番茄 500g、鱼/虾/蟹/贝类等；摘要描述锅内先做番茄底、炒米，再按海鲜耐煮程度分段加入。 | `extra_pan_or_steam`/普通锅海鲜饭；海鲜安全、份数、时间需直接打开核验，不外推电饭煲。 | `recipe_fact_checked` 待复核 |
| 18 | `global-indonesia-nasi-lapola` / Nasi Lapola | 印度尼西亚马鲁古 | [印尼卫生部 Ayo Sehat](https://ayosehat.kemkes.go.id/1000-hari-pertama-kehidupan/home)（Nasi Lapola 段） | 3 份；白米 225g、椰肉 200g、煮熟的 tolo 豆 120g、香茅/酸橙叶/盐；页面描述米先煮至 aron，再加入豆和椰肉并蒸约 30 分钟。 | `extra_pan_or_steam`；需蒸制且页面另列 Kohu-Kohu 鱼蔬菜配料，不宣称电饭煲。 | `recipe_fact_checked` 候选；B 否 |
| 19 | `global-indonesia-liwet-fish-cassava` / Liwet Ikan Goreng dan Kari Daun Singkong | 印度尼西亚 | 同上，页面 Liwet 段 | 3 份；Nasi Liwet 米 150g、鸡汤 300ml、香料和油；米在锅中煮，另有炸鱼及木薯叶咖喱。 | `extra_pan_or_steam`/多组件；鱼、咖喱另锅，不能伪装一锅。 | `recipe_fact_checked` / archive |
| 20 | `global-indonesia-nasi-harum` / Nasi Harum | 印度尼西亚 | 同上，页面 Nasi Harum 段 | 页面提到米/糯米浸泡 15–20 分钟、香料与椰奶，先做 aron 再蒸。 | 份数、克数、液体总量与安全缺失；`extra_pan_or_steam`，先 archive。 | `identity_verified` / archive |
| 21 | `global-indonesia-nasi-ayam-kecap-sayur` / Nasi Masak Ayam Kecap Sayur | 印度尼西亚 | [印尼卫生部食谱 PDF](https://ayosehat.kemkes.go.id/pub/files/d8a32723535961f3f2a6e44f0f8ba915.pdf)（p.39；网页摘要可复核） | 3 份；熟白饭 300g、鸡胸 120g、熟鹌鹑蛋 60g、豆腐 150g、青菜 100g、甜酱油 40g、水 50ml、油 20g；鸡肉、豆腐、蛋、青菜在锅中与熟饭回锅。 | `cooked_rice_second_cook`，不是生米一锅；来源已给量但需下载归档 PDF 后才能进入事实矩阵。 | `recipe_fact_checked` 待归档 |
| 22 | `global-indonesia-nasi-ikan-kuah-kuning` / Nasi Ikan Kuah Kuning | 印度尼西亚 | [印尼卫生部食谱 PDF](https://ayosehat.kemkes.go.id/pub/files/d8a32723535961f3f2a6e44f0f8ba915.pdf)（相关 PDF 条目） | 3 份；熟饭、鲭鱼、佛手瓜、天贝、椰奶和水等；鱼另行处理后加入汤/蔬菜，和米饭分开供应。 | `extra_pan_or_steam`/熟饭配汤；PDF 需要本地归档及页面定位，海鲜/鱼安全缺口。 | `identity_verified` / archive |
| 23 | `global-malaysia-nasi-lemak` / Nasi Lemak | 马来西亚 | [Tourism Malaysia](https://www.malaysia.travel/explore/rezept-das-beste-nasi-lemak) | 500g 香米、椰奶约 400ml、水 750ml、盐、香茅、姜；原文明确椰饭可在锅或 rice cooker 中煮。 | 米饭基底可 `direct_one_pot`，但黄瓜、熟蛋、江鱼仔、花生、参巴为另备配菜；不能把整套配菜宣称一锅。 | `recipe_fact_checked`；B 仅米饭基底 |
| 24 | `global-philippines-bringhe` / Kapampangan Bringhe | 菲律宾邦板牙 | [菲律宾驻韩使馆](https://seoulpe.dfa.gov.ph/2013-11-29-06-33-23/advisories/569-ph-s-bringhe-and-other-rice-dishes-take-center-stage-at-the-2018-asean-culinary-festival) | 外交部页面确认 Bringhe 是菲律宾本土 paella，以椰奶和姜黄烹制并参加东盟烹饪节。 | 未给定量、液体、时间、流程和安全，`archive`；不推导电饭煲。 | `identity_verified` / archive |
| 25 | `global-kenya-pilau-kibu` / Kenya Pilau | 肯尼亚 | [Kibabii University Global Meals](https://kibu.ac.ke/global/meals/) | 大学页面确认 Kenya Pilau 具名，米与孜然、豆蔻、肉桂、丁香、洋葱/番茄等香料同锅的文化身份。 | 只有身份及概述，没有定量/液体/时间/安全；肉汁或配菜是否同锅待补，`archive`。 | `identity_verified` / archive |
| 26 | `global-greece-mushroom-mageiritsa` / Mushroom Mageiritsa | 希腊 | [Greek National Tourism Organisation](https://www.visitgreece.gr/experiences/gastronomy/recipes/mushroom-mageiritsa/) | 6 份、45 分钟；蘑菇 500g、菠菜 400g、棕米 100g、白葡萄酒半杯、水 1L、蛋黄/柠檬汁；页面给普通锅逐步焖煮流程。 | `direct_one_pot` 普通锅，但蛋柠汁在碗中调和后回锅，仍需安全终点；不外推电饭煲。 | `recipe_fact_checked` 候选；B 普通锅 |
| 27 | `global-greece-sardine-pilaf` / Sardine Pilaf | 希腊 | [Greek National Tourism Organisation](https://www.visitgreece.gr/experiences/gastronomy/recipes/sardine-pilaf/) | 页面列沙丁鱼、米、洋葱、香草、酒和水，并给普通锅成形流程。 | 鱼需预处理，`extra_pan_or_steam`；鱼类安全、液体和总时长需建矩阵。 | `recipe_fact_checked` 候选；B 否 |
| 28 | `global-greece-mussel-pilaf-tiny-pasta` / Mussel Pilaf with Tiny Pasta | 希腊 | [Greek National Tourism Organisation](https://www.visitgreece.gr/experiences/gastronomy/recipes/mussel_pilaf_with_tiny_pasta/) | 淡菜、鱿鱼、番茄、米/小面、橄榄油；淡菜先在锅中开壳取汁，另锅做酱汁和面。 | `extra_pan_or_steam`；页面明确有淡菜蒸开、酱汁和面分开，不能作为生米电饭煲菜。 | `recipe_fact_checked` / archive |

## 去重、排除与入库顺序

1. `Arroz con Pollo`、`Paella`、`Nasi Liwet` 等名称跨国家/地区重复，不能因为同名就合并；正式入库前必须与主目录的 `canonical_name`、别名和来源 URL 逐条去重。秘鲁 Minsa 版本应作为“有量的地方版本”候选，不自动覆盖已有版本。
2. 本批没有把 `Koshary`、`Wara Enab`、`Sarma` 等多组件/包裹菜伪装成直投米饭；它们若保留，只在资料档案显示边界。
3. NWU 的 `Rice and Stir-Fried Chicken`、`Chicken Fried Rice with Lentils`、`Subayai Fried Rice`、`Tomato and Egg Rice Stir` 均明确存在另锅或熟饭回锅，不能进入当前“生米一锅”轮替；若未来开放“熟饭二次烹”品类，再单独建立合同。
4. 官方搜索摘要（SENASICA、SECTUR、墨西哥农业、部分巴西/印尼 PDF）只能作发现或暂存证据；进入 `recipe_fact_checked` 前必须直接打开原文、记录页码/行号并归档 PDF。摘要中出现的数字不能直接写入生产 JSON。
5. 任何普通锅、蒸锅、烤箱或压力锅参数都不转换为电饭煲时间/水量。电饭煲唯一明确线索是 Tourism Malaysia 的 Nasi Lemak 米饭基底，且配菜仍是另备。

## 本批结论

- 共记录 **28 个具名候选/变体**。按每条的主边界归类：`direct_one_pot` 6 条（其中 1 条明确 rice cooker 仅米饭基底）、`extra_pan_or_steam` 11 条、`cooked_rice_second_cook` 4 条、`archive/待直接复核` 7 条；一条只计一个主边界，避免重复计数。
- 真正值得下一步建立事实矩阵的优先项：NWU One-Pot Chicken and Rice、FNDE Arroz Colorido com Carne de Soja、IRGA Risoto de Frango com Legumes、秘鲁 Minsa Arroz con Pollo、Greek Mushroom Mageiritsa。它们都已有份数/主要食材/流程或液体，但仍缺安全合同或电饭煲适配。
- 本批没有任何条目可直接晋升 `executable`，也没有新增主目录条目；先补来源定位、核对去重，再决定是否进入下一批研究。
