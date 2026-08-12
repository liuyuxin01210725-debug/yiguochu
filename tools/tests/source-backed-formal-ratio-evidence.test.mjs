import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildSourceBackedFormalRatioEvidence,
  validateSourceBackedFormalRatioEvidence,
  sourceBackedFormalRatioEvidenceTargetRecipeIds,
} from '../lib/source-backed-formal-ratio-evidence.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const evidence = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-ratio-evidence.v1.json', import.meta.url), 'utf8'));

test('formal ratio evidence stays source-exact and never becomes executable DSL', () => {
  const built = buildSourceBackedFormalRatioEvidence(catalog);
  assert.deepEqual(validateSourceBackedFormalRatioEvidence(evidence, catalog), []);
  assert.deepEqual(built, evidence);
  assert.equal(evidence.counts.total, sourceBackedFormalRatioEvidenceTargetRecipeIds.length);
  assert.ok(evidence.counts.source_bounded_non_executable >= 25);
  assert.equal(evidence.counts.candidate_evidence_only + evidence.counts.source_bounded_non_executable, evidence.counts.total);
  assert.deepEqual(sourceBackedFormalRatioEvidenceTargetRecipeIds.slice(-5), [
    'sdsu-easy-red-beans-rice',
    'urochester-smoky-hoppin-john',
    'firststeps-vegetable-biryani',
    'healthvermont-spinach-carrot-rice-pilaf',
    'ca-health-multigrain-congee',
  ]);
  assert.equal(evidence.policy.evidence_only, true);
  assert.equal(evidence.policy.does_not_activate_formal_planner, true);
  for (const entry of evidence.entries) {
    assert.ok(['candidate_evidence_only', 'source_bounded_non_executable'].includes(entry.compile_status));
    assert.equal(entry.executable, false);
    assert.ok(entry.source_contract_snapshot);
    assert.equal(Object.hasOwn(entry.source_contract_snapshot, 'fixed_batch'), true);
    assert.equal(Object.hasOwn(entry.source_contract_snapshot, 'liquid_contract'), true);
  }
});

test('formal ratio evidence rejects a source-contract mutation', () => {
  const broken = structuredClone(evidence);
  broken.entries[0].source_contract_snapshot.liquid_contract.amount.value += 1;
  assert.match(validateSourceBackedFormalRatioEvidence(broken, catalog).join('\n'), /source_contract_snapshot does not match source catalog/u);
});
