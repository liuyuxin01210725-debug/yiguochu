# r342 来源步骤拆分批次

基线：`source-backed-one-pot-v1-20260810-global-r293`，923 条。

本批只把 10 条现有 `cooking_sequence` 中已经由同一来源写在一个长句里的动作拆成四个有序步骤。每个新步骤沿用原步骤的 `source_ids`；没有新增用量、液体、时间、安全终点或器具等事实，也没有改变 canonical 状态、正式 Planner 72 条边界或研究卡的估算标记。

覆盖：怀柔敛巧饭、南京菜饭、社饭、涟源腊肉红枣竹筒饭、牛肉盖菜饭、涉县小米焖饭、诸暨豌豆咸肉饭、秀山社饭、合饭、潮汕戈饭。

验证：先以 r293 基线运行专项测试确认拆分记录不存在（RED），写入后专项 GREEN；随后重建研究执行库、正式化审查、staging、ledger、preview manifest 和 source-backed catalog artifacts。拆分后的步骤仍属于来源研究卡，不会自动进入正式 Planner。
