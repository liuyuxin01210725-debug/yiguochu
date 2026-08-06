# Source-backed one-pot batch r89

日期：2026-08-06  
基线：source-backed-one-pot-v1-20260806-national-r88（754 条）  
结果：新增 2 条；版本升至 source-backed-one-pot-v1-20260806-national-r89（756 条）。

本批继续按“尽可能扩大真实具名菜饭池、证据不越级”并行核验厂商、机构和地域来源。新增 1 条 Panasonic 台湾官方同锅粥饭、1 条台湾农业部及桃园区农业改良场电锅菜饭；均为 `recipe_fact_checked`，未晋升 `executable` 或 `kitchen_observed`。

## 新增条目

| recipe_id | 菜名 | 来源 | 状态 | 本批边界 |
| --- | --- | --- | --- | --- |
| panasonic-taiwan-red-crab-pork-congee | 紅蟳稀飯 | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/4023) | recipe_fact_checked | 红蟳、白米、五花肉末、香菇和 900g 水在 SR-PAA100 同锅，白米稀饭程序；未给总时间、蟹/猪肉安全终点；授权配方不证明台湾或闽南传统代表身份 |
| taiwan-yam-rice | 山藥飯 | [台湾农业部农业知识入口网／桃园区农业改良场](https://kmweb.moa.gov.tw/subject/subject.php?id=33811) | recipe_fact_checked | 白米、山药、香菇、绞肉等经原方预处理后入电锅，加 1 杯水煮熟；未给固定份数、虾米量、完整时间和肉虾具体温度，不改成通用比例 |

## 三路结果与排除

### 厂商官方线

- Panasonic 台湾第 4 页直接打开并核对《紅蟳稀飯》，页面明确主要米饭流程在 SR-PAA100 内锅完成。
- 《櫻蝦玉菜煲仔飯》已在目录；《媽媽味的麻油雞飯》明确依赖外置锅先炒鸡肉和菇类，排除。

### 机构线

- 台湾农业部农业知识入口网正文给出山药饭的米、山药、香菇、绞肉和电锅流程，按研究状态收录。
- 小米炊饭和 r88 两条香港粥品已在目录；熟白饭配南瓜酱、焗饭/烩饭等不具备本批所需的生米连续同锅证据，排除。

### 中国地域线

- 阿吾丹羊拐抓饭、春湖鱼饭、涉县小米焖饭、豌豆肉抓饭均已在目录，不重复。
- 察隅僜人手抓饭的官方描述是熟红米铺叶、另配鸡肉等，不是一锅连续饭；泛称抓饭制作技艺没有固定做法正文，本批不收。

## 状态变化

| 状态 | r88 | r89 |
| --- | ---: | ---: |
| executable | 12 | 12 |
| recipe_fact_checked | 657 | 659 |
| identity_verified | 79 | 79 |
| discovered | 6 | 6 |
| 合计 | 754 | 756 |

## 研究纪律

- 新增来源均实际直接打开，记录 `evidence_tier`、定位、署名、许可和实际 `claim_scopes`；不把厂商授权配方包装成传统地域身份。
- 生米、连续投料和指定器具事实原样记录；缺少的时间、安全终点、家庭缩放和通用电饭煲参数不由目录推导。
- 本批没有修改 Worker、前端、Planner、模板或 DeepSeek，没有部署；新增研究报告、数据门禁和回归测试当天完成。
