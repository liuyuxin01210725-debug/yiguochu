# 一锅出项目完整技术总纲与 Codex 分阶段执行计划 v1.1

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` for bounded implementation tasks, or `superpowers:executing-plans` when executing a reviewed batch. Steps use checkbox syntax and must be updated only after the stated verification passes.

**Goal:** 把“一锅出”从 923 条来源研究资料与 72 道正式基础菜谱，推进成一个能让用户选定承诺、得到可信一锅主餐、照着做完并反馈的分层产品；研究资料、运行目录、正式 Planner 与厨房观察必须可追溯且不可互相冒充。

**Architecture:** 以来源卡为研究层，以统一 Runtime Catalog 为唯一运行消费层，以 72 道生产基础库为现有稳定基线；新增字段、正式化候选、Preview 和生产激活全部通过确定性构建与门禁。四条用户路径（给我一道、按我的食材做一锅、今天吃什么、清库存）必须区分承诺，不能让一个覆盖率算法替代不同产品意图。

**Tech Stack:** Node.js ESM、JSON catalogs、Cloudflare Pages Functions、静态 PWA、Node test runner、现有 deterministic planner/compiler、台湾食药署营养库。

## Global Constraints

- 研究卡不因有步骤就自动变成正式菜谱；状态必须经过 `discovered → identity_verified → recipe_fact_checked → executable → preview_ready → kitchen_observed → production_approved`。
- 来源事实、研究估算、厨房观察必须逐字段分开；无法从来源确认的量、液体、时间、安全、器具边界保留缺口，不猜填。
- 普通锅、砂锅、蒸笼、烤箱、压力锅、熟饭二次烹不能伪装成普通电饭煲合同。
- 禽肉、猪肉、牛羊肉、鱼贝、蛋和豆类必须挂匹配的权威安全终点；状态不明保持阻断。
- 营养数字只能来自权威库；查不到就标估算，不把 AI 数字当权威值。
- 真实厨房观察、真实旅程、过敏与替换回归不可伪造；测试通过不等于厨房通过。
- 每个批次按 TDD：先失败测试，再最小实现，再跑专项、目录门禁、Planner 旅程和全量测试。
- Phase A 只能部署 `recipe-validation` Preview，不得部署 production `main`。
- `index.html` 与 `worker/src/worker.js` 是共享真源，不能由并行 agent 同时编辑；研究与审计可以并行，代码整合必须串行。

## Phase 0：真实基线、产品合同与研究/运行边界

### M0.1 数据基线审计

- [x] 统计来源卡、执行库、formalization ledger、Preview manifest、72 道 Planner 基础库的真实数量与状态。
- [x] 列出权威数据真源、生成物、镜像和当前重复解释点。
- [x] 交付 `docs/superpowers/audits/2026-08-13-m0-data-baseline.md`，并锁定后续 Runtime Catalog 验收数字。

### M0.2 产品路径合同审计

- [x] 对首页、来源资料库、详情页、Cook Mode 和 Worker 请求逐路径走真实旅程。
- [x] 明确“必须使用”“尽量使用”“直接推荐”“清库存”的输入、拒绝和结果合同。
- [x] 交付 `docs/superpowers/audits/2026-08-13-m0-product-contract.md`。

### M0.3 发布与真实旅程基线

- [x] 记录构建、health、Preview manifest、部署分支、GitHub PR 和当前回归套件。
- [x] 交付 `docs/superpowers/audits/2026-08-13-m0-release-baseline.md`。

### Phase 0 Gate

- [x] 三份 M0 审计已读、数字相互一致。
- [x] 923 研究层、统一执行卡、72 Planner 基线的边界在 UI、Worker、测试和文档中一致。
- [x] 未通过前不增加新的公开 Planner 菜谱，不把研究卡批量改为正式状态。

## Phase 1：Runtime Catalog、Coverage Matrix、正式化与厨房门

### M1.1 Runtime Catalog 合同

- [x] 从权威来源确定性构建统一 Runtime Catalog；前端与 Worker 只消费该目录。
- [ ] 每条记录包含 recipe identity、source claims、ingredient quantities、liquid contract、steps、time、equipment、safety、nutrition、substitutions、kitchen status 和 journey evidence。
- [ ] 生成 `runtime-catalog`、`coverage-matrix`、`formalization-ledger`，并为每个字段保留来源或缺口 provenance。

### M1.2 Coverage Matrix

- [x] 以历史失败组合和用户路径为轴，定位真正缺口，不以菜谱总数为成功指标。
- [x] 每个缺口必须有来源、优先级、预计验证动作和拒绝原因。

### M1.3 Formalization batches

- [ ] P0：同一机型、同一来源、合同完整候选。
- [ ] P1：只缺一个可回到原文闭合的字段。
- [ ] P2：需要公共安全、营养或器具证据。
- [ ] P3：身份、器具、安全或来源阻断，只能补证不激活。
- [ ] 单批 5–10 条；每批独立 TDD、审计文档和门禁。

### M1.4 Kitchen Gate

- [ ] 记录称量、液体、水位、机型/程序、起止时间、质地、味道、安全终点。
- [ ] 记录真实 Planner 旅程、过敏、禁忌、替换和失败回归。
- [ ] 只有厨房观察与所有门禁通过才允许 `production_approved`。

## Phase 2：输入、数量、器具、安全、营养与 Cook Mode

- [ ] 输入解析统一 raw input、canonical identity、alias、confidence、ambiguity 和 unresolved。
- [ ] 区分 `available_amount` 与 `planned_amount`；固定批量、可缩放批量、份数、液体和容量联动。
- [ ] 把真实器具、容量、程序、水位线和预处理步骤纳入执行合同。
- [ ] Cook Mode 支持单步聚焦、备料/锅内分离、克数、计时、勾选、本地恢复、离线恢复、安全终点和反馈。
- [ ] 前端与 Worker 继续拆模块，但共享合同先测试后迁移，不复制第二套 Planner。

## Phase 3：Planner V3

- [ ] 独立 `/v3/plan-one-pot` Preview 路径，复用主计划的 taxonomy、units、Runtime Catalog、Execution 和 Safety 模块。
- [ ] 实现 100% `must_include`、Request Ledger、候选检索、数量/液体/步骤/安全编译、Reconciliation Gate 和 30 条场景门。
- [ ] 禁止静默丢食材；无法满足承诺时返回结构化拒绝或让用户选择。
- [ ] V3 不得替换现有生产 Planner，直到 Preview、浏览器和人工评审门通过。

## Phase 4：可取舍推荐、Hybrid 与换一换

- [ ] “给我一道”只从 Runtime Recipe 选。
- [ ] “按我的食材做一锅”必须 100% 必用，否则明确拒绝或让用户选择。
- [ ] “今天吃什么”允许取舍，但显示没用的食材和理由。
- [ ] “清库存”需要数量和连续库存状态，单独实施，不混入一次推荐。
- [ ] “换一道”必须得到不同 recipe/template/合法槽位；无替代返回 `no_alternative_plan`，且当前 Plan ID 硬排除。

## Phase 5：浏览器门、厨房 Pilot 与发布

- [ ] 至少覆盖首页、路径选择、候选、详情、Cook Mode、完成、反馈、离线恢复和错误路径。
- [ ] 5 人厨房 Pilot 记录完成率、缺料、器具不匹配、安全/口感问题和次日复用。
- [ ] Preview 只部署 `recipe-validation`；production 发布另行获得明确批准。

## Final 923 Audit

- [ ] 生成逐条 ledger，状态只能是 `formal_active`、`preview_only`、`research_only` 或 `blocked`。
- [ ] 审计来源、身份、数量、液体、步骤、时间、taxonomy、ratio、营养、安全、器具、厨房和旅程证据。
- [ ] 只有 ledger、Runtime Catalog、UI、Worker 和全量测试一致时才可报告完成；否则继续保持未完成。
