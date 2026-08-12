# 来源菜饭目录 r105 批次记录（2026-08-07）

本批以 `source-backed-one-pot-v1-20260807-national-r104`（819 条）为基线，新增 5 条厂商官方页面记录，目录升至 `source-backed-one-pot-v1-20260807-national-r105`（824 条）。本批只进入 `recipe_fact_checked`，没有晋升 `executable`，也没有修改运行时或部署产物。

## 新增条目

| recipe_id | 菜名 | 官方来源 | 直接证据范围 | 边界与缺口 |
| --- | --- | --- | --- | --- |
| `r105-tiger-healthy-vegetable-brown-fried-rice` | Healthy Vegetable Fried Rice (Brown Rice)（健康蔬菜糙米炒饭） | [Tiger Corporation USA](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/healthy-vegetable-fried-rice-brown-rice/) | 正文第 62–96 行：糙米 2 杯、水 2 杯、蔬菜/鸡蛋，Brown 程序，出锅拌菠菜、炒蛋和豌豆并焖约 15 分钟 | 页面未给份数和总时长；炒蛋需另行完成，后置拌菠菜/豌豆，登记为熟饭二次烹/分阶段，不伪称全程生料一锅 |
| `r105-tiger-bacon-parmesan-risotto` | Bacon and Parmesan Risotto（培根帕玛森起司炖饭） | [Tiger Corporation USA](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/bacon-and-parmesan-risotto/) | 正文第 69–109 行：3 杯机、白米/培根/洋葱/姜/白葡萄酒/高汤粉/起司，Risotto 刻度 1 与程序；第 107–108 行保留原文 “Place 1 on 2” | 未给份数、总时长和独立培根安全终点；原文短语含义未自行解释，限定 Tiger JAJ 系列 |
| `r105-tiger-corn-shumai-chinese-mixed-rice` | Corn Shumai and Chinese Style Mixed Rice（玉米烧卖与中式什锦饭） | [Tiger Corporation USA](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/corn-shumai-steamed-dumplings-chinese-style-mixed-rice/) | 正文第 62–132 行：5.5 杯机、3 杯白米/3 杯中式鸡汤、猪肉与蔬菜量、Tacook 蒸盘和 Synchro-Cooking 同步流程 | 是米饭加上层烧卖的双层设备方案，不推导普通电饭煲单锅；未给份数/总时长，猪肉安全终点未闭合 |
| `r105-panasonic-taiwan-preserved-egg-pork-congee` | 皮蛋瘦肉粥（Panasonic） | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/216) | 正文第 411–477 行：白米 1 杯、鸡蛋 1–2 个、猪肉丝适量、皮蛋 2–3 个；稀饭水位，开盖投料，蒸气保温约 5–7 分钟 | 猪肉没有固定克数；水位不换算为跨机型体积；总时长与猪肉安全终点缺失，不与其他皮蛋瘦肉粥版本拼接 |
| `r105-zojirushi-taiwan-preserved-egg-pork-congee` | 皮蛋瘦肉粥（象印） | [ZOJIRUSHI Taiwan](https://www.zojirushi.com.tw/recipe/rice-cookers/446/csr) | 正文第 176–227 行：白米 1 杯、皮蛋 2 个、猪肉丝 200 g、姜葱/鸡粉；腌肉、水位 1.5、白米/稀饭程序和完成后加皮蛋葱花 | 未给总时长和独立安全终点；保留象印水位与流程，不与 AFA、Panasonic 或其他来源拼接 |

## 统一状态与来源纪律

- 每条均为厂商/品牌官方直达页面，`access_status: opened`、`evidence_tier: 3`，`evidence_locator` 指向正文字段；不使用搜索摘录替代原文。
- 缺少份数、总时间、安全终点的字段保持 `null` 或空数组；水位线只绑定页面明确的机型和程序。
- 厂商页面只证明该厂商版本的食材、液体、程序和步骤，不宣称地域传统身份；五条均未晋升 `executable`。
- Tiger 健康糙米炒饭保留“炒蛋另行完成、熟饭后置拌料”边界；Tiger 玉米烧卖记录 Tacook 双层同步边界；两种皮蛋瘦肉粥保持独立厂商变体，未合并水位或步骤。

## 验证

- `tools/tests/source-backed-one-pot-batch-r105.test.mjs`：3 个测试通过，覆盖版本/数量、5 条来源与状态、器具边界和去重。
- 直接运行 `validateSourceBackedOnePotCatalog`：824 条目录，0 个目录结构错误。
- `node tools/check-recipes.mjs` 在本批目录上会另外报告既有的三份渲染 artifacts 过期（主 JSON 变更后需由整合者统一重建），本批未修改生成 artifacts，符合任务边界。
