# r186 既有条目禽肉安全缺口审计

> 审计日期：2026-08-08
> 目录基线：`source-backed-one-pot-v1-20260808-global-r185`（923 条）
> 本轮性质：只审已有条目；不新增 canonical，不改原有数量、液体、时间或器具合同。

## 直接核验的四条

| recipe_id | 官方原页事实 | 回填判断 | 必须保留的边界 |
| --- | --- | --- | --- |
| `tiger-duck-matsutake-rice` | [Tiger 鴨ロースと松茸の炊込みごはん](https://www.tiger-corporation.com/ja/jpn/feature/recipe/post_11/)：2 人份；鸭腿肉 50g 切 1cm 丁，酒和盐调味后与米、松茸同入炊込み程序；页面给 60 分钟。 | 鸭属于禽肉，挂现有 `poultry_fully_cooked` 74°C；原页证明的是生鲜鸭腿进入程序，不把程序时长当作温度证据。 | 胡萝卜、南瓜、银杏仍按来源另行盐煮后出锅铺料；保留 Tiger 机型和 `source_limited`。 |
| `maff-hyogo-aromatic-takikomi` | [农林水产省近畿农政局 PDF](https://www.maff.go.jp/kinki/syouhi/seikatu/syokuiku/attach/pdf/251114-32.pdf)：2 人份；鸡胸 90g，切块后与米、水 410mL、调味液和玉米、香菇同入燃气灶锅炊饭。 | 挂 `poultry_fully_cooked` 74°C；来源直接证明鸡胸作为未熟主料进入同锅流程。 | 原页是燃气灶锅，不转写为电饭煲；不增加总时长。 |
| `instant-pot-one-pot-chicken-brown-rice` | [Instant Pot One Pot Chicken and Brown Rice Dinner](https://instantpot.com/blogs/recipes/one-pot-chicken-and-brown-rice-dinner)：2lb 去骨鸡肉与糙米、鸡汤、蔬菜同入锅，Manual/Pressure Cook 30 分钟，自然泄压 10 分钟后取出切块再回锅。 | 挂 `poultry_fully_cooked` 74°C；来源证明鸡肉在压力烹调前入锅，安全源单独提供终点。 | 保留压力锅、6–8 人范围、取出切回锅的 staged 流程；不外推普通电饭煲。 |
| `illinois-extension-arroz-con-pollo` | [University of Illinois Extension Arroz con Pollo](https://extension.illinois.edu/diabetes/recipes/arroz-con-pollo-chicken-rice)：鸡胸切块后在煎锅中煎至金黄取出；米和汤在原锅焖 20 分钟，鸡肉回锅再煮约 5 分钟。 | 挂 `poultry_fully_cooked` 74°C；原页明确是未熟鸡块先煎、再回锅完成的分阶段主餐。 | 保留普通煎锅及 staged 边界；不把它压成同锅电饭煲流程。 |

## 不在本批闭合

- `tiger-steamed-abalone-rice`：原页先蒸取汁并回锅，鲍鱼状态与贝类终点不能从同一段文字无损归类。
- `maff-ehime-pheasant-dried-daikon-mixed-rice`：雉骨取汤、配料另炒煮后拌饭，属于大批量分阶段流程，不把雉肉安全合同混入同锅字段。
- 其他罐头鱼、腊味、熟肉和状态未展开的 seafood mix 继续保持空安全数组。

本轮只复用已有 `S-SAFETY-TEMPERATURES-1`，四条保持 `recipe_fact_checked`，不晋升 `executable`。
