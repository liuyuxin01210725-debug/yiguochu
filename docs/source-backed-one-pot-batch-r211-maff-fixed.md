# r211：MAFF / 地方政府 4 人份固定批次回填

- 基线：`source-backed-one-pot-v1-20260808-global-r210`，923 条
- 本批版本：`source-backed-one-pot-v1-20260808-global-r211`，923 条
- 新增 canonical：0
- 新增 executable：0
- 变更范围：3 条既有 `recipe_fact_checked` 的 `fixed_batch` 与同源定位说明

## 回填条目

### `kagoshima-ginger-takikomi-gohan` / 鹿儿岛姜炊饭

鹿儿岛市政府原页 HTML 第 196–207 行明确 4 人份：米 2 合、油豆腐 2 片（60g）、新姜 30g、出汁昆布 10cm、淡口酱油 2 大匙、地酒 2 大匙；米按 2 合刻度加水，油豆腐同锅炊饭，新姜在出锅后拌入。回填原料与 servings；水位没有转换为通用液体数值，总时长和安全终点仍为 `null`/空数组。

来源：[鹿儿岛市政府「ショウガの炊き込みご飯」](https://www.city.kagoshima.lg.jp/seisanryutu/sangyo/norin/recipe/sonota/sono-54.html)

### `kochi-nakamura-mushroom-ginkgo-takikomi` / 高知中村菌菇银杏炊饭

高知县原页 HTML 第 73–141 行明确 4 人份：米 450g（3 合）、酒 1 大匙、淡口酱油 3 大匙、真姬菇 100g、金针菇 100g、干香菇 4 朵、银杏 50g、胡萝卜 70g、牛蒡 50g、鸡腿肉 160g；普通水量与所有配料铺米炊熟。回填原料与 servings；普通水量、总时长和鸡肉安全终点未被原页固定，继续保留缺口。

来源：[高知县「きのことぎんなんの炊き込みご飯＜中村市＞」](https://www.chisanchisho.pref.kochi.lg.jp/life/dtl.php?hdnKey=670)

### `wakayama-usuendo-mame-gohan` / 和歌山豌豆饭

农林水产省近畿农政局 PDF 第 2 页明确 4 人份：米 3 合、去壳豌豆净重 200g、酒 2 大匙、盐 1 小匙；电饭煲按普通水位炊饭。回填原料与 servings；普通水位没有压成跨机型液体合同，来源也未给普通炊饭总分钟数。

来源：[农林水产省近畿农政局《Wakayama Magazine 2026-3》](https://www.maff.go.jp/kinki/tiiki/wakayama/attach/wakayamagazine-2026-3.pdf)

## 验证

- r211 专项测试：3/3
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`：通过
- `node tools/check-source-backed-one-pot-catalog.mjs --check`：通过
- `node tools/check-recipes.mjs`：通过
- `git diff --check`：通过；三条记录仍保留原器具与未闭合字段边界。
