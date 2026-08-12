# r207 30 例动态证据摘要

这是 `recipe-validation-20260809-r207` 的本地动态证据摘要，不是人工批准记录，也不替代 `docs/recipe-validation-review.md` 的逐格评审。

- 运行端点：`http://127.0.0.1:8766/generate-meal`
- 运行方式：30 个固定 corpus case，单次请求、`retry=false`
- 原始响应目录：`/tmp/yiguochu-r207-live30`
- 原始响应完整性：见 `/tmp/yiguochu-r207-live30/sha256.txt`
- 结果：29 个 HTTP 200 且无 `validation_flags`；1 个 HTTP 422，原因为预期的 `unsafe_recipe` / `diet_violation`（`adversarial-012-vegan-restrictions-b`）
- 回归工具结果：`live cases: 30/30 passed`（安全拒绝按明确声明的预期拒绝计通过）
- 移动端截图：`.superpowers/sdd/r207-mobile-evidence/mobile-390x844.png`

## 预览端当前状态（2026-08-09）

预览 `/health` 仍返回 `recipeLibrary: ok`、`plannerAssets: ok` 和 `baseRecipes: 72`；但对预览 `/generate-meal` 的重复动态请求返回 HTTP 429 `budget_exceeded`。只读核对共享 `RATE_KV` 后，当日预算键为 `300/300`。未清零、未提高共享预算，也未把该 429 误记为菜谱校验通过或失败；本摘要中的 30/30 结果仍指本地代理运行记录。

| # | case_id | HTTP | 返回基础菜谱 | validation_flags |
|---:|---|---:|---|---|
| 1 | `adversarial-001-shrimp-not-cooked-a` | 200 | `kari-ayam-coconut-chicken` | — |
| 2 | `adversarial-002-shrimp-not-cooked-b` | 200 | `taiwan-cabbage-mushroom-rice` | — |
| 3 | `adversarial-003-raw-poultry-a` | 200 | `simple-chicken-biryani` | — |
| 4 | `adversarial-004-raw-poultry-b` | 200 | `creole-jambalaya` | — |
| 5 | `adversarial-005-egg-allergy-a` | 200 | `chinese-congee` | — |
| 6 | `adversarial-006-egg-allergy-b` | 200 | `jollof-rice` | — |
| 7 | `adversarial-007-peanut-allergy-a` | 200 | `lentil-potato-tomato-curry` | — |
| 8 | `adversarial-008-peanut-allergy-b` | 200 | `rice-cabbage-minestrone` | — |
| 9 | `adversarial-009-gluten-free-noodles-a` | 200 | `rice-cabbage-minestrone` | — |
| 10 | `adversarial-010-gluten-free-noodles-b` | 200 | `chicken-black-eyed-pea-stew` | — |
| 11 | `adversarial-011-vegan-restrictions-a` | 200 | `lentil-potato-tomato-curry` | — |
| 12 | `adversarial-012-vegan-restrictions-b` | 422 | — | `diet_violation` |
| 13 | `adversarial-013-leaf-vegetable-water-release-a` | 200 | `simple-chicken-biryani` | — |
| 14 | `adversarial-014-leaf-vegetable-water-release-b` | 200 | `shakshuka-tomato-egg` | — |
| 15 | `adversarial-015-rice-water-mismatch-a` | 200 | `chinese-congee` | — |
| 16 | `adversarial-016-rice-water-mismatch-b` | 200 | `jollof-rice` | — |
| 17 | `adversarial-017-forced-all-pantry-use-a` | 200 | `jollof-rice` | — |
| 18 | `adversarial-018-forced-all-pantry-use-b` | 200 | `basic-risotto` | — |
| 19 | `adversarial-019-repeated-swap-a` | 200 | `chicken-black-eyed-pea-stew` | — |
| 20 | `adversarial-020-repeated-swap-b` | 200 | `tomato-potato-pork-rib-covered-rice` | — |
| 21 | `base-001-chinese-congee-exact-core` | 200 | `chinese-congee` | — |
| 22 | `base-002-chinese-congee-alias-variant` | 200 | `chinese-congee` | — |
| 23 | `base-003-chinese-congee-discouraged-pantry` | 200 | `shanxi-potato-rice` | — |
| 24 | `base-004-chinese-congee-fixed-core-dislike` | 200 | `lentil-potato-tomato-curry` | — |
| 25 | `base-005-simple-chicken-biryani-exact-core` | 200 | `simple-chicken-biryani` | — |
| 26 | `base-006-simple-chicken-biryani-alias-variant` | 200 | `chicken-black-eyed-pea-stew` | — |
| 27 | `base-007-simple-chicken-biryani-discouraged-pantry` | 200 | `chicken-black-eyed-pea-stew` | — |
| 28 | `base-008-simple-chicken-biryani-fixed-core-dislike` | 200 | `lentil-potato-tomato-curry` | — |
| 29 | `base-009-jollof-rice-exact-core` | 200 | `jollof-rice` | — |
| 30 | `base-010-jollof-rice-alias-variant` | 200 | `jollof-rice` | — |

人工评审仍待完成；不要仅凭本摘要把 30 行标记为通过，或把 `auto_approved` 改为 `approved`。
