# M0 产品路径与用户承诺基线

日期：2026-08-13

## 当前真实路径

- 首页默认是来源菜饭轮换路径：打开即展示来源执行卡，可进入 `/cook/?id=...` 或资料库记录；它不是 Planner 生成路径。
- `/source-recipes/` 是 923 条来源资料库，明确把来源事实、研究起步量、器具边界和安全阻断分开显示。
- `/recipes?id=...` 对正式 recipe id 走现有 Planner 菜谱页，对来源 recipe id fallback 到来源执行卡详情。
- `/cook/?id=...` 读取 `source-backed-execution-library.v1.json`，提供食材、液体、步骤、时长、勾选和本地恢复；它是研究执行卡 Cook Mode，不代表生产批准。
- Worker 的正式规划资产仍消费 Planner recipe library、recipe runtime、taxonomy、ratio、templates 和 action profiles；source execution library 主要用于来源卡健康与 Cook Mode。

## 四条路径合同

### 1. 给我一道

承诺：不要求用户提供完整食材清单，直接从正式 Runtime Recipe/已允许的来源 Preview 中给出一道真实菜。

当前状态：来源轮换已覆盖 923 条研究卡；正式 Planner 仍只有 72 道。页面文案必须显示来源层/正式层区别，不能把轮换卡说成生产菜谱。

### 2. 按我的食材做一锅

承诺：用户标记为 `must_include` 的食材不得静默丢弃。若没有满足安全、器具、比例、营养和菜谱身份的方案，应结构化拒绝或让用户改成可取舍路径。

当前风险：旧覆盖率匹配器仍有覆盖层级和候选排序逻辑；必须由 Request Ledger 记录每个输入的 recognized、must/prefer、planned、unused 和 refusal reason，不能用一个 coverage ratio 代替承诺判断。

### 3. 今天吃什么

承诺：允许合理取舍，但必须展示没用的食材和理由，并优先选择真实命名菜谱；不能为了“看起来覆盖高”拼接不存在的传统菜名。

当前状态：首页来源轮换和正式 Planner 是两条不同路径；后续需要把取舍结果、菜谱身份、来源和未使用食材字段统一到结果合同。

### 4. 清库存

承诺：需要库存数量、计划使用量和跨多顿连续状态；不能把一次“今天吃什么”误称为完整清库存计划。

当前状态：`index.html` 已有 `pantry`/清库存相关 UI 和 Planner V2 资产，但必须继续保持与直接推荐、必须使用路径分离，直到数量分配和多锅序列合同完成。

## M0 判定

- 当前项目已经修复来源资料库和 Cook Mode 的用户旅程，但四条产品承诺尚未由一个统一的 Request Ledger/Runtime Catalog 贯通。
- 923 条来源卡可以打开和试做，不等于 923 条正式 Planner 菜谱；72 道正式基础库也不等于所有来源卡都具备生产安全与厨房观察。
- 下一步必须先锁定输入承诺、未使用食材、拒绝原因、器具边界和来源状态的统一 schema，再做 Planner V3；禁止先扩展 Prompt 或批量改 status。
