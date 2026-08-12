# 厂商官方一锅米饭候选批次 r118

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260807-national-r117`（864 条）
结果：`source-backed-one-pot-v1-20260807-national-r118`（867 条）

## 本批新增

本批从 r115 厂商 intake 中挑出 3 条当前目录未收录、官方页面直接打开且流程边界清楚的候选；全部保持 `recipe_fact_checked`，不晋升 `executable`：

1. **Carrot Rice / 胡萝卜饭** — [Tiger Corporation USA](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/carrot-rice/)。页面证明糙米、胡萝卜、洋葱和高汤粉入 Tiger 内锅，糙米 2 水位线、Brown 程序；未给份数与总时长，页面称配饭/像一顿饭，营养只记碳水和膳食纤维，不宣称完整蛋白主餐。
2. **Saffron Rice / 藏红花饭** — [Tiger Corporation USA](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/saffron-rice/)。页面给 3–4 份、茉莉米 1 杯、鸡汤 1¾ 杯、洋葱/蒜/油/藏红花、Plain 程序，出锅加奶酪焖 5 分钟；来源没有总调理分钟数，作为调味米/配饭候选，不宣称完整蛋白主餐。
3. **炊き込みごはん（市販の素使用）/ 市售料包炊饭** — [Panasonic Cooking](https://panasonic.jp/cooking/recipe/autocooker/1276.html)。页面限定 NF-AC1000/NF-AC700 与 Kitchen Pocket 菜单，3 合、白米 450g、调味液与水合计 650mL、约 55 分钟；依赖用户自备市售料包，不宣称具体地域菜，也不外推普通电饭煲参数。

## 证据与边界

- 三条来源均 `access_status: opened`、`evidence_tier: 3`，并在 `evidence_locator` 标出官方正文事实范围；没有用搜索摘要替代原页。
- 厂商页面只证明厂商适配、食材量、水位/液体、程序和流程，不证明地域传统。
- Carrot Rice 与 Saffron Rice 的配蛋白不足或未给完整主餐结构；营养字段保守标为 C，不在轮替架中伪装成均衡主餐。
- Panasonic 条目中的“市售炊饭料包”是可变外部成分，料包内部配料和过敏原必须以用户包装为准；不能把料包名称扩写为固定菜谱。
- 三条均保留缺失时间/份数/机型边界，禁止从同品牌其他页面推算。

## TDD 与门禁

先写失败测试并确认 r117/864 下失败，再写入目录；通过后执行：

```text
node --test tools/tests/source-backed-one-pot-batch-r118-manufacturer.test.mjs
node tools/build-source-backed-one-pot-catalog.mjs --write
node tools/build-source-backed-one-pot-catalog.mjs --check
node tools/check-source-backed-one-pot-catalog.mjs
node tools/check-recipes.mjs
git diff --check
```

本批未改运行时、UI、Planner，不部署，不晋升 `executable`。
