import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const corpusUrl = new URL('../data/direct-recommend-shadow-v1.json', import.meta.url);

test('direct recommendation shadow corpus fixes exactly thirty real journeys', () => {
  const corpus = JSON.parse(fs.readFileSync(corpusUrl, 'utf8'));
  assert.equal(corpus.schema_version, 1);
  assert.equal(corpus.journeys.length, 30);
  assert.equal(new Set(corpus.journeys.map(journey => journey.id)).size, 30);
  for (const journey of corpus.journeys) {
    assert.match(journey.id, /^dr-shadow-\d{2}$/u);
    assert.equal(journey.mode, 'recommend');
    assert.ok(['normal', 'quick', 'fresh', 'batch'].includes(journey.intent));
    assert.ok(Number.isInteger(journey.servings) && journey.servings >= 1);
    assert.ok(Array.isArray(journey.prefer_use));
    assert.ok(Array.isArray(journey.dislikes));
    assert.equal(typeof journey.expect, 'object');
    assert.ok(Object.keys(journey.expect).length > 0);
  }
  assert.deepEqual(corpus.journeys[4].prefer_use, ['虾仁', '玉米']);
  assert.equal(corpus.journeys[18].intent, 'quick');
  assert.equal(corpus.journeys[26].prefer_use.length, 20);
  assert.equal(corpus.journeys[28].expect.swap, 'same_or_better_promise');
  assert.equal(corpus.journeys[29].expect.swap, 'no_alternative_plan');
});

test('shadow score flags a legacy apparent win that depends on an extra major ingredient', async () => {
  const { scoreShadowJourney } = await import('../run-direct-recommend-shadow.mjs');
  const score = scoreShadowJourney({
    journey: {
      id: 'fixture',
      prefer_use: ['番茄', '鸡蛋'],
      expect: { minimum_used: 2 },
    },
    v2: {
      candidate_count: 1,
      recognized_count: 2,
      best_used_count: 2,
      submitted_count: 2,
      extra_major_items: [],
      state_transitions: [],
      safety_failures: [],
    },
    legacy: {
      best_used_count: 2,
      extra_major_items: ['鸡肉'],
      state_transitions: [],
      safety_failures: [],
    },
  });
  assert.equal(score.coverage_ratio, 1);
  assert.equal(score.legacy_best_used_count, 2);
  assert.deepEqual(score.extra_major_items, []);
  assert.equal(score.review_required, true);
  assert.match(score.review_reasons.join(' '), /legacy.*extra_major/u);
});

test('the full thirty-journey shadow has no automatic hard-gate failure', async () => {
  const { runDirectRecommendShadow } = await import('../run-direct-recommend-shadow.mjs');
  const summary = await runDirectRecommendShadow();
  assert.equal(summary.journey_count, 30);
  assert.equal(summary.hard_failure_count, 0, JSON.stringify(summary.hard_failure_ids));
  assert.ok(summary.results.every(result => result.extra_major_items.length === 0));
  assert.ok(summary.results.every(result => result.state_transitions.length === 0));
  assert.ok(summary.results.every(result => result.safety_failures.length === 0));
  assert.ok(summary.results.every(result => result.expectation_failures.length === 0));
  assert.ok(summary.review_required_count > 0, 'legacy disputes must stay visible for human review');
});

test('preview gate percentile uses the sorted one-based ninety-fifth sample', async () => {
  const { percentile } = await import('../run-direct-recommend-preview-gate.mjs');
  const values = Array.from({ length: 100 }, (_, index) => 100 - index);
  assert.equal(percentile(values, 50), 50);
  assert.equal(percentile(values, 95), 95);
  assert.equal(percentile(values, 100), 100);
});

test('preview gate rejects build mismatch, non-json, malformed json and server errors', async () => {
  const { runPreviewGate } = await import('../run-direct-recommend-preview-gate.mjs');
  const json = (body, status = 200, contentType = 'application/json') => new Response(
    typeof body === 'string' ? body : JSON.stringify(body),
    { status, headers: { 'Content-Type': contentType } },
  );
  const plan = {
    status: 'ready',
    candidate_plans: [{ plan: { plan_id: 'fixture', planned_prefer_use: [{ raw: '鸡蛋' }] } }],
  };

  await assert.rejects(
    runPreviewGate({
      url: 'https://preview.example',
      buildId: 'wanted',
      samples: 1,
      warmups: 0,
      fetchImpl: async () => json({ status: 'ok', buildId: 'other', plannerRollout: 'direct-recommend' }),
    }),
    /build_id_mismatch/u,
  );

  for (const badResponse of [
    () => json('<html>edge error</html>', 200, 'text/html'),
    () => json('{broken', 200),
    () => json({ code: 'worker_error' }, 503),
  ]) {
    let calls = 0;
    await assert.rejects(
      runPreviewGate({
        url: 'https://preview.example',
        buildId: 'wanted',
        samples: 1,
        warmups: 0,
        fetchImpl: async () => {
          calls += 1;
          if (calls === 1) return json({ status: 'ok', buildId: 'wanted', plannerRollout: 'direct-recommend' });
          return badResponse();
        },
      }),
      /preview_gate_failed/u,
    );
  }

  let calls = 0;
  const summary = await runPreviewGate({
    url: 'https://preview.example',
    buildId: 'wanted',
    samples: 2,
    warmups: 1,
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) return json({ status: 'ok', buildId: 'wanted', plannerRollout: 'direct-recommend' });
      return json(plan);
    },
  });
  assert.equal(summary.samples, 2);
  assert.equal(summary.bad_json, 0);
  assert.equal(summary.non_json, 0);
  assert.equal(summary.server_errors, 0);
});
