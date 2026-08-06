# Source-backed one-pot batch r87

日期：2026-08-06  
基线：source-backed-one-pot-v1-20260806-national-r86（748 条）  
结果：新增 2 条；版本升至 source-backed-one-pot-v1-20260806-national-r87（750 条）。

本批由 Panasonic 台湾官方、喀什经济开发区政府、塔城政府归档文化资料和机构目录四条线并行核验。Panasonic 与喀什来源可直接复核，新增 1 条 `recipe_fact_checked` 和 1 条 `identity_verified`；塔城“萨格沙”PDF 当前返回 404，暂不入已核验目录；机构线无新增。

## 新增条目

| recipe_id | 菜名 | 来源 | 状态 | 本批边界 |
| --- | --- | --- | --- | --- |
| panasonic-taiwan-gyudon-onion-takikomi-rice | 牛丼洋蔥炊飯 | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/5157) | recipe_fact_checked | 约 2 人份；SR-PAA100 银シャリ水位线 1；生牛五花、鸿喜菇、洋葱同锅炊煮；授权配方不证明传统日本牛丼身份，未给总时间/牛肉安全终点 |
| kashgar-nowruz-rice | 诺鲁孜饭 | [喀什经济开发区管理委员会](https://www.kstq.gov.cn/kashi/msfq/201303/b31c833e4b2a494c99514518e965a831.shtml) | identity_verified | 政府正文确认维吾尔族诺鲁孜节菜名、地域和七类作物/蔬菜/畜禽/干果范围；没有可复现工序或固定必用食材 |

## 暂缓与排除

- `tacheng-mongolian-sagsha-pilaf`：塔城政府归档 PDF 的候选身份有研究价值，但本轮独立访问返回 404，未把不可复核链接写入目录；待原始文件恢复或找到同等级直接来源再登记。
- “十全大补”抓饭仅是诺鲁孜节文章中的描述性短语，不建为独立地域菜名；喀什/哈密抓饭没有独立工艺事实，避免按城市复制已有抓饭。
- FAE 番茄豆肠咖喱饭、米豆鲜蔬拌饭仅证明成品/营养或熟饭拌配，没有生米同锅流程；小米炊饭缺蛋白和蔬菜主餐结构，均不入目录。

## 状态变化

| 状态 | r86 | r87 |
| --- | ---: | ---: |
| executable | 12 | 12 |
| recipe_fact_checked | 652 | 653 |
| identity_verified | 78 | 79 |
| discovered | 6 | 6 |
| 合计 | 748 | 750 |

## 研究纪律

- Panasonic 条目保留官方授权配方的完整原名、SR-PAA100 型号水位线和生牛肉同锅流程，不把水位线外推为通用比例，不把授权页改称传统身份。
- 诺鲁孜饭只登记政府正文实际证明的身份和类别范围，不将“七种”清单转成七项固定食材、份量或做法。
- 没有晋升 `executable` 或 `kitchen_observed`，没有修改运行时、Planner、模板或生产菜单，也没有部署。
- 本批当天完成数据、目录产物、回归测试和进度记录，随后分批提交；不可复核的塔城候选保持在研究报告而不是目录。
