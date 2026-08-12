# r227：精确份数证据回填（3 条既有条目）

本批基线为 `source-backed-one-pot-v1-20260808-global-r226`，目录总数保持 923；仅回填同一官方来源已明确证明的 fixed batch 字段，不新增 canonical、不晋升 executable，也不把未知食材量补猜成数字。

## 回填条目

| recipe_id | 官方来源 | 本批回填 | 保留缺口/边界 |
| --- | --- | --- | --- |
| `hk-mushroom-mixed-vegetable-kamameshi` | 香港卫生署 EatSmart「菇菌雜蔬釜飯」：<https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=1096> | 6 人份；米 283g；原有素上汤 300mL 合同保留 | 釜锅配方含高汤制作、汆烫和前炒，配料另行处理；总时长、其他配料定量及电饭煲适配仍缺 |
| `r60-tiger-basic-chicken-congee` | Tiger USA「Basic Congee (Porridge)」：<https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/basic-congee-porridge/> | 2 份；日本米 0.5 cup；原有 Tiger 5.5-cup Soft Porridge 0.5 水位和 70 分钟保留 | 页面正文未给鸡肉实际用量；不补鸡肉安全端点，不外推其他机型 |
| `r59-tiger-usa-garlic-salmon-garden-rice` | Tiger USA「Steamed Garlic Salmon with Dill and Garden Vegetables」：<https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/steamed-garlic-salmon-with-dill-and-garden-vegetables/> | 2 份；rice 2 cups | 页面未公开米水量、总时间、鲑鱼定量及鱼类安全终点；保留 Tacook 同步边界 |

## 验证

- r227 专项测试：2/2 通过。
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`：通过。
- `node tools/check-source-backed-one-pot-catalog.mjs --check`：通过。
- `node tools/check-recipes.mjs`：通过。
- `git diff --check`：通过。
