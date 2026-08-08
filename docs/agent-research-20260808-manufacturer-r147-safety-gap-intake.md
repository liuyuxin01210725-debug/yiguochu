# 厂商米饭既有条目安全端点补证 intake（r147 后）

**核验日期**：2026-08-08
**目录基线**：`source-backed-one-pot-v1-20260808-global-r147` / 923 条
**范围**：只审已有条目，不新增 canonical，不改主 JSON。本轮承接 r146 厂商安全缺口审计，优先核对生猪、生牛、生鱼/海鲜。
**目标**：确认官方原页是否确实使用生鲜风险食材；若是，记录可复用的 `S-SAFETY-TEMPERATURES-1` 安全端点、投料/另锅/机型边界，以及哪些字段仍不能闭合。

## 统一安全口径

- 生猪：`pork_fully_cooked`，项目现行合同为中心温度 74°C。
- 生牛：`beef_fully_cooked`，项目现行合同为中心温度 71°C；另锅煎或米饭倒数投料仍不能替代端点。
- 鱼类：`seafood_fully_cooked`，按 FoodSafety.gov 鱼类最低中心温度 63°C；不要把鱼端点扩成贝类端点。
- 干贝、虾米、腊味、泡菜等已经干制、腌制或加工的食材，不因名称含“海鲜/肉”自动添加生鲜端点。
- 下表的“可闭合”只表示**安全端点这一项**可以挂入既有条目；不代表固定份量、液体、时间或电饭煲跨机型适配已经闭合，更不代表 `executable` 或 `kitchen_observed`。

## 原页核验结果

### 可闭合：生猪

| recipe_id | 官方原页核实 | 建议端点与来源 | 必须保留的边界 | 其他合同状态 |
|---|---|---|---|---|
| `tiger-pork-kimchi-brown-rice` | [Tiger 豚キムチ玄米ごはん](https://www.tiger-corporation.com/ja/jpn/feature/recipe/post_522/)；2 人份；猪腿薄片 50g、糙米 1 杯；猪肉铺在米上，以“炊込み・玄米”煮约 90 分钟；泡菜和麻油在出锅后拌入；对应 JRX-G060/JRX-T060/JRX-S060。 | `pork_fully_cooked` / 74°C / `source_ids: [S-SAFETY-TEMPERATURES-1]`。原页显示的是生猪腿薄片，不是腊味。 | 泡菜是熟后拌入，豆芽菜另做小菜；水量由玄米刻度表达，不能补写毫升。 | `liquid_contract` 继续为 `null`；安全端点可独立闭合。 |
| `philips-pumpkin-minced-pork-congee` | [Philips 南瓜肉碎粥](https://www.philips.com.hk/c-e/ho/philips-chef/recipe-overview-page/main-courses/minced-pork-congee-with-pumpkin.html)；米 1/2 杯、免治猪肉 80g、南瓜 100g；同锅加水至 0.5 杯“粥”刻度；“煲粥”4 小时；页面标为迷你电饭煲。 | `pork_fully_cooked` / 74°C / `source_ids: [S-SAFETY-TEMPERATURES-1]`。免治猪肉是生料，不能因为粥程序很长就省略端点。 | 页面没有固定成品份数，也未给出具体型号；保留“指定 Philips 迷你电饭煲/粥刻度”边界。 | 安全端点可闭合；`fixed_batch` 仍为 `null`。 |
| `r97-zojirushi-taiwan-brown-cabbage-mixed-rice` | [象印 糙米高麗菜什錦飯](https://www.zojirushi.com.tw/recipe/rice-cookers/444/csr)；糙米 3 杯、梅花猪肉丝 100g、高丽菜 200g 等；猪肉放在最上层后使用糙米/标准程序；页面注明压力 IH 电子锅。 | `pork_fully_cooked` / 74°C / `source_ids: [S-SAFETY-TEMPERATURES-1]`。页面未把猪肉标为熟制，按生猪肉处理。 | 不把糙米水位 3 外推为普通电饭煲毫升量；页面另有压力 IH 细小谷物/豆类堵塞风险提示，原样保留。 | 安全端点可闭合；份数、总时长和跨机型液体继续缺失。 |

### 可闭合：生牛

| recipe_id | 官方原页核实 | 建议端点与来源 | 必须保留的边界 | 其他合同状态 |
|---|---|---|---|---|
| `tiger-steak-mushroom-barley-rice` | [Tiger ステーキときのこの麦バターライス](https://www.tiger-corporation.com/en/jpn/feature/recipe/post46/)；4 人份；米 2 杯、大麦、蘑菇 100g、肉汤 600mL；牛ヒレ肉（牛里脊牛排）200g 在另锅煎至 medium，切块后与成饭拌入；米饭约 55 分钟。 | `beef_fully_cooked` / 71°C / `source_ids: [S-SAFETY-TEMPERATURES-1]`。 | 这是 `extra_pan` 连续流程，不是全程电饭煲同锅；“medium”是原页烹饪描述，不替代项目安全端点。配菜薯条、焯西兰花另行处理。 | 安全端点可闭合；机型/麦饭刻度和另锅牛排边界不能泛化。 |
| `philips-japanese-wagyu-beef-rice-bowl` | [Philips 日式牛肉丼飯](https://www.philips.com.hk/c-e/ho/philips-chef/recipe-overview-page/main-courses/japanese-wagyu-beef-rice-bowl.html)；日本米 2 杯、和牛片 120g、直菇 40g、洋葱 60g；米饭程序先煮米/菇/洋葱，剩余 5 分钟打开加入腌好的和牛片，完成后加葱花和紫菜；指定迷你电饭煲。 | `beef_fully_cooked` / 71°C / `source_ids: [S-SAFETY-TEMPERATURES-1]`。牛肉片是后加生料，不能视为熟食。 | 必须显示“倒数 5 分钟投料”；水至指定内锅 2 杯米刻度，不能外推普通电饭煲；页面没有总时长和固定份数。 | 安全端点可闭合；`fixed_batch`、`time_contract` 继续为 `null`。 |

### 可闭合：生鱼；不可把干贝误作生贝

| recipe_id | 官方原页核实 | 建议端点与来源 | 必须保留的边界 | 其他合同状态 |
|---|---|---|---|---|
| `panasonic-taiwan-salmon-mushroom-rice` | [Panasonic 鮭魚菇菇炊飯](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/4032)；SR-PAA100；米 1.5 杯、水 1.5 杯、鮭魚 250g、菇类；腌鱼后与米、菇同锅，白米美味炊煮，完成翻拌。 | `seafood_fully_cooked` / 63°C / `source_ids: [S-SAFETY-TEMPERATURES-1]`。原页明确是鮭魚生料处理流程。 | 只证明 SR-PAA100 页面给出的 1.5 杯水和程序，不外推其他型号/米种；页面提示份量和时间可按个人调整。 | 安全端点可闭合；跨机型适配和固定总时长仍缺。 |
| `panasonic-taiwan-taiyu-scallop-quinoa-rice` | [Panasonic 鯛魚干貝藜麥炊飯](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/3904)；SR-PAA100；鯛魚片 150g；干贝 25g 先泡 30–60 分钟；藜麦泡约 30 分钟；白米/藜麦与干贝水至银シャリ/白饭刻度 2，什锦饭约 55 分钟。 | 仅对鯛魚片添加 `seafood_fully_cooked` / 63°C / `source_ids: [S-SAFETY-TEMPERATURES-1]`。**不添加 shellfish 端点**：原页写的是干燥干贝浸泡，不是生鲜贝。 | 保留干货浸泡、藜麦浸泡、完成后夹出鱼和昆布再拌饭的步骤；不把干贝水位外推到其他机型。 | 鱼类安全端点可闭合；干贝仍按干制食材；页面合同时间/水位是 SR-PAA100 限定。 |

## 暂不闭合或不应补的部分

1. **完整菜谱合同仍未闭合**：上述条目大多缺固定成品份数、跨机型液体或统一时间；本 intake 仅建议补安全端点，不得因此把状态改为 `executable`。
2. **Tiger 牛排条目不是纯同锅**：牛排另锅煎后拌入，安全端点可以补，但分类和 UI 必须继续显示 `extra_pan`，不能写成电饭煲一锅完成。
3. **Philips 和 Panasonic 的机型边界不可泛化**：Philips 迷你电饭煲、Panasonic SR-PAA100、Tiger 对应 JRX/JPL 型号的刻度和程序均只证明原机事实。
4. **干贝不触发贝类端点**：`panasonic-taiwan-taiyu-scallop-quinoa-rice` 只加鱼类端点；若将来有生鲜扇贝/贝类原文，另开 shellfish 安全核验。
5. **不对泡菜、腊味、罐头或已熟肉重复加生鲜端点**：本轮未发现可据原页证明为上述状态的新增风险项。

## 建议下一批整合顺序

1. 先补三个生猪条目和 Philips 和牛饭（原页字段明确，风险类别单一）。
2. 再补 Panasonic 鲑鱼、鲷鱼两条，鱼端点统一按 63°C；干贝维持干制备注。
3. Tiger 牛排最后整合，确保 `extra_pan` 与“另锅煎”在安全文案和来源 scope 中保持可见。
4. 端点写入后运行目录 validator、`check-recipes` 和安全回归；只做安全字段变更，不晋升 executable。

## 核验记录

本轮通过浏览器 CDP 直接读取上述官方页面正文；页面中可见的名称、食材、刻度/液体、程序、后加/另锅步骤均与当前目录 source_refs 的 evidence_locator 相符。未从搜索摘要、第三方转载或不同菜谱拼接字段。
