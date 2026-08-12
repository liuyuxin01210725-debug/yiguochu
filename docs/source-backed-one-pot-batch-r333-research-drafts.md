# r333 研究做法草案补强

## 目的

这批不新增 canonical 菜谱，也不把身份档案提升为 `recipe_fact_checked` 或
`executable`。它只改研究页生成的 `research_method`：为 38 个仍只有菜名/身份
证据的条目换成更具体的起步卡（米种、主料克数、液体、步骤、时间），并在每个
字段保留 `estimated` 标记。

## 覆盖边界

- 主目录仍为 923 条，正式运行时仍是独立的 72 道基础菜谱库。
- canonical 的 `fixed_batch`、`liquid_contract`、`time_contract`、`cooking_sequence`
  继续保持来源事实或 `null`；本批不把研究估算写回来源合同。
- 砂锅/瓦罉、蒸笼、预炒、肉鱼预处理和五色染色等边界在步骤里明确保留，不能
  直接当作普通电饭煲的已验证程序。
- `Yangzhong pufferfish eight-pot rice` 未加入这批草案，原因是家庭试做存在
  河豚处理安全阻塞，不能用估算量替代持证去毒与安全证据。

## 具体改进

本批为宜昌腊肉焖饭、内莞焖鸡/焖鸭饭、黄颡鱼焖糯米饭、咸肉绣花锦菜饭、海鲜
锅巴饭、AFA 和风栗子/蒜味鮮魚/蕃茄豬肉/牛肉炊飯、台湾南瓜小鱼干炊饭/香肠
栗子炊饭/麻油松阪豬炊飯、闽东畲族乌饭、潜江虾稻米锅巴饭、上思五色饭等记录
了更具体的研究起步量和五步顺序。所有这些量都在页面上显示为“估算”，并要求
首次试做记录实际水量、时长和食材状态后再校正。

验证：`tools/tests/source-backed-one-pot-research-draft-batch-r333.test.mjs`。
