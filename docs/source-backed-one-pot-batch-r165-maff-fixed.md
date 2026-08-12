# r165 MAFF 固定批次小批（既有条目）

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260808-global-r164` / 923 条

本批只回填日本农林水产省原页明确的固定人份与定量材料。范围、家庭变量和蒸笼/锅煮边界不被压成单值合同。

## 已回填（2 条）

| recipe_id | 直接来源事实 | 回填 | 保留边界 |
| --- | --- | --- | --- |
| `maff-mie-chagayu` | [三重茶粥原页](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/chagayu_mie.html) 明确 4 人份、米140g、水8杯、焙茶1大匙；强火加热为15–20分钟范围 | `fixed_batch.servings=4`；米/水/焙茶；`added_water=8杯` | 盐为“少许”不单值化；15–20分钟是范围，`time_contract` 保持 `null`；传统锅煮，不外推电饭煲 |
| `maff-aichi-kiinai-okowa` | [爱知黄いないおこわ原页](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/kiinaiokowa_aichi.html) 明确 4 人份、糯米3合、黑豆70g、栀子1个、盐1小匙；栀子染液先用500mL水，炊饭器加至米刚好没过 | `fixed_batch.servings=4`；上述定量材料与500mL栀子浸出水作为材料事实 | 500mL只是染液起始水，不是总液体合同；“米刚好没过”仍是变量，蒸笼变体保留；不写 `liquid_contract` |

## 明确未回填

北海道墨鱼塞饭的鱿鱼数量为4–8杯，静冈染饭为5人份但液体由栀子/煎茶等多阶段浸出液构成；这些范围或多阶段事实继续保持原字段，不拼成固定批次。

## 验证

- RED：`tools/tests/source-backed-one-pot-batch-r165-maff-fixed.test.mjs` 在 r164 基线下因版本/固定批次缺失失败。
- GREEN：同一专项 2/2 通过。
- 未修改 runtime、UI、Planner 或部署配置；目录总数保持 923。
