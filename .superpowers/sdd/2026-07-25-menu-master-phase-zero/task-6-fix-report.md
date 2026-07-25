# Task 6: Python parity JSON transport

## Scope

Only test infrastructure changed. The Worker, frontend, planner, `ai_proxy.py`, recipe assets, and product behavior are untouched.

## RED

Added `tools/tests/python-json-call.test.mjs` before the helper existed. It launches a real temporary Python script that opens `sys.argv[1]`, decodes the JSON payload, and returns both the payload and the request path. The initial command:

```sh
node --test tools/tests/python-json-call.test.mjs
```

failed deterministically with `ERR_MODULE_NOT_FOUND` for `tools/tests/helpers/python-json-call.mjs` (0 pass, 1 fail). This proves the test exercises the new transport boundary rather than grepping source text.

## GREEN

Added `tools/tests/helpers/python-json-call.mjs`. `runPythonJson()` creates a unique OS temporary directory, writes `request.json`, appends that path to the Python argv, returns the normal `spawnSync` result, and removes the directory in `finally` (including a failed JSON write or child launch).

`recipe-parity.test.mjs` now makes its 44 `pythonCall()` requests through that helper. Its Python harness reads `json.load(open(sys.argv[1]))`; all pre-existing non-JSON `runPython()` calls retain their former command, stdout/stderr, environment, and timeout behavior. The parity calls retain their 90 second timeout and their existing status/stderr assertions.

## Verification

- `node --test tools/tests/python-json-call.test.mjs` — PASS, 1/1. The test verifies both JSON round-trip and that neither the request file nor its parent directory exists after the call.
- `node --test tools/tests/recipe-parity.test.mjs` — completed without an EOF/stderr/status failure.
- `node --test --test-reporter=dot tools/tests/pantry-planner-v2-identity.test.mjs tools/tests/recipe-parity.test.mjs` — completed without an EOF wait. The recipe-parity worker was CPU-active while planning rather than blocked reading stdin.
- `node --test tools/tests/*.test.mjs` — executed with a 240 second cap through a quiet wrapper; all test processes exited before the cap. The desktop runner truncated the final child-process summary while preserving intermediate passing output, so its exact aggregate pass count was not available from this run.
- `git diff --check` — PASS.

## Cleanup verification

The focused test checks cleanup using the exact path returned by Python. During a separately interrupted overlapping test run, one temporary request directory remained because the process was terminated before JavaScript could execute `finally`; it was removed after confirming no test process referenced it. Normal completed calls leave no matching directory.

## Concerns

The transport fix removes the stdin EOF dependency identified in the diagnosis. It cannot provide cleanup after an uncatchable process kill; normal return, thrown child-launch error, and timeout return all traverse `finally`. The desktop test-output bridge can detach from a long-running child before its final summary, so the report records that limitation rather than inventing a total count.
