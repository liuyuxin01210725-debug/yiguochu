# r167 MAFF 和ごはん固定合同（既有条目）

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260808-global-r166` / 923 条

本批只闭合一条同源、同锅、单版本的 MAFF 和ごはん条目；水位刻度与牛肉安全仍不被推导成项目合同。

## 已回填

| recipe_id | 直接来源事实 | 回填 | 保留边界 |
| --- | --- | --- | --- |
| `maff-beef-mushroom-yolk-rice` | [MAFF「旬の味覚を楽しむ炊き込みごはん」](https://www.maff.go.jp/j/keikaku/syokubunka/culture/wagohan/articles/2111/spe3_02.html) 明确 2 人份：米2合、蟹味菇50g、胡萝卜30g、薄切牛肉150g、だしの素小匙1、酱油大匙2、蛋黄2个；炊饭约45分钟，出锅铺牛肉和蛋黄后焖10分钟 | `fixed_batch.servings=2`；七项定量材料；`time_contract.total_minutes=45` | 来源写水按电饭锅刻度加入，液体对象/刻度因机型而变，`liquid_contract` 保持 `null`；牛肉在炊饭后焖制但安全终点未闭合，`safety_endpoints` 保持空数组 |

## 明确未回填

- `maff-air-buri-daikon-daikon-meshi` 仍使用既有鰤鱼萝卜炖汁并按米刻度补足，固定批次和液体合同继续为空。
- 本批未把食品安全表中的牛肉温度硬挂到 MAFF 页面；来源没有证明薄切牛肉达到可执行终点，保留 recipe_fact_checked 而不晋升。

## 验证

- RED：专项测试在 r166 基线下因版本/固定批次/时间字段缺失失败。
- GREEN：同一专项 2/2 通过。
- `build-source-backed-one-pot-catalog --write/--check`、catalog validator、`check-recipes`、`git diff --check` 均通过。
- 未修改 runtime、UI、Planner 或部署配置；目录总数保持 923。
