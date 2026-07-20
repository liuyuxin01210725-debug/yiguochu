import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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
