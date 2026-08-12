# 来源菜饭目录 r107：中国大陆地域候选

- 目录版本：`source-backed-one-pot-v1-20260807-national-r107`
- 本批新增：7 条（2 条 `recipe_fact_checked`，5 条 `identity_verified`）
- 新增后目录：835 条
- 本批不晋升 `executable`，不进入轮替或 B 试做架；不修改运行时代码、UI 或部署配置。
- 原则：来源只证明页面明确写出的事实；没有量、液体、时间、安全或电饭煲参数的字段保持 `null`，不从近名菜、同家族或其他地区拼接。

## 新增清单

| recipe_id | 菜名 | 地域/家族 | 状态 | 原文实际支持 | 明确缺口与器具边界 | B 试做架 |
|---|---|---|---|---|---|:---:|
| `cn-hunan-xiangxi-miao-cooked-rice` | 湘西苗家饭 | 湖南湘西凤凰 | `recipe_fact_checked` | [湖南省文化和旅游厅·Miao Cooked Rice](https://whhlyt.hunan.gov.cn/whhlyt/english/Culture/Delicacies/202304/t20230406_29306991.html)：烟熏肉、蒿草/葱、糯米、白米；先炒料、蒸米，再拌合后小火焖；叙述约半小时完成。 | 无固定克重、米水比例、家庭份量、肉类熟制终点或电饭煲程序；原文是分阶段灶台流程。 | 否 |
| `cn-henan-linzhou-millet-thick-rice` | 林州小米稠饭 | 河南安阳林州 | `recipe_fact_checked` | [文化和旅游部·中国画谷线路](https://zhuanti.mct.gov.cn/rxhmxjgn2022/beijing/detail_g7yU_504/3407.html)：以小米为主，配红萝卜、白萝卜、红薯粉条、白菜叶。 | 页面没有家庭步骤、批量、液体、时间、安全或电饭煲参数；不把“大米烩菜”或其他小米饭做法拼进来。 | 否 |
| `cn-fujian-yongchun-xianjia-dried-mustard-rice` | 永春仙夹菜干饭 | 福建泉州永春仙夹 | `recipe_fact_checked` | [永春县人民政府·仙夹卷](https://www.fjyc.gov.cn/zjyc/mfms/201312/t20131210_1597109.htm)：芥菜晒软、加水煮至七分熟、撕条晒干、切段并高温烘干；明确写明可煮成菜干饭。 | 只有菜干制备和用途，没有菜干饭自身的米量、液体、饭锅步骤、时间、安全或电饭煲合同；不把菜干制作步骤冒充完整饭谱。 | 否 |
| `cn-quanzhou-nanan-penghua-mustard-rice` | 南安蓬华芥菜饭 | 福建泉州南安蓬华 | `identity_verified` | [泉州世界美食之都官方网站·乡野美食](https://www.quanzhou.gov.cn/gastronomy/ch/msdh/xwqz/202509/t20250909_3208177.htm)：点名蓬华芥菜饭，写明霜打芥菜与软糯米饭交融。 | 原文没有步骤、份量、液体、时间、安全或器具；邻近壶仔饭不并入，其他芥菜饭版本不拼接。 | 否 |
| `cn-yunnan-ruili-dai-steamed-rice-technique` | 傣族蒸米饭制作技艺（瑞丽） | 云南德宏瑞丽 | `identity_verified` | [瑞丽市人民政府·非遗名录](https://www.rl.gov.cn/slyj/Web/_F0_0_6I73ZWNB4E833B0A675745BEBE.htm)摘要列出该市级项目。 | 本轮直达页抓取超时，只有项目身份；米种、配料、蒸具、时间、安全及电饭煲参数均缺。 | 否 |
| `cn-yunnan-ruili-jingpo-steamed-rice-technique` | 景颇族蒸米饭制作技艺（瑞丽） | 云南德宏瑞丽 | `identity_verified` | 同一份[瑞丽市人民政府非遗名录](https://www.rl.gov.cn/slyj/Web/_F0_0_6I73ZWNB4E833B0A675745BEBE.htm)摘要列出该市级项目。 | 本轮直达页抓取超时，只有项目身份；不把其他景颇族饭食配方借入。 | 否 |
| `cn-jiangsu-jintan-maoshan-qingjing-rice-technique` | 茅山青精饭制作技艺 | 江苏常州金坛 | `identity_verified` | [常州市人民政府·第六批非遗名录](https://www.changzhou.gov.cn/gi_news/61167487373135)：传统技艺第 7 项，申报地区金坛区。 | 名录没有青精原料、米种、蒸具、数量、液体、时间、植物安全或电饭煲参数；不从乌饭资料推导。 | 否 |

## 去重与边界

- `涞滩阴米炖鸡`不在本批新增：现目录已有`合川阴米乌鸡粥`同一阴米/乌鸡研究线，本批不另立近名条目。
- `永春仙夹菜干饭`与现有`酸菜干饭`不是同名同地条目；本条保留仙夹芥菜干的地域身份和来源边界，不借用其他菜干饭的米水参数。
- 瑞丽傣族与景颇族项目分别登记，不能合并为泛称“少数民族蒸饭”。
- 本批所有新增项均保持 `cooker_adaptation.status = not_adapted`；没有任何一条可被页面误解为已经闭合的电饭煲执行合同。

## 验证

- 先写失败测试：`tools/tests/source-backed-one-pot-batch-r107.test.mjs`。
- 通过后写入目录并 bump 版本；专项测试 3/3 通过。
- 本批不包含 `executable` 晋升，也未修改运行时代码或部署产物。
