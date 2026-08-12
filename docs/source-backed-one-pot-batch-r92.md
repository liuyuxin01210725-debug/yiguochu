# Source-backed one-pot batch r92

日期：2026-08-06  
基线：`source-backed-one-pot-v1-20260806-national-r90`（758 条；r91 无新增）  
结果：新增 3 条；版本升至 `source-backed-one-pot-v1-20260806-national-r92`（761 条）。

本批按厂商官方、机构官方和地域线并行核验。新增条目全部为 `recipe_fact_checked`，没有晋升 `executable` 或 `kitchen_observed`。所有来源均直接打开并记录实际 claim scope；没有把器具转换、传统身份或安全终点从别的版本拼进来。

## 新增条目

| recipe_id | 菜名 | 来源 | 状态 | 本批边界 |
| --- | --- | --- | --- | --- |
| `tefal-portuguese-rice-r106506` | Portuguese Rice | [Tefal 官方食谱页](https://www.tefal.com/recipe/Portuguese-Rice/r/106506) | `recipe_fact_checked` | 4 人份、长粒米 300g、番茄/红甜椒/洋葱、400mL 鸡汤或蔬菜高汤，Tefal 内锅约 16 分钟；没有明确蛋白质、具体型号、传统地域身份或安全终点，作为低优先研究资产 |
| `japan-yakitori-canned-rice` | やきとり炊き込みご飯 | [日本农林水产省北陆农政局 PDF](https://www.maff.go.jp/hokuriku/food/attach/pdf/wasyoku-95.pdf) | `recipe_fact_checked` | 米 1 纸杯与等量水、两种烧鸟罐头、干羊栖菜在耐热袋中沸水锅 30 分钟、焖 10 分钟；不声明人数，不改写成电饭煲，不补罐头/禽肉安全终点 |
| `japan-canned-mackerel-wafu-rice` | さば缶を使った和風炊き込みご飯 | [日本农林水产省北陆农政局 PDF](https://www.maff.go.jp/hokuriku/food/attach/pdf/wasyoku-95.pdf) | `recipe_fact_checked` | 米 2 合、鲭鱼罐头、梅干、真姬菇和 200mL 水在耐热袋中沸水锅 20 分钟、焖 10 分钟；不改写成电饭煲，不补鱼类安全终点 |

### 营养和身份边界

- Portuguese Rice 只有碳水加蔬菜/纤维，没有明确蛋白质；按用户已确认的“至少两类可以、纯碳水不合格”的原则保留，但标为低优先，不进入首批营养完整主餐展示。
- 两道日本炊饭含碳水、罐头鱼/鸡肉蛋白和海藻/菌菇纤维，具名和流程均来自同一份官方 PDF 的独立页码，不能互相借用用量、时间或安全说明。
- PDF 证据若未来申请 `executable`，仍需按既有门禁本地归档、SHA-256 和页码凭证；本批不提前晋升。

## 三路结果与排除

### 厂商官方线

- Tefal `Portuguese Rice` 是本批唯一新增厂商候选。来源直接证明具名、食材、用量、同内锅流程和 16 分钟烹调；不把页面标题译成葡萄牙传统标准菜。
- Tefal `Savoury Rice` 虽同锅但只是泛名且无明确蛋白，排除；`Risotto with peas`、`Paella`、意式鸡肉饭均已在目录或属于已有器具边界，不重复。

### 机构官方线

- 日本农林水产省北陆农政局 PDF 第 4、5 页分别给出两道耐热袋水浴炊饭。它们是连续一锅主餐研究资产，但器具不是电饭煲，不建立电饭煲水位线或程序。
- 台湾农业部小米页面、竞赛说明和官方视频线本轮只有纯谷物/叶包水煮或标题级事实，未新增；新疆政府部分页面无法直开，不使用搜索摘要替代。

### 地域线

- 石狮香油饭、深沪壶仔饭、克州抓饭等已有条目，本轮只记录补证线索，不拆成重复菜名。
- 铜钱关洋芋锅巴饭仅为土豆加米的纯碳水，扁豆饭原始页面不可直达，菜搨饭为熟饭再炒，均不新增。

## 状态变化

| 状态 | r90 | r92 |
| --- | ---: | ---: |
| executable | 12 | 12 |
| recipe_fact_checked | 661 | 664 |
| identity_verified | 79 | 79 |
| discovered | 6 | 6 |
| kitchen_observed | 0 | 0 |
| 合计 | 758 | 761 |

## 研究纪律

- 新增来源均直接打开，记录 `evidence_tier`、定位、署名、许可和实际 `claim_scopes`；不把厂商配方包装成传统地域身份。
- 生米、投料顺序、袋内液体和指定器具原样记录；缺少的人数、安全终点和通用电饭煲转换参数保持缺口。
- 本批没有修改 Worker、前端、Planner、模板或 DeepSeek，没有部署；r92 专项 219/219、全量串行 2207/2207、目录门禁、菜谱门禁和 Python 语法检查均通过。
