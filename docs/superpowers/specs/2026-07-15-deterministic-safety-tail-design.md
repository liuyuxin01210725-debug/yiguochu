# Deterministic Safety Tail Design

Date: 2026-07-15
Status: Approved direction; written specification pending final user review

## Context

The recipe Prompt and validator now catch substantially more cross-field and food-safety defects, but live generation remains stochastic. In the targeted six-case run at `e437a60`, one response still left chicken at surface-color only. Another response described an ordinary egg as both cooked through and runny. The egg contradiction is now detected by the reviewed validator at `5d57406`, but detection alone does not give the user a safe method.

The next change must improve the returned cooking method without adding another DeepSeek request, inventing ingredients or quantities, or weakening validation.

## Goals

- Repair only an explicit `high_risk_not_cooked:<ingredient>` finding for an ingredient already present in the generated ingredient table.
- Add an actionable, achieved safety endpoint for that exact ingredient in the same cooking vessel.
- Preserve the one-call DeepSeek path.
- Preserve Worker/Python behavior parity.
- Revalidate the modified method and keep any failure that remains.
- Leave nutrition, grams, recipe grounding, source metadata, and every non-safety validation finding unchanged.

## Non-goals

- Do not add oil, salt, water, stock, sauces, spices, or any other missing ingredient.
- Do not invent grams or nutrition values.
- Do not repair allergens, multiple vessels, advance preparation, time limits, or ingredient/step mismatches in this change.
- Do not suppress validation flags or claim that an unsafe response passed.
- Do not retry DeepSeek, change temperature, deploy a preview, or touch production.

## Approaches considered

### Deterministic safety tail — selected

Use the reviewed validator as the trigger. For each already-listed high-risk ingredient that lacks a cooked endpoint, append a same-pot instruction to continue heating it to a safe final state, then revalidate.

Benefits: zero extra API cost, deterministic output, no nutrition invention, and a narrow safety-only mutation. The trade-off is slightly more mechanical wording.

### Lower model temperature — deferred

This may improve instruction adherence but remains probabilistic and may reduce useful variety. It does not guarantee that unsafe wording is corrected.

### One controlled retry — last resort

A retry could repair broader cross-field defects, but increases calls and token cost and may still return another invalid result. It remains out of scope until deterministic options are exhausted.

## Data flow

1. Receive and normalize one DeepSeek response as today.
2. Run `validateGroundedMeal()` / `validate_grounded_meal()` before attaching final metadata.
3. Extract and deduplicate only `high_risk_not_cooked:<ingredient>` findings whose exact ingredient name is present in `ingredients`.
4. If none exist, leave `meal.steps` unchanged and continue through the existing metadata path.
5. Build one safety-tail instruction covering the flagged ingredients:
   - raw poultry or pork: continue heating in the original pot until cooked through and the center is no longer pink;
   - seafood: continue heating in the original pot until fully cooked;
   - ordinary egg or egg mixture: continue heating in the original pot until the egg is cooked through, white and yolk are fully set, and it is not runny.
6. If the meal has fewer than four steps, append one new final step. Otherwise append the instruction to the existing last step so the repair never increases the method beyond four steps.
7. Re-run the same validator. Final response metadata receives the post-repair flags. A flag that remains is preserved; the repair never overrides validator output.
8. Continue the existing authoritative Taiwan/local nutrition enrichment unchanged.

## Repair boundaries

- Use the exact ingredient-table name in the appended instruction so mention ownership is unambiguous.
- Mention the existing pot explicitly; never introduce a second vessel or appliance.
- Add no time estimate and no new quantity. The instruction is endpoint-based: continue heating *until* safe.
- Combine multiple high-risk ingredients into one final safety step, while giving each ingredient its own endpoint phrase.
- Prepared products already exempted by the validator, such as chicken stock and century egg, never trigger repair.
- The helper may mutate only `meal.steps`. It must not change `ingredients`, `prep_minutes`, nutrition fields, grounding metadata, or source records.
- The helper must be idempotent: a second call after successful repair adds no duplicate safety text.

## Failure handling and observability

- If the repaired method still fails validation, return the remaining `validation_flags`; do not silently pass it.
- If steps are missing or malformed after normalization, create at most one final safety step, then let existing validation report every other defect.
- Production logging may include only the count of repaired high-risk endpoints. Do not log user ingredients beyond the existing event fields and do not add a new public response field.

## Testing

TDD must cover Worker and Python parity:

- raw chicken with surface-color only gains an original-pot, cooked-through/no-pink endpoint and loses only its high-risk flag;
- contradictory ordinary egg wording gains a later egg-specific heating endpoint with fully set white and yolk and no runny center;
- seafood gets a fully cooked endpoint;
- two flagged high-risk ingredients are repaired in one final step;
- a safe meal is unchanged and no duplicate repair appears on a second pass;
- four existing steps remain four by extending the last step;
- missing oil, unused salt, allergen, or other flags are not repaired or removed;
- ingredient names, grams, nutrition, sources, and one-call request count remain unchanged;
- all existing validator adversarial tests continue to pass.

Required offline gates remain Worker syntax, Python compilation, food check, recipe check, the four Node suites, and static 100-case regression in both combined state A and isolated committed state T.

## Live validation and release gate

After code review, rerun one no-retry targeted sample using the same six case IDs and preserve every raw response. Expected evidence is that genuine missing poultry/egg endpoints are deterministically safe while salt, water, or other unrelated defects remain honestly flagged. Only after targeted improvement should a fresh 30-case run be considered.

Mobile verification and a non-main preview remain blocked until both machine and semantic live gates pass. Production `main` remains untouched without explicit user approval.
