# 中国大陆地域一锅饭候选搜集批次 r111

日期：2026-08-07  
目录基线：`source-backed-one-pot-v1-20260807-national-r110`（844 条）  
范围：只记录中国大陆政府、地方志、非遗机构、文化馆或官方文化页面中的具名菜饭、焖饭、抓饭、煲仔饭、锅巴饭和相邻边界项。本文件是研究 intake，不修改主 JSON、CSV、运行时代码或部署包。

## 口径与去重

- 本批先查当前目录的 `canonical_name`、aliases 和地域变体。`existing_evidence_upgrade` 不是新增菜谱，只是为已有条目补一手来源；`new_lead` 才表示尚未在当前目录找到同名记录。
- 来源只证明原文明确写出的事实。没有量、液体、时间、步骤、安全或现代器具参数时保留空缺；不从别的地区版本拼合同一配方。
- “直达已打开”与“搜索摘录/超时”严格区分。后者只能留在研究层，不能据此进入 B 试做架或公开“可照做”。
- 土灶、铁锅、铜锅、砂锅、竹筒、木甑等只证明原器具事实；电饭煲水量、程序、防糊和投料时机必须另有来源或厨房实测。

## 本批复核表（20 条）

| # | 建议 recipe_id | canonical_name | 地域/家族 | 直达官方来源 | 直接证明的事实 | 缺口/器具边界 | 建议状态 | 目录关系 | B 架 |
|---:|---|---|---|---|---|---|---|---|:---:|
| 1 | `kizilsu-polo-pilaf` | 克州抓饭 | 新疆克州/抓饭 | [克州政府·抓饭](https://www.xjkz.gov.cn/xjkz/c124094/202412/4e838796d2764451bb6ee687074de4e3.shtml) | 州文体旅局原文写油炒洋葱、黄萝卜丝、羊肉块，再加淘净大米和水焖蒸；确认营养与节庆待客语境 | 没有克重、米水比例、时长、安全和家用电饭煲参数；黄萝卜与胡萝卜替代关系需按原文保留 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 2 | `ili-pilaf` | 伊犁手抓饭 | 新疆伊犁/抓饭 | [伊犁州政府·手抓饭](https://www.xjyl.gov.cn/xjylz/c112874/201811/7095a8856ee44c7eb86791f76602e0ed.shtml) | 州政府原文列新鲜羊肉、胡萝卜、洋葱、清油/羊油、大米；先炸羊肉炒蔬菜，加水焖约20分钟，再放泡米焖约40分钟 | 未给克重；原文的火候和锅具是传统锅，不推导电饭煲；安全终点仍需单列 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 3 | `xuyi-salted-pork-rice-cracker` | 盱眙咸肉菜饭锅巴制作技艺 | 江苏淮安盱眙/菜饭锅巴 | [盱眙县政府·县级非遗项目 PDF](https://www.xuyi.gov.cn/upload/2026-04/499c4548-9ff5-447f-b233-0ebcea3c0354.pdf) | 官方非遗名单确认具名“咸肉菜饭锅巴制作技艺”及技艺身份 | PDF 本轮抓取超时，需本地归档后核对页码；当前只有身份，不能写量、流程或锅具 | `identity_verified` | `existing_evidence_upgrade` | 否 |
| 4 | `r103-cn-huarong-guobayu-fan` | 华容锅巴鱼饭 | 湖南岳阳华容/锅巴饭 | [华容县政府·非遗项目简介](https://www.huarong.gov.cn/33159/37006/37008/37042/37303/content_2034207.html) | 县文旅局原文写鱼熬汤并反复过滤，用鱼汤煮大米，以锅底烧出焦黄锅巴；还记载起源、传承和传承人 | 有鱼汤制作顺序但无鱼/米/水固定量、时间、安全和家庭电饭煲方案；鱼种需保持“粗细鳞鱼”原文范围 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 5 | `cn-zhejiang-taizhou-yellowfish-earth-stove-rice` | 台州黄鱼焖土灶饭 | 浙江台州/土灶饭 | [国务院侨办·台州非遗美食](https://www.gqb.gov.cn/news/2026/0211/61382.shtml) | 官方报道明确台州非遗传承人现场烹制该具名菜；确认地域与土灶焖饭身份 | 只有活动记录，无食材量、液体、时间、安全；土灶事实不能转换成电饭煲合同 | `identity_verified` | `new_lead` | 否 |
| 6 | `cn-shanghai-changning-spring-bamboo-bacon-mustard-rice` | 春笋腊肉荠菜焖饭 | 上海长宁/季节菜饭 | [长宁区政府·春菜上新](https://www.shcn.gov.cn/col5962/20260317/1307094.html) | 社区长者食堂官方页列春笋、荠菜、腊肉与米焖制，说明“鲜、香、糯” | 无米水比例、份量、时间、器具和安全终点；社区食堂做法不直接等于家庭电饭煲做法 | `recipe_fact_checked` | `new_lead` | 否 |
| 7 | `cn-fujian-shanghang-grass-basket-danfan` | 上杭箪饭（草编饭苞） | 福建上杭/客家箪饭 | [上杭县文化馆·草编饭苞](https://www.shwhy.cn/sys-nr/?g=11) | 文化馆写洗米装入草编饭苞，扎紧后整体入水煮熟，并说明客家山区外出劳作习俗 | 是容器煮饭，不是混合菜饭；无米量、时间、安全与现代器具参数，先作为器具/携行饭边界 | `recipe_fact_checked` | `new_lead` | 否 |
| 8 | `cn-gd-kaiping-xiangang-claypot-rice` | 蚬冈煲仔饭 | 广东开平/煲仔饭 | [开平市政府·蚬冈煲仔饭剧场](https://www.kaiping.gov.cn/jmkpsxgz/gkmlpt/content/3/3223/post_3223014.html) | 政府页面确认蚬冈煲仔饭剧场和非遗饮食展示，足以确认名称/地域 | 直达页多次超时；尚无配料、流程、量、时间、安全，不能与赤坎煲仔饭拼成通用配方 | `identity_verified` | `new_lead` | 否 |
| 9 | `kunshan-zhangpu-jiangnan-vegetable-rice` | 张浦江南菜饭 | 江苏昆山/江南菜饭 | [昆山市政府·金华村传统村落](https://www.ks.gov.cn/kss/bmdt/202505/b349fef57c6746d9ba9538434d020019.shtml) | 本地大米、腊肉、矮脚青菜，柴火土灶“焖煮鲜炒”结构 | 无克重、液体、时间和安全；土灶步骤不能外推电饭煲 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 10 | `cn-yn-baoshan-shidian-pea-potato-ham-rice` | 豌豆洋芋火腿焖饭 | 云南施甸/焖饭 | [施甸县政府·青豌豆吃法](https://shidian.gov.cn/info/1111/3792183.htm) | 火腿丁煸油，与青豌豆米、土豆丁、大米拌匀，入罗锅柴火慢焖 | 无配比、液体、时长、安全；罗锅/柴火仅为原器具事实 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 11 | `yunnan-wa-chicken-lanfan` | 佤族鸡肉烂饭 | 云南沧源/烂饭 | [沧源县政府·佤族饮食习俗](https://cangyuan.gov.cn/artview/739/267924.html) | 官方文化页写大米与鸡肉同煮，成品介于米饭与稀饭，蔬菜可按当地习惯同煮 | 页面抓取偶发超时；无克重、液体、时间和家庭锅参数，鸡肉须单独保留74°C安全终点 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 12 | `ningxia-wuzhong-rouzhanfan` | 肉粘饭 | 宁夏吴忠/肉粘饭 | [宁夏农业农村厅·宁夏大米](https://nynct.nx.gov.cn/rdzt/ppny/202211/t20221103_3829781.html) | 牛羊肉、洋葱、胡萝卜先炒，再与米饭同蒸，成品介于粥与饭之间 | 本轮抓取超时；无克重、液体、时间、安全和电饭煲参数；需区分同蒸与成饭后再蒸 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 13 | `xiangjiangyuan-bamboo-rice` | 湘江源瑶家竹筒饭 | 湖南蓝山/竹筒饭 | [蓝山县政府·湘江源瑶家竹筒饭](https://www.lanshan.gov.cn/lanshan/msmw/201805/a96955c68487440983d0b541f179de37.shtml) | 糯米、茶豆、瘦肉末约各三分之一；蒸好茶豆饭塞入竹筒，封口后蒸约30分钟 | 原器具和比例已明确，但无家庭电饭煲转换、防糊与肉类安全细节 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 14 | `lingchuan-heguo-rice` | 陵川和锅大米 | 山西陵川/一锅出 | [陵川县政府·陵川和锅大米](https://www.lczf.gov.cn/txlc_5/lcms/202512/t20251229_2302909.shtml) | 官方称附城叫“一锅出”、潞城叫“柴火大米”，可加蔬菜副食同锅焖，是家常饭系 | 仅概念和身份，无具体食材、量、水、时间、安全、器具参数 | `identity_verified` | `existing_evidence_upgrade` | 否 |
| 15 | `kaiping-chikan-claypot-rice` | 赤坎煲仔饭 | 广东开平赤坎/非遗煲仔饭 | [开平市文化馆·赤坎煲仔饭技艺](https://www.kaiping.gov.cn/kpswhgdlytyj/kpwhg/fwzwhyc/fyxm/content/post_2533528.html) | 果木柴火、十月晚稻米，列黄鳝/牛肉/排骨/腊味等配料；米饭七成熟加配料焗熟；县级非遗 | 无固定份量、米水、总时长和安全；柴火砂煲与电饭煲必须分开记录 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 16 | `qianjiang-firewood-potato-rice` | 柴火洋芋饭 | 重庆黔江/洋芋饭 | [黔江区政府·柴火洋芋饭](https://www.qianjiang.gov.cn/bmjd/xzfgzbm/qwhlyw/zwgk_49175/gkml/cyqj/czqj/202506/t20250612_14708703.html) | 洋芋炒黄后与大米柴火慢炖，文中提到可加腊肉、腊肠或蔬菜 | 无克重、液体、时间、电饭煲适配；米+洋芋可能只有碳水，需营养筛查 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 17 | `cn-hunan-linxiang-taolin-fengguo` | 桃林丰锅团年饭 | 湖南临湘/团年一锅菜（非米饭） | [临湘市政府史志办·丰锅](https://www.linxiang.gov.cn/24733/24760/24821/24992/25001/content_682109.html) | 腊肉、油豆腐、萝卜、香菇、豆腐、白菜、粉丝、黄花分层入锅炖，荤素一锅，可吃数日 | 无米饭，不进入米饭轮替；田畈明火锅具不能转换 | `identity_verified` | `boundary_only` | 否 |
| 18 | `cn-beijing-miyun-simatai-zhuangguozi` | 司马台装锅子 | 北京密云/铜锅暖锅（非米饭） | [密云区政府·司马台装锅子](https://www.bjmy.gov.cn/stmy/mywl/jphd/202605/t20260526_542938.html) | 酸菜、粉条、海带、五花肉分层入铜锅，加高汤小火慢炖 | 没有米饭，是锅菜边界；不进入菜饭目录 | `identity_verified` | `boundary_only` | 否 |
| 19 | `cn-shandong-yantai-ninghai-naofan` | 宁海州脑饭 | 山东烟台/传统饭食边界 | [烟台市政府·宁海州脑饭](https://www.yantai.gov.cn/art/2018/6/19/art_11748_1167698.html) | 官方资料确认名称、历史和米粥/豆腐脑/花生/粉条等组合线索 | 尚未确认是米饭主餐，不能按“饭”字强行纳入；暂不轮替 | `identity_verified` | `boundary_only` | 否 |
| 20 | `huarong-guoba-fish-rice` | 锅巴鱼饭（同源证据复核） | 湖南华容/锅巴鱼饭 | [华容县政府非遗简介](https://www.huarong.gov.cn/33159/37006/37008/37042/37303/content_2034207.html) | 同一官方页详述鱼熬汤过滤、鱼汤煮大米并烧锅巴，确认“锅巴鱼饭”历史和传承 | 与 #4 为同一 canonical 家族，不得新增第二条；无固定量、时长和电饭煲参数 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |

## 本轮结论

- 20 条中 **5 条是新线索**（#3、#5–#8），**12 条是现有目录证据升级**（#1–#2、#4、#9–#16、#20；#20 与 #4 属同一 canonical 家族，不新增第二条），**3 条为非米饭或形态未确认的边界项**（#17–#19）。#3 虽是新线索，但仅证明携行饭器具，不能直接进入主餐轮替。
- #1 克州抓饭、#2 伊犁手抓饭是本轮最接近可结构化的官方来源，但仍缺定量/安全/家用电饭煲参数；不可直接当“电饭煲抓饭”发布。
- #4 华容锅巴鱼饭的鱼汤—煮米—锅巴顺序完整，下一步应保存 PDF/HTML 证据定位并补鱼类安全与家庭锅具验证；不从其他鱼饭拼数量。
- #5–#8 先停在研究层；缺项补齐前不得进入 B 架。#3 上杭箪饭只证明草编饭苞水煮饭，若产品边界坚持“菜饭/一锅米饭”，应作为器具文化资料而非主餐。
- 本批未修改主目录、未改变轮替池、未新增运行时调用、未部署。
