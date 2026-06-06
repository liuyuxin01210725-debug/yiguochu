# 一锅出 — 项目说明（AI agent 与开发者必读）

「今天吃什么」家常菜营养配餐 PWA。菜谱由 LLM(DeepSeek) 生成，营养走**两层权威查表纠偏**：① worker 端用台湾食药署全量库(2181 条)覆盖命中食材 → ② 前端本地 `FOODS` 库兜底 → ③ 都没命中才标 AI 估算。
- 前端：`index.html`（单文件，含本地 `FOODS` 库 + 三层取值逻辑）
- 云端代理：`worker/src/worker.js`（Cloudflare Pages Functions，持 DeepSeek key + 第二层台湾库兜底 `enrichWithTw`）
- 权威数据底座：`tools/data/foods-tw.json`（台湾食药署库简体版 2181 条，部署时复制进 `dist/` 供 worker `ASSETS.fetch` 读取）；构建脚本 `tools/build-foods-tw.mjs`
- 本地调试代理：`ai_proxy.py`（localhost:8765）
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
5. **调味料归零**：盐/酱油/姜/葱/蒜/料酒/油等用量小、营养可忽略的辅料，加进 `SEASONINGS`，不计入营养、不算估算。
6. **查不到就诚实标估算**：长尾/冷僻食材若无权威值，保留 `est=true`，不要伪装成权威值。

> 一句话铁律：**宁可标"估算"，也不许把蒙的数字当权威。**

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
1. 重建 `dist/`：复制前端文件 + `tools/data/foods-tw.json`(worker 第二层库, 不复制会丢台湾库兜底) + `worker/src/worker.js`→`dist/_worker.js`；给 `dist/sw.js` 缓存版本注入时间戳(自动清旧缓存)。**PROXY_BASE 已在 index.html 运行时自适应(localhost→本地/线上→同源), 无需替换。**
2. `npx wrangler pages deploy dist --project-name yiguochu --branch main --commit-dirty=true --commit-message "..."`
3. ⚠️ `--commit-message` 必须用 **ASCII**——git 历史里有中文，wrangler 自动读取会触发 Cloudflare 的 "Invalid commit message, must be valid UTF-8" 报错。
4. `dist/` 和 `worker/.wrangler/` 已 gitignore，不提交。

---

## 营养数据现状（截至 2026-06）

- **两层权威库已上线**：worker 端台湾食药署全量库 2181 条(`tools/data/foods-tw.json`, OGDL-Taiwan-1.0) + 前端本地 `FOODS` 161 条。
- 前端本地库实测命中率 ~93%(按克重 ~95% 权威值)；worker 第二层再覆盖前端没有的长尾食材(实测一道菜可命中 4+ 项台湾权威)。
- 本地 `FOODS` 新增的 10 条主料 + 辣白菜已联网核对(USDA/中国表)，校正过 5 项偏差。
- **署名义务(待加到 UI)**：台湾库 OGDL-Taiwan-1.0 要求标注来源——需在 app(关于页/营养面板注脚)写明「营养数据部分采自台湾卫福部食药署 食品营养成分资料库」。
- **待办/可优化**：
  - worker 命中靠精确/基名匹配，加「大陆↔台湾别名表」(西红柿→番茄、土豆→马铃薯、大米→白米…)可提升命中率。
  - worker 层暂未做调味料归零(盐等靠前端 `isSeasoning` 兜)，可在 worker 也加一致处理。
  - 长尾食材持续补；盐/酱料钠规模化前需重做精度。
  - 大陆《中国食物成分表》仍无免费可商用结构化源——台湾库(同为中式食材、可商用)已作为替代落地。
