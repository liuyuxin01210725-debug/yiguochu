# C21 Runtime / Research Boundaries

## Scope

本轮把部署产物分成两个明确范围：

- `runtime`：只提供首页、正式运行目录/逐步页、Planner 运行资产和 runtime one-pot catalog；不携带 923 条 source execution 页面、货架、formalization ledger 或厨房观察记录。
- `research` / `calibration`：额外提供 source catalog、923 条 execution/research 页面、研究 ledger、trial catalog 和审计矩阵，供核验与试做，不授予 Planner 或 production 权限。

Service Worker shell 由构建脚本按 scope 注入，并在安装测试中逐项确认文件存在；缺少任一 shell 文件会让 `cache.addAll` 失败，不再静默安装半壳。

## Runtime authority

当前构建元数据显式声明 `runtimeAuthorityMode=shadow`。旧 Planner 可继续用于预览，但响应带有 `runtime_authority.code=shadow_preview_only`，不等于 runtime catalog 授权。

未来切到 `catalog-enforced` 时，runtime catalog 不可用、为空或未达到 production approval 都会 fail-closed；不会回退到旧 Planner 或研究卡。

## Coverage evidence

`runtime-coverage-matrix.v1.json` 仍是 101 条场景登记表；新增 `runtime-coverage-results.v1.json` 单独记录实际执行结果。当前 `observed=0`、`passed=0`，shadow 与 catalog-enforced 两种 authority mode 分开，不把场景登记当成浏览器/Worker 已跑通。

## Kitchen / trial gates

厨房观察同时经过本地 JSON Schema 关键字校验和语义校验；时间戳要求带时区的严格 ISO-8601。试做候选必须拥有 source、execution、formal review 三类版本化引用及合同 SHA-256，缺 join 时 `trial_eligible=false`。

本轮没有新增 production 菜谱、没有写入真实厨房观察，也没有部署 production。
