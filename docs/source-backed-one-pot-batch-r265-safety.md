# r265 安全端点小批

日期：2026-08-10  
基线：`source-backed-one-pot-v1-20260808-global-r264` / 923 条  
结果：3 条已有官方来源条目补入受控安全终点；不新增 canonical、不改变份数/液体/时间合同、不晋升 `executable`。

## 已回填

| recipe_id | 原始来源与流程边界 | 新端点 |
| --- | --- | --- |
| `huangshi-radish-braised-rice` | 黄石市住房和城市更新局原文写三层肉先切丝并煎炒至金黄色，再与米和萝卜等转入电饭煲；仍保留“适量清水”和先炒后转锅边界。 | `pork_fully_cooked`，74°C；使用 `S-SAFETY-TEMPERATURES-1` |
| `r104-hk-pumpkin-shrimp-golden-rice` | 香港卫生署 EatSmart 原方将虾仁腌制后与洋葱炒熟，再和蒸南瓜、燕麦饭拌合；仍是蒸、煮、炒的分阶段熟饭流程。 | `shellfish_fully_cooked`，肉质呈珍珠白或白色且不透明；使用 `S-SAFETY-TEMPERATURES-1` |
| `r104-hk-carrot-seafood-rice` | 香港卫生署原方明确蛤肉、虾、鱼肉、鱿鱼、青口另锅炒熟，再与米和鸡汤在饭锅收尾；保留双锅和多物种边界。 | `shellfish_fully_cooked`（贝类视觉终点）+ `seafood_fully_cooked`（鱼类 63°C）；使用 `S-SAFETY-TEMPERATURES-1` |

安全来源只提供受控熟制检查，不能替代原菜谱的器具、液体或分段流程证明。

## 边界

- 不把三层肉“煎至金黄色”、虾/海鲜“炒熟”改写为来源已测得的核心温度；温度是独立安全核验终点。
- 原有 `fixed_batch`、`liquid_contract`、`time_contract`、`cooker_adaptation` 和熟饭/多锅边界保持不变。
- 三条继续保持 `recipe_fact_checked`，不进入生产 72 道基础菜谱，也不把研究目录 923 条宣称为已上线菜单。

## 验证

- RED/GREEN 专项：`tools/tests/source-backed-one-pot-batch-r265-safety.test.mjs`
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`
- `node tools/check-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-recipes.mjs`
- `git diff --check`
