import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildRuntimeCoverageResults, validateRuntimeCoverageResults } from '../lib/runtime-coverage-results.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const matrix = read('runtime-coverage-matrix.v1.json');
const authority = read('runtime-authority.v1.json');

test('coverage results are a separate not-observed registry, not execution evidence', () => {
  const results = buildRuntimeCoverageResults({ matrix, authority });
  assert.equal(results.scope, 'runtime-coverage-results');
  assert.equal(results.counts.total, 101);
  assert.equal(results.counts.observed, 0);
  assert.equal(results.counts.not_observed, 101);
  assert.ok(results.scenarios.every(row => row.observed === false && row.result_status === 'not_observed'));
  assert.ok(results.scenarios.every(row => row.authority_mode === 'shadow_preview'));
});

test('coverage result validation rejects a fabricated pass', () => {
  const results = buildRuntimeCoverageResults({ matrix, authority });
  assert.deepEqual(validateRuntimeCoverageResults(results, { matrix, authority }), []);
  const broken = structuredClone(results);
  broken.scenarios[0].observed = true;
  broken.scenarios[0].result_status = 'passed';
  assert.match(validateRuntimeCoverageResults(broken, { matrix, authority }).join('\n'), /deterministic build/u);
});
