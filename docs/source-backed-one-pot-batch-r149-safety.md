# r149 安全终点小批次（4 条既有菜谱）

> 目录版本：`source-backed-one-pot-v1-20260808-global-r149`
> 基线：r148 / 923 条
> 变更类型：只补已有条目的安全合同；新增 canonical：0；晋升 executable：0；运行时代码/UI：0。

## 本批次准入原则

本批处理 r149 intake 中原始来源明确包含未证明预熟的鸡肉或鲜虾、且可以复用项目已有 FoodSafety.gov 安全来源的四条。安全终点只补物种和温度合同，不改变原菜谱的米量、液体、器具、分阶段投料或饭后收尾。

共享安全来源：

- [FoodSafety.gov — Cook to a Safe Minimum Internal Temperature](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)
- `source_id`: `S-SAFETY-TEMPERATURES-1`
- 每条记录都附 `claim_scopes: ["safety"]`、`evidence_tier: 1`、`access_status: "opened"` 和物种对应定位；FoodSafety.gov 只证明安全终点，不被伪装成原菜谱来源。

## 变更清单

| recipe_id | 安全食材 | 新 endpoint | 终点 | 原流程边界 |
|---|---|---|---:|---|
| `panasonic-chicken-cream-pilaf` | 鸡腿肉 80g | `poultry_fully_cooked` | 74°C | Panasonic 电饭煲炊饭；饭熟后才加鲜奶油和黄油并焖5分钟，不能用焖5分钟替代禽肉终点 |
| `taiwan-vegetable-chicken-rice` | 鸡肉约200g | `poultry_fully_cooked` | 74°C | 农粮署原方先炒香再把生米、鸡块和高汤转入来源允许的电锅/烤箱；不补总时长，不把“煮熟”改成来源没有的温度数字 |
| `hk-pumpkin-taro-chicken-claypot-rice` | 鸡胸肉 75g | `poultry_fully_cooked` | 74°C | 香港卫生署煲仔饭原方；保留氽水、腌制和10分钟＋5分钟煮制，不推导电饭煲程序 |
| `hk-taro-shrimp-multigrain-steamed-rice` | 鲜虾 6只 | `seafood_fully_cooked` | 74°C | 香港卫生署瓦煲蒸饭；米和芋头先蒸约30分钟后投虾，再按原方继续蒸制，保留中途投料边界 |

## 明确不在本批处理

`panasonic-oyster-negi-takikomi-rice` 仍保持 `safety_endpoints: []`。Panasonic 原页只写牡蛎铺在米面按机型水位线炊饭，没有明确牡蛎是生鲜、预煮还是其他预处理状态；本批不使用常识补“生牡蛎”，也不把54–60分钟或水位线当安全终点。待原料状态证据闭合后再审。

## 证据与边界

- 四条菜谱原始来源继续支撑各自的名称、食材、液体和流程；新增的 `S-SAFETY-TEMPERATURES-1` 只支撑安全终点。
- 禽肉候选使用 FoodSafety.gov 165°F/74°C 定位；鲜虾按项目既有甲壳类安全约束使用充分加热、74°C 定位，并在 source locator 中明确 shellfish/seafood 适用范围。
- 香港两条菜仍是煲仔/瓦煲，台湾条目仍保留电锅或烤箱的来源限定；安全 endpoint 不等于电饭煲适配。
- 所有条目保持 `recipe_fact_checked`，不晋升 `executable`，不声明厨房验证，不增加轮替池或运行时能力。

## 验证记录

- r149 专项 TDD：`tools/tests/source-backed-one-pot-batch-r149-safety.test.mjs`（先红后绿，3/3 通过）。
- 本批新增 canonical：0；目录总数：923；牡蛎条目仍空安全终点。
