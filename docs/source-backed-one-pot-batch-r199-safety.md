# r199 安全契约批次：全球五条禽肉米饭

基线为 `source-backed-one-pot-v1-20260808-global-r198`（923 条）；本批版本为 r199，新增 canonical=0、executable=0，仅为五条既有 `recipe_fact_checked` 条目补安全端点。

## 回填条目

- `global-nwu-one-pot-chicken-rice`：North-West University 普通锅鸡腿米饭，挂禽肉 74°C。
- `global-irga-risoto-frango-legumes`：IRGA 鸡肉蔬菜烩饭，挂禽肉 74°C。
- `global-peru-minsa-arroz-pollo`：秘鲁 CENAN 鸡肉饭，挂禽肉 74°C。
- `tamu-turkey-burrito-bowl`：Texas A&M 电压力锅火鸡肉末饭碗，挂禽肉 74°C。
- `usu-salsa-verde-chicken-rice`：Utah State University 普通高边锅鸡腿饭，挂禽肉 74°C。

每条都追加 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov、tier 1、`claim_scopes: ["safety"]`），并保留原来源的锅具、分次加汤、先炒后炊或高压流程。无数量、液体、时间或电饭煲适配的推导。

## 验证

- r199 专项测试：2/2
- source-backed 测试：553/553
- catalog validator、`check-recipes.mjs` 与 `git diff --check`：批次门禁通过
