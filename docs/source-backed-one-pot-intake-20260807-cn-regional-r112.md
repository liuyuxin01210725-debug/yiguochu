# 中国大陆地域一锅米饭候选搜集批次 r112

日期：2026-08-07
目录基线：`source-backed-one-pot-v1-20260807-national-r110`（844 条；本批开始前按 `recipe_id` 与 `canonical_name` 去重）
范围：只记录当前主目录尚未收录的中国大陆具名米饭/菜饭/焖饭/炊饭/抓饭及相邻边界项。本文件是研究 intake，不修改主 JSON、CSV、运行时代码、构建产物或部署。

## 证据与边界口径

- 直达页面能证明的字段才写入“来源事实”；只有名录或活动报道时只记身份，不补写食材、数量、液体、时间或步骤。
- `direct_one_pot` 表示来源明确描述同一锅/同一器具中的米饭流程；“先蒸熟再炒/再煎”“米团糍煮汤”“阴米预加工后另行炖煮”等标为 `staged_or_secondary`，不能伪装成生米一锅饭。
- 原来源的土灶、瓦煲、砂锅、竹筒、铜锅和大锅只证明原器具事实；不能从它推导电饭煲的水量、程序、防糊或投料时机。
- `source_access` 明确区分 `opened`、`search_extract_only`、`timeout_pending`。后两类只能停在研究层，不得进入 B 试做架。
- 本批所有条目的 `B架` 均为“否”；`recipe_fact_checked` 只表示身份与部分做法事实已在来源中找到，不表示可照做或已通过厨房验证。

## 候选表（20 条）

| # | 建议 recipe_id | canonical_name | 地域/家族 | 直达来源（发布方） | source_access | 来源实际证明的事实 | direct_one_pot / 器具边界 | 缺口与去重说明 | 建议状态 | 目录关系 | B架 |
|---:|---|---|---|---|---|---|---|---|---|---|:---:|
| 1 | `cn-gd-wuchuan-eight-treasure-rice` | 吴川八宝饭 | 广东湛江吴川梅菉/八宝饭 | [吴川市政府·吴川八宝饭](https://www.gdwc.gov.cn/bmzz/wcsrmzfw/zjwc/xxly/fwms/content/post_369768.html)（吴川市人民政府网站） | `opened` | 原文列糯米、红枣、薏米、莲子、豆沙、冬瓜糖、咸鸭蛋、白糖等八种原料；记录甜味与叉烧/腊肠/冬菇/莲子咸味版本及 1922 年梅菉来源；写明淘洗浸透、油加水加糖炒至干饭状，加入预蒸料后装碗隔水蒸、倒扣成型。 | `staged_or_secondary`；油炒干饭状后再装碗蒸，器具为炒锅+蒸笼，不是电饭煲一键。甜味/宴席主菜边界。 | 无克重、米水比例、蒸制时长与安全终点；甜、咸两版不合并。 | `recipe_fact_checked` | `new_lead` | 否 |
| 2 | `cn-dongguan-wanjiang-cured-meat-claypot-rice` | 万江莞式腊味煲仔饭（官方活动版） | 广东东莞万江/腊味煲仔饭 | [东莞市民政局·万江居民煮煲仔饭](https://mzj.dg.gov.cn/msdgj/content/post_4286293.html)；[东莞官方 PDF《东莞日报》2024-10-25](https://www.dg.gov.cn/attachment/0/298/298979/4297989.pdf) | HTML `opened`；PDF `search_extract_only`（本轮 PDF 解析超时） | HTML 原文写淘米入瓦煲，加少量水焖米饭，米饭蒸熟后铺预先准备的腊味和菜，撒葱花、秘制酱油并拌匀；PDF 摘要与该流程一致。 | `staged_or_secondary`；瓦煲中先成饭、后铺熟腊味/菜，不把它改写成生米同焖；原器具为瓦煲。 | 无腊味克重、米水量、时间和安全终点；与目录中的广式腊味煲仔饭是地域证据升级候选，不应拼成统一配方。 | `recipe_fact_checked` | `new_lead`（与现有广式条目待人工合并裁决） | 否 |
| 3 | `cn-zhejiang-taizhou-yellowfish-earth-stove-rice` | 台州黄鱼焖土灶饭 | 浙江台州/黄鱼饭、土灶饭 | [浙江省经济信息中心·台州菜亮相联合国教科文组织总部](https://zjic.zj.gov.cn/ywdh/qyfz/202602/t20260213_23951039.shtml) | `opened` | 官方报道明确台州代表团现场烹制“黄鱼焖土灶饭”，确认具名、台州地域与土灶焖饭身份。 | `direct_one_pot` 仅到身份层；原报道没有流程/器具细节以外的可执行合同，土灶不能外推电饭煲。 | 目录已有 `黃魚飯` 条目，需人工判断是否同一 canonical；本行不新增第二个黄鱼配方，也不拼接鱼/米数量。 | `identity_verified` | `possible_existing_variant` | 否 |
| 4 | `cn-fujian-shanghang-grass-basket-danfan` | 上杭箪饭（草编饭苞） | 福建龙岩上杭/客家携行饭 | [上杭县文化馆·草编饭苞制作工艺](https://www.shwhy.cn/sys-nr/?g=11) | `timeout_pending`（此前可读的官方文化馆页面，本轮直达超时） | 文化馆页面记录洗米装入草编饭苞、扎紧开口、整体入水煮熟，并说明山区外出劳作携行习俗。 | `direct_one_pot` 是“整只饭苞入水煮饭”；容器煮饭，不是混合菜饭，不能视为电饭煲合同。 | 无米量、时间、安全和现代器具参数；保留为器具/携行饭档案。 | `recipe_fact_checked` | `new_lead` | 否 |
| 5 | `cn-gd-kaiping-xiangang-claypot-rice` | 蚬冈煲仔饭 | 广东江门开平蚬冈/煲仔饭 | [开平市政府·蚬冈煲仔饭剧场](https://www.kaiping.gov.cn/jmkpsxgz/gkmlpt/content/3/3223/post_3223014.html) | `timeout_pending` | 政府页面标题与摘要确认“蚬冈煲仔饭”及当地饮食展示/剧场语境。 | `direct_one_pot` 仅身份层；原器具、流程未读到。 | 无可核实配料、步骤、数量、液体、时间和安全；不得与赤坎煲仔饭合并。 | `identity_verified` | `new_lead` | 否 |
| 6 | `cn-gd-raoping-sanrao-glutinous-rice` | 三饶糯米饭制作技艺 | 广东潮州饶平三饶/糯米饭 | [饶平县政府·第三批县级非遗名录 PDF](https://www.raoping.gov.cn/czrpwgj/attachment/0/541/541711/3886484.pdf) | `timeout_pending` | 官方县级名录项目名称确认“三饶糯米饭制作技艺”和地域身份。 | 不能据名录推断是一锅饭或电饭煲做法。 | PDF 尚未完成本地归档与页码核对；无食材/步骤/器具/量/液体/时间/安全。 | `identity_verified` | `new_lead` | 否 |
| 7 | `cn-zhejiang-tiantai-huma-rice` | 天台胡麻饭制作技艺 | 浙江台州天台赤城/传统饭食 | [天台县政府·第八批县级非遗名录 PDF](https://zjjcmspublic.oss-cn-hangzhou-zwynet-d01-a.internet.cloud.zj.gov.cn/jcms_files/jcms1/web3221/site/attach/0/d8149ce226974fca9f01813169d70706.pdf) | `opened`（PDF 第 2 页） | 县政府公告的传统技艺名单逐字列“胡麻饭制作技艺”，申报地区为赤城街道。 | 仅身份，未证明具体做法或器具。 | 不把“胡麻”擅自解释成芝麻/油或配菜；待原始技艺说明。 | `identity_verified` | `new_lead` | 否 |
| 8 | `cn-yunnan-ruili-dai-steamed-rice` | 傣族蒸米饭制作技艺 | 云南德宏瑞丽/傣族蒸饭 | [瑞丽市非物质文化遗产名录](https://www.rl.gov.cn/slyj/Web/_F0_0_6I73ZWNB4E833B0A675745BEBE.htm) | `timeout_pending` | 市级非遗名录项目名确认“傣族蒸米饭制作技艺”。 | 无流程/配菜/蒸具可核实，不能从其他傣族饭食借用。 | 页面直达超时；无米种、数量、时间、安全和电饭煲边界。 | `identity_verified` | `new_lead` | 否 |
| 9 | `cn-yunnan-ruili-jingpo-steamed-rice` | 景颇族蒸米饭制作技艺 | 云南德宏瑞丽/景颇族蒸饭 | [瑞丽市非物质文化遗产名录](https://www.rl.gov.cn/slyj/Web/_F0_0_6I73ZWNB4E833B0A675745BEBE.htm) | `timeout_pending` | 同一官方名录列“景颇族蒸米饭制作技艺”。 | 仅身份，不得与傣族版本合并或补写食材。 | 同一名录页未能本轮直达；无步骤、器具、数量、时间、安全。 | `identity_verified` | `new_lead` | 否 |
| 10 | `cn-jiangsu-jintan-maoshan-qingjing-rice` | 茅山青精饭制作技艺 | 江苏常州金坛/青精饭 | [常州市政府·第六批市级非遗名录](https://www.changzhou.gov.cn/gi_news/61167487373135) | `opened` | 市政府公告第 7 项列“茅山青精饭制作技艺”，申报地区为金坛区。 | 植物染色饭的原料和处理流程未给出，不能借用其他乌饭资料；器具未知。 | 无青精原料、米量、液体、浸泡/蒸制时间、安全。 | `identity_verified` | `new_lead` | 否 |
| 11 | `cn-shanxi-datong-taici-gongmi-rice` | 田园北魏家宴太后贡米饭制作技艺 | 山西大同平城区/家宴贡米饭 | [大同市政府·第九批市级非遗名录 PDF](https://www.dt.gov.cn/dtszf/tzh/202602/2ba617574793467688468c2ea11e5ecc/files/f4c541e3209d4454a3aa6e349eb51f13.pdf) | `opened`（PDF 第 3 页） | 市政府名录明确列项目“田园北魏家宴太后贡米饭制作技艺”，保护单位为平城区文化馆。 | 只有项目身份，不证明家庭一锅做法或现代器具。 | 无配料、步骤、份量、液体、时间、安全；不得把“贡米”扩成自创菜谱。 | `identity_verified` | `new_lead` | 否 |
| 12 | `cn-zhejiang-wencheng-she-black-rice` | 文成畲族乌米饭烧制技艺 | 浙江温州文成/畲族乌米饭 | [温州市非遗项目名录 PDF](https://www.wenzhou.gov.cn/module/download/downfile.jsp?classid=0&filename=97e222c01d92492db61531bef0594168.pdf) | `timeout_pending` | 市级项目名录定位“畲族乌米饭烧制技艺”及文成地域。 | 仅名录身份；不把其他畲族乌饭的叶汁与时间拼接进来。 | PDF 需归档核验；无染料、浸泡、蒸制、批量、时间、安全、电饭煲事实。 | `identity_verified` | `new_lead` | 否 |
| 13 | `cn-guangdong-jiangmen-pengjiang-renri-rice-cake-pot` | 蓬江人日菜（米团糍一锅熟） | 广东江门蓬江/节令米团糍 | [蓬江区文广旅体局·米团糍制作技艺](https://www.pjq.gov.cn/jmpjqwgj/gkmlpt/content/2/2873/post_2873468.html) | `opened` | 官方页称正月初七以米团糍与芹菜、葱、蒜、生菜、菜心、芥菜、红萝卜七样食材“一锅熟”；并详细写米浸泡 2 小时、磨浆、煮成面团、蒸 4 小时的米团糍制作。 | `staged_or_secondary`；主体是预制米团糍/年糕状米食，七样配料同煮，不是生米菜饭；不直接电饭煲化。 | 无家庭份量、液体、肉类/安全合同；作为“一锅熟”边界，不进入生米轮替。 | `recipe_fact_checked` | `new_lead` | 否 |
| 14 | `cn-chongqing-hechuan-laitan-yinmi-chicken` | 涞滩阴米乌鸡粥 | 重庆合川涞滩/阴米饭食 | [合川区政府·涞滩阴米非遗技艺](https://www.hc.gov.cn/bmjd/bm_100475/whlyw/zwxx_101408/dt_101410/202602/t20260204_15378363.html) | `opened` | 区文化旅游委写阴米由晚糯米浸润、蒸至七分熟、摊晾阴干制成；列“阴米乌鸡粥”为代表吃法，阴米与乌鸡慢炖。 | `staged_or_secondary`；阴米是预加工米，且成品为粥，不能套生米焖饭比例；原文未给电饭煲参数。 | 无独立克重、液体、炖煮时间和鸡肉安全终点；与现有“合川阴米乌鸡粥”未见同名记录但需主目录复核。 | `recipe_fact_checked` | `new_lead` | 否 |
| 15 | `cn-gd-guangzhou-zengcheng-zhengguo-wufan` | 正果镇畲族乌饭 | 广东广州增城/畲族乌饭 | [广州市民族宗教事务局·畲族乌饭制作技艺](https://mzzjj.gz.gov.cn/xwdt/gqdt/content/post_10848697.html) | `opened` | 官方页写乌稔树嫩叶汁浸糯米、蒸煮并晒干；另写捣叶、包纱布煮出黑汁，再将糯米倒入汁中烧煮染色。 | `staged_or_secondary`；叶汁预处理+煮/蒸/晒，不是肉菜主餐；植物身份和安全必须独立核验。 | 无叶/米量、液体比例、时间与安全；与泛“畲族乌饭”及其他地域版本分开。 | `recipe_fact_checked` | `new_lead` | 否 |
| 16 | `cn-hunan-yongzhou-dongan-damiaokou-wumi-fan` | 大庙口乌米饭 | 湖南永州东安/乌饭 | [永州市文旅局·东安乌饭](https://www.yzcity.gov.cn/wlgtj/0203/201705/b1ecd1332a534ddb938c0d8757fd3a9a.shtml) | `opened`（此前官方页面已核验） | 官方页记大庙口用乌桕/乌饭树叶煮黑色汁水，再做一锅糯米饭，四月初八家家食用。 | `direct_one_pot` 仅证明染汁煮饭；原器具未明确，不得外推电饭煲。 | 无叶汁量、米量、浸泡/时间和安全；与其他乌饭地域版本不合并。 | `recipe_fact_checked` | `new_lead` | 否 |
| 17 | `cn-xj-mulei-chickpea-pilaf` | 鹰嘴豆抓饭 | 新疆昌吉木垒/抓饭变体 | [新疆财政厅·木垒鹰嘴豆](https://czt.xinjiang.gov.cn/xjczt/c115019/202508/a56dad9f8a0849e4ba183196263a59ed.shtml) | `opened`（官方农业资料） | 官方文中明确鹰嘴豆是“鹰嘴豆抓饭”的关键食材/地方产品线索。 | `direct_one_pot` 身份与食材线索，不证明完整流程；抓饭传统锅具不能直接转电饭煲。 | 无米、肉、液体、步骤、时间、安全；不得套克州/伊犁抓饭数字。 | `identity_verified` | `new_lead` | 否 |
| 18 | `cn-fujian-fuzhou-lianjiang-digua-xing-fan` | 连江地瓜腥饭 | 福建福州连江/地瓜饭 | [连江县政府·连江民俗](https://www.fzlj.gov.cn/xjwz/zjlj/gslj/fsmq/201707/t20170705_1228826.htm) | `opened`（官方民俗页此前核验） | 县级页面定位沿海渔汛时吃“糯米干饭或大米、地瓜腥饭”，确认具名与地域饮食语境。 | `direct_one_pot` 仅身份线索；“腥饭”具体食材与锅具未展开。 | 需判定“地瓜腥饭”是否与番薯干饭/海鲜饭同名；无配比、液体、时间、安全和电饭煲参数。 | `identity_verified` | `new_lead` | 否 |
| 19 | `cn-shandong-jinan-zhengtai-dami-bazirou` | 正泰恒大米干饭把子肉 | 山东济南/干饭把子肉 | [商务部中华老字号数字博物馆](https://lzhbwg.mofcom.gov.cn/edi_ecms_web_front/thb/detail/d1bc5e5cbd6148b2a5f0a866b402f17d) | `search_extract_only` | 官方老字号资料定位济南“大米干饭铺”与把子肉的组合/店铺身份。 | 可能是米饭与把子肉分装组合，不得标为同锅；器具与流程未证。 | 需要直接打开原条目，确认是否具名单锅饭；无数量、液体、时间、安全。 | `identity_verified` | `new_lead` | 否 |
| 20 | `cn-yn-baoshan-shidian-luoguo-ham-potato-rice` | 罗锅火腿肉土豆焖饭 | 云南保山施甸/罗锅焖饭 | [施甸县政府·施甸舌尖图鉴](https://shidian.gov.cn/info/1111/3740813.htm) | `opened`（官方县政府页面此前核验） | 官方文写铁锅/铜锅火腿肉土豆焖饭，淘米加水，水分收干后加入火腿肉和土豆丁，描述成品香味。 | `staged_or_secondary`；原文是先煮米收水再加料，且罗锅/铜锅；不能把原锅参数改成电饭煲。 | 无米量、液体量、火力、时间、安全；与同文“铜锅土豆焖饭”可能是同源变体，须人工裁决，不并列拼配。 | `recipe_fact_checked` | `new_lead` | 否 |

## 本批结论

- 20 条均在本批开始前的 r110/844 主目录中按建议 `recipe_id` 与名称检索不到；其中 #2、#3 与已有广式腊味煲仔饭/台州黄鱼饭可能存在同源或别名关系，已显式标为待人工合并，不把它们当作已确认的独立菜单。
- 证据强度分层：#1、#2、#13、#14、#15、#16、#20 已有直接官方正文的身份与部分流程/食材事实；#7、#10、#11 由可直接打开的政府名录/PDF确认身份；其余部分因 PDF/页面超时或仅摘要，暂留研究层。
- `direct_one_pot` 不等于“电饭煲可照做”。本批没有一条获得电饭煲水量、程序、防糊或投料时机合同，不能进入 B 试做架；尤其吴川八宝饭、蓬江人日菜、涞滩阴米乌鸡粥属于甜饭/米团糍/预加工阴米或粥类边界，不能为扩数量改称普通菜饭。
- 东莞官方 PDF 的网页解析本轮失败，但同一活动的东莞市民政局 HTML 已直接打开并逐步证明瓦煲腊味饭流程；PDF 保留为待归档凭证，不用其搜索摘录单独闭合合同。
- 本批未修改主目录、未改变轮替池、未产生 DeepSeek 调用、未部署。
