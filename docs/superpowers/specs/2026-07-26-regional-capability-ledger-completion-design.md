# 全国地域技法能力台账补全设计

日期：2026-07-26  
状态：已获方向确认，待用户审阅正式规格  
适用分支：`codex/targeted-recipe-expansion`（Draft PR #1）

## 1. 目标

把全国地域地图中的 12 个技法家族全部纳入同一份机器可验证的 Planner 能力台账，回答四个问题：

1. 这一技法家族目前是否已有运行时能力；
2. 已覆盖的是整个家族，还是其中一部分主食形态；
3. 下一个候选模板是什么；
4. 继续晋升还缺 evidence、taxonomy、Ratio DSL 或人工验证中的哪一项。

本轮只补齐“地图到产品能力”的审计框架，不激活新模板。这样后续每扩一个地域，都先进入统一台账，再按 blocker 原子晋升，避免继续以新增固定菜谱或零散修改替代组合能力建设。

## 2. 已核实的当前事实

- 地域地图已有 13 个区域、34 个省级单元和 12 个技法家族。
- 生产菜谱保持 72 道，其中 12 道 `approved`、60 道 `auto_approved`。
- Planner 当前有 9 个 active templates、7 个 planned templates。
- 现有 `template_capability_mappings` 只覆盖 3 个家族：`raw-rice-braise`、`noodle-braise`、`stew-with-staple`。
- `stew-with-staple` 的地域结构已有研究依据，但家庭面团比例、炖锅液体和蒸汽空间仍未形成可执行 Ratio DSL，因此继续保持 `blocked_by_ratio`。

## 3. 非目标

本轮明确不做：

- 不新增、删除或修改 72 道 recipe；
- 不新增或激活 template；
- 不新增 Ratio DSL 规则；
- 不修改 ingredient taxonomy；
- 不修改 Planner 排序、覆盖、换一换或 DeepSeek 契约；
- 不把研究候选伪装成运行时能力；
- 不部署 Preview 或 production，不合并 Draft PR。

## 4. 核心区分

### 4.1 地域事实不等于运行能力

地域研究只回答“某种做法或结构是否存在”。Planner 能力还必须具备受控食材身份、机器比例、安全终点和可复现模板。台账必须把二者分开。

### 4.2 家族覆盖不等于单一形态可用

例如 `noodle-broth` 包含面条、面片、米粉和粉丝。即使 `broth-noodle-pot` 已支持普通面条，也不能把整个家族标成完整覆盖。因此每条记录必须明确 `full`、`partial` 或 `none`。

### 4.3 recipe 仍只作 evidence

组合能力由 template rules + ingredient taxonomy + Ratio DSL 决定。Recipe 只提供技法、安全、比例和来源证据，不决定用户组合空间。

## 5. 数据契约

继续使用 `tools/data/regional-menu-mappings.v1.json`，避免复制 72 条生产映射和 24 条研究映射；将 `mapping_version` 递增为 `regional-menu-mappings-v1-20260726-r2`。根结构不变，`template_capability_mappings` 的单条记录改为：

```json
{
  "family_id": "noodle-broth",
  "regional_scope": "mixed",
  "region_ids": ["qinghai_tibet"],
  "coverage_level": "partial",
  "runtime_template_ids": ["broth-noodle-pot"],
  "candidate_template_ids": [],
  "covered_staple_states": ["面条"],
  "uncovered_staple_states": ["面片", "米粉", "粉丝"],
  "coverage_boundary_codes": ["plain_noodle_only"],
  "promotion_status": "blocked_by_taxonomy",
  "evidence_recipe_ids": ["broccoli-beef-soup-noodles", "tibetan-gutu"],
  "evidence_research_ids": [],
  "required_ratio_rule_ids": ["broth-noodle-liquid-v1"],
  "resolved_ratio_rule_ids": ["broth-noodle-liquid-v1"],
  "taxonomy_item_ids": ["noodle"],
  "blocker_codes": [
    "taxonomy_missing:noodle_sheet",
    "taxonomy_missing:rice_noodle",
    "taxonomy_missing:vermicelli"
  ],
  "scope_note": "当前运行时只覆盖普通面条；面片、米粉和粉丝仍需独立吸液与入锅规则。"
}
```

### 5.1 字段定义

- `family_id`：必须唯一引用 atlas 中的技法家族。
- `regional_scope`：受控枚举 `regional | national_household | mixed`。`regional` 表示只有地域证据，`national_household` 表示当前只有全国性家常能力，`mixed` 表示两类同时存在。
- `region_ids`：该家族已有明确事实关联的区域。`regional` 与 `mixed` 必须至少一个，`national_household` 必须为空；不得为了满足计数给全国性家常结构伪造地域。
- `coverage_level`：受控枚举 `full | partial | none`。
- `runtime_template_ids`：已经 active 且 `runtime_eligible:true` 的模板；允许为空。
- `candidate_template_ids`：可能承接下一轮晋升的现有 active/planned 模板；允许为空，不得写不存在的模板。
- `covered_staple_states`：当前运行能力真实覆盖的 atlas `staple_states` 子集。
- `uncovered_staple_states`：仍未覆盖的 atlas `staple_states` 子集。
- `coverage_boundary_codes`：当同一种主食状态只覆盖某个受控子集时记录额外边界。第一版词表固定为 `requires_acid_base | raw_noodle_only | plain_noodle_only`，不得写自由文本替代机器状态。
- `promotion_status`：沿用 `research_only | blocked_by_evidence | blocked_by_taxonomy | blocked_by_ratio | preview_candidate | covered_by_active_template`。
- `evidence_recipe_ids`：已有生产 recipe evidence，可为空。
- `evidence_research_ids`：研究候选或地域研究条目 ID，可为空。
- `required_ratio_rule_ids`：完整晋升所需规则；研究早期允许为空。
- `resolved_ratio_rule_ids`：已在 Ratio catalog 中存在并通过校验的规则。
- `taxonomy_item_ids`：已存在的受控食材身份。
- `blocker_codes`：结构化 blocker；ready 状态必须为空，其他状态必须非空。
- `scope_note`：用一句话解释当前能力边界，不写菜谱步骤。

`template_id` 旧字段在本次迁移中删除；不得同时保留单值字段和数组字段，避免出现两个事实来源。

## 6. 12 个家族的目标台账

下表只定义审计状态，不代表本轮激活模板。

| 技法家族 | 覆盖 | 当前运行模板 | 候选模板 | 目标状态 | 主要缺口 |
|---|---|---|---|---|---|
| `raw-rice-braise` | full | `savory-mixed-rice-pot` | 无 | `covered_by_active_template` | 无 |
| `cooked-rice-stir` | full | `cooked-rice-stir-pot` | 无 | `covered_by_active_template` | 无 |
| `cooked-rice-stew` | partial | `acid-staple-pot` | `broth-rice-pot` | `blocked_by_ratio` | 非酸味汤饭 Ratio DSL 未完成 |
| `grain-porridge` | none | 无 | `soft-family-rice-pot` | `blocked_by_ratio` | 不同谷物浸泡和液体比例未完成 |
| `noodle-braise` | partial | `braised-noodle-pot` | 无 | `preview_candidate` | 当前只覆盖生面；atlas 中的半熟面仍不冒充已覆盖 |
| `noodle-steam-braise` | none | 无 | 无 | `blocked_by_taxonomy` | 半熟面、回拌、二次蒸焖语义缺失 |
| `noodle-broth` | partial | `broth-noodle-pot` | 无 | `blocked_by_taxonomy` | 面片、米粉、粉丝尚未覆盖 |
| `stew-with-staple` | none | 无 | `stew-with-staple-pot` | `blocked_by_ratio` | 面团比例、炖锅液位和蒸汽空间未完成 |
| `claypot-rice` | none | 无 | 无 | `blocked_by_evidence` | 家庭锅具下的受热、锅巴与肉类熟制证据不足 |
| `glutinous-mixed-rice` | none | 无 | 无 | `blocked_by_ratio` | 浸泡和糯米/杂粮吸水规则未完成 |
| `vessel-adapted-rice` | none | 无 | 无 | `research_only` | 器具变化后保留何种核心身份尚未收敛 |
| `family-pot-with-absorbent-staple` | none | 无 | 无 | `blocked_by_taxonomy` | 粉条、粉丝吸液和耐煮形态未受控 |

其中 `cooked-rice-stew` 的 `partial` 只承认 `acid-staple-pot` 已能覆盖酸味熟饭烩煮这一窄子集；不得写成一般汤饭已经完整覆盖。`noodle-broth` 同理，只承认普通面条子集。

## 7. Validator 规则

`tools/lib/regional-menu-mapping-validator.mjs` 必须新增并强制以下规则：

1. `template_capability_mappings` 的 `family_id` 集合与 atlas 12 个技法家族完全相等；缺一项、多一项或重复均失败。
2. 每条记录只能包含本规格定义的字段；`regional_scope` 必须是受控枚举。
3. `runtime_template_ids` 中每个模板都必须存在、active 且 `runtime_eligible:true`。
4. `candidate_template_ids` 中每个模板必须存在；同一模板不得同时出现在 runtime 与 candidate。
5. `covered_staple_states` 与 `uncovered_staple_states` 必须互斥，合并后与对应 atlas 家族的 `staple_states` 完全相等；`coverage_boundary_codes` 只能取受控词表。
6. `full` 必须 covered 非空、uncovered 与 boundary 均为空；`partial` 必须 covered 非空，并且 uncovered 或 boundary 至少一项非空；`none` 必须 covered 与 boundary 均为空、uncovered 为完整集合且 runtime 为空。
7. `covered_by_active_template` 只允许 `coverage_level:"full"`，必须至少一个 runtime template、无 blocker，且 required/resolved ratio 集合完全相等。
8. `preview_candidate` 可以是 `full` 或 `partial`，但必须至少一个 runtime template、无 blocker，且其已声明范围所需的 required/resolved ratio 集合完全相等；`partial` 的未覆盖状态仍须原样展示。它只表示这一个受控范围待 Preview 验证，不表示整个家族完整，也不表示 production 批准。
9. `blocked_*` 与 `research_only` 必须至少一个 blocker；不得通过空 blocker 暗示已就绪。
10. recipe、research、taxonomy、ratio、region 和 template 引用必须全部存在；`regional`/`mixed` 必须有 region，`national_household` 不得有 region。
11. `evidence_recipe_ids` 与 `evidence_research_ids` 合并后至少一项；没有任何证据的条目不能进入台账。
12. resolved ratio 必须同时出现在 required ratio 中；未落地的 required ratio 可以保留，但不得出现在 resolved 中。

## 8. 生成审计

`tools/build-regional-atlas.mjs` 在现有 `docs/regional-atlas.md` 中生成“Planner 能力覆盖矩阵”章节，字段固定为：

- 技法家族；
- 覆盖级别；
- 已运行模板；
- 下一候选模板；
- promotion status；
- 未覆盖主食状态；
- blocker codes；
- scope note。

生成结果必须来自 JSON 台账，禁止手工维护第二份 Markdown 真相。`--check` 必须在数据或生成文档漂移时失败。

发布包继续只包含 Planner 运行资产。`regional-atlas`、`regional-menu-mappings`、各区域 research JSON 和生成审计不得进入 `dist/`。

## 9. TDD 与验收

实现时先写失败测试，再修改数据和 validator。至少覆盖：

1. 现状只有 3 条时因未覆盖全部 12 家族失败；
2. 补齐后恰好 12/12 通过；
3. 删除、重复或伪造 family 失败；
4. `partial` 的 covered/uncovered 不能重叠且必须完整分割 atlas 状态；
5. `none` 记录携带 runtime template 失败；
6. inactive template 被写入 runtime 失败；
7. 不存在的 candidate template 失败；
8. 假 recipe、research、taxonomy 或 ratio 引用失败；
9. `covered_by_active_template` 携带 blocker 或 coverage 非 full 失败；
10. `blocked_*` 或 `research_only` 没有 blocker 失败；
11. `resolved_ratio_rule_ids` 超出 required 集合失败；
12. 生成的 Markdown 显示 12 个家族且 `--check` 通过；
13. `check-recipes.mjs` 仍报告 72 recipes、9 active、7 planned；
14. 两次相同 build-id 构建逐字节一致；
15. 发布包中不存在地域地图、能力台账或 research 文件。

全量完成门禁：

```sh
node --test --test-concurrency=1 tools/tests/*.test.mjs
node tools/check-foods.mjs
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
node tools/build-regional-atlas.mjs --check
python3 -m py_compile ai_proxy.py
```

## 10. 完成定义

只有以下事实同时成立，本轮才算完成：

- atlas 的 12 个技法家族全部且仅出现一次；
- 每条记录都能诚实区分 full、partial、none；
- 现有 9 个运行模板没有被改变或暗中扩大能力；
- `stew-with-staple` 继续被 Ratio DSL blocker 拦截；
- 72 道菜谱数量与状态不变；
- 审计文档由数据生成且保持新鲜；
- 研究资产未进入发布包；
- 全量测试和门禁通过；
- Draft PR 保持 Draft，未部署任何环境。

完成本轮后，再从 `blocked_*` 条目中按“证据完整度、taxonomy 完整度、Ratio DSL 可执行性、家庭高频价值”排序，单独为下一个能力写设计；不得在本轮顺手激活。
