# r184 同源水位／组件液体合同回填

- 基线：`source-backed-one-pot-v1-20260808-global-r183` / 923 条；本批版本：`source-backed-one-pot-v1-20260808-global-r184` / 923 条。
- canonical 新增：0；状态晋升：0；本批只回填 4 条已有 `recipe_fact_checked` 的来源合同。
- `tiger-usa-autumn-chicken-mushroom-green-bean-pilaf`：Tiger Tacook 页面给出机型水位 3/4，记录为 source-waterline；不换算为普通电饭煲毫升数。
- `toshiba-vegetarian-mixed-brown-rice`：Toshiba PC-48DRSHK(K) 页面给出 RICE 2 水位，记录为机型限定 `waterline`；先炒蔬菜、Quick Rice 和总时长边界保留。
- `tvb-octopus-chicken-claypot-rice`：TVB 砂煲原方明确米水 1:1，记录为 `rice_to_water_ratio`；不将砂煲火候转换成电饭煲程序。
- `r59-panasonic-taiwan-spanish-seafood-risotto`：Panasonic 多功能锅来源给出高汤 800mL、水 150g、白酒 100mL 分段加液；只登记高汤 800mL 组件，其他液体不合并成单一总量。
- 以上合同均保留原器具、分段流程和来源定位；未新增 executable、未补猜安全终点，也未把机型水位线泛化为通用比例。
