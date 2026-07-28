import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';

const DEFAULT_JOURNEYS = JSON.parse(
  fs.readFileSync(new URL('./data/direct-recommend-shadow-v1.json', import.meta.url), 'utf8'),
).journeys;

export function percentile(values, percent) {
  if (!Array.isArray(values) || !values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const rank = Math.max(1, Math.ceil((Number(percent) / 100) * sorted.length));
  return sorted[Math.min(sorted.length, rank) - 1];
}

function requestBody(journey) {
  return {
    schema_version: 2,
    planner_version: 'pantry-planner-v2',
    constraints: {
      mode: journey.mode,
      intent: journey.intent,
      servings: journey.servings,
      must_use: [],
      prefer_use: journey.prefer_use,
      dislikes: journey.dislikes,
      current_plan_id: null,
      recent_plan_ids: [],
      decision: null,
    },
  };
}

async function readJsonResponse(response, counters) {
  if (response.status >= 500) counters.server_errors += 1;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    counters.non_json += 1;
    return null;
  }
  try {
    return await response.json();
  } catch (_error) {
    counters.bad_json += 1;
    return null;
  }
}

export async function runPreviewGate({
  url,
  buildId,
  samples = 100,
  warmups = 5,
  fetchImpl = globalThis.fetch,
  journeys = DEFAULT_JOURNEYS,
} = {}) {
  if (!url || !buildId || !Number.isInteger(samples) || samples < 1) {
    throw new Error('invalid_preview_gate_arguments');
  }
  const base = String(url).replace(/\/+$/u, '');
  const healthCounters = { bad_json: 0, non_json: 0, server_errors: 0 };
  const healthResponse = await fetchImpl(`${base}/health`, { headers: { Accept: 'application/json' } });
  const health = await readJsonResponse(healthResponse, healthCounters);
  if (!health || health.buildId !== buildId) throw new Error('build_id_mismatch');
  if (health.plannerRollout !== 'direct-recommend') throw new Error('planner_rollout_mismatch');
  if (healthCounters.bad_json || healthCounters.non_json || healthCounters.server_errors) {
    throw new Error('preview_health_failed');
  }

  const counters = { bad_json: 0, non_json: 0, server_errors: 0 };
  const latencies = [];
  const total = warmups + samples;
  for (let index = 0; index < total; index += 1) {
    const journey = journeys[index % journeys.length];
    const started = performance.now();
    let response;
    try {
      response = await fetchImpl(`${base}/plan-meal`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody(journey)),
      });
    } catch (_error) {
      counters.server_errors += 1;
      if (index >= warmups) latencies.push(performance.now() - started);
      continue;
    }
    await readJsonResponse(response, counters);
    const elapsed = performance.now() - started;
    if (index >= warmups) latencies.push(elapsed);
  }
  const summary = {
    build_id: health.buildId,
    planner_rollout: health.plannerRollout,
    planner_version: health.plannerVersion || null,
    template_catalog_version: health.templateCatalogVersion || null,
    taxonomy_version: health.ingredientTaxonomyVersion || null,
    ratio_catalog_version: health.ratioRulesVersion || null,
    samples,
    warmups,
    p50_ms: percentile(latencies, 50),
    p95_ms: percentile(latencies, 95),
    max_ms: percentile(latencies, 100),
    bad_json: counters.bad_json,
    non_json: counters.non_json,
    server_errors: counters.server_errors,
  };
  if (summary.bad_json || summary.non_json || summary.server_errors || summary.p95_ms >= 2000) {
    const error = new Error('preview_gate_failed');
    error.summary = summary;
    throw error;
  }
  return summary;
}

export function parseArgs(argv) {
  const options = { samples: 100, warmups: 5 };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === '--url') options.url = value;
    else if (flag === '--build-id') options.buildId = value;
    else if (flag === '--samples') options.samples = Number(value);
    else if (flag === '--warmups') options.warmups = Number(value);
    else throw new Error(`unknown_argument:${flag}`);
    index += 1;
  }
  if (!Number.isInteger(options.samples) || options.samples < 1
      || !Number.isInteger(options.warmups) || options.warmups < 0) {
    throw new Error('invalid_sample_count');
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const summary = await runPreviewGate(options);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    if (error?.summary) process.stderr.write(`${JSON.stringify(error.summary, null, 2)}\n`);
    process.stderr.write(`${error?.message || error}\n`);
    process.exitCode = 1;
  });
}
