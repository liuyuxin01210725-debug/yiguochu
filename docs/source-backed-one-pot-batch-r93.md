# Source-backed one-pot batch r93

日期：2026-08-06  
基线：`source-backed-one-pot-v1-20260806-national-r92`（761 条；r91 无新增）  
结果：新增 3 条；版本升至 `source-backed-one-pot-v1-20260806-national-r93`（764 条）。

本批继续按厂商官方、机构官方和地域线并行搜集。新增条目全部为 `recipe_fact_checked`，没有晋升 `executable` 或 `kitchen_observed`。每条记录只写直接来源实际证明的事实；缺失的液体、时间、份量、安全或器具转换参数保持缺口。

## 新增条目

| recipe_id | 菜名 | 来源 | 状态 | 本批边界 |
| --- | --- | --- | --- | --- |
| `toshiba-hk-chicken-scallop-porridge-pc48drshk` | Chicken Porridge with dried scallops（干贝鸡肉粥） | [Toshiba Lifestyle Hong Kong 官方页](https://www.toshiba-lifestyle.com/hk-en/recipe/PressureCookerRecipe/ChickenPorridgewithdriedscallops) | `recipe_fact_checked` | Toshiba PC-48DRSHK(K) 电压力锅 Quick Porridge 20 分钟；原页同时写水 6 杯与先加 4 杯再补至 Rice 水位 4，鸡肉写“1/2”但无单位；不外推普通电饭煲，不补禽肉安全终点 |
| `japan-hyogo-barley-chicken-vegetable-rice` | 栄養満点！もち麦炊き込みご飯 | [日本农林水产省近畿农政局 PDF](https://www.maff.go.jp/kinki/syouhi/seikatu/syokuiku/attach/pdf/241015-46.pdf) | `recipe_fact_checked` | 2 人份白米、もち麦、鸡胸、胡萝卜、香菇、油豆腐及浸泡/铺料流程；来源为燃气灶/锅，未给固定液体、总时间或禽肉安全终点，不改写为电饭煲 |
| `japan-hokkaido-black-chiset-soy-rice` | 黒千石炊き込みご飯 | [日本农林水产省北海道农政事务所 PDF](https://www.maff.go.jp/hokkaido/press/syokuryo/keikaku/attach/pdf/240219-2.pdf) | `recipe_fact_checked` | 黑千石大豆浸泡过夜，米、豆、昆布和调味料一起入电饭煲；来源缺固定水量、份数、时间和安全终点，不宣称普通机型 executable |

## 营养与身份边界

- Toshiba 粥方有米和鸡肉/干贝蛋白，但营养等级为 C；液体冲突和鸡肉单位缺失不作猜值。
- 近畿もち麦炊饭与北海道黑千石炊饭均记录为碳水、蛋白、膳食纤维三类结构；这只表示来源中的食材结构，不等于已完成营养计算或厨房验证。
- 三条均停留在研究层。未来申请 `executable` 时仍需来源合同闭合、PDF 本地凭证（如适用）、人工逐条签署和厨房验证；本批不提前晋升。

## 三路搜集结果与排除

### 厂商官方线

- Toshiba 香港官方页新增 1 条电压力锅粥方。原方液体和鸡肉份量存在明确缺口，故保留矛盾和机型边界。

### 机构官方线

- 日本农林水产省近畿/北海道官方 PDF 各新增 1 条具名炊饭。两条均记录 PDF 页码和实际器具，不把燃气灶/锅或单一电饭煲来源转换为通用参数。

### 地域线

- 本批未找到同时满足“具名、直接可读来源、米饭主餐结构、非纯碳水”的新增中国地域条目。已命中但来源不足、熟饭二次加工、纯谷物或已有条目均不入库。

## 状态变化

| 状态 | r92 | r93 |
| --- | ---: | ---: |
| executable | 12 | 12 |
| recipe_fact_checked | 664 | 667 |
| identity_verified | 79 | 79 |
| discovered | 6 | 6 |
| kitchen_observed | 0 | 0 |
| 合计 | 761 | 764 |

## 研究纪律

- 三条来源均直接打开，记录 `evidence_tier`、定位、署名、许可和实际 `claim_scopes`；未将厂商配方包装成传统地域身份。
- 生米、投料顺序、指定器具和来源冲突原样保留；没有从名称或常识补写液体、时间、安全或普通电饭煲等价参数。
- 本批没有修改 Worker、前端、Planner、模板或 DeepSeek，没有部署；数据、专项测试、目录门禁和菜谱门禁按批次提交。
