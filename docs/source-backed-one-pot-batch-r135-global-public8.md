# r135 全球公共机构一锅米饭批次

**目录版本**：`source-backed-one-pot-v1-20260808-global-r135`
**基线**：`source-backed-one-pot-v1-20260808-global-r133`（906 条）
**本批新增**：5 条（总计 911 条）
**状态**：5 条均为 `recipe_fact_checked`；0 条 `executable`；未修改运行时代码、Planner、前端或 UI，未部署。
**证据范围**：全部来源已直接打开，保留原页面/文档的器具、阶段和时间边界；未把普通锅、煎锅或 PDF 中的流程推导成电饭煲流程。

## 入库条目

| recipe_id | 具名菜 | 来源与器具 | 结构化事实 | 明确保留的缺口 |
|---|---|---|---|---|
| `cleveland-clinic-chicken-brown-rice-casserole` | One-Pot Chicken and Brown Rice Casserole | Cleveland Clinic；带盖普通汤锅 | 2 份；未煮糙米 1/2 cup、鸡腿 8 oz、蔬菜高汤 2 cups；先同锅煮沸，低火约 35 分钟，四季豆后段焖 8–10 分钟 | 额外补液是“如需要”而非固定量；没有禽肉数值安全终点；不外推电饭煲 |
| `bmc-chicken-carrots-brown-rice` | One-Pot Chicken, Carrots, and Rice | Boston Medical Center Teaching Kitchen；带盖普通煎锅 | 来源产量为 4–6 人，另有 5 servings 营养区；鸡腿 1 lb、干糙米 1 cup、肉汤 4 cups；蔬菜/鸡肉先炒，米和汤盖锅约 30 分钟，总时长 60 分钟 | `fixed_batch` 保持 `null`，不把 4–6 伪造成一个确切产量；没有禽肉数值安全终点；沙拉不并入主餐；不外推电饭煲 |
| `kidney-care-chicken-tikka-pulao` | Chicken tikka pulao | Kidney Care UK Kidney Kitchen；普通带盖锅 | 4 份；巴斯马蒂米 300 g、鸡胸 375–400 g、低盐鸡汤 850 ml、豌豆 200 g、四季豆 200 g；香料先炒，后加米/汤，低火约 30 分钟；来源烹调时间 40 分钟、准备 5 分钟 | 没有禽肉数值安全终点；肾病营养背景不外推为普遍健康结论；不外推电饭煲 |
| `firststeps-turkey-vegetable-pilaf` | Turkey and vegetable pilaf | First Steps Nutrition Trust；普通带盖锅 | 4 个成人份；火鸡胸 200 g、白米 200 g、水 400 ml、甜玉米 150 g、青椒/番茄；火鸡先煎，加入蔬菜和米后加水，盖锅小火约 15 分钟 | 15 分钟仅是来源焖煮时长，不推算准备/总时长；没有火鸡安全数值终点；来源的替换提示未转成自动 substitution；不外推电饭煲 |
| `firststeps-vegetable-biryani` | Vegetable biryani | First Steps Nutrition Trust；普通带盖锅 | 4 个成人份；白米 200 g、水 400 ml、鹰嘴豆沥干 240 g、豌豆 100 g、花椰菜/胡萝卜/土豆；先炒香料和蔬菜，加米和水，盖锅小火约 20 分钟 | 20 分钟仅是来源焖煮时长，不推算准备/总时长；没有独立安全端点；不外推电饭煲 |

## 版本与边界说明

1. BMC 页面同时出现“4–6 people servings”和营养区“5 servings”。本批不擅自选择一个精确产量，故 `fixed_batch` 为 `null`；4 杯肉汤、流程和 60 分钟仍按来源记录。
2. Cleveland Clinic 的四季豆是后段投入，不能被渲染为所有配料从一开始同时入锅；其额外补液只保留在 `evidence_notes`。
3. Kidney Care UK 的 40 分钟是页面列出的烹调时间，30 分钟是方法段低火时长，准备时间另列；没有从这些数字推导电饭煲程序。
4. First Steps PDF 的 15/20 分钟是方法段的盖锅焖煮时长，不是未经来源证明的总耗时；火鸡、罐装鹰嘴豆和生米状态分别保留。
5. 五条均保留普通锅/煎锅/汤锅的 `source_limited` 器具状态，未加入 `safety_endpoints`，因此仍停在 `recipe_fact_checked`。来源门禁和后续人工签署仍需单独执行。

## 排除项

- EatRight 新奥尔良红豆饭：与目录已有 Zojirushi New Orleans 家族 canonical 重叠，保留在 intake 供 canonical review，不新增。
- University of Michigan One Pot Beans and Rice：原页明确标为 side dish，继续保留 intake，不冒充完整主餐。
- Incredible Egg Rice & Bean Baked Eggs：以熟米和烤箱为前提，属于 `cooked_rice_second_cook`，不进入当前生米一锅主餐批次。
- UCI、Dartmouth、Illinois Jambalaya 等有取出/回锅或烤箱阶段的候选仍在 intake，未为了凑数量改写成 direct one-pot。

## 验证记录

- `tools/tests/source-backed-one-pot-batch-r135-global-public8.test.mjs`：先写失败断言，再在目录写入后通过。
- 本批专项测试覆盖版本/数量、五条来源 URL、状态、份数、液体、顺序、时间和器具边界，并断言排除项未被误入。
- 后续应运行 `build-source-backed-one-pot-catalog.mjs` 重建生成物、`catalog --check`、`check-recipes.mjs` 和 `git diff --check`；本批不改变任何运行时路径。
