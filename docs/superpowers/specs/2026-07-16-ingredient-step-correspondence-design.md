# Ingredient-Step Correspondence Design

Date: 2026-07-16
Status: Approved direction; written specification pending final user review

## Context

The deterministic safety tail is code-ready, but its six-case live run remains blocked by a separate consistency problem. Case 1 lists salt without using it and uses unlisted oil plus retained cooking water. Case 3 adds unlisted salt and pepper while also mentioning preparation water. Case 4 lists generic `油` and uses it correctly, but the validator reports missing cooking oil; the same method also adds unlisted retained water.

The prompt already asks for cross-field consistency. The root cause is the deterministic validator boundary: it checks only unlisted cooking oil, does not accept an ingredient named exactly `油`, and has no controlled reverse check for salt, pepper, or retained cooking water. Prompt wording alone therefore cannot act as a release gate.

## Goals

- Detect active use of unlisted cooking oil, salt, pepper, and retained cooking water.
- Accept generic `油` and approved named cooking oils as valid matches for a cooking-oil action.
- Exclude negated actions and non-input word forms from matching.
- Distinguish water retained in the meal from water used only for washing, rinsing, or soaking preparation.
- Keep Worker and local Python behavior identical.
- Strengthen the prompt's final preflight so the model sees the exact deterministic rule before returning JSON.
- Preserve the nutrition red line: never invent an ingredient row, grams, or nutrition values to make a response pass.

## Non-goals

- Do not auto-add or auto-delete ingredient rows.
- Do not infer salt, oil, pepper, or water quantities from vague phrases such as `适量` or `少许`.
- Do not change authoritative nutrition lookup, estimation labels, recipe sources, selection, scoring, or safety-tail endpoints.
- Do not build a general natural-language ingredient extractor in this phase.
- Do not add starch, sauces, sugar, or every possible seasoning to this controlled detector yet.
- Do not weaken existing ingredient-to-step, allergen, one-pot, time, or high-risk cooking checks.
- Do not deploy preview or production as part of implementation.

## Approaches considered

### Controlled prompt plus deterministic validator -- selected

Add a small, explicit table of four consumable groups and narrowly detect their active use. Reuse the existing response retry/fallback path when a generated meal remains inconsistent.

Benefits: deterministic release evidence, no invented grams, bounded false-positive work, and straightforward Worker/Python parity. The trade-off is that an invalid first generation can still require the existing retry or fallback.

### Prompt-only enforcement -- rejected

The current prompt already states bidirectional consistency, yet three of six live responses violated it. More emphasis may improve compliance but cannot prove correctness or protect the release gate.

### Deterministically add missing rows -- rejected

Adding water can sometimes use an explicit milliliter amount, but oil, salt, and pepper are often described as `适量` without grams. Filling rows would invent quantities, distort sodium or calories, and violate the nutrition data red line. Removing cooking actions would also alter the intended dish and taste.

## Controlled consumable groups

The validator recognizes four groups and emits the existing flag shape `step_ingredient_missing:<group>` when a positive step action has no compatible ingredient row.

1. Cooking oil
   - Ingredient matches: exact generic `油` plus the existing approved cooking-oil allowlist, including `烹调油`, `植物油`, `食用油`, `橄榄油`, and other listed cooking oils.
   - Step actions: the existing active add, pour, brush, retain-bottom-oil, and heat-oil patterns.
   - Flag: `step_ingredient_missing:烹调油`.
   - Exclusions remain: `酱油`, `油菜`, fish-oil supplements, and negated phrases such as `不加油`.
2. Salt
   - Ingredient matches: controlled exact salt forms such as `盐`, `食盐`, `海盐`, and `低钠盐` after benign form normalization.
   - Step actions: active add, sprinkle, mix in, or `加盐调味` wording.
   - Flag: `step_ingredient_missing:盐`.
   - Exclusions: `不加盐`, `无需放盐`, saline-like compounds, and descriptive taste words that are not addition actions.
3. Pepper
   - Ingredient matches: `胡椒`, `胡椒粉`, `黑胡椒`, `黑胡椒粉`, `白胡椒`, and `白胡椒粉`.
   - Step actions: active add, sprinkle, mix in, or `加胡椒调味` wording.
   - Flag: `step_ingredient_missing:胡椒`.
   - Exclusions: sweet pepper, chili pepper, pepper vegetables, and negated actions.
4. Retained cooking water
   - Ingredient matches: controlled exact forms such as `水`, `清水`, `饮用水`, `凉开水`, `温水`, and `热水`.
   - Step actions: water explicitly added, poured, or topped up into the cooking vessel, including intervening quantities such as `850毫升水`, `半杯水（约120ml）`, or `加水至...`.
   - Flag: `step_ingredient_missing:水`.
   - Exclusions: washing, rinsing, blanching then discarding, and soaking-only preparation water unless a later step explicitly retains or adds that water to the meal.

## Data flow

1. Normalize the DeepSeek response exactly as today.
2. Run the deterministic safety tail exactly as today; it may mutate only cooking steps for explicit high-risk endpoints.
3. Run the expanded `validateGroundedMeal()` / `validate_grounded_meal()` on the final steps.
4. For each controlled group, detect whether any step contains a positive active-use pattern.
5. Check whether the normalized ingredient names contain an approved matching form for that same group.
6. Add at most one stable flag per missing group. Preserve flag ordering and deduplicate through the existing set/list mechanism.
7. Return the flagged response through the existing frontend retry/fallback behavior. Do not mutate ingredient rows or nutrition.

## Prompt contract

Both the Worker prompt and Python local prompt must use the same concise final preflight:

- every cooking input must have a same-meaning ingredient row and numeric grams;
- explicitly re-scan cooking oil, salt, pepper, and water retained in the final meal;
- preparation-only wash/rinse/soak water does not need an ingredient row when discarded;
- if a consumable has no numeric grams, omit the action or regenerate the JSON rather than inventing a row outside the contract.

The prompt remains guidance. Only deterministic validation decides whether the response passes.

## Failure handling

- Missing controlled consumables remain hard `validation_flags`; they are never silently cleared.
- Existing valid flags, including unused listed salt, allergens, high-risk cooking, multiple vessels, and recipe anchoring, remain unchanged.
- The consistency validator never repairs nutrition or steps. Existing request retry/fallback behavior owns user-facing recovery.
- Malformed ingredient or step containers continue to be handled without throwing.

## Required tests

TDD must first reproduce the three preserved live cases:

- Case 1 yields `ingredient_missing_in_steps:盐`, `step_ingredient_missing:烹调油`, and `step_ingredient_missing:水`.
- Case 3 yields `step_ingredient_missing:盐` and `step_ingredient_missing:胡椒`, but no water flag for washing or soaking-only water.
- Case 4 yields only `step_ingredient_missing:水` from this consistency scope; exact ingredient `油` satisfies `锅中加油`.

Additional Worker and Python parity coverage must include:

- named oils and generic oil matching; soy sauce, oilseed rape, fish-oil supplements, and negated oil actions excluded;
- listed salt and pepper aliases passing; unlisted active additions failing; negated seasoning actions excluded;
- retained water additions with Arabic quantities, Chinese quantities, parentheses, and conjunctions failing when unlisted;
- wash, rinse, soak, blanch-and-discard, and drain-water preparation controls excluded;
- duplicate mentions yielding one stable flag;
- malformed values not throwing;
- prompt text parity and explicit retained-water wording.

Required offline gates are Worker syntax, Python syntax, food check, recipe check, all four Node suites, static 100-case regression, and `git diff --check`.

## Acceptance and release sequence

1. The three preserved live-response fixtures produce the exact expected controlled-consumable flags in Worker and Python.
2. All existing offline gates pass with no nutrition, recipe-library, or safety-tail regression.
3. Run a new six-case targeted DeepSeek sample with preserved request/raw/meta evidence and independent semantic review.
4. Only if the targeted sample is clean, run the required fresh 30-case live gate and complete the six known manual corpus reviews.
5. Verify mobile behavior and the `recipe-validation` non-main preview, including source/basis display and error recovery.
6. Production `main` remains prohibited until every Phase A exit condition passes and the user explicitly approves release.
