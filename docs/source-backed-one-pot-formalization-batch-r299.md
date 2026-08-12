# r299：第六批 5 条来源固定批次正式化推进

本批把以下 5 条已有完整来源合同的卡片推进为 `source_bounded_non_executable`：

| recipe_id | 名称 | 边界 |
|---|---|---|
| `tiger-whitefish-mixed-rice` | 白身魚の炊込みごはん | Tiger 炊込み程序与白身鱼状态保留 |
| `tiger-duck-matsutake-rice` | 鴨ロースと松茸の炊込みごはん | Tiger 机型与鸭肉/松茸流程保留 |
| `panasonic-claypot-style-chicken-rice` | Claypot Style Chicken Rice | Panasonic 来源机型边界保留 |
| `hk-yam-longan-chicken-claypot-rice` | 淮山圓肉雞柳煲仔飯 | 香港煲仔饭分阶段流程，不外推电饭煲 |
| `hk-taro-shrimp-multigrain-steamed-rice` | 芋頭鮮蝦五穀蒸飯 | 蒸饭器具和虾状态边界保留 |

这 5 条可在来源执行资料库查看固定批次做法；正式 Planner 仍要求可审计的可缩放规则、原器具厨房观察和真实旅程，因此本批不改变 72 道正式基线。

验证：r299 专项 2/2，r294–r299 正式化测试通过，生成 artifacts、`check-recipes` 和 Planner 旅程门禁通过。
