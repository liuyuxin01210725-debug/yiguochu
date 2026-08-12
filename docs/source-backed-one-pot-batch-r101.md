# source-backed one-pot · r101 大同官方鲜蔬蚬精炊饭

本批只新增 1 条主目录资产。`tatung-avocado-chicken-rice` 已在 r96 之前存在，本批不重复创建；测试同时核验该既有版本仍保持独立来源和先煎后拌边界。

## 状态变化

| 项目 | r100 | r101 |
|---|---:|---:|
| 目录版本 | `source-backed-one-pot-v1-20260807-national-r100` | `source-backed-one-pot-v1-20260807-national-r101` |
| 总条目 | 798 | 799 |
| `recipe_fact_checked` | 686 | 687 |
| `executable` | 12 | 12 |
| `identity_verified` | 83 | 83 |
| `discovered` | 17 | 17 |

## 新增条目

### 大同《鲜蔬蚬精炊饭》

- `recipe_id`: `tatung-fresh-vegetable-clam-rice`
- 直接来源：[大同官方电子食谱 item 214](https://www.tatung.com.cn/ElectronicRecipes/info_itemid_214.html)
- 来源明确：2–3 人份范围；白米 1.5 米量杯、蚬 1 斤、制蚬精用水 800cc、姜片、南瓜 120g、紫山药 120g、青葱和薄盐酱油；先煮蚬汤并取蚬肉，再入大同电锅炊饭；页面标注调理约 30 分钟。
- 边界：页面写米、蚬汤、外锅水“1:1:1”，但没有解释比例对象，也没有给出可复核的外锅绝对水量；因此 `liquid_contract` 保持 `null`，不换算成普通电饭煲米水比。
- 安全边界：来源未给贝类机器可验证熟制终点，`safety_endpoints` 保持空；状态为 `recipe_fact_checked`，不得当作可直接执行或已验证菜谱。

## 既有条目复核

`tatung-avocado-chicken-rice` 已存在且保持唯一一条记录：来源为大同日本官方页面，明确鸡腿先平底锅煎、米入大同电锅炊饭、成饭后拌入牛油果和柠檬；没有新增中文版本、没有跨版本拼接，仍为 `recipe_fact_checked`。

## 测试

- `node --test tools/tests/source-backed-one-pot-batch-r101.test.mjs`：2/2 通过。
- 直接运行目录 validator：0 个结构化错误。
- `node tools/check-recipes.mjs` 当前仍报告 `docs/source-backed-one-pot-recipes.md` 与 `.csv` stale；这是 r100 及共享工作区既有生成产物未重建，不是 r101 条目结构错误。完整目录文档应由主流程统一重建，避免本批单独覆盖其他代理的未提交内容。

本批未修改 Worker、前端、Planner、模板或部署产物，也未晋升 `executable`。
