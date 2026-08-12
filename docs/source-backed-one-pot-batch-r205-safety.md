# Source-backed one-pot batch r205 — safety contract closure

本批基线为 `source-backed-one-pot-v1-20260808-global-r204`（923 条）。没有新增 canonical；为 9 条已有 `recipe_fact_checked` 记录补上可由原始流程与既有 FoodSafety.gov 证据共同支持的安全合同，并对 1 条 PDF 记录只补安全字段、不晋升状态。

## 处理清单

| recipe_id | 原始来源事实 | 安全合同 | 状态/边界 |
| --- | --- | --- | --- |
| `hk-yam-longan-chicken-claypot-rice` | 香港卫生署原方写鸡柳后投，慢火约 10 分钟至熟透 | `poultry_fully_cooked` 74°C | `executable`；保留煲仔饭，不外推电饭煲 |
| `cookpot-beef-wild-mushroom-rice` | 鍋寶电锅原方将牛肉片分层入内锅，跳起后确认熟透 | `beef_fully_cooked` 71°C | `executable`；保留指定鍋寶机型和水位边界 |
| `tatung-pork-daikon-rice` | 大同原方将猪五花铺在米和根菜上同锅炊煮 | `pork_fully_cooked` 74°C | `executable`；保留大同米水位线 |
| `tatung-wakayama-ginger-rice` | 大同原方鸡胸切片腌制后铺在米面，跳起后确认熟透 | `poultry_fully_cooked` 74°C | `executable`；不把标题误作和歌山地域证明 |
| `tefal-paella-r106320` | Tefal 原方先煎鸡、同锅煮鱿鱼/虾/贻贝，Keep Warm 收尾 | 禽肉 74°C、鱼介 63°C、贝类肉质白且不透明 | `executable`；保留 Tefal 温控锅和多阶段流程 |
| `tefal-risotto-with-shrimps-r106225` | 虾先煎取出，米熟后回锅并静置 | `shellfish_fully_cooked` 视觉终点 | `executable`；保留分次加汤、先煎虾和奶酪收尾 |
| `global-spain-arroz-negro` | Spain.info 原方 paella pan 炒墨鱼后与米、高汤同煮 | `seafood_fully_cooked` 63°C | `executable`；不改成电饭煲参数 |
| `hk-mushroom-grass-carp-congee` | 香港卫生署原方粥底后投鲩鱼腩，煮至熟透 | `seafood_fully_cooked` 63°C | `executable`；保留约 18 份大锅粥底，不做家庭缩放 |
| `instant-pot-chicken-enchilada-rice` | Instant Pot 原方先以 Sauté 炒鸡胸，再进入米饭/压力阶段 | `poultry_fully_cooked` 74°C | `executable`；保留 Instant Pot 程序，不外推普通电饭煲 |
| `va-pork-rice-skillet` | VA 官方 PDF 原方同一 skillet 煎猪排后与米、汤汁焖煮 | `pork_fully_cooked` 74°C | 仍 `recipe_fact_checked`；安全字段已补，但 PDF 尚未建立本地归档 manifest，暂不晋升 |

## 证据与限制

- 安全端点均只引用既有 `S-SAFETY-TEMPERATURES-1`，不把原方“熟透”、程序时长或锅具温度当作数值温度证明。
- 鱼类采用 63°C；禽肉采用 74°C；本项目混合米饭/砂锅猪肉合同采用 74°C；虾、蟹、贻贝等采用肉质珍珠白/白色不透明视觉终点。原始器具、预处理、回锅和分阶段顺序保持不变。
- `va-pork-rice-skillet` 的来源是官方 PDF，虽然安全字段可闭合，但 executable 还要求 PDF 本地归档 manifest；本批没有伪造或下载未核验的归档，故保持事实核查状态。
- `executable` 仅表示 source-backed 合同字段完整，仍不等于厨房实测、人工批准、preview-ready 或生产发布。

## 验证

- r205 专项测试：`tools/tests/source-backed-one-pot-batch-r205-safety.test.mjs`，2/2。
- `build-source-backed-one-pot-catalog.mjs --write`、catalog validator、`check-recipes.mjs`、`git diff --check` 均通过。
