import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const argvFileReader = String.raw`
import json
import sys

request_path = sys.argv[1]
with open(request_path, encoding='utf-8') as request_file:
    request = json.load(request_file)
json.dump({'request': request, 'request_path': request_path}, sys.stdout, ensure_ascii=False)
`;

test('Python JSON call passes the payload through an argv file and removes it afterwards', async () => {
  const { runPythonJson } = await import('./helpers/python-json-call.mjs');
  const run = runPythonJson(['-c', argvFileReader], {
    action: 'argv-file-contract',
    ingredients: ['番茄', '鸡蛋'],
  }, {
    cwd: process.cwd(),
    timeout: 5000,
  });

  assert.equal(run.status, 0, run.stderr);
  const output = JSON.parse(run.stdout);
  assert.deepEqual(output.request, {
    action: 'argv-file-contract',
    ingredients: ['番茄', '鸡蛋'],
  });
  assert.equal(fs.existsSync(output.request_path), false);
  assert.equal(fs.existsSync(path.dirname(output.request_path)), false);
});

test('Python JSON call preserves a non-zero child result and still removes the argv file', async () => {
  const { runPythonJson } = await import('./helpers/python-json-call.mjs');
  const run = runPythonJson(['-c', String.raw`
import sys
print(sys.argv[1], flush=True)
sys.exit(7)
`], { action: 'non-zero-child' }, { timeout: 5000 });
  const requestPath = run.stdout.trim();
  assert.equal(run.status, 7);
  assert.equal(fs.existsSync(requestPath), false);
  assert.equal(fs.existsSync(path.dirname(requestPath)), false);
});

test('Python JSON call cleans its request directory when JSON serialization throws', async () => {
  const { runPythonJson } = await import('./helpers/python-json-call.mjs');
  const before = new Set(fs.readdirSync(os.tmpdir()).filter(name => name.startsWith('yiguochu-python-json-')));
  const circular = {};
  circular.self = circular;
  assert.throws(() => runPythonJson(['-c', 'raise SystemExit(0)'], circular), /circular structure/i);
  const after = new Set(fs.readdirSync(os.tmpdir()).filter(name => name.startsWith('yiguochu-python-json-')));
  assert.deepEqual(after, before);
});

test('Python JSON call removes the argv file after a child timeout', async () => {
  const { runPythonJson } = await import('./helpers/python-json-call.mjs');
  const run = runPythonJson(['-c', String.raw`
import sys
import time
print(sys.argv[1], flush=True)
time.sleep(3)
`], { action: 'timeout-child' }, { timeout: 50 });
  const requestPath = run.stdout.trim();
  assert.equal(run.error?.code, 'ETIMEDOUT');
  assert.equal(fs.existsSync(requestPath), false);
  assert.equal(fs.existsSync(path.dirname(requestPath)), false);
});
