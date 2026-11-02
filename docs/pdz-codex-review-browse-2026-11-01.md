# PDZ 审稿 · Codex 人格 · 整库浏览

- 日期：2026-11-01
- 对象：家庭自用浏览 PDZ 草案（浏览为根、待试 ≤2、搜+形态、非纯字母、详情只留做饭字段、砍说明书与工程泄露；Must = 置顶/搜/筛/步骤/本机吃光剩了+列表标记/失败短句/有用排序；Nice = 步骤勾选、返回保状态；Forbid = plan-meal、推荐、轮替、合 main、匹配器；dial calm 4-5/2-3/3；验收 = validate 106 + 真机路径）
- 证据：三张现版截图；`recipe-library/browse.html`；`recipe-library/index.json`；`recipe-library/cli.py`；`recipe-library/schema.json`；`recipe-library/cards/baicai-doufu-menfan.json`；`docs/family-meals.md`；`docs/mobile-pwa.md`；`docs/PRODUCT_PRINCIPLES.md`；`CLAUDE.md` 置顶段
- 本稿不改业务代码，不部署，不合 main

## 1. 总判

**部分同意。** 信息架构和 Forbid 清单可以开工，但「有用排序 / 非纯字母 / dial / validate 106」四句按现在的写法做完，页面会仍是截图这三张，而检查是绿的。

## 2. 硬意见

1. **「全部非纯字母」会被中文排序假绿。** `cli.py` 的 `cmd_new` 把 `cards` 按 `id` 排序（约第 236 行）。`id` 是拼音，所以 `index.json` 前三条就是截图里的阿富汗葡萄干手抓饭、爱尔兰羊肉炖锅、埃及番茄鱼焖饭。`localeCompare('zh')` 照样把「阿富汗」排在最前。验收必须写死「这三条不得再当默认前三」，禁止把「不是字母序」当通过条件。

2. **`python3 recipe-library/cli.py validate` 看不见 UI。** `cmd_validate`（约第 156–189 行）只查字段、文件名和 `weekly_pins` 的 id 是否存在。它不查 pin 个数、不查排序、不查 DOM。现在就会打印通过意义上的「106 张卡」。草案把这句话放进验收，等于允许只跑 CLI。

3. **搜索语料是泄漏通道。** `browse.html` 的 `matches()`（约第 230–236 行）把 `name + form + id + keywords + status` 拼在一起。`status` 全库都是「待试」（106/106），所以搜「待试」会命中全部。`search_keywords()`（`cli.py` 约第 50–67 行）把 `source.kind` 和 `source.label` 焊进 `keywords`。白菜豆腐、肉糜青菜的 label 含 `preview_ready`。可测失败：`preview` 命中 2，`待试` 命中 106。

4. **筛选数字是全库数字，不是当前结果。** `renderFilters()`（约第 266–274 行）用 `cards.length` 和全库 form 计数。截图搜「豆腐」时「显示 4 / 106」，chip 仍是「全部 106」。Must 里的「筛」按现实现已经存在，再做一遍会原样留下这个假筛。

5. **详情白名单挡不住步骤和食材里的工程残渣。** 白菜豆腐卡的可见来源是 `目录候选未验证`、`preview_ready`、`docs/family-meals.md`、`home-cabbage-tofu-rice`，备注再写一遍 `preview_ready ≠ 已验证`。另有 31 张卡的食材含 `{'ru': ...}`，34 张卡的 `steps_now` 含「要点对照来源」加英文整句（阿富汗卡最后一步即是）。只删「来源」标题，早晨仍对着这些字符串做菜。

6. **失败句现在是运行手册。** 单卡失败拼接 `e.message`，并写 `./start.command`、不要双击 html（约第 331 行）。库加载失败写 `./start.command` 和 `./serve.command`（约第 433 行）。手机上这就是不可执行文本。短句必须是常量，禁止拼接异常。

7. **列表标记已经有一个会假绿的版本。** `feedbackMark()` 写的是 `已记吃光` / `已记剩了`（约第 239–244 行）。草案只说「列表标记」，不否定这六个字，实现者会不动它。标记只允许「吃光」「剩了」；没有记录就不渲染。禁止把 localStorage 写回卡的 `status`，也禁止因此把 `preview_ready` 说成已验证（`CLAUDE.md`、`docs/family-meals.md` 已写明）。

8. **置顶两张卡共用 `.pin`。** 同一橙底、同一徽章「本周待试」（约第 81、257 行）。截图里两张卡权重相同。`weekly_pins.length` 没有上限，validate 不拒绝 3 条以上。草案「≤2」没有失败断言。

9. **`time_minutes.active` 不在 index 行上。** 列表只有 `time_total`。排序函数只允许读 index 上已有的 `form / time_total / packable / name / id`。要读 `active`、`source.kind`、吃光记录，就得先改摘要行，那是另一张契约，本轮不进比较器。

10. **dial 三个数字没有轴、没有量纲、没有失败样例。** 现版已经是米色底、圆角、细阴影。拿 4-5/2-3/3 去对，这三张截图可以自报达标。从验收删除。

## 3. 否决项

- 否决用 `cli.py validate` 单独宣布 UI 完成。
- 否决 dial 数字、否决「看起来像声间」。仓内对声间的定义只有 `CLAUDE.md` 三句（本机可开、本周能做、家里真吃），没有界面规格。
- 否决在比较器里读取 `source.kind`、吃光/剩了、点击、星期、冰箱。那是匹配器，草案 Forbid 已写，这里写成拒绝条件。
- 否决用菜名关键词在浏览层把「盖饭」从汤泡饭里捞走。形态错了改卡的 `form`。
- 否决新增 form 枚举。`schema.json` 的七个值本轮冻结。三张误标盖饭改到已有值「其他一锅」。
- 否决删卡凑清爽。张数保持 106，否则「106」和排序快照一起漂。
- 否决随机序、mtime 序、反向字母序、只反转 id 序。这些都满足「非纯字母」，早晨仍然从阿富汗开始或不可复现。
- 否决详情用折叠面板保留 `source.refs`、variant id、`notes`。折叠仍然在 DOM 里，搜页面文字仍能找到 `docs/family-meals.md`。
- 否决吃光/剩了写回 `cards/*.json` 或把 `status` 改成「已验证」。
- 否决把 `plan-meal`、推荐、轮替、合 main、部署、DeepSeek 写进这条 PDZ 的例外。
- 否决本轮做步骤勾选。没有存储契约时，勾选像已保存；写进 localStorage 时，它变成第二套进度，和吃光/剩了抢语义。

## 4. 必须改的 PDZ 条款

下面每条替换草案原句。不替换就按第 1 节的总判，不得开工。

1. **删除「全部非纯字母」「有用排序」。** 改成：空查询且形态为「全部」时，非置顶列表使用第 6 节 `morning_shelf_v1`。验收前三条 id 在第 6 节写死。
2. **删除「UI dial calm 4-5/2-3/3」。** 改成第 7 节五条计数断言。
3. **替换验收句。** 改成两道门，缺一不可。
   - 门 A：`python3 recipe-library/cli.py validate` 输出 `OK · 106 张卡`，并加上第 4.6 节的新断言。
   - 门 B：宽 390、高 844 的浏览器走第 4.7 节八步。禁止用 curl 充当门 B。门 A 绿、门 B 红 = 未完成。
4. **「详情只做饭字段」改成白名单。** 详情 DOM 只渲染：菜名、`form`、`servings.summary`、时间（有 `active` 才写动手分钟）、`packable` 为真时的 `pack_notes`、`ingredients`、`steps_now`、非空才渲染且默认收起的 `prep_optional`、吃光/剩了。不渲染 `id`、`file`、`status`、`source`、`refs`、`notes`、徽章「本周待试」。
5. **脏串门，样式藏不住。** `ingredients` 与 `steps_now` 任一字符串含 `{'ru'`、`{"ru"` 或「要点对照来源」则门 A 失败。列表和详情的 `textContent` 不得含 `preview_ready`、`catalog`、`docs/`、`start.command`、`serve.command`、`HTTP`。字符串「待试」在列表页只允许出现在标题「本周待试」一次，详情页零次。
6. **validate 增补，不换一套校验器。** `weekly_pins` 长度必须为 2，id 顺序必须为 `baicai-doufu-menfan`、`roumi-qingcai-fan`。要换这两道，PDZ 另写「置顶更换」并同时改 `docs/family-meals.md` §0 与 §3；没写更换，就冻结这对 id。`why` 只保留做饭事实，删除「家里还没实做」。
7. **真机八步（门 B）。**
   1. 打开 `/browse.html`，首屏可见「白菜豆腐焖饭」，不可见 lead「可执行卡」，不可见 footer 那句「点开即可看食材」。
   2. 不滚动时，七个形态 chip 的文字都完整落在视口内（现版 `overflow-x: auto`，截图里「汤泡饭」被裁）。
   3. 非置顶前三条 id 等于第 6 节快照。
   4. 搜索「豆腐」：chip「全部」的数字等于 4；「显示」行若保留，分子也是 4；置顶区只剩白菜豆腐焖饭；其下顺序为青菜豆腐汤泡饭、泡菜豆腐汤泡饭、香菇豆腐焖饭（id `yinian-doufu-menfan`）。现版顺序是泡菜、青菜、香菇，即 id 序。
   5. 搜索「待试」结果为 0。搜索「preview」结果为 0。
   6. 打开白菜豆腐焖饭：看不见 `docs/family-meals.md`、`home-cabbage-tofu-rice`、`preview_ready`。第一步在菜名以下第一屏内。
   7. 断网或故意请求坏 id：可见句子只有第 4.8 节两句之一，看不见命令和状态码。
   8. 点「吃光」后返回，该行只有「吃光」二字；刷新后仍在；卡的 JSON 文件 `status` 仍是「待试」。
8. **失败短句改成常量。**
   - 库打不开：`菜谱库没打开。用刚才那个地址再开一次。`
   - 单卡打不开：`这道菜没打开。返回再点一次。`
   - 空结果：`没有这道菜。`  
   禁止在这三句后面加「换个词」「改成全部」「运行命令」。
9. **搜索域改成白名单。** 只匹配 `name`、`form`、食材文本。不匹配 `id`、`status`、`file`、`source`、`notes`、`keywords` 里的来源句和许可证句。空查询才用默认序；有查询时用第 6 节 `search_key`。
10. **筛选计数改成当前查询的交集。** 「全部」的数字 = 当前命中数（含仍命中的置顶）。某个形态在当前查询下为 0 就不渲染该 chip。
11. **置顶视觉权重。** 第一张有边，第二张用普通卡加一个字「也可」。禁止两张都挂 `class="pin"` 就算完成。
12. **三张盖饭先改 `form`，再冻排序快照。** `fanqie-jidan-gaifan`、`niudon-gaifan`、`zhupaigaifan` 从「汤泡饭」改为「其他一锅」。不改的话，`morning_shelf_v1` 的前三名是番茄鸡蛋盖饭、青菜豆腐汤泡饭、日式牛丼盖饭，早晨句子作废。比较器里不写「若菜名含盖饭则降权」。

## 5. Must 增删 / Nice 砍留

**Must 留下，并改成第 4 节的可测句：** 置顶、搜索、形态筛选、步骤、本机吃光/剩了、列表标记、失败短句、默认排序。

**Must 删掉这些原文，不许留作同义复述：** 「有用排序」「非纯字母」「dial 4-5/2-3/3」「validate 106 即验收」。

**Must 新增：** 脏串门、搜索白名单、筛选计数随查询变化、pin 长度与 id 冻结、第一张视觉权重大于第二张、盖饭三张改 form、失败句常量。

**Nice 砍：** 步骤勾选。

**Nice 留：** 返回保持状态。状态只有三项：搜索框字符串、当前形态、`scrollY`。从详情返回不得清空搜索框。现版用内存变量和 `browseScroll`（约第 189、315–317 行）已经做了滚动；PDZ 要把三项写死，避免重写时用整页刷新把查询丢掉。不包含步骤勾选，不包含吃光记录（吃光记录本来就在 localStorage）。

## 6. 默认排序

函数名 `morning_shelf_v1`。纯函数。同一 `index.json` 调用 100 次，id 序列字节级相同。

输入行只使用 `form`、`time_total`、`packable`、`name`、`id`。`time_total` 不是正整数时，这张卡在门 A 失败，比较器不给它默认值。

置顶不进这个排序。置顶顺序 = `weekly_pins` 数组顺序。

形态秩（未知 form 门 A 失败，禁止丢到队尾）：

| form | 秩 |
| --- | --- |
| 汤泡饭 | 0 |
| 菜饭 | 1 |
| 焖饭 | 2 |
| 咖喱一锅 | 3 |
| 其他一锅 | 4 |
| 手抓饭 | 5 |
| 煲类一锅 | 6 |

比较键，升序：

```text
bucket     = 0 if time_total <= 45 else 1
pack       = 0 if packable is true else 1
key        = (bucket, form秩, pack, time_total, name, id)
```

`name` 用 `Intl.Collator('zh-Hans', { numeric: false, sensitivity: 'variant' })`。`id` 只用字节序当最后一位，防止同名不稳。

45 这个阈值是固定桶，不是得分。本周置顶的白菜豆腐是 45 分钟、肉糜是 50 分钟；肉糜在置顶区，不进此排序。桶把 `time_total > 45` 的整段放到所有 ≤45 的卡后面。形态秩放在桶后面，避免 125 分钟的汤泡饭插到 30 分钟的菜饭前面。

**盖饭三张改 form 之后的前三条断言（空查询、形态=全部、去掉两张置顶）：**

1. `qingcai-doufu-tangpaofan` 青菜豆腐汤泡饭（20）
2. `paocai-tang-paofan` 泡菜豆腐汤泡饭（40）
3. `boduolige-jirou-tangfan` 波多黎各鸡肉汤泡饭（40）

同时断言：`afuhan-putaogan-shouzhafan` 的下标大于任意 `time_total ≤ 45` 的汤泡饭、菜饭、焖饭；`aierlan-yangrou-dun` 的下标大于阿富汗卡。

有查询，或形态不是「全部」时，不用默认序，用：

```text
compact(s) = 去掉空白并 lower
starts   = 0 if name 以查询开头 else 1
in_name  = 0 if 查询是 name 的子串 else 1
search_key = (starts, in_name) + morning_shelf_v1 的 key
```

查询「豆腐」的非置顶顺序必须是：`qingcai-doufu-tangpaofan`、`paocai-tang-paofan`、`yinian-doufu-menfan`。

折叠不是这个函数的一部分。若产品要把 `bucket = 1` 收到 `<details>`，只能按这条全序切尾段，不能再按形态丢掉 ≤45 的咖喱或其他一锅。按形态白名单决定「早晨看见谁」是匹配器的门缝，本评审否决。

## 7. UI 约束

最多五条。每条都能数。

1. 列表页解释产品怎么用的句子数为 0。具体删除：eyebrow「家里自用 · 整库浏览」、lead、本周待试下面那句「状态仍是待试……」、`footer.note`。
2. 手机可见文本里，标识符、路径、状态机、许可证、命令的出现次数为 0（第 4.5 节正则）。
3. 置顶渲染张数 ≤ 2；第一张的边框颜色与第二张不同。
4. 空查询且形态为全部时，非置顶第一条的 `time_total ≤ 45`，且 id 等于第 6 节快照第一条。
5. 失败、空结果、无吃光记录，各对应第 4.8 节里已写死的那一句；无记录时标记节点数为 0。
