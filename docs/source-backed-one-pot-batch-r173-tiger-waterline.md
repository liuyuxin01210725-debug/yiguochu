# r173 Tiger COK-B220 水位线合同回填

- 基线：`source-backed-one-pot-v1-20260808-global-r172` / 923 条
- 当前：`source-backed-one-pot-v1-20260808-global-r173` / 923 条
- 新增 canonical：0
- 回填条目：`tiger-cheese-curry-pilaf`（`チーズカレーピラフ`）

## 本批只回填的事实

Tiger COK-B220 官方食谱页 `https://www.tiger-corporation.com/ja/jpn/feature/recipe/cheese-curry-pilaf/` 给出 3 人、45 分钟、米 300 g、金枪鱼 70 g、玉米 70 g，并把液体限定为该机型白米刻度的“2 刻度略低”位置。`cooker_adaptation` 已有同一水位事实，本批只把它提升为机器可读的 `liquid_contract.kind: waterline`，不换算成通用毫升。

芝士仍按来源在炊饭完成后焖约 5 分钟；固定批次继续为空（来源没有完整结构化的所有原料量），安全数组继续为空，不把机型压力锅合同外推为普通电饭煲方案。

## 验证

- r173 专项测试：2/2
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`
- `node tools/check-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-recipes.mjs`
- `git diff --check`
