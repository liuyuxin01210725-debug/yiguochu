# M0 发布与真实旅程基线

日期：2026-08-13

## 构建与发布边界

- GitHub 工作分支：`codex/targeted-recipe-expansion`；production `main` 不在本次 Phase A 目标内。
- 静态构建入口：`node tools/build-dist.mjs --out-dir dist --build-id <ascii-build-id>`。
- Phase A 预览目标：Cloudflare Pages `recipe-validation` 分支；禁止把 Preview 验证结果当 production 批准。
- `dist/` 与 `worker/.wrangler/` 是派生/忽略产物，源代码和确定性 builder 才是仓库交付对象。

## 当前验证基线

- `node tools/check-recipes.mjs`：通过；报告 923 来源执行卡、72 Planner 基础菜谱、138 source-complete、785 research-only。
- `node tools/check-source-backed-one-pot-catalog.mjs --check`：通过，来源目录与派生 artifacts 一致。
- 稳定用户旅程回归：构建、Service Worker、资料库、canonical recipe、Cook Mode、首页轮换共 37/37 通过。
- Planner 旅程门仍由 `node tools/run-pantry-planner-v2-journeys.mjs` 和现有全量 Node 测试维护；来源卡健康不能替代 Planner/厨房门。

## 真实用户旅程边界

1. 首页 → 来源轮换卡：可打开 923 条来源卡。
2. 来源轮换卡 → `/cook/?id=...`：显示研究执行卡、步骤勾选和本地恢复。
3. 资料库 → `/recipes?id=...`：来源 id fallback 到完整来源详情；正式 recipe id 走正式页。
4. 来源详情 → `/source-recipes/`：回到资料库。
5. 旧 `.html?id` 链接由兼容路由处理，但新 UI 应只生成稳定无扩展路径。

## 发布门

- M0/M1 阶段只可发布 Preview，公开文案必须同时显示研究层、Preview 层和正式 Planner 层数字。
- 任何新增正式 Planner 菜谱必须通过来源合同、taxonomy、ratio、营养、安全、器具、替换、旅程和厨房观察门。
- 生产上线前需要浏览器真实点击、移动视口检查、离线恢复和至少 5 人厨房 Pilot；不能仅凭 Node 测试或 923 数量宣称完成。
