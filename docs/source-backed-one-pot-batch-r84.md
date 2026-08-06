# Source-backed one-pot batch r84

日期：2026-08-06  
基线：source-backed-one-pot-v1-20260806-national-r83（742 条）  
结果：新增 2 条；版本升至 source-backed-one-pot-v1-20260806-national-r84（744 条）。

本批由象印官方、日本农林水产省和重庆地方志三条检索线并行核验。象印线重新打开并核对了两条高质量候选，但它们已在 r66 目录中存在，因此只做去重确认，不重复入库；最终新增 1 条 `recipe_fact_checked` 和 1 条 `identity_verified`。

## 新增条目

| recipe_id | 菜名 | 来源 | 状态 | 本批边界 |
| --- | --- | --- | --- | --- |
| maff-chicken-shiitake-chinese-steamed-rice | 鶏肉と椎茸の中華風蒸しご飯 | [日本农林水产省](https://www.maff.go.jp/j/seisan/kakou/mezamasi/recipe/recipe258.html) | recipe_fact_checked | 2 人份、米 2 合、水 240cc、鸡腿 350g、香菇 4 枚；蒸锅强火 25–30 分钟；不是电饭煲，禽肉安全终点缺失 |
| wansheng-potato-green-bean-kongfan | 万盛箜饭 | [重庆市地方志办公室](https://dfz.cq.gov.cn/fzyd/llyj/202401/t20240105_12790863.html) | identity_verified | 官方正文只明确“箜饭（洋芋、四季豆）”这一地域身份和食材括号；不从“箜饭”补写米、液体、流程、器具或时间 |

## 去重确认

- `zojirushi-brown-rice-salmon-shiitake`：象印美国官方糙米三文鱼香菇饭，指定 NL-GAC10/18、NS-TSC10A/18 和 BROWN RICE 水位线；已存在于 r66，保留原 source_id 和边界。
- `zojirushi-new-orleans-red-beans-rice`：象印美国官方 New Orleans Style Red Beans and Rice，4 份、2 rice-cup 米和 2.5 rice-cup 鸡汤、MIXED 程序；已存在于 r66，不重复建版本。

## 状态变化

| 状态 | r83 | r84 |
| --- | ---: | ---: |
| executable | 12 | 12 |
| recipe_fact_checked | 649 | 650 |
| identity_verified | 75 | 76 |
| discovered | 6 | 6 |
| 合计 | 742 | 744 |

## 明确排除

- MAFF 的熟饭炊饭、炒饭和先炒后电饭煲页面均不纳入；本批只保留生米与主要蛋白同器皿蒸制的候选。
- 万盛箜饭与四川箜饭、綦江腊肉箜饭保持身份分离；本批不把洋芋、四季豆扩写成米饭配方，也不提前判断其营养结构。
- 象印 Halal chicken rice、Portabella beef rice、Tuna seafood pilaf、Tofu rice、Buttered lobster rice 因外置锅、熟饭再加工或出锅后另配核心食材排除。

## 研究纪律

- 新增来源均直接打开，带 `evidence_tier`、`evidence_locator`、署名、许可和实际 claim scope。
- 蒸锅和象印指定机型的水量、程序、时间只属于原来源，不外推普通电饭煲；肉类/鱼类安全终点缺失均保持为空。
- 新增条目没有晋升 `executable` 或 `kitchen_observed`，没有修改运行时、Planner、模板或生产菜单。

