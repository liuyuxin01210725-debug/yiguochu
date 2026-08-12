# r178 Panasonic 两条鸡肉米饭高汤合同

- 基线：`source-backed-one-pot-v1-20260808-global-r177`，923 条
- 当前：`source-backed-one-pot-v1-20260808-global-r178`，923 条
- 新增 canonical：0；补 2 条既有 `recipe_fact_checked` 的同源液体合同

Panasonic Cooking Australia 的 Spring Chicken and Vegetable Risotto 原页明确鸡胸 500g、Arborio 米 1.5 杯和热鸡高汤 750mL；高汤先加热，锅内先炒香/煎鸡，再加入米和高汤，末段加入蔬菜。r178 仅回填 `added_chicken_stock` 750 mL。

Panasonic SR-DA182 Chicken Biryani 原页明确 4 只鸡腿、印度香米 400g 和鸡高汤 550mL；来源要求腌米、浸米、先煎鸡腿，再以 Quick Cook/Steam 与 White Rice 分阶段完成。r178 仅回填 `added_chicken_stock` 550 mL。

两条来源均为指定 Panasonic 型号的分阶段流程，仍是 `source_limited`；未补总时长、未补安全 endpoint、不外推普通电饭煲，也不晋升 `executable`。
