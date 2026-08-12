# r215：官方原页精确固定批次回填

## 范围

- 基线：`source-backed-one-pot-v1-20260808-global-r214` / 923 条。
- 结果：版本推进到 `source-backed-one-pot-v1-20260808-global-r215`，总数仍为 923；没有新增 canonical。
- 本批只回填原页已经明确的单一份数与数值材料，不把范围压成单值，也不把普通锅/电压力锅流程外推成通用电饭煲。

## 回填条目

### Tiger COK-B220 鸡肉西班牙饭（`tiger-chicken-paella`）

来源：[Tiger 官方原页](https://www.tiger-corporation.com/ja/jpn/feature/recipe/chicken-paella/)。原页明确 3 人、米 300g、水 330mL、鸡腿肉 120g，以及油、蒜泥、培根、蘑菇、白葡萄酒、汤底、盐、红甜椒 30g、玉米 20g 等数值材料；固定批次只写原页有数值的项目，保留藏红花/胡椒/欧芹“少々/适量”不造数。生鸡腿挂既有 FoodSafety.gov `poultry_fully_cooked` 74°C 终点；甜椒和玉米仍是炊后焖入，保留 COK-B220 边界。

### Tiger COK-B220 芝士咖喱抓饭（`tiger-cheese-curry-pilaf`）

来源：[Tiger 官方原页](https://www.tiger-corporation.com/ja/jpn/feature/recipe/cheese-curry-pilaf/)。原页明确 3 人、米 300g、金枪鱼 70g、玉米 70g、番茄酱 1 大匙、汤底 2 小匙、咖喱粉 2 小匙、盐 1/2 小匙、黄油 10g、芝士 30g；液体继续使用 COK-B220 白米水位线，不换算成通用毫升值，芝士仍为炊后焖入。

### MAFF 爱知 かきまわし／とりめし（`maff-aichi-kakimawashi`）

来源：[日本农林水产省原页](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/kakimawashi_aichi.html)。原页明确 4 人、米 2 合、鸡腿肉 50g、牛蒡/胡萝卜各 1/4 根、竹轮 2 本、酱油/味醂用量；鸡脂为“适量”不造数。该条仍是炊饭器煮饭、另锅炒煮具材、熟饭后拌合的地域流程，不晋升严格单锅执行；生鸡肉挂 FoodSafety.gov 74°C 终点。

### 大同电锅深川蛤蜊炊饭（`tatung-fukagawa-rice`）

来源：[大同官方原页](https://dennabe-official.tatung.co.jp/recipe/view/2022)。原页明确 2 人、米 2 合、油炸豆腐 1 枚、胡萝卜 30g、酒/酱油各 1 大匙、盐 1/3 小匙、青葱 2 根；蛤蜊为 350–400g 范围，故不压成单值，固定批次只写可无损表达的数值项目。蛤蜊先蒸取汁、再以内锅复炊的两阶段大同电锅流程与缺固定水量边界保持不变。

## 验证

- r215 专项：4/4 通过（先红后绿）。
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`：通过。
- `node tools/check-source-backed-one-pot-catalog.mjs --check`：通过。
- `node tools/check-recipes.mjs`：通过。
- `git diff --check`：通过。
