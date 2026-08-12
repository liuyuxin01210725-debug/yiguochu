# 中国大陆地域一锅饭候选搜集批次 r121（intake-only）

日期：2026-08-08
目录基线：`source-backed-one-pot-v1-20260807-national-r118`（867 条）；同时与 r119、r120 CN intake 交叉去重
范围：只记录中国大陆政府、地方志、非遗机构、官方文化馆/文化媒体中出现的具名米饭、菜饭、焖饭、抓饭、锅巴饭、箜饭及必要的边界项。本文件只做研究 intake，不修改主 JSON、CSV、运行时代码、构建产物或部署包。

## 口径

- `new_lead` 只表示 r118 主目录及 r119/r120 intake 中没有精确 canonical/alias；不能把同一家族的证据升级计成新菜单。
- `existing_evidence_upgrade` 表示已有条目的新一手来源，不增加轮替数量。
- 来源只证明原文明确写出的事实。没有量、液体、时间、安全或器具参数时保持缺口，不跨地区拼合同一配方。
- `direct_one_pot=true` 只用于原文明确同锅/同一容器完成的分支；甑、蒸笼、砂锅、土灶等只证明原器具，不能推导电饭煲水位和程序。
- 熟饭后拌/炒、甜品、只有身份名录或只有餐馆招牌的条目，保留为边界/研究资产，不进入 B 试做架。

## 逐条 intake（15 条）

| # | 建议 recipe_id | canonical_name | 地域/家族 | 直达官方来源 | 来源实际证明的事实 | direct_one_pot / 器具边界 | 缺口与建议 | 建议状态 | 目录关系 | B 架 |
|---:|---|---|---|---|---|---|---|---|---|:---:|
| 1 | `cn-unlocalized-laozhaizi-eight-treasure-glutinous-rice` | 八宝糯米饭 | 原文“老寨子”语境，具体地域待定位/糯米饭 | [七一网·除夕的糯米](https://m.12371.gov.cn/content/2023-09/22/content_449623.html) | 原文明确小块腊肉洗净切细熬油，加清水、糯米、花生、核桃、莲米、红枣、薏仁和盐；先大火后小火煨焖至水干并形成锅巴 | `true`；原文只说锅内煨焖，未给电饭煲程序 | 缺地域定位、克重、液体量、时间和肉类安全；营养结构比纯甜八宝饭完整，但地域不清，先补作者/“老寨子”所在地，不进 B | `recipe_fact_checked` | `new_lead` | 否 |
| 2 | `cn-hunan-changsha-fried-chicken-oil-eight-treasure-rice` | 乾煎鸡油八宝饭 | 湖南长沙/清真地方名小吃 | [湖南省政府·乾煎鸡油八宝饭](https://www.hunan.gov.cn/hnszf/jxxx/hxwh/cwd/201711/t20171111_4685433.html) | 省政府原文给出糯米 300g、红枣 250g、莲子/核桃/花生/白果等用量，泡米 4–8 小时、蒸约 40 分钟，再拌料蒸约 1 小时，最后油煎成饼 | `false`；蒸制后再油煎，属于多阶段甜品/小吃，不是家常一锅主餐 | 甜味、鸡油和大量糖油，不满足当前营养主餐优先；可作为文化档案，不进 B，不得改写成咸味菜饭 | `recipe_fact_checked` | `new_lead` | 否 |
| 3 | `cn-hubei-qianjiang-longwan-guoba-rice` | 龙湾锅巴饭 | 湖北潜江龙湾/锅巴饭 | [潜江市政府·新春走基层](https://www.hbqj.gov.cn/xwzx/jrqj/qjyw/202501/t20250120_5510720.html) | 官方报道把“锅巴饭”列为龙湾民宿招牌饭，记录柴火灶前翻动米饭、经反复试菜形成招牌 | `true` 仅能确认当地锅巴饭招牌与柴火场景；没有食材和定量流程 | 只能身份/文化线索，不能从“锅巴饭”泛称反推配方；需补龙湾原料、锅具、火候和安全，不进 B | `identity_verified` | `new_lead` | 否 |
| 4 | `cn-guizhou-jiangkou-guoba-rice` | 江口锅巴饭 | 贵州铜仁江口/锅巴饭 | [国家林草局转载人民日报·生态账户](https://www.forestry.gov.cn/c/www/gggddt/578216.jhtml) | 官方转载写江口民宿店主掀锅铲起淡黄色锅巴饭，原先柴火灶、现在改用电炉，味道被描述为保持不变 | `true` 仅证明成品与器具变迁，不证明具体食材、米水或程序 | 只有名称/场景，不能与东至农家锅巴饭或其他锅巴饭拼接；待地方原始做法，当前不进 B | `identity_verified` | `new_lead` | 否 |
| 5 | `cn-shanghai-changning-spring-bamboo-cured-pork-shepherds-purse-rice` | 春笋腊肉荠菜焖饭 | 上海长宁/时令焖饭 | [长宁区政府·春菜上新](https://www.shcn.gov.cn/col5962/20260317/1307094.html) | 区政府页面将“春笋腊肉荠菜焖饭”列为社区食堂春季菜品，明确名称与春笋、腊肉、荠菜组合 | 页面没有配方、流程、器具、份量或是否生米同锅；更像当季菜单名 | 可作为需求/名称线索，不把菜单名当传统来源，不进 B；需寻找原始厨艺或地方菜谱来源 | `identity_verified` | `new_lead` | 否 |
| 6 | `cn-henan-linzhou-millet-thick-rice` | 林州小米稠饭 | 河南安阳林州/小米主食 | [安阳地方文史资料·林州小米稠饭](https://oss.hnzx.gov.cn/anyang/filedownload/345471/minsu.pdf) | 地方文史资料明确林州小米有稀饭、干饭、稠饭三种传统吃法，并称稠饭需掌握制作时间和火候；当前摘录尚未形成完整步骤 | 是否直接同锅需按 PDF 原页继续定位；不能把“稠饭”泛化为菜饭或电饭煲焖饭 | 缺可定位的逐步流程、米水比、时间、搭配食材和器具；作为现有 `林州小米稠饭` 的一手证据升级，不进 B | `identity_verified` | `existing_evidence_upgrade` | 否 |
| 7 | `cn-ningxia-meat-sticky-rice` | 肉粘饭 | 宁夏/牛羊肉粘饭 | [宁夏农业农村厅·宁夏大米](https://nynct.nx.gov.cn/rdzt/ppny/202211/t20221103_3829781.html) | 官方页明确牛羊肉、洋葱、胡萝卜先炒，再与米饭同蒸，成品介于粥与饭之间，并说明配菜增加口感 | `true`（同蒸）；原文未给锅具/电饭煲程序，不能外推 | 无克重、液体、时间、肉类安全；当前目录已有通用 `肉粘饭`，作为宁夏一手来源升级，不增加 canonical | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 8 | `cn-yunnan-tengchong-beihai-copper-pot-potato-rice` | 腾冲北海铜锅洋芋饭 | 云南腾冲北海/铜锅饭 | [腾冲市政府·北海年味](https://www.tengchong.gov.cn/info/9573/5813513.htm) | 官方页写洋芋切块先炒入味，米放铜锅慢煮，再加炒好的洋芋、绿豆和腊肉继续煮，锅底形成锅巴 | `true`；铜锅慢煮，不能把铜锅火候直接改成电饭煲 | 缺固定量、液体和时间，腊肉盐分/安全待补；当前目录已有精确 canonical，作为一手流程升级 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 9 | `cn-anhui-jixi-bamboo-shoot-cured-pork-rice` | 绩溪笋焖饭 | 安徽绩溪/春笋腊肉焖饭 | [绩溪县政府·绩溪版舌尖上的春天](https://www.cnjx.gov.cn/Jczwgk/show/3490028.html) | 县政府页面明确点名“绩溪笋焖饭”，说明春笋与腊肉的时令组合和焖饭关系 | 页面未给米量、液体、步骤、时间、器具；不得根据标题补写配方 | 当前目录已有 `绩溪笋焖饭`，属于身份/季节来源升级；待完整做法，不进 B | `identity_verified` | `existing_evidence_upgrade` | 否 |
| 10 | `cn-guangdong-taishan-caiguo-rice` | 台山菜果饭 | 广东江门台山/腊味菜果饭 | [江门市政府·三合镇菜果饭](https://www.jiangmen.gov.cn/newzjqx/lyzy/qxms/content/post_3521275.html) | 官方页明确菜果即苤蓝，搭配台山丝苗米、腊味、海虾米、香芹；腊味煸油，菜果丁炒断生，与米饭拌匀后入瓦煲小火焖 | `true` 对原文瓦煲流程；是熟饭拌料后再焖，不能伪装为生米电饭煲同锅 | 缺克重、液体、时间和安全合同；当前目录已有 `台山菜果饭`，作近期官方流程升级，不增加轮替数 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 11 | `cn-guangdong-kaiping-chikan-claypot-rice` | 赤坎煲仔饭 | 广东江门开平赤坎/煲仔饭 | [开平市文化馆·赤坎煲仔饭烹饪技艺](https://www.kaiping.gov.cn/kpswhgdlytyj/kpwhg/fwzwhyc/fyxm/content/post_2533528.html) | 非遗页列十月晚稻米及黄鳝、牛肉、排骨、腊味、菜果等组合，写米饭煮至七成熟后加配料焗熟，并记录果木柴火 | `true`；瓦罉/果木柴火事实，不转换电饭煲水位或程序 | 缺固定量、水、总时长和安全；当前目录已有 exact 条目，作为一手技艺来源升级 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 12 | `cn-hubei-yangxin-chunhu-fish-rice` | 春湖鱼饭 | 湖北黄石阳新/鱼饭 | [阳新县政府·春湖鱼饭非遗](https://yx.gov.cn/zjyx/whyc/201612/t20161220_95834.html) | 县政府完整描述活鱼约 4kg 去鳞去脏后煮熟去骨，再放洗净大米焖成干饭，并强调火候决定成败 | `true`；鱼水先煮、去骨后与米同锅焖；锅具未指定 | 纯鱼+米、缺米量/水量/时间和鱼类安全；当前目录已有同名条目，作为原始做法升级；不进入家庭 B 轮替 | `recipe_fact_checked` | `existing_evidence_upgrade` | 否 |
| 13 | `cn-fujian-youxi-jiumi-salted-rice` | 尤溪九糜咸饭 | 福建三明尤溪/咸饭技艺 | [尤溪县政府·县级非遗名录 PDF](https://www.fjyx.gov.cn/zfxxgkzl/zfxxgkml/qtyzdgkxx/202502/P020250206583233668588.pdf) | 官方名录确认“尤溪九糜咸饭制作技艺”及申报保护单位 | 名录只证明项目名称和身份，不证明配方、是否米饭一锅或器具 | 当前目录已有 `尤溪九糜咸饭`；作为身份来源补强，待项目说明/传承文本，不进 B | `identity_verified` | `existing_evidence_upgrade` | 否 |
| 14 | `cn-fujian-youxi-xinyang-green-rice` | 新阳青米饭 | 福建三明尤溪新阳/青米饭技艺 | [尤溪县政府·县级非遗名录 PDF](https://www.fjyx.gov.cn/zfxxgkzl/zfxxgkml/qtyzdgkxx/202502/P020250206583233668588.pdf) | 同一官方名录确认“新阳青米饭制作技艺”及保护单位 | 名录没有食材、染色、蒸制/焖制步骤或器具事实 | 当前目录已有 `新阳青米饭`；身份升级，不把项目名写成完整菜谱，不进 B | `identity_verified` | `existing_evidence_upgrade` | 否 |
| 15 | `cn-hunan-raoping-gaotang-braised-rice-evidence` | 高堂焖（证据升级） | 广东潮州饶平高堂/猪肉饭焖饭 | [饶平县政府·高堂镇简介](https://www.raoping.gov.cn/xqqk/gzjs/content/post_3843958.html) | 镇政府页面确认高堂焖为当地特色，记载猪肉与调料煎炒后和米饭搅拌的历史叙述，并记入潮州市市级非遗名录 | 原文主要是身份/历史，未给现代配方或器具；该段与生米同锅定义并不完全一致 | 当前目录已有 `高堂焖`，只作身份来源升级；需另找可复核流程，不进 B | `identity_verified` | `existing_evidence_upgrade` | 否 |

## 本批裁定

- 15 条中，精确去重后 **4 条 `new_lead`**：八宝糯米饭、乾煎鸡油八宝饭、龙湾锅巴饭、江口锅巴饭；其中前两条有可读流程，后两条目前只有官方名称/场景。它们均不进入 B 试做架，不能把身份线索说成可照做菜单。
- 其余 11 条是已有 canonical 的一手证据升级或严格边界项；不能据此增加轮替数量。
- 新增候选中，八宝糯米饭的原文地域仍未定位，乾煎鸡油八宝饭属于甜味多阶段小吃；龙湾/江口锅巴饭缺食材和流程。下一步应先补原产地与做法，而不是拼接相邻锅巴饭/八宝饭来源。
- 所有条目的 B 架结论均为“否”：本批没有完成数量、液体、时间、安全和家用器具合同的新增条目。
- 本批只新增本 intake 文档；未修改主 JSON、CSV、运行时代码、构建产物或部署包。
