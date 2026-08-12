# Source-backed 一锅米饭目录批次 r112

日期：2026-08-07
目录基线：source-backed-one-pot-v1-20260807-national-r110（844 条）
目录结果：source-backed-one-pot-v1-20260807-national-r112（849 条）
本批新增：5 条，全部保持 recipe_fact_checked；没有晋升 executable、preview_ready 或公开可照做状态。

## 新增条目

| recipe_id | 具名菜 | 来源 | 本批记录的边界 |
| --- | --- | --- | --- |
| maff-miyazaki-hiezushi | 稗ずーしー／稗がゆ | [日本农林水产省原页](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/hie_zushii_miyazaki.html) | 1 人份稗、野猪肉、葱叶和米的量；稗与出汁小火约 2 小时后再加米。出汁和补水未定量，传统锅煮，不推导电饭煲。 |
| maff-saga-ochagai-chagayu | お茶がい／茶がゆ | [日本农林水产省原页](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/45_5_saga.html) | 4 人份米 200g、番茶 20g、水 1600mL；先煮茶汁再下米。锅煮版本，不推导电饭煲程序。 |
| maff-yamanashi-yakome | やこめ | [日本农林水产省原页](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/yakome_yama_nashi.html) | 15 人份米、豆、芝麻、盐的量；浸泡、蒸制、约九成熟加盐水和大豆。盐水量未给出，蒸笼流程不推导电饭煲。 |
| maff-yamanashi-obaku | おばく | [日本农林水产省原页](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/obaku_yama_nashi.html) | 20 碗丸麦、米、豆薯和蔬菜量；米段约 800mL 水，豆麦预处理、蔬菜后置。800mL 不扩写成整锅液体，传统大锅不推导电饭煲。 |
| maff-kagawa-mossou-meshi | もっそうめし | [日本农林水产省原页](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/mossou_meshi_kagawa.html) | 20 人份米和配料量；先煮熟米饭、另锅煮配料后拌和。登记为熟饭二次烹边界，不伪装成生米一锅饭。 |

## 证据纪律

- 五条均使用直接打开的 MAFF 官方页面，来源显式标记 tier 1、access_status: opened 和可复核的 evidence_locator。
- 每个结构化数量、液体和步骤字段只引用对应来源；来源未提供的数值保持 null，不从其他地区或其他器具版本拼接。
- 原页面中的锅、蒸笼或分阶段流程保留在 cooker_adaptation 与步骤中；本批不把传统锅煮、蒸制或熟饭二次拌和改成电饭煲水量、程序或安全参数。
- 这些条目只是来源资产，尚未经过本项目厨房验证，也不代表可直接照做。

## 验证

先写失败测试 tools/tests/source-backed-one-pot-batch-r112.test.mjs，再落主目录。批次测试、目录 validator、check-recipes 和构建产物重建应在提交前运行；本批不修改运行时代码、前端、Planner 或部署配置。
