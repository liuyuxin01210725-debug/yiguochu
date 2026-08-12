# 安全终点缺口 intake（r149：港台／Panasonic 重点复核）

> 审计日期：2026-08-08
> 目录基线：`source-backed-one-pot-v1-20260808-global-r148`（923 条）
> 本轮性质：只做既有条目的安全缺口 intake；不修改主 JSON、CSV、运行时代码、UI，也不新增 canonical。
> 结果：4 条可挂现有官方安全终点来源的候选，1 条因原料状态不明继续保留缺口；主目录仍为 r148/923，`safety_endpoints` 未在本轮写入。

## 目的与判定口径

r148 已将同一份可定位的 FoodSafety.gov 政府来源 `S-SAFETY-TEMPERATURES-1` 用于一批安全终点。r149 只检查以下五个已有 `recipe_fact_checked` 条目是否满足同一受控条件：

1. 原始菜谱明确是动物性原料，并且流程没有证明它是罐头、熟制品或已经完成安全处理的预制料；
2. 能把物种类别映射到现有 endpoint（禽肉 `poultry_fully_cooked`，海鲜/甲壳类 `seafood_fully_cooked`）；
3. 安全数值只能引用既有官方来源的适用范围，不能把电饭煲程序分钟数、焖饭时间或“大火”当作温度终点；
4. 这份 intake 的“可挂”表示下一批可以按 TDD 在 JSON 中挂 `S-SAFETY-TEMPERATURES-1`，并不表示本轮已经晋升或允许公开承诺。

现有安全来源： [FoodSafety.gov Safe Minimum Internal Temperatures](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)，目录中已打开、tier 1；本轮不复制其内容，只复用项目已有 source id 和定位纪律。

## r149 结果

| recipe_id | 原页与原料状态 | 可挂的现有 endpoint | 现有来源与定位边界 | 器具／流程边界 | 本轮结论 |
|---|---|---|---|---|---|
| `panasonic-chicken-cream-pilaf` | [Panasonic Foodable 原页](https://foodable.jpn.panasonic.com/recipes/group-detail/607)；鸡腿肉 80g 与米、鸡汤同锅炊饭，页面没有预熟鸡肉步骤；饭熟后再加鲜奶油和黄油焖 5 分钟 | `poultry_fully_cooked`，禽肉 74°C/165°F | 复用 `S-SAFETY-TEMPERATURES-1`；定位必须写明 poultry 165°F/74°C，不能用“焖 5 分钟”替代 | Panasonic 电饭煲；奶油/黄油是成饭后的收尾，不属于禽肉安全证据 | **候选可挂**；下一批补 safety source ref 与 endpoint，保留电饭煲原方 |
| `taiwan-vegetable-chicken-rice` | [台湾农粮署电子书原页](https://ebook.afa.gov.tw/tefd/ebook8/ebook8-1.html)；鸡肉约 200g，先炒香蔬菜，再加入生米和鸡块煮熟；原页注明可用电锅 | `poultry_fully_cooked`，禽肉 74°C/165°F | 复用 `S-SAFETY-TEMPERATURES-1`；只证明禽肉终点，不把原页“煮熟”改写为温度来源 | 分阶段炒香＋米饭同锅；保留农粮署电锅事实，不补总时长 | **候选可挂**；下一批可补 endpoint，仍不晋升 executable |
| `hk-pumpkin-taro-chicken-claypot-rice` | [香港卫生署 EatSmart 原页](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=751)；鸡胸肉 75g，腌后与米、南瓜、芋头入煲；原页未标预熟 | `poultry_fully_cooked`，禽肉 74°C/165°F | 复用 `S-SAFETY-TEMPERATURES-1`；定位只挂禽肉终点 | 原器具是煲仔，10 分钟＋5 分钟的分段煮制不能推成电饭煲程序 | **候选可挂**；补 endpoint 时保持煲仔边界 |
| `hk-taro-shrimp-multigrain-steamed-rice` | [香港卫生署 EatSmart 原页](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=592)；鲜虾 6 只在米、芋头先蒸约 30 分钟后加入，再大火约 15 分钟＋1 分钟 | `seafood_fully_cooked`，虾/甲壳类按项目现有安全约束采用 74°C/充分加热 | 复用 `S-SAFETY-TEMPERATURES-1`；下一批必须在 locator/notes 中明确甲壳类适用范围，不能以“最后大火 1 分钟”作终点 | 瓦煲蒸饭、中途投虾；不外推电饭煲，也不把分段时间压成单锅时间 | **候选可挂**；补 endpoint 时保留中途投料流程 |
| `panasonic-oyster-negi-takikomi-rice` | [Panasonic Foodable 原页](https://foodable.jpn.panasonic.com/recipes/group-detail/905959)；牡蛎约 120g 直接铺在米面按机型水位线炊饭，但页面没有明确写“生牡蛎”或预熟状态 | 暂不能挂；若后续确认是生鲜牡蛎，再候选 `seafood_fully_cooked` | 现有 `S-SAFETY-TEMPERATURES-1` 不能替原料状态证明；不能把 54–60 分钟、水位线或“牡蛎按来源处理”当安全终点 | Panasonic SR-VSX101/SR-VSX181 银シャリ水位线 2；机型程序边界保留 | **继续保留缺口**；先补牡蛎状态证据，再决定是否送 endpoint |

## 可挂候选汇总

- **4 条可进入下一批 TDD**：`panasonic-chicken-cream-pilaf`、`taiwan-vegetable-chicken-rice`、`hk-pumpkin-taro-chicken-claypot-rice`、`hk-taro-shrimp-multigrain-steamed-rice`。
- **1 条暂不挂安全终点**：`panasonic-oyster-negi-takikomi-rice`。缺的是原料状态，不是温度数字；不能用常识补“生牡蛎”。
- 本轮没有改 JSON，因此目录安全覆盖仍按 r148 的既有统计计算；本 intake 不增加安全覆盖数。

## 下一批准入条件

1. 4 条候选各自新增 `S-SAFETY-TEMPERATURES-1` 的 `claim_scopes:["safety"]`、`access_status:"opened"`、`evidence_tier:1` 和物种对应 `evidence_locator`；不能只写一个无定位的 source id。
2. `panasonic-chicken-cream-pilaf` 的 endpoint 只针对鸡腿肉；饭熟后加入的乳制品不改变禽肉判定。
3. `taiwan-vegetable-chicken-rice` 和香港鸡肉煲仔饭保留原来源的电锅／煲仔差异，不因加入安全终点而新增电饭煲参数。
4. `hk-taro-shrimp-multigrain-steamed-rice` 必须继续保留“30 分钟后投虾”的 staged 事实；安全终点不能替代投料时机。
5. 牡蛎条目只有在原始来源明确生鲜、预煮或其他可审计状态后，才可决定是否挂 `seafood_fully_cooked`；否则继续留在安全缺口表。

## 变更证明

- 新增 canonical：0
- 主 JSON 变更：0
- runtime/UI 变更：0
- 本文件只记录 r149 安全审计候选，不能被渲染器当作已闭合安全合同。
