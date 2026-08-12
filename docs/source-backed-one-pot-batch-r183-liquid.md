# r183 同源水量／水位合同回填

- 基线：`source-backed-one-pot-v1-20260808-global-r182` / 923 条；本批版本：`source-backed-one-pot-v1-20260808-global-r183` / 923 条。
- canonical 新增：0；状态晋升：0；本批只回填 4 条已有 `recipe_fact_checked` 的来源合同。
- `cookpot-lap-mei-claypot-rice-1200`：锅宝机型限定米水 1:1，记录为 `rice_to_water_ratio`；不外推人数、总时长或普通电饭煲参数。
- `tiger-corn-rice`：Tiger IH 页面给出白米 2 杯水位线，记录为机型限定 `waterline` mark 2；玉米饭仍保留“需另配蛋白质或蔬菜”的营养边界。
- `maff-tokushima-sobagome-zosui`：MAFF 原页给出出汁 4 杯，记录为 `added_dashi`；荞麦米预煮、冲洗和另锅煮肉菜边界不变，不改写为一键电饭煲方案。
- `tatung-pork-jowl-sesame-rice`：大同原页给出干香菇泡发液 180 ml，记录为 `soaking_liquid` 组件；泡发液与料理酒等其他液体仍未合并成单一总液体。
- 以上合同均保留原器具、来源定位和缺失字段；未新增 executable、未补猜安全终点，也未把机型水位线泛化为通用比例。
