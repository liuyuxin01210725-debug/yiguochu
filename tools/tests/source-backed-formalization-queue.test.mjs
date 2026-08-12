import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildSourceBackedFormalizationLedger } from '../lib/source-backed-formalization-ledger.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('formalization ledger exposes an auditable queue for every execution card', () => {
  const ledger = buildSourceBackedFormalizationLedger(catalog);

  assert.equal(ledger.counts.total, 923);
  assert.equal(ledger.counts.execution_complete, 923);
  assert.equal(ledger.counts.execution_unblocked_complete, 922);
  assert.equal(ledger.counts.execution_safety_blocked, 1);
  assert.deepEqual(ledger.counts.queue_priority, {
    P0_source_contract: 138,
    P1_complete_research_card: 738,
    P2_estimated_draft: 35,
    P3_identity_or_incomplete: 11,
    blocked_safety: 1,
  });

  for (const row of ledger.records) {
    assert.ok(row.execution_readiness, row.recipe_id);
    assert.ok(row.execution_readiness.fields.quantities, row.recipe_id);
    assert.ok(row.execution_readiness.fields.liquid, row.recipe_id);
    assert.ok(row.execution_readiness.fields.steps, row.recipe_id);
    assert.ok(row.execution_readiness.fields.time, row.recipe_id);
    assert.ok(row.formalization_queue, row.recipe_id);
    assert.ok(['P0_source_contract', 'P1_complete_research_card', 'P2_estimated_draft', 'P3_identity_or_incomplete', 'blocked_safety'].includes(row.formalization_queue.priority), row.recipe_id);
    assert.equal(row.formalization_queue.trial_packet.status, 'pending');
    assert.ok(row.formalization_queue.trial_packet.required_observations.includes('measured_ingredients'), row.recipe_id);
    assert.ok(row.formalization_queue.trial_packet.required_observations.includes('planner_journey_regression'), row.recipe_id);
  }

  const pufferfish = ledger.records.find(row => row.recipe_id === 'yangzhong-pufferfish-eight-pot-rice');
  assert.equal(pufferfish.formalization_queue.priority, 'blocked_safety');
  assert.equal(pufferfish.execution_readiness.unblocked, false);
  assert.match(pufferfish.formalization_queue.next_action, /禁止据此采购|专业去毒/u);
});
