# r193 安全缺口审计（MAFF 鱼饭）

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260808-global-r192` / 923 条
范围：只复核已有 `recipe_fact_checked` 条目；不新增 canonical、不改变器具或程序合同。

本轮只选择目录中已经由 MAFF 原页直接写出鱼类处理和炊饭流程的两条。两条都保留原页“先烤鱼、再与米炊煮”的阶段边界，并复用既有 `S-SAFETY-TEMPERATURES-1` 的鱼类 63°C 终点。没有把炊饭程序或焖制分钟数当成温度证据。

| recipe_id | 直接来源事实 | 可闭合 endpoint | 保留边界 |
| --- | --- | --- | --- |
| `maff-tokushima-tai-meshi` | [農林水産省「鯛めし 徳島県」](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/44_23_tokushima.html)；正文定位记录鳞鲷约500g、米450g、昆布出汁650mL，鲷清理、撒盐并烤至上色后置于米上炊煮。 | `seafood_fully_cooked`，鱼类 63°C | 只补鱼类安全终点；保留先烤后炊、去骨拌回和传统锅/电饭煲来源边界，时间继续 `null`。 |
| `maff-tochigi-ayu-meshi` | [農林水産省「鮎めし 栃木県」](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/31_22_tochigi.html)；正文定位记录米3杯、香鱼4尾，香鱼去内脏后先烤，再与调味米放入电饭煲炊煮并去骨拌回。 | `seafood_fully_cooked`，鱼类 63°C | 只补鱼类安全终点；保留香鱼先烤、来源电饭煲和出锅拆骨流程，时间继续 `null`。 |

## 保持阻塞

- `maff-aichi-tako-meshi` 虽写“生章鱼”，但项目现有安全表没有单独的头足类终点；本轮不把鱼类 63°C 或贝类视觉终点强行套用。
- `maff-shimane-sazae-meshi`、`maff-ibaraki-hamaguri-gohan` 涉及贝类的分段预处理和回锅，需单独复核贝类状态/视觉终点后再批量回填。
- 所有条目仍为 `recipe_fact_checked`，不晋升 `executable`，不外推为普通电饭煲通用配方。

`git diff --check` 应作为落盘门禁；本审计不改运行时代码、UI 或部署。
