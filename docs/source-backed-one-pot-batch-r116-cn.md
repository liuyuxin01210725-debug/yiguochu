# Source-backed one-pot batch r116 · 中国大陆地域候选

日期：2026-08-08
目录版本：`source-backed-one-pot-v1-20260807-national-r116`
基线：r114（854 条）
本批新增：7 条（4 条 `recipe_fact_checked`、3 条 `identity_verified`）
新增后：861 条
晋升 executable：0 条；厨房验证：0 条；运行时代码/UI：未修改；未部署。

## 本批范围与判断

本批从 r115 中国大陆 intake 中只整合已经直接打开、能够在官方页面上定位到具名和边界事实的候选。`recipe_fact_checked` 只表示身份与原文实际写明的部分食材/过程已结构化，并不代表数量、液体、时间、安全或电饭煲合同已经闭合；`identity_verified` 只保留官方身份/标准线索。所有缺失字段保持 `null` 或空数组，不借用其他菜名、其他抓饭版本或相邻标准补齐。

原器具（青砖土灶、甑子、火炉锅等）只证明来源中的原始器具，不能推导为普通电饭煲参数。白银腊八饭含雀舌面条，明确记录为米饭相邻主食，不伪装成纯菜饭。

## 新增条目

| recipe_id | 菜名 | 地域 | 状态 | 来源实际证明 | 保留缺口与器具边界 |
| --- | --- | --- | --- | --- | --- |
| `cn-zhejiang-pinghu-hanjia-miao-wild-rice` | 韩家庙村野米饭 | 浙江平湖 | `recipe_fact_checked` | [浙江省信访局原文](https://zjsxfj.zj.gov.cn/art/2025/8/21/art_1229857792_58816054.html)记载青砖土灶活动中的生火、炒菜、焖饭，以及春笋、咸肉、蚕豆、野蕈配料。 | 未给米量、液体、时间、安全终点；只记录土灶事实，不外推电饭煲。 |
| `cn-chongqing-tujia-gan-nian-he-rice` | 土家族赶年合饭 | 重庆渝东南 | `recipe_fact_checked` | [重庆市地方志办公室原文](https://dfz.cq.gov.cn/zqlswh/msmf_417820/202311/t20231102_12510457.html)区分“合饭”与不含米饭的“合菜”，并记载肉块加花椒盐、一层米一层肉码放后在甑子/鼎罐/锅中蒸熟。 | 未给米肉用量、液体、时间、安全终点；传统蒸具不等于电饭煲。 |
| `cn-xinjiang-karamay-pilaf` | 克拉玛依抓饭 | 新疆克拉玛依 | `recipe_fact_checked` | [上海市合作交流办公室原文](https://hzjl.sh.gov.cn/n1308/20250207/e9892da3af324a398bd570fc1bd089c4.html)明确米、胡萝卜、羊肉共同焖制及成品特征。 | 未给固定批量、液体、步骤细节、时间、安全或锅具参数；不借用其他抓饭比例。 |
| `cn-xinjiang-mulei-chickpea-pilaf` | 木垒鹰嘴豆抓饭 | 新疆木垒 | `identity_verified` | [新疆财政厅原文](https://czt.xinjiang.gov.cn/xjczt/c115019/202508/a56dad9f8a0849e4ba183196263a59ed.shtml)把鹰嘴豆明确称为鹰嘴豆抓饭的关键地方食材。 | 没有可直接使用的米量、肉类、液体、步骤、时间、安全或器具事实；仅身份/食材线索，不套用其他抓饭。 |
| `cn-gansu-baiyin-laba-rice` | 白银腊八饭 | 甘肃白银 | `recipe_fact_checked` | [白银市博物馆原文](https://www.baiyin.gov.cn/bmzq/bysbwg/bmyw/art/2025/art_f8884a80ed8b43b5abb2258997a7aba3.html)记载火炉锅中煮米饭至泌米汤，再加入肉臊子、豆腐丁、雀舌面条，浇热油葱花搅匀。 | 含面条，标作米饭相邻主食；无克重、米水量、时间、安全或电饭煲参数。 |
| `cn-shaanxi-northern-jujube-braised-rice` | 陕北枣焖饭 | 陕北 | `identity_verified` | [陕西省地方志办公室原文](https://dfz.shaanxi.gov.cn/zslm/sxsq/msfq/201112/t20111216_2620139.html)直接列出“枣焖饭”这一具名地方饭食。 | 当前原文只支持名称/身份，未证明具体食材、流程、数量、液体、时间、安全或器具；不借用其他枣饭做法。 |
| `cn-yunnan-nujiang-lisu-hand-grab-mixed-rice` | 傈僳族手抓饭·拌饭 | 云南怒江 | `identity_verified` | [国家标准信息公共服务平台原文](https://std.samr.gov.cn/db/search/stdDBDetailed?id=D7B683B23127A476E05397BE0A0A0A45)确认 DB5333/T 21.1—2021《傈僳族手抓饭 拌饭》及其拌饭制作过程范围。 | 标准详情未公开可核验的配料与步骤；不从同系列烤鸡/烤乳猪标准借料，不外推电饭煲。 |

## 试做架与后续路径

- 本批 7 条全部暂不进入 B 试做架：没有一条同时闭合固定批量、液体、时间和安全边界，也没有完成厨房观察。
- `韩家庙村野米饭`、`土家族赶年合饭`、`克拉玛依抓饭`、`白银腊八饭`可作为后续补证候选；补证必须继续使用该条目自己的来源，不能把土灶/甑子/火炉转换成电饭煲合同。
- `木垒鹰嘴豆抓饭`、`陕北枣焖饭`、`傈僳族手抓饭·拌饭`先留作身份档案，拿到各自完整原方或标准正文后再决定是否结构化。
- 本批没有使用 `timeout_pending` 或 `search_extract_only` 作为完整做法合同，没有新增 recipe 数量以外的规划器、账号、用户画像、营养追踪或模型能力。

## 验证

新增 TDD：`tools/tests/source-backed-one-pot-batch-r116-cn.test.mjs`，覆盖版本/数量、去重、状态、来源定位、过程证据、白银面条相邻主食边界、身份档案缺口和未发明电饭煲/合同字段。整合前测试按预期失败；整合后专项测试 3/3 通过。
