# Source-backed one-pot batch r88

日期：2026-08-06  
基线：source-backed-one-pot-v1-20260806-national-r87（750 条）  
结果：新增 4 条；版本升至 source-backed-one-pot-v1-20260806-national-r88（754 条）。

本批继续按“尽可能扩大真实具名菜饭池、证据不越级”并行核验厂商、机构和地域来源。新增 2 条 Panasonic 台湾官方同锅饭、2 条香港卫生署连续流程粥品；地域线本轮没有可靠新增。全部停在 `recipe_fact_checked`，没有晋升 `executable` 或 `kitchen_observed`。

## 新增条目

| recipe_id | 菜名 | 来源 | 状态 | 本批边界 |
| --- | --- | --- | --- | --- |
| panasonic-taiwan-mushroom-vegetable-oil-shallot-rice | 菌菇玉菜油蔥飯 | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/5101) | recipe_fact_checked | 月光米、菇类、蔬菜、豆皮丝与页面原名“去骨仿鸡腿肉”在 SR-PAA100 同锅；鸡高汤 350g 与程序有来源，未给总时间、熟制终点或成品人数；不把仿鸡腿肉改写成真鸡肉 |
| panasonic-taiwan-salmon-daikon-golden-rice | 鮭魚白蘿蔔金黃炊飯 | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/5122) | recipe_fact_checked | 米、鲑鱼、白萝卜同锅，煮好后加入蛋液并保温再加热 5 分钟；3 杯温水和 SR-PAA100 程序有来源，未给总时间、鱼/蛋安全终点；不外推为普通电饭煲比例 |
| hk-mushroom-grass-carp-congee | 香菇魚腩粥 | [香港卫生署 EatSmart](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=864) | recipe_fact_checked | 约 18 份粥底，白米 600g、清水 6.5L，大火约 3 小时；鱼腩、冬菇、葱姜在粥底后投入煮熟；不缩放为家庭份量、不推导电饭煲参数 |
| hk-golden-seafood-congee | 黃金海鮮粥 | [香港卫生署 EatSmart](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=589) | recipe_fact_checked | 5 人份，生米煮粥后加入花蛤、虾、鱿鱼、带子和粟米煮至熟透；保留原锅、水量和“熟透”原文，不补海鲜中心温度或电饭煲适配 |

## 三路结果与排除

### 厂商官方线

- Panasonic 台湾第 3 页直接打开并核对两条新配方，均是主要米饭流程在同一 SR-PAA100 内锅完成。
- Panasonic 台湾“媽媽味的麻油雞飯”明确要求先用外置锅煸姜、炒鸡肉和菇类，核心步骤不符合本批“无需外置锅完成核心”的边界，排除。

### 机构线

- 香港卫生署两条 EatSmart 正文直接给出具名、食材、米水和连续投料顺序，按研究状态收录。
- “粟米南瓜鸡球饭”明确以熟白饭 285g 另制南瓜酱，属于熟饭配菜，不收为生米一锅饭。
- 其余命中项已在目录或属于焗饭、烩饭、汤泡饭等未能由正文证明生米同锅的类别，不按名称或摘要补写。

### 中国地域线

- 赤坎煲仔饭、台山黄鳝饭、永春排骨咸饭、八卦洲芦蒿焖饭/河豚八煲饭均已在目录，不重复建立变体。
- 广东瑶乡糯米菜饭是提前蒸糯米饭后再炒；济宁甏肉干饭是肉与干饭分器具制作；连南“香粳烤肉饭”只有名录列名、同锅机制不明；均不新增。

## 状态变化

| 状态 | r87 | r88 |
| --- | ---: | ---: |
| executable | 12 | 12 |
| recipe_fact_checked | 653 | 657 |
| identity_verified | 79 | 79 |
| discovered | 6 | 6 |
| 合计 | 750 | 754 |

## 研究纪律

- 新增来源均实际直接打开，记录 `evidence_tier`、定位、署名、许可和实际 `claim_scopes`；未把厂商授权配方写成传统地域身份。
- 香港粥品的批量份量、炉上锅器具和“煮至熟透”边界原样保留；缺少的家庭缩放、安全温度和电饭煲适配不由目录推导。
- 本批没有修改 Worker、前端、Planner、模板或 DeepSeek，没有部署；生成产物、专项测试和目录门禁当天完成。
