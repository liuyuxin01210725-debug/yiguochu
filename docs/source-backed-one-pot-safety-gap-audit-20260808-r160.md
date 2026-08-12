# r160 台湾／港澳安全缺口审计

> 审计日期：2026-08-08
> 目录基线：`source-backed-one-pot-v1-20260808-global-r159`（923 条）
> 本轮性质：只审已有条目；不新增 canonical、不修改主 JSON、CSV、运行时代码、UI 或部署包。

## 核验方法

本轮通过浏览器直接打开条目保存的官方原页，核对三件事：

1. 原页是否确实把禽肉、猪肉或海鲜作为本菜的食材，而不是仅出现在营养说明或近名菜中；
2. 做法是否把该食材作为生鲜／未熟状态处理（腌、切、炒至变色、煮至熟等），还是已经熟制、罐装或状态不明；
3. 是否可以不改原器具和阶段边界，挂接已有的安全来源 `S-SAFETY-TEMPERATURES-1`。

该官方安全页明确：禽肉各部位最低中心温度 165°F/74°C；鱼类 145°F/63°C，或煮至不再半透明、可用叉子分开；猪肉整块 145°F/63°C 并静置 3 分钟、碎肉 160°F/71°C；含肉砂锅 165°F/74°C；虾、蟹、扇贝等应煮至肉质珍珠白或白色不透明。安全页原文：[FoodSafety.gov Safe Minimum Internal Temperatures](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)。本轮只复用这些已存在的安全 endpoint，不创建新的温度规则。

## 可进入下一批 TDD 的高置信候选

以下 6 条（5 条禽／猪，1 条混合禽肉）已能从原页确认生鲜食材与实际烹调流程，建议下一批只补安全 endpoint；不改变数量、液体、时间或器具合同。

| recipe_id | 原页直接证据 | 建议 endpoint | 必须保留的边界 |
| --- | --- | --- | --- |
| `taiwan-pork-rib-claypot-rice` | [台湾农业部排骨煲仔饭](https://kids.moa.gov.tw/theme_data.php?id=282&theme=kids_cooking)：排骨 300g；先以腌料腌制，砂锅分段焖煮，原文明确“煮至肉熟”。 | `pork_fully_cooked`，按本项目混合米饭／砂锅合同采用已有 74°C 终点；不把它改写为 63°C 整块猪肉通用规则。 | 原方是砂锅，不是电饭煲；米、汤水和排骨分段入锅；保留 30 分钟制作时间和现有液体合同。 |
| `panasonic-taiwan-mushroom-chicken-bamboo-rice` | [Panasonic 野菇鸡肉竹笋什锦饭](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/3797)：鸡腿肉 200g；鸡肉腌调味酱后与米、蔬菜一起按 SR-PAA100 什锦饭程序炊煮。 | `poultry_fully_cooked`，74°C。 | 仅适用于来源指定的 Panasonic SR-PAA100／什锦饭程序；不外推通用电饭煲时间。 |
| `panasonic-taiwan-shiitake-bamboo-chicken-rice` | [Panasonic 香菇竹笋鸡肉炊饭](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/3842)：去骨鸡腿切块腌制，起油锅翻炒至变色，再与米和香菇水入电饭锅。 | `poultry_fully_cooked`，74°C。 | 这是“先炒后入锅”的连续流程，不得改写成生鸡肉直接按白米程序炊煮；保留 SR-PAA100 机型边界。 |
| `hk-tomato-mushroom-chicken-rice` | [香港食环署番茄杂菇鸡腿肉饭图卡](https://www.fehd.gov.hk/english/pleasant_environment/tidy_market/images/ahtak_recipe/202012_w1a.jpg)：图卡列 1 只去皮鸡腿，步骤为腌鸡腿 10 分钟、与米和杂菇入电饭煲，煮后静置 3 分钟。 | `poultry_fully_cooked`，74°C。 | 图卡给出 1 碗米／糙米、0.8 杯水与电饭煲流程；不能补图卡未给的总时长或统一份数。 |
| `hk-pumpkin-shiitake-pork-rice` | [香港食环署南瓜冬菇猪肉炖饭图卡](https://www.fehd.gov.hk/english/pleasant_environment/tidy_market/images/ahtak_recipe/202012_w2b.jpg)：图卡列瘦猪肉碎 120g，腌 15 分钟后与米、南瓜、冬菇入电饭煲，完成后静置 3 分钟。 | `pork_fully_cooked`，按混合米饭／砂锅合同采用 74°C；不把碎猪肉规则写成整块猪肉 63°C。 | 仅保留图卡的 1 杯米、0.8 杯水和电饭煲顺序；未提供总时长，不能补写。 |
| `hk-sakura-shrimp-chicken-quinoa-rice` | [香港食环署樱花虾冬菇鸡肉藜麦饭图卡](https://www.fehd.gov.hk/english/pleasant_environment/tidy_market/images/ahtak_recipe/202012_w3a.jpg)：图卡列鸡扒 120g，腌 20 分钟后与藜麦、冬菇、樱花虾入电饭煲；完成后拌麻油并静置 3 分钟。 | `poultry_fully_cooked`，74°C；樱花虾的 `shellfish_fully_cooked` 暂不补。 | 图卡把樱花虾画作／列作配料，但未明确是生鲜还是干制品；在状态查清前不添加海鲜 endpoint，也不宣称海鲜安全已闭合。 |

## 明确阻塞，不进入 TDD

| recipe_id | 直接核验结果 | 处理 |
| --- | --- | --- |
| `taiwan-angelica-sesame-chicken-rice` | [农业部当归麻油鸡饭](https://kmweb.moa.gov.tw/subject/subject.php?id=34867) 原页确实写鸡肉块、当归米酒浸泡、麻油炒香菇和鸡肉后与米入电锅；但没有固定份量，且“加一些水”不是定量。原页没有明确食品安全终点。 | 可作为禽肉 endpoint 候选，但本轮先不列“可无损闭合”；数量／液体合同仍保持原缺口。 |
| `taiwan-tilapia-edamame-rice` | [农业部鯛鱼毛豆炊饭](https://fae.moa.gov.tw/theme_data.php?id=4039&sub_theme=recipe&theme=topics) 主题页能确认具名菜和鱼类营养说明，具体食材/流程在官方图卡或 PDF 中；当前浏览器正文不能独立复核图卡全部生熟状态。 | 保持 `safety_endpoints=[]`，待图卡/PDF 原件归档并逐项核对后再审。 |
| `hk-yam-longan-chicken-claypot-rice` | 目录保存的香港 EatSmart URL 当前浏览器正文未返回可读内容，无法独立复核鸡柳状态与原页步骤。 | 不凭目录摘要补 endpoint；保留现状。 |
| `taiwan-fuzhou-drunk-duck-rice` | 目录所指 [AFA ebook7 原页](https://ebook.afa.gov.tw/tefd/ebook7/ebook7-1.html) 当前实际打开内容标题为“糯餅之鍋”，未出现“福州糟鴨飯”；现有 locator 与直接页面不一致。 | 这是来源映射阻塞，禁止加鸭肉 endpoint；应先修正/归档正确原页，再重新做事实审计。 |

## 结论与下一步

- 本轮发现 **6 条可进入下一批安全 TDD 的高置信候选**：其中 4 条禽肉、1 条猪肉、1 条禽肉+状态不明樱花虾；建议先只回填明确的禽肉/猪肉 endpoint，樱花虾保持空。
- 另有 4 条保留阻塞；尤其 `taiwan-fuzhou-drunk-duck-rice` 的 URL 与页面内容不一致，应优先修复证据映射，而不是用近名来源替代。
- 本轮没有修改主 JSON、版本号、生成 artifacts 或运行时代码；`git diff --check` 应作为落盘前唯一门禁。
