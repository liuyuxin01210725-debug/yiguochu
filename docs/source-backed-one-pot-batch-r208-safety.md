# r208 安全合同回填：两条生牛肉米饭

基线为 `source-backed-one-pot-v1-20260808-global-r207`，目录仍为 923 条。本批不新增 canonical，也不改固定批量、液体、总时长或器具适配；仅为原始页面明确写出生牛肉的两条既有 `recipe_fact_checked` 记录补挂牛肉安全终点。

| recipe_id | 原始来源事实 | 回填合同 | 保留边界 |
| --- | --- | --- | --- |
| `panasonic-taiwan-gyudon-onion-takikomi-rice` | Panasonic 台湾官方授权页给出约 2 人份、SR-PAA100 银シャリ水位线 1，并明确最后把生牛五花肉片铺在米面上同锅炊煮。 | `beef_fully_cooked`，71°C；来源为 FoodSafety.gov `S-SAFETY-TEMPERATURES-1` 的项目保守混合米饭牛肉终点。 | 保留 SR-PAA100 型号、水位线和生牛肉后铺边界；总时长仍为 `null`，不外推普通电饭煲毫升比例。 |
| `maff-beef-mushroom-yolk-rice` | MAFF 原页给出 2 人份、薄切牛肉 150g；米饭完成后铺生薄牛肉和蛋黄，关盖余温焖约 10 分钟。 | `beef_fully_cooked`，71°C；来源为 FoodSafety.gov `S-SAFETY-TEMPERATURES-1`。 | 保留牛肉后投、余温焖、米水按电饭锅刻度的来源边界；不把水位刻度改成毫升，也不删除蛋黄后置步骤。 |

## 验证

- r208 专项测试：2/2 通过。
- 本批仍是来源合同回填，不等同厨房实测、人工批准或生产上线。
