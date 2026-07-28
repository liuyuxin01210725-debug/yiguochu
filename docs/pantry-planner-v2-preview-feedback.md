# Pantry Planner V2 本地实验反馈记录

> 2026-07-24 止损说明：Planner V2 的正式产品验证已暂停。公开页面不再暴露
> “帮我清库存”或调用 V2 规划接口；以下记录仅用于本地诊断，不能作为上线依据。

## 目的与边界

本阶段只验证一件事：**确定性 Planner 给出的方案，是否符合真实家庭做饭的直觉。**

本记录不用于证明算法已经正确，也不因为一次偏好反馈立即修改规则。当前阶段：

- 不新增 recipe；
- 不新增 template；
- 不修改 Planner 核心逻辑；
- 不把点击、停留或“看起来不错”当成真实做饭结果；
- 只记录真实输入、Planner 实际输出、用户原话和真实烹饪结果。

本地实验入口：双击 `start.command` 后打开
<http://localhost:8081/?planner_v2=1>。不得将该入口作为公开产品发给用户。

历史记录所用基线（2026-07-24）：`pantry-planner-v2` / `templates-v2-20260724` / `taxonomy-v1-20260724`。下方场景 A–D 的既有输出均属于这份历史快照，不应被改写成新版本的真实结果。

## Draft 目标基线（待 Preview 验证）

- Planner：`pantry-planner-v2`
- Template catalog：`templates-v2-20260728-r12`（11 个 active、5 个 planned）
- Ingredient taxonomy：`taxonomy-v1-20260728-r10`
- Ratio DSL：`ratio-rules-v1-20260728-r6`
- Evidence recipes：72 道（数量与批准状态均未改变）
- Planner V2 自动旅程门禁：138/138
- 直接推荐影子对照：30/30 无自动硬失败

这组数字只说明 Draft PR 的结构、契约与自动回归达到目标基线，**不等于真实家庭烹饪验证通过**。收敛修订 `direct-recommend-54a9830` 已部署 Preview；production 始终未动。本表中的真人第一反应、家庭烹饪习惯和实际成品结果仍须由真实用户填写，不能用自动测试替代。

## 直接推荐影子对照（2026-07-28，本地确定性）

固定 corpus：`tools/data/direct-recommend-shadow-v1.json`。运行：

```bash
node --test tools/tests/direct-recommend-shadow.test.mjs
node tools/run-direct-recommend-shadow.mjs
```

本地结果：

- 30/30 条均产生可审计结果；
- 自动硬失败 0；
- Planner 额外主要食材 0；
- 生熟/部位状态偷换 0；
- 安全不完整 0；
- 14 条标为 `review_required`，原因是旧 recipe selector 的表面覆盖依赖用户未提交的额外主要食材，或旧路径与新路径的承诺不可直接机械比较；这些条目必须保留人工判断，不得自动记为 V2 回归；
- `牛腩 + 熟米饭`、`牛肉末 + 面条` 当前明确返回 `no_valid_plan`，验收的是“不把特殊部位偷换成通用牛肉”，不是逼 Planner 凑出假方案；
- 本记录不包含 DeepSeek 调用、不包含真人浏览器体验，也不表示 Preview 或 Pilot 已放行。

Preview 部署后还必须运行：

```bash
node tools/run-direct-recommend-preview-gate.mjs \
  --url "$PREVIEW_URL" \
  --build-id "$BUILD_ID" \
  --samples 100
```

该门先核对 `/health` 构建号与 `plannerRollout: "direct-recommend"`，再预热 5 次、顺序测量 100 次 `/plan-meal`。发布硬门为：`bad_json=0`、非 JSON 响应 0、5xx/网络错误 0、P95 < 2000ms。通过仍不能替代 30 条真人 Chrome 手机视口点击门。

## Task 9 本地发布门记录（2026-07-28）

精确代码基线：

- HEAD：`3975262`
- 构建 ID：`direct-recommend-3975262`
- rollout：`direct-recommend`
- 工作区在构建前为 clean；`dist/build-meta.json` 与 HEAD 一致

已通过：

- 全部 Node 测试：1440/1440（`--test-concurrency=1`，避免压力测试与并发套件争抢 CPU 后产生计时假红）；
- `node tools/check-recipes.mjs`：通过，72 道 recipe、11 active + 5 planned templates；
- `node tools/run-pantry-planner-v2-journeys.mjs`：138/138；
- `node tools/run-direct-recommend-shadow.mjs`：30/30，自动硬失败 0，人工争议 14；
- `python3 -m py_compile ai_proxy.py`：通过；
- `node --test tools/tests/build-dist.test.mjs`：7/7；
- `tools/build-dist.mjs`：23 个发布文件，构建元数据一致。

模型越界硬拒绝的测试落点：

- `tools/tests/worker-generate-plan.test.mjs` 的 `pure validator rejects refs, substitutions, numeric overrides, action and safety drift`，子例 `changed beef cut`：拒绝把牛里脊改成牛腩；
- 同一组的 `added mushroom prose`，以及 `pure validator rejects chicken and mushroom substitutions plus an unused user item in prose`：拒绝新增香菇等未规划主料；
- `pure validator rejects shrimp that never reaches its seafood endpoint` 与既有 shrimp plan 契约测试：虾仁只能来自 locked plan 且必须达到海鲜熟制终点；
- `controlled generation prose is a closed grammar...` 的 `dish name adds cheese`：拒绝菜名加入未使用食材。

仍未通过、因此继续阻塞发放：

- DeepSeek 旧 key 撤销：由密钥持有人明确推迟到 production 上线前执行；它仍是 production 硬门，但不阻塞仅限内部验证的 Preview；
- 当前修订的 Preview 部署：未执行；
- 当前修订的线上 `/health`、`build-meta.json`、页面 `window.__YIGUOCHU_BUILD_META__` 三方核对：未执行；
- 当前修订的 Preview 100 次 `/plan-meal` 性能门：未执行；
- 30 条真人 Chrome 手机视口点击门：未执行，由独立复测者在 Preview 构建号核对后完成；
- 5 人 Pilot 链接：不得发送。

已知 Pilot 观察项（不在本轮修改）：用户输入“熟玉米”时，首轮 taxonomy 可能不识别或无法区分于生玉米。记录真实输入和页面结果，不提前扩 taxonomy。

## Preview 收敛复测（2026-07-28）

精确部署基线：

- 代码 commit：`54a9830`
- 构建 ID：`direct-recommend-54a9830`
- Preview：<https://recipe-validation.yiguochu.pages.dev>
- rollout：`direct-recommend`
- Template catalog：`templates-v2-20260728-r12`
- production：未部署、未提升
- DeepSeek key：密钥持有人明确推迟到 production 上线前轮换；不在本次 Preview 工作中读取或修改

部署前后确定性门：

- 全部 Node 测试：1449/1449；
- `node tools/check-recipes.mjs`：通过，72 道 recipe、21 个 family、11 active + 5 planned templates；
- `node tools/run-pantry-planner-v2-journeys.mjs`：138/138；
- `node tools/run-direct-recommend-shadow.mjs`：30 条旅程，自动硬失败 0、人工争议 14；
- `python3 -m py_compile ai_proxy.py` 与 `git diff --check`：通过；
- `/health`、`build-meta.json`、页面构建元数据三方均为 `direct-recommend-54a9830`；
- Preview `/plan-meal` 预热 5 次后顺序 100 次：P50 508.46ms、P95 1507.42ms、最大 2498.38ms；`bad_json=0`、非 JSON 0、5xx/网络错误 0。

多 Agent 真人手机视口点击复测：

1. `大米 + 虾仁 + 玉米 + 西红柿 + 白菜`
   - 候选约 0.7–1.8 秒出现；首卡使用 4/5，另外两卡各使用 3/5；
   - 大米与液体先焖至无硬芯，虾仁随后下锅并保留“完全熟透”安全终点；
   - 食用油单独入锅时显示“加热至油面微微流动”，不再误写“炒香”。
2. `大米 + 虾仁 + 洋葱`
   - 候选约 644ms；首卡覆盖 3/3，详细步骤约 3.99 秒；
   - 洋葱与油先炒香，大米先熟、虾仁后下，顺序符合本轮结构化契约。
3. `番茄 + 鸡蛋`，设置“鸡蛋过敏”
   - 候选约 1.6 秒；页面明确说明鸡蛋与忌口冲突，没有把安全停止伪装成通用失败。
4. `豆腐 + 青菜 + 金针菇`
   - 候选约 1.1 秒；三张方案均覆盖 3/3，详细步骤约 3.95 秒；
   - 空锅加水油盐时改为“倒入同一口锅并搅匀”，不再声称锅内已有食材。
5. 空食材点击
   - 停留输入页并提示先填写食材；点击前后 `/plan-meal` 请求数不变。
6. `番茄 + 大米` 的无替代方案路径
   - 真实点击首个唯一候选并生成详细做法；
   - 点击“换一换”后显示“当前组合只有一个可靠的一锅方案”；
   - 再点击“继续用当前方案”，原菜名、原食材克数、原步骤和操作按钮完整恢复，没有回到首页或重新请求生成。

本轮真人复测未发现新的阻断问题。仍需在 Pilot 观察、不能提前用内部测试代替判断：

- 多食材组的三张候选有时仍是同一 template 的食材子集变体，做饭方向差异偏弱；
- 受控菜名如“豆腐、青菜、金针菇一锅主餐”较机械，吸引力弱；
- “换一换”找不到等承诺方案时会诚实保留当前菜，但用户是否因此认为功能价值不足，需要真人原话；
- 本轮只证明页面流程、规划覆盖和步骤契约可执行，尚未证明真实下厨结果或第二天复用。

结论：恢复 5 人 Preview Pilot；继续保持 Draft PR、只开放“直接推荐”、冻结 Planner/recipe/template 新增。Pilot 是否通过仍按 `≥3/5` 第二天愿意再用且有真实做饭结果判断。

## 真人浏览器缺陷修订边界（2026-07-28，已完成新 Preview 复测）

前一版 `direct-recommend-723a106` 已在 Preview 通过 100 次 `/plan-meal`
性能门，但多路真人浏览器点击发现：候选卡可能只更换补充主食而伪装成不同菜；
生肉和慢熟根茎可能排在熟米饭或面条之后；豆腐步骤出现“整理水油”；
虾仁虽列入计划却没有明确下锅；基础油盐缺少确定用量；直接推荐仍出现无效
“分成两锅”路径；空输入承诺与结果不一致；生成结果缺少返回修改入口。

本轮修订边界：

- 不增加 recipe，不增加 template，不建设新推荐系统；
- 相同 `template_id + 用户食材集合` 的候选只展示一次，不凑满三张卡；
- cooking order 必须由结构化 template phase 决定，Ratio DSL 明确锁定水、油、盐；
- 直接推荐没有替代计划时只保留修改食材路径，不能借未上线多锅能力兜底；
- 空输入不请求接口；生成结果保留修改食材忌口入口；
- 只有全量自动门、Preview 构建三方核对、性能门和真人手机浏览器复测全部通过后，才恢复 5 人 Pilot。

## 测试方法

1. 优先邀请平时真实参与家庭做饭的人。
2. 测试前只说：“请用家里现有食材试一下这个做饭工具。”不要解释 template、覆盖率或 Planner。
3. 让用户自己选择“直接推荐”或“帮我清库存”，自己输入食材。
4. 页面出现结果后，先记录用户脱口而出的第一句话，再追问原因；不要先提示“你觉得分锅合理吗”。
5. “符合家庭习惯”与“实际做过且成功”分开记录。未下厨只能记为意愿，不能记为烹饪成功。
6. 每次测试保留 Planner 原始状态、每锅食材、补充项、未安排项和页面操作，不用总结替代事实。

## 单次测试记录

复制本节，为每次真人测试单独填写一份。

### 基本信息

- 测试编号：
- 日期：
- 测试者代号：
- 平时做饭频率：□ 经常　□ 偶尔　□ 很少
- 本次设备：□ 手机　□ 平板　□ 电脑
- mode：□ 直接推荐　□ 帮我清库存
- intent：□ 普通　□ 快手　□ 清爽　□ 批量
- 份数：

### 1. 真人测试输入

- 用户原始输入（保持原词和部位）：
- 忌口：
- 用户当时真正想解决的问题：

### 2. Planner 实际输出

- Planner 版本：
- Template catalog 版本：
- 状态：□ ready　□ complete　□ needs_user_decision　□ partial_accepted　□ no_alternative_plan　□ no_valid_plan
- 覆盖率：
- 识别率：
- 一锅 / 多锅：

第一锅：

- template_id：
- 使用用户食材：
- 需要补充：
- 未安排：
- 时间：

第二锅（如有）：

- template_id：
- 使用用户食材：
- 需要补充：
- 未安排：
- 时间：

页面给出的解释与操作：

- rejection_reason / unplanned reason：
- 可选动作：
- 用户是否看到了关键解释：□ 是　□ 否　□ 不确定

### 3. 用户第一反应

请记录原话，不要改写：

>

用户随后追问或犹豫的地方：

### 4. 是否符合家庭烹饪习惯

- 组合直觉：□ 符合　□ 部分符合　□ 不符合
- 分锅数量：□ 合理　□ 可以接受但麻烦　□ 不合理
- 烹饪顺序：□ 符合　□ 有疑问　□ 不符合
- 补充食材：□ 家庭常备且合理　□ 勉强接受　□ 不合理
- 用户愿不愿意照做：□ 愿意　□ 可能　□ 不愿意
- 是否实际做了：□ 是　□ 否
- 若实际做了，结果：□ 成功　□ 勉强可吃　□ 失败
- 具体原因或实际结果：

### 5. 是否需要调整

先判断问题属于哪一层；可以多选，但必须写证据。

- □ 无需调整
- □ `template compatibility`：家庭中自然同锅的食材被模板判为不能同锅，或不应同锅的食材被放在一起。
- □ `affinity score`：存在多个有效计划，但排序把不自然的组合排在前面。
- □ `slot preference`：食材可进入多个槽位，但被分配到不符合家庭直觉的槽位。
- □ `UI 解释`：计划本身合理，但用户看不懂为什么分锅、为什么未安排或为什么暂停生成。
- □ 暂时无法归类，需要更多样本。

证据（用户原话、实际做饭结果或可复现页面事实）：

建议只记录，不在本阶段直接实施：

### 本次结论

- □ 直觉一致
- □ 计划可用，但需要更清楚解释
- □ 结构不自然，需要积累同类反馈
- □ 存在安全或无法完成的问题，应暂停相关场景

## 四个重点观察场景

下面的“当前 Planner 基线”来自 2026-07-24 的 `/plan-meal` 实际响应，**不是用户反馈**。用户反应和判断必须在测试后填写。

### 场景 A：鸡蛋 + 老豆腐

2026-07-24 历史 Planner 基线：

- 状态：`complete`，覆盖率 `1`；
- 第一锅：`broth-noodle-pot`，使用鸡蛋，补面条、水、盐；
- 第二锅：`broth-noodle-pot`，使用老豆腐，补面条、水、盐。

先记录无提示的第一反应，再观察：

- 用户是否认为鸡蛋与豆腐应该优先同锅；
- 用户是否接受为了完整覆盖而做两份面条；
- 若不接受，问题更像 compatibility、affinity、slot preference，还是仅需解释。

反馈：

- 用户第一反应：
- 家庭习惯判断：
- 调整分类：
- 证据：

### 场景 B：猪里脊 + 面条

2026-07-24 历史 Planner 基线：

- 状态：`complete`，覆盖率 `1`；
- 第一锅：`broth-noodle-pot`，使用面条，补水、盐；
- 第二锅：`cooked-rice-stir-pot`，使用猪里脊，补熟米饭、食用油、盐。

先记录无提示的第一反应，再观察：

- 用户是否自然想到猪里脊面；
- 用户是否认为第二锅补熟米饭明显增加负担；
- 用户拒绝的原因是组合不自然，还是不愿意做两顿主餐。

反馈：

- 用户第一反应：
- 家庭习惯判断：
- 调整分类：
- 证据：

### 场景 C：番茄 + 金针菇 + 鸡蛋 + 西兰花

2026-07-24 历史 Planner 基线：

- 状态：`complete`，覆盖率 `1`；
- 单锅：`acid-staple-pot`；
- 使用番茄、金针菇、鸡蛋、西兰花，补大米和水。

当前基线并未分锅。如果真人页面出现分锅，应先记录 Planner/template 版本并按版本漂移排查，不能直接归因于用户偏好。

先记录无提示的第一反应，再观察：

- 用户能否理解四种食材为什么可以进入同一锅；
- 用户是否接受系统主动补大米；
- 若用户更希望分锅，是口味直觉、操作习惯，还是页面解释不足。

反馈：

- 用户第一反应：
- 家庭习惯判断：
- 调整分类：
- 证据：

### 场景 D：`needs_user_decision` 页面

使用测试者真实拥有、但系统无法完整安排的食材触发；不要为了测试凭空编造食材。进入页面后，不先解释状态含义。

重点观察：

- 用户第一眼认为这是“系统失败”，还是“系统在保护口味和可执行性”；
- 用户是否理解哪些食材已经安排、哪些没有安排及具体原因；
- 用户是否理解“放宽一种食材”“调整食材”“接受部分规划”的差别；
- 用户是否知道下一步该点哪个按钮；
- “保护质量”的解释是否足够，还是让用户感到被拒绝。

反馈：

- 触发输入：
- Planner 已规划的锅：
- unplanned 与 reason_code：
- 页面可选动作：
- 用户第一反应：
- 用户实际选择：
- 是否理解系统意图：□ 是　□ 部分理解　□ 否
- 调整分类：
- 证据：

## 汇总与决策规则

### 样本汇总

- 参与家庭数：
- 完成测试次数：
- 实际下厨次数：
- 直觉一致：
- 可用但需解释：
- 结构不自然：
- 安全或无法完成：

发现分类计数：

- template compatibility：
- affinity score：
- slot preference：
- UI 解释：
- 暂无法归类：

### 何时进入调整讨论

- 单个“我不喜欢”只作为线索，不直接改规则。
- 同一模式被至少 3 个独立家庭重复指出，进入规则评审。
- 至少 2 次真实下厨证明方案难以完成或成品明显不合理，优先评审。
- 任何明确安全问题，一次即可暂停相关场景并单独处理。
- 如果计划被多数人认可，但用户看不懂原因，优先归为 UI 解释，不先改 Planner。
- 调整前必须回看原始输入、Planner 输出和用户原话，不能只看汇总数字。

### 本轮本地实验结论

- 是否达到“符合家庭直觉”的验证目标：□ 是　□ 部分达到　□ 否　□ 样本不足
- 是否建议调整 template compatibility：□ 是　□ 否　□ 待更多样本
- 是否建议调整 affinity score：□ 是　□ 否　□ 待更多样本
- 是否建议调整 slot preference：□ 是　□ 否　□ 待更多样本
- 是否建议调整 UI 解释：□ 是　□ 否　□ 待更多样本
- 是否建议 Draft PR 转 Ready：□ 是　□ 否
- 决策依据：