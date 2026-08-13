# M1.4 `kitchen-observation.v1` 契约落地

日期：2026-08-13  
范围：只新增观察记录 schema、确定性校验器和测试夹具；不写入任何真实观察记录，不修改主 JSON、72 道正式 Planner 库、Worker 或 UI。

## 已落地

- `tools/data/kitchen-observation.schema.v1.json`：描述单次真实试做的结构化字段。
- `tools/lib/kitchen-observation.mjs`：提供 `validateKitchenObservation`、`isKitchenObservationReady` 和 `assertKitchenObservation`。
- `tools/tests/kitchen-observation.test.mjs`：以最小完整夹具验证通过路径，并覆盖缺称量、液体、器具/程序、时间、安全终点和证据时的阻断。

校验器强制保持 `source_amount`/`source_contract` 与 `observed_amount`/`observed_*` 分列，禁止把观察值回写成通用 `amount`。它还要求独立的安全终点、器具与程序身份、步骤和时间线、真实旅程引用以及非浏览器厨房证据。浏览器 smoke、Node 测试或编译结果只能作为旅程证据，不能单独构成厨房观察。

## 状态边界

观察记录的 `disposition` 不允许 `production_approved`，`approve_for_production` 也必须保持 `false`。真实观察完成后，仍需通过独立的 formalization、Coverage Matrix、旅程、安全和用户批准门禁；本批没有任何菜谱晋升或线上发布。

## 验证

```text
node --test tools/tests/kitchen-observation.test.mjs
9 passed, 0 failed

node --check tools/lib/kitchen-observation.mjs
git diff --check
```
