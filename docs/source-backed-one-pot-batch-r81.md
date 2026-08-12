# Source-backed one-pot batch r81

日期：2026-08-06  
基线：source-backed-one-pot-v1-20260806-national-r80（722 条）  
结果：新增 7 条；版本升至 source-backed-one-pot-v1-20260806-national-r81（729 条）。

本批继续只收录公开、直接打开核验的官方来源，不修改运行时代码，不部署，不把菜名或通用抓饭常识扩写成做法。

## 新增条目

| recipe_id | 菜名 | 来源 | 状态 | 本批边界 |
| --- | --- | --- | --- | --- |
| philips-red-bean-beef-brown-rice-vegetable-rice | 紅豆牛肉糙米菜飯 | [Philips Hong Kong](https://www.philips.com.hk/c-e/ho/philips-chef/recipe-overview-page/main-courses/vegetable-brown-rice-with-minced-beef-and-red-bean.html) | recipe_fact_checked | 保留糙米 2 杯刻度、同锅材料和焗 10 分钟；不外推指定型号，不补安全终点 |
| philips-spinach-salmon-congee | 菠菜三文魚粥 | [Philips Hong Kong](https://www.philips.com.hk/c-e/ho/philips-chef/recipe-overview-page/main-courses/spinach-salmon-congee.html) | recipe_fact_checked | 保留儿童 8 个月以上边界、4 小时煲粥和最后 15 分钟投料；不改写成人配方 |
| philips-sea-conch-oyster-chicken-congee | 螺片金蠔滑雞粥 | [Philips Hong Kong](https://www.philips.com.hk/c-e/ho/philips-chef/recipe-overview-page/main-courses/chicken-congee-with-dried-oyster-and-sea-conch.html) | recipe_fact_checked | 保留指定型号 0.5 杯粥刻度和 4 小时程序；不外推普通电饭煲 |
| panasonic-my-century-egg-chicken-congee | Century Egg & Chicken Congee | [Panasonic Malaysia](https://www.panasonic.com/my/consumer/kitchen-appliances-learn/healthy-everyday-recipes/recipe-top-page/century-egg-chicken-congee.html) | recipe_fact_checked | 3 份、23 分钟和电饭煲流程有来源；前置需搅拌机，不能冒充传统皮蛋瘦肉粥，鸡肉安全终点未闭合 |
| panasonic-my-chicken-pumpkin-lotus-mixed-rice | Mixed Rice with pumpkin and lotus roots | [Panasonic Malaysia](https://www.panasonic.com/my/consumer/kitchen-appliances-learn/healthy-everyday-recipes/recipe-top-page/mixed-rice-with-pumpkin-and-lotus-roots.html) | identity_verified | 官方导语与编号步骤对 200 克鸡腿投料时点不一致；不补写缺步、不晋升 |
| wuerhe-awudan-lamb-shank-pilaf | 阿吾丹羊拐抓飯 | [乌尔禾区人民政府](https://www.weh.gov.cn/weh/ggwhfw/202601/e98f3ec08a7e4286a13af4bee5ec790a.shtml)、[塔城地区行政公署](https://www.xjtc.gov.cn/bmfw/lyzx/content_49591) | identity_verified | 两条政府来源只证明具名地域身份；不把羊拐扩写为羊肉部位或通用抓饭流程 |
| shache-pea-meat-pilaf | 豌豆肉抓飯 | [莎车县文化体育广播电视和旅游局](https://www.shache.gov.cn/scx/c125664/202505/b12dd32cca16434d88009746fa4dff96.shtml) | identity_verified | 来源只证明真实菜名和地域身份；不从菜名补写食材、液体或流程 |

## 状态变化

| 状态 | r80 | r81 |
| --- | ---: | ---: |
| executable | 12 | 12 |
| recipe_fact_checked | 634 | 638 |
| identity_verified | 70 | 73 |
| discovered | 6 | 6 |
| 合计 | 722 | 729 |

## 研究判断

- Philips 红豆牛肉糙米菜饭、菠菜三文鱼粥、螺片金蚝滑鸡粥和 Panasonic 皮蛋鸡肉粥均有单一官方原页支持，进入研究事实层，但未晋升 executable。
- Panasonic 南瓜莲藕鸡腿杂粮饭因页面内部投料步骤矛盾，保持 identity_verified。
- 阿吾丹羊拐抓饭、莎车豌豆肉抓饭只有官方身份证据，保持 identity_verified；下一步需寻找当地原始做法，不能拼接其他抓饭版本。
- 本批没有新增 executable，没有新增厨房验证记录，没有修改 Worker、前端、Planner 或部署配置。

## 排除项

- Panasonic Yellow Curry Rice：官方明确蛋白质另配，不符合当前一锅主餐边界。
- Panasonic Pineapple Red Rice：熟饭二次烹饪，登记到未来“剩饭一锅”候选，不进入当前生米目录。
- Zojirushi Paella/Jambalaya：海鲜、香肠等另锅处理后再混合，不是本阶段单锅主餐。
- 新疆诺鲁孜饭：来源对多谷物节庆饭/稠粥表述不一致，暂不制造稳定菜饭条目。
- 通用碎肉抓饭：学校配餐通用菜名，未证明具体地域具名身份，不以它凑地域条目。
