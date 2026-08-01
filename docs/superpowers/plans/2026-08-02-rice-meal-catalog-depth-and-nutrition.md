# Rice Meal Catalog Depth and Nutrition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不增加 72 道 evidence recipe 的前提下，建立 16 道真实命名、机器可执行的菜饭目录，并让“A/B 营养结构”由实际克数而不是角色标签决定；普通 Pilot 构建仍只开放 8 道 `preview_ready`，新增 8 道只在内部校准构建中展示，收到家庭试做结果后才能逐道升为 `preview_ready`。

**Architecture:** `rice-meal-collection.v1.json` 继续承载全国地域框架与阻断事实；`rice-cooker-source-evidence.v1.json` 承载政府/厂商配方事实；`rice-meal-catalog.v1.json` 是独立运行目录，不再要求“一道 runtime 菜饭等于一道 legacy recipe”。运行能力由 catalog + taxonomy + Ratio DSL + action/safety contract 决定，72 道 recipe 只作为可选 evidence。新增长条目使用真实来源菜名，跨机型和份数变化明确标为项目家庭适配。DeepSeek 不参与选菜或生成。

**Tech Stack:** JSON 机器资产、Node.js `node:test`、原生 JavaScript、Cloudflare Pages Worker、现有 ingredient taxonomy / Ratio DSL / rice-meal selector / deterministic compiler、真实 Chrome 手机视口。

## Global Constraints

- 产品只做米饭类菜饭：生米或明确泡发米为主，主烹饪在电饭煲/等价封闭饭锅流程中完成；不启用面、粥、汤饭、熟饭炒烩、甜饭或纯碳水 C 级条目。
- 菜名必须来自政府、厂商或可靠菜谱身份来源；项目只增加“家庭电饭煲适配”标签，不创造“食材名 + 主食锅/饭锅”等机械名字。
- 真实来源证明菜名、组合、器具或固定批量；项目缩放、通用电饭煲液体和营养补强必须单独标记为项目标准，不冒充原方。
- 第一批新增 8 道：`高丽菜饭`、`南瓜饭`、`咖喱鸡肉饭`、`懒人焖饭（腊肠什锦版）`、`牛肉什锦饭`、`鲜蔬竹笋饭`、`什锦鸡饭`、`鲜香菇饭`。证据不闭合的新疆抓饭、孔干饭、煲仔饭、泉州浥饭等不激活。
- A 级必须在默认份量下同时达到实质主食、实质蛋白和实质纤维；B 级至少达到主食及蛋白/纤维之一；C 级不进入 Preview。不得用 10g 虾米、20g 鸡肉或仅角色标签冒充充足蛋白。
- 受控调味料必须进入机器合同、营养计算和忌口检查；复合调味料的过敏标签由 taxonomy/fixed profile 派生，不允许 catalog 自填绕过；DeepSeek 不得补调味、换食材或改克数。
- `calibration_preview` 是内部可执行试做状态，不是来源原方或人工批准：默认构建不得展示；只有构建期 `riceCatalogScope:"calibration"` 才可见。项目水量和跨机型适配必须在卡片、成品和健康信息中明示；任何家庭试做失败都要回退而不是合理化。
- 生产 recipe 总数保持 72；不增加账号、画像、营养追踪、多锅规划、产品内多 Agent 或 production 部署。
- 新路径全程 DeepSeek 调用为 0。
- 每项行为先写失败测试并观察红灯，再做最小实现、观察绿灯、提交；每个任务完成后独立审查。
- Preview 只部署 `recipe-validation`，不得部署或提升 `main`。

## Task 1: 把营养等级改为可执行克数门禁

**Files:**
- Modify: `worker/src/rice-meal-catalog-validator.js`
- Modify: `worker/src/rice-meal-selector.js`
- Modify: `worker/src/worker.js`
- Modify: `tools/lib/rice-meal-catalog-validator.mjs`
- Modify: `tools/tests/rice-meal-catalog-validator.test.mjs`
- Modify: `tools/tests/rice-meal-catalog-data.test.mjs`
- Modify: `tools/tests/rice-meal-selector.test.mjs`
- Modify: `tools/tests/worker-rice-meal.test.mjs`
- Modify: `tools/tests/rice-meal-preview-gate.test.mjs`
- Modify: `tools/data/ratio-rules.v1.json`
- Modify: `tools/data/rice-meal-catalog.v1.json`

**Interfaces:**
- `resolveDefaultPerServingMaterialGrams(variant, ratioCatalog): Map<canonicalId, grams>`
- `validateSubstantialNutrition(variant, taxonomy, ratioCatalog): string[]`

**Default thresholds:**
- carb: raw rice `>= 80g/person`;
- animal protein / seafood: `>= 50g/person`;
- tofu: `>= 90g/person`;
- egg: `>= 45g/person`;
- dry legumes: `>= 30g/person`; cooked legumes: `>= 75g/person`;
- fiber-bearing vegetables/fungus/legumes combined: `>= 75g/person`.

- [ ] 写失败测试：低于阈值的 contributor 不得支撑 A/B；`allocate_group_total_per_serving` 必须按组总量和成员解析；仅 `reference_quantity` 不得冒充可执行克数；阈值边界固定。
- [ ] 运行定点测试并观察红灯。
- [ ] 实现唯一的默认份量解析器，并让 Worker/工具 validator 使用同一权威源。
- [ ] 校正现有 8 道默认份量：不改变菜名和食材身份，只将被标为“实质”角色的蛋白/蔬菜提高到门槛；不能达到时诚实降级为 B。
- [ ] 运行 catalog、Ratio DSL、compiler、selector 与聚合门禁，提交。

## Task 2: 解耦 runtime 菜饭与 legacy recipe 的一对一上限

**Files:**
- Modify: `worker/src/rice-meal-catalog-validator.js`
- Modify: `tools/lib/rice-meal-catalog-validator.mjs`
- Modify: `tools/lib/rice-cooker-source-evidence-validator.mjs`
- Modify: `worker/src/rice-meal-selector.js`
- Modify: `worker/src/rice-meal-compiler.js`
- Modify: `worker/src/worker.js`
- Modify: `ai_proxy.py`
- Modify: `index.html`
- Modify: `tools/build-dist.mjs`
- Modify: `tools/check-recipes.mjs`
- Modify: `tools/check-rice-meal-preview.mjs`
- Modify: `tools/tests/rice-meal-catalog-validator.test.mjs`
- Modify: `tools/tests/rice-cooker-source-evidence.test.mjs`
- Modify: `tools/tests/rice-meal-selector.test.mjs`
- Modify: `tools/tests/rice-meal-compiler.test.mjs`
- Modify: `tools/tests/worker-rice-meal.test.mjs`
- Modify: `tools/tests/planner-v2-parity.test.mjs`
- Modify: `tools/tests/build-dist.test.mjs`
- Modify: `tools/tests/frontend-rice-meal-flow.test.mjs`

**Schema change:**
- `recipe_id` becomes optional legacy evidence identity.
- Every variant adds `evidence_refs: Array<{ kind:"recipe"|"source", id:string, supports:Array<"identity"|"quantity"|"liquid"|"appliance"|"process"> }>`.
- `evidence_refs` must be non-empty；validator 必须把 supports 与 recipe/source ledger 的实际能力、rights、verdict 和 `cannot_prove` 对拍。
- Ratio DSL binding uses `variant_id` as runtime identity; legacy `when.recipe_id` remains accepted only for migrated variants during this version.
- `recipe_id: null` is a valid stable response and signature value; `variant_id` is the runtime primary key everywhere.
- Build/Worker/local bridge must load `rice-cooker-source-evidence.v1.json`, expose ledger version/hash in health, and fail closed if assets are missing, stale or inconsistent.

- [ ] 写失败测试：source-only runtime variant 可以成立；无 evidence 的 variant 必须失败；未知 recipe/source evidence ID 必须失败；`research_only`/损坏页面不能证明执行参数但可以只证明 identity；recipe 标题不得覆盖真实 `display_name`；签名 plan 必须绑定 variant、ledger hash 与 ratio facts。
- [ ] 运行测试并观察现有一对一约束导致红灯。
- [ ] 实现渐进兼容 schema，迁移现有 11 个 variant，不改变 72 道 recipe 数据。
- [ ] Worker health、build、local bridge、前端结果验证和旅程脚本必须改为以 `variant_id` 重算；`recipe_id:null` 不得被误判为坏响应；DeepSeek 调用仍为 0。
- [ ] 运行 parity、worker、build 和聚合门禁，提交。

## Task 3: 建立受控调味料与过敏边界

**Files:**
- Modify: `tools/data/ingredient-taxonomy.v1.json`
- Modify: `tools/data/ratio-rules.v1.json`
- Modify: `tools/data/rice-meal-catalog.v1.json`
- Modify: `worker/src/rice-meal-catalog-validator.js`
- Modify: `worker/src/rice-meal-selector.js`
- Modify: `worker/src/rice-meal-compiler.js`
- Modify: `index.html`
- Modify: `tools/tests/ingredient-taxonomy.test.mjs`
- Modify: `tools/tests/rice-meal-catalog-validator.test.mjs`
- Modify: `tools/tests/rice-meal-compiler.test.mjs`
- Modify: `tools/tests/frontend-rice-meal-flow.test.mjs`

**Schema change:**
- Variant adds `controlled_seasonings[]` with `canonical_ingredient_id`, `amount_rule_id`, `required:true`, `phase`, `action_code`；`allergen_tags` 只能从 taxonomy 派生，catalog 不存第二份事实，也不允许自由文本 action。
- Allowed first-stage seasoning set: soy sauce, cooking wine, sesame oil, oyster sauce, curry block, sugar, salt, cooking oil.
- Seasonings do not count toward pantry coverage, but do appear in the final ingredient list、nutrition inputs、required extras、签名 plan 和 dislike/allergen checks；本期不新增营养总量 UI，A/B 仍按主要材料结构判级。
- `虾米` 是海鲜材料而非调味料，必须参与材料克数、营养、海鲜忌口、泡洗动作和安全终点。
- 复合调味 fixed profiles：酱油保守标记大豆/小麦；蚝油标记贝类/大豆/小麦；咖喱块标记小麦/奶/大豆；芝麻油标记芝麻。用户命中任一标签时 fail-closed。

- [ ] 写失败测试：咖喱块/蚝油/酱油不得只写在自然语言步骤；未知调味料或无克数调味料失败；海鲜忌口必须阻断蚝油/虾米；大豆/小麦忌口阻断酱油/咖喱块；奶忌口阻断咖喱块；芝麻忌口阻断芝麻油；调味料不能计作 protein/fiber；组装器不能新增目录外调味料。
- [ ] 运行定点测试并观察红灯。
- [ ] 从台湾食药署库为新增调味与材料建立精确 canonical/alias；查不到则保留估算，不伪装权威。
- [ ] selector 在候选阶段按 taxonomy 派生过敏标签并 fail-closed；编译器把受控调味料写入 locked ingredients、nutrition inputs、签名 plan 和 required extras；新增虾米泡洗、包装复合调味过敏标签确认、复合调味入锅、必要二次加热等白名单 action code；前端清楚区分“你提供的食材”和“还需准备的基础调味”。
- [ ] Worker 端到端测试锁定：调味忌口不产生候选、签名不可删除调味、生成结果不可把调味归零或漏列；鸡肉菜必须引用 74°C 熟制 endpoint。
- [ ] 运行 food、taxonomy、allergen parity、compiler 和前端测试，提交。

## Task 4: 合并地域框架和来源证据，不把阻断条目冒充上线

**Files:**
- Modify: `tools/data/rice-cooker-source-evidence.v1.json`
- Modify: `tools/data/rice-meal-collection.v1.json`
- Modify: `tools/tests/rice-cooker-source-evidence.test.mjs`
- Modify: `tools/tests/rice-meal-collection-data.test.mjs`
- Modify: `docs/rice-meal-regional-research.md`
- Regenerate: `docs/rice-meal-collection.md`
- Regenerate: `docs/rice-meal-collection.csv`

- [ ] 写失败测试：新增来源必须区分 identity、固定批量、有效液体、型号程序、通用化 blocker；受版权保护来源只能提取结构化事实，不复制原文/图片；损坏或含糊来源不能升 runtime。
- [ ] 运行测试并观察红灯。
- [ ] 合并三路调研：补充温州芥菜饭、泉州红蟳饭、冬菇滑鸡饭、豉汁排骨饭、施甸豌豆洋芋火腿焖饭、孔干饭家族、牛肉什锦饭等；将南京板鸭生熟、抓饭液体、孔干饭半熟沥汤等 blocker 明确写入。
- [ ] 新增厂商 evidence：牛肉什锦饭；番茄海鲜饭页面流程损坏必须 fail-closed，不能激活。
- [ ] 重新生成总表，确保所有 16 个 runtime/计划映射与研究候选可追踪。
- [ ] 运行 collection renderer 幂等、source evidence 与聚合门禁，提交。

## Task 5: 以内部 `calibration_preview` 激活 8 道真实命名菜饭

**Files:**
- Modify: `tools/data/ingredient-taxonomy.v1.json`
- Modify: `tools/data/ratio-rules.v1.json`
- Modify: `tools/data/rice-meal-catalog.v1.json`
- Modify: `tools/data/rice-meal-collection.v1.json`
- Modify: `worker/src/rice-meal-compiler.js`
- Modify: `tools/tests/rice-meal-catalog-data.test.mjs`
- Modify: `tools/tests/rice-meal-compiler.test.mjs`
- Modify: `tools/build-dist.mjs`
- Modify: `worker/src/worker.js`
- Modify: `index.html`
- Modify: `tools/tests/build-dist.test.mjs`
- Modify: `tools/tests/worker-rice-meal.test.mjs`
- Modify: `tools/tests/frontend-rice-meal-flow.test.mjs`

**Activation batch:**
- `高丽菜饭` — B；虾米只作风味，不冒充完整蛋白。
- `南瓜饭` — A；猪肉末与南瓜为实质角色，二次加热写成明确机型条件。
- `咖喱鸡肉饭` — A；咖喱块进入受控调味与钠/热量。
- `懒人焖饭（腊肠什锦版）` — B；保留厂商原始标题与版本描述，腊肠量不足时不宣称充足蛋白。
- `牛肉什锦饭` — A；项目家庭版明确提高牛肉与蔬菜份量。
- `鲜蔬竹笋饭` — B；竹笋和蔬菜为实质纤维，不夸大少量肉末。
- `什锦鸡饭` — A；鸡肉/豆腐和蔬菜按项目标准补足。
- `鲜香菇饭` — B；香菇为实质纤维，少量鸡肉不冒充完整蛋白。

- [ ] 先写 8 道失败测试：显示名、source evidence、默认两人试做克数、液体语义、来源固定批量、预处理、调味、熟制终点和 A/B 等级逐条锁定；多蛋白只在至少一个蛋白贡献项独立达到其类别阈值时算实质蛋白，不跨类别简单相加。
- [ ] 运行测试并观察条目缺失红灯。
- [ ] 添加 taxonomy、Ratio DSL、catalog、collection 和人工受控文案；每道先只支持 `[2]` 两人项目试做批次，标注来源固定批量与项目家庭适配差异，状态统一为 `calibration_preview`，页面明确“家庭适配待试做”。
- [ ] 禁止把品牌水位线换算成未经验证的克数；通用版只使用明确标为项目标准的 added-water contract。
- [ ] 新增项目标准只能进入 `calibration_preview`，不能伪装来源原方、不能自动升 `preview_ready`；1/3/4 人份必须在对应批次试做后逐档开放。
- [ ] 默认 `riceCatalogScope:"ready"` 只可见原 8 道；内部 `riceCatalogScope:"calibration"` 可见 16 道（8 ready + 8 calibration）；health/build meta/前端三方必须显示 scope 与两种计数；planned/blocked 条目不因数量放宽。
- [ ] 来源展示：带内部 recipe evidence 的条目显示“查看一锅出标准配方”；source-only 条目显示“查看事实来源”，不得因 `recipe_id:null` 消失或错链。
- [ ] 运行 catalog、compiler、nutrition、source、collection 与聚合门禁，提交。

## Task 6: 用食材覆盖和“换一道”验证 16 道目录深度

**Files:**
- Modify: `tools/data/rice-meal-journeys.v1.json`
- Modify: `tools/tests/rice-meal-selector.test.mjs`
- Modify: `tools/tests/worker-rice-meal.test.mjs`
- Modify: `tools/tests/frontend-rice-meal-flow.test.mjs`
- Modify: `tools/check-rice-meal-preview.mjs`

- [ ] 先写失败旅程：南瓜+猪肉末+香菇；卷心菜+香菇；鸡胸+土豆+胡萝卜+洋葱；腊肠+青豆+玉米+胡萝卜+香菇；牛肉末+胡萝卜+洋葱；竹笋+洋葱+胡萝卜；鸡肉+豆腐+胡萝卜+香菇；香菇+芹菜。
- [ ] 断言 2 项输入必须 2/2、3 项至少 2/3、4–6 项至少 60%，且不靠新增主要食材刷覆盖；候选名必须是目录真实名字。
- [ ] 对高频 4–6 项组合要求至少两个不同有效计划时才显示“换一道”；没有同等承诺的替代时返回 `no_alternative_plan` 并保留当前结果。
- [ ] 运行 selector、worker、front、旅程和 Preview gate；只修真实覆盖/解释问题，不增加自由组合模板。
- [ ] 提交。

## Task 7: 全量验证、真实浏览器多旅程与 Preview 交付

**Files:**
- Modify: `docs/pantry-planner-v2-preview-feedback.md`
- Modify: `docs/first-customers-pilot.md`
- Modify: `docs/rice-meal-regional-research.md`

- [ ] 运行 `node tools/check-foods.mjs`、`node tools/check-recipes.mjs`、全部 Node 测试、Python 语法检查、collection 幂等和 `tools/build-dist.mjs` 字节一致性。
- [ ] 分别构建 `riceCatalogScope=ready` 与 `calibration`；确认全旅程零 DeepSeek，recipe 总数仍为 72，普通 Pilot 可见 8 道，内部校准可见 16 道。
- [ ] 至少 3 个真实 Chrome 手机视口角色逐项点击输入、候选、选菜、返回、忌口和换一道；重点跑 2/3/4/6 项覆盖、新增 8 道、份数缩放、调味/过敏、安全终点和无替代路径。
- [ ] 人眼检查名称、配料表、实际步骤和来源说明一致；禁止机械名字、锅外新增主料或工程术语。
- [ ] 发现问题先补失败测试再修，重复到无阻断。
- [ ] 更新 Draft PR，推送当前分支；只把内部 calibration 构建部署到 `recipe-validation` 给产品 owner 试做，5 人 Pilot 入口继续冻结；三方核对 `/health`、`/build-meta.json` 和页面 build meta。禁止 production。
