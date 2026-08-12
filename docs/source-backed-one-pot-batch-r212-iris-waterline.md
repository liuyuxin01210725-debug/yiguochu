# r212：IRIS RC-PGA50 型号水位合同回填

- 基线：`source-backed-one-pot-v1-20260808-global-r211`，923 条
- 本批版本：`source-backed-one-pot-v1-20260808-global-r212`，923 条
- 新增 canonical：0
- 新增 executable：0
- 变更范围：3 条既有 `recipe_fact_checked` 的型号专属 `liquid_contract`

## 回填条目

### `iris-chinese-chicken-congee` / 中華粥

IRIS OHYAMA RC-PGA50 官方原页（自动调理 3，65 分钟，3–4 人份）步骤 1 明确：米 1 合，加水至该机型“粥 1 合”水位线；鸡胸肉 200g 等配料按原页同锅处理。回填为 `porridge` 刻度、1 合标线，并保留原机型限定；不把水位线换算成普通电饭煲的毫升数。固定份数、通用液体量和鸡肉安全终点仍未由页面闭合。

来源：[IRIS OHYAMA「中華粥」](https://www.irisohyama.co.jp/ricecooker/rc-pga/detail/?c=2&r=16&s=1)

### `iris-rc-pga-paella` / パエリア

同一 RC-PGA50 官方原页（自动调理 9，75 分钟，3–4 人份）步骤 3 明确：米 2 合，冷冻海鲜 200g 等配料入锅，加水至“白米 1.5 合”水位线。回填为 `white_rice` 刻度、1.5 合标线；不把该型号标线当作跨机型毫升数。海鲜安全终点仍为空数组。

来源：[IRIS OHYAMA「パエリア」](https://www.irisohyama.co.jp/ricecooker/rc-pga/detail/?c=2&r=17&s=1)

### `iris-rc-pga-chicken-rice` / チキンライス

同一 RC-PGA50 官方原页（自动调理 9，75 分钟，3–4 人份）步骤 3 明确：米 2 合，加水至“白米 2 合”水位线，鸡腿肉 100g、玉米 60g 等配料随后同锅炊饭。回填为 `white_rice` 刻度、2 合标线；不外推普通电饭煲水量。鸡肉安全终点仍未由该厂商页单独给出。

来源：[IRIS OHYAMA「チキンライス」](https://www.irisohyama.co.jp/ricecooker/rc-pga/detail/?c=2&r=18&s=1)

## 验证

- r212 专项测试：3/3
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`：通过
- `node tools/check-source-backed-one-pot-catalog.mjs --check`：通过
- `node tools/check-recipes.mjs`：通过
- `git diff --check`：通过
- source-backed + frontend 聚焦测试：590/590
- 全量 `node --test --test-concurrency=1 tools/tests/*.test.mjs`：2461/2461
- 三条记录仍保留 RC-PGA50 型号边界；没有把水位线转换成通用毫升合同，也没有因此晋升 executable。
