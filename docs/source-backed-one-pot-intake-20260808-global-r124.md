# 全球一锅米饭来源搜集 Intake（r124）

**研究日期**：2026-08-08
**去重基线**：主目录 r118/867；并核对 r119–r123 intake。r123 已覆盖印度、巴基斯坦、土耳其、西班牙、阿根廷、乌兹别克斯坦，本批不重复这些国家。
**范围**：非洲、东欧/巴尔干、希腊、葡萄牙、巴西、墨西哥、秘鲁、东南亚及菲律宾的具名米饭主餐或米饭文化档案。
**本批性质**：研究 intake；不修改主 JSON、CSV、运行时代码、UI，不晋升 executable，不部署。

## 判定口径

- **direct_one_pot**：来源明确写出同一锅/同一器具完成米饭与主要配料的烹调，或明确给出可复核的单锅流程。
- **staged_or_assembled**：需要先分别煮、卷、炸、配菜或另锅完成；即使成品名称含饭，也不把它伪装成一锅出。
- **archive_only**：官方来源只证明菜名、地域或文化身份，尚无足够流程/数量，先作为资料资产。
- 本批只摘要来源事实，不复制原文步骤；原器具事实不推导为电饭煲参数。缺数量、液体、时间、安全或电饭煲适配时，字段保持缺口。

## 候选清单

| # | 建议 ID / canonical_name | 地域 | 直达来源（官方/机构） | 来源实际证明的事实 | 一锅/器具边界与缺口 | 建议状态 / B 试做架 |
|---:|---|---|---|---|---|---|
| 1 | `global-egypt-koshary` / Egyptian Koshary（库莎丽） | 埃及 | [Experience Egypt: Culture](https://www.experienceegypt.eg/en/home/Culture)；[Gastronomy](https://www.experienceegypt.eg/en/attraction-details/315/gastronomy-)；Egypt Tourism Authority | 具名国民食品；米、扁豆、鹰嘴豆、通心粉、蒜番茄酱、炸洋葱构成。 | 来源描述为多组件组合，未证明同锅完成；数量、液体、时间、安全缺失；通心粉/米/豆通常分开处理。 | `identity_verified`；B 否（记录为 staged/assembled 边界）。 |
| 2 | `global-egypt-wara-enab` / Wara Enab（葡萄叶包饭） | 埃及 | [Experience Egypt: Culture](https://www.experienceegypt.eg/en/home/Culture)；Egypt Tourism Authority | 葡萄叶包 herbed rice 或 rice/meat，并在汤汁中烹制。 | 需包裹与排列，来源未给量、液体、时间或安全终点；不是直接把原料投入电饭煲。 | `identity_verified`；B 否，保留为包裹类边界。 |
| 3 | `global-senegal-ceebu-jen` / Ceebu Jën（鱼饭） | 塞内加尔圣路易 | [UNESCO ICH: Ceebu jen](https://ich.unesco.org/en/RL/ceebu-jen-a-culinary-art-of-senegal-01748)；UNESCO / 塞内加尔文化主管机构 | 具名传统食品；鱼、碎米、干鱼/贝类和洋葱、香草、辣椒、番茄、胡萝卜、茄子、卷心菜、木薯、秋葵等季节蔬菜。 | 页面证明身份与食材范围，但没有量、米液比例、流程、时间或安全终点；鱼和蔬菜分段处理的实际做法待一手食谱补证。 | `identity_verified`；B 待补，不推导电饭煲。 |
| 4 | `global-ghana-jollof-rice` / Ghanaian Jollof Rice | 加纳 | [Ghana Tourism Authority: 68 years](https://ghana.travel/2025/03/07/ghana-celebrates-68-years-of-independence-at-itb-berlin-with-cultural-distinction/)；[See Ghana brochure](https://visitghana.com/wp-content/uploads/2024/04/Glitz-See-Ghana-Brochure.pdf) | 官方旅游资料把 jollof 列为代表性菜；米饭在番茄 gravy 中烹调，常与肉/鸡/蛋及沙拉类搭配。 | 官方页未给完整定量、液体、时间或安全；配菜是否同锅未证明。 | `identity_verified`；B 待补，不能把旅游文案当完整做法。 |
| 5 | `global-ghana-waakye` / Waakye | 加纳北部传统 | [See Ghana brochure](https://visitghana.com/wp-content/uploads/2024/04/Glitz-See-Ghana-Brochure.pdf)；Ghana Tourism Authority | 具名米豆饭；米与豆为核心，常见鸡蛋、蛋白质、鳄梨、意面/沙拉等配食。 | 来源重在身份与配食，未给同锅比例、浸泡/煮制、时间和安全；配菜多为另备。 | `identity_verified`；B 否/待补，保留“米豆饭+配菜”边界。 |
| 6 | `global-greece-mushroom-mageiritsa` / Mushroom Mageiritsa（蘑菇玛耶里齐察） | 希腊 | [Visit Greece recipe](https://www.visitgreece.gr/experiences/gastronomy/recipes/mushroom-mageiritsa/)；Greek National Tourism Organisation | 6 人份、约 45 分；蘑菇 500g、菠菜 400g、棕米 100g、白葡萄酒半杯、水 1L 等；先炒，再加酒/水焖米，最后加菠菜与 avgolemono。 | 普通锅分段加入，步骤和数量较完整；来源未证明电饭煲程序，avgolemono 另碗调和，安全终点需补。 | `recipe_fact_checked`；B 否（普通锅可试，电饭煲适配未证）。 |
| 7 | `global-greece-sardine-pilaf` / Sardine Pilaf | 希腊 | [Visit Greece recipe](https://www.visitgreece.gr/experiences/gastronomy/recipes/sardine-pilaf/)；Greek National Tourism Organisation | 500g 沙丁鱼、1 杯米、洋葱、香草、葡萄酒约 100ml、茴香酒约 50ml等；鱼/洋葱处理后加入米和水，成形后在不粘锅烹调。 | 明确有鱼预处理、米饭成形和普通锅步骤，不是电饭煲直投；液体、时间和海鲜安全仍需按原页逐项归档。 | `recipe_fact_checked`；B 否，适合作为普通锅技法档案。 |
| 8 | `global-greece-mussel-pilaf` / Mussel Pilaf with Kozani Saffron | 希腊 | [Visit Greece recipe](https://www.visitgreece.gr/el/experiences/gastronomy/recipes/mussel_pilaf_with_tiny_pasta/)；Greek National Tourism Organisation | 200g 淡菜、1 杯米、洋葱、香草、藏红花、白葡萄酒半杯、汤汁约 1L；淡菜先煮取汁，再逐步加入米，最后回锅淡菜并静置。 | 是分阶段普通锅 pilaf/烩饭，海鲜先处理；未证明电饭煲、程序和安全终点。 | `recipe_fact_checked`；B 否，需海鲜安全与器具适配。 |
| 9 | `global-portugal-arroz-linguirao` / Arroz de Lingueirão（蛏/竹蛏饭） | 葡萄牙阿尔加维 | [VisitPortugal Algarve gastronomy](https://www.visitportugal.com/es/destinos/algarve/73815)；[Portuguese page](https://www.visitportugal.pt/pt-pt/node/73815) | 官方阿尔加维饮食页列出 arroz de lingueirão / arroz de navaja，确认地域具名米饭。 | 只有名称与地域身份，未给量、液体、流程、时间或安全；海鲜是否同锅未证。 | `identity_verified`；B 否，archive only。 |
| 10 | `global-portugal-arroz-marisco` / Arroz de Marisco（海鲜饭） | 葡萄牙 | [VisitPortugal Algarve gastronomy](https://www.visitportugal.com/es/destinos/algarve/73815)；Turismo de Portugal | 官方页面列举海鲜饭为地方饮食项目，确认具名类别与地域。 | 无完整原始做法；海鲜预处理、汤汁、熟制和锅具均缺失，不能进入 B。 | `identity_verified`；B 否，待食谱来源。 |
| 11 | `global-brazil-arroz-carreteiro` / Arroz de Carreteiro | 巴西南里奥格兰德 | [Visit Brasil: Cambará do Sul](https://visitbrasil.com/en/location/cambara-do-sul/) | 官方旅游页说明米与 charque/carne seca/烤肉同锅，先炒洋葱、蒜、番茄和香料，让米吸收肉香；具名地域菜。 | 证明单锅/普通锅技法与核心食材，但无定量、液体、时间、安全或电饭煲参数。 | `recipe_fact_checked`；B 否（普通锅证据，电饭煲适配未证）。 |
| 12 | `global-mexico-arroz-tumbada-alvarado` / Arroz a la Tumbada（阿尔瓦拉多海鲜饭） | 墨西哥韦拉克鲁斯·阿尔瓦拉多 | [Visit Mexico: Alvarado](https://visitmexico.com/es/destino/17998/esalvarado)；[Veracruz route](https://visitmexico.com/es/itinerario/577/ruta-color-sabor-y-aroma-en-veracruz) | 官方旅游与烹饪路线确认此具名地方海鲜米饭、阿尔瓦拉多/非洲裔韦拉克鲁斯身份。 | 只证明身份与课程存在，未给米海鲜量、液体、时间或同锅流程；海鲜安全缺口。 | `identity_verified`；B 否，archive only。 |
| 13 | `global-mexico-arroz-tumbada-tlacotalpan` / Tlacotalpan-style Arroz a la Tumbada | 墨西哥韦拉克鲁斯·特拉科塔尔潘 | [Visit Mexico route](https://visitmexico.com/en/itinerario/580/ruta-tlacotalpan-esencia-viva-del-papaloapan) | 官方路线以 Tlacotalpan 风格列出 arroz a la tumbada，确认区域变体及具名。 | 仍无完整做法；不能与 Alvarado 版本合并或拼接数量。 | `identity_verified`；B 否，作为独立地域身份档案。 |
| 14 | `global-peru-arroz-pato` / Arroz con Pato | 秘鲁 | [Peru Travel gastronomy](https://www.peru.travel/gastronomia/es/) | Peru Travel 官方菜谱目录列出 arroz con pato，确认具名米饭主餐。 | 当前页面无食材量、液体、时间、流程、器具或安全；鸭肉熟制缺口。 | `identity_verified`；B 否，待完整来源。 |
| 15 | `global-peru-arroz-mariscos` / Arroz con Mariscos | 秘鲁利马等 | [Peru Travel: Lima cuisine](https://www.peru.travel/gastronomia/es/cocina-peruana/cocina-de-lima.html) | 官方页列出 arroz con mariscos，确认具名海鲜米饭类别。 | 只有身份/目录事实，未证明单锅、量、液体、时间或海鲜安全。 | `identity_verified`；B 否，archive only。 |
| 16 | `global-indonesia-nasi-liwet-sunda-garut` / Nasi Liwet Sunda/Garut | 印度尼西亚西爪哇·加鲁特 | [Indonesia Travel: Garut cuisine](https://www.indonesia.travel/id-id/travel-ideas/kuliner-yang-wajib-dicoba-saat-berlibur-ke-garut) | 官方旅游页说明在 kastrol（金属锅）中煮米，使用盐、葱蒜、辣椒、香茅、月桂叶、南姜、椰油等调味。 | 证明同锅米饭及传统锅具/香料，但无克数、液体、时间与电饭煲适配；配菜边界需另查。 | `recipe_fact_checked`；B 否（可作普通锅技法候选，不能推导电饭煲）。 |
| 17 | `global-indonesia-nasi-liwet-solo` / Nasi Liwet Solo | 印度尼西亚中爪哇·梭罗 | [Indonesia Travel: Solo dishes](https://www.indonesia.travel/id/en/travel-ideas/gastronomy/hobi-wisata-kuliner-10-makanan-khas-indonesia-ini-wajib-kamu-coba)；[Solo food guide](https://www.indonesia.travel/in/en/travel-ideas/gastronomy/5-traditional-dishes-in-solo-that-are-simply-irresistible) | 官方资料说明米以椰奶、香料和鸡汤烹煮，通常配鸡丝、蛋、辣味蔬菜和 areh。 | 米饭基底同锅事实较清楚，但配菜多为另备；无量、时间、安全、电饭煲参数。 | `recipe_fact_checked`；B 否，记录配菜分离边界。 |
| 18 | `global-malaysia-nasi-lemak` / Nasi Lemak | 马来西亚 | [Malaysia Travel recipe](https://www.malaysia.travel/explore/rezept-das-beste-nasi-lemak)；Tourism Malaysia | 官方食谱给 500g 茉莉米、400ml 椰奶、750ml 水、盐、香茅、姜等，可在锅或 rice cooker 煮米；黄瓜、蛋、江鱼仔、花生等为配菜。 | 米饭基底是直接锅/电饭煲流程，但经典成品依赖另备配菜；安全、总时长、营养和配菜流程未闭合。 | `recipe_fact_checked`；B 近似（仅米饭基底可试，不宣称整套配菜一锅）。 |
| 19 | `global-philippines-bringhe` / Kapampangan Bringhe | 菲律宾邦板牙 | [Philippine Embassy: Bringhe](https://seoulpe.dfa.gov.ph/2013-11-29-06-33-23/advisories/569-ph-s-bringhe-and-other-rice-dishes-take-center-stage-at-the-2018-asean-culinary-festival)；菲律宾外交部 | 政府页面称 Bringhe 是菲律宾本土 paella，以椰奶和姜黄烹成，列入东盟烹饪节。 | 无量、液体、时间、食材完整清单或安全；未证明电饭煲。 | `identity_verified`；B 待补；米饭主线有潜力但不能直接照做。 |
| 20 | `global-serbia-sarma` / Serbian Sarma | 塞尔维亚 | [Serbia Tourism: Food](https://www.old.serbia.travel/en/experience-serbia/hrana-i-pice/food) | 官方旅游页说明酸菜叶包肉和米，煎炒后卷包并慢炖。 | 是包裹+慢炖的分阶段菜，米不是独立主食锅；无电饭煲适配，安全/量缺口。 | `identity_verified`；B 否，记录为非直接一锅米饭边界。 |
| 21 | `global-serbia-podvarak-rice` / Podvarak with Rice | 塞尔维亚 | [Serbia Tourism SOLUFOOD PDF](https://www.serbia.travel/wp-content/uploads/2025/05/SOLUFOOD-eng.pdf) | 官方资料写酸菜、洋葱，加入少量米和液体焖煮至米熟。 | 更接近配菜而非米饭主餐，米量少且无完整安全/时间合同；不纳入 B。 | `identity_verified`；B 否，非主餐边界。 |
| 22 | `global-egypt-koshary` 变体登记（不另建条目） | 埃及 | [Nile Valley official tourism PDF](https://www.experienceegypt.eg/files/Nile%20Valley-Eng.pdf) | 另一份官方旅游资料再次确认 koshari 的米、通心粉、扁豆、鹰嘴豆、番茄蒜酱、炸洋葱构成。 | 与 #1 同一 canonical，不拆成“新菜”；来源补强身份但仍不证明单锅。 | 只做来源补充，**不新增目录条目**。 |

## 本批明确排除或只留边界的方向

- 摩洛哥 couscous/tagine：官方资料虽丰富，但不是米饭主线，不能因“一锅”概念相近而纳入。
- 埃及 molokhiya（通常配米/面包）：主菜不是米饭；Wara Enab 需要包裹，Koshary 多组件装配，均不当作 direct_one_pot。
- 希腊 dolmadakia、gemista：来源要求预炒/填馅/烤制，属于 staged_or_assembled。
- 秘鲁 tacu tacu、arroz chaufa：以熟饭二次煎炒/混豆为核心，属于后续“剩饭二次烹”候选，不进入当前生米一锅主线。
- 葡萄牙 cataplana：是海鲜器具/锅料理但来源页不含米饭，排除。
- 塞尔维亚 sarma、podvarak：米只是馅料或少量配料，不是米饭主餐。

## 来源与证据结论

本批来源均来自官方旅游、文化遗产、外交/政府或官方食品资料页面；网页直接打开核验。多数海外官方页承担“身份/地域/核心食材”证明，不等于完整家庭食谱。只有 Visit Greece 的三道菜、巴西 Arroz de Carreteiro、印尼两种 Nasi Liwet、Malaysia Nasi Lemak 具备较清晰的过程或器具线索，但仍缺电饭煲转换或安全合同。任何后续 `recipe_fact_checked` 晋升都必须重新建立逐项来源矩阵，不能把本 intake 的摘要直接当作可照做合同。

## 后续建议

1. 不把全球条目直接塞入当前轮替池；先作为“更多地域/研究中”资料，避免中国菜饭入口被海外条目稀释。
2. 若要建立全球 B 试做架，优先补齐 Malaysia Nasi Lemak 的整套配菜流程和安全、Greece Mushroom Mageiritsa 的普通锅试做记录、Brazil Arroz de Carreteiro 的量/液体/时间；三者仍不得自动推导电饭煲参数。
3. 对海鲜/禽肉/贝类候选，必须补熟制终点和交叉污染说明；对椰奶、酒等液体，必须从同一版本来源建立可执行比例，禁止跨来源平均或拼接。
