# r169：MAFF 枸杞牛油果饭固定批次回填

基线为 r168/923。本批没有新增 canonical，只把已有 `maff-goji-avocado-rice` 的同源固定份数与配料量闭合到日本农林水产省（MAFF）原页。

## 回填条目

- `maff-goji-avocado-rice`：官方页面 [クコの実アボガドご飯](https://www.maff.go.jp/j/seisan/ryutu/engei/IYFV2021/IYFV2021_menu/2_58.html) 直读为 2 人份。材料为米 1 合、牛油果 40g、枸杞 20g、白だし 1 大匙、酒 1 大匙、芹菜叶 80g、盐 0.8g、亚麻籽油 2 小匙、芝麻粉 0.5g、麦仁 1/2 大匙；全部量的 `source_ids` 均为 `S-R69-MAFF-GOJI-AVOCADO`。
- 页面流程明确米和麦仁浸水，取出 2 大匙浸泡水后加入酒与白だし、牛油果和枸杞，以电饭煲炊煮；芹菜叶另以盐揉制、静置约 10 分钟、挤干后拌芝麻粉，盛饭后铺上并最后淋亚麻籽油。
- 仅回填 `fixed_batch`。来源没有给固定成品液体量（按米的水位/浸泡水处理），也只给 30–60 分钟范围，故 `liquid_contract` 与 `time_contract` 继续为 `null`。
- 这是一道不含蛋白质食品的低蛋白素食饭；`nutrition_structure.grade=C` 与 `roles=[carbohydrate,fiber]` 保持不变，不把它包装成完整蛋白主餐。芹菜叶不是同锅熟制，保留独立收尾和 `source_limited` 器具边界；不新增安全终点，也不晋升 `executable`。

## 验证

- r169 专项测试：2/2 通过。
- `build-source-backed-one-pot-catalog --write/--check`、目录 validator、`check-recipes`、`git diff --check` 均需通过后再落账。
- 本批未改运行时代码、UI、Planner 或部署配置。
