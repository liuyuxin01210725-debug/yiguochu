# 来源菜饭目录批次 r109

日期：2026-08-07
目录版本：`source-backed-one-pot-v1-20260807-national-r109`
基线：`source-backed-one-pot-v1-20260807-national-r108`（840 条）
本批新增：2 条；批后总数：842 条

## 本批边界

- 本批只收录日本农林水产省（MAFF）官方原页已直接打开、具名且能证明食材与流程的米饭候选。
- 两条均保持 `recipe_fact_checked`，不晋升 `executable`，不进入厨房已验证或对外承诺层。
- `北海道赤飯` 是炉上锅地域版本；来源没有普通电饭煲程序，不能把已有其他地区赤饭的参数拼入。
- `人参とアスパラガスのピラフ` 虽然使用炊饭器，但官方流程包含洋葱/胡萝卜预炒和芦笋预煮；页面没有跨机型水位与总时长，不能包装成全投料一键电饭煲菜。

## 新增条目

### `maff-hokkaido-amanatto-sekihan` · 北海道赤飯

- 官方来源：[MAFF うちの郷土料理·北海道赤飯](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/sekihan_hokkaido.html)
- 页面直接证明：4 人份；粳米 1.5 杯、糯米 1.5 杯、水 3 杯、甘纳豆 100g；米浸泡约 30 分钟，锅中煮沸后中火约 5 分钟、弱火约 10 分钟，熄火焖饭时加入甘纳豆。
- 目录处理：液体合同固定为来源的 3 杯水；甘纳豆后置步骤保留；总时长和安全终点未补猜；器具标为炉上锅，`cooker_adaptation.status=not_adapted`。
- 营养边界：主要是米与甘纳豆的甜味主食，目录标记为碳水角色，不宣称蛋白和蔬菜完整。

### `maff-carrot-asparagus-pilaf` · 人参とアスパラガスのピラフ

- 官方来源：[MAFF ごはんにぴったりレシピ·人参とアスパラガスのピラフ](https://www.maff.go.jp/j/seisan/kakou/mezamasi/recipe/recipe021.html)
- 页面直接证明：4 人份；米 2 杯、胡萝卜 2 根、洋葱 60g、芦笋 4 根、鸡汤 2 杯、油 2 大匙；洋葱/胡萝卜先炒，米拌入后转入炊饭器加鸡汤，芦笋另行预煮后拌入。
- 目录处理：液体合同固定为来源的 2 杯鸡汤；预炒和预煮分别列步骤；总时长、跨机型水位与安全终点未补猜；器具标为炒锅+炊饭器，`cooker_adaptation.status=source_limited`。
- 营养边界：米和蔬菜为主，鸡汤不能自动当作蛋白来源，目录标记为碳水与膳食纤维角色。

## 验证记录

- 先写失败测试：`tools/tests/source-backed-one-pot-batch-r109.test.mjs` 在 r108/840 基线下因版本与条目缺失失败。
- 入库后专项测试：该文件 3/3 通过。
- 两条来源均 `access_status=opened`、显式 `evidence_tier=2`、带 `evidence_locator`；来源范围只声明其实际支撑的事实。
- 未修改运行时代码、UI、Planner、旧菜谱库、部署配置或生产环境。
