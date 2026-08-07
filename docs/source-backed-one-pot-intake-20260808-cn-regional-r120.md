# 中国大陆地域一锅饭候选搜集批次 r120（intake-only）

日期：2026-08-08
目录基线：`source-backed-one-pot-v1-20260807-national-r118`（867 条）；同时与 r119-cn intake 交叉去重
范围：地方政府、文旅/民宗部门、地方志、非遗页面和官方报刊中真实具名的米饭、菜饭、焖饭、抓饭及相邻边界项。本文件只做研究 intake，不修改主 JSON、CSV、运行时代码、构建产物或部署包。

## 口径

- `new_lead` 表示 r118 主目录及 r119-cn intake 都没有精确 canonical/alias；同一家族的地域版本仍需单独写清，不以“风味相近”合并。
- `existing_evidence_upgrade` 表示已有条目的新一手来源，不增加轮替数量。
- 来源只证明原文明确写出的字段；没有量、液体、时间、安全或现代器具参数时保持缺口，严禁跨地区拼合同一配方。
- `direct_one_pot=true` 只用于原文明确同锅/同一容器完成的分支；笼屉、甑子、砂锅、土灶、鼎罐等只证明原器具，不能推导电饭煲水位和程序。
- 熟饭后拌/炒、饭店菜单名、只有身份没有做法的内容，保留为边界或研究线索，不放入 B 试做架。

## 逐条 intake（16 条）

| # | 建议 recipe_id | canonical_name | 地域/家族 | 直达官方来源 | 来源实际证明的事实 | direct_one_pot / 器具边界 | 缺口与建议 | 建议状态 | 目录关系 | B 架 |
|---:|---|---|---|---|---|---|---|---|---|:---:|
| 1 | `cn-fujian-shaxian-gaoqiao-wufan` | 高桥乌饭 | 福建三明沙县高桥/畲族乌饭 | [沙县区政府·高桥乌饭](https://www.fjsx.gov.cn/zwgk/jjsx/bmkx/202304/t20230407_1894466.htm) | 镇政府页面写乌稔叶采摘、石臼捣汁、冲水挤汁、糯米浸泡，次日蒸熟，再用糖水与姜焖制；并记入沙县区非遗项目 | `true`（蒸/焖分阶段）；原文为蒸笼/锅，不给电饭煲参数 | 无克重、液体具体量、时间、安全；乌饭偏节令主食、蛋白不足，先做文化资产，不进 B | `recipe_fact_checked` | `new_lead` | 否 |
| 2 | `cn-chongqing-chengkou-cured-pork-rice` | 城口腊肉饭 | 重庆城口/腊肉饭 | [七一网·城口老腊肉](https://m.12371.gov.cn/content/2023-07/22/content_446437.html) | 官方党媒原文明确：腊肉切丁，与青豌豆、胡萝卜、糯米等煮成腊肉饭；同页另区分腊肉汤、菜板肉等做法 | `true`（原文为“煮腊肉饭”）；器具和火候未说明，不推电饭煲 | 无米/肉/水量、时间、腊肉盐分和安全终点；可作为后续补证优先项，当前不进 B | `recipe_fact_checked` | `new_lead` | 否 |
| 3 | `cn-shanghai-fengxian-clay-stove-cured-pork-rice` | 奉贤土灶咸肉菜饭 | 上海奉贤/菜饭 | [奉贤区政府·大雪节气咸肉菜饭](https://www.fengxian.gov.cn/ymsmkfxjson/20221209/33096.html) | 青菜切碎，咸肉焯洗切块，与腊肠炒香后加入浸泡大米；原文给“果皮水”薄层、土灶焖 15–20 分钟 | `true`（生米、菜、肉同锅）；土灶柴火，不可把“果皮水”直接当电饭煲比例 | 量仍是家庭口述，缺人数、米克重、安全终点；与上海咸肉菜饭同家族，作为证据升级而非新菜单 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 4 | `cn-shanxi-jinyuan-liu-rice` | 晋源馏米饭 | 山西太原晋源/馏米饭 | [西藏自治区文旅厅·馏米饭报道](https://wlt.xizang.gov.cn/ztzl_69/zzqjfyccr/202602/t20260207_523362.html) | 官方报道写糯米与红枣等蒸料，糖水完全浸润后慢火焖半小时；记为晋源非遗节令饭 | `true`（蒸后焖）；原器具为甑/蒸制体系，不外推电饭煲 | 糯米、糖水和份量合同需逐项定位；当前目录已有晋源馏米饭，作来源补强 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 5 | `cn-jiangsu-zhangpu-jiangnan-rice` | 张浦江南菜饭 | 江苏昆山张浦/江南菜饭 | [昆山市政府·金华村传统村落](https://www.ks.gov.cn/kss/bmdt/202505/b349fef57c6746d9ba9538434d020019.shtml) | 官方页写本地大米配金华腊肉、矮脚青菜，经柴火土灶“焖煮鲜炒” | `true`（原文一锅结构）；土灶参数不转电饭煲 | 无量、液体、时间、安全；主目录已有张浦江南菜饭，作证据升级 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 6 | `cn-zhejiang-huzhou-xiuhuajing-vegetable-rice` | 咸肉绣花锦菜饭 | 浙江湖州/菜饭 | [文化和旅游部·湖州发现之旅](https://zhuanti.mct.gov.cn/xcss2024_shjlzzxc/zhejiang/detail/6814.html) | 官方线路将“咸肉绣花锦菜饭”列为荻港桑基鱼塘特色美食，确认名称与地域 | 页面没有定量、步骤、液体、器具或安全，不把名字补成配方 | 当前目录已有精确 canonical；作为来源身份补强，不能新建同名变体 | `identity_verified` | `existing_evidence_upgrade` | 否 |
| 7 | `cn-chongqing-hechuan-laitan-yinmi-wuji` | 涞滩阴米乌鸡粥 | 重庆合川涞滩/阴米 | [合川区政府·涞滩阴米](https://www.hc.gov.cn/bmjd/bm_100475/whlyw/zwxx_101408/dt_101410/202602/t20260204_15378363.html) | 文化旅游委写阴米 40℃浸润 2–4 小时、柴火蒸至七分熟、阴干；阴米与乌鸡慢炖成粥 | `false` 对阴米是预制/多日工艺，成品为粥而非一锅菜饭；不能改写为生米焖饭 | 当前目录有“合川阴米乌鸡粥”；作为工艺证据升级，暂不进生米轮替 | `recipe_fact_checked` | `near_duplicate_existing` | 否 |
| 8 | `cn-jiangsu-jingyuan-san-rice` | 靖远糁饭 | 甘肃白银靖远/糁饭 | [靖远县政府·靖远风味美食](https://www.jingyuan.gov.cn/zjjy/rwjy/msfq/art/2023/art_7e9da73c541d4e02a80733c068c9f132.html) | 米淘净煮至七八成熟，加面粉搅匀后盖锅焖；另有增加水量、焖熟后搅碎的纯米分支，并列小米/黄米/白米版本 | `true` 仅对米面糁饭分支；是粥饭/面食边界，不等同菜饭，锅具未指定 | 缺固定比例、时长、安全和现代锅参数；主目录已有靖远糁饭，作来源补强 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 9 | `cn-guangdong-meixian-shishan-fish-rice` | 石扇鱼焖饭 | 广东梅州梅县石扇/鱼焖饭 | [梅县区政府·石扇鱼焖饭](https://www.gdmx.gov.cn/zjmx/mssx/content/post_2903785.html) | 鱼血加入米，放香煎鲩鱼，传统柴火焖，现代可高压锅蒸；另有葱姜、酱料、金不换 | `true`；柴火/高压锅是原文事实，不能转换电饭煲 | 无米水鱼量、时间、鱼类安全；主目录已有精确 canonical，作一手来源升级 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 10 | `cn-hunan-mayang-miao-she-rice` | 麻阳苗家社饭 | 湖南怀化麻阳/苗家社饭 | [麻阳县政府·苗族饮食](https://www.mayang.gov.cn/mayang/c105440/202502/9d1d39afd086496da8cf07a96e138e76.shtml) | 备社蒿、野藠、蒜苗、腊肉，粳米糯米 3:7 浸泡；腊肉与菜同炒，煮或蒸社饭 | `true` 但有煮/蒸两分支；原文未给电饭煲程序 | 缺各食材克重、液体和时间、安全；主目录已有麻阳社饭，作来源升级 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 11 | `cn-hunan-xiangxi-social-rice` | 湘西社饭 | 湖南湘西/社饭 | [湘西州民宗委·苗族饮食习俗](https://mzzjj.xxz.gov.cn/mzzs/202007/t20200724_1720032.html) | 野菜/蒿菜炒香，糯米、腊肉同煮，七成熟加入菜再焖 | `true`；传统锅/火，禁止电饭煲推导 | 缺量、液体、时间、安全；主目录已有湘西社饭族群，作证据升级 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 12 | `cn-guangdong-kaiping-chikan-claypot-rice` | 赤坎煲仔饭 | 广东开平赤坎/煲仔饭 | [开平市文化馆·赤坎煲仔饭技艺](https://www.kaiping.gov.cn/kpswhgdlytyj/kpwhg/fwzwhyc/fyxm/content/post_2533528.html) | 非遗页列十月晚稻米、黄鳝/牛肉/排骨/腊味等搭配，并写米饭七成熟加配料焗熟 | `true`；砂煲/果木柴火，不能外推电饭煲 | 无固定量、水、总时长、安全；主目录已有 exact 条目，作原始来源升级 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 13 | `cn-hunan-wulong-dingguo-glutinous-rice` | 武隆鼎罐糯米箜饭 | 重庆武隆/鼎罐箜饭 | [武隆区政府·仙人洞鼎罐鸡](https://cqwl.gov.cn/bmjz_sites/bm/wlw/zwxx_98939/jqjd/cyms/202301/t20230105_11456933.html) | 区文旅委页面写鼎罐可煮腊肉或糯米箜饭，作为山地火塘一餐 | `true` 对鼎罐火塘分支；鼎罐/明火，不是电饭煲 | 无米肉量、液体、时间、安全；主目录已有武隆鼎罐糯米箜饭，作器具证据升级 | `identity_verified` | `existing_evidence_upgrade` | 否 |
| 14 | `cn-chongqing-chengkou-old-cured-pork-rice-evidence` | 城口老腊肉饭（腊肉饭分支） | 重庆城口/腊肉食品 | [重庆市农业农村委·城口老腊肉产业](https://nyncw.cq.gov.cn/zwxx_161/qxlb/202302/t20230202_11560784.html) | 官方产业页确认城口腊肉非遗工坊与产业身份；与七一网的“腊肉丁+青豌豆+胡萝卜+糯米煮腊肉饭”来源相互印证 | 仅产业与身份，不能新增第二条；腊肉饭仍需按七一网流程单独建档 | 不能用产业页补数量/时间/安全；与 #2 同 canonical 证据合并，作支撑来源 | `identity_verified` | `existing_evidence_upgrade` | 否 |
| 15 | `cn-shanghai-fengxian-cured-pork-rice-boundary` | 奉贤土灶咸肉菜饭（原文版本） | 上海奉贤/土灶菜饭 | [奉贤区政府·大雪节气菜饭](https://www.fengxian.gov.cn/ymsmkfxjson/20221209/33096.html) | 原文给出了焯洗咸肉、青菜腊肠翻炒、浸泡米、果皮水、15–20 分钟土灶焖制的完整口述流程 | `true`；是土灶快速焖饭，不等于电饭煲标准程序 | 份数、克重、熟制终点未给；同 #3，不能当第二个 canonical 或轮替数量 | `recipe_fact_checked` | `same_source_variant` | 否 |
| 16 | `cn-guangdong-dongguan-wanjiang-cured-rice` | 万江莞式腊味饭（来源线索） | 广东东莞万江/腊味饭 | [东莞市民政局·万江腊味体验](https://mzj.dg.gov.cn/msdgj/content/post_4286293.html) | 官方活动页写淘米入瓦煲、少量水焖熟，腊味和菜后铺，加酱油拌匀；这是熟饭后加料的莞式流程 | `false` 对严格生米一锅合同（米先熟，腊味后铺）；瓦煲，不能电饭煲外推 | 无克重、时间、安全，且与“黄圃腊味煲仔饭/广东腊味饭”家族可能重叠；暂作边界/证据线索 | `recipe_fact_checked` | `near_duplicate_existing` | 否 |

## 本批裁定

- 16 条中，精确去重后 **2 条 `new_lead`**（#1 高桥乌饭、#2 城口腊肉饭）；其余 14 条是已有 canonical 的一手证据升级、同源变体或严格边界项。不能把证据升级计为 16 道新菜单。
- #1 与 #2 均有真实具名和流程方向，但数量、液体、时间和安全合同不完整，**不进入 B 试做架**。高桥乌饭还需在营养标记上注明节令糯米主食属性；城口腊肉饭需补腊肉盐分与肉类熟制证据。
- #3/#15 的奉贤土灶版本显示了明确“果皮水”和 15–20 分钟口述流程，但只证明土灶；不得把它直接改成电饭煲比例。#16 的东莞流程是熟饭后加腊味，不能伪装成生米同锅。
- 本批未修改主 JSON、CSV、运行时代码、构建产物或部署包；只新增本 intake 文档。
