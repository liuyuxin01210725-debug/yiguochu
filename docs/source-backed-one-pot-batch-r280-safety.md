# r280 安全字段回填：Tiger 鱧饭与澳门鱼球粥

基线为 r279 / 923 条。本批不新增 canonical、不改变 executable 数量，只为两条已有 `recipe_fact_checked` 记录补入同源可证明的鱼类熟制终点。

| recipe_id | 官方原页事实 | 回填 | 保留边界 |
| --- | --- | --- | --- |
| `tiger-hamo-rice` | [Tiger はもごはん](https://www.tiger-corporation.com/ja/jpn/feature/recipe/post17/) 明确 6 人、鱧 150g、高汤 600mL、先骨切り/照烧后与米同炊、60 分钟。 | `seafood_fully_cooked`，鱼类 63°C，来源为 FoodSafety.gov。 | 仅保留 Tiger 炊込み机型与鱧的骨切り/照烧前处理，不省略前处理，也不外推普通电饭煲。 |
| `macau-lettuce-fishball-porridge` | [澳门特区政府体育局生菜魚球粥](https://sportnutrition.sport.gov.mo/zh/show/pastanrice/id/84) 明确 3 人、鲮鱼肉制鱼胶/鱼球，鱼球入粥煮熟。 | `seafood_fully_cooked`，鱼类 63°C，来源为 FoodSafety.gov。 | 干虾只作为已列配料，不加 shellfish endpoint；锅煮粥、鱼胶冷藏和鱼球分段边界不改写成电饭煲。 |

FoodSafety.gov 的鱼类最低内部温度为 145°F / 63°C；本批只把它映射到来源明确会被烹煮的鱼肉，不为状态不明或已熟/干制海味追加端点。

验证：`tools/tests/source-backed-one-pot-batch-r280-safety.test.mjs`（先红后绿）、目录 validator、`check-recipes`、生成物检查和 `git diff --check`。
