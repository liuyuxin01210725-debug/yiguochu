# r202 安全契约批次：五条官方鸡肉饭

基线为 `source-backed-one-pot-v1-20260808-global-r201`（923 条）；本批升级为 r202，新增 canonical=0、executable=0，仅为五条既有 `recipe_fact_checked` 条目补齐禽肉安全端点。

回填条目：

- `instant-pot-tuscan-chicken-rice`
- `taiwan-red-amaranth-chicken-rice`
- `taiwan-provencal-mushroom-chicken-risotto`
- `taiwan-tea-oil-bamboo-shoot-chicken-rice`
- `taiwan-golden-mushroom-chicken-rice`

每条均挂 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov、tier 1、`claim_scopes: ["safety"]`）与 `poultry_fully_cooked` 74°C。原方的 Instant Pot、电子锅、电锅、内外锅分层以及后处理边界均保持不变；没有回填缺失的水量、份数或总时长，也没有把分阶段流程改成普通电饭煲方案。

验证：r202 专项 2/2；source-backed 全套 559/559；全量 `tools/tests` 串行 2431/2431；目录与菜谱门禁通过，`git diff --check` 通过。
