# r297：第四批 5 条来源固定批次正式化推进

本批继续只闭合同一来源已经明确的固定批次合同：

| recipe_id | 名称 | 保留边界 |
|---|---|---|
| `hk-pumpkin-taro-chicken-claypot-rice` | 南瓜芋頭雞粒煲仔飯 | 普通煲仔饭分阶段流程，不外推电饭煲 |
| `cookpot-beef-wild-mushroom-rice` | 牛肉野菇炊飯 | 指定炊饭器和来源水位/程序 |
| `zojirushi-nonokomeshi-el-mb30` | ののこ飯 | 仅象印 EL-MB30 来源流程 |
| `tiger-gomoku-rice-post43` | 五目ごはん（Tiger post43） | 仅 Tiger 炊込み程序 |
| `cantonese-mushroom-chicken-claypot-rice` | 冬菇滑鸡饭 | 砂锅/瓦煲分阶段流程，不改写为电饭煲参数 |

五条均为 `source_bounded_non_executable`：可在来源执行资料库按原批次查看，但仍未完成厨房观察和真实 Planner 旅程，因此正式 Planner 仍不激活。

验证：r297 专项 2/2；正式证据、候选审查及 r294–r297 批次测试通过；生成 artifacts 与 `check-recipes` 门禁通过。
