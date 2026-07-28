# 一锅出 — 项目说明（AI agent 与开发者必读）

按需打开的家常一锅主餐 PWA：用户选择这次做饭目的、份数、现有食材和忌口，快速得到一锅/一碗方案；不做每日打卡、周营养累计或长期饮食追踪。菜谱由 LLM(DeepSeek) 生成，营养走**两层权威查表纠偏**：① worker 端用台湾食药署全量库(2181 条)覆盖命中食材 → ② 前端本地 `FOODS` 库兜底 → ③ 都没命中才标 AI 估算。
- 前端：`index.html`（单文件，含本地 `FOODS` 库 + 三层取值逻辑）
- 云端代理：`worker/src/worker.js`（Cloudflare Pages Functions，持 DeepSeek key + 第二层台湾库兜底 `enrichWithTw`）
- 权威数据底座：`tools/data/foods-tw.json`（台湾食药署库简体版 2181 条，部署时复制进 `dist/` 供 worker `ASSETS.fetch` 读取）；构建脚本 `tools/build-foods-tw.mjs`
- Planner V2 结构化资产：`tools/data/ingredient-taxonomy.v1.json`、`tools/data/meal-templates.v2.json`、`tools/data/ratio-rules.v1.json`。规划器组合能力由 template rules + ingredient taxonomy 决定；72 道 recipe 只提供技法、安全、比例和来源 evidence。
- 本地调试代理：`ai_proxy.py`（localhost:8765）。生成契约的权威源仍是 `worker/src/worker.js`；涉及份数、场景或 prompt 时，需要同步更新本地代理并跑语法检查，避免本地/线上行为漂移。
- 线上：https://yiguochu.pages.dev

---

## 🔴 营养数据红线规则（最重要 · 不可违反）

菜名/食材/做法可以由 LLM 生成，但**营养数值绝不允许 LLM 现编或 AI 凭记忆估填后当权威值用**。

机制：`index.html` 的 `FOODS` 本地库存每 100g 权威营养值；`mapDish()` 对每个食材调 `lookupFoodNutrition()` 查库——命中用库值并标 `est=false`，未命中才回退 AI 值并标 `est=true`（UI 会显示"估"并提示"含 N 项估算"）。

**往 `FOODS` 加任何新食材，必须遵守：**

1. **每条营养值来自权威源**，不许凭记忆/常识直接填当权威值。权威源(优先级从高到低)：
   - **台湾食药署食品营养成分库** — 已落地 `tools/data/foods-tw.json`(2181 条, 简体, 中式食材)。授权 OGDL-Taiwan-1.0 **可商用(须署名)**。**首选：加食材先查这里**。
   - USDA FoodData Central — https://fdc.nal.usda.gov （有免费 API，附 FDC ID；台湾库没有时用）
   - 《中国食物成分表》在线平台 — https://nlc.chinanutri.cn
2. **逐条标注来源**：在该批条目上方注释写明来源（USDA FDC ID / 成分表版本）。
3. **基线一致**：中式家常食材优先《中国食物成分表》；中西差异大的项（如大米钙、牛里脊热量）选定一个基线并全库统一，不要混用。
4. **生/熟、部位分清**：生米≠熟饭（≈3 倍差）。同名不同态要么单列条目、要么用 `FOOD_ALIAS` 精确钉死，严禁让 `baseFoodName` 把生的错配成熟的。
5. **只允许小用量香辛料归零**：姜/葱/蒜/香料/醋/料酒等可放入 `SEASONINGS`；油、糖、盐、酱油、豆瓣酱等必须查库或诚实标估算，不能归零，否则会系统性低估热量和钠。
6. **查不到就诚实标估算**：长尾/冷僻食材若无权威值，保留 `est=true`，不要伪装成权威值。

> 一句话铁律：**宁可标"估算"，也不许把蒙的数字当权威。**

---

## 🔴 菜谱来源与 Phase A 红线

1. **RecipeDB 只用于研究**：可用来发现菜名、地域和技法，但不得把其数据、原文或完整做法复制进生产库、线上运行包或生成请求。RecipeDB 的许可带有非商业和相同方式共享限制，不能当作生产授权。
2. **代码许可不等于菜谱许可**：GitHub 仓库的代码 license 只覆盖该仓库代码，不自动授权仓库抓取、汇总或引用的第三方菜谱内容。每条菜谱必须单独核验原始来源与许可。
3. **approved 基础菜谱必须可追溯**：每条 `status: "approved"` 的基础菜谱都必须至少有一条 `source_refs[].usage: "approved"`，且同时包含直达原始内容的 HTTPS `url`、`title`、`license`、`attribution` 和 `retrieved_at`；缺一项不得上线。`auto_approved` 为自动闸门通过档（传统地方菜晋升产物，待人工评审），不要求外部溯源五要素，但不得对外宣称人工批准。
4. **替换必须显式**：原料替换只能写进结构化 `substitution_slots`，明确 `replaces` 和 `allowed`；不得让模型自行把未批准食材当作等价替换。
5. **提交或部署前必跑**：`node tools/check-recipes.mjs`。该聚合门禁保留菜谱/候选/晋升检查，并用现有权威 validator 校验 ingredient taxonomy、meal templates、Ratio DSL 和 evidence recipe IDs；任一项不通过时禁止提交和部署。
6. **Phase A 仅限预览**：只能部署到非 `main` 的 `recipe-validation` preview branch，禁止部署或提升到 production `main`。Wrangler 的 `--commit-message` 必须使用 ASCII。

Phase A 自动闸门通过不等于人工批准：当前 100 例 corpus 仍有 **6 个 known gaps**（4 个 diet 合规 + 2 个任意克数 numeric ratio）必须人工复核；30 例 live smoke 也不能替代 `docs/recipe-validation-review.md` 的逐例人工评审。

### Phase A exit gate

在以下条件全部满足且用户批准前，不得开始 150–200 道菜谱扩展：12/12 基础菜谱通过来源与 schema；100/100 静态回归通过；30/30 本地 live 返回 trusted base recipe ID、pairing basis 且无 validation flags；allergen leak 为 0；未使用却列入成品的非调味食材为 0；禽肉、猪肉、海鲜、鸡蛋均有明确熟制证据；移动端清楚显示搭配依据、这次没用和来源署名；“换一换”得到不同基础菜谱或 family；6 个 known gaps 完成人工复核；用户审阅并批准 30 例人工评审表。

---

## 加新食材 SOP

1. **先查 `tools/data/foods-tw.json`**(台湾权威库 2181 条)取每 100g 营养值；查不到再联网 USDA FDC / 中国成分表。记下来源(台湾库记 `code`，如 `E6800101`)。**绝不许跳过查证直接填——这是红线。**
2. 加进 `FOODS`（字段顺序照现有条目：`id, name, category, kcal, p, mg, k, ca, fe, zn, na, vc, vd, fb, w3`；干货加 `form:'dry'`）。
3. 名字变体 / 同义 / 生熟 → 加 `FOOD_ALIAS`（key 用 `normFoodName` 形式：半角括号、无空格、小写）。基名 alias 会自动覆盖带括号变体（如 `虾仁`→f-18 覆盖 `虾仁(鲜)`）。
4. **必跑体检**：`node tools/check-foods.mjs`（不联网、秒回；查重复 id / 缺字段 / 异常值 / 匹配回归 / 调味料归零）。**不通过禁止提交。**
5. 可选回测命中率：见 `tools/` 或重建一个调 proxy 的脚本（会花少量 DeepSeek 调用）。
6. 提交 → 部署。

---

## 关键代码位置（index.html）

营养"精度层"在 `// ===== 精度层` 到 `// ---- 无感记忆层` 之间：
- `NUTRIENTS` — 12 营养素定义
- `FOODS` — 本地权威食物库
- `FOOD_ALIAS` — 同义/生熟/变体 → id 映射
- `SEASONINGS` / `isSeasoning()` — 调味料归零集合
- `lookupFoodNutrition()` — 查表：调味料→零贡献 stub → alias → 全名精确 → 去括号基名精确
- `mapDish()` — 把 LLM 返回映射成 dish，**三层取值**定 `est`：worker 标 `auth:'tw'` 的用台湾权威值 → 本地 `lookupFoodNutrition` 命中用本地库 → 都没有才 `est=true`

**worker 第二层**（`worker/src/worker.js`）：`getTwLib()` 经 `env.ASSETS` 读 `/foods-tw.json` 并缓存；`twLookup()` 高置信匹配(全名/去括号基名精确)；`enrichWithTw()` 在 `normalizeMeal` 后用台湾权威值覆盖命中食材、标 `auth:'tw'`+`authCode`。**只做高置信匹配、绝不模糊**，守住"不蒙"底线。

---

## 部署（详见 `部署说明.md`）

Cloudflare Pages 同源部署。简版：
1. 重建 `dist/` 只使用 `node tools/build-dist.mjs --out-dir dist --build-id "<ascii-build-id>"`。该脚本统一收集前端、Worker 完整依赖图、营养/菜谱数据和三份 Planner V2 资产，并注入 service worker 缓存版本；不再保留手工 `cp` 流程。**PROXY_BASE 已在 index.html 运行时自适应(localhost→本地/线上→同源), 无需替换。**
2. Phase A 只允许预览部署：`npx wrangler pages deploy dist --project-name yiguochu --branch recipe-validation --commit-dirty=true --commit-message "recipe validation preview"`；禁止使用 `--branch main` 或提升到 production。
3. ⚠️ `--commit-message` 必须用 **ASCII**——git 历史里有中文，wrangler 自动读取会触发 Cloudflare 的 "Invalid commit message, must be valid UTF-8" 报错。
4. 部署前必须运行 `node tools/check-recipes.mjs` 和 `node tools/run-pantry-planner-v2-journeys.mjs`；预览 `/health` 必须报告 `recipeLibrary: "ok"`、`plannerAssets: "ok"`、`recipeFamilies: 21`、`baseRecipes: 72`（72 = 12 道 `approved` 人工批准 + 60 道 `auto_approved` 自动闸门通过待评审），并报告 `pantry-planner-v2` / `templates-v2-20260728-r13` / `taxonomy-v1-20260728-r10` / `ratio-rules-v1-20260728-r6` 及 11 个 active + 5 个 planned templates；真实旅程门禁当前为 138/138。
5. `dist/` 和 `worker/.wrangler/` 已 gitignore，不提交。

Pantry Planner V2 当前仍只在 Draft PR 与 `recipe-validation` Preview 验证，尚未部署 production；自动门与 Preview 通过也不代表获得 production 发布授权或人工菜谱批准。

---

## 排查踩坑

- ⚠️ **前端 `network`「网络没接上」是误导性错误码**：被 CORS 拦掉、或 fetch 打到错误 origin 时，浏览器抛 `TypeError: Failed to fetch`，前端 `index.html` 一律归成 `network`，与真断网**同一句文案**。生成失败先验 **CORS/来源**，别先怀疑网络/线路/大陆访问 pages.dev。
- ⚠️ **`curl` 是这类问题的废证据**：curl 默认不发浏览器 `Origin`、也不执行 CORS（CORS 是浏览器单方面强制）。`curl 200 ≠ 浏览器能用`。验 CORS 要 `curl -H "Origin: ..."` 看响应的 `Access-Control-Allow-Origin` 是否反射。
- 现状修复（commit `eb5ba6a`）：worker `corsHeaders` 反射 `null`/`localhost`/`*.yiguochu.pages.dev`（非写死单域名）；前端 `apiCandidates` 在 `file:`/预览子域/非同源时回退绝对地址 `https://yiguochu.pages.dev/generate-meal`。PWA 装到主屏、从预览子域打开等场景都靠这两条兜住。

---

## 营养数据现状（截至 2026-06）

- **两层权威库已上线**：worker 端台湾食药署全量库 2181 条(`tools/data/foods-tw.json`, OGDL-Taiwan-1.0) + 前端本地 `FOODS` 161 条。
- 前端本地库实测命中率 ~93%(按克重 ~95% 权威值)；worker 第二层再覆盖前端没有的长尾食材(实测一道菜可命中 4+ 项台湾权威)。
- 本地 `FOODS` 新增的 10 条主料 + 辣白菜已联网核对(USDA/中国表)，校正过 5 项偏差。
- **署名义务（已落地 index.html）**：台湾库 OGDL-Taiwan-1.0 要求标注来源——index.html 营养面板注脚已写明「营养数据部分采自 台湾卫生福利部食品药物管理署『食品营养成分资料库』（依政府资料开放授权条款 OGDL-Taiwan-1.0）」，改动营养面板时不得删除。
- **待办/可优化**：
  - worker 命中靠精确/基名匹配，加「大陆↔台湾别名表」(西红柿→番茄、土豆→马铃薯、大米→白米…)可提升命中率。
  - worker 层暂未做调味料归零(盐等靠前端 `isSeasoning` 兜)，可在 worker 也加一致处理。
  - 长尾食材持续补；盐/酱料钠规模化前需重做精度。
  - 大陆《中国食物成分表》仍无免费可商用结构化源——台湾库(同为中式食材、可商用)已作为替代落地。
