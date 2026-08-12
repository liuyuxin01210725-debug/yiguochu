# r170：Panasonic 高丽菜鲭鱼炊饭液体合同回填

基线为 r169/923。本批没有新增 canonical，只把已有 `panasonic-taiwan-cabbage-mackerel-rice` 的同源液体字段闭合到 Panasonic Cooking Taiwan 原页。

## 回填条目

- `panasonic-taiwan-cabbage-mackerel-rice`：官方页面 [高麗菜鯖魚炊飯](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/3638) 的步骤明确以 1.1 杯热水（其中含酱油 1/2 小匙）加入 1 杯白米，再按页面顺序铺料，并以 NU-SC300B「原味蒸」25 分钟、最后 5 分钟加入毛豆。液体合同记录来源给出的 1.1 杯总量，单位保留“热水，含酱油 1/2 小匙”的语义，不把酱油另算成水，也不推导普通电饭煲水位。
- 页面正文同时写出 3 人份食材表，但高丽菜叶数等为范围、调味料有“少许”，且页面另提 2 杯米可做 4–5 人；为避免把不同批量拼成单一合同，本条 `fixed_batch` 继续为 `null`。
- 页面只给蒸烤炉程序和分阶段投料，未给本条可迁移的普通电饭煲合同、鱼类安全终点或独立总时长；`time_contract`、`safety_endpoints` 与 `cooker_adaptation.status=source_limited` 保持边界。

## 验证

- r170 专项测试：2/2 通过（先在 r169 基线下验证红测，再回填 JSON）。
- `build-source-backed-one-pot-catalog --write/--check`、目录 validator、`check-recipes`、`git diff --check` 均需通过后再落账。
- 本批未改运行时代码、UI、Planner 或部署配置。
