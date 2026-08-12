# 安全终点缺口 intake（r151：港台／新疆／Panasonic 原料状态复核）

> 审计日期：2026-08-08
> 目录基线：`source-backed-one-pot-v1-20260808-global-r150`（923 条；安全终点覆盖 103/923）
> 本轮性质：只做既有条目的安全缺口 intake；不修改主 JSON、CSV、运行时代码、UI，也不新增 canonical。
> 结果：1 条可直接送下一批 TDD，1 条物种和状态明确但安全数值需先按既有来源定位，3 条继续 blocked；主目录仍为 r150/923。

## 判定口径

本轮只检查五条已经存在于目录中的 `recipe_fact_checked` 条目。所谓“可挂候选”只表示下一批可以按 TDD 在原条目上增加安全终点，不表示本轮已经写入 `safety_endpoints`，更不表示获得 `executable` 或厨房验证资格。

1. 原始页面必须明确动物性原料的物种和原料状态。`鲜带子`、`鲜羊肉`可以证明生鲜状态；“牡蛎”或“海鲜综合”而未说明生/熟，不能靠常识补齐。
2. 只复用已有受控 endpoint：贝类使用 `shellfish_fully_cooked` 的视觉终点；羊肉使用 `lamb_fully_cooked`，数值需绑定同一份 FoodSafety.gov 来源的适用肉型。程序分钟数、水位线、焖制动作都不能冒充安全温度。
3. 原器具和分阶段步骤保持原样。普通锅、炉灶预炒、电饭煲机型和烤箱版本不得互相推导。
4. 目标页必须能由当前直达 URL 重新打开并定位到同一菜名/事实。电子书直达页显示另一道菜时，先按来源定位失败处理，不以目录旧摘录替代原文。

现有安全来源： [FoodSafety.gov Safe Minimum Internal Temperatures](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)，目录中已有 `S-SAFETY-TEMPERATURES-1`（opened、tier 1）。本轮不复制其内容，只记录需要复用的 endpoint 与适用边界。

## r151 审计结果

| recipe_id | 直达来源与核实事实 | 可复用 endpoint | 原器具／流程边界 | 结论与后续动作 |
|---|---|---|---|---|
| `macau-scallop-mushroom-vegetable-rice` | [澳门体育局「帶子磨菇菜飯」](https://sportnutrition.sport.gov.mo/zh/show/pastanrice/id/30) 直达页明确“材料（3人份量）”：白米 1 杯（185g）、磨菇 100g、白菜 100g、**鮮帶子 100g**、清鸡汤 300mL。流程是“一半鸡汤煮白菜和磨菇待用；另一半鸡汤加水煮饭，饭滚后加入白菜、磨菇、带子，煮至白饭熟透”。 | `shellfish_fully_cooked`；使用现有 `S-SAFETY-TEMPERATURES-1` 的贝类视觉终点（肉质呈珍珠白或白色且不透明）。澳门页本身不提供温度数字，不能补写 74°C。 | 普通锅、两段鸡汤、米滚后再加入鲜带子；不得改写成电饭煲水位或单段程序。 | **可直接送下一批 TDD。** 物种（扇贝/带子）和“鲜”状态明确，现有 shellfish endpoint 可复用；下一批只需补同一安全来源的 `source_refs`/locator，其他字段不动。 |
| `yutian-electric-cooker-lamb-pilaf` | [于田县人民政府「于田抓饭做法」](https://www.xjyt.gov.cn/changyou/chi/2021-06-07/251.html) 原文第 179–188 行列羊肉 200g、胡萝卜 2 根、洋葱 1 个、葡萄干一小把、油 50g；第 191–194 行写大米泡半小时，羊肉切小块，先炒羊肉和菜，再加水没过羊肉煮约 10 分钟，连肉菜汤倒入电饭锅，焖约 20 分钟。大米为“适量”，“1:2”没有说明比较对象。 | `lamb_fully_cooked`；FoodSafety.gov 原页把羊肉整块/排骨/烤肉与绞肉分开给出终点。本文原料写“切小块”而非绞肉，**可作为候选**，但下一批必须在 locator/notes 中明确采用哪一类并保留 3 分钟静置要求，不能直接沿用其他物种的 74°C。 | 炉灶预炒和煮肉后转电饭锅；于田电饭锅版、伊犁炉上版、自治区传统锅版的时间不能合并。液体“1:2”对象不清，不能建立 liquid contract。 | **物种/状态明确的条件候选。** 可复用现有 `lamb_fully_cooked` 代码，但安全数值与切块分类必须先完成 FoodSafety locator 选择；即使挂 endpoint，也不能晋升 executable（米量、液体仍缺）。 |
| `taiwan-saffron-seafood-rice` | 目录当前记录的 [台湾农粮署北区分署电子书](https://ebook.afa.gov.tw/tefd/ebook8/ebook8-1.html) 直达页实际显示标题“食譜 - 吻仔魚飯”，可见内容是白米饭、吻仔鱼、蛋、青豆仁的熟饭炒制；当前页面未出现“番紅花海鮮飯”、番红花、透抽、贻贝、虾、干贝或该条目所记的 1kg 米／1kg 水。 | 不能挂。目标菜的海鲜物种和状态在当前直达页未被重新证明，不能仅凭目录旧 `evidence_locator` 添加 `shellfish_fully_cooked`。 | 目录旧记录声称电锅/烤箱边界，但当前 URL 的可见页与目标菜不一致；不把烤箱或电锅主张继续外推。 | **Blocked：source locator mismatch。** 需要找到该菜对应的电子书页、可定位 PDF/图片或新的官方直达页后，重新核对物种、状态和流程；在此之前保持 `safety_endpoints: []`。 |
| `panasonic-oyster-negi-takikomi-rice` | [Panasonic Foodable「牡蠣とねぎの炊き込みご飯」](https://foodable.jpn.panasonic.com/recipes/group-detail/905959) 直达页明确 4 人份、白米 2 合、牡蛎 6 个（120g）、葱 1/4 根；按 SR-VSX101/VSX181 的银シャリ水位线 2、炊込み 54–60 分钟。页面只写将牡蛎铺在米面，未写“生牡蛎”、预煮或预熟制品。 | 暂不能挂 `shellfish_fully_cooked`。现有贝类 endpoint 不能替原料状态证明，54–60 分钟和水位线也不是安全终点。 | Panasonic 指定机型和水位线保持不变；“牡蛎按来源处理”不能被改写成已预熟。 | **Blocked：原料状态不明。** 先取得同一来源对牡蛎生/熟状态的明确说明，再决定是否挂现有贝类 endpoint。 |
| `panasonic-tokyo-seafood-pilaf` | [Panasonic Foodable「【東京・洋食】炊込みシーフードピラフ」](https://foodable.jpn.panasonic.com/recipes/group-detail/619) 直达页明确 6 人份、白米 3 杯、白葡萄酒 1.5 小匙、ブイヨン约 600mL、洋葱 55g、胡萝卜 10g、蒜 1 片、**シーフードミックス 150g**；海鲜综合解冻后把析出的水丢弃，与米和汤按电饭煲炊込み程序同锅。页面未展开物种组成，也未说明综合包是生鲜、预熟还是仅需复热。 | 暂不能挂 `shellfish_fully_cooked` 或 `seafood_fully_cooked`。缺少物种和状态，不能以“海鲜综合”泛化到虾、贝、鱼或鱿鱼。 | Panasonic 炊饭器、白米／无洗米炊込み程序和“先解冻、丢弃析水”是原页事实；不增加温度或把程序分钟数当 endpoint。 | **Blocked：海鲜综合的物种/状态未明。** 需要厂商成分表或同一菜谱页面的原料状态说明；若取得后再按物种选择 shellfish/seafood endpoint。 |

## 汇总

- **可进入下一批安全 TDD：1 条**：`macau-scallop-mushroom-vegetable-rice`。
- **物种和状态清楚、但安全数值/切块分类需先定：1 条**：`yutian-electric-cooker-lamb-pilaf`。它不是本轮已闭合 endpoint，仍需 FoodSafety locator 选择。
- **继续 blocked：3 条**：`taiwan-saffron-seafood-rice`（直达页与目标菜不符）、`panasonic-oyster-negi-takikomi-rice`（牡蛎状态不明）、`panasonic-tokyo-seafood-pilaf`（混合海鲜物种与状态不明）。
- 新增 canonical：0；主 JSON 变更：0；安全覆盖仍为 **103/923**；runtime/UI 变更：0。

## 下一批准入条件

1. 澳门带子饭新增 `S-SAFETY-TEMPERATURES-1` 的 `claim_scopes:["safety"]`、`access_status:"opened"`、`evidence_tier:1` 与贝类视觉定位；不新增数值温度。
2. 于田抓饭若进入 TDD，先决定“切小块羊肉”适用的 FoodSafety 终点（整块羊肉 63°C＋静置，或其他有明确适用范围的类别），并把选择写入 locator/notes；不得沿用禽肉/海鲜的 74°C。
3. 台湾番红花海鲜饭必须先修复来源定位，不得将当前 `ebook8-1.html` 的吻仔鱼炒饭当作目标菜证据。
4. Panasonic 牡蛎与东京海鲜饭只有在同一官方来源补齐原料状态、物种组成后，才可按现有 endpoint 送审；不得用炊饭时长、水位线或“解冻”替代安全证明。

## 变更证明

- 本文件只记录 r151 安全审计候选，不会被渲染器当作已闭合安全合同。
- 未修改 `tools/data/source-backed-one-pot-recipes.v1.json`、CSV、生成 artifacts、runtime 或 UI。
