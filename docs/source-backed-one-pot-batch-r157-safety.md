# r157 安全端点回填批次

> 日期：2026-08-08
> 基线：`source-backed-one-pot-v1-20260808-global-r156`（923 条；安全终点覆盖 114 条）
> 结果：6 条既有条目补入安全端点；不新增 canonical、不改变配方状态、不晋升 `executable`。

## 本批范围

本批只处理已有目录中原文明确含生的禽肉、猪肉、牛肉或扇贝的条目。安全端点来自已直接打开的 FoodSafety.gov 官方表，不把它当作配方、器具或时间证据；每条端点都在该条目的 `source_refs` 中以 `claim_scopes: ["safety"]` 单独挂载 `S-SAFETY-TEMPERATURES-1`。原厂商页继续只证明原有食材、步骤和型号边界。

| recipe_id | 新增端点 | 原文边界 | 处理 |
| --- | --- | --- | --- |
| `tiger-pork-bamboo-rice` | `pork_fully_cooked`，74°C | Tiger 炊込み页将猪肉切条、调味后铺在米上同锅炊熟；按含肉米饭的保守终点记录 | 已回填 |
| `tiger-scallop-pea-rice` | `shellfish_fully_cooked`，扇贝肉呈珍珠白/白色且不透明 | 扇贝先以酒盐炒至鼓起，米饭完成后回拌并焖约3分钟；不虚构统一温度 | 已回填 |
| `tiger-beef-matsutake-rice` | `beef_fully_cooked`，71°C | 牛肉按 Tiger 原方先以煮汁处理，炊饭后回拌；项目对薄牛肉采用 71°C 保守终点 | 已回填 |
| `toshiba-bibimbap-mixed-rice` | `beef_fully_cooked`，71°C | Toshiba RCP-30R 原方将牛肉薄片铺在米面后用压力炊饭；机型和压力程序不外推 | 已回填 |
| `zojirushi-brown-rice-ih-pot` | `poultry_fully_cooked`，74°C | 象印 IH 锅原方把鸡肉铺在玄米和根菜上加热；保留 IH 锅边界 | 已回填 |
| `panasonic-chicken-vegetable-rice` | `poultry_fully_cooked`，74°C | Panasonic SR-DF181WST 原方先煎鸡胸肉 2–3 分钟，再按 white rice 程序；不外推普通机型 | 已回填 |

FoodSafety.gov 原页：[Safe Minimum Internal Temperatures](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)，`access_status: opened`、`evidence_tier: 1`。扇贝使用页面给出的外观终点；禽肉使用 74°C。牛肉条目记录的是项目保守的 71°C 端点，不能反向声称 FoodSafety.gov 对所有整块牛肉要求 71°C。

## 仍阻塞、未作安全晋升的条目

以下六条本轮通过官方页复核后继续保持 `safety_endpoints: []`，原因是原料状态或合同边界尚不足以挂现有端点：

| recipe_id | 官方来源 | 阻塞原因 |
| --- | --- | --- |
| `panasonic-tokyo-seafood-pilaf` | [Panasonic Foodable](https://foodable.jpn.panasonic.com/recipes/group-detail/619) | “冷冻海鲜混合物”未给物种和生熟状态；页面的解冻/弃液说明不能证明每一物种的终点 |
| `tiger-seafood-pilaf` | [Tiger Seafood Pilaf](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/seafood-pilaf/) | 混合海鲜可含虾、鱿鱼、章鱼、贻贝或仿蟹，集合不固定 |
| `toshiba-seafood-paella-rice` | [Toshiba RCP-30R](https://www.toshiba-lifestyle.com/jp/pressure-cookers/recipes/24041573) | 冷冻海鲜混合物物种和状态未明确，不能用单一鱼/贝类端点覆盖 |
| `philips-sea-conch-oyster-chicken-congee` | [Philips recipe](https://www.philips.com.hk/c-e/ho/philips-chef/recipe-overview-page/main-courses/chicken-congee-with-dried-oyster-and-sea-conch.html) | 鸡块原料状态未写明；蚝、海螺、瑶柱为干货/浸泡状态，现有端点不能无损代替原料状态合同 |
| `panasonic-my-chicken-pumpkin-lotus-mixed-rice` | [Panasonic Malaysia](https://www.panasonic.com/my/consumer/kitchen-appliances-learn/healthy-everyday-recipes/recipe-top-page/mixed-rice-with-pumpkin-and-lotus-roots.html) | 引言称鸡肉、南瓜等一开始加入，编号步骤没有鸡肉投料时机；流程证据冲突，先不晋升 |
| `yutian-electric-cooker-lamb-pilaf` | [于田抓饭](https://www.xjyt.gov.cn/changyou/chi/2021-06-07/251.html) | 页面本轮无法稳定打开；已有来源虽写羊肉切小块并预煮，但米量/液体对象仍不清，且切块状态不足以映射现有安全合同 |

这些条目的 unresolved 状态是有意保留，不能通过把混合物改名为“海鲜”、把干货当生鲜或用邻近菜的温度来凑覆盖率。

## 验证与边界

- 只改 `tools/data/source-backed-one-pot-recipes.v1.json`、本批测试和本批文档；无运行时代码、UI、Planner、部署改动。
- 6 条记录保持 `status: recipe_fact_checked`，不改变 `fixed_batch`、`liquid_contract`、`time_contract` 或 `cooker_adaptation`。
- 端点来源与配方来源分离，所有安全来源均为直接打开的官方页面并带定位；缺乏明确原料状态的条目继续为空。
- 目录版本由 r156 bump 至 `source-backed-one-pot-v1-20260808-global-r157`，后续目录/测试产物必须以该版本为准。
