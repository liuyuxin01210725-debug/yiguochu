# r146 安全终点缺口审计（港台／公共来源）

> 审计日期：2026-08-08
> 目录基线：`source-backed-one-pot-v1-20260808-global-r145`（923 条）
> 本文件是研究 intake，不是菜谱晋升报告；本轮不修改主 JSON、运行时代码或 UI。

## 目的与边界

r145 目录中有一批 `recipe_fact_checked` 条目已经记录了生鸡、猪、鱼、贝、羊等核心食材，但 `safety_endpoints` 仍为空。本轮只审计这些已有条目，不新增 canonical，不把“来源写了煮熟/焖熟”误写成一个未经来源支持的温度数字。

每条记录分开回答四件事：

1. 原始页面到底写了什么食材和处理顺序；
2. 食材状态是生食材、先煎/先煮后回锅、预熟、还是来源没有说明；
3. 可以送审的受控 endpoint 物种类别是什么；
4. 还缺哪一条官方安全依据，才能进入 JSON 的 `safety_endpoints`。

本轮的 endpoint 只是“待补合同”，不是已承诺的字段。没有官方温度或机构安全终点时，保持缺口，不用常识补值。通用温度依据候选为美国政府 [FoodSafety.gov Safe Minimum Internal Temperatures](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)；实际入库前仍需把物种、温度、定位和适用范围逐条挂到 source ref。日本、台湾、香港或澳门官方安全页面可作为同等或更贴近原来源的替代，但不能把不同来源拼成一条菜谱做法。

## 审计结果（15 条）

| recipe_id | 原菜谱与风险食材 | 原页直接证明的状态/流程 | 待审 endpoint | 已有官方温度终点？ | 仍缺什么 |
|---|---|---|---|---|---|
| `tiger-chicken-bamboo-rice` | `鶏肉たけのこごはん`；鸡胸肉 100g | Tiger 原页 6 人份、米 3 杯、高汤 600mL；鸡胸切 1cm 丁后与米、竹笋一起进入炊込み程序；没有写预熟 | `poultry_fully_cooked`（鸡肉） | 否；Tiger 只给 60 分钟和程序 | 需要挂官方禽肉终点（建议 74°C/165°F）并保留 Tiger 机型/程序边界；不能用 60 分钟代替温度 |
| `tiger-whitefish-mixed-rice` | `白身魚の炊込みごはん`；白身鱼 200g | Tiger 原页 3 杯米、约 600mL 高汤、60 分钟；鱼先加盐并煎制，再放入炊饭流程 | `seafood_fully_cooked`（鱼类） | 否；原页无鱼类中心温度 | 需要鱼类官方安全终点；“先煎”是流程证据，不是可跨鱼种外推的温度证明 |
| `tiger-chinese-sticky-rice` | `炊込み中華おこわ`；五花肉 110g、干虾 10g | Tiger 原页 6 人份、糯米 3 杯、高汤 300mL；五花肉调味后先炒，再与浸泡糯米按おこわ程序烹制，约 35 分钟 | `pork_fully_cooked`（猪肉）；干虾另作海鲜/干货审查 | 否；原页只给时间和程序 | 需要猪肉官方终点；需单独确认干虾是否作为需终点的生/干制海鲜，不能因“干”自动归零 |
| `jp-hiroshima-kakimeshi` | `かき飯`；牡蛎 300g | 日本农林水产省原页 4 人份、米 480g；牡蛎先用酒快速煮至收圆并留汁，米和出汁入电饭煲，饭熟后放回牡蛎焖约 10 分钟 | `seafood_fully_cooked`（牡蛎/贝类） | 否；MAFF 页面无温度 | 需要贝类官方终点或可定位的机构安全说明；保留“先煮＋饭后回锅”两段，不能压成单一电饭煲时长 |
| `jp-shiga-amenoio-gohan` | `あめのいおご飯`；琵琶鳟 160g | MAFF 原页 4 人份、米约 290g、昆布水 2 杯；鱼先处理并煮汁，米与配料入电饭煲，熟后拆骨拌葱 | `seafood_fully_cooked`（淡水鱼） | 否；MAFF 页面无温度 | 需要鱼类终点及适用范围；“先煮”降低过程风险但不等于来源已证明的终点 |
| `panasonic-oyster-negi-takikomi-rice` | `牡蠣とねぎの炊き込みご飯`；牡蛎约 120g | Panasonic Foodable 原页 4 人份、米 2 合；牡蛎、葱直接铺在米面，按 Panasonic SR-VSX101/SR-VSX181 银シャリ水位 2 炊饭；未说明牡蛎预熟状态 | `seafood_fully_cooked`（牡蛎/贝类） | 否；仅有 54–60 分钟和水位线 | 原料状态未明，先确认是否生牡蛎；再挂贝类官方终点，不能把机型程序时长当温度终点 |
| `panasonic-tokyo-seafood-pilaf` | `炊込みシーフードピラフ`；海鲜综合 150g | Panasonic Foodable 原页 6 人份、米 3 杯、鸡汤约 600mL；海鲜综合与米、汤入内锅炊饭；海鲜混合包的物种和预熟状态未展开 | `seafood_fully_cooked`（条件性） | 否；页面无物种终点 | 先取得海鲜综合包的成分/状态；若含生海鲜，补对应终点；若为预熟制品，记录其状态证明，不自动补温度 |
| `panasonic-chicken-cream-pilaf` | `チキンのクリームピラフ`；鸡腿肉 80g | Panasonic Foodable 原页 4 人份、米 2 杯、鸡汤约 400mL；鸡腿肉与米同锅炊饭，饭熟后加鲜奶油 50mL、黄油 20g 焖 5 分钟；未写鸡肉预熟 | `poultry_fully_cooked`（鸡肉） | 否；页面只有流程和焖 5 分钟 | 需要禽肉官方终点；奶油/黄油是饭熟后的乳制品收尾，不应被误当成鸡肉安全证据 |
| `taiwan-vegetable-chicken-rice` | `蔬菜雞肉飯`；鸡肉约 200g | 台湾农粮署电子书原页列洋葱、番茄、洋菇、鸡肉、鸡高汤、米；先炒香后加入生米和鸡块煮熟，并注明可用电锅；未给鸡肉温度 | `poultry_fully_cooked`（鸡肉） | 否；农粮署页无禽肉温度 | 需要官方禽肉终点与可定位的合同来源；保留“炒香＋米饭同锅”的分阶段事实，不把“煮熟”改成虚构温度 |
| `taiwan-saffron-seafood-rice` | `番紅花海鮮飯`；透抽、贻贝、带壳虾、干贝 | 农粮署电子书列海鲜用量、米 1kg、水 1kg；生米与海鲜同锅煮至熟，并有电锅/烤箱边界；水与高汤关系原文不清 | `seafood_fully_cooked`（甲壳类＋软体动物） | 否；页面无海鲜温度 | 需按物种分别确认 endpoint 或找到覆盖全部海鲜的机构终点；不得把“煮至熟”当作温度数字，不得把烤箱版本迁移为电锅参数 |
| `hk-pumpkin-taro-chicken-claypot-rice` | `南瓜芋頭雞粒煲仔飯`；鸡胸肉 75g | 香港 EatSmart 原页 2 人份、米 180g、水 260mL；鸡肉切粒腌制，与南瓜芋头等入煲，原页给分段煮制；未标鸡肉预熟 | `poultry_fully_cooked`（鸡肉） | 否；卫生署页面未给禽肉温度 | 需要香港/通用官方禽肉终点；同时保留原器具为煲仔，不推成电饭煲程序 |
| `hk-taro-shrimp-multigrain-steamed-rice` | `芋頭鮮蝦五穀蒸飯`；鲜虾 6 只 | 香港 EatSmart 原页 2 人份；红米/白米、芋头和水先蒸制，约 30 分钟后才加入鲜虾、冬菇、玉米，再大火约 15 分钟；属于中途投料/蒸制流程 | `seafood_fully_cooked`（虾） | 否；页面无虾类温度 | 需要甲壳类官方终点；不能因最后大火 1 分钟就推断所有虾达到安全终点 |
| `macau-scallop-mushroom-vegetable-rice` | `帶子磨菇菜飯`；鲜带子 100g | 澳门体育局营养食谱 3 人份、白米 1 杯、带子/菇/白菜、鸡汤 300mL；部分汤先煮菜，再将另一部分与米合煮，带子随后加入至米熟；普通锅/分段流程 | `seafood_fully_cooked`（扇贝） | 否；页面无贝类温度 | 需要贝类官方终点；保留两段汤和普通锅边界，不外推电饭煲水位或时长 |
| `yutian-electric-cooker-lamb-pilaf` | `手抓饭`；鲜羊肉 200g | 于田政府页记录羊肉先煮约 10 分钟，再与泡米、胡萝卜、洋葱用电饭锅焖约 20 分钟；大米为适量，液体“1:2”对象不清 | `lamb_fully_cooked`（羊肉） | 否；地方页无羊肉温度 | 需要羊肉官方终点；固定批量和液体仍缺，不能因 safety 补齐而晋升 executable；三种器具版本的时间不得合并 |
| `ningxia-wuzhong-rouzhanfan` | `肉粘饭`；牛肉或羊肉 | 宁夏农业农村厅原页支持肉粘饭身份、牛/羊肉与洋葱胡萝卜炒制后同米蒸制；没有固定重量、米水比例、完整时长或肉类终点 | `beef_fully_cooked` 或 `lamb_fully_cooked`（取决于具体版本） | 否；农业页无肉类温度 | 先拆分牛肉版与羊肉版的 canonical/来源范围，补对应安全终点；在此之前不能用一个“牛羊通用” endpoint 代替两种物种 |

> 说明：上表按 recipe_id 去重，正式统计为 15 个不重复条目。为避免把审计草稿和主目录混淆，下面再次列出完整清单与计数。

### 不重复计数

本轮 15 条为：

1. `tiger-chicken-bamboo-rice`
2. `tiger-whitefish-mixed-rice`
3. `tiger-chinese-sticky-rice`
4. `jp-hiroshima-kakimeshi`
5. `jp-shiga-amenoio-gohan`
6. `panasonic-oyster-negi-takikomi-rice`
7. `panasonic-tokyo-seafood-pilaf`
8. `panasonic-chicken-cream-pilaf`
9. `taiwan-vegetable-chicken-rice`
10. `taiwan-saffron-seafood-rice`
11. `hk-pumpkin-taro-chicken-claypot-rice`
12. `hk-taro-shrimp-multigrain-steamed-rice`
13. `macau-scallop-mushroom-vegetable-rice`
14. `yutian-electric-cooker-lamb-pilaf`
15. `ningxia-wuzhong-rouzhanfan`

其中 13 条为直接打开的台湾、香港、澳门、日本或厂商原页；新疆/宁夏 2 条为政府农业/地方政府原页，部分网络环境需使用 TLS 校验例外才能读取，但目录中仍保留直达 URL 与来源边界，未把无法核到的数字填入合同。

## Endpoint 送审分组

### 可以优先补终点来源（原料未写预熟）

- 禽肉：`tiger-chicken-bamboo-rice`、`panasonic-chicken-cream-pilaf`、`taiwan-vegetable-chicken-rice`、`hk-pumpkin-taro-chicken-claypot-rice`。
- 猪肉：`tiger-chinese-sticky-rice`。
- 鱼类：`tiger-whitefish-mixed-rice`、`jp-shiga-amenoio-gohan`。
- 贝/甲壳/软体：`jp-hiroshima-kakimeshi`、`taiwan-saffron-seafood-rice`、`hk-taro-shrimp-multigrain-steamed-rice`、`macau-scallop-mushroom-vegetable-rice`。
- 羊肉：`yutian-electric-cooker-lamb-pilaf`。

### 先确认原料状态再补 endpoint

- `panasonic-oyster-negi-takikomi-rice`：页面没有说牡蛎是生鲜还是预处理；不能直接把水位线和烹调时间当安全终点。
- `panasonic-tokyo-seafood-pilaf`：海鲜综合包没有物种、冷冻/预熟状态；需先拆成可审计成分。
- `ningxia-wuzhong-rouzhanfan`：牛肉版和羊肉版尚未分离，endpoint 不能按“牛羊肉”泛化。

### 本轮明确没有误加 endpoint 的情况

- 预熟竹笋、油豆腐皮、干香菇、干虾、鸡汤等配料没有被当成生动物核心食材；干虾是否需要单独 endpoint 仍留在 `tiger-chinese-sticky-rice` 的缺口中。
- 牡蛎先煮、鱼先煎、肉先炒只记录为 staged 流程，不代表来源已经证明中心温度；没有官方数值就不写安全数字。
- 本轮未把只含蛋或生豆但无法从一手原页确认生熟状态的条目强行加入；蛋/生豆安全扫描留到下一批，避免用标题或别名推断风险。

## 下一步（不改 JSON）

1. 为禽肉、猪肉、鱼类、贝类、羊肉分别找到一条可定位的官方安全终点来源；优先使用 FoodSafety.gov 或原地区公共卫生机构。
2. 先从 `tiger-chicken-bamboo-rice`、`tiger-whitefish-mixed-rice`、`tiger-chinese-sticky-rice`、`jp-hiroshima-kakimeshi`、`jp-shiga-amenoio-gohan` 做小批次复核，不要一次改 15 条。
3. 对 `panasonic-tokyo-seafood-pilaf` 和 `ningxia-wuzhong-rouzhanfan` 先补状态/物种拆分，缺证据就继续保持 `safety_endpoints: []`。
4. 只有在每个 endpoint 的物种、温度、来源定位、适用范围全部闭合后，才由单独批次按 TDD 更新主目录；本 intake 本身不构成晋升或部署授权。
