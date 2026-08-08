# r199 全球禽肉安全缺口审计

> 基线：`source-backed-one-pot-v1-20260808-global-r198`，923 条；本审计只处理既有条目，不新增 canonical、不晋升 executable。

本轮复核了五个已经有直达官方来源、定量与流程的全球主餐条目。来源都明确鸡肉/火鸡在原器具流程中被炒、煮或高压烹调，但没有提供本项目所需的数值禽肉终点，因此只复用既有 [FoodSafety.gov 禽肉 74°C](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures) 端点；不改变份数、液体、时长或器具合同。

| recipe_id | 一手来源与可证明流程 | 回填边界 |
| --- | --- | --- |
| `global-nwu-one-pot-chicken-rice` | [North-West University 食谱册](https://health-sciences.nwu.ac.za/sites/health-sciences.nwu.ac.za/files/files/Consumer_Sciences/Documents/Resepteboek_2024_B5.pdf) 第37–38页：鸡腿450g、米200g、水500ml；普通锅低火约20–30分钟 | `poultry_fully_cooked` 74°C；保留普通锅与时长范围 |
| `global-irga-risoto-frango-legumes` | [IRGA / Rio Grande do Sul 政府页面](https://irga.rs.gov.br/risoto-de-frango-com-legumes)：鸡肉300g，与米和蔬菜同锅炒，分次加入1.5L高汤 | `poultry_fully_cooked` 74°C；保留分次加汤烩饭边界 |
| `global-peru-minsa-arroz-pollo` | [秘鲁卫生部 CENAN 页面](https://www.gob.pe/institucion/minsa/noticias/42250-el-pollo-es-una-importante-fuente-de-fosforo-y-potasio)：每份鸡肉100g，先炒调味料，再加鸡肉/蔬菜煮熟并让米饭煮透 | `poultry_fully_cooked` 74°C；液体和总时长仍为空 |
| `tamu-turkey-burrito-bowl` | [Texas A&M AgriLife Extension](https://dinnertonight.tamu.edu/recipe/turkey-burrito-bowl/)：火鸡肉末先用 Sauté 炒熟，再入电压力锅高压8分钟 | `poultry_fully_cooked` 74°C；保留电压力锅边界，不外推电饭煲 |
| `usu-salsa-verde-chicken-rice` | [Utah State University 食谱册](https://www.usu.edu/campusrec/files/Cooking-on-a-Budget-Cookbook.pdf) 第29页：去骨鸡腿先煎5–7分钟，再与米、蔬菜、汤汁盖锅焖 | `poultry_fully_cooked` 74°C；保留普通高边锅和30分钟来源合同 |

五条均挂 `S-SAFETY-TEMPERATURES-1`，并把安全来源的 `claim_scopes` 限定为 `safety`。没有把“煮至熟”“程序分钟数”冒充数值温度，也没有把普通锅、烩饭或压力锅流程改写成通用电饭煲方案。

明确未纳入：熟肉/熟豆边界、来源状态不明的禽肉、仅营养说明而无独立流程的条目，以及需要另锅或烤箱分段的版本。
