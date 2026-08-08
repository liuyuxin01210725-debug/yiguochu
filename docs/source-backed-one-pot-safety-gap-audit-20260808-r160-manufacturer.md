# r160 厂商安全缺口审计（仅审计，不改主目录）

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260808-global-r159` / 923 条
范围：Tiger 官方米饭/粥页面中，原料状态明确为未标预熟、而 `safety_endpoints` 仍为空的既有条目。

## 证据规则

- 只使用已直接打开的 Tiger 官方原页和现有 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov）安全来源。
- 安全端点只补原料类别对应的受控 endpoint；不把程序时长、水位线或“完成后检查”伪装成温度证据。
- `r60-tiger-szechuan-pork-tacook-rice` 暂不纳入：原页食材明确有生猪五花肉，但正文 Directions 被错误地写成 Basic Congee（鸡汤/芹菜/姜/粥程序），料理流程与食材冲突，先保持阻塞。

## 可闭合候选

| recipe_id | 原页与原料状态 | 建议 endpoint | 处理边界 |
|---|---|---|---|
| `r60-tiger-garlic-shrimp-herbed-rice` | [Tiger Garlic Shrimp with Herbed Rice](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/garlic-shrimp-with-herbed-rice/)；页面写 5/8 lb shelled shrimp，去肠线后放 Tacook 盘，与米同步 Synchro-Cooking；未写预熟。 | `shellfish_fully_cooked`；视觉终点“虾肉呈珍珠白或白色且不透明” | 只补虾的甲壳类端点；保留 Tacook 上盘、内锅米、出锅拌香草和柠檬酱；不补水量/时长。 |
| `r60-tiger-taiwan-minced-pork-rice` | [Tiger Taiwan Minced Pork](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/taiwan-minced-pork/)；页面写 1/2 lb minced pork，调味后放 Tacook 盘同步烹调；未写预熟。 | `pork_fully_cooked`；项目受控终点 74°C | 只补生猪绞肉端点；保留米在内锅、肉和香菇在 Tacook 盘、Synchro-Cooking 及出锅铺饭流程；不推导普通电饭煲水量/时长。 |
| `r60-tiger-salmon-rice` | [Tiger Salmon Rice](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/salmon-rice/)；页面写 2 条 6–8 oz boneless salmon fillets，生鱼直接铺在米面上，以 Plain 程序烹调，完成后拆散拌饭；未写预熟。 | `seafood_fully_cooked`；鱼类 63°C | 只补鱼类端点；保留 2 杯刻度、水位、Plain 程序和出锅去皮拌饭；不把程序本身当作温度证明。 |
| `r60-tiger-chicken-brown-rice-soup` | [Tiger Chicken and Brown Rice Soup](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/chicken-and-brown-rice-soup/)；页面写 1.5 lb boneless chicken breasts or thighs，切块后与蔬菜、糙米和 6–8 杯鸡汤同锅，Slow Cook 120 分钟，并要求完成后检查是否熟透；未写预熟。 | `poultry_fully_cooked`；74°C | 只补禽肉端点；保留 Tiger 5.5-cup、Slow Cook 120 分钟与必要时延长的原文边界；完成后“检查熟透”不替代温度端点。 |

## 暂不闭合

| recipe_id | 原因 |
|---|---|
| `r60-tiger-szechuan-pork-tacook-rice` | 原页标题/食材为 Szechuan Pork，但 Directions 文本与 Basic Congee 混杂，不能在流程冲突未解时补安全端点或把页面当作完整合同。 |

## 计划中的 r160 变更（待父任务批准后执行）

1. 先由专项测试锁定上表四条的 endpoint、共享 FoodSafety.gov 来源字段和“非 executable”状态。
2. 观察 RED 后，再仅向这四条写入 `safety_endpoints` 与 `S-SAFETY-TEMPERATURES-1` 的 `safety` scope；不新增 canonical、不改其它合同、不改运行时/UI。
3. `r60-tiger-szechuan-pork-tacook-rice` 继续保持 `safety_endpoints: []`，进入后续来源/页面修复审计。
