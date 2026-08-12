<!-- Generated file: do not edit directly. -->

# 东北炖锅安全终点证据

> 排骨、普通豆角和油豆角已有受控熟制终点，可开始填写 2/3/4 人份实厨校准；这不解除数值比例、校准结果或运行模板的阻塞。

- 官方安全来源：3
- 可进入实厨校准的安全分支：2
- 待完成校准：3
- 已激活生产规则：0

- 排骨：最厚可食部位（避开骨头）至少 63 C，并在离火后静置至少 3 分钟。
- 普通豆角：在受控加水盖焖方法下保持 100 C 小火焖超过 10 分钟，并确认均匀受热、无生绿色和豆腥味。
- 油豆角：确认豆荚蔫软、转暗绿、无豆腥味并继续彻底烹熟；官方来源未给出分钟数，因此本规则不填分钟默认值。

## 官方来源与适用边界

| 来源 | 直接适用食材 | 证据分类 | 终点摘要 | 不能证明 |
| --- | --- | --- | --- | --- |
| [Beef, Lamb, Pork and Veal Roasting Chart](https://www.foodsafety.gov/print/pdf/node/13?id=beef-lamb-veal-roasting)（FoodSafety.gov；U.S. Department of Health & Human Services；2023-09-21；检索 2026-07-27） | pork-ribs | direct_official_endpoint | The official fresh-pork chart explicitly lists ribs and sets the chart minimum at 63 C with at least a 3-minute rest. | It does not establish an automatic Northeast stew duration for household rib size or pot geometry.、Its 90-120 minute reference times cannot be written as a production default for this product.、It does not establish cornmeal hydration, stew liquid or pot-edge steaming time. |
| [警惕四季豆中毒](https://wjw.hubei.gov.cn/bmdt/jkhb/spyy/202105/t20210525_3555672.shtml)（湖北省卫生健康委员会；湖北省疾病预防控制中心；2021-05-25；检索 2026-07-27） | green-beans | direct_official_method_endpoint | For household four-season beans, the guidance requires cooking through evenly until raw green and bean odor are absent, including covered simmering at 100 C for more than 10 minutes in the stated method. | It does not establish a shorter endpoint for pressure cookers, microwaves or other methods.、It does not prove that every food whose name contains the character 豆 belongs to this scope.、It does not establish a flavor or texture preference beyond the safety endpoint. |
| [海南省食品安全委员会办公室食品安全消费提示（2017年第3号）](https://amr.hainan.gov.cn/zw/xfts/201703/t20170309_1589724.html)（海南省市场监督管理局；海南省食品安全委员会办公室；2017-03-09；检索 2026-07-27） | oil-beans | direct_official_qualitative_endpoint | The guidance directly covers Northeast oil beans: cook through until pods are limp, color changes from bright to dark green and raw bean odor is absent, then continue cooking; long-heating methods such as stewing are preferred. | It does not publish an exact minimum number of minutes for oil beans.、It does not permit borrowing the four-season-bean 10-minute number as an oil-bean default.、It does not establish ratios, serving scaling or a production recipe. |

## 受控安全规则

所有 `all_of` 条件必须同时满足。排骨的官方参考时长不能替代温度计；普通豆角与油豆角分别走自己的规则，不能互借分钟数。

| 规则 | 状态 | 食材 | 全部必需终点 | 方法约束 | 不能证明 |
| --- | --- | --- | --- | --- | --- |
| pork-ribs-safe-endpoint-v1 | calibration_ready | pork-ribs | internal_temperature_c >= 63 C（thickest edible meat portion, measured away from bone）；rest_time_minutes >= 3 min（after removal from the heat source before carving or eating） | Use a food thermometer; color or tenderness alone cannot satisfy the endpoint.、The official time range is reference-only and cannot replace temperature measurement. | household cooking time、tenderness target、stew liquid ratio |
| green-beans-fully-cooked-v1 | calibration_ready | green-beans | covered_simmer_temperature_c >= 100 C（covered low simmer in the documented household method）；covered_simmer_minutes > 10 min（continuous covered low simmer after adding water）；even_heating_confirmed == 是（all pods turned during cooking and no crowded cold spots）；raw_green_absent == 是（all pods have lost the original raw green appearance）；bean_smell_absent == 是（no raw bean odor remains） | This numeric endpoint applies only to the documented covered-simmer method.、Every condition is required; visual color alone is insufficient. | oil-bean minimum minutes、other bean species、preferred texture |
| oil-beans-fully-cooked-v1 | calibration_ready | oil-beans | pod_limp == 是（pods have changed from upright or stiff to limp）；dark_green_reached == 是（pod color has changed from bright green to dark green）；bean_smell_absent == 是（no raw bean odor remains）；fully_cooked_confirmed == 是（oil beans were fully cooked after the preliminary boiling endpoint; short high-heat cooking is forbidden） | Prefer a long-heating method such as stewing.、No exact minute value may be inferred from this source. | minimum oil-bean minutes、four-season-bean numeric endpoint、serving-scale timing |

## 准入结论

状态：`ready_for_kitchen_calibration`。安全终点已经满足实厨校准的记录前提，但仍有：numeric_ratio_rules_blocked、calibration_2_3_4_servings_pending、template_not_runtime_eligible。

本结论不激活 Ratio DSL、模板或生产生成链路。
