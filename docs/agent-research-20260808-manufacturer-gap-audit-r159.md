# 厂商／电饭煲官方来源合同缺口审计（r159，intake-only）

> 审计日期：2026-08-08
> 主目录基线：`source-backed-one-pot-v1-20260808-global-r158`（923 条）
> 审计范围：已有 `recipe_fact_checked` 的厂商／电饭煲来源条目；优先复核来源已经声明 `quantity`、`liquid`、`time` 或 `appliance`，但结构化合同仍为空的记录。
> 文件性质：研究 intake；本轮不修改主 JSON、CSV、生成 artifacts、运行时代码、UI 或部署包。

## 核验口径

本轮只使用厂商官方原页（Tiger Corporation）直接打开后的页面正文；同时抽查一条日本农林水产省（MAFF）原页作为边界对照。没有使用搜索摘录替代正文，没有把不同型号、不同器具或不同版本拼成一条。

- `fixed_batch` 只接受来源明确写出的固定 servings 和有数值/单位的食材量；“as needed”“for flavor”不被改成数字。
- `liquid_contract` 可以记录原页明确绑定机型的水位线，但不能把“加水”或未给量的水转换成毫升，也不能把 5.5 杯机外推到普通电饭煲。
- `time_contract` 只接受来源明确绑定到该菜的总时长或程序时长；准备、浸泡、预煮、焖制等阶段分钟不相加冒充总时长。
- `Tacook／同步烹调盘` 是同一器具的上下层流程，不等于米和主料在同一内锅混合；出锅后加料、另锅预处理和安全终点都保留为边界。
- 生猪肉、生虾等原料状态明确时，可以把已有 FoodSafety.gov endpoint 列为下一批 TDD 候选；本轮不直接写入安全合同。

## 结论

本轮直接打开并复核 5 个官方原页。**3 条可送下一批 TDD 的强候选，另有 1 条只能做字段级补证，1 条保持边界观察；没有任何条目在本轮写回主 JSON。**

强候选不是“完整做法”或 `executable`：它们只是同一来源可以无损补齐的字段，缺失字段仍保持 `null`，机型和分层流程不被隐藏。

## 可送 TDD 的字段级候选

| recipe_id | r159 判定 | 官方原页 | 可无损补齐的字段 | 原页直接证明 | 仍需保留的缺口与边界 |
| --- | --- | --- | --- | --- | --- |
| `tiger-takikomi-gohan` | 强候选 | [Tiger Takikomi Gohan（Japanese Mixed Rice）](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/takikomi-gohan-japanese-mixed-rice/) | `fixed_batch`；`liquid_contract`（机型水位线） | 页面写明 4 servings；5.5-cup cooker 用 3 cups rice、2 oz chicken thigh、1/2 abura-age、胡萝卜、牛蒡、魔芋、2 朵干香菇、8 个雪豆及调味量；米、调味和配料加水至 “Ultra” level 3（10-cup 为 level 6），选择 Mixed。 | 页面没有绑定该菜的分钟总时长，`time_contract` 继续 `null`。魔芋、香菇浸泡/预处理，雪豆先盐水煮、出锅后加入；只证明 Tiger 5.5/10-cup 型号边界，不能改写成普通电饭煲通用参数。 |
| `r60-tiger-basic-chicken-congee` | 字段级补证（不列入 3 条强候选） | [Tiger Basic Congee（Porridge）](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/basic-congee-porridge/) | `liquid_contract`（0.5 Soft Porridge 水位线）；`time_contract.total_minutes=70` | 页面写明 2 servings、5.5-cup cooker、半杯日本米；米、芹菜和姜加入鸡汤至 0.5 Soft Porridge line，选择 Porridge 并设定 70 minutes。 | 页面标题/介绍称 chicken congee，但食材栏未给鸡肉用量，步骤也没有加入生鸡肉；`fixed_batch` 不补，避免把菜名里的 chicken 当成有量食材。10 分钟 preparation 不改写为整道总时长；机型水位线只对 Tiger 型号成立。 |
| `r60-tiger-taiwan-minced-pork-rice` | 强候选 | [Tiger Taiwan Minced Pork](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/taiwan-minced-pork/) | `fixed_batch` | 页面写明 2 servings；2 cups white rice、1/2 lb minced pork、2 oz shiitake、1/2 oz fried onion，以及酱油、老抽、绍兴酒、玉米淀粉、糖、五香粉等定量调味；猪肉和香菇置于 Tacook cooking plate，米和水在内锅，使用 Synchro-Cooking。 | 原页只写 rice 加 water，没有固定水量，`liquid_contract` 继续 `null`；Preparation/Cooking 留空，`time_contract` 继续 `null`。猪肉是明确生绞肉，可在后续 TDD 挂现有 `pork_fully_cooked` 74°C endpoint，但本轮不改 JSON。该页对“Taiwan Minced Pork／卤肉饭风格”有厂商说明，不把它升级成台湾传统来源证明。 |
| `r60-tiger-garlic-shrimp-herbed-rice` | 强候选 | [Tiger Garlic Shrimp with Herbed Rice](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/garlic-shrimp-with-herbed-rice/) | `fixed_batch`；安全 endpoint 作为下一批 TDD 候选 | 页面写明 2 servings；2 cups white rice、5/8 lb shelled shrimp、1/6 oz garlic、1 tbsp olive oil、盐及柠檬酱／香草饭配料；虾放 Tacook 盘、米放内锅，选择 Synchro-Cooking，完成后香草拌饭并配柠檬酱。 | 原页未给米内锅水量和程序分钟，`liquid_contract`、`time_contract` 继续 `null`。虾是明确生鲜去壳虾，可在下一批挂已有 `shellfish_fully_cooked`／FoodSafety.gov 视觉终点；本轮只登记候选。虾在上层盘、米在内锅，不能宣称为同一内锅混合。 |

### 候选的来源 scope 说明

以上四条现有 `source_refs` 均已直接打开并声明与本次字段相关的 `claim_scopes`。真正回填前仍需按 TDD 逐字段检查：`fixed_batch` 每个写入的 ingredient 都必须有数值量和 `quantity` scope；水位线必须同时有 `liquid`、`appliance` scope；时间字段只能绑定原页明确的程序/总时长。TDD 不得顺手扩大 source scope 或把可选 garnish 变成固定数字。

## 已打开但不列入强候选的条目

| recipe_id | 官方直接事实 | 本轮不闭合原因 |
| --- | --- | --- |
| `maff-aichi-kiinai-okowa` | [MAFF 黄いないおこわ（爱知县）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/kiinaiokowa_aichi.html)：4 人份、もち米 3 合、黑豆 70g、栀子 1 个、盐；黑豆浸泡后约煮 30 分钟，米以栀子水“刚好盖过”后同炊。 | 可确认身份和固定材料，但液体是“刚好盖过”而非当前字段可无损的固定量；黑豆隔夜浸泡/预煮，页面还并列蒸笼版本；没有整道总时长。作为政府来源的 fixed-only 研究候选保留，不计入厂商强候选，也不写主 JSON。 |
| `tiger-carrot-rice`、`tiger-usa-saffron-rice` | 两个 Tiger 官方页均已给配料／水位或鸡汤：Carrot Rice 使用 Brown line 2；Saffron Rice 给 3–4 servings、1 又 3/4 杯鸡汤。 | Carrot Rice 页面将其标为 side dish，且固定份数不足；Saffron Rice 份数是 3–4 范围，不能压成一个 `servings`。前者只保留现有水位，后者只保留现有液体；本轮无新字段。 |
| `r105-tiger-corn-shumai-chinese-mixed-rice` | Tiger 官方页给 3 cups rice、3 cups Chinese chicken stock 和 Tacook 蒸盘同步流程。 | 当前液体已闭合；页面未给可安全写入的固定 servings，且是蒸点心与米饭上下层同步，不应把它当单内锅菜饭补齐。 |
| `tiger-usa-century-egg-fish-porridge` | Tiger 官方页的 2 servings、0.5 杯米、0.5 粥水位和 70 分钟，以及鱼类 63°C endpoint，已经在目录中闭合。 | 本轮不重复改动；作为“已闭合对照”保留。 |

## 下一批 TDD 建议顺序

1. 先做 `tiger-takikomi-gohan`：同一原页同时支持固定批量和型号水位线，先锁定 4 servings、3 cups rice 及所有有数值量的主料，明确雪豆出锅后加入。
2. 再做 `r60-tiger-basic-chicken-congee`：只补 0.5 Soft Porridge 水位线和 70 分钟；不要把标题中的 chicken 变成固定食材，也不要把 10 分钟 preparation 与 70 分钟相加。
3. 再做 `r60-tiger-taiwan-minced-pork-rice`、`r60-tiger-garlic-shrimp-herbed-rice`：只补 2 servings 和原页有数值的食材，分别保留 Tacook 上层盘边界；后者另行挂安全终点。

所有候选仍保持 `recipe_fact_checked`，不晋升 `executable`，不进入生产承诺层。r159 本轮新增 canonical：**0**；主 JSON 版本和 923 条数量不变。
