import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const script = fileURLToPath(new URL('../check-core-ingredient-nutrition.mjs', import.meta.url));

test('all production recipe cores receive a deterministic nutrition identity audit', () => {
  const result = spawnSync(process.execPath, [script], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /72 recipes · 71 unique core ingredients/);
  assert.match(result.stdout, /土豆\s+→\s+马铃薯\s+B0700201\s+77 kcal/);
  assert.match(result.stdout, /粉丝\s+→\s+冬粉\s+R4600201\s+351 kcal/);
  assert.match(result.stdout, /牛奶\s+→\s+全脂鲜乳平均值\s+L01021\s+63 kcal/);
  assert.match(result.stdout, /nutrition identity audit ok/);
});

test('the recipe release gate runs the core ingredient nutrition audit', () => {
  const source = fs.readFileSync(new URL('../check-recipes.mjs', import.meta.url), 'utf8');
  assert.match(source, /check-core-ingredient-nutrition\.mjs/);
  assert.match(source, /nutrition identity audit/);
});
