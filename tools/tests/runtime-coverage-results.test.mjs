import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildRuntimeCoverageResults, validateRuntimeCoverageResults } from '../lib/runtime-coverage-results.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const matrix = read('runtime-coverage-matrix.v1.json');
const authority = read('runtime-authority.v1.json');
const runtimeCatalog = read('generated/runtime-one-pot-catalog.v1.json');

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

test('catalog-enforced coverage fails closed with a structured empty-catalog/no-candidate result', () => {
  const enforced = { ...authority, mode: 'catalog-enforced' };
  const results = buildRuntimeCoverageResults({ matrix, authority: enforced, runtimeCatalog });

  assert.deepEqual(results.authority_status, {
    mode: 'catalog-enforced',
    authority_mode: 'catalog_enforced',
    catalog_version: authority.catalog_version,
    authorized: false,
    code: 'runtime_catalog_empty',
    eligible: 0,
  });
  assert.deepEqual(results.execution, {
    mode: 'catalog_enforced',
    status: 'blocked',
    code: 'runtime_catalog_empty',
    observed: false,
  });
  assert.equal(results.counts.blocked, 101);
  assert.equal(results.counts.observed, 0);
  assert.ok(results.scenarios.every(row => (
    row.result_status === 'blocked'
      && row.observed === false
      && row.blocker_codes.includes('runtime_catalog_empty')
      && row.blocker_codes.includes('no_candidate')
  )));
});

test('shadow preview records candidate and contract projections without claiming execution', () => {
  const results = buildRuntimeCoverageResults({ matrix, authority, runtimeCatalog });
  const tiger = results.scenarios.find(row => row.scenario_id === 'rice_meal:RM-344-source-tiger-pork-bamboo-rice');

  assert.equal(results.authority_status.code, 'shadow_preview_only');
  assert.equal(results.execution.status, 'dry_run');
  assert.equal(results.execution.observed, false);
  assert.deepEqual(tiger.candidates.first, { variant_id: 'source-tiger-pork-bamboo-rice' });
  assert.deepEqual(tiger.candidates.all, {
    recipe_ids: [],
    template_ids: [],
    variant_ids: ['source-tiger-pork-bamboo-rice'],
  });
  assert.deepEqual(tiger.ingredients.used, tiger.expected.used_raw);
  assert.deepEqual(tiger.ingredients.unused, tiger.expected.unused_raw);
  assert.deepEqual(tiger.ingredients.unused_reasons, tiger.expected.reason_codes);
  for (const field of ['quantity', 'liquid', 'safety']) {
    assert.equal(tiger.contracts[field].status, 'not_observed');
    assert.equal(tiger.contracts[field].value, null);
  }
  assert.equal(tiger.observed, false);
  assert.equal(tiger.result_status, 'not_observed');
  assert.ok(tiger.blocker_codes.includes('not_observed'));
  assert.equal(results.counts.passed, 0);
});

test('catalog-enforced coverage fails closed on a stale catalog version', () => {
  const enforced = { ...authority, mode: 'catalog-enforced', catalog_version: 'stale-catalog' };
  const results = buildRuntimeCoverageResults({ matrix, authority: enforced, runtimeCatalog });
  assert.equal(results.authority_status.code, 'runtime_catalog_version_mismatch');
  assert.equal(results.execution.status, 'blocked');
  assert.equal(results.counts.blocked, matrix.counts.total);
  assert.ok(results.scenarios.every(row => row.blocker_codes.includes('runtime_catalog_version_mismatch')));
});
