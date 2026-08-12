# r125 全球一锅米饭资产批次

日期：2026-08-08
目录版本：`source-backed-one-pot-v1-20260808-global-r125`
范围：从 r123/r124 international/public intake 中复核并纳入 9 条官方来源候选。

## 状态与边界

本批 9 条全部为 `recipe_fact_checked`，不晋升 `executable` 或 `preview_ready`。它们是来源资产，不是已经通过本项目厨房验证的用户做法；没有把普通锅、paella pan 或公共机构配方转换成电饭煲参数。禽肉、蛋类、鱼贝等安全终点若来源没有独立证明，`safety_endpoints` 保持空数组。

| recipe_id | 菜名 | 来源/可证明事实 | 关键缺口 |
| --- | --- | --- | --- |
| `global-pmposhan-poushtik-khichdi` | Poushtik Khichdi | [PM POSHAN Odisha review PDF](https://pmposhan.education.gov.in/Files/Review/Fifth_Review/Odisha/JRM_Report_Odisha_MDM.pdf)，p.63；25 份，米 500g、分裂绿豆 225g、油 50g、洋葱 100g、蔬菜 2 杯、绿叶菜半杯，约两倍水，盖锅煮软。 | 无家庭缩放、总时长、温度或电饭煲程序。 |
| `global-ayush-moong-dal-khichidi` | Moong Dal Khichidi | [印度 AYUSH PDF](https://ayush.gov.in/resources/pdf/health/ARPHHC19.pdf)，p.40；米豆比例 1:1、1:1/2 或 1:1/4，油/岩盐/姜/阿魏/姜黄，六份水器皿煮。 | 无份数、时间、具体器具和安全终点。 |
| `global-argentina-nea-arroz-pollo` | Guiso de arroz con pollo (NEA) | [阿根廷政府 NEA 食谱册](https://www.argentina.gob.ar/sites/default/files/2020/09/pnpa_-_2021_-_recetario_nea.pdf)，p.61；蔬菜炒约 25 分钟，番茄泥+0.5L 热水约 30 分钟，土豆近熟时加入半杯米再煮约 15 分钟。 | 分阶段炖锅流程，无家庭份数、总时长合同和鸡肉安全终点。 |
| `global-spain-arroz-negro` | Arroz negro | [Spain.info](https://www.spain.info/en/recipe/arroz-negro/)；巴利阿里群岛，6 人份，米 600g、鱼贝高汤 1.25L、墨鱼 0.5kg，paella pan 高火 5 分钟/低火 15 分钟，总时长 35 分钟。 | 鱼贝安全终点和电饭煲适配未证明。 |
| `global-nwu-one-pot-chicken-rice` | One-Pot Chicken and Rice | [North-West University Recipe Book PDF](https://health-sciences.nwu.ac.za/sites/health-sciences.nwu.ac.za/files/files/Consumer_Sciences/Documents/Resepteboek_2024_B5.pdf)，pp.37–38；4 份，鸡腿 450g、白米 200g、冷冻蔬菜 225g、洋葱 240g、水 500ml、鸡汤块 20g，普通锅低火约 20–30 分钟。 | 时间为范围；无鸡肉安全终点和电饭煲适配。 |
| `global-fnde-arroz-colorido-soy` | Arroz Colorido com Carne de Soja | [巴西 FNDE PDF](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnae/campanhas/concurso-melhores-receitas/receitas/to-1/receita_escola_blandina.pdf/)；10 份、90 分钟，米/胡萝卜/玉米/葡萄干/大豆蛋白/番茄有量；大豆蛋白浸泡，同锅炒料，加热水至覆盖。 | 液体非固定比例；无安全终点和电饭煲参数。 |
| `global-irga-risoto-frango-legumes` | Risoto de Frango com Legumes | [巴西 IRGA](https://irga.rs.gov.br/risoto-de-frango-com-legumes)；4 份（每份 360g），米 300g、鸡肉 300g、西兰花 300g、蔬菜高汤 1.5L，普通锅分次加汤。 | 无总时长、鸡肉安全终点和电饭煲适配。 |
| `global-peru-minsa-arroz-pollo` | Arroz con Pollo（CENAN 版本） | [秘鲁卫生部 Minsa/CENAN](https://www.gob.pe/institucion/minsa/noticias/42250-el-pollo-es-una-importante-fuente-de-fosforo-y-potasio)；每份鸡肉 100g、米 100g、豌豆 20g、胡萝卜 30g、油 8cc 等；先炒调味料，再加鸡肉和蔬菜，降火煮米。 | 无液体、总时长、鸡肉安全终点；不与其他同名版本合并。 |
| `global-greece-mushroom-mageiritsa` | Mushroom Mageiritsa | [Greek National Tourism Organisation](https://www.visitgreece.gr/experiences/gastronomy/recipes/mushroom-mageiritsa/)；6 份、45 分钟，蘑菇 500g、菠菜 400g、糙米 100g、水 1L；普通锅分阶段炒、焖煮，蛋柠汁调和后回锅。 | 无蛋类安全终点和电饭煲适配；蛋柠汁不是一次投料。 |

## 验证记录

- 9 个来源 URL 均以官方/大学/国家旅游机构直达页登记，并带 `access_status: opened` 与定位信息；PDF 数字按页码记录，未用搜索摘要代替。
- 目录版本从 r124 bump 到 r125，条目数从 875 增至 884，recipe_id 唯一。
- 专项测试：`tools/tests/source-backed-one-pot-batch-r125.test.mjs`。
- 本批不修改运行时、Planner、前端或 UI，不部署 production。
