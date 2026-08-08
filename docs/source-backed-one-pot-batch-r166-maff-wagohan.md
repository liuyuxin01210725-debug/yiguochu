# r166 MAFF 和ごはん固定合同（既有条目）

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260808-global-r165` / 923 条

本批只闭合一条同源、同锅、单版本的 MAFF 和ごはん条目；水位刻度仍是来源变量，不被改写为项目单值液体合同。

## 已回填

| recipe_id | 直接来源事实 | 回填 | 保留边界 |
| --- | --- | --- | --- |
| `maff-satoimo-takana-takikomi-gohan` | [MAFF「旬の味覚を楽しむ炊き込みごはん」](https://www.maff.go.jp/j/keikaku/syokubunka/culture/wagohan/articles/2111/spe3_02.html) 明确 2 人份：米2合、去皮芋头150g、高菜腌菜50g、芝麻油1大匙、盐1小匙；普通炊饭器约45分钟 | `fixed_batch.servings=2`；五项定量材料；`time_contract.total_minutes=45` | 来源写水加到电饭煲刻度，液体对象/刻度因机型而变，`liquid_contract` 保持 `null`；普通煮饭流程不外推跨机型水量 |

## 明确未回填

- `maff-air-buri-daikon-daikon-meshi` 的核心液体是既有鰤鱼萝卜炖汁，来源要求按2合刻度补足，仍非单值液体合同，固定批次继续为空。
- `maff-kagoshima-keihan` 是白饭、鸡汤和配料分段组合的汤泡饭，不把多阶段材料表改造成一锅固定批次。

## 验证

- RED：专项测试在 r165 基线下因版本/固定批次/时间字段缺失失败。
- GREEN：同一专项 2/2 通过。
- 未修改 runtime、UI、Planner 或部署配置；目录总数保持 923。
