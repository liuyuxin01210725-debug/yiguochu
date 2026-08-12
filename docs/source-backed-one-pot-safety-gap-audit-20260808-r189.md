# r189 鱼类安全缺口审计

基线：`source-backed-one-pot-v1-20260808-global-r188` / 923 条。

本批只处理一条已具名、已通过官方页面核验且明确鱼块状态与烹调顺序的台湾炊饭。没有新增 canonical，不把图片或普通电锅事实扩写成新的水量/时长合同。

| recipe_id | 直达来源与事实 | 本批处理 | 保留边界 |
| --- | --- | --- | --- |
| `taiwan-tilapia-edamame-rice` | [食农教育平台「鯛魚毛豆炊飯」](https://fae.moa.gov.tw/theme_data.php?id=4039&sub_theme=recipe&theme=topics)，来源为台湾农业部/国民健康署；正文确认罗非鱼、毛豆及米菜组合，流程为鱼块先煎至表面熟，再与米菜入电锅，完成后确认鱼肉全熟；配方卡图像为官方页面关联资源。 | 挂 `seafood_fully_cooked`，采用 FoodSafety.gov 鱼类 63°C 最低中心温度；安全来源独立挂 `S-SAFETY-TEMPERATURES-1`。 | `source_limited`、水量/总时长继续为 null；不把先煎与电锅两阶段改写成单一新程序，不添加 shellfish endpoint。 |

## 安全来源

FoodSafety.gov [Cook to a Safe Minimum Internal Temperature](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures) 的鱼类图表给出最低中心温度 145°F / 63°C。本批只把该通用安全终点映射到来源明确的罗非鱼，不声称原菜谱页面本身给出了该温度。

## 未处理

章鱼、混合海鲜、黄鱼和来源状态不明的鱼类继续保持空端点；开平鲤鱼页本轮直读时连接中断，未凭旧摘要追加安全合同。
