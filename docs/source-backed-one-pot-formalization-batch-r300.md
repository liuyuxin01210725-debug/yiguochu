# r300：第七批 5 条来源固定批次正式化推进

本批推进以下 5 条来源合同：

| recipe_id | 名称 | 原器具/步骤边界 |
|---|---|---|
| `tatung-avocado-chicken-rice` | アボカド鶏肉炊き込みご飯 | 大同电锅流程与鸡肉预处理保留 |
| `tiger-steak-mushroom-barley-rice` | ステーキときのこの麦バターライス | Tiger 炊饭器/麦饭流程保留 |
| `toshiba-bibimbap-mixed-rice` | 石焼ビビンバ風炊込みご飯 | 东芝机型与混合饭程序保留 |
| `tatung-salmon-pumpkin-milk-risotto` | サーモンとかぼちゃのミルクリゾット | 大同电锅奶油/鱼类边界保留 |
| `tefal-chicken-rice-olives-one-pot-pan` | Chicken rice with olives | Tefal 锅具和分阶段流程保留 |

五条均为 `source_bounded_non_executable`。本批不改变正式 Planner 的 72 道基线；正式激活仍需要原器具厨房观察、旅程回归和可审计的可缩放规则。

验证：r300 专项 2/2，r294–r300 正式化测试通过，生成 artifacts、`check-recipes` 和 Planner 旅程门禁通过。
