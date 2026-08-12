# Source-backed one-pot batch r83

日期：2026-08-06  
基线：source-backed-one-pot-v1-20260806-national-r82（738 条）  
结果：新增 4 条；版本升至 source-backed-one-pot-v1-20260806-national-r83（742 条）。

本批由 Panasonic 日本官方、香港中华煤气有限公司官方食谱页和地域政府/非遗线三路并行核验。只有 4 条达到“具名、原始页面可直接打开、明确是一锅米饭主餐流程”的研究收录线；地域线其余命中保持为补证或排除报告，没有为凑数新建条目。

## 新增条目

| recipe_id | 菜名 | 来源 | 状态 | 本批边界 |
| --- | --- | --- | --- | --- |
| panasonic-carrot-pilaf-mj-l600 | にんじんピラフ | [Panasonic Japan Cooking](https://panasonic.jp/cooking/recipe/juice/0451.html) | recipe_fact_checked | 4 人份、白米 3 合、胡萝卜汁榨渣 60g、培根 50g、黄油 20g，3 合水位线；依赖 MJ-L600 榨汁机，不能替换成胡萝卜丁，时间/培根安全终点缺失 |
| towngas-fresh-pineapple-chicken-multigrain-rice | 鲜菠萝鸡肉高纤多谷饭 | [香港中华煤气有限公司](https://www.towngasappliance.com/newsletter/ricecooking/c01.php) | recipe_fact_checked | 明火饭盘 45 分钟；鸡肉和蔬菜先煮，菠萝熄火焗后加入；不外推电饭煲 |
| towngas-asparagus-shrimp-quinoa-rice | 芦笋虾仁藜麦饭 | [香港中华煤气有限公司](https://www.towngasappliance.com/newsletter/ricecooking/c02.php) | recipe_fact_checked | 明火饭盘 30 分钟；米/藜麦先煮，虾仁和芦笋中途加入；虾仁熟制终点缺失 |
| towngas-nest-egg-minced-beef-rice | 窝蛋牛肉饭 | [香港中华煤气有限公司](https://www.towngasappliance.com/newsletter/ricecooking/c04.php) | recipe_fact_checked | 明火饭锅 35 分钟；牛肉末先铺饭面，熄火后加鸡蛋焗 15 分钟；无蔬菜，牛肉/鸡蛋安全终点缺失 |

## 状态变化

| 状态 | r82 | r83 |
| --- | ---: | ---: |
| executable | 12 | 12 |
| recipe_fact_checked | 645 | 649 |
| identity_verified | 75 | 75 |
| discovered | 6 | 6 |
| 合计 | 738 | 742 |

## 地域线补证与排除

- 台州“黄鱼焖土灶饭”官方报道只补充既有 `taizhou-yellowfish-rice` 的名称/地域线索，没有新建版本，也没有从报道补写食材、液体或流程。
- 江门政府页面明确台山菜果饭使用“煮好的米饭”拌炒后再焖，属于熟饭二次处理；按当前目录边界不伪装成生米一锅饭。
- 温州糯米饭、古县乌米饭、崂山竹筒饭等本轮只读到名录或身份页，没有建立完整主餐事实，继续留在研究报告。

## 研究纪律

- 所有新增来源均直接打开，带 `evidence_tier`、`evidence_locator`、署名、许可和实际 claim scope。
- 厂商页面只证明其自身器具、程序和分段流程，不证明传统地域身份，也不推导普通电饭煲参数。
- 中途投料、熄火后投蛋、榨汁机前处理、缺失安全终点均如实保留；没有拼接其他菜谱版本，也没有晋升 `executable` 或 `kitchen_observed`。

