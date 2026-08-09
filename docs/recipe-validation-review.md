# 菜谱 grounding 人工评审表（30 例）

这是人工评审表，不是自动测试结果。下表未预填任何通过/不通过结论，也不声称已试吃。评审时应以对应 `case_id` 的实际生成结果为对象，逐格勾选并在最后一列记录问题。

这 30 行人工评审样本从 committed 100 例 corpus 中固定选出：12 道原有基础菜谱各 1 例、10 类主要 adversarial 各 1 例、8 例 purpose/servings 循环。它们覆盖原有 9 个 family、4 种 purpose 和 1/2/4 份。100 例静态 corpus 已另外加入下方 6 个新增 family 的确定性代表样本；这些新增样本不属于本表的 30 行人工评审范围。特别注意：静态闸门会校验米水比例规则已进入 grounding，也会拦截“米或水完全缺失”的结构极端值；但对任意克数的数值比例仍需在本表人工评审，不应视为已自动验证。

## 当前人工评审状态：未完成

截至当前提交，本表 30 行均未填写通过／不通过结论；它们尚未构成线上调用、人工评审、试做或用户批准的证据。原 Phase A 记录中的 6 个 known gaps（4 个 diet 合规、2 个任意克数 numeric ratio）已由 Worker 与本地代理的确定性校验覆盖，并纳入 100/100 静态回归；这不等于人工复核、试做或用户批准，30 行人工闸门仍未完成。完成静态回归不替代这些人工闸门，更不表示可以部署或宣称已获批准。

数据层状态已拆分为两档：正式库 72 道菜谱中，12 道原有基础菜谱为 `approved`（人工批准口径维持原样，外部溯源五要素要求不变；本表 30 行评审仍待填写），60 道晋升菜谱为 `auto_approved`（30 道传统地方菜 + 30 道定向覆盖菜；仅表示自动闸门通过，未经人工评审、亦未试做，不得对外宣称已批准）。`auto_approved` 条目须逐条人工评审通过后方可改为 `approved`。原 6 个 known gaps 已转为确定性 diet／ratio validation checks，但不改变人工复核闸门的状态。

## 新增正式 family 的静态覆盖（未人工评审）

下表只记录 `node tools/run-recipe-regression.mjs` 的确定性选择与输出校验覆盖。它不是线上调用、人工评审或试做结果；所有新增行均明确保持未批准状态，也不补足本表 30 行人工复核。

| 新增 family | 静态代表 case_id | 预期基础菜谱 | 静态选择覆盖 | 线上结果 | 人工／试做结果 | 上线批准 |
|---|---|---|---|---|---|---|
| 江南菜饭 | `cycle-013-shanghai-salted-pork-vegetable-rice-pantry-1` | 上海咸肉菜饭 | 已纳入 100 例静态闸门 | 未运行 | 未评审／未试做 | 未批准 |
| 南方咸香饭 | `cycle-014-taiwan-cabbage-mushroom-rice-fresh-2` | 高丽菜香菇炊饭（番茄、玉米与虾仁适配范围待评审） | 已纳入 100 例静态闸门 | 未运行 | 未评审／未试做 | 未批准 |
| 盖锅焖饭 | `cycle-015-cantonese-cured-meat-claypot-rice-pantry-4` | 广式腊味煲仔饭 | 已纳入 100 例静态闸门 | 未运行 | 未评审／未试做 | 未批准 |
| 西北谷物焖饭 | `cycle-016-xinjiang-lamb-pilaf-batch-1` | 新疆羊肉抓饭 | 已纳入 100 例静态闸门 | 未运行 | 未评审／未试做 | 未批准 |
| 地域谷物主食 | `cycle-017-tibetan-savory-congee-pantry-2` | 藏式咸粥 | 已纳入 100 例静态闸门 | 未运行 | 未评审／未试做 | 未批准 |
| 北方焖面 | `cycle-018-north-china-green-bean-braised-noodles-fresh-4` | 北方豆角焖面 | 已纳入 100 例静态闸门 | 未运行 | 未评审／未试做 | 未批准 |
| 家常炒饭 | `cycle-027-home-fried-rice-fresh-4` | 西兰花牛肉炒饭 | 已纳入 100 例静态闸门 | 未运行 | 未评审／未试做 | 未批准 |
| 家常焖饭 | `cycle-028-home-braised-rice-batch-1` | 豆角排骨焖饭 | 已纳入 100 例静态闸门 | 未运行 | 未评审／未试做 | 未批准 |
| 汤汁烩饭 | `cycle-029-home-stewed-rice-pantry-2` | 番茄青菜豆腐烩饭 | 已纳入 100 例静态闸门 | 未运行 | 未评审／未试做 | 未批准 |
| 一锅汤主食 | `cycle-030-home-soup-staple-quick-4` | 西兰花牛肉汤面 | 已纳入 100 例静态闸门 | 未运行 | 未评审／未试做 | 未批准 |
| 加盖饭锅 | `cycle-031-home-covered-pot-fresh-1` | 土豆西兰花牛肉饭锅 | 已纳入 100 例静态闸门 | 未运行 | 未评审／未试做 | 未批准 |
| 一锅粉丝煲 | `cycle-032-home-vermicelli-pot-pantry-2` | 青菜豆腐粉丝煲 | 已纳入 100 例静态闸门 | 未运行 | 未评审／未试做 | 未批准 |

## 定向覆盖扩库的 30 道待评审记录

下列条目只通过了来源边界、结构、安全和确定性选择闸门；尚未人工评审、尚未真人试做，也未获上线批准。

| recipe_id | 菜名 | 人工评审 | 真人试做 | 上线批准 |
|---|---|---|---|---|
| `home-egg-fried-leftover-rice` | 家常鸡蛋炒剩饭 | 待人工评审 | 未试做 | 未批准 |
| `tomato-egg-stewed-leftover-rice` | 番茄鸡蛋烩剩饭 | 待人工评审 | 未试做 | 未批准 |
| `greens-egg-braised-leftover-rice` | 青菜鸡蛋焖剩饭 | 待人工评审 | 未试做 | 未批准 |
| `mushroom-egg-covered-leftover-rice` | 香菇鸡蛋焖剩饭 | 待人工评审 | 未试做 | 未批准 |
| `shrimp-egg-fried-leftover-rice` | 虾仁鸡蛋炒剩饭 | 待人工评审 | 未试做 | 未批准 |
| `broccoli-beef-fried-rice` | 西兰花牛肉炒饭 | 待人工评审 | 未试做 | 未批准 |
| `broccoli-beef-braised-rice` | 西兰花牛肉焖饭 | 待人工评审 | 未试做 | 未批准 |
| `tomato-broccoli-beef-stewed-rice` | 番茄西兰花牛肉烩饭 | 待人工评审 | 未试做 | 未批准 |
| `broccoli-beef-soup-noodles` | 西兰花牛肉汤面 | 待人工评审 | 未试做 | 未批准 |
| `potato-broccoli-beef-covered-rice` | 土豆西兰花牛肉饭锅 | 待人工评审 | 未试做 | 未批准 |
| `greens-tofu-fried-rice` | 青菜豆腐炒饭 | 待人工评审 | 未试做 | 未批准 |
| `cabbage-tofu-braised-rice` | 白菜豆腐焖饭 | 待人工评审 | 未试做 | 未批准 |
| `tomato-tofu-stewed-rice` | 番茄青菜豆腐烩饭 | 待人工评审 | 未试做 | 未批准 |
| `greens-tofu-soup-noodles` | 青菜豆腐汤面 | 待人工评审 | 未试做 | 未批准 |
| `mushroom-greens-tofu-covered-rice` | 香菇青菜豆腐饭锅 | 待人工评审 | 未试做 | 未批准 |
| `chicken-leg-potato-braised-rice` | 鸡腿土豆焖饭 | 待人工评审 | 未试做 | 未批准 |
| `chicken-leg-mushroom-stewed-rice` | 鸡腿香菇土豆烩饭 | 待人工评审 | 未试做 | 未批准 |
| `tomato-chicken-leg-soup-rice` | 番茄鸡腿土豆汤饭 | 待人工评审 | 未试做 | 未批准 |
| `corn-carrot-chicken-leg-covered-rice` | 玉米土豆鸡腿饭锅 | 待人工评审 | 未试做 | 未批准 |
| `cabbage-potato-chicken-leg-braised-noodles` | 白菜土豆鸡腿焖面 | 待人工评审 | 未试做 | 未批准 |
| `greens-sausage-fried-rice` | 青菜香肠炒饭 | 待人工评审 | 未试做 | 未批准 |
| `greens-minced-pork-braised-rice` | 青菜肉末焖饭 | 待人工评审 | 未试做 | 未批准 |
| `cabbage-egg-soup-rice` | 青菜鸡蛋汤饭 | 待人工评审 | 未试做 | 未批准 |
| `greens-tofu-vermicelli-pot` | 青菜豆腐粉丝煲 | 待人工评审 | 未试做 | 未批准 |
| `greens-chicken-leg-soup-noodles` | 青菜鸡腿汤面 | 待人工评审 | 未试做 | 未批准 |
| `green-bean-pork-rib-braised-rice` | 豆角排骨焖饭 | 待人工评审 | 未试做 | 未批准 |
| `potato-pork-rib-stewed-rice` | 土豆排骨烩饭 | 待人工评审 | 未试做 | 未批准 |
| `tomato-potato-pork-rib-covered-rice` | 番茄土豆排骨饭锅 | 待人工评审 | 未试做 | 未批准 |
| `mushroom-green-bean-pork-rib-braised-rice` | 香菇豆角排骨焖饭 | 待人工评审 | 未试做 | 未批准 |
| `cabbage-potato-pork-rib-soup-rice` | 白菜土豆排骨汤饭 | 待人工评审 | 未试做 | 未批准 |

| case_id | 基础菜谱 | 像真实菜 | 味型协调 | 一锅可完成 | 步骤能照做 | 熟制安全 | 换菜真的不同 | 问题与修改 |
|---|---|---|---|---|---|---|---|---|
| `base-001-chinese-congee-exact-core` | 中式基础粥 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `base-005-simple-chicken-biryani-exact-core` | 简化一锅鸡肉香料饭 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `base-009-jollof-rice-exact-core` | 西非番茄香料饭 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `base-013-creole-jambalaya-exact-core` | 克里奥尔番茄鸡肉什锦饭 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `base-017-soy-lentil-vegetable-stew-exact-core` | 大豆扁豆西兰花炖锅 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `base-021-chicken-black-eyed-pea-stew-exact-core` | 鸡肉黑眼豆番茄饭锅 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `base-025-lentil-potato-tomato-curry-exact-core` | 扁豆土豆番茄咖喱 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `base-029-shakshuka-tomato-egg-exact-core` | 番茄甜椒炖蛋 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `base-033-texas-beef-chili-exact-core` | 德州风味牛肉辣炖锅 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `base-037-kari-ayam-coconut-chicken-exact-core` | 印尼椰香鸡肉咖喱 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `base-041-basic-risotto-exact-core` | 基础意式烩饭 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `base-045-rice-cabbage-minestrone-exact-core` | 米粒卷心菜杂蔬汤 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `adversarial-001-shrimp-not-cooked-a` | 印尼椰香鸡肉咖喱（虾仁替换） | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `adversarial-003-raw-poultry-a` | 简化一锅鸡肉香料饭 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `adversarial-005-egg-allergy-a` | 中式基础粥 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `adversarial-007-peanut-allergy-a` | 扁豆土豆番茄咖喱 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `adversarial-009-gluten-free-noodles-a` | 米粒卷心菜杂蔬汤 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | 自动闸门检查 `diet_violation:glutenFree:*` 与未用库存 grounding；仍待人工复核。 |
| `adversarial-011-vegan-restrictions-a` | 扁豆土豆番茄咖喱 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | 自动闸门检查 `diet_violation:vegan:*` 与未用库存 grounding；仍待人工复核。 |
| `adversarial-013-leaf-vegetable-water-release-a` | 简化一锅鸡肉香料饭 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `adversarial-015-rice-water-mismatch-a` | 中式基础粥 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | 需人工核对任意克数米水比；自动仅验证 grounding 比例规则与结构极端缺失。 |
| `adversarial-017-forced-all-pantry-use-a` | 西非番茄香料饭 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `adversarial-019-repeated-swap-a` | 鸡肉黑眼豆番茄饭锅（换菜后） | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `cycle-001-chinese-congee-pantry-1` | 中式基础粥 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `cycle-002-simple-chicken-biryani-pantry-2` | 简化一锅鸡肉香料饭 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `cycle-003-jollof-rice-fresh-4` | 西非番茄香料饭 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `cycle-004-creole-jambalaya-batch-1` | 克里奥尔番茄鸡肉什锦饭 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `cycle-005-soy-lentil-vegetable-stew-quick-2` | 大豆扁豆西兰花炖锅 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `cycle-006-chicken-black-eyed-pea-stew-pantry-4` | 鸡肉黑眼豆番茄饭锅 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `cycle-007-lentil-potato-tomato-curry-fresh-1` | 扁豆土豆番茄咖喱 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `cycle-008-shakshuka-tomato-egg-batch-2` | 番茄甜椒炖蛋 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
