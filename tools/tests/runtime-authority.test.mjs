import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RUNTIME_AUTHORITY_MODES,
  normalizeRuntimeAuthority,
  decideRuntimeAuthority,
  buildRuntimeCandidateAuthority,
  validateRuntimeCandidateAuthority,
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

test('candidate authority binds recipe variant, catalog version, and contract hash', () => {
  const entry = {
    recipe_id: 'fixture-recipe',
    identity_level: 'canonical',
    identity_signature: { required_canonical_ids: ['raw-rice'] },
    naming: { canonical_name: '夹具菜' },
    ratio_rule_ids: ['fixture-ratio-v1'],
    technique_graph: [{ phase: 1, action_code: 'cook' }],
  };
  const variant = {
    variant_id: 'fixture-variant',
    identity_impact: 'named_variant',
    naming: { display_name: '夹具菜替换版' },
    substitutions: [{ slot_id: 'vegetable', replaces_canonical_ids: ['cabbage'], allowed_canonical_ids: ['bok-choy'] }],
  };
  const runtimeEntry = { ...entry, recipe_runtime_catalog_version: 'runtime-catalog-v1', approved_variants: [variant] };
  const authority = buildRuntimeCandidateAuthority(runtimeEntry, variant, 'runtime-catalog-v1');
  assert.deepEqual(authority, {
    candidate_id: 'fixture-recipe#fixture-variant',
    recipe_id: 'fixture-recipe',
    variant_id: 'fixture-variant',
    catalog_version: 'runtime-catalog-v1',
    contract_hash: authority.contract_hash,
  });
  assert.match(authority.contract_hash, /^[a-f0-9]{64}$/u);
  assert.deepEqual(validateRuntimeCandidateAuthority({ runtime_candidate_authority: authority }, {
    ...runtimeEntry,
  }), []);

  const forged = structuredClone(authority);
  forged.contract_hash = '0'.repeat(64);
  assert.match(validateRuntimeCandidateAuthority({ runtime_candidate_authority: forged }, {
    ...runtimeEntry,
  }).join('\n'), /contract_hash/u);
});
