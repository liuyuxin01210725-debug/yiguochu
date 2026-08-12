# r171 Tiger 玄米咖喱抓饭液体合同回填

- 基线：`source-backed-one-pot-v1-20260808-global-r170` / 923 条
- 当前：`source-backed-one-pot-v1-20260808-global-r171` / 923 条
- 新增 canonical：0
- 回填条目：`tiger-brown-rice-curry-pilaf`（`玄米カレーピラフ`）

## 本批只回填的事实

Tiger 官方页面 `https://www.tiger-corporation.com/ja/jpn/feature/recipe/post57/` 的材料与步骤段落直接给出：3 人份、玄米 2 杯、鸡汤 600 mL、约 90 分钟，以及指定机型的玄米炊込み程序。因此本批只将同源的 600 mL 写入 `liquid_contract`，类型为 `added_chicken_stock`，并挂回原 `source_id`。

页面同时要求出锅后加入红椒、玉米、葡萄干和黄油再焖 4–5 分钟；该阶段保留在原 `cooking_sequence`，不把它改写为普通白米电饭煲的一键合同。原条目的完整食材数量并未全部结构化，所以 `fixed_batch` 继续为 `null`；安全终点也没有凭空新增。

## 验证

- r171 专项测试：2/2
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`
- `node tools/check-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-recipes.mjs`
- `git diff --check`
