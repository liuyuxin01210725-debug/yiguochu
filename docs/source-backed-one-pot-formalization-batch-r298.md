# r298：第五批 5 条来源固定批次正式化推进

本批继续推进已有完整来源合同的条目：

| recipe_id | 名称 | 保留边界 |
|---|---|---|
| `zojirushi-okayama-ebimeshi-el-ns23` | えびめし | 仅象印 EL-NS23 来源程序 |
| `tatung-oyster-mountain-vegetable-rice` | 牡蠣と山菜の炊き込みご飯 | 牡蛎预处理与大同电锅流程保持原样 |
| `tatung-paella-style-seafood-rice` | パエリア風魚介の炊き込みご飯 | 仅大同电锅来源流程与海鲜边界 |
| `tatung-nasi-goreng-style-rice` | ナシゴレン風炊き込みご飯 | 仅大同电锅来源程序，不改写成炒饭 |
| `tiger-chicken-bamboo-rice` | 鶏肉たけのこごはん | 仅 Tiger 炊込み程序和鸡肉安全终点 |

五条现为 `source_bounded_non_executable`。它们可在完整来源执行资料库中查看固定批次做法，但尚未完成厨房观察、真实旅程、可缩放 Ratio DSL 和生产 Planner 闸门；正式 Planner 仍保持 72 道。

验证：r298 专项 2/2；正式证据、候选审查及 r294–r298 批次测试通过；生成 artifacts 与 `check-recipes` 门禁通过。
