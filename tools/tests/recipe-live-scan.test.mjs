import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const script = fileURLToPath(new URL('../run-recipe-live-scan.mjs', import.meta.url));

test('live scan dry-run covers every production recipe without making a paid request', () => {
  const result = spawnSync(process.execPath, [script, '--dry-run', '--base-url', 'http://127.0.0.1:9'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /72 recipes queued/);
  assert.match(result.stdout, /0 DeepSeek calls/);
});

test('preview deployment instructions require the explicit no-retry live scan', () => {
  const deployment = fs.readFileSync(new URL('../../部署说明.md', import.meta.url), 'utf8');
  assert.match(deployment, /run-recipe-live-scan\.mjs/);
  assert.match(deployment, /recipe-validation\.yiguochu\.pages\.dev/);
  assert.match(deployment, /不自动重试/);
});
