# r187 鱼类安全终点小批

- 基线：r186 / 923 条；当前：r187 / 923 条。
- 新增 canonical：0；新增 executable：0；回填 3 条既有 `recipe_fact_checked` 的鱼类安全终点。

## 回填

1. `hk-salmon-edamame-quinoa-rice`：三文鱼在香港食环署图卡的电饭煲周期前投入，挂 `seafood_fully_cooked` 63°C。
2. `taiwan-brown-rice-salmon-rice`：鲑鱼与糙米进入电子锅煮饭周期，挂 `seafood_fully_cooked` 63°C。
3. `taiwan-fresh-fish-wild-mushroom-rice`：鲷鱼在第二段电锅蒸煮前铺到已蒸谷物上，挂 `seafood_fully_cooked` 63°C；保留来源的分阶段边界。

三条均追加 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov，fin fish 145°F / 63°C）；不把来源的“煮熟”或器具时间伪装成数值安全终点，也不新增液体、时间或电饭煲通用参数。
