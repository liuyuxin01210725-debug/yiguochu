# r176 TEFAL602 烟熏黑线鳕饭液体合同

- 基线：`source-backed-one-pot-v1-20260808-global-r175`，923 条
- 当前：`source-backed-one-pot-v1-20260808-global-r176`，923 条
- 新增 canonical：0；仅补 1 条既有 `recipe_fact_checked` 的同源液体字段
- 目标：`tefal-602-smoked-haddock-kedgeree`（Smoked Haddock Kedgeree）

TEFAL602 官方食谱 PDF 第 2 页（目录 P.1）明确 4 人份、印度香米 250g、烟熏黑线鳕 300g、高汤 400mL、White Rice 程序，以及烹调中搅拌两次。r176 只把 400mL 写入 `liquid_contract.kind=added_stock`，并挂同一官方 source id；`fixed_batch` 与 `time_contract` 继续保留 `null`，避免把来源的整段约 28 分钟误当作可复用的闭合合同。

来源还明确鸡蛋需另行煮熟后搭配，不是锅内同时烹调主料；因此保留 staged 边界。PDF 本地归档、烟熏鱼安全终点及其他型号适配仍未闭合，`safety_endpoints` 继续为空，状态不晋升 `executable`。

验证：r176 专项测试 2/2（先红后绿）；随后运行目录构建、目录校验、`check-recipes` 与 `git diff --check`。
