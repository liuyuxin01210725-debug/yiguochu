# r188 甲壳类安全缺口审计

基线：`source-backed-one-pot-v1-20260808-global-r187` / 923 条。

本批只处理已经进入主目录、且官方原文明确使用河蟹/活蟹的两条条目。没有新增 canonical，也没有把传统釜或蒸锅改写成普通电饭煲合同。

| recipe_id | 直达来源与已核实事实 | 可闭合字段 | 保留边界 |
| --- | --- | --- | --- |
| `maff-saga-tsugani-meshi` | [农林水产省「つがにめし 佐賀県」](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/45_19_saga.html)；正文/配方区明确河蟹清洗、去壳去鳃、切半，与米、出汁和调味料同釜炊煮；配方为10人份、河蟹5只。页面同时描述传统处理，不提供现代电饭煲等价程序。 | 挂现有 `shellfish_fully_cooked` 视觉终点：蟹肉呈珍珠白或白色且不透明；来源挂 `S-SAFETY-TEMPERATURES-1`。 | 不填74°C；保留传统釜、活淡水蟹处理和寄生虫/家庭可得性边界，仍不可 executable。 |
| `pingtan-golden-crab-glutinous-rice` | [中国一带一路网「美食推荐」](https://www.yidaiyilu.gov.cn/p/51351.html)；正文第106–110行明确“活金蟳”用老酒浸后切块，配香菇、冬菜，覆浸透糯米后加盖上锅蒸熟。 | 挂同一 `shellfish_fully_cooked` 视觉终点；来源挂 `S-SAFETY-TEMPERATURES-1`。 | 固定批量、液体、蒸制时间、份数和电饭煲适配继续为 null/`not_adapted`；不宣称蒸锅可直接替换电饭煲。 |

## 安全来源

FoodSafety.gov [Cook to a Safe Minimum Internal Temperature](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures) 的甲壳类图表给出虾、龙虾、蟹和扇贝应达到“肉质呈珍珠白或白色且不透明”的视觉终点。本批只复用该视觉终点，不把传统来源缺失的温度、时间或器具参数补猜进去。

## 明确不处理

- 不把两条传统来源晋升为 `executable` 或 B 架。
- 不把蟹壳变红、蒸煮时长或“焖熟”推导成可复现的温度合同。
- 不为 `tiger-steamed-abalone-rice`、`yutian-electric-cooker-lamb-pilaf` 等仍有生熟/部位/流程冲突的条目顺手加端点。
