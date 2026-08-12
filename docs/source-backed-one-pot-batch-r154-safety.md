# r154 厂商既有条目安全端点补证

**目录版本**：`source-backed-one-pot-v1-20260808-global-r154`
**基线**：r152 / 923 条（r153 仅为于田羊肉审计，不改目录）
**变更**：4 条既有 `recipe_fact_checked` 记录补独立生鲜安全终点；新增 canonical 0；晋升 `executable` 0；运行时代码/UI 0。

## 共享安全来源

本批复用已直接打开、tier 1 的 FoodSafety.gov 官方来源：

- [Cook to a Safe Minimum Internal Temperature](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)
- `source_id`: `S-SAFETY-TEMPERATURES-1`
- `access_status`: `opened`
- `evidence_tier`: `1`
- `claim_scopes`: `["safety"]`

端点只描述对应原料的安全边界，不替代原菜谱的机型、水位、程序、份数、时间或家庭验证。鱼类采用 63°C；鸡肉和本批米饭锅中的生禽肉采用 74°C；猪肉采用项目现行米饭锅 74°C 合同。干贝在本批鲷鱼菜中由原页明确为浸泡干货，不添加生鲜贝类端点。

## 变更清单

| recipe_id | 原料状态核对 | 新 endpoint | 保留边界 |
|---|---|---|---|
| `panasonic-taiwan-taiyu-scallop-quinoa-rice` | Panasonic SR-PAA100 原页写鲷鱼片 150g，先以盐和酒腌制；干贝 25g 为浸泡干货 | `seafood_fully_cooked`；63°C | 只补鲷鱼片安全终点；不把干贝当生鲜贝，不改变 SR-PAA100 水位、藜麦/干贝浸泡和出锅取鱼拌饭流程 |
| `panasonic-my-century-egg-chicken-congee` | Panasonic Malaysia 原页写鸡胸肉 100g 进入 PORRIDGE；皮蛋为加工蛋 | `poultry_fully_cooked`；74°C | 保留前置搅拌机、QUICK COOK 与 PORRIDGE 双程序；不新增蛋类生鲜终点，也不把它宣称为传统皮蛋瘦肉粥 |
| `r97-zojirushi-taiwan-brown-cabbage-mixed-rice` | 象印台湾原页写梅花猪肉丝 100g，未标预熟，铺在糙米上同炊 | `pork_fully_cooked`；74°C | 仅限压力 IH 电子锅糙米水位 3；不把水位外推成普通电饭煲毫升数，份数和总时间继续为空 |
| `r98-zojirushi-taiwan-wild-mushroom-chicken-mixed-rice` | 象印台湾原页写鸡腿肉 150g，未标预熟，铺在白米上同炊 | `poultry_fully_cooked`；74°C | 仅限压力 IH 电子锅白米刻度 2 与什锦饭程序；不推导普通电饭锅液体或总时间 |

## 明确排除

`panasonic-my-chicken-pumpkin-lotus-mixed-rice` 本轮不改。其官方页面导语称鸡肉从头入锅，但编号步骤遗漏鸡腿投料时点，原料状态与流程虽可识别，投料冲突仍未解决；不以安全端点掩盖流程缺口，继续保持 `identity_verified` 与 `safety_endpoints: []`。

## 不变项

1. 本批只补安全字段，不补固定批量、液体、总时间或跨机型适配。
2. 所有条目仍为 `recipe_fact_checked`，不晋升 `executable`，也不代表 `kitchen_observed`。
3. 不新增菜谱、不修改运行时代码、UI 或 Planner，不部署 production。

## TDD 与门禁

先新增 `tools/tests/source-backed-one-pot-batch-r154-safety.test.mjs`，以 r152 目录为基线断言 r154 版本和四条安全端点；首跑预期失败。写入安全字段后专项测试 2/2 通过。随后运行：

```text
node --test tools/tests/source-backed-one-pot-batch-r154-safety.test.mjs
node tools/build-source-backed-one-pot-catalog.mjs --write
node tools/check-source-backed-one-pot-catalog.mjs
node tools/check-recipes.mjs
git diff --check
```
