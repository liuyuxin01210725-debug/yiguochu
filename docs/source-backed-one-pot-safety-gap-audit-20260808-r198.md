# r198 生鸡饭安全缺口审计：四条 MAFF 鸡饭

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260808-global-r197` / 923 条

本轮只审查既有 `recipe_fact_checked` 条目的禽肉熟制字段，不新增 canonical、
不晋升 `executable`，不修改原始器具、液体或分段流程。四个 MAFF 原页都明确
使用鸡肉并给出先煮/炒或混入炊饭的流程；安全终点复用目录已有的
`S-SAFETY-TEMPERATURES-1`（FoodSafety.gov，禽肉 74°C）。

## 可无损闭合

| recipe_id | 原页直接事实 | 回填与边界 |
| --- | --- | --- |
| `maff-fukuoka-kashiwa-meshi` | [MAFF 福冈页面](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/kashiwa_meshi_fukuoka.html) 第 326–377 行给 4 人份、鸡腿肉 120g；鸡肉先在平底锅炒、煮至入味，再拌入已煮好的米饭。 | `poultry_fully_cooked` / 74°C。保持“鸡肉另锅熟后拌饭”，不改成生鸡与米同锅。 |
| `maff-chiba-takatsu-torimeshi` | [MAFF 千叶页面](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/takatsu_no_torimeshi_chiba.html) 第 286–335 行给 4 人份、鸡腿肉 120g；鸡肉切小块后用酱油煮至汁少，再拌入现煮米饭。 | `poultry_fully_cooked` / 74°C。保留“先煮鸡、后拌饭”的传统流程。 |
| `maff-hokkaido-bibai-torimeshi` | [MAFF 北海道页面](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/bibainotorimeshi_hokkaido.html) 第 321–369 行给每份鸡腿/鸡胸各 20g；鸡肉先炒并调味煮，分离具与汁，米在炊饭器中用汁煮好后再拌回鸡肉。 | `poultry_fully_cooked` / 74°C。端点覆盖先炒/煮鸡肉，不把炊饭器时长当成温度证明。 |
| `maff-miyazaki-torimeshi` | [MAFF 宫崎页面](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/tori_meshi_miyazaki.html) 第 314–365 行给 4 人份地鸡 300g；地鸡先切细并在锅中炒，再与根菜、米一起炊煮。 | `poultry_fully_cooked` / 74°C。保留先炒后炊的来源顺序和大锅/锅具边界。 |

FoodSafety.gov 的既有安全来源：<https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures>。
本批只把其禽肉最低内部温度挂到对应条目；不借此补总时长、液体合同、
电饭煲跨型号等价或厨房验证结论。

## 明确不纳入本批

`tiger-hamo-rice` 原页使用的是“鱧照烧”成品，不能按生鱼端点回填；
`panasonic-taiwan-golden-snapper-rice` 页面给出鱼片和炊饭步骤，但未明确生/熟状态，
继续保留空安全数组。其他熟肉、罐头、干货和仅身份线索同样不套用本批端点。

## 验证计划

- RED/GREEN 专项：`tools/tests/source-backed-one-pot-batch-r198-safety.test.mjs`
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`
- `node tools/check-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-recipes.mjs`
- `git diff --check`

未修改 runtime、UI、Planner 或部署配置。
