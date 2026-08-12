# source-backed one-pot batch r133 · global public7

**批次日期**：2026-08-08
**目录版本**：`source-backed-one-pot-v1-20260808-global-r133`
**基线**：r131 / 902 条
**本批新增**：4 条 `recipe_fact_checked`；0 条 `executable`；目录总数 906 条。

## 本批范围

本批只从 `docs/source-backed-one-pot-intake-20260808-global-public7-r132.md` 整合四条已直接打开、具名、主餐边界清楚且可按当前 schema 表达的来源记录：

1. **Chicken & Rice**（University of Nebraska–Lincoln）：普通大锅版本，8 份、米/水/鸡肉/熟斑豆/土豆字段完整；保留浸泡米、熟豆和另列压力锅提示，不把它改成电饭煲配方。
2. **Cheesy Chicken, Rice, & Vegetable Skillet**（Ohio State University）：普通 skillet 版本，保留鸡肉、糙米、西兰花、胡萝卜、洋葱和 1 又 1/3 杯水；来源没有固定份数和总时长，因此对应合同保持缺失。
3. **Arroz con Pollo (Chicken with Rice)**（University of Illinois Extension）：9 个一杯份；鸡肉先取出，原锅炒米并加入汤/酒/番茄，最后回锅，明确标为分阶段普通锅，不压缩为一次投料。
4. **One Pot Caribbean Jerk Chicken & Rice**（University of Colorado System）：6 份、米/红腰豆/椰奶/鸡汤量和 45 分钟总时长完整；鸡腿先煎后取出、原锅煮米后回锅并转烤箱，保留烤箱边界。

## 未整合记录

- N.C. Simple Stir-Fry、NHLBI Wiki (Fast) Rice、OSU Burrito Bowl 和 UConn Chicken Soup 均从熟饭、即食米或熟鸡开始，标记为 `cooked_rice_second_cook`，留在未来熟饭品类 intake。
- K-State Mama’s Chicken and Rice、VA Chicken Cauliflower Enchilada Skillet、UCF Southwest Chicken & Rice Skillet、TAMU Skillet Chicken and Rice Casserole、USC One-Pot Spanish Chicken Sausage and Shrimp with Rice 仍是 `archive_or_blocked`：PDF 超大/超时、403 或图片正文阻塞，未把搜索摘要和图像标题当成事实数字。

## 证据与门禁说明

- 四条记录均保留官方直达 URL、`access_status: opened`、显式证据分级和定位信息；PDF 来源未在非 executable 阶段伪造本地归档，也未把普通锅/烤箱参数外推到电饭煲。
- 四条均保持 `recipe_fact_checked`，不具备人工签署或厨房验证资格；禽肉安全终点未由本批来源给出，`safety_endpoints` 保持空数组并在 `evidence_notes` 标明缺口。
- 目录版本从 r131 bump 至 r133；没有新增 recipe 以外的运行时、Planner、UI 或部署改动。
- TDD 专项测试：`tools/tests/source-backed-one-pot-batch-r133-global-public7.test.mjs`；先在 r131 基线下验证失败，再在四条记录写入后通过。
