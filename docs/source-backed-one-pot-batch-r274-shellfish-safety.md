# r274 既有海鲜条目安全端点补证

基线：`source-backed-one-pot-v1-20260808-global-r273` / 923 条。  
本批：`source-backed-one-pot-v1-20260808-global-r274` / 923 条。

本批不新增 canonical，也不把来源没有写出的份数、液体或总时长补成合同；只为两个既有 `recipe_fact_checked` 条目补挂海鲜视觉熟制端点。

## 原页事实

- Tiger [蒸しあわびの炊込みごはん](https://www.tiger-corporation.com/en/jpn/feature/recipe/post_12/) 明确 2 人份、米 1 杯、鲍鱼 1 只、昆布高汤 200mL。原页给出先蒸鲍鱼保留蒸汁、米按炊込み程序炊饭后回锅 1 分钟；同时明确允许将生鲍鱼切片后直接加入炊饭。该页仍保留先蒸/后炊/回锅边界，不转换成普通电饭煲一次投料合同。
- Towngas [芦笋虾仁藜麦饭](https://www.towngasappliance.com/newsletter/ricecooking/c02.php) 明确珍珠米 150g、多色藜麦 150g、虾 6 只、300mL 水；虾先以红椒粉、盐和胡椒腌好，中火煮饭约 10 分钟后铺虾与蔬菜，继续煮至自动熄火并焗约 5 分钟。原页未给份数，且器具是 TGC 明火饭盘，继续保留 `fixed_batch=null` 与明火边界。

## 安全端点

两条均新增：

```json
{
  "code": "shellfish_fully_cooked",
  "visual_endpoint": "肉质呈珍珠白或白色且不透明",
  "source_ids": ["S-SAFETY-TEMPERATURES-1"]
}
```

FoodSafety.gov 页面负责海鲜/贝类肉质珍珠白或白色且不透明的视觉终点；Tiger/Towngas 原页负责证明各自海鲜食材与投料/熟制流程。没有把视觉终点改写成不存在的固定温度，也没有把明火/先蒸/中途投料流程外推为普通电饭煲合同。

以下阻塞项保持不变：`panasonic-taiwan-red-crab-pork-congee` 原页写“处理洗净后切块”但没有明确生鲜状态或可独立映射的熟制终点，因此仍 `safety_endpoints=[]`。

## 验证

- r274 专项测试先在 r273 基线下因版本/端点缺失失败，回填后 2/2 通过。
- 回填后运行目录 validator、`check-recipes`、生成物检查和 `git diff --check`。
- 本批仍为研究层 `recipe_fact_checked`，不新增生产 72 道基础菜谱，也不晋升 `executable`。
