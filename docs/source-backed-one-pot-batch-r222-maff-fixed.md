# r222 MAFF fixed batch

本批基于 `source-backed-one-pot-v1-20260808-global-r221`，目录总数保持 923；只回填同一日本农林水产省原页已经明确的一个固定批次，不新增 canonical，也不晋升 executable。

## maff-miyazaki-toukibimeshi

- 来源：[とうきびめし｜日本农林水产省](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/toukibi_meshi_miyazaki.html)
- 证据：原页材料写 1 人份，とうきび 20g、米 160g；粗磨玉米先煮软，细磨版本可与米同炊。
- 回填：`fixed_batch.servings=1`；米 160g；粗磨玉米或细磨玉米 20g。
- 保留缺口：来源只说水要比平时略多，没有数值液体、总时长或安全终点，因此 `liquid_contract`、`time_contract`、`safety_endpoints` 继续为空；不外推普通电饭煲水位。
- 状态：`recipe_fact_checked`，非 `executable`。

验证：r222 专项测试通过；生成目录门禁、菜谱门禁和 `git diff --check` 在批次收尾时运行。
