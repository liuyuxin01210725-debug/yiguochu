# r275 MAFF いかめし 海鲜安全端点补证

基线：`source-backed-one-pot-v1-20260808-global-r274` / 923 条。  
本批：`source-backed-one-pot-v1-20260808-global-r275` / 923 条。

本批不新增 canonical，只为既有 `maff-hokkaido-ikameshi` 补一条可追溯的生鱿鱼安全端点。其余合同不改：来源给出 4 人份、鱿鱼 4–8 杯范围、糯米 1 杯和出汁“浸没”边界，不把范围压成固定数量，也不把出汁适量改成毫升。

## 一手原页事实

MAFF [いかめし 北海道](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/ikameshi_hokkaido.html) 明确道南/渡岛的具名菜与材料。原页要求把鱿鱼内脏和足取出、清洗，向胴体填入浸泡后的糯米和鱿鱼足，再加酒与出汁浸没；先煮约 30 分钟，随后加入调味料并以小火煮熟。页面还提醒糯米不能装太满以免胀裂。热水浇鱿鱼只是处理步骤，不能被误当成已熟。

## 安全端点

新增：

```json
{
  "code": "seafood_fully_cooked",
  "minimum_core_temperature_c": 63,
  "source_ids": ["S-SAFETY-SEAFOOD-GENERAL-CDC-1"]
}
```

CDC [About Anisakiasis](https://www.cdc.gov/anisakiasis/about/index.html) 明确生/半生鱼或鱿鱼风险，并转述 FDA seafood general guidance：海鲜内部至少 145°F（约 63°C）。MAFF 原页负责证明鱿鱼是本条原料且经历锅中持续煮熟；CDC 负责海鲜温度终点。两者不扩写份数、液体或电饭煲适配。

## 验证

- r275 专项测试先在 r274 基线下因版本/端点缺失失败，回填后 2/2 通过。
- 记录仍为 `recipe_fact_checked`，不晋升 `executable`，不计入生产 72 道基础菜谱。
