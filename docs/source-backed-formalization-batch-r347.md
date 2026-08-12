# Source-backed calibration batch r347

本批把 4 张已有来源执行卡接入 rice-meal calibration preview。它们不是 72 道 Planner 正式基础菜谱的新增批准项；四条都保留 `calibration_preview`，需要指定设备的家庭试做反馈后，才可能进入更高层级。

| variant_id | 来源/设备边界 | 本项目校准批量 | 可执行步骤 | 当前状态 |
| --- | --- | --- | --- | --- |
| `source-taiwan-tatung-cabbage-rice` | 台湾农粮署/大同电锅；锅外先炒，再回大同内锅 | 2 人；生米 200g、猪肉 100g、高丽菜 150g、干香菇 10g、虾米 10g、红葱头 6g；加水按 1.2 倍项目液体合同 | 淘米浸泡；处理并锅外炒香配料；装入大同内锅；启动炊饭；跳起后焖片刻；检查猪肉熟透后翻松 | `calibration_preview`，待大同指定机型实测 |
| `source-zojirushi-pork-vegetable-rice` | 象印 EL-NS23 自动菜单；猪肉先汆烫调味，不外推其他机型 | 2 人；生米 200g、猪肉 150g、卷心菜 150g、甜椒 56g、生姜 10g；加水按 1.2 倍项目液体合同 | 淘米；猪肉汆烫调味并切配菜；装入 EL-NS23；启动来源自动菜单；焖片刻；检查猪肉无粉红后翻松 | `calibration_preview`，待 EL-NS23 实测 |
| `source-panasonic-nf-pc400-takikomi-rice` | Panasonic NF-PC400 自动调理/压力释放边界；不外推普通电饭煲 | 2 人；生米 300g、鸡腿肉 100g、牛蒡 50g、魔芋 40g、干香菇 10g、胡萝卜 150g；加水按 1.2 倍项目液体合同 | 淘米；鸡腿和根菜按来源处理；按顺序铺在米面；启动指定自动调理；完全泄压后静置；检查鸡肉无粉红、根菜软熟后翻松 | `calibration_preview`，待 NF-PC400 实测 |
| `source-panasonic-khao-man-gai` | Panasonic NF-AC1000 中压程序；不把 8 分钟压力参数外推普通电饭煲 | 2 人；生米 200g、鸡腿肉 200g、生姜 10g、蒜 4g、葱 10g；加水按 1.2 倍项目液体合同 | 淘米浸泡；鸡腿扎孔调味，处理姜蒜葱；将米和配料装入 NF-AC1000；启动来源中压程序；完全泄压后静置；检查鸡肉无粉红后翻松装盘 | `calibration_preview`，待 NF-AC1000 实测 |

## 证据与校准边界

- 来源页提供的身份、器具、流程和部分批量事实继续保存在 source evidence ledger；上表的克数和 1.2 倍液体是项目校准合同，不改写为来源原文。
- 本批没有新增正式 Planner recipe-library 条目；正式库仍保持 72 道（12 `approved` + 60 `auto_approved`）。
- 这 4 道可以在 rice-meal calibration scope 中生成带步骤的预览，但不进入默认 ready scope，也不改变生产主菜单。
- 四道都保留 `household_test_pending_feedback`。试做时要记录实际设备型号、米饭熟软度、液体是否足够，以及禽/猪肉安全终点；反馈未回填前不得晋升为正式运行菜谱。

## 验证

- `node --test tools/tests/source-backed-formalization-batch-r347.test.mjs`：2/2
- `node tools/check-rice-meal-preview.mjs`：28 variants，17 calibration previews，25/25 compiled contracts
- 后续构建与项目总门禁以本批文件和当前工作区状态为准。
