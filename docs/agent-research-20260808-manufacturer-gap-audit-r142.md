# 厂商／电饭煲官方来源缺口审计（r142，intake-only）

日期：2026-08-08  
主目录基线：`source-backed-one-pot-v1-20260808-global-r142`（923 条）  
审计范围：主目录中已经存在的 `recipe_fact_checked` 厂商／电饭煲条目；优先检查 `fixed_batch`、`liquid_contract`、`time_contract`、`safety_endpoints` 缺口。  
去重规则：只审计现有 `recipe_id`，不创建新 canonical，不把相近菜名、不同机型或不同器具版本拼成一条。  
文件性质：研究 intake；本轮不修改主 JSON、CSV、运行时代码、UI、构建产物或部署包。

## 结论

本轮按缺口榜优先核对 10 条既有记录。官方原页／官方手册能够直接补充一批**食材、容量、液体、水位、流程或原机时间**，但不代表可以直接晋升 `executable`：

- 可进入下一批机械补证的强候选：`tiger-post-196-gomoku-rice`、`panasonic-fresh-shiitake-rice-sr-afg`、`panasonic-mixed-chicken-rice-sr-df151`、`zojirushi-minced-pork-greens-rice-nl-erh`、`joyoung-curry-chicken-rice-jrc-4hp82`。
- 需要保留机型／预处理边界的候选：两条大同电锅鸡饭、两条 Tefal 602 分阶段饭。
- 本轮不新增 canonical、不新增 B 试做架、不晋升 executable。任何未由同一原页明确证明的份数、固定总时长、通用电饭煲水量和物种安全终点仍保持 `null` 或现有保守状态。

## 审计矩阵

| # | 既有 recipe_id／名称 | 官方原页与直接定位 | 本轮可直接确认的事实 | 当前缺口 | 最小下一步／边界 |
|---:|---|---|---|---|---|
| 1 | `panasonic-fresh-shiitake-rice-sr-afg`／鲜香菇饭 | [Panasonic SR-AFG 手册](https://home.panasonic.cn/support/attachments/auld/manual/SR-AFG.pdf)，PDF 第 23 页；程序表在第 8 页 | 白米 1 杯、鲜香菇 4 朵、鸡肉丝 20g、芹菜 15g、水 1 杯；调味料有明确量；米泡约 15 分钟，香菇鸡肉拌调味料后铺面，使用“煲仔饭”，完成后拌芹菜并余温焖 5 分钟；程序表给煲仔饭约 37 分钟参考 | 来源没有成品份数；37 分钟是煲仔饭程序参考且说明随食材变化，不能写成该菜固定总时长；普通电饭煲不可迁移 | 可补结构化食材／流程证据；`fixed_batch`、`time_contract` 继续空，除非同一 SR-AFG 版本提供份数和该菜运行时长；保留 SR-AFG 煲仔饭程序边界 |
| 2 | `zojirushi-minced-pork-greens-rice-nl-erh`／肉糜青菜饭 | [象印 NL-ERH 手册](https://www.zojirushi-china.com/media/6749/nl-erh-ccn20250317_a.pdf)，PDF 印刷第 14–15 页（目录页 8）；时间表印刷第 8–9 页 | 4–5 人份、白米 3 杯、猪肉糜 90g、青菜 90g；先把猪肉糜和青菜炒熟，米加炒出的汤汁和水至“白米”3 水位，配料铺面，使用“什锦饭”；1.0L 约 65–71 分钟、1.8L 约 68–75 分钟 | 份数是范围而不是单一固定值；时间随 NL-ERH10C／NL-ERH18C 型号变化，不能压成一个数字；水位线不能换算成跨机型毫升 | 继续保留 `fixed_batch`、`time_contract` 空值；若 schema 增加范围字段，可记录原始范围；不把型号水位线移植到普通电饭煲 |
| 3 | `panasonic-mixed-chicken-rice-sr-df151`／什锦鸡饭 | [Panasonic SR-DF151 手册](https://home.panasonic.cn/support/attachments/auld/manual/SR-DF151.pdf)，PDF 第 9 页；精煮时间表第 6 页 | 米 3 杯、水 4 杯、鸡肉 80g、牛蒡 35g、香菇 2 个、油炸豆腐 2 块、胡萝卜 40g；鸡肉和牛蒡先氽，米加水和调味料后铺料，使用“精煮”；手册给精煮约 38 分钟参考 | 没有成品份数；38 分钟是精煮参考且什锦饭时间随食材变化，不能成为该菜固定时间；只适用于 SR-DF151 | 可补明确批量食材和流程；`fixed_batch`、`time_contract` 继续空；不从“3 杯米”推导人数 |
| 4 | `tatung-cajun-chicken-rice`／ケイジャンチキンライス | [大同电锅官方账号原页](https://recipe.rakuten.co.jp/recipe/1290042664/)，正文材料／步骤 | 3–4 人份、鸡腿肉约 300g、米 2 合、腌制至少 30 分钟、米加水至大同内锅 2 刻度略下；鸡肉用铝箔托盘置于米面上；外锅水 1 杯加 3 刻度；页面标称约 30 分钟 | 份数是范围；液体是大同机型水位和外锅量，不是通用毫升；存在冷藏腌制、托盘分层、另做酱料／配料，不能说普通电饭煲一键 | 只补原机型事实与边界；不压固定 `fixed_batch`，不把水位转成普通锅水量；“卡津”是厂商具名配方，不宣称路易斯安那传统原方 |
| 5 | `joyoung-curry-chicken-rice-jrc-4hp82`／咖喱鸡肉饭 | [九阳 JRC-4HP82 手册](https://myjoyoung.com/wp-content/uploads/2025/09/Rice-Cooker-JRC-4HP82.pdf)，英文食谱第 11 页、中文食谱第 24 页 | 两种语言页都给白米 3 杯（420g）、鸡胸 150g、胡萝卜 100g、土豆 100g、洋葱 100g、咖喱块 100g、水 528g、姜丝 8g、生抽 15g、油 15g；鸡肉先焯；分层入锅；中文页写 White rice／柴火饭，英文页写 Slow cook | 手册没有成品份数；同一官方手册内部程序冲突，不能择一建立时间或程序合同；即使液体合同已有，也不能把英文／中文两版拼成一版 | 保留 528g 液体合同和两页冲突记录；`fixed_batch`、`time_contract` 继续空；普通电饭煲不可外推；鸡肉 74°C 由独立 FoodSafety.gov 来源支持 |
| 6 | `tatung-sesame-shiitake-shio-koji-chicken-rice`／麻油香菇鹽麴雞飯 | [大同官方食谱](https://www.tatung.com.cn/ElectronicRecipes/info_itemid_171.html)，网页第 31–101 行 | 3–4 人份、白米 4 米杯、去骨鸡腿约 520g、香菇 6 朵、冬笋 120g；温水 4 米杯加盐麴作高汤，另 15ml 腌鸡；泡米 20 分钟、鸡腌 3–5 分钟；姜、鸡肉、香菇、冬笋先煎炒；入大同电锅外锅 0.5 杯，炖煮后保温焖 15–20 分钟；网页标调理时间 60 分钟 | 份数是范围；内锅液体由高汤水、调味料和米酒组成，外锅 0.5 杯是另一层加热输入；页面没有“普通电饭煲”参数；鸡肉安全终点需独立物种来源 | 先保持 `recipe_fact_checked`；若补合同，只能按大同百年电锅原方拆记内锅／外锅输入，不能将外锅水当米水，也不能把范围份数改成固定人数 |
| 7 | `tatung-chestnut-sesame-oil-chicken-rice`／栗子麻油雞飯 | [大同官方食谱](https://tatung.com.cn/ElectronicRecipes/info_itemid_161.html)，网页第 31–91 行 | 3–4 人份、香米 2 米杯、鸡中翅 10 支（约 250g）、生栗子 20 颗（约 200g）、干香菇 4–6 朵；香菇水加清水共 2 米杯；栗子先滚水 4–5 分钟去膜，香菇姜和鸡翅先在珐琅锅煎炒；放入电锅外锅 2.5 米杯，跳起后焖 10 分钟；网页标调理时间 45 分钟 | 份数是范围；流程需要珐琅锅预处理，外锅 2.5 米杯不可迁移普通电饭煲；“香菇水+清水”虽有总量，但没有拆分比例；生栗子处理不能省略；鸡肉安全终点未由原页提供 | 可补分阶段流程和原机型液体组成；不建立普通电饭煲合同，不把外锅量视为内锅米水；需要安全来源和目标型号实测后再评估 B 架 |
| 8 | `tefal-602-chicken-pea-risotto`／Chicken & Pea Risotto | [Tefal 602 官方食谱 PDF](https://www.tefal.com/medias/?context=bWFzdGVyfENTUyBSRUNJUEUgQk9PS3wxNDcxMTM4fGFwcGxpY2F0aW9uL3BkZnxDU1MgUkVDSVBFIEJPT0svaDZkL2g5NC85ODI1ODkyMzAyODc4LnBkZnxjY2M0NzU4NDA0ZTY2Zjk4MDVlNGY4OWQyNzg3NTg2Y2QyN2M1OGU3YzFkZjkxYjA0MTlhYWY2ODQ4YjM3)，目录第 1 页、正文第 2 页（现有 source_ref locator） | 4 人份；Arborio 米 300g、鸡高汤 650ml、熟鸡肉 250g、豌豆 75g；准备约 20 分钟、烹调约 28 分钟；平底锅先处理，约 20 分钟后加入**熟鸡肉**和豌豆；使用 Tefal 602 White Rice 程序 | 需要本地 PDF 归档与页码／哈希闭环；不是生鸡一锅直达，熟鸡肉是原方前提；没有项目独立鸡肉安全终点映射；不能外推其他型号或普通电饭煲 | 归档原 PDF 后可补 `fixed_batch`、`time_contract` 和分阶段流程；在此之前保持 source_limited，不能把熟鸡肉改成生鸡肉，也不能把平底锅预处理删掉 |
| 9 | `tefal-602-seafood-paella`／Seafood Paella | [Tefal 602 官方食谱 PDF](https://www.tefal.com/medias/?context=bWFzdGVyfENTUyBSRUNJUEUgQk9PS3wxNDcxMTM4fGFwcGxpY2F0aW9uL3BkZnxDU1MgUkVDSVBFIEJPT0svaDZkL2g5NC85ODI1ODkyMzAyODc4LnBkZnxjY2M0NzU4NDA0ZTY2Zjk1YjA0MTlhYWY2ODQ4YjM3)，目录第 1–2 页、正文第 2–3 页（现有 source_ref locator） | 4 人份；Paella 米 300g、鱼高汤 500ml、海鲜混合 250g、豌豆 75g；准备约 15 分钟、White Rice 烹调约 28 分钟，完成后再加热约 5 分钟；海鲜按原方分阶段加入 | PDF 尚未完成本地归档；海鲜安全终点、具体海鲜组成和其他机型适配未闭合；不能把不同 Tefal PDF／不同版本液体拼接 | 先归档同一 PDF 并逐页核对，再补海鲜类别安全来源；保留“分阶段加入海鲜”和 Tefal 602 边界，不转成普通电饭煲一锅生海鲜配方 |
| 10 | `tiger-post-196-gomoku-rice`／五目ごはん | [Tiger 官方 post_196](https://www.tiger-corporation.com/ja/jpn/feature/recipe/post_196/)，正文第 69–179 行 | 4 人份、米 2 杯、鸡腿肉 40g、油炸豆腐 1/3 片、胡萝卜 20g、牛蒡 20g、蒟蒻 25g、干香菇 1 片、絹さや 3–5 片；调味料明确；调理时间 55 分钟；“白米”水位 2，选择“炊込み”；絹さや最后加入；页面限制首加配料不超过米重量约 45%（每杯约 70g），并列出适用 JAJ-G/JBS-A/B/G/JBU-A 型号 | 当前四合同字段几乎均未入结构化字段，安全 endpoint 为空；页面说水量可按配料略调，不能换算通用毫升；鸡肉先用酒／酱油腌但无明确物种终点 | 这是本批最短闭合候选：同一原页明确份数、用量、水位、时间、流程和机型；下一批可直接按 page locator 补 `fixed_batch`、`time_contract`、`liquid_contract`，再为鸡肉补独立 74°C 来源；不外推其他 Tiger 型号 |

## 分批建议

### 批次 A：先闭合结构化字段（不改变状态）

1. `tiger-post-196-gomoku-rice`：原页同时有 4 人份、米／配料量、55 分钟、水位 2、炊込み程序和机型列表；先补合同字段，再做安全来源映射。
2. `panasonic-fresh-shiitake-rice-sr-afg`：原手册明确食材、1 杯水、步骤和煲仔饭程序；只需确认是否有同一手册的成品份数或菜独立运行时长，不能把 37 分钟参考压成固定值。
3. `panasonic-mixed-chicken-rice-sr-df151`：原手册明确 3 杯米／4 杯水、流程和精煮程序；份数和菜独立时间仍需来源，不以 38 分钟参考替代。
4. `zojirushi-minced-pork-greens-rice-nl-erh`：先补原始范围字段（4–5 人、65–71／68–75 分钟），若当前 schema 不支持范围就保持 null，不做取中。

### 批次 B：先处理冲突／归档，再谈合同

1. `joyoung-curry-chicken-rice-jrc-4hp82`：先解决同一 PDF 的 Slow cook／White rice 冲突；没有统一程序前不补 time。
2. `tefal-602-chicken-pea-risotto`、`tefal-602-seafood-paella`：归档同一 Tefal 602 PDF，保留熟鸡肉后加／海鲜分阶段后，再分别补安全映射；不跨页拼接。
3. 两条大同鸡饭：份数是范围、外锅水和内锅液体分层，目标只应是大同电锅原方的合同，不是普通电饭煲改编。

## 证据纪律与明确不做的推断

1. **原机型只证明原机型。** SR-AFG、SR-DF151、NL-ERH、JRC-4HP82、Tefal 602、Tiger 列出的型号不能被写成“所有电饭煲适用”。大同内锅／外锅输入也不能转换成普通电饭煲毫升水量。
2. **程序参考不是菜谱固定时长。** “精煮约 38 分钟”“煲仔饭约 37 分钟”和型号程序范围只能作为机型线索；若原页未把时间绑定到该菜，`time_contract` 保持 `null`。
3. **范围份数不取中。** 3–4 人、4–5 人以及“2 合分”不能被四舍五入成固定人数；容量单位只有在原页明确 servings 时才可填 `fixed_batch.servings`。
4. **预处理不删除。** 九阳焯鸡、Tatung 预煎／珐琅锅、Tefal 平底锅预处理和熟鸡肉后加是原方事实；不能为追求“自动一锅”而删掉或改成生肉同锅。
5. **安全来源按物种绑定。** 厂商页面本身没有 74°C 等终点时，必须另引明确禽肉／猪肉／海鲜来源；不能把“加热完成”当成安全证据。
6. **不拼接近名版本。** Panasonic、Tefal、Tatung 同名或近名页面分别保持独立；不得用另一型号的水量、程序或时间填补本条目。

## 收口

- 本轮新增 canonical：**0**。
- 本轮新增 B 试做架：**0**。
- 建议先审 `tiger-post-196-gomoku-rice`，它最可能在同一官方原页内闭合三项合同；其余条目按上面批次 A/B 处理。
- 所有未闭合字段继续保留 `null`；完成下一批前不修改主 JSON、不部署、不把 `recipe_fact_checked` 对外说成“完整做法”。
