# Public Flow Stop-Loss Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the public product to one simple, trusted recipe recommendation flow while retaining Pantry Planner V2 only as a localhost lab.

**Architecture:** The public CTA calls the existing trusted-recipe `/generate-meal` path directly for both empty and non-empty pantry input. Planner V2 endpoints, assets, and internal UI remain available only on localhost with `?planner_v2=1`; production and Preview do not expose the planner mode switch.

**Tech Stack:** Single-file browser UI (`index.html`), Node test runner, VM frontend contract harness, Cloudflare Worker legacy generation endpoint.

## Global Constraints

- Do not add recipes, templates, accounts, user profiles, nutrition tracking, multi-agent features, or new product modes.
- Do not modify Planner V2 algorithms, taxonomy, Ratio DSL, or recipe data.
- Do not deploy production.
- Keep the existing PR as Draft.
- Write and observe failing tests before every production-code behavior change.

---

### Task 1: Lock the public surface to direct recommendation

**Files:**
- Modify: `tools/tests/frontend-recipe-contract.test.mjs`
- Modify: `index.html`

**Interfaces:**
- Produces: `plannerLabEnabled(): boolean`
- Produces: `runPrimaryFlow(): Promise<void>`
- Preserves: `runPlannerFlow()` for the localhost lab and existing endpoint tests

- [x] **Step 1: Write failing tests**

Add tests proving that Preview/production hides the mode selector and per-item delete controls, while localhost `?planner_v2=1` still exposes the complete Planner V2 controls.

- [x] **Step 2: Verify RED**

Run:

```bash
node --test tools/tests/frontend-recipe-contract.test.mjs
```

Expected: FAIL because the public surface still renders `帮我清库存`, `清爽些`, and `data-del-myfood`.

- [x] **Step 3: Implement the minimal surface gate**

Add a localhost-only `plannerLabEnabled()` check. Render only normal/quick/batch intents in public, keep all mode/intent controls in the local lab, remove common-food delete buttons, and change copy to say pantry input is optional and will not be forced into a dish.

- [x] **Step 4: Verify GREEN**

Run the same focused test and confirm it passes.

### Task 2: Bypass Planner V2 in the public CTA

**Files:**
- Modify: `tools/tests/frontend-recipe-contract.test.mjs`
- Modify: `index.html`

**Interfaces:**
- `runPrimaryFlow()` validates the pantry count, calls `runPlannerFlow()` only in the localhost lab, and otherwise calls `generateLegacyRecipeFallback()`.

- [x] **Step 1: Write failing tests**

Add public empty-pantry and populated-pantry journeys that expect exactly one `/generate-meal` call and zero `/plan-meal` or `/generate-plan` calls. Add a localhost lab journey that still enters `/plan-meal`.

- [x] **Step 2: Verify RED**

Run the focused frontend contract test. Expected: public journeys still call `/plan-meal`.

- [x] **Step 3: Implement the minimal routing change**

Route the main generate action and generic retry action through `runPrimaryFlow()`. Leave explicit V2 replan, decision, swap, and generation handlers unchanged for the lab.

- [x] **Step 4: Verify GREEN**

Run the focused frontend contract test and confirm the public and lab call paths are distinct.

### Task 3: Preserve the visible cooking intent in legacy generation

**Files:**
- Modify: `tools/tests/frontend-recipe-contract.test.mjs`
- Modify: `index.html`

**Interfaces:**
- Legacy request `constraints.purpose` uses `state.profile.intent` when present and falls back to old `purpose` profiles.
- Mapped dish `purpose` uses the same rule so quick-result validation remains consistent.

- [x] **Step 1: Write failing tests**

Add a journey setting `intent:"batch"` and assert the `/generate-meal` request contains `constraints.purpose:"batch"`.

- [x] **Step 2: Verify RED**

Run the focused frontend test. Expected: request still contains `purpose:"quick"`.

- [x] **Step 3: Implement the intent bridge**

Use `intent || purpose || "quick"` in both the legacy request body and mapped dish.

- [x] **Step 4: Verify GREEN**

Run the focused test and confirm the request and mapped dish remain aligned.

### Task 4: Full verification and Draft PR update

**Files:**
- Verify only; do not alter recipe or Planner V2 data.

- [x] **Step 1: Run all tests**

```bash
node --test tools/tests/*.test.mjs
```

- [x] **Step 2: Run release gates**

```bash
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
python3 -m py_compile ai_proxy.py
node tools/build-dist.mjs --out-dir dist --build-id "stop-loss-preview"
node --test tools/tests/build-dist.test.mjs
```

- [x] **Step 3: Review scope**

Confirm `tools/data/recipe-library.json`, template assets, taxonomy, Ratio DSL, and production deployment state are unchanged.

- [ ] **Step 4: Commit and push**

Commit only the stop-loss code, tests, and plan on the existing Draft PR branch. Do not merge and do not deploy.
