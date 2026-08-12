# source-backed one-pot · r98 搜集批次

本批继续扩充有原始页面证据的米饭/粥主餐资产，不改运行时规划器，不新增固定菜谱生成逻辑，不把研究条目晋升为 `executable`。目录由 r97 的 773 条变为 **779 条**，本批新增 6 条，全部为 `recipe_fact_checked`。

## 新增条目

| 条目 | 状态 | 一手来源 | 边界 |
|---|---|---|---|
| 玉米雞蓉糙米粥 | recipe_fact_checked | [ZOJIRUSHI Taiwan](https://www.zojirushi.com.tw/recipe/rice-cookers/443/csr) | 糙米粥水位、鸡胸/玉米/鸡蛋、出锅加蛋再加热；缺份数、总时间和独立安全终点 |
| 板栗鸡丝粥 | recipe_fact_checked | [象印中国](https://www.zojirushi-china.com/activity/recipe/rice-cooker/banlijisizhou/) | 2–3 人份、稠粥水位和粥程序；缺总时间和独立鸡肉熟制终点 |
| 金沙皮蛋香菇粥 | recipe_fact_checked | [Panasonic Taiwan](https://pmst.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/5156) | 咸蛋/皮蛋/香菇/白菜粥水位与出锅西芹；不宣称地域传统，缺总时间和份数 |
| 日式野菇雞肉炊飯 | recipe_fact_checked | [ZOJIRUSHI Taiwan](https://www.zojirushi.com.tw/recipe/rice-cookers/549/%E6%97%A5%E5%BC%8F%E9%87%8E%E8%8F%87%E9%9B%9E%E8%82%89%E7%82%8A%E9%A3%AF) | 鸡腿/综合菇/牛蒡、白米刻度和什锦饭程序；缺份数、总时间和安全终点 |
| 紫菜雞粒湯飯 | recipe_fact_checked | [Philips Hong Kong](https://www.philips.com.hk/c-e/ho/philips-chef/recipe-overview-page/main-courses/seaweed-chicken-rice-soup.html) | 明确是熟饭基底、350g 水和 25 分钟再加热，不改写成生米炊饭 |
| 紅豆薏米燕麥粥 | recipe_fact_checked | [Philips Hong Kong](https://www.philips.com.hk/c-e/ho/philips-chef/recipe-overview-page/main-courses/oat-congee-with-red-bean-and-coix-seed.html) | 豆类/谷物/蔬菜粥，粥刻度 0.5、约 2 小时；液体仅“适量”，不补猜毫升数 |

## 状态变化

| 状态 | r97 | r98 |
|---|---:|---:|
| executable | 12 | 12 |
| recipe_fact_checked | 675 | 681 |
| identity_verified | 80 | 80 |
| discovered | 6 | 6 |
| 总数 | 773 | 779 |

本批没有新增 `executable`，没有厨房验证，也没有部署。新增条目保留机型、水位、生熟态和缺失字段边界；后续若进入试做架，仍需单独补安全合同与真实厨房记录。
