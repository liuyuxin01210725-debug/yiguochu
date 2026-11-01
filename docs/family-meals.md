# 一锅出 · 家庭常吃与本周待试（2026-11 家庭重启）

**分支：** `family-restart`  
**主场景（已定）：** 工作日女儿早餐（全家晚饭标 **未验证**，本周不承诺覆盖）  
**权威终案：** box `shared/yiguochu/triad-final-2026-11-01.md`  
**数据源：** `tools/data/rice-meal-catalog.v1.json`（`catalog_version`: `rice-meal-catalog-v1-20260802-r7`）  
**纪律：** `preview_ready` ≠ 家庭已验证；本周不补 catalog 代码、不合 main、不部署。

---

## 1. 真实在吃 / 常吃（先写家，再对照目录）

来源以家庭口述与重启动机为准；**未在本仓做过厨房实测与克数记录的，一律标诚实缺口**，不得写成产品已验证。

| 形态 | 谁在吃 | 场景 | 来源 | 实测细节 | 备注 |
|---|---|---|---|---|---|
| 蔬菜汤泡饭 / 一锅出类早餐 | 女儿（常）· 全家爱吃 | 工作日早餐；亦可带饭思路 | 家庭口述 / 重启动机（审计 §0） | **未实测**：无固定菜名、无克数、无电饭煲步骤对照、无「吃光/剩了」账本 | 动机最强；形态贴近一锅/一碗，但 **不等于** 目录里任一道 `preview_ready` |
| 一锅出类菜饭（口语泛称） | 女儿 / 全家 | 近期常做 | 家庭口述 / 重启动机 | **未实测到具体 variant_id**；不能冒认成下列 8 道之一已在家验证 | 本周要用目录菜时，必须标「待试」后实做 |

> 本表可后续追加「带饭 / 全家晚饭」行；在未实做前保持 **未验证**，禁止口头承诺本周覆盖。

---

## 2. 目录 8 道 `preview_ready`（ready 可见集）对照

构建 `--rice-catalog-scope ready` 实际放出的是 status ∈ `{preview_ready, pilot_observed, production_approved}`。  
当前仓内 **恰好 8 道**，全部为 `preview_ready`；**0** 道 `pilot_observed` / `production_approved`。  
每条 `review_note` / `preview_notice` 仍指向「待真实厨房反馈」类表述——**一律不得写成家庭已验证**。

| # | 菜名 | variant_id | status | 中途开盖 | 配料数 | 锅外预步骤数（pre） | 对照家庭常吃 | 本周处置 |
|---|---|---|---|---|---:|---:|---|---|
| 1 | 西兰花牛肉焖饭 | `home-broccoli-beef-rice` | preview_ready | 否 | 2 | 3（含嫩蔬锅外焖沥） | 未覆盖「汤泡饭」；未家庭验证 | 暂不进可见候选 |
| 2 | 白菜豆腐焖饭 | `home-cabbage-tofu-rice` | preview_ready | 否 | 2 | **2**（最少） | 软口、步骤相对少；未家庭验证 | **本周待试①** |
| 3 | 鸡腿土豆焖饭 | `home-chicken-leg-potato-rice` | preview_ready | 否 | 2 | 3（含切鸡腿） | 偏晚饭份量感；晨间切鸡腿成本高；未验证 | 暂缓 |
| 4 | 玉米胡萝卜鸡腿焖饭 | `home-corn-carrot-chicken-leg-rice` | preview_ready | 否 | 3 | 3（含切鸡腿） | 配料更多；晨间成本高；未验证 | 暂缓 |
| 5 | 豆角排骨焖饭 | `home-green-bean-pork-rib-rice` | preview_ready | 否 | 2 | 3（排骨锅外预煮） | 预煮重；偏正餐；未验证 | 暂缓 |
| 6 | 肉糜青菜饭 | `home-greens-minced-pork-rice` | preview_ready | 否 | 2 | 3（肉糜锅外炒 + 青菜锅外） | 贴近「青菜+肉+饭」早餐形态；未验证 | **本周待试②** |
| 7 | 香菇豆角排骨焖饭 | `home-mushroom-green-bean-pork-rib-rice` | preview_ready | 否 | 3 | 3（排骨锅外预煮） | 配料与预煮更重；未验证 | 暂缓 |
| 8 | 上海咸肉菜饭 | `shanghai-salted-pork-rice` | preview_ready | **是**（`requires_mid_cook_opening: true`） | 2 | 3 + mid 1 | 终案明确首周排除 | **排除** |

### 缺口（只记，本周不补代码）

| 缺口 | 说明 | 本周动作 |
|---|---|---|
| 蔬菜汤泡饭 / 汤泡饭变体 | 家庭真实在吃，catalog **无**对应 variant | 只记缺口；不新写 schema / 不扩目录 |
| 已验证家庭菜 = 0 | 8 道皆 `preview_ready`，厨房 observations 仍空 | 靠实做 +「吃光/剩了」升级，不改 status 字段冒充 |
| 可见集仍是 8 道 | `ready`/`calibration` 二档；无「家庭 ≤2」白名单开关 | 见 §4；本周 **不改** selector/compiler |

---

## 3. 本周可见候选（≤2 · 均标「待试」）

| 优先级 | 菜名 | variant_id | 标签 | 为何选 | 明确不是 |
|---|---|---|---|---|---|
| 1 | 白菜豆腐焖饭 | `home-cabbage-tofu-rice` | **待试** | 无中途开盖；pre 步骤最少；豆腐+白菜口感偏软，更贴女儿早餐试做；审计亦点名为相对稳妥 | 不是家庭已验证；不是汤泡饭替代品已证明 |
| 2 | 肉糜青菜饭 | `home-greens-minced-pork-rice` | **待试** | 无中途开盖；肉糜+青菜贴近近期「一锅出类早餐」口述；审计点名稳妥；比切鸡腿/预煮排骨更适合晨间 | 不是家庭已验证；锅外炒肉糜仍有晨间成本，实做后再判 |

### 排除说明（摘录）

- **上海咸肉菜饭：** `requires_mid_cook_opening: true`，依赖剩余时间显示与开盖后自动续煮机型；终案 / 审计首周禁止进入可见候选。
- **排骨两道 / 鸡腿两道：** 无中途开盖，但预煮或切配更重，不优先作工作日早餐第一刀。
- **西兰花牛肉焖饭：** 可后续；本周先压到 2 道以内。

### 实做记录栏（二元反馈 · 先写在此 md）

| 日期（Asia/Shanghai） | 菜名 | 谁吃 | 吃光 / 剩了 | 开页→按下开始键（分） | 一句话 |
|---|---|---|---|---|---|
| （待填） | 白菜豆腐焖饭 |  |  |  |  |
| （待填） | 肉糜青菜饭 |  |  |  |  |

早晨计时目标 ≤3 分钟；达不到标 **未达成**，不硬凑。

---

## 4. 可见集再收窄到 ≤2？——结论：本周只文档

现状：

- `start.command` 已锁 `--rice-catalog-scope ready`（相对 calibration 已收窄到 8 道）。
- `worker/src/rice-meal-selector.js` / `rice-meal-compiler.js` 仅认识 `ready` | `calibration` 两档 status 集合；**没有** variant_id 白名单或「家庭可见 ≤2」开关。

若要把 UI 真只露出本周 2 道，需要改 selector/compiler（或新 scope / 新过滤配置）并回归契约测试——属 **schema/runtime 级**，超出「最小改动」。

**本周决定：不做该代码收窄；以本文档 §3 为人工可见候选与实做次序。** 清单备忘（以后再说，本周禁止动手）：

1. 可选：`YIGUOCHU_FAMILY_VARIANT_ALLOWLIST=home-cabbage-tofu-rice,home-greens-minced-pork-rice` 一类环境变量，在 selector 入口过滤（须同步 compiler / 本地 bridge / 契约测试）。
2. 或临时降级其余 6 道 status（**禁止**：污染目录真相、易把「待试」误写成不可见=已否决）。
3. 勿用 calibration 回退；勿为收窄重开推荐平台。

---

## 5. 本周 Out（重申）

- 不合 `main`、不 deploy、不 DeepSeek 主线、不动 923/`/lab`
- 不把 `preview_ready` 叫成家庭已验证
- 不扩推荐能力；缺口只记 md
- 全家晚饭 / 带饭路径：**未验证**

---

*落盘：2026-11-01 Asia/Shanghai。只新增本文档；未改 catalog / selector / 未部署。*
