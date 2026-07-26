# 东北炖菜配主食安全证据层实施计划

> 状态：实施中。仅建立研究与校准准入证据，不新增 recipe，不激活 template，不写入 Ratio DSL，不部署。

## 目标与边界

为 `stew-with-staple-pot` 的排骨与豆角分支建立机器可审计的熟制终点证据，使后续实厨校准能够判断 `pork_endpoint_reached` 与 `beans_endpoint_reached`。本轮只回答“怎样确认熟制安全”，不回答玉米面比例、锅内液体量、贴饼时间或成品口感。

权威边界：

- 排骨：采用 FoodSafety.gov/USDA 官方鲜猪肉熟制表中直接列出的 `Ribs, All Types`，安全终点为中心温度至少 `63 C` 且静置至少 `3 min`；表中烹饪时间只属于其给定重量和方法，不转写为东北家庭锅默认时间。
- 豆角：采用湖北省卫生健康委员会/湖北省疾控中心的家庭预防四季豆中毒说明；仅对受控 taxonomy 中的鲜嫩豆荚类分支使用，要求全部焖熟煮透、均匀受热、失去生绿色且无豆腥味，并在该方法下保持 `100 C` 小火焖 `>10 min`。不把这一规则外推给所有名称含“豆”的食材。
- 两条证据都只允许把安全分支提升为 `calibration_ready`；数字比例规则、生产模板和用户菜谱仍保持 blocked/inactive。

## 机器台账

新增 `tools/data/northeast-stew-safety-evidence.v1.json`，严格包含：

- 版本、`research_only` 范围、权威源元数据；
- 食材作用域、原料形态、烹饪方法与测量位置；
- 机器终点和组合逻辑（全部条件必须满足）；
- 明确的 `cannot_prove`；
- 两个分支决定：`pork_ribs` 与 `green_beans` 只能为 `calibration_ready`，并引用唯一受控规则；
- 总准入仍为 `ready_for_kitchen_calibration`，同时列出比例与 2/3/4 人份校准仍未完成。

Validator 必须拒绝：非 HTTPS、非官方固定 URL、错误单位、温度或时间被篡改、作用域扩大、只满足豆角视觉条件、把官方参考烹饪时间变成生产默认、任何生产启用字段，以及与 M1 分支/校准字段不一致。

## TDD 顺序

1. 新建 `tools/tests/northeast-stew-safety-evidence.test.mjs`，先断言缺少台账、validator、builder、renderer、CLI、生成 JSON 和 Markdown，并运行确认失败。
2. 实现源台账与 fail-closed validator，测试两个终点、适用边界、不可证明项和篡改拒绝。
3. 实现 builder/renderer/CLI，生成：
   - `tools/generated/northeast-stew-safety-evidence.v1.json`
   - `docs/northeast-stew-safety-evidence.md`
4. 将 M1 的两个安全分支改为仅引用新规则并标记 `calibration_ready`；校准记录仍为 pending，所有测量值仍为空。
5. 更新 `docs/northeast-stew-calibration-runbook.md`：状态从安全终点未研究改为“安全准入已满足、比例与校准数据仍阻断”；不得出现可直接上线或已完成校准的表述。
6. 将新 validator、生成物新鲜度与隔离检查接入 `tools/check-recipes.mjs` 和 `tools/tests/build-dist.test.mjs`。

## 验证

依次运行：

```bash
node --test tools/tests/northeast-stew-safety-evidence.test.mjs
node tools/build-northeast-stew-safety-evidence.mjs --check
node tools/check-recipes.mjs
node --test tools/tests/*.test.mjs
python3 -m py_compile ai_proxy.py
node tools/build-dist.mjs --out-dir <temp-dir> --build-id northeast-safety-audit
```

最后递归确认临时发布包中不存在 `northeast-stew-safety-evidence`、东北研究报告或其他研究资产；确认 recipe、template、ratio、taxonomy、前端、Worker 与代理没有本轮功能性修改。
