# r201 公共机构禽肉安全契约批次

基线为 `source-backed-one-pot-v1-20260808-global-r200`（923 条）；本批升级为 r201，新增 canonical=0、executable=0，仅为五条既有 `recipe_fact_checked` 条目补禽肉安全端点。

回填条目：

- `instant-pot-chicken-satay-rice`
- `osu-cheesy-chicken-rice-vegetable-skillet`
- `cu-caribbean-jerk-chicken-rice`
- `cdph-calfresh-chicken-rice`
- `wisconsin-polk-arroz-con-pollo`

每条均挂 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov、tier 1、`claim_scopes: ["safety"]`）与 `poultry_fully_cooked` 74°C。原方的 Instant Pot、煎锅、烤箱、取出/回锅和末段投料边界保持不变；没有回填缺失的份数、液体或总时长，也没有把分阶段流程改写成通用电饭煲方案。

验证：专项 2/2；source-backed 全套 557/557；全量 `tools/tests` 串行 2429/2429；目录与菜谱门禁通过。
