# r324：象印中国番茄海鲜饭原文定量补全

基线：`source-backed-one-pot-v1-20260810-global-r293` / 923 条。

本批不新增 canonical，也不把错配步骤写入做法。象印中国官方页直接列出 4–5 人份、白米 3 杯、鱿鱼圈 40g、虾仁 40g、白砂糖 65g、洋葱 30g、什锦蔬菜 40g、番茄约 80g、盐 1 又 1/2 小勺、白胡椒粉 1 小勺，并说明适用于带“什锦饭”菜单的机型。页面步骤区实际出现糙米粥、红枣和枸杞，与标题及配料表不一致，因此只把定量作为来源线索直接展示，`cooking_sequence` 继续为空，研究卡的步骤和液体仍标为估算/待核。

来源：<https://www.zojirushi-china.com/activity/recipe/rice-cooker/fanqiehaixianfan/>（官方页正文第 12–52 行）。

TDD：先验证缺少 `quantity` 断言，再补 source scope 与 locator；专项测试通过后重建目录 artifacts。

