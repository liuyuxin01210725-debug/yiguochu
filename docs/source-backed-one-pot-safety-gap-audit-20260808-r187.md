# r187 鱼类安全终点缺口审计

- 基线：r186 / 923 条；本轮不新增 canonical。
- 目标：只处理来源明确把鱼类放入加热周期、但已有 `safety_endpoints: []` 的条目；安全终点复用已核验的 `S-SAFETY-TEMPERATURES-1` 鱼类 63°C 规则。

## 可闭合的三条

1. `hk-salmon-edamame-quinoa-rice`（香港食环署官方图卡）
   - 图卡列三文鱼块、藜麦、毛豆、水2杯；步骤是将三文鱼与藜麦和水一同放入电饭煲煮熟。
   - 回填 `seafood_fully_cooked`，`minimum_core_temperature_c=63`。图卡没有总时长，保持原有时间缺口。
2. `taiwan-brown-rice-salmon-rice`（台湾国健署 PDF）
   - PDF列糙米与鲑鱼，步骤明确同放电子锅按煮饭程序，完成后把鱼压碎拌回。
   - 回填 `seafood_fully_cooked` 63°C；水量与总时长仍为 null。
3. `taiwan-fresh-fish-wild-mushroom-rice`（癌症关怀基金会原页）
   - 原页列2人份、鲷鱼150g；红藜糙米先完成第一段蒸煮，再将腌制鲷鱼铺上进行第二段电锅蒸煮，最后要求确认鱼肉熟透。
   - 回填 `seafood_fully_cooked` 63°C；保留二阶段电锅流程，不改写成全生料一次投放。

## 保持阻塞

- `tiger-steamed-abalone-rice` 仍是先蒸鲍鱼取汁、饭熟后回锅1分钟；来源未证明鲍鱼在第一阶段的生熟状态，不挂端点。
- 章鱼、淡水蟹、腊鱼或已煮/盐烤鱼等条目不因“有海鲜词”自动套用鱼类 63°C；需逐条确认物种、状态和加热阶段。

本轮只追加三条既有条目的安全端点与 FoodSafety.gov 共享来源，不改变份数、液体、时间、器具或 executable 状态。
