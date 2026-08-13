import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildSourceBackedRuntimeCatalog,
  validateSourceBackedRuntimeCatalog,
} from '../lib/source-backed-runtime-catalog.mjs';

const sourceCatalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const executionLibrary = JSON.parse(fs.readFileSync(new URL('../data/source-backed-execution-library.v1.json', import.meta.url), 'utf8'));
const formalizationLedger = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formalization-ledger.v1.json', import.meta.url), 'utf8'));

test('runtime catalog projects every source card without promoting research into production', () => {
  const runtime = buildSourceBackedRuntimeCatalog({ sourceCatalog, executionLibrary, formalizationLedger });

  assert.equal(runtime.scope, 'source-backed-runtime-catalog');
  assert.equal(runtime.entries.length, 923);
  assert.deepEqual(runtime.counts, {
    total: 923,
    preview_only: 34,
    research_only: 888,
    blocked: 1,
    formal_active: 0,
    kitchen_observed: 0,
  });
  assert.ok(runtime.entries.every(entry => entry.execution_ref && entry.formalization_ref));
  assert.ok(runtime.entries.every(entry => entry.planner_runtime_eligible === false));
  assert.equal(runtime.entries.filter(entry => entry.release_state === 'preview_only').length, 34);
  assert.equal(runtime.entries.filter(entry => entry.release_state === 'blocked').length, 1);
});

test('runtime catalog validator rejects stale references and accepts deterministic output', () => {
  const runtime = buildSourceBackedRuntimeCatalog({ sourceCatalog, executionLibrary, formalizationLedger });

  assert.deepEqual(validateSourceBackedRuntimeCatalog(runtime, { sourceCatalog, executionLibrary, formalizationLedger }), []);

  const broken = structuredClone(runtime);
  broken.entries[0].execution_ref = 'missing-execution-entry';
  assert.match(
    validateSourceBackedRuntimeCatalog(broken, { sourceCatalog, executionLibrary, formalizationLedger }).join('\n'),
    /execution_ref does not match/u,
  );
});

test('runtime catalog keeps release state separate from the 72-recipe formal Planner', () => {
  const runtime = buildSourceBackedRuntimeCatalog({ sourceCatalog, executionLibrary, formalizationLedger });
  const sourceCompletePreview = runtime.entries.filter(entry => entry.release_state === 'preview_only');

  assert.ok(sourceCompletePreview.length > 0);
  assert.ok(sourceCompletePreview.every(entry => entry.formal_planner_status === 'not_in_formal_72'));
  assert.ok(runtime.entries.every(entry => entry.kitchen_observed === false));
});
