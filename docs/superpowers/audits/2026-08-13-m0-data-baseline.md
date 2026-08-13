# M0 数据与菜谱运行边界基线审计

日期：2026-08-13  
审计范围：`source-backed` 来源目录、执行卡、正式 Planner、菜饭运行目录、构建/Worker/UI 消费关系。  
审计原则：只读盘点，不把研究记录、估算卡或预览候选改称生产菜谱。

## 1. 结论

当前系统不是“923 道正式运行菜谱”，而是分层资产：

```text
923 条来源目录记录
 ├─ 138 条 source_complete（只具备来源执行卡候选资格）
 │   └─ 34 条通过预览选择门，仍需厨房观察
 └─ 785 条 research_only

正式 Planner 基础库：72 条（12 approved + 60 auto_approved）
菜饭专用运行目录：37 个 variant（8 preview_ready、26 calibration_preview、3 planned）
```

`923/923 execution complete` 的含义是每条都能生成“用量、液体、步骤、时长”研究卡，不代表 923 条都拥有原文合同、器具适配、安全证据或生产批准。

## 2. 923 条来源卡的真实分层

权威机器目录：`tools/data/source-backed-one-pot-recipes.v1.json`，版本 `source-backed-one-pot-v1-20260812-global-r297`，共 923 条。当前来源状态为：

| 来源状态 | 数量 | 含义 |
| --- | ---: | --- |
| `executable` | 36 | 来源目录层已闭合到可执行事实合同的条目；仍不是正式 Planner 或生产批准 |
| `recipe_fact_checked` | 788 | 身份/核心事实已核验，但至少一个可执行合同或边界仍缺 |
| `identity_verified` | 93 | 身份有据，做法事实不足 |
| `discovered` | 6 | 候选发现记录，尚未完成身份/事实核验 |

来源执行镜像：`tools/data/source-backed-execution-library.v1.json`，共 923 条：

| 执行卡状态 | 数量 | 运行范围 |
| --- | ---: | --- |
| `source_complete` | 138 | `source_bounded_preview`；不可跨器具或越过来源边界 |
| `source_partial_with_draft` | 738 | `research_only`；来源片段加明确标注的研究补全 |
| `draft_estimated` | 36 | `research_only`；含估算字段 |
| `identity_only_draft` | 11 | `research_only`；主要保留身份/少量线索 |
| 合计 | **923** | source-bounded preview 138，research-only 785 |

正式化账本：`tools/data/source-backed-formalization-ledger.v1.json`：

- `preview_candidate` 34，`blocked` 889；
- 923/923 研究卡字段结构完整；922/923 无安全阻断，1 条河豚卡为禁止家庭执行的安全阻断；
- 队列优先级：P0 source contract 138、P1 complete research card 738、P2 estimated draft 35、P3 identity/incomplete 11、blocked safety 1。

预览清单：`tools/data/source-backed-one-pot-preview.v1.json`：

- 923 总记录；合同字段齐全 65；目录 validator clean 39；最终选择 `preview_ready` 34；阻断 889。
- source_complete 的 138 条不能直接等同 138 条预览：其中 104 条仍有 cooker boundary、missing safety、nutrition、excluded boundary 或其他门禁问题。

正式候选审查与 staging：

- `tools/data/source-backed-formal-candidate-review.v1.json`：923 行，taxonomy closed 222 / missing 701；ratio DSL closed **0** / source-bounded 132 / unmapped 791；nutrition closed 406 / partial-or-missing 517；safety closed 317 / missing 220 / not-applicable 386；厨房观察 0/923；旅程覆盖 0/923；formal-ready **0**。
- `tools/data/source-backed-formal-staging.v1.json`：923 queued，source-complete 138，research-only 785，formal-ready 0，kitchen pending 923，journey pending 923。

## 3. 正式运行层与其它目录

### 3.1 Legacy/Planner 正式基础库

`tools/data/recipe-library.json` 是当前 Legacy Planner 的正式基础菜谱事实源：21 个 family、72 个 recipe，其中 12 条 `approved`（人工批准）和 60 条 `auto_approved`（自动闸门通过、待人工评审）。这 72 条不是 923 条来源目录的子集声明，也不是 923 条的自动晋升结果。

`tools/data/recipe-runtime.v1.json` 只有 6 个 `planned` runtime identity 条目，`preview_enabled` 为 0；它是旧/过渡 runtime 资产，不能拿 6 条代表 72 条，也不能拿它替代 source-backed 923 条。

### 3.2 菜饭产品运行层

`tools/data/rice-meal-catalog.v1.json` 是菜饭专用 selector/compiler 的运行目录：3 个 family、37 个 variants：

- `preview_ready` 8；
- `calibration_preview` 26；
- `planned` 3。

`tools/data/rice-meal-collection.v1.json` 是研究/收集总目录：68 个 candidates（8 runtime_ready、26 calibration_ready、4 planned、25 research_candidate、5 identity_only），另有 12 个 exclusions 和 16 个显式地域空白。它负责覆盖、候选与边界审阅，不是单独的用户运行配方源。

菜饭运行目录当前的 8 个 `preview_ready` 是独立于 source-backed 923 的运行变体；只有少量 recipe/collection ID 交集，不应按名称集合做全量合并。

## 4. 当前权威真源与重复镜像

| 层 | 权威入口 | 生成/消费镜像 | 备注 |
| --- | --- | --- | --- |
| 923 来源身份与合同 | `tools/data/source-backed-one-pot-recipes.v1.json` | `docs/source-backed-one-pot-recipes.md/.csv`、`docs/source-backed-one-pot-recipe-gaps.md` | 文档/CSV 是确定性派生物，不能反向编辑事实 |
| 923 研究执行卡 | 由来源目录 + `tools/lib/source-backed-shelf.mjs` 确定性构建 | `source-backed-execution-library.v1.json`、`source-backed-one-pot-shelf.v1.json` | 执行卡含 source/source_hint/estimated provenance |
| 来源预览/正式化 | 来源目录派生 | preview manifest、formalization ledger、formal candidate review、formal ratio evidence、formal staging | 全部是门禁/队列镜像，不是新菜谱真源 |
| 72 Legacy Planner | `tools/data/recipe-library.json` | Worker Planner assets、`dist/recipe-library.json`、`_worker.js` 嵌入副本 | 12 approved + 60 auto_approved |
| 菜饭运行选择 | `tools/data/rice-meal-catalog.v1.json` + taxonomy/ratio/action/safety | Worker `selectRiceMealCandidates`、`dist` 静态资产、`_worker.js` 编译嵌入 | 37 variants，当前 8 preview_ready |
| 菜饭研究总目录 | `tools/data/rice-meal-collection.v1.json` | collection renderer/docs、Worker 编译嵌入（用于资产一致性） | 68 candidates；不等于运行目录 |
| UI 展示与试做 | 上述生成资产 | `source-recipes.html` 读 shelf/preview/formalization/review/staging；`recipes.html` 读 recipe-library 后 fallback execution；`cook.html` 读 execution library | 页面不能自行生成/猜测菜谱事实 |

构建入口 `tools/build-dist.mjs` 将多个真源复制到 `dist/`，并把 Planner/菜饭资产嵌入 `_worker.js`。因此 `dist/`、`worker/.wrangler/` 和线上构建是部署镜像，不是编辑入口；任何切换真源都必须同步 bump 版本并重建所有派生物。

## 5. Runtime Catalog 与 Coverage Matrix 最小 schema

### 5.1 Runtime Catalog（单一运行消费面）

建议建立一个明确的、确定性生成的运行目录（可先作为新 schema，不立即替换现有资产）：

```json
{
  "schema_version": 1,
  "catalog_version": "runtime-catalog-v1-YYYYMMDD-rN",
  "source_versions": {
    "source_catalog": "...",
    "formal_recipe_library": "...",
    "rice_meal_catalog": "...",
    "taxonomy": "...",
    "ratio_rules": "..."
  },
  "entries": [{
    "runtime_id": "stable-id",
    "canonical_name": "真实菜名或明确家庭适配名",
    "family_id": "...",
    "status": "research|preview|kitchen_observed|production_approved",
    "identity": { "source_refs": [], "aliases": [] },
    "ingredients": [{
      "canonical_id": "taxonomy-id", "label": "...", "state_or_cut": "...",
      "role": "carb|protein|vegetable|legume|seasoning",
      "required": true, "amount_contract": { "value": 0, "unit": "g", "provenance": "source|adapted|estimated" }
    }],
    "substitution_slots": [],
    "servings_contract": { "min": 1, "max": 4, "default": 2, "ratio_rule_id": "..." },
    "liquid_contract": { "kind": "added_water|waterline|source_liquid", "provenance": "..." },
    "appliance_contract": { "vessel": "...", "program": "...", "boundary": "..." },
    "execution": { "action_profile_id": "...", "steps": [], "time_contract": {} },
    "safety_endpoints": [],
    "allergen_labels": [],
    "nutrition": { "grade": "A|B|C", "roles": [] },
    "source_refs": [],
    "kitchen_observation": { "status": "pending|observed", "evidence_ids": [] }
  }]
}
```

硬要求是：每个 ingredient、liquid、step、time、safety 字段都带 provenance；`estimated` 只能停在 research/preview，不能伪装成 source fact；`required=true` 的食材必须有可计算数量和覆盖测试；适配版必须显式标识，不得复用传统原方名称而隐藏改动。

### 5.2 Coverage Matrix（覆盖矩阵）

矩阵的最小一行应能重放一个用户承诺，而不是只记录“命中过某道菜”：

```json
{
  "coverage_id": "journey-id",
  "catalog_version": "...",
  "runtime_id": "...",
  "scenario": { "servings": 2, "pantry": [], "dislikes": [], "allergies": [], "appliance": "..." },
  "contract": { "must_include": [], "prefer_use": [], "forbidden": [] },
  "observed": { "used": [], "unused": [], "coverage_count": 0, "coverage_ratio": 0 },
  "expect": { "status": "selected|no_reliable_plan|no_alternative_plan", "allowed_runtime_ids": [], "forbidden_runtime_ids": [] },
  "evidence": { "journey_file": "...", "test_name": "...", "run_at": "..." }
}
```

矩阵必须同时覆盖：0/1/2/3/4–6 项食材、must-include 100% 覆盖、偏好可舍弃、过敏/忌口、器具/份数、无替代方案、换一换不得复用当前 Plan ID、以及“未使用食材”诚实展示。大米/调味料是否计入覆盖必须固定写入矩阵规则。

## 6. M0 之后的验收门

1. **来源与身份门**：每个 runtime entry 有独立 HTTPS 来源、菜名/地域身份与 claim scope；来源等级、定位、PDF 归档可复核；RecipeDB/项目自身页面不得充当生产来源。
2. **事实合同门**：固定批量、核心食材、液体语义、顺序、时间、器具边界、安全终点、过敏标签全部结构化；来源事实与项目适配/估算分栏。
3. **Taxonomy/营养门**：所有核心食材 canonical_id 精确解析；状态/切型不丢失；营养值来自权威库；默认用户候选只允许符合产品约定的 A/B 结构，不能为了升档自动添加食材。
4. **Ratio/编译门**：每个可运行条目有 recipe-scoped Ratio DSL、份数上下界、米水/液体规则和可重算编译结果；不能由 LLM 或自然语言猜克数，也不能跨器具换算水位线。
5. **执行/安全门**：动作 profile、步骤与食材一一对应；禽/猪/牛羊/海鲜/蛋/豆类等高风险终点闭合；多锅、预处理和生熟边界必须显式。
6. **Coverage/旅程门**：Coverage Matrix 全量可重放；must_include 达到 100% 或明确返回拒绝/用户选择；过敏泄漏、未使用却宣称使用、无替代却凑卡均为 fail。
7. **状态与厨房门**：`preview` 不是 `production_approved`；晋升前必须有真实厨房观察（称量、液体/水位线、锅具程序、耗时、质地/安全终点）和真实旅程回归。当前 923 条仍为 kitchen pending，故正式晋升数应为 0。
8. **镜像/发布门**：单一真源确定性生成 docs、manifests、dist 和 Worker embedded assets；版本/hash 一致、无重复 runtime_id、无 stale artifact；必须通过 `node tools/check-recipes.mjs`、菜饭旅程门和目标 Node 测试后才可进入 preview。Phase A 仍只允许 `recipe-validation`，不得直接 production。

## 7. 主要风险

- **数字语义风险**：把“923/923 字段完整”展示成“923 道可上线”会误导用户；UI 与 health 必须同时显示 source-complete、preview-ready、kitchen-observed、production-approved。
- **多真源漂移风险**：source-backed 923、Legacy 72、recipe-runtime 6、rice-meal catalog 37、collection 68 互有交集但职责不同；没有新的 Runtime Catalog/coverage index 时，Worker、UI 和文档容易读到不同层。
- **适配边界风险**：formal review 显示 cooker boundary `source_limited` 467、`other` 456、direct adaptation 0；不能把原锅/蒸/烤/熟饭流程改写成普通电饭煲默认。
- **正式化瓶颈风险**：ratio DSL closed 0、formal-ready 0、厨房观察和旅程覆盖均 0/923；“上线 923 条”当前没有数据门依据。
- **估算污染风险**：922 条“无安全阻断”不等于 922 条来源事实闭合；738 条 source_partial、36 条 estimated、11 条 identity-only 仍应标研究/估算。
- **嵌入镜像风险**：`build-dist.mjs` 会把 JSON 复制并嵌入 `_worker.js`；若只改一个 JSON 或只上传 dist，线上可能出现版本/hash 不一致。所有变更必须从真源重建并跑聚合门禁。

## 8. 可复核命令

```bash
node tools/check-recipes.mjs
node tools/check-source-backed-one-pot-catalog.mjs --check
node tools/run-pantry-planner-v2-journeys.mjs
git diff --check
```

本审计只新增本文件；没有修改 JSON、运行代码、测试或部署资产。
