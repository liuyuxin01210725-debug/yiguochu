# Final review fixes — Menu Master Phase Zero

Date: 2026-07-25

## Scope

Implemented the four Important and three Minor final-review fixes without changing the Worker, frontend, Planner, templates, taxonomy, Ratio DSL, recipe library, or research-candidate content.

## TDD record

RED observed before each implementation change:

- The builder lacked the versioned baseline exports; a temporary library missing one recipe made `build-menu-master --write` succeed with the old hard-coded 72/24/72 summary.
- `buildMenuMaster()` threw for a null recipe entry, and the aggregate gate tried rendering null research/verification entries, producing a `TypeError` instead of source-validation errors.
- A `status: "pass"` verification record containing only expected data passed validation.
- Unknown taxonomy roles, including `意式烩饭米`, were omitted from the derived ingredient boundary.
- `docs/menu-master.csv` had no path-specific RFC4180 CR-at-EOL whitespace rule.

GREEN verified:

- `menu-master-baseline.v1.json` locks the ordered production ID/status list, research IDs, and Phase Zero summary. Build and aggregate paths fail closed with an explicit intentional-baseline-update message.
- Build and aggregate gates validate source ledgers before deriving or rendering artifacts; null recipe/research/verification entries now report structured errors.
- Non-pending verification states require actual planner evidence plus a matching human review; pending entries can omit evidence but any supplied evidence is still schema-validated.
- Unknown core roles are preserved and emitted as `ingredients.unknown_role`, and Markdown/CSV label them `待核实角色`.
- The Markdown explicitly says coverage/verification status is registration coverage, not a pass result. CSV remains CRLF/RFC4180 and `.gitattributes` uses `whitespace=cr-at-eol`.
- The Python JSON helper now has behavior tests for non-zero children, serialization throws, and timeouts, including request-file cleanup.

## Verification

Passed 83 focused tests:

```text
node --test tools/tests/menu-master-builder.test.mjs tools/tests/menu-verification-matrix.test.mjs tools/tests/menu-master-artifacts.test.mjs tools/tests/recipe-library.test.mjs tools/tests/python-json-call.test.mjs
```

Also passed:

```text
node tools/build-menu-master.mjs --write
node tools/build-menu-master.mjs --check
node tools/check-recipes.mjs
git diff --check
git diff --cached --check
```

## Commit

`bbd21a0 fix: harden menu master review gates`

## Remaining concerns

- The verification ledger is intentionally still empty: 72 menus remain pending and no live execution or human review is implied.
- `unknown_role` is deliberately conservative. It exposes taxonomy gaps for human review rather than guessing a staple or another role; resolving a role requires a separate, approved taxonomy change.
- Updating the production composition or status now requires an explicit baseline review and intentional baseline-data update.
