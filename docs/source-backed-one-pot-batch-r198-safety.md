# r198 安全契约批次：MAFF 鸡肉饭

基线目录为 `source-backed-one-pot-v1-20260808-global-r197`（923 条）；本批升级为 r198，新增 canonical=0、executable=0，仅为四条既有 `recipe_fact_checked` 条目补上同源可追溯的禽肉熟制端点。

## 本批回填

| recipe_id | 一手事实边界 | 回填 |
| --- | --- | --- |
| `maff-fukuoka-kashiwa-meshi` | MAFF 福冈原页写鸡腿先煎/煮，再与米饭混合 | `poultry_fully_cooked`，74°C |
| `maff-chiba-takatsu-torimeshi` | MAFF 千叶原页写鸡腿切小并煮至收汁，再拌入刚煮好的米饭 | `poultry_fully_cooked`，74°C |
| `maff-hokkaido-bibai-torimeshi` | MAFF 北海道原页写鸡肉与煮汁分步处理，米饭吸收液体后再拌回鸡肉 | `poultry_fully_cooked`，74°C |
| `maff-miyazaki-torimeshi` | MAFF 宫崎原页写地鸡先炒，再与米饭/蔬菜同煮 | `poultry_fully_cooked`，74°C |

四条均挂既有 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov 禽肉 74°C）并保留原来源的先熟后拌、先炒后炊或分汁回拌边界。程序时长不被当作温度证明，份数、液体与普通电饭煲适配也未被推导。

## 证据与排除

- [MAFF 福冈 かしわめし](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/kashiwa_meshi_fukuoka.html)
- [MAFF 千叶 高津のとり飯](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/takatsu_no_torimeshi_chiba.html)
- [MAFF 北海道 美唄のとりめし](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/bibainotorimeshi_hokkaido.html)
- [MAFF 宫崎 とりめし](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/tori_meshi_miyazaki.html)
- [FoodSafety.gov Safe Minimum Internal Temperatures](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)

`tiger-hamo-rice` 使用的是照烧鳗鱼，`panasonic-taiwan-golden-snapper-rice` 未证明鱼肉生熟状态，均不在本批安全回填内。

## 验证

- r198 专项测试：2/2
- source-backed 测试：551/551
- `check-source-backed-one-pot-catalog.mjs --check`：通过
- `check-recipes.mjs`：通过
- `git diff --check`：通过
