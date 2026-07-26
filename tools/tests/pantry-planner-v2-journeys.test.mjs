import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

import { HANDLED_EXPECTATION_KEYS, runPantryPlannerV2Journeys } from '../run-pantry-planner-v2-journeys.mjs';

const corpus = JSON.parse(fs.readFileSync(new URL('../data/pantry-planner-v2-journeys.json', import.meta.url), 'utf8'));

test('corpus maps spec journeys 1-84 exactly once', () => {
  assert.equal(corpus.journeys.length, 84);
  assert.deepEqual(corpus.journeys.map(entry => entry.spec_number), Array.from({ length: 84 }, (_, index) => index + 1));
  assert.equal(new Set(corpus.journeys.map(entry => entry.id)).size, 84);
  assert.deepEqual(
    Object.fromEntries(Object.entries(Object.groupBy(corpus.journeys, entry => entry.category)).map(([key, value]) => [key, value.length])),
    { taxonomy_shape:8, recommend:3, pantry_coverage:8, decision:5, intent_swap:7, model_boundary:7, version_legacy:6, regional_capability:40 },
  );
  for (const entry of corpus.journeys) {
    assert.ok(entry.request && entry.expect && Array.isArray(entry.expect.status), `${entry.id} complete request/expect`);
    assert.equal(entry.plan_deepseek_max, 0, `${entry.id} planner cost cap`);
    assert.ok(entry.generate_deepseek_max === 0 || entry.generate_deepseek_max === 1, `${entry.id} generation cost cap`);
    assert.equal(typeof entry.frontend_required, 'boolean', `${entry.id} frontend flag`);
    assert.ok(Object.hasOwn(entry, 'model_mutation'), `${entry.id} mutation flag`);
    if (!entry.request.legacy) {
      assert.equal(entry.request.schema_version, 2);
      assert.equal(entry.request.planner_version, 'pantry-planner-v2');
      for (const field of ['mode','intent','servings','must_use','prefer_use','dislikes','current_plan_id','recent_plan_ids','decision']) {
        assert.ok(Object.hasOwn(entry.request.constraints, field), `${entry.id} missing constraints.${field}`);
      }
    }
  }
});

test('every corpus expectation is backed by a runner assertion', () => {
  const declared = new Set(corpus.journeys.flatMap(entry => Object.keys(entry.expect)));
  assert.deepEqual([...declared].sort(), [...HANDLED_EXPECTATION_KEYS].sort());
});

test('mutation probes prove planner, generation and frontend assertions are behavioral', async () => {
  const journey = id => structuredClone(corpus.journeys.find(entry => entry.id === id));

  const plannerMutation = journey('J12');
  plannerMutation.expect.submitted_must_count = 999;
  await assert.rejects(
    runPantryPlannerV2Journeys({ journeys:[plannerMutation] }),
    /J12[\s\S]*(?:999|submitted)/,
  );

  const generationMutation = journey('J33');
  generationMutation.model_mutation = null;
  await assert.rejects(
    runPantryPlannerV2Journeys({ journeys:[generationMutation] }),
    /J33[\s\S]*generate/i,
  );

  const frontendMutation = journey('J29');
  frontendMutation.expect.visible_copy = '这句文案不可能出现';
  await assert.rejects(
    runPantryPlannerV2Journeys({ journeys:[frontendMutation] }),
    /J29[\s\S]*regular expression/i,
  );
});

test('all 84 planner v2 journeys pass their public-boundary invariants', async () => {
  const result = await runPantryPlannerV2Journeys();
  assert.equal(result.passed, 84);
});

test('CLI executes the gate and emits its stable summary line', () => {
  const result = spawnSync(process.execPath, ['tools/run-pantry-planner-v2-journeys.mjs'], {
    cwd: new URL('../..', import.meta.url), encoding: 'utf8', timeout: 30000,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stderr, '', 'successful CLI must not emit expected-rejection noise');
  assert.match(result.stdout, /(?:^|\n)84\/84 planner v2 journeys passed(?:\n|$)/);
});
