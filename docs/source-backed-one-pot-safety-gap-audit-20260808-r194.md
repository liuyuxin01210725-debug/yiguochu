# r194 安全缺口审计（MAFF 蝾螺／鸡肉饭）

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260808-global-r193` / 923 条

本轮只复核已有 `recipe_fact_checked` 条目。两条来源均为已打开的 MAFF 原页，原文直接给出食材处理和饭的后续流程；只挂现有 `S-SAFETY-TEMPERATURES-1`，不新增安全规则、不改变器具或阶段合同。

| recipe_id | 原页事实 | endpoint | 保留边界 |
| --- | --- | --- | --- |
| `maff-shimane-sazae-meshi` | [農林水産省「さざえ飯 島根県」](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/sazaemeshi_shimane.html)：蝾螺连壳洗净后加水煮，取肉切碎并保留煮汁，再与米和根菜炊煮。 | `shellfish_fully_cooked`：肉质呈珍珠白或白色且不透明 | 只挂贝类视觉终点；保留先煮取汁和锅煮流程，不改成普通电饭煲合同。 |
| `maff-nagasaki-torimeshi` | [農林水産省「鶏飯 長崎県」](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/46_13_nagasaki.html)：鸡肉切小块，先炒熟，再加酒和酱油焖煮至完全熟透，最后连汁拌入米饭。 | `poultry_fully_cooked`：74°C | 只挂禽肉终点；保留米饭与鸡肉分段制作后拌合，不外推全程同锅。 |

本轮不处理生章鱼、海胆或混合海鲜条目：项目现有安全表没有对头足类／海胆的独立无损映射，不能用相邻名称代替。两条均保持 `recipe_fact_checked`、非 `executable`。
