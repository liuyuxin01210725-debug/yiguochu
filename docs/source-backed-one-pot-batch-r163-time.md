# r163 时间合同小批（既有条目）

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260808-global-r162` / 923 条

本批只回填官方原页明确的总调理时间或机型程序总时长，不新增 canonical、不晋升 `executable`，不把准备时间、分段时间、范围或另锅阶段拼成单值。

## 已回填（4 条）

| recipe_id | 直接来源事实 | time_contract | 保留边界 |
| --- | --- | ---: | --- |
| `maff-tokushima-omiisan` | 日本农林水产省德岛原页给出4人份配方，并写米与芋头萝卜在煮干出汁中沸后小火约30分钟至米软 | 30 分钟 | 传统锅煮米粥，不外推电饭煲；前置取煮干出汁的浸泡时间不并入烹调时长 |
| `panasonic-brown-rice-soybean-rice-nf-pc400` | Panasonic NF-PC400 原页明确“总调理时间的目安：约1小时20分”，并另列自动调理15/时间设定35分 | 80 分钟 | `80` 绑定原页总调理时间，不误写成35分钟压力设定；仅限 NF-PC400，玄米水位3仍是机型合同 |
| `tiger-cheese-curry-pilaf` | Tiger COK-B220 原页明确调理时间45分钟、3人份；完成后另焖芝士5分钟仍保留在原步骤 | 45 分钟 | 仅限 COK-B220；页面水量是白米水位线语义，芝士为出锅后焖入 |
| `philips-soy-milk-chicken-congee` | Philips Taiwan 原页明确密封煮粥键35分钟，1人份，鸡肉/豆浆/米/水同锅后泄压开盖 | 35 分钟 | 仅限 Philips 多功能烹煮锅煮粥程序；鸡里肌以“2条”给出，未外推克重或普通电饭煲程序 |

上述时间均直接绑定各自已有 `source_id`，不使用相邻版本或准备时长推导。其余候选（如4–5人份程序范围、荞麦米预煮+另锅出汁、机构大批量备料与烹煮分列、准备/烹调分列）继续保持 `null`。

## 验证

- 专项测试：`tools/tests/source-backed-one-pot-batch-r163-time.test.mjs`
- 目录总数保持 923，状态与安全覆盖不变
- 未修改 runtime、UI、Planner 或部署配置
