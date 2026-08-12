# r202 鸡肉安全缺口审计

基线为 `source-backed-one-pot-v1-20260808-global-r201`（923 条）。本轮只审已有条目，不新增 canonical、不改 executable 状态。

## 直接来源与安全事实

| recipe_id | 直接来源事实 | 回填 | 保留边界 |
| --- | --- | --- | --- |
| `instant-pot-tuscan-chicken-rice` | [Instant Pot 官方 Tuscan Chicken and Rice](https://instantpot.com/blogs/recipes/tuscan-chicken-and-rice) 明确鸡腿先煎至“未熟透”，再回锅与米和鸡汤做压力烹调。 | `poultry_fully_cooked`，74°C；挂 `S-SAFETY-TEMPERATURES-1`。 | 保留 Instant Pot 的 Sauté、Pressure Cook、自然泄压和回锅流程，不外推普通电饭煲。 |
| `taiwan-red-amaranth-chicken-rice` | [台湾农业部红凤菜鸡肉炊饭 PDF](https://kmweb.moa.gov.tw/redirect_files.php?id=460956&theme=knowledgebase) 第24页列鸡腿；先将鸡腿表面煎熟，再与白米和蔬菜入电子锅。 | `poultry_fully_cooked`，74°C；挂 `S-SAFETY-TEMPERATURES-1`。 | 保留 PDF 的先炒/先煎与电子锅顺序；水量仍是来源的“适量”，不伪造液体合同。 |
| `taiwan-provencal-mushroom-chicken-risotto` | [世新大学教育手册](https://osa.web.shu.edu.tw/wp-content/uploads/sites/32/2020/05/oil.pdf) 第60页列鸡胸；鸡肉与洋葱、菇类先炒，再与米和薏仁炊煮。 | `poultry_fully_cooked`，74°C；挂 `S-SAFETY-TEMPERATURES-1`。 | 保留教育手册的电锅/先炒流程，不补总时长。 |
| `taiwan-tea-oil-bamboo-shoot-chicken-rice` | [台北市文山区公所健康中心 PDF](https://www-ws.gov.taipei/001/Upload/529/relfile/26222/8181938/cf2db2e6-8171-4aed-8587-641ff12f807f.pdf) 第2页列去骨鸡腿约500g；鸡肉先以茶油煎熟后切块，再和米、竹笋、香菇蒸熟。 | `poultry_fully_cooked`，74°C；挂 `S-SAFETY-TEMPERATURES-1`。 | 保留糙米浸泡及内/外锅水分层，不把来源改写成单一普通电饭煲液体。 |
| `taiwan-golden-mushroom-chicken-rice` | [台湾国健署食谱 PDF](https://health99.hpa.gov.tw/storage/pdf/materials/22632.pdf) 第37页列鸡绞肉；鸡绞肉、蔬菜和菇类先炒熟，再入电锅蒸饭，之后另有乳酪摆盘步骤。 | `poultry_fully_cooked`，74°C；挂 `S-SAFETY-TEMPERATURES-1`。 | 乳酪烤箱摆盘仍是后处理，不改写为电锅主锅流程；不补总时长。 |

FoodSafety.gov 当前安全表明确鸡、火鸡等禽肉所有部位（包括绞禽）最低中心温度为 165°F/74°C；本批只复用这一既有安全来源，不把来源的“煎熟/炒熟”文字冒充温度证明。

## 不纳入本批

鲍鱼、牛肉南瓜焖饭、黎家竹筒饭以及生熟状态不清的综合海鲜仍保留空 `safety_endpoints`；这些条目缺少可无损映射的物种、部位或状态证据，不跨来源补猜。
