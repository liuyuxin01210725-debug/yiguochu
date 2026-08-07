# 中国大陆地域一锅饭候选搜集批次 r104

日期：2026-08-07  
目录基线：`source-backed-one-pot-v1-20260807-national-r103`（813 条）  
范围：只登记中国大陆公开来源中的具名一锅饭、菜饭、焖饭、炊饭、箜饭、抓饭、乌饭或相关地域米饭候选。本文件是 intake，不改变主目录、CSV、运行时代码或发布状态。

## 本批边界

- 本批按当前 r103 目录的 `canonical_name`、aliases 和明显地域变体去重；候选没有直接写入主 JSON。
- 同一来源把一个菜写成多个俗称时，先登记为“名称待裁决”，不把它们计成两个可上线菜谱。
- `recipe_fact_checked` 只表示来源明确给出了身份以及部分食材/工艺事实；不表示定量、液体、时间、安全和电饭煲适配已闭合。
- `identity_verified` 只表示来源足以确认菜名、地域或技艺身份。
- `B试做架=否` 表示目前缺少会直接影响家庭操作的合同；不从其他菜拼接缺项，也不把原器具参数推导成电饭煲参数。
- `opened` 表示直达页面已打开；`search_extract_opened`、`unopened_timeout` 或 `source_access_pending` 表示已定位 URL 但原文尚未完成直接核验，不能据此晋升或进入试做架。

## 候选总表（24 条，均未以相同 canonical name 进入 r103）

| # | 建议 recipe_id | canonical_name | 地域/家族 | 主要来源（发布方） | 来源实际能证明 | 缺口 | 建议状态 | B 试做架 | 去重/边界 |
|---:|---|---|---|---|---|---|---|:---:|---|
| 1 | `cn-gd-guangzhou-zengcheng-zhengguo-wufan` | 正果镇畲族乌饭 | 广州增城/乌饭 | [广州市民族宗教局](https://mzzjj.gz.gov.cn/xwdt/gqdt/content/post_10848697.html) | 乌稔叶汁浸糯米、烧煮/蒸制、猪油热炒线索；市级非遗身份 | 叶片安全、克重、液体、时间、器具 | `recipe_fact_checked` | 否 | 与泛 `畲族乌饭` 同家族，保留正果地域证据 |
| 2 | `cn-hunan-yongzhou-dongan-damiaokou-wumi-fan` | 大庙口乌米饭 | 湖南东安/乌饭 | [永州市文旅局](https://www.yzcity.gov.cn/wlgtj/0203/201705/b1ecd1332a534ddb938c0d8757fd3a9a.shtml) | 南烛（乌饭树）叶汁浸糯米后煮成乌米饭；大庙口非遗项目 | 米量、染液、时间、安全、器具 | `identity_verified` | 否 | 与东安乌饭家族分离，不拼其他版本 |
| 3 | `cn-yn-honghe-gejiu-manhao-dai-hand-grab-rice` | 蔓耗傣家手抓饭 | 云南个旧蔓耗/手抓饭 | [个旧市人民政府](https://www.hhgj.gov.cn/info/11701/591781.htm) | 烤鸡、烤肉、四色糯米饭铺成“孔雀开屏”宴席，百年傣家习俗 | 非单锅主餐；无克重、液体、流程、安全 | `identity_verified` | 否 | 宴席/摆盘边界，不伪装成一锅 |
| 4 | `cn-yn-baoshan-longling-dai-hand-grab-rice` | 龙陵傣族手抓饭 | 云南保山龙陵/手抓饭 | [龙陵县文旅局非遗名录 PDF](https://www.longling.gov.cn/virtual_attach_file.vsb?afc=uLmVUkMR94olrkonRGDLRGYLmr2Uz7S8M8W2Lm62nlWknmG0gihFp2hmCIa0LYysokyZLSyPM4NDnNLPU4l8U8QVn7UYolUiMmNZM7MRLmWFUN7aLzQfUNWFL4fRMlUJv2nto4OeoDPO5s6TC1hXptQ0g4-4MmG8g4L8LzGioRNJqdznx) | 县级非遗项目名录确认“傣族手抓饭”及传承单位 | 原文未给食材、锅具、步骤、定量或安全 | `identity_verified` | 否 | 非遗身份档案；不与蔓耗版本合并 |
| 5 | `cn-xj-aksu-shaya-hailou-pilaf` | 沙雅海楼抓饭 | 新疆阿克苏沙雅/抓饭 | [沙雅县政府文化专题](https://www.aksxw.com/sy/zt/whzgx/202407/t20240710_22416633.html)；[阿克苏日报](https://www.aksrb.cn/pad/con/201907/25/content_10428.html) | 定位到海楼抓饭地方名；报道线索提到羊腿/羊排、洋葱及抓饭焖制 | 原文访问状态待复核；无完整量、水、时间、安全合同 | `identity_verified` | 否 | 不能把媒体摘要当完整做法 |
| 6 | `cn-xj-mulei-chickpea-pilaf` | 鹰嘴豆抓饭 | 新疆昌吉木垒/抓饭变体 | [新疆财政厅](https://czt.xinjiang.gov.cn/xjczt/c115019/202508/a56dad9f8a0849e4ba183196263a59ed.shtml) | 官方文中明确鹰嘴豆是制作鹰嘴豆抓饭的关键食材 | 未提供米、肉、液体、流程、时间、安全 | `identity_verified` | 否 | 仅身份/食材线索；不能套通用抓饭配方 |
| 7 | `cn-yn-di qing-weixi-lisu-tongguo-fan` | 维西傈僳族铜锅饭 | 云南迪庆维西/铜锅饭 | [维西县农业农村局资料 PDF](https://www.weixi.gov.cn/file/diqing/weixi_nyncj/file/20240820/1724142145844026190.pdf) | 官方地方资料列出“铜锅饭”为傈僳族特色美食 | PDF 原文需归档复核；无食材、步骤、量、水和安全 | `identity_verified` | 否 | 原器具是铜锅，不推导电饭煲 |
| 8 | `cn-fujian-fuzhou-lianjiang-digua-xing-fan` | 连江地瓜腥饭 | 福建福州连江/地瓜饭 | [连江县人民政府](https://www.fzlj.gov.cn/xjwz/zjlj/gslj/fsmq/201707/t20170705_1228826.htm) | 县级页面定位沿海渔汛时吃“糯米干饭或大米、地瓜腥饭” | 直达页需复核；无固定配方、液体、时间、器具 | `identity_verified` | 否 | “地瓜腥饭”与番薯干饭可能是异名，待原文裁决 |
| 9 | `cn-shandong-jinan-zhengtai-dami-bazirou` | 正泰恒大米干饭把子肉 | 山东济南/干饭把子肉 | [商务部中华老字号数字博物馆](https://lzhbwg.mofcom.gov.cn/edi_ecms_web_front/thb/detail/d1bc5e5cbd6148b2a5f0a866b402f17d) | 老字号资料定位济南“大米干饭铺”、把子肉与米饭组合 | 目前主要为检索摘录；干饭和把子肉可能是分装组合而非一锅 | `identity_verified` | 否 | 与济宁甏肉干饭保持不同地域身份 |
| 10 | `cn-yn-baoshan-shidian-luoguo-ham-potato-rice` | 罗锅火腿肉土豆焖饭 | 云南保山施甸/焖饭 | [施甸县人民政府](https://shidian.gov.cn/info/1111/3740813.htm) | 县政府页面列出菜名及火腿肉、土豆焖饭语境 | 文中无米量、液体、时间、安全；“罗锅”器具边界待证 | `recipe_fact_checked` | 否 | 与豌豆洋芋火腿焖饭不是同名；需确认是否同源变体 |
| 11 | `cn-yn-baoshan-shidian-tongguo-potato-rice` | 铜锅土豆焖饭 | 云南保山施甸/铜锅饭 | [施甸县人民政府](https://shidian.gov.cn/info/1111/3740813.htm) | 同文写明淘米加水，水收干后加火腿肉和土豆丁，称“铜锅土豆焖饭” | 无克重、火力、时间、安全；同一文章中的名称关系待裁决 | `recipe_fact_checked` | 否 | 与第10条可能是同一地方变体，先不拆成两个生产条目 |
| 12 | `cn-hunan-winter-solstice-nuomi-fan` | 湖南冬至糯米饭 | 湖南多地/节令糯米饭 | [中国气象局冬至资料](https://www.cma.gov.cn/ztbd/2025zt/24jq/dongzhi/index.html) | 记录湖南冬至糯米与腊肉、腊肠同蒸/同煮的节俗 | 地域版本、量、液体、时间、安全和器具 | `identity_verified` | 否 | 节俗身份，不拼地方腊味版本 |
| 13 | `cn-jiangxi-ganzhou-anyuan-menfan` | 安远焖饭 | 江西赣州安远/焖饭技法 | [安远县人民政府](https://www.ay.gov.cn/ayzf/c103773/tt.shtml) | 生米煮至半熟、滤汤、余热焖熟；页面还区分大甑饭、竹筒饭、钵仔饭并提及现代电饭煲 | 直达页访问不稳定；无固定配料、量、液体、安全和机型参数 | `recipe_fact_checked` | 否 | 先登记技法，不把它扩写成某个配料菜 |
| 14 | `cn-chongqing-chengkou-larou-fan` | 城口腊肉饭 | 重庆城口/腊肉饭 | [中国共产党新闻网地方栏目](https://m.12371.gov.cn/content/2023-07/22/content_446437.html) | 摘要定位城口老腊肉先煮后切，与豌豆、胡萝卜、糯米制作腊肉饭 | 原文尚需直达核验；无量、液体、时间、安全和电饭煲适配 | `recipe_fact_checked` | 否 | 与泛“腊肉饭”分地域，不拼其他来源 |
| 15 | `cn-shaanxi-yulin-mizhi-laba-jiangdou-menfan` | 米脂腊八豇豆焖饭 | 陕西榆林米脂/腊八焖饭 | [陕西省地方志办公室](https://dfz.shaanxi.gov.cn/zslm/sxsq/msfq/201704/t20170421_2620781.html) | 地方志摘要记录软米/小米、红枣、豇豆组成腊八焖饭 | 原页访问超时；无可复核量、液体、时间、器具和安全 | `identity_verified` | 否 | `unopened_timeout`，不得按摘要入库 |
| 16 | `cn-fujian-quanzhou-minnan-xiancai-fan` | 闽南咸菜饭 | 福建泉州/咸菜饭 | [泉州市市场监管局地方标准 PDF](https://scjgj.quanzhou.gov.cn/xxgk/zfxxgk/fdzdgknr/yzdgkdqtzfxx/202411/P020241202553885200304.pdf) | 地方标准目录确认“闽南咸菜饭”具名和泉州代表性 | 标准目录不是完整做法；无食材、流程、量、水、时间、安全 | `identity_verified` | 否 | 与闽南芥菜饭、咸饭近名但不静默合并 |
| 17 | `cn-qinghai-hainan-guinan-juemafan` | 贵南蕨麻饭 | 青海海南州贵南/蕨麻饭 | [贵南县人民政府](https://www.guinan.gov.cn/lnb/xwpd1/gnkb1__xwpd/gnkb/content_14603693) | 县级美食名录确认“蕨麻饭”具名与贵南地域 | 仅名录身份；无食材、流程、量、液体、时间和安全 | `identity_verified` | 否 | 不由蕨麻名称推断配方 |
| 18 | `cn-inner-mongolia-bayannur-shanba-daguofan` | 陕坝大锅饭 | 内蒙古巴彦淖尔陕坝/大锅饭 | [巴彦淖尔市政府](https://www.bynr.gov.cn/dtxw/qqdt/202505/t20250506_696409.html) | 官方地方活动列出菜名和地域 | 活动报道无配料、步骤、量、水、时间和家庭器具 | `identity_verified` | 否 | 文化档案候选，不把“大锅”当工艺合同 |
| 19 | `cn-zhejiang-jiaxing-pinghu-yemifan` | 平湖野米饭 | 浙江嘉兴平湖/野米饭 | [杭州网地方饮食报道](https://jrsh.hangzhou.com.cn/content/2025-04/28/content_8984043.html) | 报道记蚕豆、春笋、咸肉与糯米同锅焖煮的春日野米饭 | 来源需保存原文；无固定量、水、时间和电饭煲适配 | `recipe_fact_checked` | 否 | 与德清豌豆饭同文不同地方版本，不能拼量 |
| 20 | `cn-zhejiang-huzhou-deqing-wandou-fan` | 德清豌豆饭 | 浙江湖州德清/豌豆饭 | [杭州网地方饮食报道](https://jrsh.hangzhou.com.cn/content/2025-04/28/content_8984043.html) | 报道记豌豆、春笋、咸肉、土豆与糯米一锅焖 | 无固定量、水、时间、安全和电饭煲参数 | `recipe_fact_checked` | 否 | 与平湖野米饭并列记录，不取平均 |
| 21 | `cn-zhejiang-huzhou-dongrifan` | 湖州冬日饭（咸肉菜饭） | 浙江湖州/菜饭 | [浙江在线](https://zjnews.zjol.com.cn/zjnews/202401/t20240122_26598283.shtml) | 报道记咸肉、冬笋、青菜与米饭炒后焖制的“三色冬日饭” | 无固定量、液体、时间、安全和电饭煲适配 | `recipe_fact_checked` | 否 | 与上海咸肉菜饭同家族但保留湖州地域 |
| 22 | `cn-shaanxi-shenmu-hehe-laba-fan` | 合河村腊八饭 | 陕西榆林神木/腊八饭 | [陕西省地方志办公室](https://dfz.shaanxi.gov.cn/zslm/zjyd/fzsy/202001/t20200106_2623780.html) | 地方志资料定位小米、糯米、红枣等腊八蒸饭习俗 | 原文访问与正文定位待归档；无固定量、液体、时间、安全 | `identity_verified` | 否 | 与米脂腊八焖饭分开，待原文核验 |
| 23 | `cn-shandong-yantai-ninghai-naofan` | 宁海州脑饭 | 山东烟台/传统饭食边界项 | [烟台市政府非遗名录 PDF](https://www.yantai.gov.cn/module/download/downfile.jsp?classid=0&filename=6d6e6c29fb4747f0bb08c53d96a2d6f4.pdf&showname=126.pdf) | 官方名录确认“宁海州脑饭制作技艺”名称和地域 | 现阶段只确认身份；民间释义可能是粥/豆腐脑组合，未确认米饭主餐做法 | `identity_verified` | 否 | 边界候选，不按名称纳入主餐 |
| 24 | `cn-hunan-changsha-jianyou-babaofan` | 乾煎鸡油八宝饭 | 湖南长沙/甜味八宝饭 | [湖南省政府](https://www.hunan.gov.cn/hnszf/jxxx/hxwh/cwd/201711/t20171111_4685433.html) | 糯米、八宝果料浸泡/蒸制、鸡油拌蒸、最后煎黄；给出部分时间 | 甜点/节庆饭，不是默认营养主餐；蒸锅+煎锅，非电饭煲一锅 | `recipe_fact_checked` | 否 | 资料边界项，除非另立甜饭品类 |

## 重点原文核验记录

### 正果镇畲族乌饭

广州市民族宗教局原文明确“正果镇畲族乌饭制作技艺”入选市级非遗；正文记载乌稔树嫩叶洗净、捣烂、包纱布煮出乌黑汤汁，将糯米倒入汤汁烧煮，成品可用猪油热炒。该页面是本批最完整的直接来源之一，但没有米/叶/水的量，也没有可迁移到普通电饭煲的程序。其食用植物、卫生和储藏安全应另找来源，不得由“传统”推定安全。

### 大庙口乌米饭

永州市文旅局页面把“大庙口乌饭制作技艺”列为非遗调研项目，明确农历四月初八用南烛（乌饭树）叶汁浸泡糯米后煮成黑色糯米饭。它与正果乌饭同属乌饭家族，但不同地域、植物处理和时令背景不能拼成一个配方。

### 蔓耗/龙陵手抓饭

蔓耗政府页面写的是烤鸡、烤肉、四色糯米饭铺成孔雀开屏宴席；龙陵官方 PDF 只确认傣族手抓饭非遗项目。二者目前都只能做文化身份档案，不能为了满足“一锅出”而把烤肉、四色饭、配菜改写成一锅。

### 施甸两种名称

施甸县政府同一篇文章同时出现“罗锅火腿肉土豆焖饭”和“铜锅土豆焖饭”。原文对后者写出淘米加水，水收干后加入火腿肉和土豆丁；它们可能是同一道地方菜的不同称呼，也可能是不同器具版本。本批先登记两个待裁决名称，但主目录入库时只能保留一条 canonical，除非找到独立来源证明二者确为不同菜。

### 安远焖饭

安远县政府把大甑饭、焖饭、竹筒饭、钵仔饭分开解释：焖饭是生米煮至半熟、沥汤、盖锅用余热焖熟，并说明现代家庭已使用电饭煲。该页证明的是地方技法谱系，不等于一个有固定配料的“安远××焖饭”；在没有专门配方前，不应让它进入轮替。

## 与 r103 的关系与下一步

1. 本批 24 条均未以相同 canonical name 写入 r103 主目录；其中与已有家族相近的乌饭、抓饭、腊肉饭、咸肉菜饭，必须保留“地域变体/证据升级”标记，不能合并数量、液体或步骤。
2. **最值得先补直接证据的 5 条**：正果镇畲族乌饭（已有完整工艺段）、大庙口乌米饭（地域版本清晰）、施甸铜锅土豆焖饭（已有部分顺序）、湖州冬日饭（菜饭结构清楚）、安远焖饭（技法与现代电饭煲语境清楚）。这 5 条仍需独立闭合安全、液体/时间和器具边界，暂不进入 B 架。
3. **暂不入库或仅身份档案**：蔓耗/龙陵手抓饭、鹰嘴豆抓饭、维西铜锅饭、正泰恒大米干饭把子肉、宁海州脑饭、贵南蕨麻饭、陕坝大锅饭等只有身份或宴席线索的条目。
4. 原器具（铜锅、铁锅、木甑、砂锅、蒸笼）只证明原器具事实；电饭煲水量、程序、防糊底和投料时机必须另找一手适配来源或厨房实测，不能推导。
5. 搜索摘要或无法打开的页面只做发现记录；在 `access_status` 变为 `opened` 并补 `evidence_locator` 前，不得晋升 `recipe_fact_checked` 以外的公开状态。

本批没有新增主目录记录、没有改变轮替池、没有新增菜谱运行时调用，也没有部署。
