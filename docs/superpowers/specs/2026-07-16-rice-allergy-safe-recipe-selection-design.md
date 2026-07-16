# Rice Allergy Safe Recipe Selection Design

Date: 2026-07-16
Status: Approved in conversation; awaiting written-spec review

## Context

The controlled rice-allergen validator now detects rice-food leaks reliably, but the three-call live gate showed that detection alone does not produce a safe user result:

- a rice-based trusted recipe can still be selected when the declared dislike is a cooked-rice form;
- a non-rice curry base can still prompt the model to add rice because the global generation contract requires every meal to contain a staple;
- after a generation error, the frontend currently displays a static emergency recipe that contains rice and was not checked against the user's allergy.

In the latest live gate:

- 3/3 responses returned controlled rice foods;
- 3/3 responses were correctly flagged;
- 0/3 responses were semantically safe for the declared rice allergy.

The root cause therefore spans recipe eligibility, meal-completeness grounding, model prompting, and frontend failure handling.

## Goal

When a user declares a controlled common-rice allergy:

1. select only a manually approved trusted recipe that is already a complete main meal without rice;
2. tell the model exactly why that base is complete and forbid it from adding any extra staple;
3. stop before calling DeepSeek if no such trusted base remains after all dislikes are applied;
4. never show an unverified static fallback dish.

Safety takes priority over using pantry ingredients. A safe recipe may use few or none of the user's pantry items.

## Non-goals

- Do not build a universal allergen-safe recipe system in this task.
- Do not automatically infer that every rice-free recipe is a complete main meal.
- Do not invent substitutions, quantities, or nutritional values.
- Do not convert a rice recipe into a non-rice recipe through model creativity.
- Do not add new approved recipes or expand beyond the current 12-recipe Phase A library.
- Do not change the controlled rice token family or its existing exclusions.
- Do not deploy preview or production.

## Approaches considered

### Explicit trusted eligibility profile plus safe-stop behavior — selected

Add manually reviewed recipe metadata for the bounded case `rice-allergy-complete-main`. Selection requires this profile whenever the controlled rice-allergy family is active. The profile carries a short completeness basis used in the trusted prompt.

Benefits:

- eligibility is explicit and reviewable;
- the model receives a concrete reason not to add rice;
- future approved recipes can join the safe pool without changing selector logic;
- no-candidate behavior is deterministic and does not spend a DeepSeek call.

Trade-off: the initial safe pool contains only one recipe, so some users will receive a safe-stop response instead of a menu.

### Filter only recipes whose core contains rice — rejected

This removes biryani and other rice bases but does not solve the curry case. The global prompt still asks for a staple, so the model can add rice to an otherwise rice-free base.

### Prompt reinforcement without eligibility metadata — rejected

The existing prompt already says that a rice allergy must not produce rice wording. The model violated that instruction in every live case.

### Deterministically rewrite rice into another staple — rejected

The approved recipe library does not authorize arbitrary staple substitution. Rewriting would violate the rule that replacements must be explicit and reviewed.

## Trusted recipe eligibility metadata

Add an optional `constraint_profiles` array to an approved recipe. Each entry is a structured object:

```json
{
  "id": "rice-allergy-complete-main",
  "basis": "红扁豆提供蛋白，土豆作为主食，番茄作为蔬菜；这道菜无需搭配米饭或其他额外主食即可成餐。"
}
```

Rules:

- `constraint_profiles` is optional for ordinary recipes;
- each entry must be an object with exactly a recognized `id` and a non-empty `basis`;
- duplicate profile IDs on one recipe are invalid;
- unknown profile IDs are invalid;
- the profile is a human-reviewed product qualification, not an inference made at runtime;
- adding the profile to a future recipe requires recipe-library tests and manual review of the recipe's core, optional ingredients, substitutions, technique, ratio rules, and safety rules.

For the initial Phase A pool, only:

`lentil-potato-tomato-curry`

receives the profile.

Its completeness basis is:

- red lentils provide the main protein;
- potato provides the staple component;
- tomato provides the vegetable and sauce base;
- no additional rice, rice product, noodle, bread, or other staple is required.

No other current base recipe receives this qualification:

- all rice, congee, risotto, and rice-soup recipes contain rice directly;
- shakshuka and Texas chili do not have an approved complete-staple structure in the current source metadata;
- Indonesian chicken curry is a dish base that the model repeatedly completed with rice.

## Controlled activation

The safe profile is required only when the existing controlled rice-allergen family is active. Activation remains bounded to the already approved forms, including:

- `大米过敏`;
- `白米过敏`;
- `米饭过敏`;
- `糙米过敏`;
- an existing recipe alias resolving to `大米`.

Unrelated dislikes do not activate this profile.

The recipe alias table also adds:

`扁豆` → `红扁豆`

This ensures that a general lentil dislike blocks the initial safe recipe instead of treating `红扁豆` as unrelated. Existing aliases for `西红柿` and the exact core name `土豆` continue to cover tomato and potato constraints.

## Selection behavior

The Worker selector remains authoritative.

For each request:

1. normalize pantry and dislikes through the existing recipe canonicalizer;
2. determine whether the controlled rice-allergy family is active;
3. if inactive, preserve current candidate behavior exactly;
4. if active, discard every recipe that lacks the `rice-allergy-complete-main` profile;
5. apply all existing fixed-core dislike and explicit-substitution checks;
6. score pantry, purpose, recent family, and recent recipe signals only among the remaining safe candidates;
7. allow selected pantry to be empty and place incompatible pantry items in `unused_pantry`;
8. if no candidate remains, return a deterministic safe-stop error before building a prompt or calling DeepSeek.

Examples:

- rice allergy plus pantry `鸡肉、洋葱` → select the lentil-potato-tomato curry, use none of those pantry items, and mark them unused;
- rice allergy plus pantry `红扁豆、土豆、番茄` → select the same base and use those pantry items;
- rice allergy plus `红扁豆过敏`, `扁豆过敏`, `土豆过敏`, or `番茄过敏` → no candidate;
- no rice allergy → preserve the existing ranking and candidate diversity behavior.

## Trusted grounding and prompt behavior

The selected profile travels internally with the selection. It is not accepted from the model and is not copied into public source metadata.

The trusted grounding block adds:

```text
受控完整主餐资格: rice-allergy-complete-main
完整性依据: 红扁豆提供蛋白，土豆作为主食，番茄作为蔬菜；这道菜无需搭配米饭或其他额外主食即可成餐。
稻米过敏安全模式: 严格沿用这张基础菜谱。不得添加或建议搭配任何额外主食，尤其不得出现大米、米饭、粥、米粉、米线、河粉、年糕、饭团或任何饭类菜名。
```

This resolves the conflict with the global “must contain a staple” requirement:

- the profile basis explicitly identifies potato as the staple;
- the model must not add an extra staple;
- fixed core and approved substitutions remain the only allowed recipe structure.

The existing final preflight and controlled rice validator remain unchanged as defense in depth.

## No-safe-recipe response

If the rice-allergy profile is active and no qualified recipe survives other dislikes:

- Worker returns HTTP `422`;
- Python local proxy returns HTTP `422`;
- error code is `no_safe_recipe`;
- message is `暂时没有符合这些过敏或忌口条件的可信无米主餐`;
- no DeepSeek request is made;
- the upstream daily generation budget is not consumed for this deterministic rejection.

The selection/no-candidate check must therefore occur before `budgetConsume()`, which represents an upstream generation allowance. The existing per-IP request limiter may still count the HTTP request. Ordinary malformed-library failures remain `recipe_library_unavailable`.

## Frontend safe-stop experience

The current static emergency dish is not allergy-aware and contains rice. It must never be shown while the controlled rice-allergy family is active.

When rice allergy is active, any generation failure that does not produce a validated safe dish uses a dedicated stop screen:

- title: `暂时没有安全的无米方案`;
- explanation: `为了不把不合适的主食硬塞进菜谱，这次没有展示应急菜谱。可以调整忌口或现有食材后再试。`;
- primary action: `调整食材或忌口`;
- the action returns to the editable profile screen;
- no dish name, ingredients, steps, nutrition, “开始做”, or static emergency reference is rendered.

This stop-only behavior applies to:

- `no_safe_recipe`;
- `unsafe_recipe` after the allowed generation attempts;
- network, timeout, malformed-response, or upstream failures while rice allergy is active.

When rice allergy is not active, existing generic fallback behavior remains unchanged in this task.

## Data flow

```text
User constraints
  -> sanitize and activate controlled rice allergy
  -> require trusted rice-allergy-complete-main profile
  -> apply existing core/dislike/substitution checks
     -> no candidate: 422 no_safe_recipe, no DeepSeek call
     -> safe candidate:
          trusted completeness grounding
          -> DeepSeek generation
          -> normalize and safety repair
          -> controlled rice validation
             -> clean: return meal
             -> flagged: frontend retries within existing cap
             -> still unsafe/failure: stop-only screen, no static dish
```

## Worker and Python parity

`worker/src/worker.js` remains authoritative. Python mirrors:

- profile schema consumption;
- rice-allergy activation at selection time;
- profile filtering before scoring;
- selected profile and completeness basis;
- no-candidate behavior;
- prompt grounding text;
- `no_safe_recipe` error semantics.

Complete selector results and generated prompt text must match, not only the chosen recipe ID.

## Required tests

### Recipe-library schema

- the lentil curry has exactly one `rice-allergy-complete-main` profile with the approved basis;
- unknown profile IDs fail validation;
- missing or blank basis fails validation;
- malformed profile containers and duplicate IDs fail without throwing;
- no other current recipe carries the profile;
- the alias `扁豆` resolves to `红扁豆`.

### Worker selection

- `大米过敏`, `白米过敏`, `米饭过敏`, and `糙米过敏` select only the lentil curry;
- rice allergy plus irrelevant pantry may select the lentil curry with zero used pantry items;
- rice allergy plus exact core pantry uses the matching items;
- rice allergy plus `红扁豆过敏`, `扁豆过敏`, `土豆过敏`, or `番茄过敏` yields zero candidates;
- unrelated allergy preserves existing selection behavior;
- the rice-free curry and chili bases without the profile are excluded.

### Prompt and integration

- trusted grounding contains the exact profile ID, basis, and no-extra-staple directive;
- model-injected profile fields are ignored;
- Worker returns `422 no_safe_recipe` without an upstream call when the safe pool is empty;
- budget consumption does not occur for that deterministic no-candidate result;
- a safe selected meal that adds rice still receives hard allergen flags.

### Python parity

- selected recipe, score, used/unused pantry, active profile, and grounding text match Worker;
- local endpoint returns `422 no_safe_recipe` before a DeepSeek call;
- malformed profiles and aliases behave identically.

### Frontend

- `no_safe_recipe` is non-retryable;
- active rice allergy plus any generation failure renders the stop-only screen;
- the stop-only screen contains no static dish, ingredients, nutrition, or cooking action;
- `调整食材或忌口` returns to the editable profile;
- non-rice failures preserve the existing fallback screen.

## Acceptance and release gates

1. Recipe-library, Worker, Python, and frontend tests pass.
2. Existing food, recipe, static-regression, ingredient correspondence, and high-risk cooking checks remain green.
3. The original user-owned dirty-file patch-id remains unchanged.
4. Run exactly three bounded no-client-retry live calls on an owned port:
   - `大米过敏` with irrelevant pantry;
   - `白米过敏` with corn control;
   - `米饭过敏` with millet control.
5. Each live response must:
   - use `lentil-potato-tomato-curry`;
   - contain a trusted pairing basis;
   - contain no controlled rice-food forms;
   - contain no validation flags;
   - preserve corn and millet as unused rather than misclassifying them.
6. Separately verify one no-candidate request returns `422 no_safe_recipe` with zero DeepSeek calls.
7. Any rice leak, false positive, unsafe static fallback, or no-candidate upstream call keeps product release blocked.
8. Even if this gate passes, the existing six Phase A known gaps, 30-case live review, mobile review, and user approval still block production.
