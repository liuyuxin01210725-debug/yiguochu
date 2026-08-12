# r186 禽肉安全终点小批

- 基线：r185 / 923 条；当前：r186 / 923 条。
- 新增 canonical：0；新增 executable：0；仅回填 4 条既有 `recipe_fact_checked` 的禽肉安全终点。

## 回填

1. `tiger-duck-matsutake-rice`：生鲜鸭腿切丁后进入 Tiger 炊込み，挂 `poultry_fully_cooked` 74°C。
2. `maff-hyogo-aromatic-takikomi`：鸡胸切块与米和液体同入燃气灶锅，挂 `poultry_fully_cooked` 74°C。
3. `instant-pot-one-pot-chicken-brown-rice`：去骨鸡肉在压力锅 30 分钟前入锅，挂 `poultry_fully_cooked` 74°C；保留自然泄压和取出回锅。
4. `illinois-extension-arroz-con-pollo`：鸡块先煎至金黄，米饭阶段后回锅，挂 `poultry_fully_cooked` 74°C；保留普通煎锅 staged 流程。

四条均追加同一 `S-SAFETY-TEMPERATURES-1`，安全来源只承载禽肉 74°C 终点；不把原菜的程序、外锅/另锅阶段或“熟透”文字替代温度证据。其余数量、液体、时间和机型字段不变。
