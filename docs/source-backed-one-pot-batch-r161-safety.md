# r161 安全小批（既有条目安全终点闭合）

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260808-global-r160` / 923 条

本批只闭合已有 `recipe_fact_checked` 条目的安全终点，不新增 canonical、不晋升 `executable`，不改器具、液体、时间或原始流程边界。

## 已回填（5 条）

| recipe_id | 直接来源事实 | 回填 endpoint | 保留边界 |
| --- | --- | --- | --- |
| `instant-pot-quick-chicken-steamed-rice` | Instant Pot 原页写鸡胸 Sauté 约 7 分钟，并要求内部至少 165°F；随后 Pressure Cook 3 分钟、自然泄压 10 分钟 | `poultry_fully_cooked`；74°C | 保留 Instant Pot 压力锅流程和原页 165°F 事实，不推广为普通电饭煲 |
| `instant-pot-spanish-chicken-rice` | Instant Pot 原页写鸡腿先煎至上色，再与米、鸡汤和香肠 High Pressure 7 分钟 | `poultry_fully_cooked`；74°C | 只覆盖鸡腿；kielbasa 的安全/钠合同不扩写 |
| `maff-hiroshima-tai-meshi` | 日本农林水产省原页写整鲷处理后放在米和根菜上同锅炊煮，炊好去骨拌回 | `seafood_fully_cooked`；63°C | 保留整鱼同锅、去骨回拌和 MAFF 地域料理边界 |
| `maff-yamanashi-sanma-meshi` | 日本农林水产省原页写秋刀鱼处理后与米、水、酒和酱油同锅炊煮，完成后去骨拌回 | `seafood_fully_cooked`；63°C | 保留鱼类先处理、同锅炊煮和去骨流程 |
| `tatung-salmon-pumpkin-milk-risotto` | 大同官方页写刺身三文鱼约 160g 与米、牛奶、南瓜泥等同锅，完成后焖 5 分钟 | `seafood_fully_cooked`；63°C | 保留南瓜泥预处理、大同电锅和同锅阶段，不外推普通电饭煲 |

五条均新增现有 `S-SAFETY-TEMPERATURES-1` 安全来源，scope 仅为 `safety`；原始来源、物种状态和器具边界不被替换或拼接。

## 明确不整合

- `r60-tiger-szechuan-pork-tacook-rice`：官方 Directions 与 Basic Congee 文本冲突。
- `panasonic-tokyo-seafood-pilaf`：seafood mix 的物种和生熟状态未展开。
- 罐装鱼/罐装贝类条目：不因食材名称自动添加生鲜海鲜终点。

## 验证

- 专项测试：`tools/tests/source-backed-one-pot-batch-r161-safety.test.mjs`
- 目录版本：`source-backed-one-pot-v1-20260808-global-r161`，总数 923
- 5 条均为 `recipe_fact_checked`，无新 canonical、无 executable 晋升
- 未修改 runtime、UI、Planner 或部署配置
