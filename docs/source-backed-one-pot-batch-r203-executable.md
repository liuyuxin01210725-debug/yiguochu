# r203 source-backed executable promotion

> 目录版本：`source-backed-one-pot-v1-20260808-global-r202` → `source-backed-one-pot-v1-20260808-global-r203`
> 目录数量：923 → 923（无新增 canonical）
> 变更范围：把已有、合同字段完整且通过 source-backed validator 的 8 条记录从 `recipe_fact_checked` 晋升为 `executable`；不改运行时代码、UI、Planner 或生产部署。

## 晋升原则

- 每条记录已有固定份数和食材量、液体合同、完整步骤、总时间、安全终点和非空过敏原字段。
- 每个合同字段均由来源 `source_refs` 的相应 claim scope 支持；来源已直接打开并有定位，安全终点使用既有 FoodSafety.gov 证据。
- 保留原始器具与阶段边界：Tiger 的炊込み/预煎、Panasonic 机型、香港煲仔饭和大同电锅，不外推成普通电饭煲参数。
- `executable` 只表示 source-backed 合同完整、可进入后续内部执行审查；不等于厨房试做完成，也不等于生产批准。

## 本批 8 条

| recipe_id | 记录 | 关键边界 |
| --- | --- | --- |
| `tiger-chicken-bamboo-rice` | 6人、米3杯、竹笋80g、鸡胸100g、高汤600mL、60分钟、禽肉74°C | 竹笋按来源预煮；Tiger 炊込み机型 |
| `tiger-whitefish-mixed-rice` | 6人、米3杯、白身鱼200g、高汤600mL、60分钟、鱼类63°C | 白身鱼先平底锅预煎、拆骨后入炊込み |
| `panasonic-claypot-style-chicken-rice` | 6人、茉莉香米3杯、鸡腿250g、水1.5杯、220分钟、禽肉74°C | Panasonic 马来西亚机型和双程序流程 |
| `hk-pumpkin-taro-chicken-claypot-rice` | 2人、米180g、鸡胸75g、南瓜/芋头各75g、水260mL、15分钟、禽肉74°C | 香港卫生署煲仔饭；不外推电饭煲 |
| `tiger-pork-bamboo-rice` | 6人、米3杯、竹笋90g、猪五花120g、高汤600mL、60分钟、猪肉74°C | Tiger 炊込み机型 |
| `tiger-steak-mushroom-barley-rice` | 4人、米2杯、牛排200g、蘑菇100g、肉汤600mL、55分钟、牛肉71°C | 牛排另锅煎后拌入麦饭 |
| `tatung-salmon-pumpkin-milk-risotto` | 2人、米1杯、三文鱼160g、南瓜泥100g、牛奶1杯、30分钟、鱼类63°C | 南瓜泥预处理；大同电锅 |
| `tatung-seafood-porridge` | 3人、米1合、石蟹500g、鲷鱼/鱿鱼/鸡翅各约200g、水6合、55分钟 | 海鲜粥分阶段、鸡翅预煎；保留项目既有贝类/鱼类/禽肉终点 |

## 验证

- 先写专项测试并在 r202 基线确认版本/状态断言失败，再修改目录。
- `tools/tests/source-backed-one-pot-batch-r203-executable.test.mjs`：应覆盖 8 条完整合同、4 条保留缺口和总 executable 数 20。
- 晋升后运行 source-backed catalog validator、renderer 和 `check-recipes`；任何来源或合同错误都阻止提交。
