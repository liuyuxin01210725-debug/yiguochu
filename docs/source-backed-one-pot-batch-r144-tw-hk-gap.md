# r144 台湾／港台既有条目缺口回填批次

日期：2026-08-08  
主目录版本：`source-backed-one-pot-v1-20260808-global-r144`  
基线：`source-backed-one-pot-v1-20260808-global-r143`（923 条）  
批次性质：既有条目合同字段回填；不新增 canonical，不改变状态，不修改运行时代码或 UI。

## 本批范围

本批只处理已存在的台湾条目。字段回填必须来自同一条已打开、带定位的官方来源；没有固定份数、唯一液体或清晰总时长的字段继续保持 `null`。

| recipe_id | 本批处理 | 回填结果 | 明确保留的边界 |
|---|---|---|---|
| `taiwan-four-season-pork-congee` | 农粮署电子书同源页面 | `time_contract.total_minutes=20` | `fixed_batch=null`；3 杯水已有；普通锅慢煮，不外推电饭煲；安全终点仍缺 |
| `taiwan-millet-root-vegetable-rice` | 复核农业部儿童食农页 | 无新增字段 | 2.5–3 杯是范围，不能取中值；已有 30 分钟；液体继续 `null`，不把外锅水当内锅米水 |
| `taiwan-turmeric-chicken-risotto` | 复核农业部儿童食农页 | `time_contract.total_minutes=30` | 高汤 1/2 杯、椰浆 2 大匙、外锅 1 杯水是分层液体；当前单值 schema 无法无损表达，`liquid_contract=null`；无固定份数；大同电锅限定 |
| `taiwan-shiitake-tea-oil-vegetable-rice` | 复核台湾米食教育官方页 | 无新增字段 | 香菇水替换米水的组件、投菜和焖饭时点保留在步骤；缺固定份数／总时长 |
| `taiwan-tea-oil-vegetable-health-rice` | 复核台湾米食教育官方页 | 无新增字段 | 内锅 2 米杯水、外锅 1 米杯水和焖 10 分钟均是阶段事实；缺固定份数／总时长，页面材料排版疑点不校正 |

## 证据边界

- 四季米香粥的 20 分钟只由 `S-TW-AFA-FOUR-SEASON-PORRIDGE-1` 的正文定位支持；没有把 1/2 杯米推算成几人份。
- 姜黄鸡腿炖饭的“不到半小时”按来源可执行的整数合同记为 30 分钟，但没有把高汤、椰浆和外锅水相加成一个虚构的米水量。
- 小米炊饭的 2.5–3 杯是来源明确的范围；当前目录液体合同只接受单一正数，因此不写 2.75 杯。
- 茶油菜饭的香菇水、内锅水、外锅水不能跨层合计；本批不为缺失的 servings 或 cooker total time 编造值。
- 本批所有条目继续为 `recipe_fact_checked`，没有任何条目晋升 `executable`、`preview_ready` 或 `kitchen_observed`。

## 验证

- `tools/tests/source-backed-one-pot-batch-r144-tw-hk-gap.test.mjs`：4/4 通过。
- 预期总数不变：923 条，唯一 `recipe_id` 不重复。
- 后续需重建 source-backed markdown/CSV/gaps artifacts，再运行 catalog validator、`check-recipes` 和 `git diff --check`。
