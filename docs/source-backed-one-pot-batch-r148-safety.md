# r148 安全终点小批次（5 条既有菜谱）

> 目录版本：`source-backed-one-pot-v1-20260808-global-r148`
> 基线：r147 / 923 条
> 变更类型：只补已有条目的安全合同；新增 canonical：0；晋升 executable：0；运行时代码/UI：0。

## 本批次准入原则

本批只处理 r146 安全审计中已经直接打开原始流程、且能按物种类别挂上项目已有 FoodSafety.gov 来源的 5 条。安全终点补充不改变原菜谱的米量、液体、器具或操作顺序：预煮、预煎、先炒和饭熟回锅都保留。安全温度是终点合同，不是对电饭煲程序时长的推导。

共享安全来源：

- [FoodSafety.gov — Cook to a Safe Minimum Internal Temperature](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)
- `source_id`: `S-SAFETY-TEMPERATURES-1`
- 每条记录都单独附 `claim_scopes: ["safety"]`、`evidence_tier: 1`、`access_status: "opened"` 和定位文本；没有把菜谱原页伪装成安全温度来源。

## 变更清单

| recipe_id | 安全食材 | 新 endpoint | 终点 | 原流程边界 |
|---|---|---|---:|---|
| `tiger-chicken-bamboo-rice` | 鸡胸肉 | `poultry_fully_cooked` | 74°C | 鸡肉切丁后与竹笋、米一起进入 Tiger 炊込み；竹笋仍按来源预煮，机型/白米3刻度/60分钟不外推 |
| `tiger-whitefish-mixed-rice` | 白身鱼 | `seafood_fully_cooked` | 63°C | 白身鱼先按 Tiger 原页在平底锅预煎，再进炊込み，出锅拆骨；不把预煎删除或改成单锅时长 |
| `tiger-chinese-sticky-rice` | 五花肉 | `pork_fully_cooked` | 74°C | 五花肉和配料先炒、糯米浸泡，再入 Tiger おこわ；干虾没有因本次猪肉终点被静默归零 |
| `jp-hiroshima-kakimeshi` | 牡蛎 | `seafood_fully_cooked` | 74°C | 牡蛎先煮取汁，米和出汁进电饭煲，饭熟后回锅焖约10分钟；不改写成无预处理的一键程序 |
| `jp-shiga-amenoio-gohan` | 琵琶鳟 | `seafood_fully_cooked` | 63°C | 鱼先处理并煮汁，米饭煮熟后拆骨拌葱；不把先煮流程压成电饭煲运行时间 |

## 证据与保守边界

- Tiger 三条使用厂商原页证明食材量、流程与程序；FoodSafety.gov 只支撑安全终点。Tiger 页面没有提供中心温度，不能用 35/60 分钟代替安全终点。
- 广岛牡蛎饭与滋贺琵琶鳟饭使用日本农林水产省原页证明地域身份和分阶段流程；MAFF 页面没有安全温度，因此另挂 FoodSafety.gov，不拼接 MAFF 的“煮至熟”与温度数字。
- 鱼类采用 63°C（145°F）鱼类终点；鸡肉采用 74°C（165°F）禽肉终点；猪肉处于米饭混合主餐/砂锅结构，采用 74°C（165°F）混合菜终点；牡蛎饭按混合主餐采用 74°C。每个选择均在该条目的 safety source locator 中写明。
- 本批只声明安全 endpoint，不声明厨房验证，不把 `recipe_fact_checked` 改为 `executable`，不将任何一个原器具参数迁移到普通电饭煲。

## 后续未处理项

- `panasonic-oyster-negi-takikomi-rice`：原页未说明牡蛎是生鲜还是预处理，留在审计清单。
- `panasonic-tokyo-seafood-pilaf`：海鲜综合包的物种和预熟状态未展开，先补身份状态再审安全。
- 五花肉条目中的干虾、以及其他含蛋/生豆但状态不明的条目，另批审计，不因本批次安全来源而自动补 endpoint。
