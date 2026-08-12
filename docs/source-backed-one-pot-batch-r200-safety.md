# r200 安全契约批次：五条机构来源禽肉饭

基线为 `source-backed-one-pot-v1-20260808-global-r199`（923 条）；本批升级为 r200，新增 canonical=0、executable=0，仅为五条既有 `recipe_fact_checked` 条目补禽肉安全端点。

回填条目：

- `cleveland-clinic-chicken-brown-rice-casserole`
- `bmc-chicken-carrots-brown-rice`
- `kidney-care-chicken-tikka-pulao`
- `firststeps-turkey-vegetable-pilaf`
- `healthvermont-one-pot-chicken-brown-rice`

每条均挂 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov、tier 1、`claim_scopes: ["safety"]`）与 `poultry_fully_cooked` 74°C。原方的汤锅、煎锅、带盖锅、普通锅和烤箱边界保持不变；没有回填缺失的份数、液体或总时长，也没有把烤箱/炉灶流程改写成电饭煲方案。

验证：r200 专项 2/2；source-backed 全套 555/555；全量 `tools/tests` 串行 2427/2427；目录与菜谱门禁通过。
