# C32 Runtime Coverage Runner / Results

## Boundary

`runtime-coverage-matrix.v1.json` remains a scenario registry. It is not a
Planner execution log. Candidate joins are made only from structured recipe and
variant fields; unknown IDs are retained in `joins.candidate_refs.unknown_ids`
and mark the join `invalid`.

`runtime-coverage-results.v1.json` is a separate deterministic projection. It
records authority state, first/all candidate references, requested/used/unused
ingredients, unused reason codes, and quantity/liquid/safety contracts. Every
row remains `observed: false`; the registry cannot grant production evidence.

## Authority modes

- `shadow`: the runner emits `execution.status = dry_run` and
  `authority_status.code = shadow_preview_only`. Candidate and contract values
  are projections from the scenario registry only.
- `catalog-enforced`: the runner reads the generated runtime catalog. With the
  current `planner_runtime_eligible = 0`, it fails closed with
  `authority_status.code = runtime_catalog_empty`; every row is `blocked` with
  `runtime_catalog_empty` and `no_candidate`.

The runner never calls Planner/Worker and therefore never fabricates `passed`.
When a real browser/Worker adapter exists, its observed evidence must be stored
as a separate explicit observation artifact before a result can be promoted.

## Reproduction

```bash
node tools/build-runtime-coverage-matrix.mjs
node tools/build-runtime-coverage-results.mjs
node tools/run-runtime-coverage.mjs --authority-mode shadow
node tools/run-runtime-coverage.mjs --authority-mode catalog-enforced
node --test tools/tests/runtime-coverage-matrix.test.mjs tools/tests/runtime-coverage-results.test.mjs
```
