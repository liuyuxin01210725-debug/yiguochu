# r172 IRIS RC-PGA50 水位线合同回填

- 基线：`source-backed-one-pot-v1-20260808-global-r171` / 923 条
- 当前：`source-backed-one-pot-v1-20260808-global-r172` / 923 条
- 新增 canonical：0
- 回填条目：`iris-hijiki-tuna-mixed-rice`（`炊き込みごはん（干ひじき・ツナ）`）

## 本批只回填的事实

IRIS OHYAMA RC-PGA50 官方食谱页 `https://www.irisohyama.co.jp/ricecooker/rc-pga/detail/?c=2&r=15&s=1` 的步骤明确要求米与调味料加水至“RC-PGA50 白米 2 合水位线”，并给出自动调理 9 与约 55 分钟。因这是机型内锅刻度，本批只写入：

```json
{
  "kind": "waterline",
  "waterline": {"appliance_model": "IRIS OHYAMA RC-PGA50", "scale": "white_rice", "mark": 2}
}
```

不将水位线换算成通用毫升，也不把 3–4 人份范围压成单一 `fixed_batch`；金枪鱼为罐头来源，安全数组继续保持空，避免把罐头条目误当作生鱼安全证明。

## 验证

- r172 专项测试：2/2
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`
- `node tools/check-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-recipes.mjs`
- `git diff --check`
