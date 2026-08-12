# r168：CUCKOO 鲍鱼锅饭固定批次回填

基线为 r167/923。本批没有新增 canonical，只把已有 `cuckoo-abalone-pot-rice` 的固定份数和同源配料量闭合到官方 CUCKOO America 原页。

## 回填条目

- `cuckoo-abalone-pot-rice`：官方页面 [Abalone Pot Rice with the CR-0675F](https://cuckooamerica.com/blogs/recipes/abalone-pot-rice-with-the-cr-0675f) 直读为 4 servings、2 cups short-grain rice、2.5 cups water、4 small abalone、1 Tbsp soy sauce、1 tsp sesame oil、1 tsp sugar、1 Tbsp minced garlic、1/2 tsp salt、2 green onions、1 tsp sesame seeds；总时长为 prep 15 + cook 35 = 50 分钟。页面流程是浸泡 10 分钟、腌鲍鱼、铺在米面、CR-0675F 的 White Rice、完成后 Keep Warm 5–10 分钟。
- 主目录只回填 `fixed_batch.servings=4` 及上述同源配料，保留既有 2.5 cups `liquid_contract` 和 50 分钟 `time_contract`。所有量的 `source_ids` 均为 `S-CUCKOO-ABALONE-POT-RICE-1`。
- 不新增贝类安全端点：页面正文的介绍写 canned abalone，而配料写 cleaned small abalone；鲍鱼形态仍需人工统一，且来源没有可直接复用的贝类温度终点。因此 `safety_endpoints=[]` 保持不变。
- `cooker_adaptation=source_limited` 保持不变，仅适用于 CUCKOO CR-0675F 的内锅和 White Rice/Keep Warm 流程，不外推到普通电饭煲。

## 验证

- r168 专项测试：2/2 通过。
- 本批未晋升 executable、未新增菜谱、未改运行时代码或 UI。
