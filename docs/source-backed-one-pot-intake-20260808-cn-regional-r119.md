# 中国大陆地域一锅饭候选搜集批次 r119（intake-only）

日期：2026-08-08
目录基线：`source-backed-one-pot-v1-20260807-national-r118`（867 条）
范围：只记录中国大陆政府、地方志、非遗机构、文化馆、官方专题页或官方报刊中出现的具名米饭/菜饭/焖饭/抓饭/锅巴饭/箜饭等候选及必要的边界项。本文件是研究 intake；本批不修改主 JSON、CSV、运行时代码或部署包。

## 口径与去重

- `new_lead` 仅表示当前 r118 的 canonical_name/aliases 中没有精确记录；`existing_evidence_upgrade` 不是新增菜谱，不能据此增加轮替数量。
- 来源只证明原文明确写出的事实。没有数量、液体、时间、步骤、安全或现代器具参数时保持缺口，不从别的地区或别的版本拼接。
- `direct_one_pot=true` 只表示原文描述同一锅/同一容器内完成或明确把主食与配料同煮；砂锅、土灶、竹筒、甑子等只证明原器具事实，不能推导电饭煲水量、程序或投料时机。
- 熟饭炒拌、饭卷、餐馆套餐、甜点、鱼制品和没有米饭事实的“锅”列为边界，不进入本轮主餐轮替。
- 搜索摘要、超时页面或只有菜名的材料只能作线索；本表若列入，建议状态不超过 `identity_verified`，且明确不进入 B 试做架。

## 本批复核表（20 条记录；新增与去重分开统计）

| # | 建议 recipe_id | canonical_name | 地域/家族 | 直达官方来源 | 来源实际证明的事实 | direct_one_pot / 器具边界 | 缺口 | 建议状态 | 目录关系 | B 架 |
|---:|---|---|---|---|---|---|---|---|---|:---:|
| 1 | `cn-guangdong-yangjiang-e-fan` | 阳江鹅乸饭 | 广东阳江/鹅饭 | [广东省政协文史资料 PDF](https://www.gdszx.gov.cn/attachment/0/0/383/37441.pdf) | 文史资料记载鹅乸肉与大米同锅煲成鹅乸饭的做法，并另记熟饭炒拌的变体；两条流程不可混合 | `true`（生米同锅分支）；原文为锅煲，不能外推电饭煲 | 鹅肉/米/液体定量、时间、禽肉安全和家用电饭煲合同未闭合；需分开记录熟饭变体 | `recipe_fact_checked` | `new_lead` | 否 |
| 2 | `cn-hunan-winter-solstice-glutinous-rice` | 湖南冬至糯米饭 | 湖南/冬至米饭 | [中国气象局·冬至专题](https://www.cma.gov.cn/ztbd/2025zt/24jq/dongzhi/index.html) | 官方专题明写“湖南的冬至糯米饭，搭配腊肉、腊肠蒸煮” | `true`（蒸煮语义）；器具、是否分层投料未说明 | 无县域、克重、米水、时间、安全和电饭煲参数；只能作为季节身份线索 | `identity_verified` | `new_lead` | 否 |
| 3 | `cn-hunan-suining-bamboo-steamed-rice` | 绥宁竹筒蒸饭 | 湖南绥宁/竹筒饭 | [湖南省林业局·绥宁以竹代塑](https://lyj.hunan.gov.cn/lyj/ztzl/gdzt/qdgj/202506/t20250625_33720859.html) | 官方生态文化页以“竹筒蒸饭伴篝火”记录当地竹筒蒸饭语境 | `true` 仅到竹筒/篝火文化事实；非电锅，不作电饭煲转换 | 没有食材、米量、液体、时长、步骤、安全；身份可核，做法未闭合 | `identity_verified` | `new_lead` | 否 |
| 4 | `cn-hunan-ningyuan-ganhe-rice` | 宁远干禾饭 | 湖南永州宁远/瑶族饭食 | [宁远县人大·瑶族文化传承调研报告](https://www.yzrdw.gov.cn/content/2022/04/26/11167678.html) | 官方调研报告在瑶族美食文化清单中明确列“干禾饭” | 未证明是否同锅主餐；器具与流程均未写 | 只有名称和文化归属，无食材、步骤、量、液体、时间、安全；不进 B 架 | `identity_verified` | `new_lead` | 否 |
| 5 | `cn-heilongjiang-lanleng-millet-mixed-rice` | 兰棱小米拌饭 | 黑龙江双城/满族米饭 | [商务部老字号数字博物馆·庆宴居](https://lzhbwg.mofcom.gov.cn/edi_ecms_web_front/thb/detail/acbffc27411b47398e638cd740b8440f) | 官方页面写小米沸水淘洗后上笼屉蒸熟，再与葱花、香菜、辣椒酱、碎白菜叶拌匀 | `false`（蒸熟后拌，属于熟饭二次处理）；笼屉，不是生米一锅 | 无米量、时间、安全和主食锅参数；按“剩饭/熟饭二次烹”候选记录，不进入当前生米轮替 | `recipe_fact_checked` | `new_lead` | 否 |
| 6 | `cn-liaoning-yellow-millet-dry-rice` | 大黄米干饭 | 辽宁/满族米饭 | [文化和旅游部乡村旅游线路·辽宁](https://zhuanti.mct.gov.cn/dhxlsfn2022/liaoning/detail/2410.html) | 原页线索指向地方以大黄米与小豆等焖成干饭的习俗记录（当前页面正文需继续定位原段） | 暂不能确认完整锅法与器具；不推导电饭煲 | 页面抓取未形成可定位的量、液体、时间、安全合同；保留为研究线索，不能 B 架 | `identity_verified` | `new_lead` | 否 |
| 7 | `cn-guizhou-shiqian-bugu-cuigeng-rice` | 布谷催耕饭 | 贵州铜仁石阡/乡村美食活动 | [铜仁日报·“阡”菜放异彩](https://szb.tongren.gov.cn/trrb/content/202603/12/content_74118.html) | 官方报刊活动报道把“布谷催耕饭”列为参赛菜名 | 未证明传统身份、原料或一锅流程；不能因菜名推定可做 | 无原始菜谱、步骤、器具、量或安全；视为活动命名线索，不进 B 架 | `discovered` | `new_lead` | 否 |
| 8 | `cn-tianjin-jinmi-reed-rib-rice` | 金米芦苇排骨饭 | 天津/地方餐饮名录 | [天津市商务局·大众美食库 PDF](https://shangwuju.tj.gov.cn/tjsswjzz/zwdt/gsgg/202303/W020230331642262095936.pdf) | 官方餐饮名录列出“金米芦苇排骨饭”这一具名菜名 | 名录未说明是否生米同锅；不能推定锅具和流程 | 没有正文做法、食材量、液体、时间、安全；仅身份档案 | `identity_verified` | `new_lead` | 否 |
| 9 | `cn-tianjin-zhenxiang-meat-rice` | 甑乡肉米饭 | 天津/地方餐饮名录 | [天津市商务局·大众美食库 PDF](https://shangwuju.tj.gov.cn/tjsswjzz/zwdt/gsgg/202303/W020230331642262095936.pdf) | 官方名录列出“甑乡肉米饭”具名项 | “甑”可能指蒸制容器，但原表没有方法，不能推导为一锅出 | 无食材、流程、量、液体、时间、安全；仅身份档案 | `identity_verified` | `new_lead` | 否 |
| 10 | `cn-xinjiang-tacheng-pilaf` | 塔城抓饭 | 新疆塔城/抓饭 | [塔城市政府·塔城抓饭](https://www.xjtc.gov.cn/ywdt/jrtc/xsdt/content_56828) | 官方页描述羊肉煸香、胡萝卜与洋葱同炒，加入泡米和油水焖熟，可加葡萄干 | `true`（生米分层焖）；传统锅具，不能外推电饭煲 | 当前目录已有塔城风干肉抓饭同家族；无固定量、时间、安全和电饭煲参数，本条作为证据升级候选而非新条目 | `recipe_fact_checked` | `near_duplicate_existing` | 否 |
| 11 | `cn-xinjiang-kizilsu-pilaf` | 克州抓饭 | 新疆克州/抓饭 | [克州政府·抓饭](https://www.xjkz.gov.cn/xjkz/c124094/202412/4e838796d2764451bb6ee687074de4e3.shtml) | 州政府页写油炒洋葱、黄萝卜丝、羊肉，再加淘米和水焖蒸，记录待客/节庆语境 | `true`；原文为传统锅，电饭煲参数未给 | 无克重、米水比、时间和羊肉安全；当前目录抓饭家族已有相近条目，先作证据升级 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 12 | `cn-xinjiang-ili-hand-grab-pilaf` | 伊犁手抓饭 | 新疆伊犁/抓饭 | [伊犁州政府·手抓饭](https://www.xjyl.gov.cn/xjylz/c112874/201811/7095a8856ee44c7eb86791f76602e0ed.shtml) | 州政府页列羊肉、胡萝卜、洋葱、油和大米，先炒肉菜加水焖，再加泡米继续焖 | `true`；传统锅具，不转换为电饭煲程序 | 无固定克重、安全终点和家用程序；与现有抓饭族群存在区域近重复 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 13 | `cn-hunan-huarong-guoba-fish-rice` | 华容锅巴鱼饭 | 湖南岳阳华容/锅巴饭 | [华容县政府·非遗项目简介](https://www.huarong.gov.cn/33159/37006/37008/37042/37303/content_2034207.html) | 官方页详述鱼熬汤、过滤，以鱼汤煮米并将锅底烧出焦黄锅巴，记载传承 | `true`（鱼汤煮米同锅，但鱼汤另制）；传统锅/火候，不外推电饭煲 | 鱼/米/水量、时间、鱼类安全和家用器具未闭合；当前目录已有同名族群，不能重复新增 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 14 | `cn-yunnan-shidian-pea-potato-ham-rice` | 豌豆洋芋火腿焖饭 | 云南施甸/焖饭 | [施甸县政府·青豌豆吃法](https://shidian.gov.cn/info/1111/3792183.htm) | 火腿丁煸油，与青豌豆、土豆丁和米拌匀后入罗锅柴火慢焖 | `true`；罗锅/柴火，只证明原做法 | 无配比、液体、时间、安全；土豆与火腿需营养和盐分审查；当前目录已有同名条目 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 15 | `cn-ningxia-rouzhan-rice` | 肉粘饭 | 宁夏/肉饭 | [宁夏农业农村厅·宁夏大米](https://nynct.nx.gov.cn/rdzt/ppny/202211/t20221103_3829781.html) | 官方页写牛羊肉、洋葱、胡萝卜先炒，再与米饭同蒸，成品介于粥与饭之间 | `true`（同蒸结构）；原文锅具未说明 | 无克重、液体、时间、安全和电饭煲参数；当前目录已有宁夏肉粘饭 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 16 | `cn-hebei-shexian-millet-braised-rice` | 涉县小米焖饭 | 河北涉县/小米焖饭 | [文化和旅游部·涉县小米焖饭](https://zhuanti.mct.gov.cn/rxhmxjgn2022/hebei/detail/2790.html) | 官方页给出蔬菜先炒后加小米、水焖的分支，也列纯小米与菜另配的分支 | 第一分支 `true`；器具和程序未说明；第二分支不是同锅菜饭 | 无量、时间、安全和电饭煲合同；当前目录已有 exact canonical，不新增 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 17 | `cn-hunan-xiangxi-miao-social-rice` | 湘西苗家社饭 | 湖南湘西/社饭 | [湘西州民宗委·苗族饮食习俗](https://mzzjj.xxz.gov.cn/mzzs/202007/t20200724_1720032.html) | 官方页写野菜/蒿菜洗净炒香，糯米与腊肉同煮，七成熟加入菜再焖 | `true`；传统锅/火，不得转成电饭煲水量 | 无克重、液体、时间、安全和现代器具参数；当前目录已有湘西苗家饭/社饭变体 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 18 | `cn-hunan-xiangxi-bamboo-rice` | 湘西苗族竹筒饭 | 湖南湘西/竹筒饭 | [湘西州民宗委·苗族饮食习俗](https://mzzjj.xxz.gov.cn/mzzs/202007/t20200724_1720032.html) | 官方页写洗米入竹筒、加水封口，蒸制一小时以上，另记篝火烤制和米水线索 | `true` 仅对竹筒/蒸制或烤制分支；不是电饭煲 | 竹筒版本的量、投料和安全仍不完整；当前目录已有同名或近同名条目 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 19 | `cn-guangdong-kaiping-litchi-fish-glutinous-rice` | 鲤鱼炖糯米 | 广东开平/疍家菜 | [开平市政府·疍家菜制作技艺](https://www.kaiping.gov.cn/csjdbsc/kjww/wh/content/post_3220203.html) | 官方页写腌鱼、洗糯米，电饭锅蒸煮约四小时，再把鱼置于饭上继续炖，使鱼汁入饭 | `true`，且电饭锅事实被原文明确写出；不是从其他版本推导 | “秘制药材”和量、总时长细节需逐项归档；当前目录已有 exact canonical | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 20 | `cn-jiangsu-xuyi-salted-pork-rice-cracker` | 咸肉菜饭锅巴制作技艺 | 江苏淮安盱眙/菜饭锅巴 | [盱眙县政府·县级非遗项目 PDF](https://www.xuyi.gov.cn/upload/2026-04/499c4548-9ff5-447f-b233-0ebcea3c0354.pdf) | 官方非遗名录确认具名“咸肉菜饭锅巴制作技艺” | 原文页本轮未形成可定位做法，不能假定为电饭煲或单锅流程 | PDF 需本地归档和页码定位；无量、液体、时间、安全，当前只作身份/证据升级 | `identity_verified` | `new_lead` | 否 |

## 统计与下一步

- 本批 20 条记录中：`new_lead` 10 条（#1–#9、#20；其中 #3、#4、#6–#9、#20 证据明显不足），`existing_evidence_upgrade` 9 条（#11–#19），`near_duplicate_existing` 1 条（#10）。为避免把“证据升级”误报成扩库，新增数量以去重后的 canonical 核验为准，不能直接从 20 条相加。
- 目前没有一条新增项具备完整数量、液体、时间、安全和家用电饭煲合同，因此 **本批新增项全部不进入 B 试做架**。#1 阳江鹅乸饭的生米同锅分支、#2 湖南冬至糯米饭以及 #5 兰棱小米拌饭可作为下一轮原文补证方向；熟饭二次处理与生米一锅必须分开建档。
- `new_lead` 继续停在研究层。只有来源直接打开、事实范围完整且通过现有 validator 后，才考虑 `recipe_fact_checked`；任何土灶/竹筒/甑子版本都不得直接写成电饭煲方案。
- 本批没有修改主目录、CSV、运行时代码、构建产物或部署；只新增本 intake 文档。
