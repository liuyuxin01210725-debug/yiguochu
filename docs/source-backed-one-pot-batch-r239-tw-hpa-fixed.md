# r239 — 台湾卫福部麻油鸡丁糯米糕固定批次回填

## 结果

- 目录版本：`source-backed-one-pot-v1-20260808-global-r239`
- 目录总数：923（新增 canonical：0）
- 回填对象：`taiwan-sesame-oil-chicken-glutinous-rice-cake`
- 状态：`recipe_fact_checked`，未加入 `executable`
- 固定批次：6 人份

## 同源事实

台湾卫生福利部国民健康署/农业部官方页面[《麻油雞丁糯米糕》](https://www.mohw.gov.tw/dl-81903-6daaf810-e847-4a92-92b3-01c9d18f1fe1.html)给出以下六人份定量：红葱 10g、糯米 200g、干香菇 60g、老姜 10g、麻油 30mL、肉丝 30g、去骨鸡腿肉 150g、虾米 30g、盐 6g、米酒 30mL。

原文流程是糯米浸泡约 30 分钟，炒香姜与配料并加入约半杯沸水或香菇水，再把炒料与沥干糯米拌合；移入电锅后外锅加 1.5 杯水，第一次跳起拌匀，再加外锅 1/4 杯水复蒸。

## 保留的边界

- “约半杯沸水或香菇水”是动态液体对象，未写入 `liquid_contract`。
- 1.5 杯与 1/4 杯是电锅外锅水，不是糯米内锅液体，不转换成通用加水合同。
- 30 分钟是浸泡准备时间，不等同于整道菜总时长，因此 `time_contract` 保持 `null`。
- 来源未给鸡肉安全终点，`safety_endpoints` 保持空；先炒并不等同于可验证的温度终点。
- 先炒、第一次蒸后拌匀、再次复蒸是多阶段电锅流程，`cooker_adaptation` 仍为 `source_limited`，不宣传为普通电饭煲可执行轮替。

## 验证

- `tools/tests/source-backed-one-pot-batch-r239-tw-hpa-fixed.test.mjs`：2/2
- JSON/catalog validator、renderer、`check-recipes` 与全量测试在批次收尾后运行。
