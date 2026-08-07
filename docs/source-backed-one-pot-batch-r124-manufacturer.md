# 厂商官方一锅米饭候选批次 r124

日期：2026-08-08

基线：`source-backed-one-pot-v1-20260807-national-r118`（867 条）

结果：`source-backed-one-pot-v1-20260807-national-r124`（875 条）

## 本批新增

本批从已直接打开的 r123 厂商官方来源中挑选 8 条具名米饭主餐候选。全部状态保持 `recipe_fact_checked`，不晋升 `executable`、`preview_ready` 或 `kitchen_observed`：

1. **One Pot Chicken and Brown Rice Dinner** — [Instant Pot 官方页](https://instantpot.com/blogs/recipes/one-pot-chicken-and-brown-rice-dinner)。来源给出 6–8 人份范围、2.5 杯高汤、糙米与鸡肉蔬菜同锅，以及 Sauté/Manual 30 分钟/NPR 10 分钟边界。份数是范围，`fixed_batch` 保持空；页面没有稳定总时长，`time_contract` 保持空。仅限 Instant Pot，不外推普通电饭煲。
2. **Quick Chicken Steamed Rice** — [Instant Pot 官方页](https://instantpot.com/blogs/recipes/quick-chicken-steamed-rice)。来源给出 6 人份、2 杯高汤、米/鸡肉/西兰花/胡萝卜、Pressure Cook 3 分钟和 NPR 10 分钟；页面总时长为 15–30 分钟范围，`time_contract` 保持空。来源提到鸡肉至少 165°F，但本项目未挂独立安全来源，`safety_endpoints` 保持空。
3. **Easy Chicken and Rice** — [Instant Pot 官方页](https://instantpot.com/blogs/recipes/easy-chicken-and-rice)。来源给出 4 人份、1 又 1/3 杯高汤、米和鸡肉分层、High Pressure 6 分钟，西兰花在压力阶段后加入；页面总时长为区间，故不伪造单一总时长。仅限 Instant Pot。
4. **Chicken Rice Soup** — [Instant Pot 官方页](https://instantpot.com/blogs/recipes/chicken-rice-soup)。来源给出 4 人份、半杯米、4 杯鸡汤、鸡肉/胡萝卜/西芹同锅、High Pressure 5 分钟及约 15 分钟升压；页面总时长为 30–60 分钟范围，`time_contract` 保持空。仅限 Instant Pot。
5. **Chicken Satay Rice** — [Instant Pot 官方页](https://instantpot.com/blogs/recipes/chicken-satay-rice)。来源给出 4 人份、25 分钟、番茄/鸡汤/花生酱/鸡肉/巴斯马蒂米/四季豆用量，以及鸡肉先 Sauté 后回锅的原锅流程；保留花生过敏标签和 Instant Pot 边界，不把厂商标题宣称为地域传统。
6. **Chicken Enchilada Rice** — [Instant Pot 官方页](https://instantpot.com/blogs/recipes/chicken-enchilada-rice)。来源给出 4 人份、60 分钟、米/鸡汤/鸡肉/黑豆/玉米/彩椒/辣酱/奶酪用量和 Sauté 后同锅米饭流程。仅证明 Instant Pot 厂商配方，不外推普通电饭煲或地域传统。
7. **Spanish Chicken and Rice** — [Instant Pot 官方页](https://instantpot.com/blogs/recipes/spanish-chicken-and-rice)。来源给出 6 人份、37 分钟、鸡腿/香肠/米/鸡汤/蔬菜用量及 Sauté 后压力流程；“Spanish”按厂商菜名记录，不升级为西班牙传统菜的独立证明。
8. **ข้าวไก่อบธัญพืช（Multigrain Baked Chicken Rice）** — [Philips HD4777/HD4775 官方 PDF](https://www.documents.philips.com/assets/20210504/2b225944d7cb481abeffad1e01377c70.pdf)。来源给出糙米、鸡肉、豆类和蔬菜用量、2.25 杯水、米/豆浸泡和 Brown 程序约 1 小时；家庭份数在可读来源中不稳定，`fixed_batch` 保持空。仅限 Philips HD4777/HD4775，不外推普通电饭煲。

## 证据与边界

- 8 条来源均来自 r123 已直接打开的官方厂商页面或 PDF，`access_status: opened`、`evidence_tier: 3`，并带页/行定位；本批不拼接不同版本或不同器具的事实。
- 结构化字段只写来源实际给出的事实。份数范围、总时长范围或无法稳定读取的份数不强行压成单值；缺失字段保持 `null`。
- 所有条目的 `region_codes` 为空、`cuisine_family` 为 `manufacturer-rice-cooker-recipes`，不把厂商配方宣称为中国、美国、西班牙、泰国或其他地域传统菜。
- 所有条目的 `cooker_adaptation` 均为 `source_limited`，明确 Instant Pot 或 Philips 型号边界；不把压力锅/特定电饭煲参数外推到普通电饭煲。
- 鸡肉安全端点没有本项目独立来源支持，`safety_endpoints` 全部保持空数组；来源中的熟透温度仅在 `evidence_notes` 作为边界记录，不伪装成已闭合安全合同。
- 本批没有任何条目进入 `executable`、`preview_ready` 或用户轮替承诺层，也没有厨房验证记录。

## TDD 与门禁

先新增 `tools/tests/source-backed-one-pot-batch-r124.test.mjs`，在 r118/867 基线下确认版本和 8 个 ID 缺失后再写入目录；实现后通过：

```text
node --test tools/tests/source-backed-one-pot-batch-r124.test.mjs
node tools/build-source-backed-one-pot-catalog.mjs --write
node tools/build-source-backed-one-pot-catalog.mjs --check
node tools/check-source-backed-one-pot-catalog.mjs
node tools/check-recipes.mjs
git diff --check
```

本批只更新来源目录、批次文档、专项测试和由目录确定性生成的 md/csv/gaps 产物；不改运行时代码、UI、Planner，不部署。
