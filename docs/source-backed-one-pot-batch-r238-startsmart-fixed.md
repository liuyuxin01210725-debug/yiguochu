# r238：StartSmart 机构批次定量回填

基线：`source-backed-one-pot-v1-20260808-global-r237` / 923 条。

本批不新增 canonical、不晋升 executable，只回填香港卫生署 StartSmart 原页已经明确写出的 60 人份及数值食材。官方页面：[三色豆蛋絲豆腐菜粒焗紅米飯](https://www.startsmart.gov.hk/en/photogalleryDetail.aspx?RecipeID=102)。

## 回填条目

`startsmart-three-bean-egg-tofu-red-rice`（三色豆蛋絲豆腐菜粒焗紅米飯）回填：60 人；鸡蛋 17 只、杂菜粒 1 磅、芥兰 3 斤、豆腐 5 砖、白米 12 杯、红米 2 杯、粟米油 3 汤匙、盐 3 茶匙。清水仍是来源的“适量”，不建立 `liquid_contract`；页面给出预备 60 分钟、烹煮 45 分钟，但这是分段机构流程，不把两段相加冒充单一电饭煲总时长。

原页步骤是红米浸泡后，白米/红米先入电饭煲煮熟，再把蛋丝、杂菜、芥兰、豆腐和盐放入锅中慢火焗熟。因此保留 `traditional_vessels` 的锅/焗炉边界、`cooker_adaptation.status=not_adapted` 与熟饭二次烹边界，不改写为全程生米一锅或家庭份量。

## 验证

- 先在 r237 基线运行专项测试，版本断言按预期失败；回填后 r238 专项 2/2 通过。
- 继续运行目录构建、目录/菜谱门禁与 `git diff --check`。
