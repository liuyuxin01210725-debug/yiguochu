#!/usr/bin/env node

import fs from 'node:fs/promises';

import worker from '../worker/src/worker.js';

const BRIDGE_VERSION = 1;
const ALLOWED_ENDPOINTS = new Set(['/plan-meal', '/generate-plan']);
const GENERATION_MODE = ['deterministic', 'llm'].includes(process.env.YIGUOCHU_GENERATION_MODE)
  ? process.env.YIGUOCHU_GENERATION_MODE
  : 'deterministic';
const ASSET_FILES = new Map([
  ['/ingredient-taxonomy.v1.json', new URL('./data/ingredient-taxonomy.v1.json', import.meta.url)],
  ['/meal-templates.v2.json', new URL('./data/meal-templates.v2.json', import.meta.url)],
  ['/ratio-rules.v1.json', new URL('./data/ratio-rules.v1.json', import.meta.url)],
  ['/recipe-library.json', new URL('./data/recipe-library.json', import.meta.url)],
  ['/foods-tw.json', new URL('./data/foods-tw.json', import.meta.url)],
]);

function machineFailure(code, exitCode = 2) {
  process.stdout.write(JSON.stringify({
    bridge_version: BRIDGE_VERSION,
    error: { code, message: '本地规划服务暂时不可用' },
  }));
  process.exitCode = exitCode;
}

async function readStdin() {
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > 32 * 1024) throw new Error('invalid_bridge_input');
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid_bridge_input');
  return parsed;
}

const assetBinding = {
  async fetch(input) {
    const pathname = new URL(input.url).pathname;
    if (pathname === '/build-meta.json') {
      return new Response(JSON.stringify({
        buildId: 'local-planner',
        plannerRollout: 'direct-recommend',
        generationMode: GENERATION_MODE,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
    const file = ASSET_FILES.get(pathname);
    if (!file) return new Response('missing', { status: 404 });
    try {
      return new Response(await fs.readFile(file), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    } catch (_error) {
      return new Response('missing', { status: 404 });
    }
  },
};

function oneShotKv() {
  const values = new Map();
  return {
    async get(key) { return values.get(String(key)) ?? null; },
    async put(key, value) { values.set(String(key), String(value)); },
  };
}

function workerEnv() {
  const env = {
    ASSETS: assetBinding,
    RATE_KV: oneShotKv(),
    RATE_LIMIT: 0,
    ALLOW_ORIGIN: 'http://localhost:8081,http://127.0.0.1:8081',
  };
  for (const key of ['DEEPSEEK_API_KEY', 'API_URL', 'MODEL_NAME', 'DAILY_BUDGET']) {
    if (typeof process.env[key] === 'string' && process.env[key]) env[key] = process.env[key];
  }
  return env;
}

async function main() {
  const endpoint = process.argv[2];
  if (!ALLOWED_ENDPOINTS.has(endpoint) || process.argv.length !== 3) {
    machineFailure('invalid_bridge_endpoint');
    return;
  }
  let body;
  try {
    body = await readStdin();
  } catch (_error) {
    machineFailure('invalid_bridge_input');
    return;
  }

  try {
    const response = await worker.fetch(new Request(`http://localhost:8765${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Origin: 'http://localhost:8081',
        'X-Forwarded-For': '127.0.0.1',
      },
      body: JSON.stringify(body),
    }), workerEnv());
    const rawBody = await response.text();
    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch (_error) {
      machineFailure('invalid_worker_response', 3);
      return;
    }
    process.stdout.write(JSON.stringify({
      bridge_version: BRIDGE_VERSION,
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json; charset=utf-8',
        'cache-control': response.headers.get('cache-control') || 'no-store',
      },
      body: parsedBody,
    }));
  } catch (_error) {
    machineFailure('bridge_execution_failed', 3);
  }
}

await main();
