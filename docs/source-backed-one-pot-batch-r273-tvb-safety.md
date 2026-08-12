# r273 TVB 電飯煲雞飯安全端點補證

基線：`source-backed-one-pot-v1-20260808-global-r272` / 923 條。  
本批：`source-backed-one-pot-v1-20260808-global-r273` / 923 條。

本批不新增 canonical，也不把 TVB 页面未给出的份数、液体或总时长补成固定合同；只为两个既有 `recipe_fact_checked` 条目补挂同一官方禽肉安全终点。

## 同源原文事实

- TVB [電飯煲食譜｜肥媽教用電飯煲煮栗子雞飯](https://www.tvb.com/lifestyle-c/%E9%9B%BB%E9%A3%AF%E7%85%B2%E9%A3%9F%E8%AD%9C-%E8%82%A5%E5%AA%BD%E6%95%99%E7%94%A8%E9%9B%BB%E9%A3%AF%E7%85%92%E6%A0%97%E5%AD%90%E9%9B%9E%E9%A3%AF-1010882) 明确使用鸡腿肉，切小块并腌味；白饭煮好后加入鸡肉，搅拌、盖上盖子焗熟。
- TVB [電飯煲搞掂懶人料理！藜麥栗子冬菇雞飯](https://www.tvb.com/lifestyle-c/%E9%9B%BB%E9%A3%AF%E7%85%B2%E9%A3%9F%E8%AD%9C-%E9%9B%BB%E9%A3%AF%E7%85%B2%E6%90%9E%E6%8E%82%E6%87%B6%E4%BA%BA%E6%96%99%E7%90%86-%E8%82%A5%E5%AA%BD%E6%95%99%E7%85%AE-%E8%97%9C%E9%BA%A5%E6%A0%97%E5%AD%90%E5%86%AC%E8%8F%87%E9%9B%9E%E9%A3%AF-1011604) 明确使用急冻鸡髀肉，切小块、腌味；藜麦先浸约 20 分钟，材料入电饭煲，出现香味后加入腌好的鸡肉。

两页没有给出可稳定映射到目录 DSL 的固定份数、内锅液体或整道总时长；这些字段继续保留原值/null。第二页的藜麦浸泡和中途投料也不被改写成普通电饭煲的一次投料合同。

## 安全端点

两条均新增：

```json
{
  "code": "poultry_fully_cooked",
  "minimum_core_temperature_c": 74,
  "source_ids": ["S-SAFETY-TEMPERATURES-1"]
}
```

安全来源为 [FoodSafety.gov Safe Minimum Internal Temperatures](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)，页面明确禽肉最低中心温度 165°F / 74°C。TVB 原页负责证明鸡肉状态与投料流程；FoodSafety.gov 负责温度终点。两者不拼接份数、液体或时间。

以下来源冲突条目保持不变：`r60-tiger-szechuan-pork-tacook-rice` 仍为空安全端点；其 Directions 与 Basic Congee 页面互相冲突，不能借本批安全来源强行闭合。

## 验证

- `tools/tests/source-backed-one-pot-batch-r273-tvb-safety.test.mjs` 先在 r272 基线下失败，回填后 2/2 通过。
- 回填后运行 source-backed catalog validator、`check-recipes`、生成物检查与 `git diff --check`。
- 本批仍为研究层 `recipe_fact_checked`，不新增生产 72 道基础菜谱，也不晋升 `executable`。
