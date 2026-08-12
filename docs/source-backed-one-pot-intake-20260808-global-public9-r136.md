# 公共机构一锅米饭来源搜集（r136，intake-only）

日期：2026-08-08
主目录去重基线：`source-backed-one-pot-v1-20260808-global-r135`（911 条）
去重范围：主目录 r135，以及 r119–r135 的 global-public、tw/hk/mo、manufacturer 和 regional intake。
本文件只记录研究结果，不修改主 JSON、CSV、运行时代码、UI、构建产物或部署包。

## 本轮结论

本轮转向美国州级公共卫生、大学 Extension 和大学食育页面，直接打开并核对了 11 条具名米饭主餐/米饭配方。它们不是同一类东西，不能为了增加“可轮替”数量而混成一个池：

- **5 条生米同锅或同锅分阶段**：健康佛蒙特的 Spinach and Carrot Rice Pilaf、Easy Veggie Risotto、One Pot Chicken and Rice；UNH Rice Pilaf；以及威斯康星 Polk 的 Arroz con Pollo（普通锅逐阶段版本）。
- **1 条公共大学一锅汤饭但以熟米饭为输入**：NC State 的 Peruvian Chicken and Rice Soup，必须进入未来的熟饭/汤饭分区，不能伪装为生米电饭煲菜饭。
- **4 条熟饭二次烹或另锅/烤箱边界**：佛蒙特 Beef Brown Rice and Broccoli Stir-Fry、Veggie Stir-Fry Over Brown Rice、Wisconsin Sawyer Chicken and Rice、Wisconsin Kewaunee Chicken, Rice, and Broccoli Bake。
- **1 条官方健康平台的分阶段鸡肉饭**：加州 CalFresh Chicken and Rice，直接页面可读但必须保留先炒鸡、另锅煮米后摆放的事实。

本批没有把普通锅参数推导为电饭煲参数，也没有把熟饭、烤箱、慢炖锅或另锅流程塞进当前生米电饭煲轮替。所有条目均保持 `recipe_fact_checked`/`identity_verified` 研究候选，不晋升 `executable`。

## A. 直接核实的新候选

| # | 候选 ID / 具名菜 | 一手来源与定位 | 来源实际证明的字段 | 器具/流程边界 | 当前处理与缺口 |
|---:|---|---|---|---|---|
| 1 | `ncsu-peruvian-chicken-rice-soup` / Peruvian Chicken and Rice Soup（Aguadito de Pollo） | [NC State Cooking Essentials 原页](https://cookingessentials.cals.ncsu.edu/peruvian-chicken-and-rice-soup/)，HTML lines 22–70 | 6 份、每份 2 cups；备料 25 分钟、烹调 45 分钟、总计 70 分钟。鸡腿 1/2 lb、低钠鸡汤 4 cups、熟糙米 1/2 cup、玉米、土豆、胡萝卜、青椒、豌豆和香菜等；页面给出 165°F 鸡肉终点。 | 页面归入 One-Pot Meals；同一大锅，但米是**已煮熟**，在鸡肉和蔬菜汤煮好后才加入。 | `cooked_rice_second_cook`；适合未来熟饭/汤饭专题，不进入生米电饭煲轮替。保留“改编自 Aguadito de Pollo”身份边界，不能把熟米改成生米。 |
| 2 | `healthvermont-spinach-carrot-rice-pilaf` / Spinach and Carrot Rice Pilaf | [Vermont Department of Health/WIC PDF](https://www.healthvermont.gov/sites/default/files/documents/2016/12/cyf_WIC_EatWell_more_brown-rice_recipes.pdf)，PDF p.1（抽取 lines 0–18） | 4 份；黄油 1 tbsp、胡萝卜 1 根、洋葱 1 个、未煮糙米 1 cup、蔬菜或鸡汤 2 cups、鲜菠菜 1 lb。蔬菜炒 3–4 分钟，米再炒 4 分钟，加液体后盖锅小火约 40 分钟，最后拌入菠菜；每份营养列出蛋白 7g、纤维 5g。 | 重锅/普通 saucepan；生米同锅、末段加入叶菜；不是电饭煲来源。 | `direct_one_pot`；可进入普通锅研究候选。缺独立食品安全终点、炉灶到电饭煲不能推导；来源属于 WIC 配方，需后续确认公开展示的署名/许可范围。 |
| 3 | `healthvermont-easy-veggie-risotto` / Easy Veggie Risotto | 同上 Vermont WIC PDF，PDF p.2（lines 18–42） | 4 份；油、洋葱、糙米 1 cup、蒜、低钠鸡/蔬菜高汤 1.5 cups、西兰花、红椒、豌豆、奶油奶酪和帕玛森。米先炒 2–3 分钟，加高汤后盖锅；蔬菜按原文分层放置，最后拌入豌豆、奶酪。每份蛋白 10g、纤维 4g。 | 单一大 skillet 的分阶段一锅流程；页面没有电饭煲程序，蔬菜投料时机不能删除。 | `direct_one_pot` + `staged_in_same_pan`；可作无肉主餐候选，但需营养/器具复核，不能把 risotto 解释成普通电饭煲焖饭。 |
| 4 | `healthvermont-one-pot-chicken-brown-rice` / One Pot Chicken and Rice | 同上 Vermont WIC PDF，PDF p.3（lines 42–69） | 6 份；橄榄油、洋葱、胡萝卜、西芹、未煮糙米 1.5 cups、水 3 cups、6 个鸡腿或 4 个整鸡腿、400°F 烤箱；先炒蔬菜，再拌米和水，把鸡肉放在米上，覆盖烤 45–50 分钟，揭盖再烤 15–20 分钟。页面另列咖喱豌豆变体及每份蛋白 20g。 | 烤箱加盖锅/先 skillet 后转烤盘；是“同一主锅的烤箱阶段”，不是电饭煲。 | `direct_one_pot`（oven-only）；家庭主餐价值高。不能把 400°F/烘烤时间转换成电饭煲程序；禽肉仅写“cooked through”，仍需独立安全终点记录。 |
| 5 | `healthvermont-beef-brown-rice-broccoli-stir-fry` / Beef, Brown Rice and Broccoli Stir-Fry | 同上 Vermont WIC PDF，PDF p.4（lines 69–86） | 3 份；未煮糙米 1 cup、牛排薄片 1/2 lb、西兰花 2 cups、葱和酱油。步骤明确先按包装煮米并放置，再另锅煎牛肉、翻炒蔬菜，最后拌入熟米；每份蛋白 17g、纤维 2g。 | 明确两阶段、至少炒锅+米锅；不是一锅生米饭。 | `cooked_rice_second_cook` + `extra_pan_or_steam`；登记为未来熟饭二次烹候选，不能并入当前一锅生米轮替。 |
| 6 | `healthvermont-veggie-stir-fry-over-brown-rice` / Veggie Stir-Fry Over Brown Rice | 同上 Vermont WIC PDF，PDF p.5（lines 86–105） | 6 份；6 cups 熟糙米作为底，另炒洋葱、西兰花、花椰菜、彩椒、杏仁和调味料；原文步骤先炒蔬菜，再“serve over brown rice”，每份蛋白 6g、纤维 6g。 | 熟饭底 + 另锅炒菜；不是生米同锅。 | `cooked_rice_second_cook`；只作未来剩饭/熟饭分区资料。营养以蔬菜/坚果为主，不宣称完整蛋白主餐。 |
| 7 | `unh-rice-pilaf` / Rice Pilaf | [University of New Hampshire Extension 原页](https://extension.unh.edu/recipe/rice-pilaf)，HTML lines 66–116 | 8 份；备料 5 分钟；油 1 tbsp、糙米 1 cup、洋葱、高汤 1.5 cups、水 1 cup、欧芹和蒜粉。平底锅炒洋葱和米后加入液体，低火盖锅 30–45 分钟；页面还给慢炖锅 2/4 小时版本；营养每份蛋白仅 2g、纤维 1g。 | skillet 或 slow cooker 两种明确器具版本；生米普通锅事实，不外推电饭煲。 | `direct_one_pot`（普通锅）+ `side_dish_review`；虽页面分类为 Entrée & Sandwich，但蛋白很低且正文定位更像调味米饭，不能直接承诺为完整主餐。 |
| 8 | `cdph-calfresh-chicken-rice` / Chicken and Rice | [California CalFresh Healthy Living 原页](https://calfreshhealthyliving.cdph.ca.gov/en/recipes/Pages/Chicken-and-Rice.aspx)，HTML `recipe-ingredients`/`recipe-preparation` 块（2026-08-08 直接打开） | 6 份、每份 1 cup；鸡胸条 2 lb、洋葱、青椒、墨西哥辣椒、蒜、低钠鸡汤 2 cups、番茄罐头、豌豆胡萝卜、孜然/辣椒粉、糙米 3/4 cup。步骤先把鸡条另炒约 10 分钟并取出，再在大 skillet 将其余食材煮沸、盖锅约 30 分钟至米吸收液体，静置 3–5 分钟后摆回鸡肉。 | `staged_or_extra_pan`；同一主餐但鸡肉先取出/回放，不能压成“所有食材一起按煮饭”。 | `recipe_fact_checked` 候选；官方页面没有给禽肉中心温度，需补安全合同与定位；器具是普通锅/skillet，不外推电饭煲。 |
| 9 | `wisconsin-polk-arroz-con-pollo` / Arroz con Pollo Chicken and Rice | [University of Wisconsin–Madison Polk County Extension PDF](https://polk.extension.wisc.edu/files/2012/10/Compiled-Book-Draft-2.pdf)，PDF p.92（lines 2047–2079） | 6 份；油、整鸡、青椒、洋葱、蒜、番茄、鸡汤 2.25 cups、未煮米 1 cup、豌豆。大 skillet 先把鸡肉煎上色，再炒香料，加入番茄/高汤盖煮 20 分钟，之后加入米盖锅小火 20–30 分钟，最后加豌豆。 | 普通大 skillet；同一锅分阶段，另有“整鸡先在沸水煮约 2 小时”的节省成本注释，不能与主流程拼接。 | `direct_one_pot`（普通锅、分阶段）但需 `canonical_review_only`：Arroz con Pollo 已有多个地区/机构版本，不按同名合并；鸡肉安全终点缺失。 |
| 10 | `wisconsin-sawyer-chicken-rice-broccoli` / Chicken and Rice | [University of Wisconsin–Madison Sawyer County Extension PDF](https://sawyer.extension.wisc.edu/files/2010/05/Month_of_Menus.pdf)，PDF p.23（lines 1123–1155） | 4 份、总时长 30 分钟；熟米 3 cups、鸡胸 4 块、奶油鸡汤 10.5 oz、水 1.5 cups、西兰花 2 cups。鸡肉先在 skillet 炒熟后取出；汤和水煮沸，拌入熟米/西兰花，鸡肉回放，盖盖低火 15–20 分钟至 165°F。 | 熟米输入、阶段性取出/回放；不是生米一锅。 | `cooked_rice_second_cook`；可作未来熟饭主餐候选，安全终点明确为 165°F，但不进入当前生米轮替。 |
| 11 | `wisconsin-kewaunee-chicken-rice-broccoli-bake` / Chicken, Rice, and Broccoli Bake | [University of Wisconsin–Madison Kewaunee County Extension PDF](https://kewaunee.extension.wisc.edu/files/2023/10/Chicken-Broccoli-Bake.pdf)，PDF p.1（lines 0–27） | 6 份；熟糙米 3 cups（或先煮 1.5 cups 生米）、洋葱、蒜、蘑菇汤、鸡肉、芹菜、蘑菇、菠菜/羽衣甘蓝、西兰花、胡萝卜、芝士；慢炖锅低 6–8 小时/高 2–3 小时，或 350°F 烤 45 分钟。原文明确要求米先单独煮，或使用剩饭。 | `cooked_rice_second_cook`；slow cooker/oven，绝不转换成电饭煲。 | 未来熟饭/慢炖分区 `archive_or_review`；步骤、份数齐全但不是当前生米一锅饭。 |

## B. 边界与去重记录

1. **同名不合并**：本批 `Chicken and Rice`（CalFresh、Sawyer、Vermont）以及 `Arroz con Pollo`（Polk）都是不同机构的独立版本；即使菜名相同，也保留来源、米态、器具和阶段差异，不覆盖主目录已有版本。
2. **熟饭边界不放宽**：NC State、Vermont Beef/Vegetable Stir-Fry、Wisconsin Sawyer/Kewaunee 都要求熟米、剩饭或先独立煮米；它们只能登记为未来 cooked-rice second-cook 家族，不能为了增加当前轮替数而改成生米方案。
3. **器具不做等价推导**：Vermont One Pot Chicken and Rice 的 400°F 烤箱、UNH 的慢炖锅 2/4 小时、Kewaunee 的慢炖锅/烤箱以及普通 skillet 参数均只证明原器具事实。没有来源直接写电饭煲，就不建立电饭煲合同。
4. **主餐/配菜诚实区分**：UNH Rice Pilaf 的每份蛋白仅 2g，Vermont Veggie Stir-Fry Over Brown Rice 的来源本身是熟饭配蔬菜；两者不因页面的“Entrée”或米饭主角字样自动成为营养完整主餐。
5. **安全合同不补写**：仅 Wisconsin Sawyer 明确写 165°F；其他鸡肉/牛肉条目原文没有中心温度的，保持缺口，后续另找安全来源并用 `safety` scope 记录，不能把公共卫生常识回填成原方数字。
6. **与 r119–r135 去重**：逐条对照主目录及 intake 名称、别名和 URL，未发现本批 11 条的直达 URL 已被现有条目占用；其中常见 canonical（Chicken and Rice、Arroz con Pollo、Rice Pilaf）仍需入库前由人工决定是否作为独立来源版本保留。

## C. 后续建议（不在本轮入库）

优先建立事实矩阵的顺序：

1. `healthvermont-one-pot-chicken-brown-rice`：6 份、米水量和烤箱流程完整，营养含蛋白；先补禽肉安全终点，保持 oven-only。
2. `healthvermont-spinach-carrot-rice-pilaf` 与 `healthvermont-easy-veggie-risotto`：无肉但有纤维/奶酪蛋白，适合作为“无肉一锅饭”家族研究；先确认 WIC 来源展示许可和器具边界。
3. `cdph-calfresh-chicken-rice` 与 `wisconsin-polk-arroz-con-pollo`：普通锅分阶段流程完整，但需安全合同和 canonical 审查。
4. `ncsu-peruvian-chicken-rice-soup`、`wisconsin-sawyer-chicken-rice-broccoli`、`wisconsin-kewaunee-chicken-rice-broccoli-bake`：归档到熟饭/二次烹分区，不进入当前生米轮替。

本 intake 不改变目录状态，不新增 recipe，不调用运行时，也不部署。
