# Electric Rice Cooker Rice Meal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把公开 Preview 收敛为“家里默认有米，选择配菜后推荐真实、可执行、营养不过度单一的电饭煲菜饭”，候选与成品不再依赖自由模板或 DeepSeek。

**Architecture:** 新增一个只包含菜饭的 `rice-meal-catalog.v1.json` 作为运行时权威目录；目录条目引用现有 72 道 recipe 的身份、来源和安全证据，并补齐机器 Ratio DSL、固定动作、营养角色和受控替换。新的纯函数 selector 只从该目录匹配和排序，Worker 用 schema v3 对外提供 `/plan-meal` 与 `/generate-plan`，前端通过构建标志 `productFocus: "rice-meal-v1"` 切换到精简路径。旧 Planner V2 与 Legacy 路径先保留在源码中，但不参与该 Preview 构建的公开交互。

**Tech Stack:** 原生 HTML/JavaScript、Cloudflare Pages Worker、Node.js `node:test`、JSON 机器资产、现有 ingredient taxonomy / Ratio DSL / 台湾食药署营养数据、本地 Python bridge、真实 Chrome 手机视口。

## Global Constraints

- 生产 recipe 总数保持 72；本轮不向 `recipe-library.json` 增加 recipe。
- 首批运行目录只激活现有 recipe 中满足“生米为主体、配菜与米同锅成饭、普通电饭煲可执行、A/B 营养结构”的条目。
- 新调研到的上海蚕豆饭、闽南萝卜饭、台湾笋仔饭、宁夏肉粘饭、云南洋芋火腿焖饭、川渝箜饭和武陵社饭先保留为 `research_only|fact_checked|planned`，未补齐 Ratio DSL、动作和人工内容审核前不得变成普通候选。
- `auto_approved` 不等于人工批准；运行目录使用独立 `preview_ready` 状态，页面不得声称“官方、正宗、人工批准”。
- 候选只允许固定真实菜名、已审核家常名或诚实的“家庭电饭煲版”；禁止用“食材名 + 主食锅/酸香锅”等机械拼接生成名称。
- 食材覆盖不能越过忌口、安全、质地、部位、生熟和比例规则。无法合理多用食材时必须诚实解释，不强行拼锅。
- 普通候选只允许营养 A/B；C 级进入 `needs_balance_input` 或 `no_reliable_rice_meal`。
- 新路径全程 DeepSeek 调用为 0；生成步骤来自每个 variant 的受控动作。
- 不增加账号、用户画像、营养追踪、行为遥测、多锅清库存、多 Agent 产品能力或 production 部署。
- 每个任务先写失败测试、确认红灯，再做最小实现、确认绿灯并独立提交。
- 不覆盖用户已有未提交改动；每次提交前用 `git status --short` 和 `git diff --check` 检查工作区。

## Initial Preview Scope

首批 `preview_ready` 只从现有 raw-rice recipe 中筛选，目标 18–24 条，不以凑数为目标。候选集合至少覆盖以下族：

- 江南菜饭：上海奉贤咸肉菜饭、苏州青菜咸肉饭、南京腊肉/香肠菜饭；
- 闽台咸饭：高丽菜香菇炊饭、泉州浥饭、福建盖菜肉末咸饭；
- 广式饭锅：腊味、香菇滑鸡、豆豉排骨的家庭电饭煲适配版；
- 西北抓饭：新疆羊肉抓饭、新疆素抓饭、陕北红枣豇豆焖饭；
- 审核家常菜饭：白菜豆腐焖饭、香菇青菜豆腐饭、鸡腿土豆焖饭、玉米胡萝卜鸡腿饭、西兰花牛肉焖饭、青菜肉末焖饭、豆角排骨焖饭、香菇豆角排骨焖饭。

以下现有条目不进入首批：面、粥、汤饭、熟饭炒烩、需要中途开盖才能成立的做法、C 级单一碳水条目、野生菌、高度仪式性甜饭、国外菜饭。

---

### Task 1: 锁定当前基线和焦点目录边界

**Files:**
- Create: `tools/tests/rice-meal-catalog-boundary.test.mjs`
- Create: `tools/tests/fixtures/rice-meal-preview-scope.json`
- Modify: `docs/menu-master.md` only through its existing builder if a generated artifact needs refresh

**Interfaces:**
- Fixture fields: `included_recipe_ids`, `excluded_recipe_ids`, `expected_recipe_count`.
- `expected_recipe_count` remains `72`.

- [ ] **Step 1: 写失败测试固定“保留 72、只选生米菜饭”的边界**

  测试必须断言：`recipe-library.json` 仍为 72；首批列表中的每个 ID 存在；`core_ingredients` 包含生米/糯米而非熟米饭；面、粥、汤饭、炒饭、烩剩饭、国外饭、C 级土豆饭不在首批列表。

- [ ] **Step 2: 运行测试确认红灯**

  Run: `node --test tools/tests/rice-meal-catalog-boundary.test.mjs`

  Expected: FAIL，因为 scope fixture 尚不存在。

- [ ] **Step 3: 建立固定 scope fixture**

  逐项列出本轮可继续标准化的现有 recipe ID；不得用正则在运行时自动把“名字含饭”的条目全部纳入。

- [ ] **Step 4: 运行边界测试和旧菜谱测试**

  Run:

  ```bash
  node --test tools/tests/rice-meal-catalog-boundary.test.mjs tools/tests/recipe-library.test.mjs
  node tools/check-recipes.mjs
  ```

  Expected: PASS；recipe 数量仍为 72。

- [ ] **Step 5: 提交**

  ```bash
  git add tools/tests/rice-meal-catalog-boundary.test.mjs tools/tests/fixtures/rice-meal-preview-scope.json
  git commit -m "test: lock rice meal product scope"
  ```

### Task 2: 建立 Rice Meal Catalog Schema 和 Fail-Closed Validator

**Files:**
- Create: `tools/data/rice-meal-catalog.v1.json`
- Create: `worker/src/rice-meal-catalog-validator.js`
- Create: `tools/lib/rice-meal-catalog-validator.mjs`
- Create: `tools/tests/rice-meal-catalog-validator.test.mjs`
- Modify: `tools/check-recipes.mjs`

**Interfaces:**
- Produces: `validateRiceMealCatalog(catalog, { recipeLibrary, taxonomy, ratioCatalog }): string[]`
- Produces: `assertRiceMealCatalog(...)`
- Catalog version: `rice-meal-catalog-v1-20260801-r1`
- Status enum: `research_only|fact_checked|planned|preview_ready|pilot_observed|production_approved`
- Nutrition grade enum: `A|B|C`
- Adaptation enum: `direct_adaptation|process_adaptation|style_adaptation|not_suitable`

- [ ] **Step 1: 写 schema 与跨资产引用失败测试**

  覆盖：重复 family/variant ID；未知 recipe、canonical ingredient、ratio rule；非法状态晋升；缺少真实 display name；地域名无 identity ref；A 缺 carb/protein/fiber material contributor；B 不具备两类角色；C 被标 preview；主要食材无 amount rule 或 action；禽肉/猪肉/海鲜无安全终点；中途开盖依赖；未知字段；未完成条目误标 `preview_ready`。

- [ ] **Step 2: 运行测试确认红灯**

  Run: `node --test tools/tests/rice-meal-catalog-validator.test.mjs`

  Expected: FAIL，因为 catalog 与 validator 尚不存在。

- [ ] **Step 3: 实现 validator 与最小空目录**

  目录顶层固定：

  ```json
  {
    "schema_version": 1,
    "catalog_version": "rice-meal-catalog-v1-20260801-r1",
    "families": []
  }
  ```

  variant 必须包含：`variant_id`、`recipe_id`、`display_name`、`name_label`、`status`、`identity_level`、`identity_refs`、`rice`、`ingredients`、`approved_substitutions`、`forbidden_combinations`、`nutrition_structure`、`cooker_adaptation`、`ratio_rule_ids`、`safety_endpoints`、`source_refs`。

- [ ] **Step 4: 接入聚合门禁**

  `tools/check-recipes.mjs` 读取新目录并输出 `families / variants / preview_ready / planned` 数量。任何 catalog 错误都必须让命令非零退出。

- [ ] **Step 5: 运行测试与聚合门禁**

  Run:

  ```bash
  node --test tools/tests/rice-meal-catalog-validator.test.mjs
  node tools/check-recipes.mjs
  ```

  Expected: PASS；空目录不能改变现有候选行为。

- [ ] **Step 6: 提交**

  ```bash
  git add tools/data/rice-meal-catalog.v1.json worker/src/rice-meal-catalog-validator.js tools/lib/rice-meal-catalog-validator.mjs tools/tests/rice-meal-catalog-validator.test.mjs tools/check-recipes.mjs
  git commit -m "feat: add focused rice meal catalog"
  ```

### Task 3: 将首批现有菜饭标准化为机器可执行条目

**Files:**
- Modify: `tools/data/rice-meal-catalog.v1.json`
- Modify: `tools/data/ratio-rules.v1.json`
- Modify: `tools/data/ingredient-taxonomy.v1.json` only for already-evidenced aliases/states required by the fixed scope
- Create: `tools/tests/rice-meal-catalog-data.test.mjs`
- Modify: `tools/tests/ratio-dsl.test.mjs`
- Modify: `tools/tests/ingredient-taxonomy.test.mjs`

**Interfaces:**
- Each `preview_ready` variant references exactly one existing recipe ID.
- `amount_rule_id` and `ratio_rule_ids` are executable Ratio DSL; natural-language `recipe.ratio_rules` never enters arithmetic.
- `cooker_adaptation` has ordered `pre_actions`, `start_actions`, `finish_actions`, one `program`, and no mid-cycle action.

- [ ] **Step 1: 写数据完整性失败测试**

  对 fixture 中每个首批 ID 断言：固定自然菜名；A/B 角色；原料 amount rule；唯一液体默认值；一套普通电饭煲闭盖流程；所有主要食材出现在动作中；肉类安全 endpoint；受控 substitution 不改变部位/形态；来源引用可追溯；`preview_ready` 不依赖用户未提供的主要食材。

- [ ] **Step 2: 写 Ratio DSL 失败测试**

  覆盖：生米每份量、液体比例、出水食材扣液体、泡发糯米与生米不混用、排骨/鸡腿/羊肉的预处理动作、整数规范化只有一次。明确禁止从自然语言范围自动取中点。

- [ ] **Step 3: 运行测试确认红灯**

  Run:

  ```bash
  node --test tools/tests/rice-meal-catalog-data.test.mjs tools/tests/ratio-dsl.test.mjs tools/tests/ingredient-taxonomy.test.mjs
  ```

- [ ] **Step 4: 分三小批录入并逐批跑门禁**

  1. 江南/闽台；
  2. 广式/西北；
  3. 审核家常菜饭。

  某条缺少唯一机器比例、动作或安全证据时保持 `planned`，不通过复制相似菜的数字强行激活。首批最终可用数量以实际通过门禁的条目为准，不为达到 18–24 而降标准。

- [ ] **Step 5: 运行数据测试和聚合门禁**

  Run:

  ```bash
  node --test tools/tests/rice-meal-catalog-data.test.mjs tools/tests/ratio-dsl.test.mjs tools/tests/ingredient-taxonomy.test.mjs
  node tools/check-foods.mjs
  node tools/check-recipes.mjs
  ```

- [ ] **Step 6: 提交**

  ```bash
  git add tools/data/rice-meal-catalog.v1.json tools/data/ratio-rules.v1.json tools/data/ingredient-taxonomy.v1.json tools/tests/rice-meal-catalog-data.test.mjs tools/tests/ratio-dsl.test.mjs tools/tests/ingredient-taxonomy.test.mjs
  git commit -m "feat: standardize first rice meal catalog"
  ```

### Task 4: 实现纯函数食材匹配、营养门和覆盖排序

**Files:**
- Create: `worker/src/rice-meal-selector.js`
- Create: `tools/tests/rice-meal-selector.test.mjs`
- Create: `tools/data/rice-meal-journeys.v1.json`
- Create: `tools/run-rice-meal-journeys.mjs`

**Interfaces:**
- Produces: `normalizeRiceMealRequest(request, taxonomy): NormalizedRiceMealRequest`
- Produces: `selectRiceMealCandidates({ request, catalog, taxonomy, recentPlanIds }): RiceMealPlanResult`
- Result status: `ready|needs_balance_input|no_reliable_rice_meal|no_alternative_rice_meal|unsafe_recipe`
- Candidate fields match spec §8.2 and include explicit `unused_items[].reason_code`.

- [ ] **Step 1: 写真实旅程失败测试**

  至少逐条覆盖规格 §15.2 的 15 条旅程，并补：牛里脊只能进入通用牛肉位、不能替牛腩/肉末；嫩豆腐与老豆腐不可无条件互换；大米不计覆盖；重复输入去重；未识别输入进入解释；2 项输入的 1/2 只进逃生状态；4–6 项普通卡不得只用 1 种；7+ 项选择 4–5 种但不承诺清库存。

- [ ] **Step 2: 写候选差异和换一换失败测试**

  断言当前 plan 本次硬排除；旧历史只软降权；新候选必须改变 family、食材集合、蛋白质变体或流程负担之一；无同等质量第二套时返回 `no_alternative_rice_meal` 并携带当前 plan。

- [ ] **Step 3: 运行测试确认红灯**

  Run: `node --test tools/tests/rice-meal-selector.test.mjs`

- [ ] **Step 4: 实现稳定 selector**

  顺序必须固定为：身份/形态 → 忌口 → variant/substitution → 电饭煲适配 → A/B → 覆盖门 → ratio/容量/熟制 → 稳定排序。排序 tuple 是 `[coverage_count desc, grade A-before-B, identity rank, extra-major-count asc, adaptation rank, active-time asc, recent penalty, variant_id]`。

- [ ] **Step 5: 建立旅程 corpus 和 CLI 门**

  JSON corpus 保存输入、状态、允许/禁止 variant、最低覆盖、营养等级和未用原因要求。CLI 输出总数、状态分布、每条首选覆盖和失败详情。

- [ ] **Step 6: 运行 selector 测试和旅程门**

  Run:

  ```bash
  node --test tools/tests/rice-meal-selector.test.mjs
  node tools/run-rice-meal-journeys.mjs
  ```

- [ ] **Step 7: 提交**

  ```bash
  git add worker/src/rice-meal-selector.js tools/tests/rice-meal-selector.test.mjs tools/data/rice-meal-journeys.v1.json tools/run-rice-meal-journeys.mjs
  git commit -m "feat: select reliable rice meal candidates"
  ```

### Task 5: 编译签名 Plan 和确定性菜饭成品

**Files:**
- Create: `worker/src/rice-meal-compiler.js`
- Create: `tools/tests/rice-meal-compiler.test.mjs`
- Modify: `worker/src/generated-plan-contract.js`
- Modify: `tools/tests/worker-generate-plan.test.mjs`

**Interfaces:**
- Produces: `buildRiceMealPlanToken(candidate, secret): string`
- Produces: `verifyAndRecomputeRiceMealPlan(envelope, assets, secret): RiceMealCandidate`
- Produces: `compileRiceMeal(candidate, assets): GeneratedMeal`
- `plan_id` hashes only catalog version, variant ID, servings, normalized inputs, substitutions, ratio facts and ordered actions; display copy is excluded.

- [ ] **Step 1: 写 plan identity 与防篡改失败测试**

  覆盖：相同输入稳定 ID；variant、份数、substitution、比例或动作改变会改变 ID；菜名/推荐理由文字改变不改变 ID；裸 plan ID、客户端篡改 ingredient/grams/action/catalog version、过期 catalog 都被拒绝为 `stale_plan|invalid_plan_token`。

- [ ] **Step 2: 写成品零漂移失败测试**

  覆盖：名称等于目录名称；ingredient 集合等于 planner 集合 + 基础补充白名单；整数克数精确等于 Ratio DSL；pre/start/finish 顺序不漂移；安全终点完整；牛里脊不变牛腩、金针菇不变香菇、不得新增虾仁；营养查表仍按权威层级执行。

- [ ] **Step 3: 写每族受控文案快照测试**

  每个激活 family 至少一例。步骤必须是人工受控句式，禁止出现“计划比例、slot、template、canonical、生产版”等工程语言，也不得把另备食材说成“家里现成”。

- [ ] **Step 4: 运行测试确认红灯**

  Run:

  ```bash
  node --test tools/tests/rice-meal-compiler.test.mjs tools/tests/worker-generate-plan.test.mjs
  ```

- [ ] **Step 5: 实现 compiler 并接入统一契约校验**

  复用现有签名、营养 enrichment 与安全校验思想；新 compiler 不调用 `planner-v2.js` 的自由 template 编译，也不调用 DeepSeek。

- [ ] **Step 6: 运行定向测试**

  Run:

  ```bash
  node --test tools/tests/rice-meal-compiler.test.mjs tools/tests/worker-generate-plan.test.mjs
  ```

- [ ] **Step 7: 提交**

  ```bash
  git add worker/src/rice-meal-compiler.js worker/src/generated-plan-contract.js tools/tests/rice-meal-compiler.test.mjs tools/tests/worker-generate-plan.test.mjs
  git commit -m "feat: compile deterministic rice meal plans"
  ```

### Task 6: 接入 Worker、Local Bridge 和 Build Metadata

**Files:**
- Modify: `worker/src/worker.js`
- Modify: `ai_proxy.py`
- Modify: `tools/build-dist.mjs`
- Modify: `tools/tests/worker-planner-v2.test.mjs`
- Create: `tools/tests/worker-rice-meal.test.mjs`
- Modify: `tools/tests/planner-v2-parity.test.mjs`
- Modify: `tools/tests/build-dist.test.mjs`

**Interfaces:**
- Build option: `--product-focus legacy|rice-meal-v1`
- Build metadata: `{ buildId, plannerRollout, generationMode, productFocus }`
- Request: `{ schema_version:3, product_focus:"rice_meal", servings, pantry, dislikes, swap? }`
- `/health` adds `productFocus`, `riceMealCatalog`, `riceMealCatalogVersion`, `riceMealFamilies`, `riceMealVariants`, `riceMealPreviewReady`.

- [ ] **Step 1: 写 HTTP 契约失败测试**

  覆盖：schema v3 请求走新 selector；非法 JSON 仍为 400 且 0 DeepSeek；plan 不调用 DeepSeek；generate 不调用 DeepSeek；非 rice-meal 构建保持旧路径；asset 缺失 fail closed；health 不能谎报 catalog ok。

- [ ] **Step 2: 写 Worker/Python parity 失败测试**

  同一请求在 Worker 与 `ai_proxy.py --plan-meal` 返回相同状态、candidate IDs、used/unused、coverage、grade；同一 token 生成相同名称、克数与步骤事实。

- [ ] **Step 3: 写 build 失败测试**

  断言构建复制并嵌入 catalog、selector、compiler、validator；`productFocus` 三方可核验；非法 focus 拒绝；rice-meal 构建不得因 metadata 缺失静默回 legacy。

- [ ] **Step 4: 运行测试确认红灯**

  Run:

  ```bash
  node --test tools/tests/worker-rice-meal.test.mjs tools/tests/planner-v2-parity.test.mjs tools/tests/build-dist.test.mjs
  ```

- [ ] **Step 5: 实现资产加载与端点分流**

  `/plan-meal` 和 `/generate-plan` 根据编译期 `productFocus` 选择新路径；不接受公开 URL 参数切换。Legacy 源码保留，但 `rice-meal-v1` 的公共请求不能静默落回旧 selector。

- [ ] **Step 6: 同步本地 bridge 并做语法检查**

  Run: `python3 -m py_compile ai_proxy.py`

- [ ] **Step 7: 运行定向测试和构建检查**

  Run:

  ```bash
  node --test tools/tests/worker-rice-meal.test.mjs tools/tests/worker-planner-v2.test.mjs tools/tests/planner-v2-parity.test.mjs tools/tests/build-dist.test.mjs
  node tools/build-dist.mjs --out-dir dist --build-id rice-meal-local --planner-rollout direct-recommend --generation-mode deterministic --product-focus rice-meal-v1
  ```

- [ ] **Step 8: 提交**

  ```bash
  git add worker/src/worker.js ai_proxy.py tools/build-dist.mjs tools/tests/worker-rice-meal.test.mjs tools/tests/worker-planner-v2.test.mjs tools/tests/planner-v2-parity.test.mjs tools/tests/build-dist.test.mjs
  git commit -m "feat: serve rice meal planner v3"
  ```

### Task 7: 将前端收敛为一个菜饭产品

**Files:**
- Modify: `index.html`
- Create: `tools/tests/frontend-rice-meal-flow.test.mjs`
- Modify: `tools/tests/frontend-planner-v2-flow.test.mjs`
- Modify: `tools/tests/frontend-recipe-contract.test.mjs`
- Modify: `tools/tests/core-product-convergence.test.mjs`

**Interfaces:**
- `DEFAULT_PROFILE` only needs `servings`, `pantry`, `dislikes` on rice-meal builds.
- Request builder emits `schema_version:3` and `product_focus:"rice_meal"`.
- Views: `profile|generating|rice-meal-candidates|rice-meal-result|needs-balance|no-reliable|no-alternative|unsafe|stale`.

- [ ] **Step 1: 写首屏失败测试**

  断言 rice-meal build 只显示人数、配菜、忌口和“推荐菜饭”；显示“家里默认有米，选你想用的配菜”；不显示 mode、intent、清库存、面条、剩米饭、粥、汤锅、多锅或“剩下食材再来一锅”。

- [ ] **Step 2: 写候选卡和状态页失败测试**

  候选卡显示固定真实菜名、用上 x/N、具体未用原因、营养角色、预处理、主动与总时间；1–3 张但不凑数。`needs_balance_input`、`no_reliable_rice_meal`、`no_alternative_rice_meal`、`unsafe_recipe`、`stale_plan` 都有专属文案和返回修改入口。

- [ ] **Step 3: 写完整点击流失败测试**

  覆盖：填写食材 → 候选 → 选择 → 成品 → 开始做；换一换有替代进入新候选、无替代保留当前成品；生成失败保留已选计划；file:// 仍提示双击 `start.command`；localhost 只请求 `localhost:8765`。

- [ ] **Step 4: 运行测试确认红灯**

  Run:

  ```bash
  node --test tools/tests/frontend-rice-meal-flow.test.mjs tools/tests/frontend-planner-v2-flow.test.mjs tools/tests/frontend-recipe-contract.test.mjs tools/tests/core-product-convergence.test.mjs
  ```

- [ ] **Step 5: 实现精简 UI 和文案**

  保留现有营养署名、估算标记、过敏/忌口、安全和错误稳定显示。不要删除 Legacy 源码前先用 `PRODUCT_FOCUS` 分支隔离；完成浏览器验收后再评估发布包裁剪。

- [ ] **Step 6: 运行前端测试**

  Run:

  ```bash
  node --test tools/tests/frontend-rice-meal-flow.test.mjs tools/tests/frontend-planner-v2-flow.test.mjs tools/tests/frontend-recipe-contract.test.mjs tools/tests/core-product-convergence.test.mjs
  ```

- [ ] **Step 7: 提交**

  ```bash
  git add index.html tools/tests/frontend-rice-meal-flow.test.mjs tools/tests/frontend-planner-v2-flow.test.mjs tools/tests/frontend-recipe-contract.test.mjs tools/tests/core-product-convergence.test.mjs
  git commit -m "feat: focus frontend on rice meals"
  ```

### Task 8: 建立发布门、文档和构建一致性

**Files:**
- Modify: `tools/check-recipes.mjs`
- Modify: `tools/build-dist.mjs`
- Create: `tools/check-rice-meal-preview.mjs`
- Create: `tools/tests/rice-meal-preview-gate.test.mjs`
- Modify: `部署说明.md`
- Modify: `docs/PRODUCT_PRINCIPLES.md`
- Modify: `docs/rice-meal-regional-research.md`

**Interfaces:**
- Gate output includes catalog version, preview-ready count, A/B count, active family count, journey count, zero-LLM assertion and excluded legacy categories.

- [ ] **Step 1: 写发布门失败测试**

  断言只要出现 C 级普通候选、机械拼接名、未引用 ratio、动作漏主要食材、中途开盖、候选单食材覆盖违规、旧模板候选、DeepSeek 路径或 build metadata 不一致，门禁即失败。

- [ ] **Step 2: 运行测试确认红灯**

  Run: `node --test tools/tests/rice-meal-preview-gate.test.mjs`

- [ ] **Step 3: 实现聚合门并更新文档**

  部署文档只使用 `tools/build-dist.mjs`。研究文档明确哪些 family 已进入 Preview、哪些仍研究；不得把自动测试写成家庭试做或味道验证。

- [ ] **Step 4: 运行门禁和构建**

  Run:

  ```bash
  node tools/check-rice-meal-preview.mjs
  node tools/build-dist.mjs --out-dir dist --build-id rice-meal-gate --planner-rollout direct-recommend --generation-mode deterministic --product-focus rice-meal-v1
  ```

- [ ] **Step 5: 提交**

  ```bash
  git add tools/check-recipes.mjs tools/build-dist.mjs tools/check-rice-meal-preview.mjs tools/tests/rice-meal-preview-gate.test.mjs 部署说明.md docs/PRODUCT_PRINCIPLES.md docs/rice-meal-regional-research.md
  git commit -m "chore: add rice meal preview release gate"
  ```

### Task 9: 全量自动验证与真实浏览器旅程

**Files:**
- Create: `docs/rice-meal-preview-feedback.md`
- Modify: code/tests only if a journey exposes an in-scope defect; use a separate TDD commit per defect

- [ ] **Step 1: 确认干净基线**

  Run:

  ```bash
  git status --short
  git diff --check
  ```

  Expected: 无意外未提交改动。

- [ ] **Step 2: 串行运行全量 Node 测试**

  Run: `node --test --test-concurrency=1 tools/tests/*.test.mjs`

  Expected: 0 failures。计时用例不得与重负载脚本并行。

- [ ] **Step 3: 运行所有数据、旅程和语法门**

  Run:

  ```bash
  node tools/check-foods.mjs
  node tools/check-recipes.mjs
  node tools/check-rice-meal-preview.mjs
  node tools/run-rice-meal-journeys.mjs
  python3 -m py_compile ai_proxy.py
  ```

- [ ] **Step 4: 构建并验证字节一致性**

  使用当时干净 HEAD 生成 ASCII build ID：

  ```bash
  BUILD_ID="rice-meal-$(git rev-parse --short HEAD)"
  node tools/build-dist.mjs --out-dir dist --build-id "$BUILD_ID" --planner-rollout direct-recommend --generation-mode deterministic --product-focus rice-meal-v1
  node --test tools/tests/build-dist.test.mjs tools/tests/service-worker.test.mjs
  ```

- [ ] **Step 5: 启动本地真实服务**

  Run: `./start.command`

  验证 `http://localhost:8081` 只调用 `http://localhost:8765`，并记录 build ID。

- [ ] **Step 6: 多 Agent 真实 Chrome 手机旅程**

  使用 `superpowers:dispatching-parallel-agents` 分成至少三组：

  1. 1–3 种食材和忌口/安全；
  2. 4–6 种食材覆盖、候选丰富度、换一换；
  3. 7–10 种混合、失败/返回/移动端可读性。

  每条必须真实点击、等待、选择候选、进入成品、换一换和返回修改，不得只调用后端函数。至少 30 条，保存截图、请求状态、candidate IDs、首道 `x/N`、营养等级、未用原因、错误和按钮反馈。

- [ ] **Step 7: 修复旅程发现的阻断问题**

  每个 P0/P1 问题先写可复现失败测试，再最小修复并重跑对应浏览器路径。P2 只记录，不在未验证时扩大范围。

- [ ] **Step 8: 写反馈文档**

  记录真实结果，不把浏览器点击写成做饭或口味通过。列出所有激活菜饭是否至少有一次端到端覆盖、候选/成品 P95、0 LLM、0 bad JSON/5xx/JS 错误及已知观察项。

- [ ] **Step 9: 提交验证文档**

  ```bash
  git add docs/rice-meal-preview-feedback.md
  git commit -m "docs: record rice meal preview journeys"
  ```

### Task 10: 更新 Draft PR 和 Preview（禁止 Production）

**Files:**
- No new product changes unless required by a failed gate

- [ ] **Step 1: 最终验证工作区、提交链和远端差异**

  Run:

  ```bash
  git status --short --branch
  git log --oneline --decorate -12
  git diff --check origin/codex/targeted-recipe-expansion...HEAD
  ```

- [ ] **Step 2: 推送当前分支并保持 Draft PR #1**

  不合并 PR，不改成 Ready。若远端已有他人提交，先 fetch 并以非破坏方式整合，禁止 force push。

- [ ] **Step 3: 仅部署 `recipe-validation` Preview**

  只有 Task 9 全绿且用户已授权 Preview 部署时执行：

  ```bash
  npx wrangler pages deploy dist --project-name yiguochu --branch recipe-validation --commit-dirty=true --commit-message "rice meal preview"
  ```

  禁止 `--branch main`，禁止 production promotion。

- [ ] **Step 4: 三方构建核对与线上冒烟**

  核对 `/health`、`/build-meta.json` 与页面 `window.__YIGUOCHU_BUILD_META__` 的 build ID、`productFocus:"rice-meal-v1"`、`generationMode:"deterministic"` 完全一致；再跑 3 条真实 Chrome 旅程。

- [ ] **Step 5: 交付用户测试入口和已知边界**

  清楚说明：这是 Preview、没有部署 production、recipe 总数仍为 72、新运行目录实际激活数量、哪些地域 family 尚处 planned、浏览器验证不能替代真实做饭与口味验证。

## Completion Definition

- 公开 Preview 只呈现电饭煲菜饭主路径；
- recipe 总数仍为 72，运行时候选由独立 rice-meal catalog 决定；
- 普通候选全部 A/B，真实固定菜名，无机械拼接名；
- 多食材输入满足覆盖门或进入诚实状态，不再把 1/N 当正常候选；
- 候选和成品名称、食材、克数、步骤、安全与来源零漂移；
- 全程 DeepSeek 调用为 0；
- 全量测试、数据门、Python 语法、构建一致性和 30 条真实浏览器旅程通过；
- 仅更新 Draft PR 和 Preview，不合并、不部署 production；
- 用户可以直接打开 Preview 亲自测试，并能看到尚未被实际做饭验证的边界。
