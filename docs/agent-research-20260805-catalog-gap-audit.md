# source-backed one-pot catalog：接近 executable 的 fact_checked 缺口审计

审计日期：2026-08-05  
审计对象：`tools/data/source-backed-one-pot-recipes.v1.json` 当前快照（176 条；其中 `recipe_fact_checked` 165 条、`executable` 10 条、`identity_verified` 1 条）。本文件只读审计，不修改目录 JSON、测试或生成产物。

这里的 `recipe_fact_checked` 只表示核心食材和关键技法已有来源，不等于家庭可直接照做。按目录设计，晋升 `executable` 前仍需闭合固定批量、液体、流程、时间、安全边界和器具范围，并让合同来源具备直接打开状态、页/行定位和明确 evidence tier。本轮从 165 条中挑出 8 条字段闭合度最高、且补一条最小证据就能明显前进的条目；没有把已有 `executable` 条目重新审计。

## 摘要矩阵

| recipe_id | 当前状态 | 固定份数 | 液体 | 时间 | 安全 | 器具边界 | 主要剩余缺口与最小下一步 |
|---|---|---:|---:|---:|---:|---|---|
| `panasonic-asian-style-takikomi-rice` | `recipe_fact_checked` | 有（4 人） | 有，SR-X910E 白米水位 3 | 缺 | 有，鸡肉 74°C | 有，SR-X910E | 用同一机型菜单/说明书把 52–65 分钟范围绑定到该菜，或记录一次从启动到完成的机型实测；同时把安全来源定位改成禽肉专用定位。 |
| `panasonic-ehime-tai-meshi` | `recipe_fact_checked` | 有（4 人） | 有，SR-V10BB 白米水位 2 | 缺 | 有，鱼/海鲜 74°C | 有，SR-V10BB | 补该菜单在 SR-V10BB 的实际运行时长（厂商菜单或一次实测），不要把 55–65 分钟机型规格范围直接当菜谱固定时间。 |
| `panasonic-nagano-salmon-nameko-rice` | `recipe_fact_checked` | 有（6 人） | 有，SR-X910E 白米水位 3 | 缺 | **形式有但证据定位错配** | 有，SR-X910E | 先补菜谱时长；并以鱼类/三文鱼安全来源替换当前写成“牛肉整块 63°C”的安全定位，确认 endpoint 与来源一致。 |
| `taiwan-cabbage-rice` | `recipe_fact_checked` | 有（3 人） | 有，内锅 1.5 杯水；外锅 1 杯在步骤中 | 缺总程序分钟 | 有，猪肉与虾米 | 有，台湾电锅 | 选定一个目标电锅，记录一次跳起前的程序分钟并保留跳起后焖 10 分钟；把外锅水作为独立器具输入保留。 |
| `tatung-chicken-cabbage-sesame-rice` | `recipe_fact_checked` | 有（3 人） | **缺单一内锅量** | 有（约 60 分钟） | 有，鸡肉 74°C | 有，大同电锅 | 向原方/厂商取得香菇泡发液+料理酒的实测量，或做一次称量记录；不能把外锅 1.5 杯水误当内锅液体合同。 |
| `panasonic-hyogo-tako-meshi` | `recipe_fact_checked` | **缺（仅 2 合分）** | 有，420 mL 调味液 | 有（约 50 分钟） | 有，章鱼 74°C | 有，NF-AC1000/NF-AC700 | 从同一 Panasonic 页面/说明书取得 2 合的成品人数/产量标签；在人数闭合前不能把 2 合自行换算为份数，也不能外推普通电饭煲。 |
| `cantonese-mushroom-chicken-claypot-rice` | `recipe_fact_checked` | **缺且来源版本冲突** | 有，TAFT 约 2.5 杯；Tefal 另为 3 杯水位 | 缺统一总时长 | 有，鸡肉 74°C | **未适配**（炉上瓦煲） | 选择一个可授权的单一版本，取得明确成品份数和完整运行时长，并做目标器具（瓦煲或指定电饭煲）一次验证；`S-GD-TAFT-CHICKEN-RICE-1` 标记 `permission_required`，解决授权或不用它作公开合同来源。 |
| `taiwan-mushroom-bamboo-shoot-rice` | `recipe_fact_checked` | **缺** | 有，1 杯水 | 有（30 分钟） | 有，但甲壳类 endpoint 需更直接来源 | **未适配**（炉上有盖锅） | 从原方取得成品份数，随后只在炉上有盖锅范围内做一次验证；若产品目标是电锅，再另取明确电锅改编证据，不把炉上 30 分钟迁移过去。 |

## 条目逐项证据与建议

### 1. `panasonic-asian-style-takikomi-rice`

- 当前状态：`recipe_fact_checked`。固定批量是 4 人、白米 3 合、鸡肉 450 g；液体是 **Panasonic SR-X910E** 白米水位 3；流程含铺鸡肉、选择炊込み、出锅切肉和拌饭；器具边界明确为 SR-X910E。
- 主要来源：[Panasonic「アジア風炊込みごはん」](https://panasonic.jp/cooking/recipe/suihan/1357.html)，`S-PANASONIC-ASIAN-STYLE-TAKIKOMI-RICE-1`，正文第 34–99 行：4 人、3 合、鸡肉与调味量、水位线 3、炊込み流程。[SR-X910E 规格页](https://panasonic.jp/suihan/products/SR-X910E/spec.html)，`S-PANASONIC-SR-X910E-SPEC-1`，HTML 第 2830–2838 行：炊込み程序约 52–65 分钟。
- 缺口判断：菜谱来源没有该菜独立总时长；规格页的 52–65 分钟是机型程序范围，不自动等于这道菜的时间合同。安全 endpoint 虽有 `poultry_fully_cooked: 74°C`，但 `S-SAFETY-TEMPERATURES-1` 当前 locator 写成鱼类/鱼类主餐，应换成明确禽肉定位。
- 最小补证：优先取得 SR-X910E 官方菜单对该 recipe 的运行时长（带页/行定位）；取不到则仅做一次同型号从启动至完成的记录，并记录鸡肉中心温度 ≥74°C。不要把该水位线或实测时间外推到其他电饭煲。

### 2. `panasonic-ehime-tai-meshi`

- 当前状态：`recipe_fact_checked`。固定 4 人、白米 2 合、鲷鱼切片 240 g；液体是 **Panasonic SR-V10BB** 白米水位 2；流程有腌鱼、铺料、炊込み、去骨拌饭；器具绑定 SR-V10BB。
- 主要来源：[Panasonic「〖愛媛県ご当地メニュー〗鯛めし」](https://panasonic.jp/cooking/recipe/suihan/1396.html)，`S-PANASONIC-EHIME-TAI-MESHI-1`，正文第 43–86 行：4 人、2 合、鲷鱼 240 g、水位线 2、去骨拌饭。[SR-V10BB 规格页](https://panasonic.jp/suihan/products/SR-V10BB/spec.html)，`S-PANASONIC-SR-V10BB-SPEC-1`，HTML 第 2830–2834 行：炊込み程序约 55–65 分钟。
- 缺口判断：recipe page 未公开本菜总调理分钟；55–65 分钟来自机型规格，不能直接写成固定菜谱时长。安全 endpoint 已有 74°C，但同一安全来源的证据等级/定位仍应在晋升前显式补齐。
- 最小补证：取得该菜单在 SR-V10BB 的官方运行时长，或做一次同型号实测并记录从启动到完成的范围；保留鱼类 74°C 终点。不得将水位线换算成通用毫升或迁移到其他锅型。

### 3. `panasonic-nagano-salmon-nameko-rice`

- 当前状态：`recipe_fact_checked`。固定 6 人、白米 3 合、信州三文鱼 160 g、滑子菇 120 g、盐昆布 20 g；液体为 SR-X910E 白米水位 3；流程含铺鱼、炊込み、去骨、拌黄油；器具绑定 SR-X910E。
- 主要来源：[Panasonic「〖長野県ご当地メニュー〗信州産サーモンとなめ茸の炊込みごはん」](https://panasonic.jp/cooking/recipe/suihan/1402.html)，`S-PANASONIC-NAGANO-SALMON-NAMEKO-RICE-1`，正文第 34–84 行：6 人、3 合、鱼/菇/盐昆布用量、水位线 3、去骨拌饭。[SR-X910E 规格页](https://panasonic.jp/suihan/products/SR-X910E/spec.html)，`S-PANASONIC-SR-X910E-SPEC-1`，HTML 第 2830–2838 行：52–65 分钟范围。
- 缺口判断：独立菜谱时长缺失。另有一个器具证据错配：条目的 `liquid_contract`/`cooker_adaptation` 绑定 **SR-X910E**，但 `S-PANASONIC-NAGANO-SALMON-NAMEKO-RICE-1` 的 evidence locator 写成 **SR-V10BB**，必须先确认原页面型号并统一。当前安全记录虽叫 `seafood_fully_cooked: 74°C`，但来源定位又写成“牛肉整块最低 63°C”，事实类型与鱼类不一致；这不是可忽略的文案问题，而是安全证据错配。
- 最小补证：重新打开原 recipe page，取得带正确型号的直接定位，并补该菜单运行时长；再用直接支持鱼/三文鱼的安全页替换 endpoint 定位（由 validator 重新检查 source_id、claim scope 和器具字段）。在型号与安全来源均纠正前，不建议向 executable 推进。

### 4. `taiwan-cabbage-rice`

- 当前状态：`recipe_fact_checked`。中央健康保险署版本固定 3 人：白米 1.5 杯、高丽菜半颗、五花肉 200 g 等；内锅加水 1.5 杯，步骤另有电锅外锅水 1 杯；跳起后焖 10 分钟；安全端点覆盖猪肉 74°C 和虾米熟透；器具是台湾电锅。
- 主要来源：[台湾健保双月刊 80 期〈高丽菜饭〉PDF](https://media.nhi.gov.tw/md/dl-52195-25353cf985624e8aaa641aea6f390005-3.pdf)，`S-TW-NHI-CABBAGE-1`，PDF 第 39 页（印刷第 37 页）：3 人份、全部主要用量、内锅 1.5 杯水、外锅 1 杯、跳起后焖 10 分钟；目录已有本地归档。补充来源：[台大医院〈电锅做高丽菜饭〉](https://epaper.ntuh.gov.tw/health/201804/health_1.html)，`S-TW-NTUH-CABBAGE-1`，正文第 19–28 行：独立 2 人版本及跳起后焖 10–15 分钟。
- 缺口判断：固定批量与液体/流程已很接近闭合，但没有自动蒸煮行程的总分钟数，因此 `time_contract` 为空。2 人来源是变体，不能与 3 人合同拼接；外锅 1 杯也应保持器具输入，不要混成内锅米水比。
- 最小补证：选定一个目标电锅型号，记录该 3 人批次一次“启动→跳起”的分钟数，再加来源已有的焖 10 分钟；同时记录猪肉/虾米的终点检查。这样只闭合该目标器具，不把跳起时间外推成通用常数。

### 5. `tatung-chicken-cabbage-sesame-rice`

- 当前状态：`recipe_fact_checked`。大同电锅官方账号版本固定 3 人、鸡腿肉 480 g、米 1.5 合，约 1 小时；步骤有香菇泡发、先炒料、外锅 1.5 杯和鸡肉熟透检查；安全 endpoint 为鸡肉 74°C。
- 主要来源：[大同电锅官方食谱账号〈鶏とキャベツの麻油炊き込みご飯〉](https://recipe.rakuten.co.jp/recipe/1290045243/)，`S-TATUNG-CHICKEN-CABBAGE-SESAME-RICE-1`，正文第 34–72 行：3 人、食材定量、约 1 小时、大同电锅外锅 1.5 杯及先炒再炊饭流程。
- 缺口判断：`liquid_contract` 为空是有意的：来源只说使用香菇泡发液、料理酒和炒料产生的液体，没有单一固定内锅量。外锅 1.5 杯是大同电锅的加热输入，不等于内锅液体。不能凭米量或常识补水。
- 最小补证：向原方/厂商取得泡发液和料理酒的明确量，或在不改变原方的情况下做一次称量记录（米入锅前、液体入锅后）；再按 3 人批次验证米饭状态与鸡肉 ≥74°C。若只能得到实测量，应将其保留为该大同型号的来源限定，不外推普通电饭煲。

### 6. `panasonic-hyogo-tako-meshi`

- 当前状态：`recipe_fact_checked`。Panasonic 页面给出 2 合、熟章鱼 200 g、420 mL 调味液、约 50 分钟及 NF-AC1000/NF-AC700 自动锅流程；液体、时间、流程和器具均有合同；安全 endpoint 为海鲜 74°C。
- 主要来源：[Panasonic「兵庫ご当地 たこめし」](https://panasonic.jp/cooking/recipe/autocooker/1436.html)，`S-PANASONIC-NF-AC1000-HYOGO-TAKO-MESHI-1`，正文第 43–103 行：2 合分、300 g 米、熟章鱼 200 g、420 mL、约 50 分钟及 NF-AC1000/NF-AC700 流程。
- 缺口判断：`fixed_batch` 为空不是遗漏克数，而是来源只写“2 合分”，没有成品人数/份数。日式“2 合分”不能未经来源把容量换算成人数。另一个边界是该菜单依赖 Kitchen Pocket 与指定自动锅，不是通用电饭煲合同。
- 最小补证：取得同一 Panasonic 页面/说明书的成品人数或产量标签；若厂商只给容量，则先保持 `recipe_fact_checked`，不要自行填 servings。人数补齐后仍只允许在 NF-AC1000/NF-AC700 范围内验证。

### 7. `cantonese-mushroom-chicken-claypot-rice`

- 当前状态：`recipe_fact_checked`。当前合同引用 TAFT 页面：米 1.5 杯、约 2.5 杯水、鸡肉腌 20 分钟、焖 20 几分钟；安全 endpoint 74°C；传统器具是瓦煲，但 `cooker_adaptation.status` 为 `not_adapted`。
- 主要来源：[台湾农业部产销履历〈香菇滑鸡饭〉](https://taft.moa.gov.tw/cp-1050-1589-8c557-1.html)，`S-GD-TAFT-CHICKEN-RICE-1`：页面给出 1.5 杯米、约 2.5 杯水、腌 20 分钟和焖 20 几分钟，但 `license` 标为 `permission_required`。[香港中华煤气〈北菇滑鸡饭〉](https://www.towngasappliance.com/newsletter/ricecooking/c03.php)，`S-HK-TOWNGAS-MUSHROOM-CHICKEN-RICE-1`，正文第 24–67 行：独立 35 分钟明火版本、2 杯米、鸡肉和冬菇量。[Tefal 食谱 PDF](https://www.tefal.com.sg/medias/Tefal-Recipe-Book-Rice-Cooker.pdf?context=bWFzdGVyfHJvb3R8NTE4ODA4NXxhcHBsaWNhdGlvbi9wZGZ8aDNjL2g3Zi8xMjI4NjM3MTcyNTM0Mi5wZGZ8YjhkMzAyNjQ5ZmYwNWU1MGFmNzdjYTc1MjFkNmUxYTlmMDQwZWFiZjZmOTk0Y2JhMg)，`S-TEFAL-MUSHROOM-CHICKEN-RICE-1`，PDF 第 8 页第 184–203 行：300 g 米、200 g 鸡块、5 只冬菇、3 杯水位线、电饭煲 X4 流程。
- 缺口判断：已有多个来源，但它们是独立批量/器具版本，不能拼成一份“传统固定配方”。当前没有统一 servings，也没有可追溯的完整总时长；TAFT 还要求授权，不能直接作为公开合同来源。瓦煲原方也没有家用电饭煲等价适配。
- 最小补证：先选一个可授权的单一版本（瓦煲、明火或 Tefal X4），取得该版本的成品份数和完整时间；然后对同一器具做一次鸡肉 ≥74°C 的厨房验证。若目标是普通电饭煲，应另建明确标注“改编版”的合同，而不是静默迁移瓦煲参数。

### 8. `taiwan-mushroom-bamboo-shoot-rice`

- 当前状态：`recipe_fact_checked`。台湾农业部农业儿童网原方给白米半杯、糙米半杯、竹笋 50 g、猪肉丝 50 g、金钩虾 10 g、1 杯水、炉上有盖锅和 30 分钟；安全 endpoint 已有猪肉 74°C 与甲壳类端点，但器具适配明确为 `not_adapted`。
- 主要来源：[台湾农业部农业儿童网〈香菇筍仔飯〉](https://kids.moa.gov.tw/theme_data.php?theme=kids_cooking&id=272)，`S-TW-3`，正文第 613–637 行：食材、30 分钟、1 杯水、先炒后加盖中火煮至米熟的炉上流程。
- 缺口判断：来源没有成品份数，所以 fixed batch 为空；有 30 分钟也不代表可迁移到电锅。安全记录中的甲壳类 endpoint 目前是通用视觉描述，晋升前应补直接支持虾/甲壳类的定位，避免把泛化 casserole 证据当成物种专用证据。
- 最小补证：先从原方或同一授权来源取得 servings；在炉上有盖锅按原方做一次记录，确认米熟、猪肉 ≥74°C、虾达到明确安全终点。只有在另有电锅改编来源或独立改编验证后，才考虑电锅版本。

## 横向结论

1. **最短路径是补时间，不是补更多身份来源。** Panasonic 三条（`panasonic-asian-style-takikomi-rice`、`panasonic-ehime-tai-meshi`、`panasonic-nagano-salmon-nameko-rice`）已经有固定批量、水位线、完整顺序和型号边界；缺的是与具体菜单绑定的运行时长。机型规格的程序范围只能作为线索，不能静默变成菜谱时间合同。
2. **“有液体”不等于液体合同已闭合。** `tatung-chicken-cabbage-sesame-rice` 的外锅水和泡发液属于不同层级；没有内锅实测量时，保持空值比猜水量安全。相反，`taiwan-cabbage-rice` 的内锅 1.5 杯与外锅 1 杯应明确分层记录。
3. **容量单位不能代替份数。** `panasonic-hyogo-tako-meshi` 的“2 合分”已有克数、液体和时长，仍不能自动填 servings；固定份数应由来源明确给出。
4. **多来源条目要先选版本再闭合。** `cantonese-mushroom-chicken-claypot-rice` 的 TAFT、香港中华煤气、Tefal 版本不能把不同米量、水位线和器具合并；且 TAFT 来源标记 `permission_required`，授权问题本身就是公开/执行门槛。
5. **安全合同必须和食材/定位相符。** 本轮发现 `panasonic-nagano-salmon-nameko-rice` 的 endpoint 名称与 locator（牛肉 63°C）错配，`panasonic-asian-style-takikomi-rice` 的定位也不是禽肉专用。应先修正证据映射，再谈状态晋升；不要用一个泛化安全页覆盖所有动物蛋白。
