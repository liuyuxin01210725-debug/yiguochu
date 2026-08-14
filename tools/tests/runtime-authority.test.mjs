import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RUNTIME_AUTHORITY_MODES,
  normalizeRuntimeAuthority,
  decideRuntimeAuthority,
} from '../lib/runtime-authority.mjs';

test('runtime authority defaults to explicit shadow mode and never authorizes research cards', () => {
  const authority = normalizeRuntimeAuthority({
    runtimeAuthorityMode: 'shadow',
    runtimeCatalogVersion: 'runtime-one-pot-catalog-v1-test',
  });
  assert.deepEqual(authority, {
    mode: 'shadow',
    catalog_version: 'runtime-one-pot-catalog-v1-test',
    source: 'build_metadata',
  });
  assert.deepEqual(decideRuntimeAuthority(authority, {
    status: 'ok',
    entries: 72,
    plannerRuntimeEligible: 0,
    productionApproved: 0,
  }), {
    mode: 'shadow',
    authorized: false,
    code: 'shadow_preview_only',
    eligible: 0,
  });
});

test('catalog-enforced mode fails closed when catalog is unavailable or empty', () => {
  assert.deepEqual(normalizeRuntimeAuthority({ runtimeAuthorityMode: 'catalog-enforced' }), {
    mode: 'catalog-enforced',
    catalog_version: null,
    source: 'build_metadata',
  });
  assert.deepEqual(decideRuntimeAuthority({ mode: 'catalog-enforced', catalog_version: null }, null), {
    mode: 'catalog-enforced',
    authorized: false,
    code: 'runtime_catalog_unavailable',
    eligible: 0,
  });
  assert.deepEqual(decideRuntimeAuthority({ mode: 'catalog-enforced', catalog_version: 'v1' }, {
    status: 'ok', entries: 72, plannerRuntimeEligible: 0, productionApproved: 0,
  }), {
    mode: 'catalog-enforced',
    authorized: false,
    code: 'runtime_catalog_empty',
    eligible: 0,
  });
});

test('runtime authority rejects unknown modes and production approval claims', () => {
  assert.deepEqual(RUNTIME_AUTHORITY_MODES, ['shadow', 'catalog-enforced']);
  assert.throws(() => normalizeRuntimeAuthority({ runtimeAuthorityMode: 'llm' }), /runtime authority mode/u);
  assert.deepEqual(decideRuntimeAuthority({ mode: 'catalog-enforced', catalog_version: 'v1' }, {
    status: 'ok', entries: 1, plannerRuntimeEligible: 1, productionApproved: 0,
  }), {
    mode: 'catalog-enforced',
    authorized: false,
    code: 'production_approval_required',
    eligible: 1,
  });
});
