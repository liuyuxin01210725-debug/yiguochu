# r231 全球来源鸡肉安全终点闭合批次

基线为 r230/923。本批不新增 canonical、不晋升 executable，只为 4 条已有 `recipe_fact_checked` 记录补入同一官方流程和独立食品安全来源能够支持的禽肉终点。

| recipe_id | 一手来源事实 | 保留边界 | 回填 |
| --- | --- | --- | --- |
| `nih-medlineplus-chicken-rice` | MedlinePlus/NHLBI 原页给出 6 份、6 块鸡、2 杯米、4 杯水和约 90 分钟普通大锅流程；鸡肉先煮并取出，米熟后回锅再煮 8 分钟。 | 取出/回锅的分阶段流程保留，不外推电饭煲；原菜谱没有数值禽肉终点。 | `poultry_fully_cooked`，74°C |
| `unl-chicken-rice` | University of Nebraska–Lincoln 原页给出 8 份、1 lb 鸡胸、1 杯 Basmati 米、2.5 杯水；普通大锅盖煮约 45 分钟，另列压力锅 8–10 分钟。 | 浸泡米、熟斑豆和压力锅提示保持原文；不把压力锅分钟数改写成电饭煲合同。 | `poultry_fully_cooked`，74°C |
| `au-slhd-oven-baked-biryani` | NSW Government Sydney Local Health District 原页给出 2/4/6 份量表；4 份含 500g 鸡腿、1 杯印度香米、2 杯鸡汤，炉灶预炒后 180°C 带盖烤箱 40 分钟。 | 保留炉灶→烤箱两阶段、烤箱温度和 2/4/6 份量范围，不外推电饭煲。 | `poultry_fully_cooked`，74°C |
| `sg-healthhub-brown-rice-chicken-congee` | Singapore Health Promotion Board PDF 第 17 页给出 4 份、180g 糙米、150g 鸡腿/鸡棒腿、10 杯水；电饭煲先煮米，再加入鸡肉、蔬菜，拆丝回锅。 | 保留分阶段投料和未给型号/程序的边界；来源未提供总时长，不补 time_contract。 | `poultry_fully_cooked`，74°C |

四条终点统一引用 [FoodSafety.gov 安全最低内部温度表](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures) 的禽肉 165°F/74°C。该来源只支持禽肉安全终点，不补写原菜谱没有证明的份数、液体、总时间或器具等价关系。

## 验证

先在 r230 基线上运行专项测试，版本断言按预期失败；写入 4 条 endpoint 后 `source-backed-one-pot-batch-r231-safety.test.mjs` 通过 2/2。随后重建 source-backed artifacts，并运行目录 validator、聚合菜谱门禁和 `git diff --check`。
