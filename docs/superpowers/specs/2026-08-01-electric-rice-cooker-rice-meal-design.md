# 一锅出：家庭电饭煲菜饭聚焦版设计

日期：2026-08-01

状态：用户已确认；进入 TDD 实现阶段

适用范围：Draft PR #1 与 `recipe-validation` Preview；本规格不授权合并 PR 或部署 production

配套研究：[中国一锅菜饭地域原型与产品准入研究](../../rice-meal-regional-research.md)

## 1. 决策摘要

一锅出当前最大的问题不是缺少更多通用品类，而是产品边界过宽：同一条路径同时处理面、粥、汤饭、熟饭翻炒、炖锅、泛化模板、地域菜和清库存规划，导致菜名机械、食材覆盖虚假、步骤难以验证，用户无法理解产品究竟解决什么问题。

本轮把产品收敛成一个垂直工具：

> 用户选择家里现有的配菜，系统从真实菜饭家族和经过验证的家常菜饭中，推荐一份以米为基础、营养结构不过度单一、适合普通家庭电饭煲完成的一锅主餐。

产品只做一条主路径：

```text
几人吃 + 现有配菜 + 忌口
→ 真实菜饭匹配
→ 营养结构与食材覆盖排序
→ 1–3 个可靠候选
→ 确定性菜谱步骤
```

不再通过增加面条、汤、粥、咖喱锅、熟饭处理方式或自由模板来制造“丰富度”。丰富度来自真实菜饭家族、受控变体和高频家常菜饭的密度。

## 2. 产品第一性原理

### 2.1 核心价值

产品同时优化四件事，优先级固定为：

1. 食品安全与忌口正确；
2. 味道、质地和做法成立；
3. 尽量使用用户选择的食材；
4. 尽可能让一锅包含碳水、蛋白质和膳食纤维来源。

食材覆盖不能越过安全和味道；营养结构也不能靠强行塞入不合适的食材实现。

### 2.2 “简单”的定义

简单不是删掉事实，而是让复杂度只存在于后台：

- 用户不需要选择 recommend/pantry、normal/quick/fresh/batch；
- 用户不需要选择米，产品默认家里有普通大米；
- 用户只填写份数、配菜和忌口；
- 页面不展示工程术语、模板名或内部评分；
- 候选不足时不凑三张；
- 没有可靠方案时不让模型临场编一道。

### 2.3 当前非目标

本轮不做：面条、粥、汤饭、熟饭炒烩、无米炖锅、多锅清库存、账号、用户画像、营养追踪、云端行为画像、自由 LLM 组合、多 Agent 产品能力、国外菜饭扩展和 production 部署。

## 3. 菜饭边界

一个条目只有同时满足以下条件，才能进入当前产品路径：

1. 米是成品主食主体；
2. 至少一种主要配菜与米进入同一成饭流程；
3. 成品是一顿饭，不是甜点、粥、汤、盖饭或饭后组装食品；
4. 普通家庭可以用电饭煲完成核心成饭阶段；
5. 传统器具特征不能保留时，名称诚实标为“风味电饭煲版”或“家庭版”；
6. 营养结构至少为 B；C 级只能进入传统原型库。

传统原型的器具不要求是电饭煲。新疆抓饭、云南罗锅饭、川渝孔饭、煲仔饭均可收集；产品层再判断能否直接适配、流程适配、风味适配或暂不适配。

## 4. 营养结构契约

### 4.1 三档分级

| 等级 | 结构 | 候选规则 |
| --- | --- | --- |
| A | 碳水 + 蛋白质 + 膳食纤维来源 | 同等覆盖时优先 |
| B | 碳水 + 蛋白质，或碳水 + 膳食纤维来源 | 正常可用，但页面不称为“营养完整” |
| C | 只有一种主要营养角色 | 不作为正常候选 |

蛋白质可以来自肉、禽、鱼虾、蛋、豆腐或豆类。豆类可以同时贡献蛋白质和纤维，但必须在该菜谱中是有实际分量的主料。油、酱油、葱花、香辛料、色粉和点缀量配菜不计入营养角色。

### 4.2 机器判定不使用通用医学阈值

第一版不发明“每餐必须多少克”的临床标准。每个标准化菜谱明确声明：

- 哪些主料承担 `carbohydrate`、`protein`、`fiber`；
- 该贡献是 `material` 还是 `garnish`；
- 实际份量来自哪条 Ratio DSL；
- 评审者为何认定该角色成立。

validator 只允许 `material` 主料满足 A/B 结构。未来若建立统一克数阈值，需要单独来源和规格，不在本轮偷偷引入。

### 4.3 极端输入

如果用户只选择土豆、红薯、玉米等主食角色，系统返回 `needs_balance_input`，不把米 + 土豆包装成营养完整主餐。页面让用户明确选择家里是否还有鸡蛋、豆腐、豆类、肉或蔬菜；只有用户确认后，这些食材才进入新请求。

用户坚持不增加食材时，可以查看诚实的基础 B 级方案；如果仍只有 C 级，则不生成正常菜饭。

## 5. 两层菜谱库

### 5.1 传统原型库

保存真实菜名、地域、别名、传统器具、核心食材、常见变体、关键工艺和身份来源。`research_only` 条目可以是 C 级，也可以暂不适配电饭煲。

### 5.2 产品运行目录

只包含已经完成身份、食材、比例、流程、安全和营养角色审核的家庭电饭煲版本。运行目录不是另一组自由 template；它是机器可验证的菜饭家族和受控变体。

当前地域框架与优先级以配套研究文档为准。第一阶段中国优先，海外原型保留在旧库但不参与候选。

## 6. 机器数据结构

新增单一运行时权威源 `tools/data/rice-meal-catalog.v1.json`。现有 `recipe-library.json` 继续作为历史 recipe、来源和安全资料库，但不再直接决定用户候选。

建议 schema：

```json
{
  "schema_version": 1,
  "catalog_version": "rice-meal-catalog-v1-20260801-r1",
  "families": [
    {
      "family_id": "jiangnan-vegetable-rice",
      "family_name": "江南菜饭",
      "region_codes": ["CN-SH", "CN-JS", "CN-ZJ"],
      "traditional_vessels": ["土灶铁锅"],
      "identity_refs": [],
      "variants": [
        {
          "variant_id": "shanghai-salted-pork-vegetable-rice",
          "display_name": "上海奉贤咸肉菜饭",
          "identity_level": "canonical",
          "status": "planned",
          "rice": {
            "canonical_id": "raw-rice",
            "state": "raw",
            "amount_rule_id": "white-rice-per-serving-v1"
          },
          "ingredients": [
            {
              "canonical_id": "salted-pork-belly",
              "required": true,
              "nutrition_roles": ["protein"],
              "role_weight": "material",
              "amount_rule_id": "salted-pork-per-serving-v1",
              "stage": "preprocess"
            }
          ],
          "approved_substitutions": [],
          "forbidden_combinations": [],
          "nutrition_structure": {
            "grade": "A",
            "carbohydrate_ids": ["raw-rice"],
            "protein_ids": ["salted-pork-belly"],
            "fiber_ids": ["small-bok-choy"],
            "review_note": "咸肉承担蛋白质角色，小白菜承担纤维角色，二者均为每份有实际克数的主料。"
          },
          "cooker_adaptation": {
            "level": "process_adaptation",
            "compatibility": "universal_closed_cycle",
            "pre_actions": [],
            "start_actions": [],
            "finish_actions": [],
            "program": "normal_rice",
            "active_time_minutes": 10,
            "total_time_minutes": 40
          },
          "ratio_rule_ids": [],
          "safety_endpoints": [],
          "source_refs": [],
          "household_trial": null
        }
      ]
    }
  ]
}
```

### 6.1 状态

每个 variant 使用以下状态：

- `research_only`：只证明菜名或文化身份；
- `fact_checked`：身份和核心食材已核实；
- `planned`：已完成结构化电饭煲标准化；
- `preview_ready`：validator、自动旅程和人工内容审核通过；
- `pilot_observed`：已有真实家庭试做记录；
- `production_approved`：只有用户明确批准后才能进入 production。

状态不得因自动门通过而静默晋升。

### 6.2 来源分离

- `identity_refs` 证明真实名称、地域和传统结构；
- `technique_refs` 证明关键工艺；
- `appliance_refs` 证明电饭煲可执行边界；
- `source_refs` 继续遵守现有 approved/auto_approved 与许可红线；
- 项目不复制第三方步骤或图片，标准化步骤为项目自己的受控表达。

## 7. 电饭煲适配契约

### 7.1 适配等级

- `direct_adaptation`：食材可直接按受控比例进入煮饭程序；
- `process_adaptation`：需要外锅预炒、焯水或肉类预处理；
- `style_adaptation`：传统器具核心效果无法保留，只提供诚实的风味家庭版；
- `not_suitable`：不进入当前产品。

### 7.2 第一版通用设备规则

用户不需要选择电饭煲型号。为了适配普通与压力式机型：

- 所有预炒、焯水和肉类预处理在外锅完成；
- 电饭煲只运行一次正常密闭煮饭周期；
- 运行中不要求开盖；
- 程序完成后可以开盖翻拌或加入已经安全熟制的配料；
- 需要中途开盖、锅巴火候或二次蒸制定型的原型，只能降级或暂不产品化。

## 8. 用户请求与响应

### 8.1 请求

沿用 `/plan-meal` 和 `/generate-plan`，但新路径使用 `schema_version: 3` 与 `product_focus: "rice_meal"`。

```json
{
  "schema_version": 3,
  "product_focus": "rice_meal",
  "servings": 2,
  "pantry": ["鸡腿", "香菇", "青菜", "土豆"],
  "dislikes": []
}
```

米、水、基础油盐不计入用户 pantry 覆盖。用户选择的所有主要食材都是 `prefer_use`，不承诺清空库存。

### 8.2 候选响应

```json
{
  "schema_version": 3,
  "catalog_version": "rice-meal-catalog-v1-20260801-r1",
  "status": "ready",
  "candidates": [
    {
      "plan_id": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      "family_id": "household-chicken-vegetable-rice",
      "variant_id": "mushroom-chicken-vegetable-rice",
      "display_name": "香菇鸡腿菜饭",
      "name_label": "家常电饭煲菜饭",
      "used_items": [],
      "unused_items": [],
      "coverage_count": 3,
      "submitted_count": 4,
      "coverage_ratio": 0.75,
      "nutrition_grade": "A",
      "nutrition_roles": {},
      "required_basic_items": [],
      "cooker_adaptation_level": "direct_adaptation",
      "active_time_minutes": 8,
      "total_time_minutes": 40
    }
  ]
}
```

`plan_id` 由 catalog version、variant、份数、规范化食材、受控 substitutions、比例规则和执行动作生成规范化 hash；不包含展示文案。

## 9. 候选生成与排序

### 9.1 三种路线的取舍

- 只做固定菜谱精确匹配：真实，但长尾覆盖太弱；
- 让模型自由组合：覆盖高，但不可控；
- 选定方案：真实菜饭家族 + 显式受控变体 + 已审核家常菜饭。

模型不决定菜名、食材、替换、比例、流程或安全。

### 9.2 硬门

候选依次经过：

1. 食材身份、部位、生熟和重复项归一化；
2. 忌口与过敏排除；
3. 真实 variant 或明确 substitution 匹配；
4. 普通电饭煲适配；
5. A/B 营养结构；
6. 食材覆盖质量门；
7. Ratio DSL、容量与熟制安全。

任一硬门失败即淘汰，不能靠菜名或地域身份获得豁免。

### 9.3 覆盖规则

对用户去重后的主要食材数 `N`：

| N | 正常目标 | 最低正常候选 |
| ---: | --- | --- |
| 1 | 1/1 | 1/1，同时菜谱整体仍须达到 A 或 B |
| 2 | 优先 2/2 | 1/2 只能进入诚实逃生页，不作为普通卡 |
| 3 | 优先 3/3 | 2/3 |
| 4–6 | 优先约 60% 以上 | 不允许只用一种；低于目标时必须说明未用原因 |
| 7 以上 | 选择最合理的 4–5 种 | 不承诺一锅清空全部 |

这些门槛不授权强行拼锅。无法合理组合时返回最优可得解释或 `no_reliable_rice_meal`。

### 9.4 排序

所有硬门通过后按稳定 tuple 排序：

1. 使用的用户食材数量更多；
2. 同覆盖时 A 优于 B；
3. canonical 或审核家常 recipe 优于风味 adaptation；
4. 不需要额外主要食材；
5. `direct_adaptation` 优于需要预处理的版本；
6. 主动操作时间更短；
7. 当前会话最近展示项软降权；
8. 稳定 ID。

因此 B 级 4/5 可以排在 A 级 2/5 之前；营养偏好不能掩盖用户食材基本没有被使用。

### 9.5 候选差异

最多展示三张，但不凑数。不同候选必须至少改变：

- 菜饭家族；
- 受控食材集合；
- 蛋白质变体；
- 电饭煲流程负担；
- 真实地域或家常味型。

不能只换菜名或形容词。

## 10. 换一换

换一换只重新运行确定性 selector，调用 DeepSeek 次数为 0。

- 当前 plan 本次硬排除；
- 更早历史只做软降权；
- 新方案必须通过同样的安全、营养和覆盖门；
- 没有第二套同等质量方案时返回 `no_alternative_rice_meal`；
- 前端保留当前菜并说明“这组食材目前只有这一道可靠菜饭”；
- 不退回旧三卡页面，不显示通用生成失败，不提供无法兑现的“剩下食材再来一锅”。

## 11. 确定性成品

`/generate-plan` 根据签名 plan token 在服务端重算并锁定：

- variant 与名称；
- 使用与未使用食材；
- 每项克数；
- 米水和液体比例；
- 预处理、入锅和完成后动作；
- 安全终点；
- 营养查表输入。

成品步骤来自每个 variant 的人工受控 action 文案，不能由全局模板拼成“机器饭”，也不调用 DeepSeek。服务端继续校验菜名、食材、克数、动作顺序和安全终点零漂移。

## 12. 前端体验

### 12.1 首屏

只保留：

- 几人吃；
- 家里有哪些配菜；
- 忌口；
- 主按钮“推荐菜饭”。

页面用一句话说明：“家里默认有米，选你想用的配菜。”

### 12.2 候选卡

每张卡只展示用户需要判断的信息：

```text
上海奉贤咸肉菜饭 · 家庭电饭煲版
用上：青菜、咸肉、香菇（3/4）
这次未用：土豆
主食 ✓  蛋白质 ✓  蔬菜纤维 ✓
需要预炒 · 主动操作约 10 分钟 · 总计约 40 分钟
```

未用原因必须具体：忌口冲突、该家族不使用、出水影响米水比、熟制时间不匹配或暂未识别。禁止统一写“搭配不够稳妥”。

### 12.3 状态页

- `needs_balance_input`：主要是主食类，请用户明确选择可用蛋白或蔬菜；
- `no_reliable_rice_meal`：没有可靠组合，保留输入并允许修改；
- `no_alternative_rice_meal`：保留当前菜；
- `unsafe_recipe`：说明具体忌口或熟制原因；
- `stale_plan`：catalog 更新，重新规划，不执行旧计划。

## 13. 技术架构取舍

### 13.1 保留

- 食材 taxonomy、别名、生熟、部位和形态语义；
- 忌口/过敏与熟制安全；
- 台湾食药署营养库、本地 FOODS 和估算标记；
- Ratio DSL；
- 来源、身份与生产方法证据分离；
- 签名 plan token、确定性合同、构建和部署门禁；
- 当前 named recipe matcher/compiler 中可复用的身份和零漂移思想。

### 13.2 退出公开主路径

- `planner-v2.js` 的自由 template 组合；
- 面、粥、汤、熟饭炒烩和无米炖锅 templates；
- 机械模板名和自由食材拼接名；
- mode/intent、多锅和清库存状态机；
- legacy LLM selector；
- `recipe-runtime.v1.json` 中的焖面和未完成 runtime 条目。

### 13.3 迁移策略

不立刻删除旧代码。先用构建标志 `productFocus: "rice-meal-v1"` 在 Preview 建立独立垂直路径；确认浏览器旅程和数据一致后，旧 planner 与旧 UI 从发布包移除，但可保留在 git 历史。不能长期把两个产品都打进同一 bundle。

## 14. 实施阶段

1. 建立 `rice-meal-catalog.v1.json` schema 与 validator；
2. 把研究目录中的第一批高证据条目标准化，未完成者保持 `planned`；
3. 为每个 Preview 条目补齐 Ratio DSL、动作、用量、营养角色和安全终点；
4. 实现纯函数 selector，并以当前输入 corpus 做影子对照；
5. 接入 `/plan-meal` 和 `/generate-plan` schema v3；
6. 收缩前端首屏、候选卡与状态页；
7. 构建 Preview，运行真实 Chrome 手机旅程；
8. 用户亲自测试后，再决定是否扩第二批和是否进入 production。

每一阶段先写失败测试，再实现。生产环境继续冻结。

## 15. 测试与发布门

### 15.1 数据门

- 所有 `preview_ready` 条目必须是 A 或 B；
- 所有 A 级必须有 material carb/protein/fiber contributor；
- 所有 display name 必须是 canonical、批准 variant 或自然家常名；
- 所有地域名必须有直接 identity ref；
- 所有比例为机器 Ratio DSL，不从自然语言计算；
- 所有主要食材都能在步骤中到达，并具有安全终点；
- C 级、野生菌和中途开盖依赖条目不得进入默认目录。

### 15.2 纯函数旅程

至少覆盖：

1. 青菜 + 咸肉 → 上海/江南菜饭；
2. 羊肉 + 胡萝卜 + 洋葱 → 新疆抓饭；
3. 土豆单独输入 → `needs_balance_input`；
4. 土豆 + 鸡腿 → B 级可用，不谎称三类齐全；
5. 土豆 + 鸡腿 + 青菜 → A 级优先；
6. 豆腐 + 白菜 → A 级家常菜饭；
7. 豆腐 + 香菇 + 青菜 → 全部使用；
8. 牛里脊 + 西兰花 → 通用牛肉菜饭，不进入牛腩专用规则；
9. 番茄 + 金针菇 + 鸡蛋 + 西兰花 → 不得只使用一种；
10. 6 种混合食材 → 不强塞，候选诚实显示 used/unused；
11. 10 种食材 → 只选合理的 4–5 种，不承诺清库存；
12. 鸡蛋忌口、海鲜忌口和大米忌口分别前置拦截；
13. 三张候选不得都只围绕同一蛋白；
14. 无第二道时返回 `no_alternative_rice_meal`；
15. 候选卡与最终食材、名称、克数和步骤完全一致。

### 15.3 浏览器真人旅程

Preview 发布前至少完成 30 条真实 Chrome 手机视口旅程；为菜品丰富度增加多 Agent 分组复测：

- 每条通过真实点击、等待、选择、换一换和返回修改；
- 记录首道使用 `x/N`、营养等级、候选差异和未用原因；
- 记录页面错误、按钮无反应、返回路径和移动端可读性；
- 生成链路 DeepSeek 调用为 0；
- bad JSON、5xx、前端 JS 异常和食材越界为 0；
- 所有激活菜饭至少有一条端到端旅程；
- 证据包含构建 ID、API 响应和截图。

### 15.4 用户验证

自动门和浏览器门不能证明味道。Preview 通过后由用户进行实际测试；记录是否做完、步骤是否能执行、味道、份量、哪种食材没用上以及第二天是否愿意再用。不能用点击代替做饭结果。

## 16. 完成定义

本轮不是以“新增了多少道菜”为完成，而是同时满足：

1. 公开产品只剩菜饭一条主路径；
2. 候选只来自机器可验证的真实家族、受控变体或审核家常菜饭；
3. A/B/C 分级真实可见，C 不伪装成主餐；
4. 多食材输入不再退化成只用一种的普通候选；
5. 名称、食材、比例、步骤和来源一致；
6. 普通家庭电饭煲可以执行；
7. 全量自动门、菜谱门、Python 语法、构建一致性和真实浏览器旅程通过；
8. 只部署 Preview，由用户亲自测试后再决定 production。
