# r256 既有身份档案流程闭合

基线：`source-backed-one-pot-v1-20260808-global-r255` / 923 条。

本批不新增 canonical、不改变状态、不晋升 executable，只把官方原文已经明确写出的高层制作事实写入 `cooking_sequence`。固定批量、液体、总时长、安全终点和现代电饭煲适配仍保持空值或原边界。

| recipe_id | 官方可证明流程 | 处理 |
| --- | --- | --- |
| `shizhu-tujia-potato-rice` | 重庆市规划和自然资源局页面写石柱高山洋芋与新米同锅焖煮。 | 写入 1 个来源限定步骤；仍 `identity_verified`。 |
| `ningshan-liangcanzi-dry-rice` | 宁陕县政府页面写苞谷米先煮，近熟加入大米再蒸熟。 | 写入 1 个来源限定步骤；不补批量/液体/时间。 |
| `r99-chikan-oil-salt-rice` | 赤坎镇政府页面写浸米约 2 小时、大火煮沸、中火收水、七成熟放料、熄火余温焗约 5 分钟。 | 写入 1 个瓦煲/柴火边界步骤；不把通用技法当成油盐饭定量配方。 |
| `huoqiu-haozi-guoba-rice` | 霍邱县政府非遗页面写蒿子与米同锅制作菜干饭并形成蒿香锅巴。 | 写入 1 个来源限定步骤；仍身份档案。 |
| `r103-cn-guangxi-sanjiang-dong-nuomi-fan` | 柳州市地方政府页面写侗族糯饭用木甑蒸熟并储存食用。 | 写入 1 个木甑步骤；不外推电饭煲。 |

## 证据与边界

每个步骤的 `source_ids` 均直接指向该条目已有的官方来源，未拼接其他菜谱、地区或器具参数。由于来源没有给出足够的数量、液体、总时长或安全合同，这 5 条仍不是可照做的公开执行菜谱。

验证：`tools/tests/source-backed-one-pot-batch-r256-process-identity.test.mjs`。
