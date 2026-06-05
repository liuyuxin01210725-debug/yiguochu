# 一锅出 — 项目说明（AI agent 与开发者必读）

「今天吃什么」家常菜营养配餐 PWA。菜谱由 LLM(DeepSeek) 生成，营养由本地权威库查表纠偏。
- 前端：`index.html`（单文件）
- 云端代理：`worker/src/worker.js`（Cloudflare Pages Functions，持 DeepSeek key）
- 本地调试代理：`ai_proxy.py`（localhost:8765）
- 线上：https://yiguochu.pages.dev

---

## 🔴 营养数据红线规则（最重要 · 不可违反）

菜名/食材/做法可以由 LLM 生成，但**营养数值绝不允许 LLM 现编或 AI 凭记忆估填后当权威值用**。

机制：`index.html` 的 `FOODS` 本地库存每 100g 权威营养值；`mapDish()` 对每个食材调 `lookupFoodNutrition()` 查库——命中用库值并标 `est=false`，未命中才回退 AI 值并标 `est=true`（UI 会显示"估"并提示"含 N 项估算"）。

**往 `FOODS` 加任何新食材，必须遵守：**

1. **每条营养值来自联网核实的权威源**，不许凭记忆/常识直接填当权威值。权威源：
   - USDA FoodData Central — https://fdc.nal.usda.gov （有免费 API，附 FDC ID）
   - 《中国食物成分表》在线平台 — https://nlc.chinanutri.cn
2. **逐条标注来源**：在该批条目上方注释写明来源（USDA FDC ID / 成分表版本）。
3. **基线一致**：中式家常食材优先《中国食物成分表》；中西差异大的项（如大米钙、牛里脊热量）选定一个基线并全库统一，不要混用。
4. **生/熟、部位分清**：生米≠熟饭（≈3 倍差）。同名不同态要么单列条目、要么用 `FOOD_ALIAS` 精确钉死，严禁让 `baseFoodName` 把生的错配成熟的。
5. **调味料归零**：盐/酱油/姜/葱/蒜/料酒/油等用量小、营养可忽略的辅料，加进 `SEASONINGS`，不计入营养、不算估算。
6. **查不到就诚实标估算**：长尾/冷僻食材若无权威值，保留 `est=true`，不要伪装成权威值。

> 一句话铁律：**宁可标"估算"，也不许把蒙的数字当权威。**

---

## 加新食材 SOP

1. 联网查 USDA FDC / 中国成分表，拿每 100g 营养值 + 记下来源。
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
- `mapDish()` — 把 LLM 返回映射成 dish，逐食材查库定 `est`

---

## 部署（详见 `部署说明.md`）

Cloudflare Pages 同源部署。简版：
1. 重建 `dist/`：复制前端文件 + `worker/src/worker.js`→`dist/_worker.js`，并把 `dist/index.html` 的 `PROXY_BASE` 改成同源 `''`。
2. `npx wrangler pages deploy dist --project-name yiguochu --branch main --commit-dirty=true --commit-message "..."`
3. ⚠️ `--commit-message` 必须用 **ASCII**——git 历史里有中文，wrangler 自动读取会触发 Cloudflare 的 "Invalid commit message, must be valid UTF-8" 报错。
4. `dist/` 和 `worker/.wrangler/` 已 gitignore，不提交。

---

## 营养数据现状（截至 2026-06）

- `FOODS` 161 条；实测命中率 ~93%，按克重权威值占比 ~95%。
- 新增的 10 条主料 + 辣白菜已联网核对(USDA/中国表)，校正过 5 项偏差。
- **待办**：系统化接入《中国食物成分表》（目前无免费可商用的结构化数据源，靠逐条联网核对）；长尾食材持续补；盐/酱料钠目前归零，规模化前需重做钠精度。
