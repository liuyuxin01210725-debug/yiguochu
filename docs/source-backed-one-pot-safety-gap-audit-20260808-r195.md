# r195 安全缺口审计：MAFF／香港海鲜条目

基线：`source-backed-one-pot-v1-20260808-global-r194`，923 条；已有安全端点条目 154 条。此次只做原页与安全映射复核，未修改主 JSON、生成物、运行时代码或 UI。

## 结论

- 新增 canonical：0
- 可无损写回安全 endpoint：0
- 新增 B 架条目：0
- 继续保留 `safety_endpoints: []`：4 条

FoodSafety.gov 当前页区分三类海鲜规则：鱼类可用 63°C 或“不再半透明且易分离”；虾、龙虾、蟹、扇贝用“肉质珍珠白/白色且不透明”；蛤蜊、牡蛎、贻贝用“烹调时贝壳打开”。该页没有章鱼、海胆的独立终点，也没有给去壳蛤蜊肉一个数值终点。不能把“海鲜煮熟”“程序完成”或相邻物种规则冒充新终点。

| recipe_id | 直达原页事实 | 当前阻塞 | 决定 |
|---|---|---|---|
| `maff-ibaraki-hamaguri-gohan` | [MAFF はまぐりごはん](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/hamagurigohan_ibaraki.html) 第317–320、326–356行：蛤蜊为去壳肉，切小后与胡萝卜、香菇快速炒熟，分离煮汁；米加水和煮汁炊熟，最后把具料放回焖约10分钟。 | FoodSafety 的蛤蜊规则要求“贝壳打开”，但原方使用去壳蛤蜊肉，无法观察贝壳；当前项目没有可直接复用的去壳蛤蜊温度终点。不能套用鱼类63°C或虾/蟹视觉规则。 | 保持空 endpoint；后续需找到明确覆盖去壳蛤蜊肉的官方安全终点。 |
| `hk-golden-seafood-congee` | [香港卫生署黄金海鲜粥](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=589) 第13–21、28–33行：5人份，花蛤11只、虾3只、鱿鱼15g、带子3只、米3/4碗、水4碗；海鲜先洗切并汆水，米煮滚后放入全部材料，煮至熟透。 | 来源是花蛤、虾、鱿鱼、带子混合物；“熟透”是原文过程描述，不是项目可审计的单一终点。FoodSafety 的蛤蜊开壳、虾/扇贝不透明规则不能覆盖鱿鱼，也不能把多物种合并成一个温度。 | 保持空 endpoint；保留“先汆水＋再煮熟透”流程，等待逐物种安全证据。 |
| `maff-aichi-tako-meshi` | [MAFF たこ飯（爱知）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/takomeshi_aichi.html) 正文第269–357行：4人份，生章鱼200g；盐揉洗、切2cm，与米和调味料在炊饭器同锅炊煮。 | 当前 FoodSafety 合同只有鱼、禽、牛羊猪及列明虾/蟹/扇贝/蛤蜊等类别；没有章鱼专属 endpoint。不能把章鱼泛化成鱼类63°C或贝类视觉终点。 | 保持空 endpoint；若要闭合，需取得明确覆盖头足类的官方安全来源。 |
| `maff-yamaguchi-uni-meshi` | [MAFF うに飯（山口）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/43_24_yamaguchi.html) 正文第257–334行：1人份，生海胆10g；米入釜，临近沸腾时加入海胆，继续炊煮约20分钟。 | 当前 FoodSafety 页没有海胆的温度或视觉终点；不能用鱼类、贝类或“程序完成”替代。 | 保持空 endpoint；等待海胆适用的官方安全指南。 |

## 来源定位

- FoodSafety.gov：[Cook to a Safe Minimum Internal Temperature](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)，当前可读行：鱼类 63°C／不透明易分离；虾、龙虾、蟹、扇贝肉质珍珠白或不透明；蛤蜊、牡蛎、贻贝烹调时贝壳打开。
- 本审计不修改任何 `safety_endpoints`，不把“煮至熟透”、焯水或炊饭程序分钟数改写成可复用安全合同。
