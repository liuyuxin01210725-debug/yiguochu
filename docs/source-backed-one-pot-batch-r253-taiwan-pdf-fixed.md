# r253 台湾农业部 PDF 同源字段闭合

日期：2026-08-10
目录快照：`source-backed-one-pot-v1-20260808-global-r252`（923 条）→ `source-backed-one-pot-v1-20260808-global-r253`（923 条）

## 范围

本批不新增 canonical、不改变 executable 数量；只把同一份台湾农业部食農教育資源整合平台官方 PDF（`https://fae.moa.gov.tw/files/topics/1881/A02_1.pdf`）已经明确写出的份数、配料量、液体和流程写回 4 条既有 `discovered` 记录，并将其提升为 `recipe_fact_checked`。所有事实仍挂在各自 `S-R100-*` source 上，未跨菜拼接。

## 闭合记录

| recipe_id | 同源可证明字段 | 保留的边界 |
|---|---|---|
| `r100-taiwan-red-quinoa-lotus-leaf-rice` | 5 人份；熟重台湾藜 20g、糯米 120g、广式腊肠 50g、虾米 45g、干香菇 0.5g、荷叶 2 张等；先煮藜米，再炒腊味配料，拌合后荷叶包裹并蒸 10 分钟（PDF pp.174–175）。 | 熟重不可换算生重；蒸笼、炒锅、荷叶流程不外推电饭煲；甲壳类安全仍未闭合。 |
| `r100-taiwan-quinoa-oil-rice` | 4 人份；长糯米 300g、台湾藜 25g、梅花肉 150g、猪油 40g、虾米 8g、干香菇 8g、鱿鱼 15g；另有 60ml 水、米酒/酱油/冰糖量；浸泡蒸 15–20 分钟后炒料拌合（PDF pp.178–179）。 | 蒸锅+炒锅多阶段；猪肉、鱿鱼端点仍未挂安全证据；不改写为单锅电饭煲。 |
| `r100-taiwan-momordica-vegetable-risotto` | 5 人份；台梗九号米 250g、木鳖果 100g、各类蔬菜 100g、素鸡 150g、蒜 20g；木鳖果汁约 600ml；配料先炒取出，米分三次下汁收浓后拌回（PDF pp.204–206）。 | “约 600ml”不是无损固定液体合同；木鳖果处理、炉上分阶段与炒锅边界保留；不晋升 executable。 |
| `r100-taiwan-grain-health-congee` | 5 人份；糙米、薏苡仁各 50g，台湾藜/红豆/紫米各 25g，莲子/红枣各 50g，桂圆干 120g，红糖 200g，水 2000ml；浸泡约 4 小时后煮约 30 分钟，莲子红枣另蒸再混合（PDF pp.188–189）。 | 甜粥、锅+蒸锅多阶段；不进入咸味主餐轮替，仍非 executable。 |

## 验证

- TDD：`tools/tests/source-backed-one-pot-batch-r253-taiwan-pdf-fixed.test.mjs` 先在 r252 基线失败，再在 r253 2/2 通过。
- 目录 923 条；状态变为 `executable=36`、`recipe_fact_checked=775`、`identity_verified=99`、`discovered=13`。
- `build-source-backed-one-pot-catalog --write/--check`、`check-source-backed-one-pot-catalog`、`check-recipes`、source-backed 测试和 `git diff --check` 均通过。

本批是证据字段闭合，不代表这 4 条可直接作为普通电饭煲 executable 菜谱，也不代表 923 条全部已经拥有来源未提供的时间、液体或安全字段。
