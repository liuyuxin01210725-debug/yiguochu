# r318：Panasonic 南瓜莲藕鸡饭流程闭合

## 变更

- 目录版本保持 `source-backed-one-pot-v1-20260810-global-r293`，总数仍为 923 条；本批不新增 canonical。
- `panasonic-my-chicken-pumpkin-lotus-mixed-rice` 从 `identity_verified` 晋升为 `recipe_fact_checked`：Panasonic Malaysia 原页同时给出 4 份、糙米 3 杯、大麦 90g、鲣鱼高汤 3 杯、水 100mL、鸡腿丁 200g、南瓜 50g、莲藕 100g，以及 Brown Rice 程序。
- 以同一官方页面的导语和编号步骤闭合 4 步：米与液体入内锅；南瓜、莲藕切配；姜、配料和鸡腿丁入锅并选择 Brown Rice；煮好后拌盐和芝麻油。
- 官方导语说明鸡肉从开始加入，而编号步骤没有再次写出鸡肉投料；卡片明确保留这一来源边界，不把它扩写成额外预炒或安全终点。

## 仍然保留的缺口

- 来源没有给整道总时长，`time_contract` 保持 `null`；研究卡会显示研究起步时长并标为估算。
- 来源没有给独立禽肉安全终点，`safety_endpoints` 保持空数组；含鸡肉的首次试做仍需按卡片提示核对安全终点。
- 复合液体仍按官方事实保留为 3 杯鲣鱼高汤 + 100mL 水，不把它压成普通米饭水位，也不外推到其他电饭煲型号。

## 来源

- [Panasonic Malaysia — Mixed Rice with pumpkin and lotus roots](https://www.panasonic.com/my/consumer/kitchen-appliances-learn/healthy-everyday-recipes/recipe-top-page/mixed-rice-with-pumpkin-and-lotus-roots.html)

本批只使用上述直达官方页，不跨版本拼接配方；研究方法层会把来源步骤、来源用量与估算时长分开标注。
