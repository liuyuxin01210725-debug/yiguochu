# r209 安全合同回填：三条明确未熟蛋白米饭

基线为 `source-backed-one-pot-v1-20260808-global-r208`，目录仍为 923 条。本批不新增 canonical，也不改固定批量、液体、总时长或器具适配；仅为原始页面明确写出未熟蛋白并要求继续加热的三条既有 `recipe_fact_checked` 记录补挂受控安全终点。

| recipe_id | 原始来源事实 | 回填合同 | 保留边界 |
| --- | --- | --- | --- |
| `cookpot-salted-mackerel-chicken-claypot-rice` | 鍋寶官方页给出鸡胸肉约300g；步骤明确腌制后炒至表面变色，分层进入煲仔饭程序，完成后确认鸡鱼熟透。 | `poultry_fully_cooked`，74°C；来源为 FoodSafety.gov `S-SAFETY-TEMPERATURES-1`。 | 保留鸡肉先炒、蒸架/鸡肉盘分层和咸鲭鱼边界；不把分层流程改成普通电饭煲同锅直投。 |
| `zojirushi-pad-thai-shrimp-mixed-rice` | Zojirushi 官方页给出 12 oz 生虾；生虾、鸡蛋和蔬菜在独立煎锅炒至完全熟透，完成后拌入电饭煲米饭。 | `shellfish_fully_cooked`，虾肉呈珍珠白或白色且不透明；来源为 FoodSafety.gov `S-SAFETY-TEMPERATURES-1`。 | 保留另锅炒虾、后拌入和花生/鱼露等过敏原边界，不改成电饭煲内锅生虾炊煮。 |
| `toshiba-hk-chicken-scallop-porridge-pc48drshk` | Toshiba 香港官方页明确将生鸡肉与米、干贝同放 PC-48DRSHK(K) 内锅，使用 Quick Porridge 20 分钟；水量同时写 6 杯与补至水位 4，原方鸡肉量只写“1/2”无单位。 | `poultry_fully_cooked`，74°C；来源为 FoodSafety.gov `S-SAFETY-TEMPERATURES-1`。 | 只补禽肉终点；液体矛盾、鸡肉数量缺单位和电压力锅型号边界原样保留，不晋升 `executable`。 |

## 验证

- r209 专项测试：2/2 通过。
- 三条均保持 `recipe_fact_checked`，无新 canonical、无 executable 晋升。
- 安全终点只挂到明确对应的禽肉或虾，不把页面程序时长当作温度证据。
