# 既有菜谱合同缺口审计（r158：日本 MAFF 同源字段复核）

> 审计日期：2026-08-08
> 目录基线：`source-backed-one-pot-v1-20260808-global-r157`（923 条）
> 本轮性质：只复核已有 `recipe_fact_checked` 条目；不新增 canonical，不修改主 JSON、CSV、运行时代码、UI 或生成包。
> 核验方式：通过 web-access 浏览器直接打开 MAFF「うちの郷土料理」原页，读取材料、份数和作法区；未用搜索摘录替代原页。

## 本轮结论

本轮复核 18 条既有条目。发现 **3 条可进入下一批 TDD 的同源字段回填**，另有 **1 条仅可回填 `fixed_batch` 的候选**：

1. `maff-kanagawa-narachameshi`：可无损补 4 人份和 500mL 茶液；总时长仍未知。
2. `maff-shimane-kujira-gohan`：可无损补 4 人份和“水与米等量”的 1:1 比例；总时长仍未知。入库前须把同一来源的 `claim_scopes` 扩为 `quantity`、`liquid`，不能只改合同字段。
3. `maff-fukui-chameshi`：可无损补 20 人份；1500mL 液体已在目录，来源的 `quantity` scope 需要在 TDD 一并校正；总时长仍未知。
4. `maff-ehime-shoyu-meshi`：可无损补 4 人份；页面只写“加水”而未给水量，不能补 `liquid_contract`。

其余 11 条没有可以安全写入现有单值合同的字段：要么是人份范围、要么是浸泡/某一阶段时长而非整道总时长、要么存在另锅/熟饭回拌/蒸制边界，或液体对象不明确。本轮不为了提高闭合数量而取中值、拼版本或把多阶段菜改写成电饭煲直达。

## 可安全 TDD 的 4 条候选

| recipe_id | 官方原页 | 原页直接证明 | 当前缺口 | TDD 边界 |
|---|---|---|---|---|
| `maff-kanagawa-narachameshi` | [奈良茶飯（神奈川县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/35_20_kanagawa.html) | 材料明确写“4人分”：米 3 合、煎茶或焙茶 500mL、炒大豆 30g、栗 100g、盐；作法为浸米 30 分钟后放入炊饭器同炊。 | `fixed_batch`、`liquid_contract` 为空；`time_contract` 为空。 | 可写 `servings:4`，液体写 500mL 茶；30 分钟只是浸泡，不能写成总时长。来源已有 `quantity/liquid` scope。 |
| `maff-shimane-kujira-gohan` | [くじらご飯（岛根县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/kujiragohan_shimane.html) | 材料明确写“4人前”：米 2 合、白鲸 100g、牛蒡/胡萝卜/萝卜/魔芋各 50g；作法写米加入“与米同量的水”及配料同炊。 | 三项合同均为空。 | 可写 `servings:4`，液体用现有 Ratio DSL 表达 `1.0 杯水/杯米`；先炒/焯油属于步骤边界，不补总时长。当前来源 scope 只有 identity/ingredients/process，TDD 必须补 quantity/liquid 后再写合同。 |
| `maff-fukui-chameshi` | [茶飯（福井县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/chameshi_fukui.html) | 材料明确写“20人分”：糯米 6 合、粳米 4 合、大豆 90g、酒 3/4 杯、酱油 0.5 杯；豆浸泡茶约 200mL，最终茶汁、酱油等合计 1500mL 后同炊。 | `fixed_batch` 为空；`liquid_contract` 已为 1500mL；总时长为空。 | 只补 `servings:20` 与固定批量食材；不把大豆浸泡 1 小时当总时长。来源现有 liquid/process scope，但缺 quantity scope，TDD 同步修正 scope。 |
| `maff-ehime-shoyu-meshi` | [しょうゆめし（爱媛县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/shouyu_meshi_ehime.html) | 材料明确写“4人分”：米 3 杯、鸡肉 150g、胡萝卜 50g、干香菇 3 枚、牛蒡 50g、魔芋半丁、干油豆腐 1 枚等；作法为将材料、调味料和水放入釜中同炊。 | 三项合同均为空。 | 只补 `servings:4` 和来源实际给出的固定食材量；页面未给水量，`liquid_contract` 保持 null；30 分钟是淘米后静置，不是总时长。来源当前缺 quantity scope，TDD 需先补 scope。 |

## 其余直接核验条目：保持缺口

| recipe_id | 原页直接证明 | 当前缺口与边界 | 判定 |
|---|---|---|---|
| `maff-kanagawa-ume-gohan` | [梅ごはん（神奈川县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/35_10_kanagawa.html)：正文材料为 5–6 人份、米及梅干/吻仔鱼，だし汁 720cc。 | 份数是范围，不能压成一个 `servings`；页面没有总时长。 | 不回填。 |
| `maff-wakayama-shouga-meshi` | [しょうが飯（和歌山县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/shouga_meshi_wakayama.html)：5–6 人份、米 3 杯和生姜，按炊饭器水位炊煮。 | 人份是范围，水量依器具刻度，不能写通用单值液体；无总时长。 | 不回填。 |
| `maff-aichi-kakimawashi` | [かきまわし／とりめし（爱知县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/kakimawashi_aichi.html)：4 人份、米 2 合；米在炊饭器中煮，鸡肉和根菜另用炒锅煮熟，出锅再拌。 | `fixed_batch` 可追补但本条是另锅/熟饭回拌，不应进入生米直达轮替；液体是炊饭器水位，无固定量；无总时长。 | 归 `extra_pan_or_cooked_rice_second_cook` 边界，不回填本轮合同。 |
| `maff-kagoshima-keihan` | [鶏飯（鹿儿岛县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/keihan_kagoshima.html)：4 人份，米 320g/水 480cc；鸡骨汤 800cc 另锅熬 1 小时，鸡肉、香菇、蛋、四季豆分别处理，最后浇饭。 | 不是单锅生米主餐：饭、汤、浇头分开；“1小时”仅为熬汤阶段，不能写总时长。 | 归 `extra_pan_or_archive`，不回填。 |
| `maff-shimane-sazae-meshi` | [さざえ飯（岛根县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/sazaemeshi_shimane.html)：4 人份、米 2 合、サザエ 4 个；先煮贝取汁，再以“煮汁+水”入锅。 | 水与煮汁没有固定量或比例；前置煮贝是分阶段；不能从其他贝类饭补液体。 | 仅保持已有 `fixed_batch`，不补液体/时间。 |
| `maff-fukui-chameshi` 的流程时长 | 同一福井原页写大豆浸茶约 1 小时、沸煮后再炊。 | 1 小时是浸泡阶段，不是总制作时间。 | 仅补固定份量，不补时间。 |
| `maff-saga-kuri-okowa` | [栗おこわ（佐贺县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/45_17_saga.html)：糯米浸泡，小豆煮至八成熟，栗与米拌后蒸制。 | 蒸笼多阶段；没有当前 schema 可用的单一液体/总时长。 | 不回填。 |
| `maff-ishikawa-mitama` | [みたま（石川县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/mitama_ishikawa.html)：黑豆单独蒸约 1 小时，糯米另蒸约 45–50 分钟。 | 两个蒸制阶段，不是同锅电饭煲；阶段时长不能相加成为总时长。 | 不回填。 |
| `maff-hiroshima-uomeshi` | [魚飯（广岛县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/42_24_hiroshima.html)：鱼虾、蔬菜、蛋丝分开处理，最后将高汤浇在熟饭上。 | 熟饭浇汁/多锅；不是生米同锅。 | 归 `cooked_rice_second_cook/archive`，不回填。 |
| `maff-tokyo-fukagawa-meshi` | [深川めし／深川丼（东京都）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/34_1_tokyo.html)：蛤蜊用味噌汤煮，连汁浇在熟饭上。 | 丼饭/熟饭浇汁，不是生米同锅；液体不能当米水合同。 | 不回填。 |
| `maff-fukushima-harako-meshi` | [はらこ飯（福岛县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/30_12_fukushima.html)：鲑鱼子腌渍后铺在炊好的米饭上。 | 熟饭后加料，不是生米同锅；安全和时间也不能由近名饭拼接。 | 不回填。 |
| `maff-hokkaido-amanatto-sekihan` | [赤飯 北海道](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/sekihan_hokkaido.html)：现有目录已闭合 4 人份、米/糯米/水/甘纳豆；原页只有浸泡、火候和焖制分段。 | 缺少明确总制作时长；分段时间不能直接相加成产品 `time_contract`。 | 维持现状。 |
| `maff-carrot-asparagus-pilaf` | [人参とアスパラガスのピラフ](https://www.maff.go.jp/j/seisan/kakou/mezamasi/recipe/recipe021.html)：4 人份、米 2 杯、鸡汤 2 杯；洋葱/胡萝卜先炒，芦笋预煮，入炊饭器后出锅拌入。 | 现有批量和液体已闭合；没有整道总时长，且有预炒/预煮/后拌。 | 维持现状。 |
| `maff-saga-ochagai-chagayu` | [お茶がい／茶がゆ（佐贺县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/45_5_saga.html)：4 人份、米 200g、番茶 20g、水 1600mL；煮茶约 2 分钟后再加米煮粥。 | 液体和批量已闭合；2 分钟是煮茶阶段，不是总时长。 | 维持现状。 |

## 下一步建议

- 本文中的 3 条主候选（奈良茶饭、鲸鱼饭、福井茶饭）和 1 条固定份量候选（爱媛酱油饭）可开独立 TDD；先补来源 `claim_scopes` 的实际范围，再写合同字段。
- TDD 时保持原器具与阶段边界：奈良茶饭是炊饭器；鲸鱼饭页面写釜中同炊但有鲸皮焯脂；福井茶饭先制茶/浸豆再同炊；爱媛酱油饭页面只证明“加水”，不补水量。
- 其余条目维持 `recipe_fact_checked`，不要为了填满时间、液体或份数而从相近地区、相近菜名或不同器具版本拼接。

本文件仅为 r158 缺口审计，不改变目录版本，不重建生产运行包，不部署。
