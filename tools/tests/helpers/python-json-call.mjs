import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function runPythonJson(args, payload, options = {}) {
  const { input: _ignoredInput, tempRoot, ...spawnOptions } = options;
  const requestDir = tempRoot || fs.mkdtempSync(path.join(os.tmpdir(), 'yiguochu-python-json-'));
  const requestPath = path.join(requestDir, 'request.json');

  try {
    if (tempRoot) fs.mkdirSync(requestDir, { recursive: true });
    fs.writeFileSync(requestPath, JSON.stringify(payload), 'utf8');
    return spawnSync('python3', [...args, requestPath], {
      encoding: 'utf8',
      ...spawnOptions,
    });
  } finally {
    fs.rmSync(requestDir, { recursive: true, force: true });
  }
}
