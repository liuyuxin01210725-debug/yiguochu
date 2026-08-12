# 安全终点缺口审计（r155：海鲜、牡蛎及多风险主餐）

> 审计日期：2026-08-08
> 目录基线：`source-backed-one-pot-v1-20260808-global-r154`（923 条；安全终点覆盖 108/923）
> 本轮性质：复核既有条目，不新增 canonical，不修改运行时代码、UI 或 Planner。仅将原料状态、官方步骤与 FoodSafety.gov 终点逐条对齐；不能对齐的继续保留空数组。

## 判定口径

只有同时满足以下条件，才在 r155 增加安全终点：

1. 同一条目的官方原页明确列出风险食材，且步骤能判断其进入锅时是生鲜、未熟或需要继续加热；“海鲜”“鸡肉”等泛称而没有物种/原料状态的，不自行补分类。
2. 当前目录已有的 `S-SAFETY-TEMPERATURES-1` 能覆盖该类别；安全温度/视觉终点只挂在对应条目，不能把另一个菜的预处理或器具时间当安全证明。
3. 原菜的先煮、预煎、分阶段投料、回锅或机型边界完整保留；增加 endpoint 不会把多锅/多阶段流程改写成“全程一锅”。

## 15 条复核结果

| recipe_id | 原页核实的风险事实 | 决定 | 备注 |
|---|---|---|---|
| `panasonic-oyster-negi-takikomi-rice` | Panasonic foodable 原页列牡蛎 6 个约 120g，直接铺在米面后以银シャリ水位线 2 炊饭 54–60 分钟 | **r155 回填** `shellfish_fully_cooked` 74°C | 直接同锅；不增加生蚝以外的推断 |
| `tiger-oyster-mushroom-rice` | Tiger 原页列生牡蛎 300g，先以酒/酱油/味醂煮约 2 分钟，饭熟后回锅再焖 | **r155 回填** `shellfish_fully_cooked` 74°C | 保留先煮、汤汁入米、出锅回锅边界 |
| `zojirushi-seafood-paella` | 象印原页列虾、蛤蜊/贻贝、鱿鱼；先蒸至蛤蜊开口，分离蒸汁，海鲜最后回锅焖 | **r155 回填** `shellfish_fully_cooked` 74°C | 物种均为贝类/甲壳类或软体海鲜，按贝类终点处理；不抹掉先蒸/炒米/回锅步骤 |
| `tatung-seafood-porridge` | 大同原页列石蟹 500g、鲷鱼 200g、鱿鱼 200g、鸡翅 200g；鸡翅先煎，海鲜第二阶段入锅 | **r155 回填** 贝类 74°C + 鱼介 63°C + 禽肉 74°C | 两阶段电锅与预煎边界保留 |
| `panasonic-taiwan-truffle-seafood-risotto` | Panasonic 台湾原页列蛤蜊 5 只、虾 6 尾、鱿鱼 30g，放入 SR-PAA100 内锅炊煮 | **r155 回填** 贝类 74°C | 物种均为贝类/甲壳类或软体海鲜，按贝类终点处理；机型和出锅拌料保留 |
| `hk-hiroshima-oyster-mushroom-claypot-rice` | 香港食环署食谱图列广岛蚝 6–8 只，先煮 2–3 分钟，米饭完成前后回锅 | **r155 回填** `shellfish_fully_cooked` 74°C | 瓦煲、先取出再回锅和焗 5 分钟均不改写 |
| `panasonic-tokyo-seafood-pilaf` | Panasonic foodable 只写“シーフードミックス”150g，未列物种或是否已熟 | **保留空数组** | 不能从“seafood mix”推定贝类/鱼类类别 |
| `tiger-seafood-pilaf` | Tiger 原页只写“seafood”及 Plain 程序，未列物种状态 | **保留空数组** | 泛称不足以选 endpoint |
| `toshiba-seafood-paella-rice` | 东芝原页写冷冻海鲜 120g，未列混合物种，另有培根 | **保留空数组** | 冷冻混合海鲜物种与预熟状态不明 |
| `panasonic-my-chicken-pumpkin-lotus-mixed-rice` | Panasonic Malaysia 导语称鸡肉从头入锅，但编号步骤漏写鸡腿投料时点 | **保留空数组** | 过程冲突未解，不用安全 endpoint 掩盖缺步 |
| `yutian-electric-cooker-lamb-pilaf` | 于田政府页写羊肉 200g、切小块、翻炒后煮约 10 分钟；未写生鲜状态/部位 | **保留空数组** | FoodSafety.gov 只有整块羊肉 63°C+静置或绞肉71°C，无法在“切小块”上选类 |
| `philips-sea-conch-oyster-chicken-congee` | Philips 原页列鸡件 200g、金蚝与螺片，未标鸡肉生熟状态 | **保留空数组** | “鸡件”不能自行升级为生禽；干蚝/螺片也不新增生鲜贝类终点 |
| `taiwan-saffron-seafood-rice` | 现有来源列海鲜组合但缺同锅温度/物种一致性 | **保留空数组** | 当前来源范围不足，待重新打开原页后再审 |
| `hk-golden-seafood-congee` | 香港卫生署原页列花蛤、虾、鱿鱼、带子，写“煮至海鲜熟透”，无中心温度 | **暂不回填** | 物种清楚但当前安全定位需补直达原页行号；留作下一批 |
| `taiwan-saffron-seafood-rice` | 现有台湾来源列透抽、贻贝、虾、干贝，液体版本并列且未闭合 | **暂不回填** | 需重新打开对应电子书页并确认生鲜状态与安全 source locator |

## r155 实际回填

本批只回填前六条，共 **6 个既有条目、0 个新增 canonical**：

- `panasonic-oyster-negi-takikomi-rice`：牡蛎，贝类 74°C。
- `tiger-oyster-mushroom-rice`：牡蛎，贝类 74°C。
- `zojirushi-seafood-paella`：虾/蛤蜊/鱿鱼，贝类 74°C。
- `tatung-seafood-porridge`：石蟹/鲷鱼/鱿鱼/鸡翅，贝类 74°C、鱼介 63°C、禽肉 74°C。
- `panasonic-taiwan-truffle-seafood-risotto`：蛤蜊/虾/鱿鱼，贝类 74°C。
- `hk-hiroshima-oyster-mushroom-claypot-rice`：广岛蚝，贝类 74°C。

所有新增安全端点只引用 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov，tier 1，`opened`，`claim_scopes: ["safety"]`），没有修改 fixed batch、liquid、time、cooker adaptation 或 status；所有条目仍为 `recipe_fact_checked`，不可晋升 executable。

## 未回填项的后续闭合条件

- 泛称海鲜：必须获得原页物种或安全分类，不能用“海鲜综合/冷冻海鲜”替代。
- 于田羊肉：必须补充生鲜部位/整块肌肉或绞肉的直接证据，才能在 63°C 与 71°C 中选择。
- Panasonic 南瓜莲藕鸡：先解决导语与编号步骤的投料冲突，再重新审安全端点。
- 香港黄金海鲜粥、台湾番红花海鲜饭：先补可直接复核的原页定位，再决定是否回填。
