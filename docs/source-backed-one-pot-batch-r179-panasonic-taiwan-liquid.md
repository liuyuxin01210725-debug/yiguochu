# r179 Panasonic Taiwan 四条液体合同

- 基线：`source-backed-one-pot-v1-20260808-global-r178`，923 条
- 当前：`source-backed-one-pot-v1-20260808-global-r179`，923 条
- 新增 canonical：0；补 4 条既有 `recipe_fact_checked` 的同源液体合同

本批只回填 Panasonic Taiwan 官方详情页直接写出的液体对象与定量：

- `panasonic-taiwan-scallop-five-color-rice`：柴鱼高汤 5 杯，`added_dashi`；
- `panasonic-taiwan-loofah-dried-fish-rice`：水 300g，`added_water`；
- `panasonic-taiwan-salmon-mushroom-rice`：水 1.5 杯，`added_water`；
- `panasonic-taiwan-sakura-shrimp-cabbage-rice`：水 400g，`added_water`。

四条均保留 Panasonic SR-PAA100 或指定型号边界，未外推普通电饭煲；不补来源未写出的份数或总时长。鲑鱼条目既有鱼类 63°C endpoint 保持不变，其余条目的安全数组、第三方授权/鱼类缺口和 `source_limited` 状态保持原样，均不晋升 `executable`。
