# Source-backed one-pot batch r90

日期：2026-08-06  
基线：source-backed-one-pot-v1-20260806-national-r89（756 条）  
结果：新增 2 条；版本升至 source-backed-one-pot-v1-20260806-national-r90（758 条）。

本批继续按“尽可能扩大真实具名菜饭池、证据不越级”并行核验厂商、机构和地域来源。两条新增均为 Panasonic 台湾官方详情页直接支持的同锅米饭，状态为 `recipe_fact_checked`，没有晋升 `executable` 或 `kitchen_observed`。

## 新增条目

| recipe_id | 菜名 | 来源 | 状态 | 本批边界 |
| --- | --- | --- | --- | --- |
| `panasonic-taiwan-mullet-roe-scallop-seafood-rice` | 迎春乌鱼子干贝海味饭 | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/3909) | `recipe_fact_checked` | 白米、红藜麦、干贝、干香菇、昆布按 SR-PAA100 银シャリ 2 杯水位线同锅；乌鱼子仅在煮好后装饰，不算同锅熟制核心；未给总时间或海鲜安全终点，不外推为普通电饭煲比例 |
| `panasonic-taiwan-butter-corn-mushroom-rice` | 奶油玉米香菇炊饭 | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/3903) | `recipe_fact_checked` | 白米、玉米、胡萝卜、鲜香菇和无盐奶油同锅，约 55 分钟；没有明确蛋白质主料，作为碳水加蔬菜/纤维的低优先研究资产，不包装成营养完整主餐 |

两条来源均为 Panasonic Cooking Taiwan 官方详情页，已直接打开并记录实际 claim scope、定位和 `evidence_tier=3`。它们只证明指定 SR-PAA100 机型的水位线和程序，不证明普通电饭煲的通用水量，也不证明传统地域身份。

## 三路结果与排除

### 厂商官方线

- 两条 Panasonic 页面均保留为具名厂商配方：生米、配料和指定机型程序在同一内锅完成，适合扩充真实菜饭档案。
- `龙虾米糕`本轮排除：熟米二次加工且需要另锅/烤箱处理龙虾，不符合当前生米连续一锅边界。

### 机构线

- 官方台湾原住民族谷物页面的红糯米饭、台湾藜饭均为纯谷物电锅饭，缺少蛋白质与蔬菜/豆类。按“至少两类营养、优先碳水+蛋白质+膳食纤维”的主餐收集线排除，不把它们伪装成完整菜饭。

### 中国地域线

- 武隆鼎罐糯米箜饭、佤族鸡肉烂饭、傣族香竹饭、克州抓饭、湘西社饭均已在目录，去重不新增。
- 哈密“抓饭”本轮只有泛称，济南把子肉干饭为肉与干饭分做，孔干饭未形成新的独立具名且可复核的一锅做法；三者均不新增。

## 状态变化

| 状态 | r89 | r90 |
| --- | ---: | ---: |
| executable | 12 | 12 |
| recipe_fact_checked | 659 | 661 |
| identity_verified | 79 | 79 |
| discovered | 6 | 6 |
| kitchen_observed | 0 | 0 |
| 合计 | 756 | 758 |

## 研究纪律

- 新增来源均实际直接打开，记录 `evidence_tier`、定位、署名、许可和实际 `claim_scopes`；没有把厂商授权配方包装成传统地域身份。
- 生米、同锅配料、指定机型水位线和程序原样记录；缺少的总时间、海鲜安全终点、家庭缩放和普通电饭煲参数不由目录推导。
- 奶油玉米香菇炊饭保留在研究池，但因没有明确蛋白质主料，不进入首批营养完整主餐优先展示清单。
- 本批没有修改 Worker、前端、Planner、模板或 DeepSeek，没有部署；r90 专项、全量串行测试、目录门禁和菜谱门禁均已通过。
