# 中国大陆地域一锅饭候选搜集批次 r110

日期：2026-08-07
目录基线：`source-backed-one-pot-v1-20260807-national-r109`（842 条）
范围：仅记录中国大陆政府、非遗机构、地方文化馆或官方文化页面中可直接核验的具名菜饭、焖饭、煲仔饭、竹筒饭及相邻边界项。本文件是 intake，不修改主 JSON、CSV、运行时代码或发布包。

## 记录纪律

- 本批先按现有目录的 `canonical_name`、aliases 和地域变体去重。`catalog_status=existing_evidence_upgrade` 的记录不是新增菜谱，而是为已有条目补一条直接官方证据；只有 `new_lead` 才是尚未在当前目录中发现的候选线索。
- 来源只证明原文写明的事实。没有量、液体、时间、步骤或安全信息时保留缺口，不用其他菜拼接；原器具（柴灶、铜锅、砂锅、竹筒、蒸笼）不推导为电饭煲参数。
- `recipe_fact_checked` 只表示身份与部分食材/工艺事实已在来源中出现，不等于可照做；`identity_verified` 只表示名称、地域或技艺身份已确认。
- `B试做架` 只有在量、液体、流程、时间和安全边界足以支持家庭试做时才考虑；本批新增线索均暂不进入 B 架。
- `search_extract_opened`、超时或页面只给活动/名录身份的记录只能留在研究层，不能晋升公开可照做状态。

## 候选与证据表（18 条）

| # | 建议 recipe_id | canonical_name | 地域/家族 | 直达官方来源 | 来源实际证明 | 主要缺口与器具边界 | 建议状态 | 目录关系 | B 试做架 |
|---:|---|---|---|---|---|---|---|---|:---:|
| 1 | `cn-zhejiang-taizhou-yellowfish-earth-stove-rice` | 台州黄鱼焖土灶饭 | 浙江台州/土灶饭 | [国务院侨办·台州非遗美食](https://www.gqb.gov.cn/news/2026/0211/61382.shtml) | 正文明确台州菜非遗传承人在展区现场烹制“黄鱼焖土灶饭”，确认具名、地域和土灶焖饭技法线索 | 只有菜名和活动记录；无黄鱼米量、液体、时间、安全或家用电饭煲参数。土灶事实不能外推 | `identity_verified` | `new_lead` | 否 |
| 2 | `cn-shanghai-changning-spring-bamboo-bacon-mustard-rice` | 春笋腊肉荠菜焖饭 | 上海长宁/季节菜饭 | [长宁区政府·春菜上新](https://www.shcn.gov.cn/col5962/20260317/1307094.html) | 原文列出春笋、荠菜、腊肉与米饭焖制，描述“鲜、香、糯”，确认具名和食材结构 | 没有米水比例、份量、时间、锅具和安全终点；社区食堂做法不能直接改成家用电饭煲合同 | `recipe_fact_checked` | `new_lead` | 否 |
| 3 | `cn-fujian-shanghang-grass-basket-danfan` | 上杭箪饭（草编饭苞） | 福建上杭/客家箪饭 | [上杭县文化馆·草编饭苞制作工艺](https://www.shwhy.cn/sys-nr/?g=11) | 文化馆原文写明洗好的米装入草编饭苞、扎紧后整体入水煮熟；并记录客家山区外出劳作习俗 | 容器为草编饭苞、水煮，不是混合菜饭；无米量、时间、安全和现代器具适配。作为器具/携行饭边界，不直接轮替 | `recipe_fact_checked` | `new_lead` | 否 |
| 4 | `cn-gd-kaiping-xiangang-claypot-rice` | 蚬冈煲仔饭 | 广东开平蚬冈/煲仔饭 | [开平市政府·蚬冈煲仔饭剧场](https://www.kaiping.gov.cn/jmkpsxgz/gkmlpt/content/3/3223/post_3223014.html) | 政府页面确认蚬冈煲仔饭剧场与地方非遗饮食展示，确认名称和地域身份 | 直达正文多次超时，只能标 `source_access_pending`；没有配料、流程、量或电饭煲适配，不与赤坎版本拼接 | `identity_verified` | `new_lead` | 否 |
| 5 | `kunshan-zhangpu-jiangnan-vegetable-rice` | 张浦江南菜饭 | 江苏昆山张浦/江南菜饭 | [昆山市政府·金华村传统村落](https://www.ks.gov.cn/kss/bmdt/202505/b349fef57c6746d9ba9538434d020019.shtml) | 官方页写张浦本地大米、金华村腊肉、矮脚青菜，经柴火土灶“焖煮鲜炒”做成江南菜饭 | 无克重、液体、时间、锅具转换和安全终点；“焖煮鲜炒”是原灶流程，不能推导电饭煲 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 6 | `cn-yn-baoshan-shidian-pea-potato-ham-rice` | 豌豆洋芋火腿焖饭 | 云南保山施甸/焖饭 | [施甸县政府·青豌豆吃法](https://shidian.gov.cn/info/1111/3792183.htm) | 直达原文列出火腿丁煸油，再与青豌豆米、土豆丁、大米拌匀，入罗锅柴火慢焖 | 无配比、液体、时长和安全；罗锅/柴火只证明原器具，不能当电饭煲参数 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 7 | `yunnan-wa-chicken-lanfan` | 佤族鸡肉烂饭 | 云南临沧沧源/烂饭 | [沧源县政府·佤族饮食习俗](https://cangyuan.gov.cn/artview/739/267924.html) | 官方文化页记大米与鸡肉等原料同煮，成品介于米饭与稀饭之间；也列青菜、南瓜、洋芋等可同煮原料 | 页面直接抓取偶发超时，需再次归档原文；没有克重、液体、时间或家用锅参数，鸡肉安全必须单独保留 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 8 | `ningxia-wuzhong-rouzhanfan` | 肉粘饭 | 宁夏吴忠/肉粘饭 | [宁夏农业农村厅·宁夏大米](https://nynct.nx.gov.cn/rdzt/ppny/202211/t20221103_3829781.html) | 官方农业页写牛羊肉、洋葱、胡萝卜先炒，再与米饭同蒸，成品介于粥与饭之间 | 页面本轮抓取超时；无克重、液体、时间、安全和电饭煲参数；需区分“同蒸”与“先成饭再蒸” | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 9 | `xiangjiangyuan-bamboo-rice` | 湘江源瑶家竹筒饭 | 湖南蓝山/瑶族竹筒饭 | [蓝山县政府·湘聚缘柴火山庄](https://www.lanshan.gov.cn/lanshan/msmw/201805/a96955c68487440983d0b541f179de37.shtml) | 原文给出糯米、茶豆、瘦肉末各约三分之一；蒸好茶豆饭后塞入竹筒、粽叶封口并蒸约半小时 | 竹筒、蒸制和原料比例均属原文事实；无家庭电饭煲转换、防糊和肉类安全细节 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 10 | `lingchuan-heguo-rice` | 陵川和锅大米 | 山西陵川/一锅出 | [陵川县政府·陵川和锅大米](https://www.lczf.gov.cn/txlc_5/lcms/202512/t20251229_2302909.shtml) | 县政府明确“附城一带叫一锅出、潞城一带叫柴火大米”，可放蔬菜副食同锅焖，是当地家常饭系 | 仅身份和概念描述，无具体食材、量、水、时间、安全或电饭煲参数 | `identity_verified` | `existing_evidence_upgrade` | 否 |
| 11 | `dongzhi-guoba-rice` | 东至农家锅巴饭 | 安徽池州东至/锅巴饭 | [池州市人社局·东至农家锅巴饭](https://czsrsj.chizhou.gov.cn/News/show/608587.html) | 官方制作记录确认一锅含萝卜圆子、粉蒸肉和锅巴三类结构，说明地方名菜与成品特点 | 公开页未给完整原料量、米水比例、火候时间和安全；粉蒸肉的蒸制链需单独核验 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 12 | `kaiping-chikan-claypot-rice` | 赤坎煲仔饭 | 广东开平赤坎/非遗煲仔饭 | [开平市文化馆·赤坎煲仔饭烹饪技艺](https://www.kaiping.gov.cn/kpswhgdlytyj/kpwhg/fwzwhyc/fyxm/content/post_2533528.html) | 文化馆明确果木柴火、十月晚稻米和黄鳝/牛肉/排骨/腊味等配料，记录饭煮到七成熟后加料焗熟的流程节点，并确认县级非遗 | 无固定份量、米水比例、具体时长和安全合同；果木柴火、砂煲与电饭煲边界必须分开 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 13 | `qianjiang-firewood-potato-rice` | 柴火洋芋饭 | 重庆黔江/洋芋饭 | [黔江区政府·柴火洋芋饭](https://www.qianjiang.gov.cn/bmjd/xzfgzbm/qwhlyw/zwgk_49175/gkml/cyqj/czqj/202506/t20250612_14708703.html) | 政府页写高山洋芋先炒至金黄，再与大米同锅柴火慢炖；说明可加腊肉、腊肠或蔬菜 | 原文没有克重、液体、时间、锅具适配；营养结构通常偏碳水，若进入主餐须补蛋白/蔬菜评价 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 14 | `cn-hubei-tongren-shefan-newspaper-evidence` | 铜仁社饭（报纸流程证据） | 贵州铜仁/社饭 | [铜仁日报官方 PDF（社饭制作报道）](https://szb.tongren.gov.cn/trrb/attachment/202503/21/ca5a5185-f930-4fc3-ac83-172d14fdabff.pdf) | 官方地方报纸摘录写蒿菜等野菜、腊肉、糯米、干豆腐、花生混合后铁锅焖制，确认社饭流程与食材结构 | 需保存 PDF 页码与本地哈希；没有可靠克重、液体、时间和电饭煲参数；与目录多条社饭地域变体需去重 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 15 | `cn-shanxi-shexian-millet-braised-rice` | 涉县小米焖饭 | 河北涉县/小米焖饭 | [文化和旅游部·古城幽山小镇](https://zhuanti.mct.gov.cn/rxhmxjgn2022/hebei/detail/2790.html) | 文旅部页面写时菜（白菜或茄子）炒后加小米、盐、水同焖；另有纯小米配胡萝卜、土豆丝、野韭花或酸菜的版本 | 没有定量、时间、锅具和安全；两种做法不能混成一个配方，需作为同名变体留证 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 16 | `cn-hunan-linxiang-taolin-fengguo` | 桃林丰锅团年饭 | 湖南临湘/年俗一锅菜（非米饭） | [临湘市政府史志办·桃林丰锅](https://www.linxiang.gov.cn/24733/24760/24821/24992/25001/content_682109.html) | 史志办原文写腊肉、油豆腐、萝卜、香菇、豆腐、白菜、粉丝、黄花分层入锅炖，荤素一锅、可吃数日 | 这是无米锅菜，不应混入米饭轮替；保留为“广义一锅出”边界，原田畈明火器具不能转换 | `identity_verified` | `boundary_only` | 否 |
| 17 | `cn-beijing-miyun-simatai-zhuangguozi` | 司马台装锅子 | 北京密云/非遗暖锅（非米饭） | [密云区政府·司马台装锅子](https://www.bjmy.gov.cn/stmy/mywl/jphd/202605/t20260526_542938.html) | 政府页面写传统铜锅分层放酸菜、粉条、海带、五花肉，倒高汤小火慢炖 | 无米饭成分，是锅菜而非菜饭；不进入米饭目录，只作为一锅主餐边界记录 | `identity_verified` | `boundary_only` | 否 |
| 18 | `cn-shandong-yantai-ninghai-naofan` | 宁海州脑饭 | 山东烟台/传统饭食边界 | [烟台市政府·宁海州脑饭](https://www.yantai.gov.cn/art/2018/6/19/art_11748_1167698.html) | 政府非遗资料说明宁海州脑饭的历史与“米粥/豆腐脑/花生、粉条、小菜”等组合线索 | 现有页面未形成可验证米饭主餐配方，可能是粥与豆腐脑组合；不得按名称强行纳入菜饭轮替 | `identity_verified` | `boundary_only` | 否 |

## 重点复核与去重裁决

1. **新增线索**：#1 台州黄鱼焖土灶饭、#2 春笋腊肉荠菜焖饭、#3 上杭箪饭、#4 蚬冈煲仔饭均未在当前目录发现同名 canonical；先留在 intake，下一轮需补完整原始做法或确认其仅为身份记录。
2. **证据升级而非加菜**：#5–#15 均与当前目录已有名称或家族相近，不能因为找到更好的来源就重复新增。后续若更新主目录，应只追加 source_ref、access_status 和 evidence_locator，并 bump catalog 版本。
3. **边界排除**：#16 桃林丰锅、#17 司马台装锅子没有米饭；#18 宁海州脑饭的核心形态尚未确认，不用“饭”字推断其为米饭主餐。三者保留研究记录，但不进入米饭轮替池。
4. **器具纪律**：土灶、罗锅、铜锅、竹筒、铁锅、木甑只证明来源中的原器具。没有官方电饭煲适配或厨房实测，就不填写电饭煲程序、水位、防糊和投料时机。
5. **营养纪律**：#13 柴火洋芋饭的来源只证明米和洋芋结构，并提到可加腊肉/腊肠/蔬菜；不能把可选配料直接写成固定营养合同，应单独评估其“纯碳水”风险。

本批未修改主目录、未改变轮替池、未新增运行时调用、未部署。
