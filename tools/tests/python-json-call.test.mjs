import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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
