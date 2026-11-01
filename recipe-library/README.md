# 一锅出 · 菜谱库（P0 骨架）

**分支：** `family-restart`  
**日期：** 2026-11-01 Asia/Shanghai  
**定位：** 独立可执行卡库——收齐「一锅出」做法，早晨能照着做。  
**权威产品定义：** Page `c9e6ebce-1feb-4aaf-8c95-6a760050953f` · box `shared/yiguochu/yiguochu-product-definition-2026-11-01.md`

## 明确不是

- **不**接 `/plan-meal`、`/generate-plan`、旧 coverage matcher、旧 `recipe-library.json` 运行时
- **不**冒充家庭已验证（`preview_ready` ≠ `已验证`）
- **不**合 main、不部署、不装壳

## 目录

```
recipe-library/
  README.md          ← 本说明
  schema.json        ← 卡片字段约定（JSON Schema）
  index.json         ← 库目录（列表用）
  cards/*.json       ← 每道一卡
  browse.html        ← 简单浏览页（人用）
  cli.py             ← 列出 / 打开 / 新建卡
  serve.command      ← 局域网静态打开浏览页
```

## 卡片字段（最小）

| 字段 | 说明 |
|---|---|
| `name` | 名称 |
| `form` | 形态：菜饭 / 焖饭 / 汤泡饭 / 咖喱一锅 / 手抓饭 / 煲类一锅 / 其他一锅 |
| `servings` | 份量（家用量或克数） |
| `steps_now` | **现在动手**步骤（早晨可跟） |
| `time_minutes` | 耗时（`active` 动手 + `total` 含焖煮） |
| `packable` | 是否适合打包 |
| `source` | 诚实来源（口述 / 试成 / 书或可靠食谱改写 / 目录候选未验证 / 网络常见改写） |
| `status` | `待试` \| `已验证`（有家里反馈才可升） |

完整约束见 `schema.json`。另建议填：`ingredients`、`pack_notes`、`prep_optional`、`notes`。

## 如何收录一张新卡

### 方式 A · CLI（推荐）

在仓根或本目录：

```bash
cd "/Users/liuyuxin/Documents/一锅出/recipe-library"
python3 cli.py new my-card-id --name "菜名" --form 焖饭
```

会生成 `cards/my-card-id.json` 模板并挂进 `index.json`。然后编辑该 JSON：补步骤、份量、来源、耗时；`status` 默认 `待试`。

校验 / 列表 / 打开：

```bash
python3 cli.py list
python3 cli.py show baicai-doufu-menfan
python3 cli.py validate
```

### 方式 B · 手写 JSON

1. 复制任一样例卡为 `cards/<id>.json`（`id` 仅小写字母数字与短横线）。
2. 改字段；`source.label` 必须诚实（不要写「已验证」除非真做过）。
3. 在 `index.json` 的 `cards` 数组追加一行摘要（或跑 `python3 cli.py reindex`）。
4. `python3 cli.py validate` 通过即可。

### 入库纪律

- 宁缺毋滥：无可执行步骤的灵感图不进库。
- 边界看**制作方式**（一锅/电饭煲出），不看菜系国籍。
- 只有家里实做并留下吃光/剩了/打包等反馈后，才把 `status` 改为 `已验证`。

## 浏览

### CLI

```bash
python3 cli.py list
python3 cli.py show qingcai-doufu-tangpaofan
```

### 浏览页

```bash
cd "/Users/liuyuxin/Documents/一锅出/recipe-library"
python3 -m http.server 8092 --bind 0.0.0.0
```

浏览器打开 `http://127.0.0.1:8092/browse.html`（手机用本机局域网 IP:`8092`）。  
或双击 `serve.command`。

## 当前库规模（均为待试，除非另标）

截至 2026-11-01 Asia/Shanghai：`python3 cli.py validate` → **57 张卡**。

本批大量条目改编自开源数据集（UniTools CC BY-SA 4.0、Wikibooks Cookbook CC BY-SA 3.0）及家常网络常见做法改写；`source.refs` 含 URL/slug。详见 box：`/home/box/shared/yiguochu/recipe-sources-2026-11-01.md`。

### 最初骨架样例

| id | 名称 | 形态 | 来源摘要 |
|---|---|---|---|
| `baicai-doufu-menfan` | 白菜豆腐焖饭 | 焖饭 | 旧仓目录候选整理 · 未家庭验证 |
| `roumi-qingcai-fan` | 肉糜青菜饭 | 菜饭 | 旧仓目录候选整理 · 未家庭验证 |
| `qingcai-doufu-tangpaofan` | 青菜豆腐汤泡饭 | 汤泡饭 | 家庭口述整理 |
| `jirou-galidou-yiguo` | 鸡肉咖喱一锅饭 | 咖喱一锅 | 网络常见做法改写 · 非中式样例 |
| `jirou-shouzhafan` | 鸡肉手抓饭（家常一锅简化） | 手抓饭 | 网络常见做法改写 · 非中式样例 |

完整列表：`python3 cli.py list` 或打开 `browse.html`。

## 与 S1 / 旧仓关系

- `family-surface/`：晨间三卡原型，**参考**；本库是可扩展原料，不替换为贴 plan-meal。
- 旧 `tools/data/recipe-library.json` 等：历史匹配器用数据；**本目录不 import、不调用**。
