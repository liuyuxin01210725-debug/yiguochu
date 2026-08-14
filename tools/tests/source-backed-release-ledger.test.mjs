import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildSourceBackedReleaseLedger,
  validateSourceBackedReleaseLedger,
} from '../lib/source-backed-release-ledger.mjs';

const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const inputs = {
  sourceCatalog: readJson('source-backed-one-pot-recipes.v1.json'),
  executionLibrary: readJson('source-backed-execution-library.v1.json'),
  formalizationLedger: readJson('source-backed-formalization-ledger.v1.json'),
};

test('the old runtime catalog path is only a small deprecated alias manifest', () => {
  const alias = readJson('source-backed-runtime-catalog.v1.json');
  assert.deepEqual(alias, {
    schema_version: 1,
    scope: 'deprecated-alias',
    deprecated: true,
    replacement: 'tools/data/source-backed-release-ledger.v1.json',
  });
});

test('release ledger is the authoritative source-backed release projection', () => {
  const ledger = buildSourceBackedReleaseLedger(inputs);
  assert.equal(ledger.scope, 'source-backed-release-ledger');
  assert.equal(ledger.release_ledger_version, 'source-backed-release-ledger-v1-20260813-c11');
  assert.equal(ledger.deprecated_alias, 'tools/data/source-backed-runtime-catalog.v1.json');
  assert.deepEqual(validateSourceBackedReleaseLedger(ledger, inputs), []);
});

test('release ledger validator rejects an alias or entry drift', () => {
  const ledger = buildSourceBackedReleaseLedger(inputs);
  const broken = structuredClone(ledger);
  broken.entries[0].release_state = 'production';
  assert.match(validateSourceBackedReleaseLedger(broken, inputs).join('\n'), /does not match deterministic build/u);
});
