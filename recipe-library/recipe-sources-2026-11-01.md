# 一锅出 · 开源菜谱源（库内说明 · 2026-11-01）

**分支：** `family-restart` 上的功能分支；不合 main、不部署、不接 plan-meal / generate-plan。

仓外初稿仍在 box：`/home/box/shared/yiguochu/recipe-sources-2026-11-01.md`。下面是库内计数，以 `python3 cli.py validate` 为准。

## 规模

| 项 | 数 |
|---|---|
| 首批（含骨架） | 57 |
| 本批新增 | **49** |
| **合计** | **106**（全部 `status=待试`） |

### 本批来源拆分

| 来源 | 许可 | 张数 |
|---|---|---|
| Wikibooks Cookbook 条目改编 | CC BY-SA 3.0 | **30** |
| AdamBouhmad/open-recipe-archive 历史食谱家用改写 | 档案内 `public-domain`（仓库 Unlicense） | **19** |

未整库导入 54k JSONL。商业站全文、版权不明爬取集、ND 许可未使用。NomNom 本环境直接取 JSON 仍不可用，本批未收。

### 本批形态（新增）

焖饭 17、菜饭 12、其他一锅 6、汤泡饭 4、煲类一锅 4、手抓饭 3、咖喱一锅 3。

全库约：焖饭 34、菜饭 21、煲类 12、汤泡饭 11、手抓饭 11、其他一锅 10、咖喱 7。

### 许可处理

- Wikibooks：中文可执行改写；`source.label` 署名；`source.refs` 为条目 URL；`notes` 提醒衍生内容须 ShareAlike。
- 公有领域：`source.label` 写明书名与档案；`refs` 含原书 URL 与 <https://github.com/AdamBouhmad/open-recipe-archive>。
- 原书若米饭另煮、或分两锅再混合，卡片 `notes` 写明本卡改成同锅，避免两口锅。糖量明显不适合家用的（如可可粥原文糖与米等量、咸汤里的大量糖）已改成家用量并在 notes 说明。

## 刻意少收

- 与已有 57 张同名或同菜：Jollof、Paella、Biryani、米兰烩饭、白粥、椰香饭、孟加拉 Khichuri、牙买加豆饭、爱尔兰炖菜等不再做近重复。
- 炒饭、另煮白饭才能吃的咖喱（如南非肉末咖喱配熟饭）、甜品布丁、需要第二锅高汤才能成立且家用改完就不再是原菜的条目。
- 历史方子里无法改成早晨跟得上的步骤（模具饭、四小时炭火盖）只保留缩短后仍是一锅的版本，并写明改了什么。
