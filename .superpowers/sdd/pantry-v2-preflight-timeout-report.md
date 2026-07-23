# Pantry Planner V2 Preflight: Python Parity Timeout

## Scope

Stabilize the Python parity test harness only. No product code, recipe data, planner behavior, or assertions changed.

## RED evidence (recorded clean-baseline failure)

Before this change, `node --test tools/tests/*.test.mjs` produced 426 passes and one failure: `Python matches approved ingredient, advance-prep, and soy-protein validation boundaries` in `tools/tests/recipe-parity.test.mjs`.

The Python `spawnSync` returned `status: null` because its 30,000 ms timeout elapsed while the complete suite contended for Node, Python, and Chrome processes. The same focused test passed in 3.4 seconds when run independently. This demonstrates a load-induced test-infrastructure timeout, not a failed product assertion.

## GREEN change

Changed only `tools/tests/recipe-parity.test.mjs`:

- Raised the `runPython()` deadlock guard from 30 seconds to 90 seconds.
- Updated the adjacent comment to state that full-suite process contention can exceed 30 seconds and that the limit remains a deadlock guard, not a product latency gate.

## GREEN verification

Commands run after the change:

```sh
node --test --test-name-pattern='Python matches approved ingredient, advance-prep, and soy-protein validation boundaries' tools/tests/recipe-parity.test.mjs
node --test tools/tests/recipe-parity.test.mjs
```

Both commands passed. The focused target passed independently, and the complete parity suite passed with the widened deadlock guard.

## Files changed

- `tools/tests/recipe-parity.test.mjs`
- `.superpowers/sdd/pantry-v2-preflight-timeout-report.md`

## Self-review

- The sole executable change is the timeout constant and its adjacent explanatory comment.
- Test assertions, fixtures, production code, data, and planner design are unchanged.
- The 90-second limit still terminates genuinely stuck Python child processes while accommodating documented full-suite process contention.

## Concerns

This does not make the test faster; it intentionally trades faster detection of a truly wedged parity child process for avoiding a documented false timeout under concurrent suite load. If the suite later exceeds this guard consistently, investigate process contention rather than treating the guard as a product-performance target.
