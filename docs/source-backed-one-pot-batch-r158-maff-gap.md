# r158 MAFF 同源字段回填批次

> 批次日期：2026-08-08
> 目录版本：`source-backed-one-pot-v1-20260808-global-r157` → `source-backed-one-pot-v1-20260808-global-r158`
> 目录数量：923 → 923（不新增 canonical）

## 批次范围

本批只回填已存在的四条日本农林水产省（MAFF）来源菜条目。所有字段均来自同一条已经打开的官方原页；没有跨地域、跨菜名或跨器具拼接，也没有把阶段时长改写成整道菜的总时长。四条均保持 `recipe_fact_checked`，没有晋升 `executable`，没有修改运行时代码、UI、Planner 或部署包。

## 回填清单

| recipe_id | 本批回填 | 保留的缺口与边界 | 官方来源 |
| --- | --- | --- | --- |
| `maff-kanagawa-narachameshi` | `fixed_batch.servings=4`；米 3 合、煎茶或焙茶 500mL、炒大豆 30g、栗 100g、盐 1 小匙；`liquid_contract=500mL` | 浸米约 30 分钟不是总时长，`time_contract=null`；来源是炊饭器事实，适配仍为 `source_limited` | [奈良茶飯（神奈川县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/35_20_kanagawa.html) |
| `maff-shimane-kujira-gohan` | `fixed_batch.servings=4`；米 2 合、白鲸 100g、根菜/魔芋各 50g及调味料；按原文写入米水 1:1 的 Ratio DSL 液体合同 | 鲸皮先焯水去脂仍是流程边界，`time_contract=null`；原器具未转换，`cooker_adaptation=not_adapted` | [くじらご飯（岛根县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/kujiragohan_shimane.html) |
| `maff-fukui-chameshi` | `fixed_batch.servings=20`；糯米 6 合、粳米 4 合、大豆 90g、酒 3/4 杯、酱油 1/2 杯及豆入り番茶；保留原目录已有 1500mL 液体合同 | 大豆浸茶约 1 小时不是总时长，`time_contract=null`；大批量 1500mL 不缩放，适配仍为 `source_limited` | [茶飯（福井县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/chameshi_fukui.html) |
| `maff-ehime-shoyu-meshi` | `fixed_batch.servings=4`；补入官方原页列明的米、鸡肉、胡萝卜、干香菇、牛蒡、魔芋、鸡蛋、干油豆腐及调味料固定量 | 原页只写“加水”而未给水量，`liquid_contract=null`；淘米后静置约 30 分钟不是总时长，`time_contract=null`；适配仍为 `not_adapted` | [しょうゆめし（爱媛县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/shouyu_meshi_ehime.html) |

## 证据与 scope 变更

- `maff-shimane-kujira-gohan` 的同一 MAFF 来源新增 `quantity`、`liquid` scope，支持 4 人份、固定食材量和“米与同量的水”。
- `maff-fukui-chameshi` 的同一 MAFF 来源新增 `quantity` scope，支持 20 人份及固定米/豆/调味料量；原有 1500mL 液体合同保持不变。
- `maff-ehime-shoyu-meshi` 的同一 MAFF 来源新增 `quantity` scope，支持 4 人份及固定食材量；不把“加水”扩写成定量液体合同。
- `maff-kanagawa-narachameshi` 原已有 `quantity`、`liquid` scope，本批只将原页已明确的固定批量和 500mL 茶液写入合同。

## 验证

- TDD：`tools/tests/source-backed-one-pot-batch-r158-maff-gap.test.mjs`（4 条字段回填与四条非 executable/器具边界断言）。
- 目录构建器以 `--write` 重建所有 source-backed artifacts；随后运行 catalog validator、`check-recipes.mjs`、r158 专项测试和 source-backed 全量测试。
- 本批没有将任何条目升级为 `executable`，也没有生成电饭煲转换参数；缺失字段继续保持 `null`。
