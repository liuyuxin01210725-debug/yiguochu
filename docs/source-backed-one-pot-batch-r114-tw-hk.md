# Source-backed one-pot batch r114 · 台湾农粮署汤饭

日期：2026-08-07  
目录版本：`source-backed-one-pot-v1-20260807-national-r114`  
基线：r113（852 条）  
本批新增：2 条  
新增后：854 条

## 本批范围

本批只整合台湾农粮署北区分署《食農教育電子書 9》已经直接打开核对的两条具名汤饭。两条均保留为 `recipe_fact_checked`，不晋升 `executable`，不宣称电饭煲适配。

共同来源：<https://ebook.afa.gov.tw/tefd/ebook9/ebook9-1.html>

| recipe_id | 菜名 | 来源定位 | 已结构化事实 | 明确缺口 | 器具边界 |
| --- | --- | --- | --- | --- | --- |
| `afa-ebook9-clam-greens-soup-rice` | 蛤蜊青菜湯飯（蛤蜊青菜汤饭） | `ebook9-1.html 行328至340` | 1 人份；白飯、蛤蜊、青江菜、薑；蛤蜊 180g、青江菜 50g、薑絲 5g、白飯 3/4 碗；水 1.5 碗；普通湯鍋流程 | 总时长和蛤蜊安全终点未提供 | `cooker_adaptation=not_adapted`，不外推电饭煲 |
| `afa-ebook9-roselle-soup-rice` | 羅宋湯飯（罗宋汤饭） | `ebook9-1.html 行732至746` | 1 人份；米飯、牛肉、蕃茄、高麗菜、嫩薑；牛肉 35g、蕃茄 1/2 个、高麗菜 50g、嫩薑 10g、米飯 3/4 碗；高湯 2 碗；普通湯鍋流程 | 总时长和牛肉安全终点未提供 | `cooker_adaptation=not_adapted`，不外推电饭煲 |

## 结构化纪律

- 两条来源的数量、液体和流程事实均只引用同一篇官方原文，不把其他汤饭或电饭煲资料拼入。
- `蛤蜊青菜湯飯` 的液体合同为 `added_water`；`羅宋湯飯` 的液体合同为 `added_broth`，两者不混淆。
- 原文是普通汤锅/湯鍋流程；目录不把汤锅时间、水量或投料顺序推导成电饭煲参数。
- 原文未提供完整总时长与相应的海鲜/牛肉安全终点，`time_contract=null`、`safety_endpoints=[]`，并在条目说明中显式保留缺口。
- 两条均属于来源事实档案，不能在页面上标作“已验证可照做”或“已完成厨房验证”。

## 验证

新增 TDD：`tools/tests/source-backed-one-pot-batch-r114-tw-hk.test.mjs`，覆盖版本/数量、具名与别名、核心食材、份量、液体类型与数值、来源定位、状态、普通汤锅边界及缺失合同。  
本批专项测试：2/2 通过；`node tools/check-source-backed-one-pot-catalog.mjs`：854 条、目录与生成产物一致；`node tools/check-recipes.mjs`：菜谱库体检通过。
