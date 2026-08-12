# r156：港台既有菜谱合同缺口回填

> 批次日期：2026-08-08
> 基线：`source-backed-one-pot-v1-20260808-global-r155`（923 条）
> 目标版本：`source-backed-one-pot-v1-20260808-global-r156`（923 条）
> 范围：只回填既有条目的同源 `time_contract` / `liquid_contract`；不新增菜谱、不晋升 `executable`、不改 runtime/UI。

## 变更清单

| recipe_id | 回填字段 | 来源事实 | 保留的边界 |
|---|---|---|---|
| `taiwan-bottle-gourd-mushroom-rice` | `time_contract.total_minutes: 60` | 台湾农业部农业儿童网·《瓠瓜香菇飯》原文写“制作时间约1小时”，与该条米3杯、水3杯的同一来源绑定。 | 份数仍未知；电饭锅来源不外推其他机型；安全终点仍空。 |
| `taiwan-pork-rib-claypot-rice` | `time_contract.total_minutes: 30` | 台湾农业部儿童食农教育资讯网·《排骨煲仔飯》原文制作时间30分钟，与排骨300g、米和分段砂锅流程同源。 | 份数仍未知；“半包鲜菇鸡汤+2杯水”无法用单值液体合同无损表达，因此 `liquid_contract:null`；保持砂锅、不得推导电饭煲。 |
| `taiwan-ten-fragrant-rice` | `liquid_contract.kind: added_water; amount: 336g` | 台湾农粮署北区分署电子书·《十香飯》同一食谱段明确白米300g、水336g；来源引用新增 `liquid` scope。 | `fixed_batch`、`time_contract` 仍空；来源同时出现“米飯”和生米浸泡/煮制措辞，保留 `source_limited`，不把336g抽象成通用 Ratio DSL，不跨器具外推。 |

## 验证

先写失败测试，再实现数据回填：

```text
node --test tools/tests/source-backed-one-pot-batch-r156-tw-hk-gap.test.mjs
2/2 passed
```

专项断言包括：目录版本和总数不变（r156/923）、三个 source_id 与字段对象精确匹配、排骨液体仍为 null、十香饭不晋升 executable、器具边界保留。

待执行并记录在交付回报中的门禁：

```text
node tools/build-source-backed-one-pot-catalog.mjs --write
node tools/build-source-backed-one-pot-catalog.mjs --check
node tools/check-recipes.mjs
git diff --check
```

本批没有将三个条目改为 `executable`，也没有把未闭合的份数、总时长或安全字段补成推断值。
