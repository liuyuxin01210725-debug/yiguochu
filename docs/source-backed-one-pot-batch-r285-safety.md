# Source-backed one-pot batch r285 — 两条鸡肉安全证据闭合

- catalog version: `source-backed-one-pot-v1-20260808-global-r285`
- catalog size: 923
- canonical additions: 0
- executable additions: 0
- safety endpoint additions: 1
- safety source trace closures: 2

## Closed records

- `maff-kagoshima-keihan`（鶏飯）：MAFF 原页明确鸡胸肉放入鸡骨汤中煮，鸡肉通熟后撕丝，再与白饭、配料和热鸡汤组合。本批补齐该条已有 74°C 禽肉端点的 FoodSafety.gov source ref；保留汤饭的分段组合边界，不改成同锅电饭煲。
- `nu-zu-rou-ban-fan`（怒族肉拌饭）：人民日报海外版原文明确怒族土鸡与老火腿同锅烹煮，随后鸡肉撕丝并与荞米饭拌合。本批新增 `poultry_fully_cooked`、74°C 端点及对应 FoodSafety.gov source ref；保留柴火锅、簸箕拌合和无固定液体/总时长/电饭煲合同边界。

FoodSafety.gov 的禽肉表提供 74°C（165°F）最低中心温度；本批没有把来源的“煮熟”改写成电饭煲程序，也没有补猜缺失的批量、液体或总时长。

Sources:

- [農林水産省：鶏飯 鹿児島県](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/keihan_kagoshima.html)
- [人民日报海外版：在老姆登村与朋友共品美味](https://paper.people.com.cn/rmrbhwb/html/2017-12/09/content_1822380.htm)
- [FoodSafety.gov：Safe Minimum Internal Temperatures](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)
