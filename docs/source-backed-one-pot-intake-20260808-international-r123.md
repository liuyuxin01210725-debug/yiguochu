# 来源一锅米饭搜集 intake · 国际官方／公共机构批次 r123

> 研究日期：2026-08-08
> 去重快照：`source-backed-one-pot-v1-20260807-national-r118`（867 条），并逐条对照 r119、r120、r121、r122 intake；本批只记录当前目录没有的国际具名候选。
> 本轮只写研究 intake，不晋升 `executable`，不修改主 JSON、CSV、运行时代码、UI 或部署产物。
> 精确去重后记录 **35 条新候选**（印度／巴基斯坦 8、土耳其 12、西班牙 1、阿根廷 3、乌兹别克斯坦 11）；其中可直接视为“同一锅完成”的仅少数，绝大多数属于普通锅、炒锅、预煮后合锅、焖／烤或只有身份档案，不能直接改写成电饭煲做法。

## 分类口径

- `direct_one_pot`：来源明确生米和主要配料在同一只锅／同一器具内完成；只记录原器具，不把普通锅、paella pan、kazán 或压力锅推导成电饭煲。
- `extra_pan_or_steam`：有预煮、另锅炒料、分层／焖、蒸笼、烤箱、tava 或独立酱汁；保留真实连续流程，不伪装单锅。
- `cooked_rice_second_cook`：先有熟饭，再与配料炒、拌、浇汁或入汤；保留为未来“熟饭二次烹”品类。
- `archive`：官方／公共机构确实记录具名菜、地域或技法，但数量、液体、时长、安全或原文访问仍不闭合；只能作为档案候选。

## 候选清单（与现有 867 条及 r119–r122 intake 去重后）

### 印度、巴基斯坦及南亚公共机构

| intake_id | 具名菜 | 一手来源 | 来源实际证明的字段 | 器具／边界／缺口 |
|---|---|---|---|---|
| INT-R123-IN-01 | Poushtik Khichdi（营养 Khichdi） | [印度 PM POSHAN Odisha review PDF](https://pmposhan.education.gov.in/Files/Review/Fifth_Review/Odisha/JRM_Report_Odisha_MDM.pdf)，P63 | 25 份；米 500g、分裂绿豆 225g、油 50g、洋葱 100g、青椒、番茄、蔬菜 2 杯、绿叶菜半杯；米豆蔬菜同锅，加“两倍水”，盖锅煮至软 | `direct_one_pot`（普通锅）+ `recipe_fact_checked` 候选；未给每份拆分、总时长和安全温度，不推导电饭煲程序 |
| INT-R123-IN-02 | Moong Dal Khichidi（绿豆米 Khichidi） | [印度 AYUSH 官方健康资料](https://ayush.gov.in/resources/pdf/health/ARPHHC19.pdf) | 米与绿豆可按 1:1、1:1/2 或 1:1/4；加少量油、岩盐、姜、阿魏、姜黄；以 6 份水在器皿中煮 | `direct_one_pot`（器皿未细化）+ `recipe_fact_checked` 候选；缺份数、时间和安全边界 |
| INT-R123-IN-03 | Whole Cereal Vegetable Pulav | [印度驻科威特使馆 AYUSH Bulletin PDF](https://indembkwt.gov.in/pdf/AYUSH%20Bulletin%20Oct%202022%20-%2002%20Revised.pdf) | 官方摘要称 pulav／khichdi 是易做的一锅完整餐，并提供 Whole Cereal Vegetable Pulav 题名；搜索摘要未露出完整克重、液体或步骤 | `archive`；先归档候选，不能从标题补写配方 |
| INT-R123-IN-04 | Fish Biryani Bengali | [印度海洋产品出口发展局 MPEDA](https://www.mpeda.gov.in/indianseafood/?p=734) | 鱼 800g、巴斯马蒂米 500g，另有油、洋葱、香料等；鱼先腌／浅煎，另做 pulao，再将鱼咖喱与米分层并盖锅 10 分钟；总时长 90 分钟 | `extra_pan_or_steam`；鱼煎、米饭和咖喱分段，不能标 direct 电饭煲；缺固定份数和鱼类安全温度 |
| INT-R123-IN-05 | Prawn Biriyani | [MPEDA](https://www.mpeda.gov.in/indianseafood/?p=804) | 虾先在厚底锅煮 1+3 分钟；米在另一锅煮至七成熟，取出铺在虾上，以高火 5–7 分钟、tava 上 dum 15 分钟、焖 10 分钟 | `extra_pan_or_steam`；典型分锅分层，不得伪装电饭煲单锅；页面正文缺完整配料克数和份数 |
| INT-R123-IN-06 | Assorted Fish Pulao | [MPEDA](https://www.mpeda.gov.in/indianseafood/?p=909) | pulao 米 300g、鱼 600g、油 30ml、黄油 30–50g、洋葱 50g、彩椒 75g；米先煮熟沥水，鱼另煎，再同锅快速拌合，约 30 分钟 | `cooked_rice_second_cook` + `extra_pan_or_steam`；不是生米一锅饭 |
| INT-R123-IN-07 | Phulkari Pulao | [印度国家酒店管理与餐饮技术委员会 NCHMCT PDF](https://nchm.gov.in/sites/default/files/2025-11/ENGLISH%20%E0%A4%9C%E0%A5%82%E0%A4%A8%202023.pdf) | 题名与旁遮普传统背景；米浸泡，平底锅加入酥油、香料、坚果、胡萝卜、豌豆、paneer，再加米、罂粟籽、奶、khoya 和藏红花后慢火焖 | `extra_pan_or_steam`；来源 PDF 的部分数量／时间提取不完整，需归档页码后再闭合 |
| INT-R123-IN-08 | Bater Dum Biryani | [NCHMCT English March 2025 PDF](https://nchm.gov.in/sites/default/files/2025-11/English%20%E0%A4%AE%E0%A4%BE%E0%A4%B0%E0%A5%8D%E0%A4%9A%202025.pdf) | 200g 鹌鹑、200g 米、300g 洋葱、酸奶、香料等；米先煮至 70–80%，鹌鹑另炒至半熟，分层后 tawa dum 25–30 分钟；给出每份 200–300g 和营养范围 | `extra_pan_or_steam`；分段烹饪与禽肉安全需单独合同，不是电饭煲直达 |

### 土耳其官方文化门户／地方政府

| intake_id | 具名菜 | 官方直达来源 | 来源实际证明的字段 | 器具／边界／缺口 |
|---|---|---|---|---|
| INT-R123-TR-01 | İstanbul Pilavı | [土耳其文化门户](https://www.kulturportali.gov.tr/turkiye/istanbul/neyenir/stanbul-pilavi) | 鸡胸 1 片、米 2 杯、水 4 杯、杏仁、豌豆、开心果、藏红花、姜；米与杏仁炒后加入鸡汤和鸡肉焖至收汁 | `extra_pan_or_steam`；鸡先煮、坚果另行处理；未给总时长／固定份数 |
| INT-R123-TR-02 | Mengen Pilavı | [Mengen Kaymakamlığı（县政府）](https://www.mengen.gov.tr/yoresel-yemeklerimiz) | 米、牛肉丁、洋葱、番茄、蘑菇、莳萝、黄油、核桃；米浸泡 1 小时，肉／菇／番茄加水煮约 30 分钟，再加米小火 25 分钟，另锅把黄油、莳萝、核桃浇上并静置 10–12 分钟 | `extra_pan_or_steam`；同锅主流程但有分离浇料，普通锅，不推导电饭煲 |
| INT-R123-TR-03 | Urfa Kuzu İçi Pilavı | [土耳其文化门户](https://www.kulturportali.gov.tr/turkiye/sanliurfa/neyenir/urfa-kuzu-ici-pilav) | 羊肉 1kg、米 4 杯、葡萄干、松子／香料；羊先在锅中煮，米用肉汤、葡萄干、香料焖，松子另锅炒，最后铺肉 | `extra_pan_or_steam`；缺固定份数和总时长 |
| INT-R123-TR-04 | Göveçli Pilav | [土耳其文化门户](https://www.kulturportali.gov.tr/turkiye/kutahya/neyenir/govecl-plav) | 羊肉 2kg、米 3 杯、黄油 2 大匙、肉汤 3 杯；肉先煮并在 göveç 中烤，米放入 göveç 后加肉汤，烤箱约 30 分钟 | `extra_pan_or_steam`（预煮+烤箱）；不能转为电饭煲同锅 |
| INT-R123-TR-05 | Lüşeli Pilav | [土耳其文化门户](https://www.kulturportali.gov.tr/turkiye/hakkari/neyenir/luseli-pilav) | 山野 lüşe 一把、米 1kg、水和盐；lüşe 先煮熟沥水，与米同油炒 5 分钟，再加水盐小火煮至收汁 | `extra_pan_or_steam`；原文水量为“足量”，无份数／时间；器具是普通锅 |
| INT-R123-TR-06 | Mercimekli Pilav | [土耳其文化门户](https://www.kulturportali.gov.tr/turkiye/kutahya/neyenir/mercmekl-plav) | 绿扁豆 1 杯、米 2 杯、洋葱 2 个、黄油 150g、油；扁豆先煮，洋葱炒香后加米和扁豆，再加热水小火焖 | `extra_pan_or_steam`；热水量、份数、时间未给 |
| INT-R123-TR-07 | Düğün Pilavı | [土耳其文化门户／Eskişehir](https://kulturportali.gov.tr/turkiye/genel/neyenir/dugun-pilavi) | 米 1kg、鸡或肉、鹰嘴豆 1 杯；肉和豆先煮，米在黄油中炒后加入肉汤，按 1 份米:2 份水焖 | `extra_pan_or_steam`；传统婚宴大锅，缺份数和总时长 |
| INT-R123-TR-08 | Keklikli Pilav | [土耳其文化门户](https://www.kulturportali.gov.tr/turkiye/bitlis/neyenir/keklikli-pilav) | 山鹑 1 只、米 2 杯、鹰嘴豆 1 杯、盐、山鹑汤 4 杯；豆和山鹑先煮，米与汤同锅煮至收汁，焖 10–15 分钟 | `extra_pan_or_steam`；有预煮禽肉，缺份数和安全温度 |
| INT-R123-TR-09 | Etli Pilav | [土耳其文化门户／Ankara](https://www.kulturportali.gov.tr/turkiye/ankara/neyenir/etli-pilav) | 米 2kg、熟肉 500g、黄油 200g、油、şehriye；米和面粒先炒，加入热水焖，熟肉作为配料加入 | `extra_pan_or_steam`；水量、份数和肉加入时点不完整 |
| INT-R123-TR-10 | Konuralp Pilavı | [土耳其文化门户／Düzce](https://kulturportali.gov.tr/turkiye/duzce/neyenir/konuralp-pilavi) | 16 人份；Konuralp 米 8 杯、骨头 1kg、牛肉 1kg、鹰嘴豆 1/2kg、油、6 杯骨汤和 6 杯水；先熬骨汤，再合入肉、豆、米烹煮 | `extra_pan_or_steam`；骨汤与肉的前处理、完整步骤定位需继续核验 |
| INT-R123-TR-11 | Divriği Pilavı（Alatlı Pilav） | [土耳其文化门户／Sivas](https://kulturportali.gov.tr/turkiye/sivas/neyenir/divrigi-pilavi) | 鸡或带骨羊 1.5kg、米 1kg、洋葱、鹰嘴豆 1/2 杯、葡萄干 1/2 杯、黄油 70g；肉先煮拆骨，米与肉汤、豆、葡萄干在锅中焖 | `extra_pan_or_steam`；普通锅，来源没有固定总时长 |
| INT-R123-TR-12 | Perde Pilavı | [土耳其文化门户／Siirt](https://www.kulturportali.gov.tr/turkiye/siirt/neyenir/perde-pilav) | 鸡、米、杏仁、鸡肝先分别煮／炒，放入蛋面皮包裹的锅中，180°C 烤至上色 | `extra_pan_or_steam`；明确烤箱和面皮包裹，不属于一锅电饭煲；仅保留国际档案 |

### 西班牙、拉美与中亚

| intake_id | 具名菜 | 官方／公共机构来源 | 来源实际证明的字段 | 器具／边界／缺口 |
|---|---|---|---|---|
| INT-R123-ES-01 | Arroz negro（黑米） | [西班牙官方旅游网站 Spain.info](https://www.spain.info/en/recipe/arroz-negro/) | 6 人份；米 600g、鱼／贝类高汤 1.25L、墨鱼 0.5kg、洋葱、蒜、番茄、欧芹、红椒粉、油盐；paella pan 中炒墨鱼和香料，入米和高汤，高火 5 分钟、低火 15 分钟；总时长 35 分钟 | `direct_one_pot`（paella pan）+ 非电饭煲；鱼类安全与器具边界仍需单独合同 |
| INT-R123-AR-01 | Arroz con pollo（Pérez Polladas 版本） | [阿根廷政府非遗页面](https://www.argentina.gob.ar/cultura/manifestaciones-del-patrimonio-cultural-inmaterial/santa-fe/polladas-de-perez-gastronomia-arte-y-comunidad) | 文化页面明确记录鸡／内脏、洋葱、蒜、甜椒、番茄、米和高汤；鸡先在铁盘／锅中煎，蔬菜在原锅炒，再把鸡和米放入锅中用高汤煮 | `direct_one_pot`（普通锅，先炒后同锅煮）+ `archive`；无克数和份数，不能直接公开完整做法 |
| INT-R123-AR-02 | Guiso de arroz con pollo（NEA） | [阿根廷政府 NEA 食谱 PDF](https://www.argentina.gob.ar/sites/default/files/2020/09/pnpa_-_2021_-_recetario_nea.pdf)，P61 | 洋葱、胡萝卜、甜椒、整鸡块、土豆、米半杯、番茄泥、油和调味料；蔬菜先炒，约 25 分钟后加鸡，再加番茄泥和热水 0.5L 煮约 30 分钟，土豆熟后加米约 15 分钟 | `direct_one_pot`（普通锅）+ `recipe_fact_checked` 候选；缺固定总份数和禽肉温度终点 |
| INT-R123-AR-03 | Arroz con pollo（NOA 儿童食谱版） | [阿根廷政府 NOA 食谱 PDF](https://www.argentina.gob.ar/sites/default/files/2020/09/recetario-noa-primeros-anos-senaf.pdf)，P21 | 洋葱、甜椒、鸡肉、番茄、米 1 杯、盐胡椒油；洋葱甜椒炒后加入鸡和番茄，加水调味，再加米煮至熟 | `direct_one_pot`（普通锅）+ `archive`；缺各配料重量、液体量和时间，不与 NEA 版拼接 |
| INT-R123-UZ-01 | Chaykhana-style plov | [乌兹别克斯坦政府旅游局页面](https://gov.uz/en/uzbektourism/news/view/94546) | 文章列为真实地区变体：羊肉、barberry、尾脂；列出配餐与风味，不给家庭份数、米量、液体或时间 | `archive`；身份／变体证据，不可直接结构化 |
| INT-R123-UZ-02 | Fergana-style plov | 同上 | 牛肉、红米、kavartak；来源只证明官方活动中以此名呈现 | `archive`；缺配方合同 |
| INT-R123-UZ-03 | Osh Sofi | 同上 | 牛肉，配 kazy 马肉香肠和番茄；只证明具名变体 | `archive`；缺米量、液体和程序 |
| INT-R123-UZ-04 | Kabuli plov | 同上 | 牛肉、鹰嘴豆、葡萄干；只证明具名变体与配料结构 | `archive`；缺固定配方 |
| INT-R123-UZ-05 | Andijan-style plov | 同上 | 羊肉，配 achik-chuchuk；只证明具名变体 | `archive`；缺米水比例及器具 |
| INT-R123-UZ-06 | Samarkand-style homemade plov | 同上 | 牛肉、榅桲；只证明具名变体与地域 | `archive`；缺定量与流程 |
| INT-R123-UZ-07 | Uch Kuduk plov | 同上 | 牛肉、羊肉、石榴籽；只证明具名变体 | `archive`；缺定量与流程 |
| INT-R123-UZ-08 | Bayram Osh | [Uzbekistan Travel 官方旅游页面](https://uzbekistan.travel/es/o/el-pilaf-es-la-cabeza-de-todo/) | 页面列为塔什干节庆 plov 变体名称；未给该变体的独立配方 | `archive`；不从普通 Uzbek plov 推导本变体 |
| INT-R123-UZ-09 | Kovatok Palov | 同上 | 页面列为安集延葡萄叶卷配 plov 变体名称 | `archive`；葡萄叶包裹和米饭流程需另证 |
| INT-R123-UZ-10 | Chalov | 同上 | 页面列为希瓦较清淡的 Khorezm plov 变体名称 | `archive`；缺配方合同 |
| INT-R123-UZ-11 | Bedana Palov | [Uzbekistan Travel 官方历史页面](https://uzbekistan.travel/ru/o/uzbekskij-plov-v-xix-veke/) | 页面记录以鹌鹑填配 plov 的变体名称与历史叙述；没有家庭定量、液体、时间 | `archive`；不能从其他 plov 版本借用比例 |

## 去重与排除

1. 主目录已有 `paella` 与 `seafood paella`，本批不重复收录 Spain.info 的 Valencian Paella；但 [官方 Paella 页面](https://www.spain.info/en/recipe/paella/)作为器具／比例证据仍列入来源观察，不计入本批新增数。
2. 主目录已有通用 `chicken biryani`，因此 Pakistani MOFA 的 [Chicken Biryani](https://mofa.gov.pk/pakistani-food) 不计入新增；它的 2 杯米、3 杯水、鸡肉分层和压力锅／普通锅边界可作为“已存在同名版本”的外部证据，不与现有条目拼接。
3. 主目录和 r119–r122 intake 未发现上述土耳其语、南亚海鲜、拉美、西班牙黑米或乌兹别克变体的同名条目；去重按 canonical_name／aliases 的大小写折叠和 Unicode 归一化完成。
4. `direct_one_pot` 仅表示原器具流程连续，不表示能放进电饭煲；paella pan、普通汤锅、厚底锅、tava、kazán 和烤箱必须保留为器具边界。
5. 含鸡、羊、牛、鹌鹑、鱼、虾、墨鱼的候选都不能把“煮熟／焖熟”一句自动升级为本项目安全温度合同；安全终点、份数和液体合同必须另行打开来源、定位、归档。

## 本轮结论

- 新增 intake：**35 条**；其中具备较完整定量与流程、值得优先做来源闭合的候选包括：`Poushtik Khichdi`、`Moong Dal Khichidi`、`Mengen Pilavı`、`Düğün Pilavı`、`Keklikli Pilav`、`Divriği Pilavı`、`Arroz negro`、`Guiso de arroz con pollo`。
- 可直接进入当前“电饭煲轮替”的候选：**0 条**。原因不是名称不真实，而是来源原器具多数为普通锅、paella pan、预煮分层或另锅流程；若未来拓展“非电饭煲一锅饭”品类，应按器具边界重新审查。
- 下一步不应把这批 archive 候选直接改写成中文菜名或电饭煲步骤。应从优先清单中逐条归档原文、补份数／液体／时间／安全合同，再决定是否进入国际档案展示或独立轮替分区。
- 本文不改变 `catalog_version`，不修改主 JSON、CSV、运行时代码、UI 或部署。
