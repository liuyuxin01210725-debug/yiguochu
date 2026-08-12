# r213：香港卫生署与 MAFF 固定批量回填

- 基线：`source-backed-one-pot-v1-20260808-global-r212`，923 条
- 本批版本：`source-backed-one-pot-v1-20260808-global-r213`，923 条
- 新增 canonical：0
- 新增 executable：0
- 变更范围：4 条既有 `recipe_fact_checked` 的同源 `fixed_batch`；其中 1 条同时闭合原方水量

## 回填条目

### `startsmart-corn-lean-pork-porridge` / 粟米瘦肉粥

香港卫生署 StartSmart 官方页面明确写出机构批次为 83 人份：米 375g、瘦肉 350g、玉米 250g、水 3.6L、盐 1 茶匙；先水沸下米，米粒开花后加入瘦肉和玉米煮熟。回填 `servings=83`、上述同源定量和 `added_water=3600mL`。这是机构锅煮原方，不缩放成家庭克数、不外推电饭煲，猪肉安全终点和总时长合同仍为空。

来源：[香港卫生署 StartSmart「粟米瘦肉粥」](https://www.startsmart.gov.hk/tc/photogalleryDetail.aspx?RecipeID=5)

### `maff-oita-torimeshi` / 鶏めし

日本农林水产省原页明确 4 人份：米 2 合、地鸡 150g、牛蒡 120g。回填这 3 个同源定量。该页当前打印流程是鸡肉与牛蒡先炒煮，再覆到熟饭上焖 15 分钟；页面另提同米同炊变体但没有同一套水量，因此不补液体，也不把熟饭拌合流程改成生米电饭煲方案。

来源：[农林水产省「鶏めし 鹿児島県」](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/torimeshi_oita.html)

### `maff-tokushima-sobagome-zosui` / そば米雑炊／そば米汁

日本农林水产省原页明确 4 人份、荞麦米 120g、出汁 4 杯。目录此前已有同源 `added_dashi=4杯`，本批仅补 `fixed_batch` 的荞麦米定量。原方要求荞麦米预煮后冲洗，再入另锅鸡肉蔬菜汤，保留预煮/另锅边界，不改成一键电饭煲流程。

来源：[农林水产省「そば米雑炊／そば米汁 徳島県」](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/44_1_tokushima.html)

### `maff-tokushima-ayuro-sui` / 鮎ろうすい

日本农林水产省原页明确 4 人份、香鱼 4 尾、米 150g，并将水写成 7–9 杯范围。回填香鱼和米的固定批次；水因范围不压成单值，仍保持 `liquid_contract=null`。原方是平锅米粥，蔬菜先煮、米菜变软后才放整条香鱼，鱼类去骨和安全终点继续单独审核。

来源：[农林水产省「鮎ろうすい 徳島県」](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/44_27_tokushima.html)

## 验证

- r213 专项测试：4/4
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`：通过
- `node tools/check-source-backed-one-pot-catalog.mjs --check`：通过
- `node tools/check-recipes.mjs`：通过
- `git diff --check`：通过
- source-backed + frontend 聚焦测试：594/594
- 全量 `node --test --test-concurrency=1 tools/tests/*.test.mjs`：2465/2465
- 所有条目仍是研究/事实层，未晋升 executable；机构大批量、预煮、熟饭覆盖和鱼后置流程均未被隐藏或改写。
