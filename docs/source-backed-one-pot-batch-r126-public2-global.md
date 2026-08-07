# r126 全球一锅米饭资产批次

日期：2026-08-08
目录版本：`source-backed-one-pot-v1-20260808-global-r126`
范围：从 r125 public2 intake 中复核并纳入 6 条官方/大学来源候选。

## 状态与边界

本批 6 条全部为 `recipe_fact_checked`，不晋升 `executable` 或 `preview_ready`。它们是来源资产，不是已经通过本项目厨房验证的用户做法。普通锅、燃气灶锅、平底锅和炊饭器来源保持原器具边界，不把它们转换为电饭煲参数；来源没有给出的份数、时间、液体对象和安全终点保持缺失。普通锅分阶段流程不伪装成一次投料，出锅后投料也按原步骤保留。

| recipe_id | 菜名 | 来源/可证明事实 | 器具与关键缺口 |
| --- | --- | --- | --- |
| `maff-ginger-aburaage-takikomi` | 生姜と油揚げの炊き込みご飯 | [日本农林水产省食育 PDF](https://www.maff.go.jp/j/syokuiku/torikumi/pdf/fam003-.pdf)，p.1；2 人份，1 合米、生姜、油揚げ、酱油/清酒各半大匙、和风出汁 1 小匙，加水到 1 合水位后炊饭器烹调。 | 炊饭器直达来源；未给总时长和独立安全终点，不外推普通锅/具体机型。 |
| `maff-hyogo-aromatic-takikomi` | ひょうご香る炊き込みご飯 | [日本农林水产省近畿农政局 PDF](https://www.maff.go.jp/kinki/syouhi/seikatu/syokuiku/attach/pdf/251114-32.pdf)，p.1；2 人份，鸡胸 90g、玉米 20g、香菇 15g、水 410ml、めんつゆ 35ml、酱油 30ml，燃气灶锅同锅炊煮。 | 普通燃气灶锅；未给米重量、总时长和禽肉安全终点，不转译为电饭煲。 |
| `maff-shincha-takikomi-gohan` | 新茶の炊き込み御飯 | [日本农林水产省茶食育页面](https://www.maff.go.jp/j/seisan/tokusan/cha/chachatto.html)，约 p.359–375；米 300g、水 360g、清酒、盐、昆布出汁、茶叶 4.5g，约 3.5g 入锅，其余茶叶出锅后加入。 | 页面列炊饭器菜单；未给份数、具体机型和总时长；出锅后投茶不改成全程同锅。 |
| `qld-one-pot-beans-rice` | One Pot Beans and Rice | [昆士兰健康与福祉官方食谱](https://hw.qld.gov.au/healthy-recipes/one-pot-beans-and-rice-recipe/)，第 163–221 行；6 份，准备 10/烹调 50 分钟，糙米 1 cup、水 2 cup、三豆罐头 420g、番茄罐头 400g，普通 saucepan 同锅盖锅流程。 | 普通锅直达；无肉类安全终点，不外推电饭煲水位/程序。 |
| `uw-one-pot-chicken-rice-soup` | One-Pot Chicken and Rice Soup | [华盛顿大学 Any Hungry Husky](https://www.washington.edu/anyhungryhusky/2020/05/01/one-pot-chicken-and-rice-soup-gf/)，第 48–78 行；先以 1/2 cup 米和 1 cup 高汤煮约 20 分钟，再加入罐装鸡肉或豆类、四季豆、胡萝卜、洋葱、蒜及剩余高汤至少加热 5 分钟。 | 普通锅分阶段流程；总份数和剩余高汤量未给，不外推电饭煲。 |
| `rda-korea-naengi-panbap` | 냉이팬밥 | [韩国农村振兴厅 Green Magazine](https://rda.go.kr/webzine/2026/04/4_3.html)，第 67–115 行；2 人份，米 200g、荠菜 50g、洋葱半个、鳀鱼/干虾高汤 200ml、大酱半大匙；平底锅炒米 2 分钟、盖锅小火 6 分钟、关火焖荠菜 5 分钟。 | 平底锅来源；高汤含鱼虾并标注过敏边界，未证明电饭煲等价或安全终点。 |

## 验证记录

- 6 个来源 URL 均为官方/大学直达页，并登记 `access_status: opened`、`evidence_tier` 与可复核定位；未用搜索摘要代替原文。
- 目录从 r125 的 884 条 bump 到 r126 的 890 条，`recipe_id` 唯一；新增 6 条均为 `recipe_fact_checked`，0 条 `executable`。
- 专项测试：`tools/tests/source-backed-one-pot-batch-r126-public2.test.mjs`。
- 本批只修改来源目录、批次文档与专项测试，不修改运行时、Planner、前端或 UI，不部署 production。
