<!-- Generated file: do not edit directly. -->

# 东北炖锅数值证据账本

> 研究专用：公开数值证据只用于界定记录字段与证据缺口，不能解除比例规则阻塞，也不能转写为生产参数；实厨校准准入由独立安全证据层决定。

- 来源：5
- 合格同状态来源：0
- 被阻塞规则：2
- 待真人校准：3

## 来源事实与边界

| 来源 | 权利/许可边界 | 分类 | 独立组 | 原料状态 | 数值事实 | 不能证明 |
| --- | --- | --- | --- | --- | --- | --- |
| [不同和面水温对全玉米粉、全玉米面团及全玉米饼品质的影响](https://www.spgykj.com/cn/article/doi/10.13386/j.issn1002-0306.2024110136)（食品工业科技；姜淙允、余锦志、杨成等；2025；检索 2026-07-27；DOI 10.13386/j.issn1002-0306.2024110136） | 受版权保护；仅保留必要的可核对事实与引文信息 | calibration_start_only | food-industry-science-2025 | 100-mesh whole corn flour; 小麦粉 none; 发酵 none; molded_and_steamed | water_per_100g_cornmeal_ml: 120 [120-120] mL water per 100 g cornmeal（200 g 100-mesh whole corn flour plus 240 mL water; no density conversion claimed）；water_temperature_c: 区间 [80-100] C（80-100 C groups had the better reported handling and sensory results） | 锅边炖焖成品、锅边蒸制时间、零售玉米面无需实测即可复用 |
| [Hot Water Cornbread](https://blackpeoplesrecipes.com/hot-water-cornbread/)（Black People's Recipes；Jessica Hylton；2024-02-15；检索 2026-07-27） | All rights reserved；仅保留必要的可核对事实与引文信息 | boundary_only | black-peoples-recipes-jessica-2024 | fine_or_medium; 小麦粉 none; 发酵 none; shallow_fried_with_fat | water_per_100g_cornmeal_ml: 77.8 [77.8-116.7] mL water per 100 g cornmeal（152 g cornmeal; US cups converted to 118-177 mL volume; no water-mass claim） | 锅边炖焖成品、无油锅边饼、生产默认值 |
| [冬日美食\|东北铁锅炖豆角排骨土豆（贴饼子一锅出）](https://m.xiachufang.com/recipe/106078527/)（下厨房；可能是颗人参吧；2021-01-13；检索 2026-07-27） | 用户食谱页面；仅保留必要的可核对事实与引文信息 | boundary_only | xiachufang | 20g mixed with 150g wheat flour; 小麦粉 mixed; 发酵 none; pot_edge_unspecified_duration | dough_water_g: 85 [85-85] g（150 g wheat flour plus 20 g cornmeal; not pure cornmeal）；main_braise_minutes: 区间 [20-25] min（covered braise before opening the pot and adding corn）；pre_paste_additional_braise_minutes: 5 [5-5] min（additional boil after adding corn and before preparing to paste the cakes） | 纯玉米面和面比例、炖锅固定水量、贴饼后蒸制分钟数 |
| [排骨炖豆角](https://m.xiachufang.com/recipe/104432998/)（下厨房；菀菀菀菀菀子酱；2020-03-13；检索 2026-07-27） | 用户食谱页面；仅保留必要的可核对事实与引文信息 | boundary_only | xiachufang | not_present; 小麦粉 not_present; 发酵 not_applicable; ribs_and_beans_braise | total_water_g: 区间 [600-800] g（published total; author notes approximately 500 g initially then 100 g later, not a paste-cake stage rule） | 起始炖锅水量、贴饼阶段补水、锅边饼时间 |
| [东北排骨炖豆角](https://home.meishichina.com/recipe-289741.html)（美食天下；FC美食煮意；2016-09-21；检索 2026-07-27） | 用户食谱页面；仅保留必要的可核对事实与引文信息 | boundary_only | meishichina-fc-food-2016 | not_present; 小麦粉 not_present; 发酵 not_applicable; pressure_then_braise | braise_minutes: 区间 [20-25] min（post-pressure braise; page uses an unquantified liquid level） | 固定液体克数、锅边饼、贴饼后蒸制时间 |

## 机器规则裁决

所有来源均非 `qualified_same_state`：论文仅作 `calibration_start_only`，其余来源仅作 `boundary_only`。不得拼接不同来源的和面水、炖锅水、液位或时间。

| 规则 | 状态 | 合格来源 | 候选来源 | 阻塞原因 |
| --- | --- | --- | --- | --- |
| cornmeal-flour-to-dough-v1 | blocked | 无 | jiang-2025-whole-cornmeal-paper、jessica-hot-water-cornbread-2024 | no_qualified_same_state_source、calibration_2_3_4_servings_pending |
| stew-with-corn-cake-liquid-v1 | blocked | 无 | xiachufang-pot-edge-2021、xiachufang-ribs-beans-2020、meishichina-ribs-beans-2016 | no_qualified_same_state_source、cross_source_liquid_and_time_synthesis_forbidden、calibration_2_3_4_servings_pending |
