# 川渝孔干饭与洋芋饭研究层实施计划

> 本轮只补全国地域框架中的川渝研究证据层，不增加生产菜谱，不修改 Planner、前端、Worker、代理、template、taxonomy 或 Ratio DSL，不部署。

## 目标

- 锁定现有基线：72 道生产菜谱、24 条地域研究候选；川渝当前为 0 道生产映射、4 条研究候选。
- 区分四川孔／箜干饭的“半熟米沥水后与菜料焖熟”技法、重庆柴火洋芋饭的“洋芋＋大米＋柴火锅”结构，以及酉州社饭等独立家族。
- 不把豌豆、四季豆、洋芋、玉米粉、腊肉等可选或并列变体写成固定共现配方。
- 记录家庭锅具适配、米状态、土豆、四季豆与腊味的安全边界；来源不足时明确 `not_proven`。

## TDD 顺序

1. 数据测试锁定 0/4 基线、两省节点、米状态和配料变体边界。
2. 报告测试锁定来源反向证明、研究线索与 12 条待人工旅程。
3. 产物测试锁定确定性生成、聚合门禁和 `dist` 隔离。
4. 观察测试因缺少模块和资产失败。
5. 实现数据、validator、builder、renderer、CLI，并接入 `tools/check-recipes.mjs`。
6. 生成研究 JSON、说明文档和人工旅程评审表。
7. 跑全量测试、菜谱门禁、Planner 旅程、Python 语法和双构建一致性。

## 证据边界

- 地方政府或权威媒体页面可证明名称、地域出现和高层技法；不能自动证明项目克数、液体比例、时长或电饭煲等价。
- “豌豆、四季豆、洋芋等”是并列可选菜料，不证明豆类＋土豆必须同时出现。
- “玉米粉代替蔬菜”不证明玉米粒＋土豆是固定传统组合。
- 黔江资料中的腊肉、腊肠、蔬菜属于可选点缀，不证明四川腊肉洋芋饭候选已获精确配方证据。
- 腊味必须按非即食风险处理并彻底熟制；发芽或大面积变绿土豆不得使用；四季豆必须彻底煮熟煮透。

## 交付物

- `tools/data/sichuan-chongqing-rice-research.v1.json`
- `tools/lib/sichuan-chongqing-rice-research-{validator,builder,renderer}.mjs`
- `tools/build-sichuan-chongqing-rice-research.mjs`
- 三个行为测试文件
- `tools/generated/sichuan-chongqing-rice-research.v1.json`
- `docs/sichuan-chongqing-rice-research.md`
- `docs/sichuan-chongqing-rice-journey-review.md`
