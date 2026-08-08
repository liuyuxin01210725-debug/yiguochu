# r146 厂商菜谱安全端点缺口审计

**基线**：`source-backed-one-pot-v1-20260808-global-r145` / 923 条

**范围**：只审查当前目录中厂商、Tiger、Panasonic、象印、Tefal 等来源的条目；筛选 `safety_endpoints: []` 且核心食材可能包含生禽、生猪、生牛、生鱼/贝或生蛋的记录。本轮只写审计 intake，不修改主目录、不晋升状态、不改运行时代码。

## 审计口径

1. 先逐条打开目录已经引用的官方原页，核对食材是否以生鲜/未标预熟状态出现，以及步骤中是否在锅内或锅前处理。
2. 只有原页确实显示生鲜禽、猪、牛或鱼类，才建议补端点；“腊味、罐头、熟食、盐渍/干制海鲜、已煎熟肉”不因关键词自动加生肉端点。
3. 端点使用现有安全词表，不发明新 code：禽肉 `poultry_fully_cooked`（74°C）、猪肉 `pork_fully_cooked`（74°C）、牛肉 `beef_fully_cooked`（71°C）、鱼类 `seafood_fully_cooked`（至少 63°C；本项目现有厂商条目通常使用 74°C 的保守提示）。安全依据优先复用已入库的 FoodSafety.gov 来源 `S-SAFETY-TEMPERATURES-1`；本表中的“来源是否已挂”指该 recipe 的 `source_refs` 是否已经包含安全 scope，而不是说明该政府页面不存在。
4. 另锅预煎、倒数后投料或机型程序不等于安全端点已经满足；端点仍应挂在该菜谱，且在备注中保留流程边界。反之，若肉/海鲜在官方页面明确为熟制、罐头、腌腊或干制，则记录为“不加”，避免过度拦截。

## 15 条优先缺口

| recipe_id | 官方原页与原文证据 | 风险类别与建议端点 | 该条 source_refs 是否已有 safety | 处理结论 |
|---|---|---|---|---|
| `panasonic-one-pot-chicken-rice` | [Panasonic Australia](https://www.panasonic.com/au/consumer/household/kitchen-appliances/article/recipe-top-page/one-pot-chicken-rice.html)；4 份、4 只鸡腿铺在生米上，运行 long-grain 程序。 | 生鸡腿；`poultry_fully_cooked` 74°C。 | 否；只有厂商 recipe source。 | **高优先补**。保留 SR-HL151 水位线和程序，不把端点误写成通用时间。 |
| `panasonic-claypot-style-chicken-rice` | [Panasonic Malaysia](https://www.panasonic.com/my/consumer/kitchen-appliances-learn/healthy-everyday-recipes/recipe-top-page/claypot-style-chicken-rice.html)；鸡腿 250g 与米、香菇同锅，WHITE RICE/CASSEROLE 后焖 10 分钟。 | 生鸡腿；`poultry_fully_cooked` 74°C。 | 否。 | **高优先补**。3 小时 40 分是该机型页面总时长，不能外推普通电饭煲。 |
| `tatung-avocado-chicken-rice` | [大同 Dennabe](https://dennabe-official.tatung.co.jp/recipe/view/2030)；2 份、鸡腿先煎后入电锅，成饭再拌牛油果。 | 生鸡腿（先煎并非安全证据）；`poultry_fully_cooked` 74°C。 | 否。 | **高优先补**。端点提示应保留“先煎、再确认中心温度”的连续流程。 |
| `joyoung-pumpkin-shiitake-chicken-rice` | [九阳 JRC-4TD01 PDF](https://myjoyoung.com/wp-content/uploads/2025/09/Rice-Cooker-JRC-4TD01.pdf)，第 25 页；鸡腿约 300g，腌后机内翻炒，再与米、南瓜、香菇焖饭。 | 生鸡腿；`poultry_fully_cooked` 74°C。 | 否；仅有九阳 PDF。 | **高优先补**。仅限 JRC-4TD01 及原页流程，不能把机内翻炒当成端点。 |
| `instant-pot-coconut-chicken-pineapple-rice` | [Instant Pot](https://instantpot.com/blogs/recipes/coconut-chicken-and-rice-with-pineapple-salsa-0)；4 份、鸡腿与米同锅，高压 5 分钟后泄压。 | 生鸡腿；`poultry_fully_cooked` 74°C。 | 否。 | **高优先补**。端点需与 Instant Pot 压力程序同时显示，不能声称普通电饭煲适配。 |
| `tiger-pork-kimchi-brown-rice` | [Tiger Japan](https://www.tiger-corporation.com/ja/jpn/feature/recipe/post_522/)；2 份、猪肉 50g 与糙米同炊，熟后拌泡菜。 | 生猪肉；`pork_fully_cooked` 74°C。 | 否。 | **高优先补**。泡菜是熟后拌入，不替代猪肉熟制端点。 |
| `tiger-steak-mushroom-barley-rice` | [Tiger Japan](https://www.tiger-corporation.com/en/jpn/feature/recipe/post46/)；牛里脊牛排 200g 另煎后拌入麦饭。 | 生牛排（另锅煎）；`beef_fully_cooked` 71°C。 | 否。 | **补端点但标 `extra_pan`**。不能把另锅煎过写成全程同锅。 |
| `philips-japanese-wagyu-beef-rice-bowl` | [Philips Hong Kong](https://www.philips.com.hk/c-e/ho/philips-chef/recipe-overview-page/main-courses/japanese-wagyu-beef-rice-bowl.html)；牛肉片在米饭程序倒数 5 分钟才放入。 | 生牛肉片；`beef_fully_cooked` 71°C。 | 否。 | **高优先补**。保留“倒数 5 分钟投料”，成品须达到端点；不将和牛片视为熟食。 |
| `philips-pumpkin-minced-pork-congee` | [Philips Hong Kong](https://www.philips.com.hk/c-e/ho/philips-chef/recipe-overview-page/main-courses/minced-pork-congee-with-pumpkin.html)；免治猪肉 80g 与米、南瓜同锅煲粥。 | 生猪肉末；`pork_fully_cooked` 74°C。 | 否。 | **高优先补**。粥的 4 小时程序不能替代最终熟度提示。 |
| `panasonic-taiwan-salmon-mushroom-rice` | [Panasonic Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/4032)；鲑鱼 250g 与米、菇同锅使用混合饭/白米程序。 | 生鱼；`seafood_fully_cooked`（项目现有保守 74°C）。 | 否。 | **高优先补**。来源未写“熟鲑鱼”，不应按熟食处理；SR-PAA100 型号边界保留。 |
| `panasonic-taiwan-taiyu-scallop-quinoa-rice` | [Panasonic Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/3904)；鲷鱼 150g 与干贝、藜麦同炊，完成后取鱼拌匀。 | 生鱼；`seafood_fully_cooked`。干贝标为浸泡干货，**不**另加 shellfish 端点，除非原页确认生鲜贝。 | 否。 | **补鱼类端点**；干贝按干制/浸泡边界记录，避免把干货误判为生贝。 |
| `panasonic-my-century-egg-chicken-congee` | [Panasonic Malaysia](https://www.panasonic.com/my/consumer/kitchen-appliances-learn/healthy-everyday-recipes/recipe-top-page/century-egg-chicken-congee.html)；鸡胸肉 100g 进入 PORRIDGE，皮蛋为加工蛋另行记录。 | 生鸡胸；`poultry_fully_cooked` 74°C。皮蛋是加工食品，**不**加 `egg_fully_cooked`。 | 否。 | **补禽肉端点**；保留皮蛋加工边界和 QUICK COOK/PORRIDGE 双程序。 |
| `panasonic-my-chicken-pumpkin-lotus-mixed-rice` | [Panasonic Malaysia](https://www.panasonic.com/my/consumer/kitchen-appliances-learn/healthy-everyday-recipes/recipe-top-page/mixed-rice-with-pumpkin-and-lotus-roots.html)；鸡腿丁 200g，Brown Rice 程序；导语与编号步骤对投料时点有冲突。 | 生鸡腿；`poultry_fully_cooked` 74°C。 | 否。 | **补端点但保留阻塞**：先解决官方页面投料时点冲突，不能只靠端点晋升。 |
| `r97-zojirushi-taiwan-brown-cabbage-mixed-rice` | [象印台湾](https://www.zojirushi.com.tw/recipe/rice-cookers/444/csr)；梅花猪肉丝 100g 与糙米、高丽菜同炊，糙米水位 3。 | 生猪肉丝（页面未标预熟）；`pork_fully_cooked` 74°C。 | 否。 | **中高优先补**。补端点前需保留“页面未标预熟”的证据备注，不把腊肉规则套入鲜猪肉。 |
| `r98-zojirushi-taiwan-wild-mushroom-chicken-mixed-rice` | [象印台湾](https://www.zojirushi.com.tw/recipe/rice-cookers/549/%E6%97%A5%E5%BC%8F%E9%87%8E%E8%8F%87%E9%9B%9E%E8%82%89%E7%82%8A%E9%A3%AF)；鸡腿 150g 与白米、综合菇同炊，白米水位 2。 | 生鸡腿（页面未标预熟）；`poultry_fully_cooked` 74°C。 | 否。 | **中高优先补**。先做来源状态确认，再挂通用禽肉端点；保留水位/程序型号边界。 |

## 明确不应在本轮误加的端点

- 罐头鲍鱼、已盐渍/已烤鱼、腊肠/腊肉、叉烧等条目：应分别使用已有的加工食品/腊味规则，不能套 `poultry_fully_cooked`、`pork_fully_cooked` 或 `seafood_fully_cooked`。
- `干贝`、虾米、干燥海产若原页只写浸泡或调味，不自动视为生贝/生虾；本轮鲷鱼干贝藜麦炊饭仅建议鱼类端点。
- 皮蛋、咸蛋等已加工蛋不自动加生蛋端点；只有来源明确写生鸡蛋并在成品中加热不足，才另行建立蛋类安全规则。本轮 15 条没有符合条件的生蛋条目。

## 下一步（不在本轮执行）

1. 由数据维护者逐条把 FoodSafety.gov 安全来源（或政府等价来源）挂入 `source_refs`，并补 `safety_endpoints`；先处理前五条高优先禽肉，再处理猪/牛/鱼。
2. 对“页面未标预熟”两条象印记录先做人工原文确认；对 Panasonic 南瓜莲藕饭先裁决投料时点冲突。
3. 补端点后重新跑目录 validator、`check-recipes` 和安全回归；本 intake 不代表已签署 `executable`，也不代表已完成厨房验证。
