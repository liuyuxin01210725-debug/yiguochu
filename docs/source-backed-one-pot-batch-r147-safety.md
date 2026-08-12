# r147 批次记录：五条厂商鸡肉饭安全端点回填

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260808-global-r145` / 923 条
目标版本：`source-backed-one-pot-v1-20260808-global-r147` / 923 条

## 本批范围

本批只回填已有条目的安全字段，不新增 canonical、不改变菜名或份量、不晋升 `executable`：

- `panasonic-one-pot-chicken-rice`
- `panasonic-claypot-style-chicken-rice`
- `tatung-avocado-chicken-rice`
- `joyoung-pumpkin-shiitake-chicken-rice`
- `instant-pot-coconut-chicken-pineapple-rice`

五条的官方原页均明确使用鸡腿/鸡腿肉，且页面未将其声明为熟制或罐头。每条新增同一个既有政府安全来源 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov）并挂 `claim_scopes: ["safety"]`，端点统一为：

```json
{
  "code": "poultry_fully_cooked",
  "minimum_core_temperature_c": 74,
  "source_ids": ["S-SAFETY-TEMPERATURES-1"]
}
```

## 边界保留

- Panasonic SR-HL151 的长粒米水位、Panasonic Malaysia 的 WHITE RICE/CASSEROLE 双程序仍只限原机型。
- 大同牛油果鸡肉炊饭的鸡腿先用平底锅煎，再入电锅；端点不把它改写成“全程同锅”。
- 九阳 JRC-4TD01 的机内翻炒后焖饭流程和 528g 水量仍只限原说明书机型。
- Instant Pot 版本保留 Sauté、高压与泄压流程，不外推普通电饭煲；鸡肉端点仍须在成品确认。

## TDD 与检查

先新增失败测试 `tools/tests/source-backed-one-pot-batch-r147-safety.test.mjs`，锁定版本、总数、五条记录的禽肉端点、FoodSafety.gov 安全来源和机型/先煎/压力边界；再写入 JSON。

本批没有修改运行时代码、UI 或 Planner。目录 artifacts 需用 `node tools/build-source-backed-one-pot-catalog.mjs --write` 重建；完成后运行：

```bash
node --test tools/tests/source-backed-one-pot-batch-r147-safety.test.mjs
node tools/check-source-backed-one-pot-catalog.mjs
node tools/check-recipes.mjs
git diff --check
```
