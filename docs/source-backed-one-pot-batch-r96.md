# Source-backed one-pot batch r96

日期：2026-08-06  
基线：`source-backed-one-pot-v1-20260806-national-r94`（765 条；r95 无新增）  
结果：新增 1 条；版本升至 `source-backed-one-pot-v1-20260806-national-r96`（766 条）。

本批由机构官方、厂商官方和中国地域三路并行搜集。只有韩国农村振兴厅线形成一条未重复、可直接核验的研究记录；厂商线和地域线均完成去重或排除，没有为数量降低证据和营养门槛。新增条目为 `recipe_fact_checked`，没有晋升 `executable` 或 `kitchen_observed`。

## 新增条目

| recipe_id | 菜名 | 来源 | 状态 | 本批边界 |
| --- | --- | --- | --- | --- |
| `rda-korean-ginseng-chicken-nutrition-rice` | `인삼 영양밥`（韩国人参营养饭） | [韩国农村振兴厅官方页](https://www.rda.go.kr/middlePopOpenPopNongsaroDBView.do?no=2109) | `recipe_fact_checked` | 第71至76行：大米3杯、鸡肉100g、人参2根、栗子4个、红枣6个、鸡高汤7杯、浸米约30分钟和煮饭流程；未给固定成品份数、完整总时间、电饭煲型号/程序或独立鸡肉安全终点；“除人参外”步骤与人参投料时机保持未决，不自行补写 |

## 两路没有新增

- **厂商官方线**：东芝、象印、松下及苏泊尔/美的本轮直达入口中，合格详情均已在目录，只有标题的动态索引或产品宣传不计入。
- **中国地域线**：伊犁、于田、克州抓饭、酉州/玉屏侗家社饭、广式腊味煲仔饭均已有条目；新疆学校食谱的“碎肉抓饭”缺独立地域/传统身份，纯碳水金包银和熟饭二次加工候选排除。

## 证据与浏览器边界

- 来源记录：`S-RDA-KR-GINSENG-NUTRITION-RICE-1`，`evidence_tier=1`、`access_status=opened`、定位为正文第71至76行，scope 仅覆盖 identity、ingredients、quantity、liquid、process。
- 这条记录不声明电饭煲适配，不建立 `time_contract`、`safety_endpoints` 或 `fixed_batch`，也不把官方“煮饭”字样扩展为现代设备合同。
- 本轮按要求尝试 Codex 内置浏览器（非 Chrome）；动态官方页面在内置浏览器中发生超时，因此不把浏览器超时当作证据。新增条目依据机构线报告中的官方直达页和逐项定位入库，仍保持研究层，后续可独立复核。

## 状态变化

| 状态 | r94/r95 | r96 |
| --- | ---: | ---: |
| executable | 12 | 12 |
| recipe_fact_checked | 668 | 669 |
| identity_verified | 79 | 79 |
| discovered | 6 | 6 |
| kitchen_observed | 0 | 0 |
| 合计 | 765 | 766 |

## 本批验证

- r96 专项测试：2/2 通过。
- source-backed 专项测试：332/332 通过。
- `node tools/check-source-backed-one-pot-catalog.mjs`：通过。
- `node tools/check-recipes.mjs`：通过。
- `python3 -m py_compile ai_proxy.py`：通过。
- 未修改运行时、未部署、未新增 recipe-runtime/template/planner 资产。
