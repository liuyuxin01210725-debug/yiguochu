# r301：第八批 5 条来源固定批次正式化推进

本批推进 5 条 Tefal/Tiger 来源合同：

| recipe_id | 名称 | 原器具/流程边界 |
|---|---|---|
| `tiger-chicken-paella` | チキンのパエリア | Tiger 炊込み与鸡肉安全边界 |
| `tefal-homechef-paella` | Paella | Tefal Home Chef 锅具与海鲜/米饭流程 |
| `tefal-pilaf-with-lamb-r200302` | Pilaf with lamb | Tefal Cook4me/原锅流程，不跨机型 |
| `tefal-paella-r106320` | Paella（Tefal锅内温控版） | 锅内温控、液体和程序均保留 |
| `tefal-italian-sundried-tomato-chicken-rice-r942720` | One-pot Italian sundried tomato chicken and rice | 普通锅/分阶段原方，不改为电饭煲 |

五条均为 `source_bounded_non_executable`，可查看固定批次来源执行卡，但尚无厨房观察、旅程回归和可缩放 Planner 规则。正式 Planner 仍维持 72 道。

验证：r301 专项 2/2；r294–r301 正式化测试通过，生成 artifacts、`check-recipes` 和 Planner 旅程门禁通过。
