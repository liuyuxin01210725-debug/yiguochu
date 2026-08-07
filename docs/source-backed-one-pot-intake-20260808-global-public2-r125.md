# 全球公共机构一锅米饭来源搜集 Intake（r125-public2）

**研究日期**：2026-08-08
**去重快照**：读取时主目录为 `source-backed-one-pot-v1-20260808-global-r125`（875 条）；同时逐项对照 r118–r124 的 intake 文档。本文只登记当前快照中未发现同名条目的候选；同名异版本仍需以 `canonical_name`、别名、地区和来源 URL 做最终合并判断。
**本批性质**：只写研究 intake，不修改主 JSON、CSV、运行时代码或 UI；不晋升 `executable`，不部署。
**来源范围**：日本农林水产省、澳大利亚/昆士兰州政府卫生机构、美国大学 Extension、韩国农村振兴厅等官方或公共机构。来源能证明的事实与尚待核验的事实严格分开。

## 判定口径

- `direct_one_pot`：原文明确在同一锅/同一普通炊具中完成生米和主要配料；这里只记录原器具事实，不把普通锅或平底锅参数推导成电饭煲参数。
- `extra_pan_or_steam`：有预炒、另锅、蒸/焖分段、烤箱或分组件；可作为一锅饭研究候选，但不能伪装成直接投料。
- `cooked_rice_second_cook`：先把米煮熟，再炒、拌、回锅或烤；属于熟饭二次烹候选，不进入生米一锅轮替。
- `archive`：页面只证明身份，或 PDF/页面暂时无法直接读取关键字段；不把搜索摘录中的数字写进事实合同。

所有份数、克数、液体和时间只按来源原文记录；`null` 代表来源没有证明，不能跨来源补猜。

## 本批候选

| # | 建议 ID / 具名菜 | 地区 / 机构 | 直达来源与定位 | 来源实际证明 | 器具与边界 | 缺口 / 建议状态 |
|---:|---|---|---|---|---|---|
| 1 | `maff-ginger-shirasu-takikomi` / 生姜としらすの炊き込みご飯 | 日本；农林水产省 | [MAFF 家庭食育食谱 PDF](https://www.maff.go.jp/j/syokuiku/torikumi/pdf/fam003-.pdf)，p.1，PDF 行 52–63 | 2 人；米 1 合、生姜 1 大匙、水 1 合分、醋 1 小匙；米与姜/醋先炊，出锅后再拌入しらす和大叶。 | `cooked_rice_second_cook`；来源是普通炊饭器流程，但鱼和大叶为出锅后加入。 | 无总时长、鱼类安全终点；可登记为熟饭二次烹，不能登记为全程直投。 |
| 2 | `maff-ginger-aburaage-takikomi` / 生姜と油揚げの炊き込みご飯 | 日本；农林水产省 | [同一 MAFF PDF](https://www.maff.go.jp/j/syokuiku/torikumi/pdf/fam003-.pdf)，p.1，PDF 行 98–111 | 2 人；米 1 合、生姜约 1 小块、油揚げ 1/2 枚、酱油/酒各 1/2 大匙、和风だし 1 小匙；调味料加到 1 合水位后照常炊。 | `direct_one_pot`；电饭煲/普通炊饭器，主要配料同锅。 | 无总时长、安全终点；大豆过敏提示待补，状态可为 `recipe_fact_checked` 候选。 |
| 3 | `maff-mochi-sweet-potato-rice` / 餅とさつまいものご飯 | 日本；农林水产省 | [MAFF 节庆食谱](https://www.maff.go.jp/j/pr/aff/2001/spe2_04.html)，HTML 行 369–428 | 2 合份；米 2 合、红薯约 300g、切り餅 1 个；昆布だし 380ml、薄口酱油 1 大匙、味醂 1 大匙、盐 1/4 小匙；红薯和切块年糕放入炊饭器一起炊。 | `direct_one_pot`；明确为炊饭器。 | 主要是碳水+纤维，缺蛋白质；应在资料页标“营养结构偏单一”，不因有完整量就直接上架。 |
| 4 | `maff-hyogo-aromatic-takikomi` / ひょうご香る炊き込みご飯 | 日本兵库；MAFF 近畿农政局竞赛 PDF | [MAFF 近畿 PDF](https://www.maff.go.jp/kinki/syouhi/seikatu/syokuiku/attach/pdf/251114-32.pdf)，p.1，行 20、51–66 | 表头写 2 人份；玉米 20g、鸡胸肉 90g、香菇 15g、水 410ml、めんつゆ 35ml、酱油 30ml；米浸水后与配料同锅炊，炊好捏成饭团。 | `direct_one_pot`；原文明确使用燃气灶锅，不转换成电饭煲参数。 | 米的克数、总时长和禽肉安全终点未给；可作为普通锅 `recipe_fact_checked` 候选，合同保持缺省。 |
| 5 | `maff-pineapple-takikomi` / パイナップル炊き込みご飯 | 日本；MAFF 植物防疫/食育资料 | [MAFF 菠萝食谱 PDF](https://www.maff.go.jp/pps/j/guidance/attach/img/pineapplegohanrecipe.pdf)，3 页 | 官方 PDF 确有具名菠萝炊饭；搜索/页面摘要显示按炊饭器米水位和菠萝等材料制作。 | `direct_one_pot` 线索；PDF 关键食材和水位以图片为主，不能按摘要建立合同。 | 需要本地归档、逐页视觉核对后再记定量/步骤；暂为 `identity_verified` / `archive`。 |
| 6 | `maff-shincha-takikomi-gohan` / 新茶の炊き込み御飯 | 日本；MAFF 活动页转载农林水产省食堂食谱 | [MAFF “チャチャっとお茶生活”](https://www.maff.go.jp/j/seisan/tokusan/cha/chachatto.html)，HTML 行 359–375 | 米 2 杯（300g）、水 2 杯（360g）、酒 1 大匙、盐 1/2 小匙、昆布だし 8g、茶叶 4.5g；约 3.5g 入锅炊，余量出锅后加入焖香。 | `direct_one_pot` + 出锅后点香；来源是 MAFF 页面列出的食堂/合作方菜单，不证明地方传统。 | 未给份数、总时长和安全终点；合作方归属需在 source matrix 中单独记录，暂不晋升。 |
| 7 | `qld-one-pot-beans-rice` / One Pot Beans and Rice | 澳大利亚昆士兰；Health and Wellbeing Queensland | [Queensland Healthy Recipes](https://hw.qld.gov.au/healthy-recipes/one-pot-beans-and-rice-recipe/)，HTML 行 163–221 | 6 份；准备 10 分钟、烹调 50 分钟；糙米 1 杯、水 2 杯、三豆罐头 420g、番茄罐头 400g、洋葱/蒜/烟熏红椒等；同一锅炒香后盖锅煮约 40 分钟。 | `direct_one_pot`；普通 saucepan，不外推电饭煲。 | 无肉类安全终点；来源给出蛋白/纤维营养数据，可作为普通锅试做候选。 |
| 8 | `qld-one-pot-chicken-lentil-rice` / One-Pot Chicken Lentil Rice | 澳大利亚昆士兰；Metro South Health | [Healthy New Communities Cookbook](https://www.metrosouth.health.qld.gov.au/__data/assets/pdf_file/0039/476877/healthy-new-communites-complete-cookbook.pdf)，pp.122–123（PDF 行 3601–3643） | 4 人；准备 5 分钟、烹调 40 分钟；印度香米 1.5 杯、鸡腿 4 块/500g、扁豆 1 罐、水 625ml、油、洋葱、姜黄、孜然和汤粉；鸡肉在同一大锅短煎后取出，米/豆/水入锅，沸腾后放回鸡肉，低火 15 分钟。 | `direct_one_pot`（同一锅分阶段）；普通大锅，鸡肉有取出/放回步骤。 | 未给禽肉内部温度安全终点；不能说成电饭煲直投，先进入普通锅试做架。 |
| 9 | `nsw-curried-vegetable-rice` / Quick curried vegetable rice | 澳大利亚新南威尔士；NSW Government | [NSW Healthy Recipes](https://www.nsw.gov.au/health-and-wellbeing/healthy-living/healthy-eating/healthy-recipes/quick-curried-vegetable-rice) | 官方页面标题与搜索入口确认具名蔬菜咖喱饭；现有检索摘要显示米、蔬菜、库存液体和盖锅焖饭流程。 | 预计为 `direct_one_pot` 普通 saucepan；本轮页面抓取返回错误，不能把摘要当完整证据。 | 需重新直接打开并记录份数、液体、时间、步骤；缺蛋白，先标 `page_open_blocked` / archive，不进入轮替。 |
| 10 | `uw-one-pot-chicken-rice-soup` / One-Pot Chicken and Rice Soup | 美国；University of Washington Any Hungry Husky | [UW Food Pantry recipe](https://www.washington.edu/anyhungryhusky/2020/05/01/one-pot-chicken-and-rice-soup-gf/)，HTML 行 48–78 | 配料为罐装鸡/豆、罐装四季豆和胡萝卜、洋葱/蒜、米和鸡/蔬菜高汤；先在锅中用 1/2 杯米+1 杯高汤煮约 20 分钟，再把其余材料和高汤加入同锅加热至少 5 分钟。 | `direct_one_pot`（同一锅分阶段）；普通锅，使用罐装食材。 | 份数和“剩余高汤”总量未写，禽肉是罐装成品不需生肉终点；可作为低成本资料候选，不推导电饭煲。 |
| 11 | `cornell-cce-chicken-rice` / Chicken and Rice | 美国；Cornell Cooperative Extension Erie | [HCSI 2023 Updated Recipe Book](https://erie.cce.cornell.edu/resources/hcsi-2023-updated-recipe-book)（PDF 下载页） | 搜索索引显示 4 份、准备 20/烹调 40 分钟，米、液体、洋葱/蒜/青椒和植物蛋白组合。 | `cooked_rice_second_cook` / `extra_pan_or_steam`：先煮米，再另锅炒配料后合并；不是生米一锅。 | PDF 页面体积过大，本轮未直接打开并定位正文；不要把索引数字入 JSON，待下载归档后复核。 |
| 12 | `melton-tofu-biryani` / One-Pot Tofu Biryani | 澳大利亚维多利亚；Melton City Council 家庭食谱 | [Melton City Council cookbook PDF](https://www.melton.vic.gov.au/files/assets/public/v/1/services/people/children/from-starting-solids-to-cooking-for-the-whole-family/cook-book-multiple-languages/english-intro-to-solids-cookbook-nov-2025.pdf) | 官方家庭食谱目录中的豆腐 biryani；摘要显示 4–5 成人份、豆腐 400g、印度香米 2 杯、菠菜、酸奶、水等。 | `extra_pan_or_steam`：米先半煮沥干，豆腐另行煎制，再分层加盖焖；不能当电饭煲直投。 | PDF 本轮下载超时，关键数量和页码待直接归档复核；暂为 archive。 |
| 13 | `rda-korea-bean-sprout-rice` / 콩나물밥（豆芽饭） | 韩国；韩国农村振兴厅 RDA | [RDA 国产豆类食谱报道](https://www.rda.go.kr/board/board.do?boardId=farmprmninfo&currPage=126&dataNo=100000797640&mode=updateCnt&prgId=day_farmprmninfoEntry&searchEDate=&searchKey=&searchOrgDeptKey=&searchOrgDeptVal=&searchSDate=&searchVal=)，HTML 行 583–604 | 官方报道确认豆芽饭：洗净米上铺豆芽炊饭，再用酱油、芝麻油、辣椒粉、蒜和葱做拌酱；作为一餐的身份与流程清楚。 | `direct_one_pot` 线索；普通炊饭器/锅，酱料出锅拌入。 | 未给份数、米量、豆芽量、液体和时间；仅 `identity_verified` / archive，不能直接生成。 |
| 14 | `rda-korea-naengi-panbap` / 냉이팬밥（荠菜平底锅饭） | 韩国；RDA《Green Magazine》 | [RDA Green Magazine Vol.248](https://rda.go.kr/webzine/2026/04/4_3.html)，HTML 行 67–115 | 2 人；米 200g、荠菜 50g、洋葱 1/2 个、鳀鱼/干虾高汤 200ml、韩式大酱 0.5 大匙；洋葱炒香后加浸泡米炒 2 分钟，盖锅中小火约 6 分钟，关火加荠菜焖 5 分钟。 | `direct_one_pot`；明确是普通平底锅，不转换成电饭煲。 | 无安全终点；海鲜高汤过敏需标注；量/液/时间较完整，适合进入普通锅事实矩阵。 |
| 15 | `csu-chicken-vegetable-fried-rice` / Fried Rice（鸡肉蔬菜炒饭） | 美国；Colorado State University Extension | [CSU Extension How to Use Rice](https://extension.colostate.edu/resource/how-to-use-rice/)，HTML 行 36–64 | 4 份；熟糙米 2 杯、鸡胸 2 块、胡萝卜 1 杯、西兰花 1 杯、豌豆 1/2 杯、酱油；平底锅先炒鸡与蔬菜，再加入熟饭回锅。 | `cooked_rice_second_cook`；明确不是生米一锅。 | 熟饭用量与流程完整，但不进入当前生米轮替；可登记为未来“剩饭一锅”品类候选。 |
| 16 | `usu-chicken-creole-rice` / Chicken Creole | 美国；Utah State University Extension | [USU Create Better Health](https://extension.usu.edu/createbetterhealth/blog/chickencreole)，HTML 行 81–103 | 糙米 1 杯、鸡胸 2–3 块、番茄罐头/番茄汁、洋葱、西芹、甜椒等；米按包装另煮，其他材料在重锅中煮约 1 小时，鸡肉达到 165°F 后切块回锅。 | `extra_pan_or_steam`；米与鸡肉酱分开，不能伪装成一锅饭。 | 反而可作为“米饭+一锅主菜”边界资料；安全终点明确，但非本轮直投候选。 |
| 17 | `umn-chicken-rice-soup` / Chicken Rice Soup | 美国；University of Minnesota Extension | [UMN 两周应急食物指南](https://extension.umn.edu/how-prepare-disaster/preparing-2-week-emergency-food-supply)，HTML 行 908–935 | 8 份；熟饭 2 杯、罐装鸡 20 oz、洋葱、鸡汤、胡萝卜、牛奶、面粉、油和黄油；饭按包装另煮，汤锅煮鸡和蔬菜，另锅做 roux，最后拌入熟饭。准备 20/烹调 20 分钟。 | `cooked_rice_second_cook` + `extra_pan_or_steam`；普通锅/另锅，不是生米一锅。 | 适合作为未来熟饭/应急档案；不进入当前生米轮替。 |
| 18 | `metrosouth-lamb-biriyani` / Lamb Biriyani | 澳大利亚昆士兰；Metro South Health | [Healthy New Communities Cookbook](https://www.metrosouth.health.qld.gov.au/__data/assets/pdf_file/0039/476877/healthy-new-communites-complete-cookbook.pdf)，pp.120–121（PDF 行 3523–3600） | 8 人；准备 15 分钟+腌制 3 小时，烹调 1 小时；羊肉 800g、印度香米 2.5 杯（550g）、酸奶/香料/牛奶/藏红花等；洋葱、羊肉和米分阶段处理并分层焖。 | `extra_pan_or_steam`；同一大锅但有腌制、煎洋葱、分层和焖制，不能当电饭煲直投。 | 来源完整度较高，适合作为“抓饭/焖饭家族”研究候选；安全终点与器具适配仍缺。 |
| 19 | `metrosouth-salmon-mornay-rice-bake` / Salmon Mornay Rice Bake | 澳大利亚昆士兰；Metro South Health | [Healthy New Communities Cookbook](https://www.metrosouth.health.qld.gov.au/__data/assets/pdf_file/0039/476877/healthy-new-communites-complete-cookbook.pdf)，pp.146–148（PDF 行 4214–4293） | 4–6 人；准备 10 分钟、烘烤 30 分钟；罐装三文鱼、熟饭、冷冻蔬菜、白酱、奶酪等拌合后入烤箱。 | `cooked_rice_second_cook`；明确是熟饭烤箱焗饭，不是生米一锅。 | 鱼类/乳制品安全和器具均已有边界；只作未来熟饭品类档案。 |

## 去重、排除与后续顺序

1. 本批明确没有重复写入 r124 已登记的南非 NWU、巴西 FNDE、秘鲁 Minsa、印尼 Nasi Lapola、希腊 Mushroom Mageiritsa 等候选；它们继续留在先前 intake，不能因换 ID 再次计数。
2. 日本 MAFF 的玉米炊饭、里芋炊饭、ホタテと大根、トマチー、五目饭、和歌山しょうが飯等已存在主目录，本批只收不同具名版本（生姜+しらす、生姜+油揚げ、餅とさつまいも、ひょうご香る、新茶、菠萝）。
3. `direct_one_pot` 不等于“电饭煲可做”：本批直接候选分别标明普通锅、平底锅或炊饭器，任何水量、时间、锅型转换都必须后续实做后才能公开。
4. NSW 页面、Cornell PDF、Melton PDF 本轮存在抓取/体积阻塞；它们只保留为待直接复核候选，搜索摘要或索引数字不进入主 JSON。
5. `cooked_rice_second_cook`（UW 汤饭、CSU 炒饭、USU Chicken Creole、UMN 汤饭、Metro Salmon Bake 等）不进入当前生米轮替；若未来开启“熟饭二次烹”品类，应单独建目录和安全合同。

## 本批结论

- 记录 **19 条具名候选**：其中 **9 条**可直接继续建立生米/炊饭事实矩阵（MAFF 生姜油揚げ、MAFF 兵库炊饭、MAFF 新茶、Queensland 豆饭、Metro 鸡肉扁豆饭、UW 汤饭、RDA 荠菜平底锅饭等，按各自器具边界处理）；其余为熟饭二次烹、另锅/蒸/烤箱或档案候选。
- 暂无条目晋升 `executable`，无主 JSON、CSV、运行时代码或 UI 改动。
- 下一步优先：先复核 MAFF 菠萝 PDF 的图像页、NSW 页面和 Cornell/Melton PDF 直达下载；然后从 `direct_one_pot` 候选中逐条补 safety/quantity/time 合同，不把“来源有配方”误写成“已适配电饭煲”。
