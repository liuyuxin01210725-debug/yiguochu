# source-backed one-pot · r97 搜集批次

日期：2026-08-07

本批只扩充来源记录，不晋升 `executable`，不改变运行时规划器和前端产品边界。目录由 `r96` 的 766 条变为 **773 条**，新增 7 条：6 条 `recipe_fact_checked`、1 条 `identity_verified`。

## 新增条目

| 条目 | 状态 | 直接来源 | 当前边界 |
| --- | --- | --- | --- |
| 香菇油饭 | recipe_fact_checked | [Panasonic Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/191) | 电子锅煮糯米，配料另锅炒后拌入；不伪装成全程单锅，未补份数/统一液体/安全终点 |
| 灰姑娘南瓜马车炖饭 | recipe_fact_checked | [Panasonic Taiwan](https://pmst.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/5239) | 记录 300mL 水与约 48 分钟程序；保留南瓜蒸烤、配菜汆烫等前处理，不删除这些步骤 |
| 青酱嫩鸡炖饭 | recipe_fact_checked | [Panasonic Taiwan](https://pmst.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/5155) | 记录鸡肉、菇类、300mL 鸡高汤与什锦饭程序；缺份数/总时长/安全终点 |
| 安远竹筒饭 | recipe_fact_checked | [安远县人民政府](https://www.ay.gov.cn/ayzf/c103773/tt.shtml) | 记录竹筒、米、清水和架火烧制；不推导电饭煲等价参数 |
| 开平鲫鱼焗饭 | identity_verified | [开平市人民政府](https://www.kaiping.gov.cn/kpszfw/xwdt/tpxw/content/post_2802731.html) | 当前来源只确认具名地方菜，不补食材、步骤、器具或份量 |
| 糙米高丽菜什锦饭 | recipe_fact_checked | [ZOJIRUSHI Taiwan](https://www.zojirushi.com.tw/recipe/rice-cookers/444/csr) | 记录糙米、猪肉丝、高丽菜、香菇、胡萝卜与机型水位/程序；不把水位线换算成跨机型毫升数 |
| 昆布栗子炊饭 | recipe_fact_checked | [ZOJIRUSHI Taiwan](https://www.zojirushi.com.tw/recipe/rice-cookers/490/%E6%98%86%E5%B8%83%E6%A0%97%E5%AD%90%E7%82%8A%E9%A3%AF) | 记录白米、栗子、香菇、昆布与什锦饭程序；明确标为无固定蛋白的素食米饭档案 |

## 状态分布

| 状态 | r96 | r97 |
| --- | ---: | ---: |
| executable | 12 | 12 |
| recipe_fact_checked | 669 | 675 |
| identity_verified | 79 | 80 |
| discovered | 6 | 6 |

本批没有新增可直接轮替的 B 层条目；新增研究记录会在来源补齐、合同闭合和厨房验证后再讨论晋升。目录版本已同步为 `source-backed-one-pot-v1-20260806-national-r97`。
