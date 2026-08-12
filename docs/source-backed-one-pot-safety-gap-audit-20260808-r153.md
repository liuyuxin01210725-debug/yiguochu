# 安全终点缺口审计（r153：于田电饭锅抓饭／羊肉分类）

> 审计日期：2026-08-08
> 目录基线：`source-backed-one-pot-v1-20260808-global-r152`（923 条；安全终点覆盖 104/923）
> 本轮性质：只复核既有 `yutian-electric-cooker-lamb-pilaf`，不修改主 JSON、CSV、运行时代码或 UI。
> 结论：**不回填安全终点，保持 `safety_endpoints: []`**。FoodSafety.gov 的羊肉分类与于田原文的“切小块”之间没有可直接对齐的证据。
## 判定口径

本轮要求两个事实同时闭合，才可以新增 `lamb_fully_cooked`：

1. 原始菜谱必须明确 200 克羊肉的原料状态和形态，至少能证明是生鲜的整块肌肉切块（而不是只写“羊肉”，也不能把“切小块”自行升级为部位或整块分类）。
2. 同一份 FoodSafety.gov 来源必须对该形态给出可引用的安全终点，包括适用类别、温度和需要保留的静置要求。

现有目录的安全终点代码、食材分类和来源边界不变；本轮不把炖煮时长、电饭锅焖饭时长或“肉熟了”这种自然语言替代温度证据。

## 原始页面核验

### 于田县政府：于田抓饭做法

直达来源：[于田县人民政府·于田抓饭做法](https://www.xjyt.gov.cn/changyou/chi/2021-06-07/251.html)

2026-08-08 通过原始 HTML 重新打开并定位到以下段落（HTML 行 179–195）：

- 食材列写“大米 适量”“羊肉 200克”“胡萝卜 2根”“洋葱 1个”“葡萄干 一小把”“油 50克”等。
- 步骤写“大米用水泡半个小时，**羊肉切小块**”；之后“放入羊肉翻炒”，再“倒水没过羊肉煮大约十分钟”。
- 之后把菜、肉、汤和葡萄干倒入电饭锅，米铺在上面，焖约 20 分钟。

这些文字能证明：页面给了羊肉 200 克，并要求把羊肉切小块后翻炒、煮约十分钟，再转入电饭锅。页面没有写“鲜羊肉”“生羊肉”、具体部位（腿、排、里脊等），也没有写“整块肌肉”或“绞肉”。“切小块”是处理动作，不是 FoodSafety.gov 的安全类别名称；不能把它擅自归类为 steaks/roasts/chops，也不能据此排除绞肉或预处理状态。

### FoodSafety.gov：安全最低内部温度

直达来源：[FoodSafety.gov · Cook to a Safe Minimum Internal Temperature](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)

页面正文的 `Safe Minimum Internal Temperature Chart for Cooking` 对羊肉给出两条不同类别：

- `Beef, bison, veal, goat, and lamb — Steaks, roasts, chops`: **145°F (63°C)，Rest time: 3 minutes**。
- `Ground meat and sausage`: **160°F (71°C)**。

同一页面没有 `diced lamb`、`lamb chunks` 或“切小块羊肉”的独立类别。因此，现有来源无法在 63°C（整块）与 71°C（绞肉）之间做出有出处的选择。不能用“通常抓饭用羊肉块”的常识替代形态证据。

## r153 裁定

| recipe_id | 已证明事实 | 缺口 | endpoint 决定 |
|---|---|---|---|
| `yutian-electric-cooker-lamb-pilaf` | 于田政府原文给出羊肉 200 克；写明“切小块”、翻炒、加水煮约 10 分钟，再转电饭锅焖约 20 分钟 | 未明确生/鲜状态、部位或整块肌肉类别；FoodSafety.gov 未列“切小块”类别，无法确定采用 63°C＋静置 3 分钟还是 71°C | **不回填；保持 `safety_endpoints: []`** |

不新增 `S-SAFETY-TEMPERATURES-1` 的羊肉定位，不修改 `source-backed-one-pot-recipes.v1.json` 的版本号或条目。该菜继续保持 `recipe_fact_checked`；本轮不影响其大米适量、液体对象不清和电饭锅分阶段边界。

## 后续闭合条件

只有取得以下任一直接证据，才可重新送 r153 TDD：

1. 于田原始来源或同一版本的官方配料说明明确写“生鲜羊肉/羊腿（整块肌肉）”，并能把“切小块”绑定到该部位；随后引用 FoodSafety.gov 的 63°C＋3 分钟定位。
2. 来源明确写羊肉为绞肉/碎肉；随后引用 FoodSafety.gov 的 71°C 定位。
3. 找到政府或公共食品安全来源明确覆盖“羊肉块/炖羊肉块”的独立终点，并记录适用形态、温度和静置要求。

在上述证据出现前，不得用步骤中的“煮十分钟”“焖二十分钟”或成品外观代替安全终点，也不得把其他羊肉菜或其他器具版本的安全事实拼接进本条。
