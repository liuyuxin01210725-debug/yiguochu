# r206 安全小批（六条既有来源合同）

日期：2026-08-09
基线：`source-backed-one-pot-v1-20260808-global-r205` / 923 条
结果：不新增 canonical；六条继续保持 `recipe_fact_checked`，只补原始来源可支持的安全终点。

## 回填范围

| recipe_id | 原始来源事实 | 回填 endpoint | 保留边界 |
| --- | --- | --- | --- |
| `sichuan-rice-cooker-pork-ribs-rice` | Woks of Love 原页给出生排骨焯水、煎色，再将热排骨和汤汁倒入电饭煲与米同煮。 | `pork_fully_cooked` / 74°C | 先焯/煎与电饭煲连续流程不变；不把独立来源改称官方来源。 |
| `tiger-gomoku-rice-post43` | Tiger 原页鸡肉先煮约 4–5 分钟，再进入指定机型炊饭。 | `poultry_fully_cooked` / 74°C | 保留 Tiger 型号、水位线和荷兰豆出锅拌入。 |
| `panasonic-spring-chicken-vegetable-risotto` | Panasonic 原页鸡胸在锅内先煎至表面变色，再与米和热高汤继续烹调。 | `poultry_fully_cooked` / 74°C | 保留锅内分阶段炒制、末段蔬菜投料及非通用电饭煲边界。 |
| `panasonic-chicken-biryani-sr-da182` | Panasonic SR-DA182 原页鸡腿腌制后分面煎，再进入 Quick Cook/Steam 与 White Rice 分阶段流程。 | `poultry_fully_cooked` / 74°C | 保留 SR-DA182 机型、浸米和分阶段程序。 |
| `iris-kpc-ma2-paella-recipe29` | Iris KPC-MA2 原页鸡翅根腌制后随压力炊饭完成。 | `poultry_fully_cooked` / 74°C | 不外推 KPC-MA2 压力程序到普通电饭煲。 |
| `iris-kpc-ma2-hainan-chicken-rice` | Iris KPC-MA2 原页鸡腿铺在米面完成压力炊饭，酱汁另做。 | `poultry_fully_cooked` / 74°C | 保留酱汁另做与原机型边界，不宣称所有步骤同锅。 |

六条均挂既有 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov）并限定 `claim_scopes: ["safety"]`。本批不补数量、液体、时间、过敏原，也不晋升 `executable`；“来源合同安全端点”仍不等于厨房实测或人工批准。

## 验证

- r206 专项 TDD：2/2；先在 r205 基线下失败，再完成回填后通过。
- `node tools/build-source-backed-one-pot-catalog.mjs --write`：923 条 artifacts 正常。
- `node tools/check-source-backed-one-pot-catalog.mjs --check`、`node tools/check-recipes.mjs`、`git diff --check`：通过。
