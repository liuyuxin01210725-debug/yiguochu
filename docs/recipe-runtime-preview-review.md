# Recipe Runtime 首批身份与 Preview 激活审核

审核日期：2026-07-31

范围：`recipe-runtime-v1-20260730-r1` 的 6 个首批身份。本文只审核当前仓库中的结构化事实；本代码/审计子任务未重新打开外部网页、未做真实家庭试做、未做真浏览器点击、未部署。其他执行者产生的浏览器证据须在总 Task 7 结论中单独复核，不能倒推为家庭试做。

## 结论

**6/6 全部继续 `planned`，0 条可改为 `preview_enabled`。** 这不是菜谱名字不存在，而是运行时激活门仍缺关键证据。共性缺口为：

- `household_trial` 全为 `null`，没有真实家庭试做；
- `ratio_default_rule_id` 全为 `null`，没有经试做确认的唯一默认值；
- `technique_graph`、`seasoning_actions`、`safety_endpoints`、`source_claims` 全为空；
- `approved_variants` 全为空。生产 recipe 中的 `substitution_slots` 只是候选信息，不等于 runtime 已批准变体；
- 当前 compiler 对 `recipe_variant` 明确 fail closed，validator 也禁止含变体的 `preview_enabled` entry，因此上海菜心版和台湾番茄虾仁版只能在专用 matcher fixture 中验证边界，不能冒充可生成成品。

本轮随后完成的 30 条 390×844 本地真浏览器旅程，证明 custom fallback 能稳定
覆盖多数输入并生成可读步骤，但 29 条生成结果全部仍为“自定义方案”。浏览器通过
不能倒推任何 named runtime 已获得菜式专属比例、调味、安全或家庭试做证据，因而
不改变上述 0 条激活结论。

外部身份依据的本轮审核范围只是：URL 为 HTTPS，且域名不是项目自身 `yiguochu.pages.dev`；这一条由 runtime validator 机器检查。它们当前只能支持菜式名称/身份声明，不自动支持项目中的技法、比例、调味或安全声明。

## 总表

| Runtime ID | Exact name claim | Catalog 已登记的项目外身份 URL | Machine ratio bounds | 唯一默认值 | 家庭试做 | 结论 |
|---|---|---|---|---|---|---|
| `shanghai-salted-pork-vegetable-rice` | 上海奉贤咸肉菜饭 | 奉贤区政府 HTTPS | 125–140g 总液体 / 100g 生米 | 缺失 | 未做 | `planned` |
| `xinjiang-lamb-pilaf` | 新疆羊肉抓饭 | 新疆维吾尔自治区政府 HTTPS | 135–150g 熟制余液 / 100g 生米 | 缺失 | 未做 | `planned` |
| `taiwan-cabbage-mushroom-rice` | 高丽菜香菇炊饭 | Wikibooks HTTPS | 基础版 120–145g 液体 / 100g 生米；番茄虾仁证据规则为 80g 水 / 100g 生米 | 缺失 | 未做 | `planned` |
| `quanzhou-oil-rice` | 泉州浥饭（油饭） | 泉州市政府 HTTPS | 90–110g 液体 / 100g 泡发糯米 | 缺失 | 未做 | `planned` |
| `cantonese-cured-meat-claypot-rice` | 广式腊味煲仔饭 | 广东省商务厅 HTTPS PDF | 无 recipe-specific numeric bounds | 缺失 | 未做 | `planned` |
| `north-china-green-bean-braised-noodles` | 北方豆角焖面 | 乌拉特中旗政府 HTTPS | 无 recipe-specific numeric bounds | 缺失 | 未做 | `planned` |

## 1. 上海奉贤咸肉菜饭

- **Exact name claim：** `上海奉贤咸肉菜饭`。runtime naming 与 production recipe 名称一致。
- **项目外身份依据：** [大雪节气村民做咸肉菜饭，青菜甜糯咸肉清香](https://www.fengxian.gov.cn/ymsmkfxjson/20221209/33096.html)。当前只绑定 identity claim。
- **Required core：** `raw-rice` + `salted-pork-belly` + `small-bok-choy`；咸五花肉必须保留 `cured_slice`。与 recipe core 一致。
- **Allowed variants：** runtime 为空。recipe 有“小白菜 → 菜心”候选替换，但尚无变体数量转移、专属执行图和安全对账，不得激活。
- **Ratio bounds：** `shanghai-salted-pork-liquid-evidence-v1`，每 100g 生米 125–140g 可用总液体，`bounds_only`。
- **唯一默认值：** 缺失；不得取中点冒充试做值。
- **Technique：** recipe prose 记录“咸肉与米起香 → 加已量液体 → 米近熟时加叶菜”；runtime graph 为空。
- **Seasoning：** recipe prose 记录“先尝咸肉，再决定是否补盐”；runtime seasoning 为空。
- **Safety：** recipe prose 有猪肉熟制、先尝后补盐、叶菜后放；runtime endpoints 为空。
- **Source scope：** runtime 没有 `source_claims`；production `source_refs` 仅是项目自身原创配方页，不能替代外部身份依据或各项 claim 绑定。
- **Household trial：** 未执行，`null`。
- **Blockers：** 唯一 ratio default、action profile/technique graph、seasoning、safety endpoints、五类 source claims、真实家庭试做；菜心版还缺 variant compiler。

## 2. 新疆羊肉抓饭

- **Exact name claim：** `新疆羊肉抓饭`。runtime naming 与 production recipe 名称一致。
- **项目外身份依据：** [新疆抓饭](https://www.xinjiang.gov.cn/xinjiang/tsxj/201111/358fd2c0b97841bba6513661c11d770c.shtml)。当前只绑定 identity claim。
- **Required core：** `raw-rice` + `lamb-leg` + `onion` + `carrot`；羊腿肉必须保留 `leg`。与 recipe core 一致。
- **Allowed variants：** runtime 为空。recipe 中“羊腿肉 → 羊肩肉”只是候选 substitution，未经 runtime 批准。
- **Ratio bounds：** `xinjiang-lamb-pilaf-liquid-evidence-v1`，每 100g 生米 135–150g 羊肉熟制后可用余液，`bounds_only`。
- **唯一默认值：** 缺失。
- **Technique：** recipe prose 记录“羊肉 → 洋葱胡萝卜 → 量可用余液 → 加生米”；runtime graph 为空。
- **Seasoning：** runtime 为空；recipe prose 没有可编译的唯一盐/油默认值。
- **Safety：** recipe prose 要求羊肉部位/状态与来源记录、完全熟制、水果坚果过敏审核、余液基准；runtime endpoints 为空。
- **Source scope：** `source_claims` 为空；项目自身 source ref 未绑定 technique/ratio/seasoning/safety claim。
- **Household trial：** 未执行，`null`。
- **Blockers：** 唯一 ratio default、专属 graph/profile、调味数值与行为、safety endpoints、source claims、真实家庭试做；羊肩版不可激活。

## 3. 高丽菜香菇炊饭

- **Exact name claim：** `高丽菜香菇炊饭`。runtime naming 与 production recipe 名称一致。
- **项目外身份依据：** [食谱/高丽菜炊饭](https://zh.wikibooks.org/wiki/%E9%A3%9F%E8%AD%9C/%E9%AB%98%E9%BA%97%E8%8F%9C%E7%82%8A%E9%A3%AF)。当前只绑定 identity claim。
- **Required core：** `raw-rice` + `green-cabbage` + `shiitake`，与 recipe core 一致。
- **Allowed variants：** runtime 为空。recipe 中有叶菜和“鲜菇或虾仁”替换以及番茄/玉米可选项，但当前 variant schema 只能表达替换，无法把番茄和玉米绑为番茄虾仁版必需身份。
- **Ratio bounds：** 基础版 `taiwan-cabbage-mushroom-liquid-evidence-v1` 为每 100g 生米 120–145g 总液体；番茄虾仁证据规则锁定每 100g 生米对应番茄 100g、白菜 60g、玉米 50g、虾仁 80g、水 80g。两条都是 `bounds_only`。
- **唯一默认值：** 缺失。
- **Technique：** recipe prose 区分基础版和番茄虾仁后放版；runtime graph 为空。专用 fixture 显示 canonical matcher 可命中，但当前 HTTP hybrid 只能借同 template custom carrier 物化 named plan；这组输入没有进入 `mushroom-aroma-rice-pot` carrier，因此 HTTP 仍 fail closed 为 custom。
- **Seasoning：** runtime 为空，没有可执行盐/油决策。
- **Safety：** recipe prose 有出水评估、豆腐热透、虾仁完全熟透；runtime endpoints 为空。
- **Source scope：** `source_claims` 为空；现有外部页只能作身份依据，番茄虾仁版的各项 claim 还没有独立绑定。
- **Household trial：** 未执行，`null`。
- **Blockers：** 两条路径都缺唯一默认值、专属 graph/profile、seasoning、safety、source claims 和家庭试做；基础版还有 HTTP named carrier 缺口；番茄虾仁版还缺能表达附加必需食材的 variant 结构与 compiler。

## 4. 泉州浥饭（油饭）

- **Exact name claim：** `泉州浥饭（油饭）`。runtime naming 与 production recipe 名称一致。
- **项目外身份依据：** [泉州浥饭](https://www.quanzhou.gov.cn/gastronomy/ch/msdh/xwqz/202411/t20241122_3107926.htm)。当前只绑定 identity claim。
- **Required core：** production recipe 是泡发糯米 + 猪肉末 + 鲜香菇；runtime 只有 `ground-pork` + `shiitake`。“泡发糯米”当前无 taxonomy canonical，无法把 `soaked` + `whole_soaked_grain` 写入 `required_canonical_ids`。
- **Allowed variants：** runtime 为空。recipe 中“猪肉末 → 去皮鸡腿肉/老豆腐”不是已批准 runtime variant。
- **Ratio bounds：** `quanzhou-soaked-rice-liquid-evidence-v1`，每 100g 泡发糯米 90–110g 液体，`bounds_only`。规则目标是 unresolved `recipe_ingredient_name`，不是 canonical id。
- **唯一默认值：** 缺失。
- **Technique：** recipe prose 记录“猪肉香菇出香 → 泡发糯米与已量液体 → 焖至软糯”；runtime graph 为空，action registry 也无泉州专属动作。
- **Seasoning：** runtime 为空，recipe prose 无唯一可编译默认值。
- **Safety：** recipe prose 有猪肉完全熟制、排除未审核干海产、糯米不夹生/无游离液；runtime endpoints 为空。
- **Source scope：** `source_claims` 为空；项目 source ref 不能补齐 machine claims。
- **Household trial：** 未执行，`null`。
- **Blockers：** 先补泡发糯米 canonical/state/shape 机器身份，再补专属 action registry/profile、可执行规则与唯一默认值、seasoning、safety、claims、试做；现在不得以生米或熟饭冒充泡发糯米。

## 5. 广式腊味煲仔饭

- **Exact name claim：** `广式腊味煲仔饭`。runtime naming 与 production recipe 名称一致。
- **项目外身份依据：** [粤菜餐厅西关风情特色服务规范（征求意见稿）](https://com.gd.gov.cn/attachment/0/496/496120/3989095.pdf)。当前只绑定 identity claim，且文件属征求意见稿，不得表达为官方标准做法。
- **Required core：** `raw-rice` + `chinese-sausage` + `choy-sum`；腊肠必须保留 `sausage`。与 recipe core 一致。
- **Allowed variants：** runtime 为空。recipe 中“菜心 → 小白菜”未获 runtime 批准。
- **Ratio bounds：** 空；只有“根据普通带盖锅蒸发与食材含水记录校准”的 prose，不是 machine numeric rule。
- **唯一默认值：** 缺失。
- **Technique：** recipe prose 记录只用普通带盖锅、腊味热透、米饭后加叶菜、记录锅底湿度；runtime graph 为空，action registry 无广式专属图。
- **Seasoning：** recipe prose 要求先尝腊味再补盐、先记录出油再决定加油；runtime 为空。
- **Safety：** recipe prose 有腊味中心热透、普通带盖锅边界、盐/油决策、叶菜后放、湿度记录、食材来源记录；runtime endpoints 为空。
- **Source scope：** `source_claims` 为空，无法把 identity PDF 自动扩展为比例/调味/安全依据。
- **Household trial：** 未执行，`null`。
- **Blockers：** recipe-specific numeric bounds 都没有，因此还不到选默认值的阶段；之后还需 graph/profile、seasoning、safety、claims、试做和普通锅表达边界人工复核。

## 6. 北方豆角焖面

- **Exact name claim：** `北方豆角焖面`。runtime naming 与 production recipe 名称一致。
- **项目外身份依据：** [乌拉特中旗美食：豆角焖面](https://www.wltzq.gov.cn/zjwzq/yxwltzq/ms/201812/t20181204_674031.html)。当前只绑定 identity claim。
- **Required core：** `fresh-wheat-noodle` + `green-beans` + `ground-pork`；猪肉末必须保留 `ground`。与 recipe core 一致。
- **Allowed variants：** runtime 为空。recipe 中“猪肉末 → 老豆腐/去皮鸡腿肉”未获 runtime 批准。
- **Ratio bounds：** 空；recipe prose 只说“总液体先量取、分段加入、留少量可见液体”，没有 recipe-specific numeric bounds。
- **唯一默认值：** 缺失。
- **Technique：** recipe prose 是豆角与蛋白质先熟、铺鲜面焖制、起锅前检查锅底湿度；runtime graph 为空。专用 fixture 验证了猪肉末保留 `ground`，受控文案只写“拨散/炒散”，不出现“切片/切薄片”；该 fixture 不是试做依据。
- **Seasoning：** runtime 为空，没有专属锁定盐/油动作。
- **Safety：** recipe prose 有豆角与猪肉先安全熟制、面条熟透不糊断、锅底不焦且无大量游离液；runtime endpoints 为空。
- **Source scope：** `source_claims` 为空；项目 source ref 不会自动变成 numeric ratio 证据。
- **Household trial：** 未执行，`null`。
- **Blockers：** 缺 recipe-specific numeric bounds，因此不得借通用 `braised-noodle-pot` 比例当专属值；之后仍需唯一 default、graph/profile、seasoning、safety、claims 和真实试做。

## 激活判定与后续顺序

| Runtime ID | 当前状态 | 下一个最小可验证动作 |
|---|---|---|
| 上海 | `planned` | 按 125–140g 区间小批试做，只在真实记录后选唯一 default；canonical 与菜心版分开评审 |
| 新疆 | `planned` | 先试做 canonical 羊腿版，专门记录“熟制余液”定义和唯一 default |
| 台湾 | `planned` | 基础版与番茄虾仁版分成两套执行合同；先修正 HTTP named carrier 与 variant 结构缺口 |
| 泉州 | `planned` | 先补泡发糯米 canonical/state/shape，再谈比例默认值与试做 |
| 广式 | `planned` | 先取得普通带盖锅下的 recipe-specific numeric bounds，不允许借通用米饭规则 |
| 北方 | `planned` | 先取得鲜面分段液体的 numeric bounds，同时保留 ground 形态和豆角先熟终点 |

在任意条目完成独立身份审核、唯一 ratio default、可执行 profile/graph、受控调味、safety endpoints、五类 source claims、确定性旅程和真实家庭试做前，不进入 Preview 部署讨论。
