# r162 时间合同小批（既有条目）

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260808-global-r161` / 923 条

本批只回填官方原页明确给出的程序/总调理时间，不新增 canonical、不晋升 `executable`，不把准备时间、后置焖制时间、范围或分段时间拼成总时长。

## 已回填（7 条）

| recipe_id | 直接来源事实 | time_contract | 保留边界 |
| --- | --- | --- | --- |
| `maff-air-buri-daikon-daikon-meshi` | 日本农林水产省 Wagohan 原页写“调理时间约30分钟”，米与已经做好的鰤鱼萝卜炖汁同炊 | 30 分钟 | 这是剩余炖汁再利用，不能伪装成生鱼从零的一锅菜；份数和液体仍为空 |
| `iris-hijiki-tuna-mixed-rice` | IRIS RC-PGA50 原页将“自動調理9”明确标为55分钟 | 55 分钟 | 仅限 RC-PGA50 自动调理9；3–4人范围不折算固定份数，水仍是机型水位线 |
| `iris-cooking-kettle-saba-canned-rice` | IRIS Cooking Kettle 原页标调理时间约45分钟，自动菜单5 | 45 分钟 | 罐头鲭鱼与总液体仍按原页；不因罐头鱼名称添加生鲜鱼安全终点 |
| `iris-chinese-chicken-congee` | IRIS RC-PGA50 原页将“自動調理3”明确标为65分钟 | 65 分钟 | 鸡肉出锅后拆丝再回放是原方步骤；粥水位线与机型边界不外推 |
| `iris-rc-pga-paella` | IRIS RC-PGA50 原页将“自動調理9”明确标为75分钟 | 75 分钟 | 冷冻海鲜的物种/状态未展开，安全数组保持空；仅限 RC-PGA50 |
| `iris-rc-pga-chicken-rice` | IRIS RC-PGA50 原页将“自動調理9”明确标为75分钟 | 75 分钟 | 鸡腿同锅流程保留，未因程序时长自动添加禽肉安全 endpoint |
| `tiger-brown-rice-curry-pilaf` | Tiger 官方原页明确3人份、玄米炊込み、调理时间90分钟 | 90 分钟 | 出锅后红椒、玉米、葡萄干和黄油再拌/焖4–5分钟仍保留；仅适用页面列出的 Tiger 机型 |

上述时间均直接绑定各自已有 `source_id`，没有用相邻版本、准备时长或范围中值补写。其余候选（如准备/烹调分列、15–20分钟范围、倒数投料或熟饭二次烹）继续保持 `null`。

## 验证

- 专项测试：`tools/tests/source-backed-one-pot-batch-r162-time.test.mjs`
- 目录总数保持 923，状态与安全覆盖不变
- 未修改 runtime、UI、Planner 或部署配置
