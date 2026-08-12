# Source-backed one-pot batch r86

日期：2026-08-06  
基线：source-backed-one-pot-v1-20260806-national-r85（745 条）  
结果：新增 3 条；版本升至 source-backed-one-pot-v1-20260806-national-r86（748 条）。

本批由日本农林水产省、彭水县政府非遗名录和三条厂商检索线并行核验。新增 2 条 MAFF 具名地域菜饭的完整来源记录，以及 1 条彭水非遗身份记录；厂商线没有新的去重后候选。

## 新增条目

| recipe_id | 菜名 | 来源 | 状态 | 本批边界 |
| --- | --- | --- | --- | --- |
| maff-kanagawa-kate-meshi | かて飯（加料饭） | [日本农林水产省](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/35_8_kanagawa.html) | recipe_fact_checked | 神奈川相模原市；4 人份；具料先煮、煮汁入电饭煲炊米、饭熟混合；不是全部食材同投，未建立通用毫升水量 |
| maff-ehime-pheasant-dried-daikon-mixed-rice | きじ肉と切り干し大根の混ぜご飯（雉肉切干萝卜拌饭） | [日本农林水产省](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/kijiniku_to_kiri_boshi_daikon_no_maze_gohan_ehime.html) | recipe_fact_checked | 爱媛鬼北町；20–25 人份批量；雉骨取汤、具料另炒煮、最后拌饭；三段流程，不改成普通鸡肉或家庭单锅配方 |
| pengshui-zhacai-rice | 馇菜饭 | [彭水县人民政府](https://www.psx.gov.cn/ztzl_174/ydn/psfy/202410/t20241015_13708907.html) | identity_verified | 县级非遗名录只证明项目身份与地域；食材、工序、器具、份量、液体、时间和安全事实全部未证 |

## 去重与排除

- 象印、Panasonic、Cuckoo 等厂商页面本批命中项均已在目录，或明确要求外置煎锅/烤箱、熟饭二次加工或不属于米饭主餐，均不重复入库。
- MAFF 的酱油糯米蒸饭、热饭压制类和蜂蛹拌熟饭页面分别因营养结构、熟饭二次加工或家庭适配性排除。
- 彭水长寿肥肠饭官方正文明确是肥肠、咸菜与白饭分开搭配，不属于一锅菜饭；彭水鼎罐饭已在目录，不重复登记。

## 状态变化

| 状态 | r85 | r86 |
| --- | ---: | ---: |
| executable | 12 | 12 |
| recipe_fact_checked | 650 | 652 |
| identity_verified | 77 | 78 |
| discovered | 6 | 6 |
| 合计 | 745 | 748 |

## 研究纪律

- 新增来源均为直接打开的政府页面，带显式 `evidence_tier`、定位、署名、许可和实际 claim scope；不把“电饭煲参与流程”扩大为“全部食材同锅”。
- かて飯保留“具料另锅煮—电饭煲炊米—饭熟混合”的连续流程；雉肉拌饭保留骨汤、炒煮具料和拌饭的三段流程，且不把雉肉替换为鸡肉。
- 彭水“馇菜饭”只有非遗身份证据，保持 `identity_verified`，不从名称补写配方。
- 没有晋升 `executable` 或 `kitchen_observed`，没有修改运行时、Planner、模板或生产菜单，也没有部署。
- 本批当天完成数据、目录产物、回归测试和进度记录，随后分批提交，避免证据停留在未提交工作区。
