# r137 全球公共机构一锅米饭批次

**目录版本**：`source-backed-one-pot-v1-20260808-global-r137`
**基线**：r135，911 条
**本批新增**：5 条，至 916 条
**状态**：5 条均为 `recipe_fact_checked`，0 条 `executable`
**范围**：只新增来源有据的具名米饭候选；不改运行时、Planner、UI，不部署。

## 新增条目

| recipe_id | 具名菜 | 来源 | 原器具/流程 | 主要缺口 |
|---|---|---|---|---|
| `healthvermont-spinach-carrot-rice-pilaf` | Spinach and Carrot Rice Pilaf | Vermont Department of Health / National WIC Association PDF | 普通重锅；糙米、胡萝卜、洋葱和2杯汤同锅，菠菜末段加入 | 无独立安全终点；不外推电饭煲 |
| `healthvermont-easy-veggie-risotto` | Easy Veggie Risotto | Vermont Department of Health / National WIC Association PDF | 普通 skillet；蔬菜分层、豌豆和奶酪末段加入 | 无总时长和独立安全终点；不外推电饭煲 |
| `healthvermont-one-pot-chicken-brown-rice` | One Pot Chicken and Rice | Vermont Department of Health / National WIC Association PDF | 400°F 烤箱加盖锅；先炒蔬菜，再放米水和鸡腿，揭盖续烤 | 无禽肉数值安全终点；烤箱参数不外推电饭煲 |
| `cdph-calfresh-chicken-rice` | Chicken and Rice | California Department of Public Health CalFresh Healthy Living | 普通煎锅分阶段；鸡肉先炒并取出，米饭和蔬菜煮好后摆回 | 无禽肉数值安全终点；不压缩成全投料 |
| `wisconsin-polk-arroz-con-pollo` | Arroz con Pollo Chicken and Rice | University of Wisconsin–Madison Polk County Extension PDF | 普通大煎锅；鸡肉和香料先处理，盖锅煮汤后加米，末段加豌豆 | 同名 canonical 需人工复核；无禽肉数值安全终点 |

## 证据与边界

- Vermont PDF 的三条配方均记录了固定份数、食材量、液体和原器具。One Pot Chicken and Rice 只保留 400°F 烤箱及 45–50 分钟加盖、15–20 分钟揭盖的原文，不生成电饭煲等价参数。
- CalFresh 页面明确鸡肉取出/回放，Polk PDF 明确普通大煎锅分阶段；两者均保留阶段边界，未伪装成一次投料。
- `UNH Rice Pilaf`、熟饭二次烹、慢炖锅和其他烤箱候选仍停留在 r136 intake，没有因本批入库而进入生米主餐池。
- 5 条来源均直接打开，有 `evidence_tier`、`evidence_locator` 和实际 claim scopes；缺少的安全合同保持缺失，不用常识回填。

## 验证

- `tools/tests/source-backed-one-pot-batch-r137-global-public9.test.mjs`：3/3 通过。
- 测试覆盖：版本/总数/去重、来源门禁、固定份数、米态、液体、阶段步骤、原器具边界和不应混入的熟饭/配菜条目。
- 后续由主线运行 catalog、check-recipes 和 artifacts 构建；本批不晋升 executable。
