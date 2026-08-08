# r182 同源液体合同回填

- 基线：`source-backed-one-pot-v1-20260808-global-r181` / 923 条
- 当前：`source-backed-one-pot-v1-20260808-global-r182` / 923 条
- 新增 canonical：0；本批补 4 条既有 `recipe_fact_checked` 的同源液体合同；未新增 executable。

本批只登记来源直接给出的液体对象与数值，保留原器具和阶段边界：

1. `maff-kanagawa-ume-gohan`：农林水产省原页给出 5–6 人份与 720cc だし汁；登记为 `added_dashi`，不把 5–6 人范围压成单一 servings。
2. `panasonic-taiwan-truffle-seafood-risotto`：Panasonic SR-PAA100 原页给出高汤 150g；登记为 `added_broth`，保留海鲜同锅与既有贝类安全端点。
3. `panasonic-taiwan-shiitake-bamboo-chicken-rice`：Panasonic SR-PAA100 原页给出香菇水 1.5 杯；登记为 `added_water`，保留鸡肉/具材先炒后入电饭锅及禽肉安全端点。
4. `r60-tiger-shiitake-garlic-rice`：Tiger 原页给出 2 杯香菇高汤；登记为 `added_broth`，保留 Brown 程序和 `source_limited` 机型边界。

四条均未推导通用电饭煲参数、总时长或新安全事实；固定份数仍按原目录保留 null，状态保持 `recipe_fact_checked`。
