# r177 香港卫生署两条高汤合同

- 基线：`source-backed-one-pot-v1-20260808-global-r176`，923 条
- 当前：`source-backed-one-pot-v1-20260808-global-r177`，923 条
- 新增 canonical：0；补 2 条既有 `recipe_fact_checked` 的同源液体合同

## 胡蘿蔔海鮮飯

香港卫生署 EatSmart 官方页明确 4 人份，白米 1.5 杯、蛤肉/虾/鱼/鱿鱼/青口等配料，以及鸡汤 100 毫升。流程是双锅预炒后把配料排在饭锅米上，加鸡汤小火收尾约 15 分钟。r177 仅回填 `added_chicken_stock` 100 mL，并把同一来源的 `claim_scopes` 补上 `liquid`；多锅边界、海鲜安全缺口和 `not_adapted` 保持不变。

## 蘑菇意大利飯配軟芝士

同一官方来源明确 1 人份、意大利米 50 克、蔬菜高汤 200 毫升；米先用高汤煮约 10 分钟，蔬菜和蘑菇另锅煎后再合煮。r177 回填 `added_broth` 200 mL 蔬菜高汤并补 `liquid` scope，不把分阶段煮锅改写成普通电饭煲合同；安全数组继续为空。

两条均不新增菜名、不晋升 `executable`，仅闭合来源已经直接写出的液体对象与定量。
