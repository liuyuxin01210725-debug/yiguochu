import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

test('local proxy does not trust opaque null browser origins by default', () => {
  const result = spawnSync('python3', [
    '-c',
    'import json, ai_proxy; print(json.dumps(sorted(ai_proxy.ALLOWED_ORIGINS)))',
  ], { cwd: repoRoot, encoding: 'utf8', timeout: 15000 });
  assert.equal(result.status, 0, result.stderr);
  const origins = JSON.parse(result.stdout.trim());
  assert.equal(origins.includes('null'), false);
});

test('local planner bridge invocation is fixed-argv stdin JSON with no shell execution', () => {
  const source = fs.readFileSync(new URL('../../ai_proxy.py', import.meta.url), 'utf8');
  assert.match(source, /subprocess\.run\s*\(/);
  assert.match(source, /input\s*=/);
  assert.doesNotMatch(source, /shell\s*=\s*True/);
  assert.match(source, /planner-v2-local-bridge\.mjs/);
});

test('local generate-plan performs no-cost preflight before persistent rate accounting', () => {
  const source = fs.readFileSync(new URL('../../ai_proxy.py', import.meta.url), 'utf8');
  const handler = source.slice(source.indexOf('def _handle_generate_plan'));
  assert.ok(handler.indexOf("'/plan-meal'") >= 0, 'generate-plan must preflight through planner');
  assert.ok(handler.indexOf('_rate_ok(') > handler.indexOf("'/plan-meal'"), 'preflight must happen before rate accounting');
  assert.ok(handler.lastIndexOf("'/generate-plan'") > handler.indexOf('_rate_ok('), 'paid generation follows one rate check');
});
