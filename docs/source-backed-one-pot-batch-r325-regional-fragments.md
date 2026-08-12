# r325 · 四条地域饭食来源工艺片段

基线：`source-backed-one-pot-v1-20260810-global-r293` / 923 条。

本批不新增 canonical，也不把身份来源升级成可直接轮替配方。只把官方原文明确写出的“组成/成饭/交融/焖饭”片段写进 `cooking_sequence`，让研究卡能显示来源事实；固定份数、液体、总时长、安全终点和电饭煲适配仍保持缺失。

| recipe_id | 直接来源 | 写入的来源片段 | 保留缺口 |
| --- | --- | --- | --- |
| `kashgar-nowruz-rice` | [喀什经济开发区政府：诺鲁孜节由来与诺鲁孜文化](https://www.kstq.gov.cn/kashi/msfq/201303/b31c833e4b2a494c99514518e965a831.shtml) | 七种作物、七种蔬菜、七种畜禽肉、干果类别；做成后节日共同食用 | 没有比例、投料顺序、液体、火力、时间或安全终点 |
| `cn-quanzhou-nanan-penghua-mustard-rice` | [泉州官方美食网站：到泉州乡野开启“土味之旅”](https://www.quanzhou.gov.cn/gastronomy/ch/msdh/xwqz/202509/t20250909_3208177.htm) | 霜打芥菜与喷香软糯米饭交融 | 没有切配顺序、批量、液体、时间或安全终点 |
| `hongdong-steamed-rice` | [文化和旅游部：山西·临汾乡村旅游线路](https://zhuanti.mct.gov.cn/csxz2022/shanxi/detail_g7yU_708/4402.html) | 黍米或江米制成蒸饭；喜宴红枣语境 | 没有红枣用量、蒸制时间、液体或电饭煲参数 |
| `cn-shanxi-wuxiang-millet-braised-rice` | [长治市信用长治：武乡小米产业](https://credit.changzhi.gov.cn/82/17645.html) | “小米焖饭”的地域工艺记忆片段 | 没有配菜、批量、液体、详细步骤、时间或安全终点 |

四条仍为 `identity_verified`，不进入 B 架；研究页会在来源片段后继续显示估算起步量，但估算不等于原方。
