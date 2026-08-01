#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import worker from '../worker/src/worker.js';
import { canonicalJson, sha256Hex } from '../worker/src/rice-meal-selector.js';

const BRIDGE_VERSION = 1;
const ALLOWED_ENDPOINTS = new Set(['/health', '/plan-meal', '/generate-plan']);
const PRODUCT_FOCUS = typeof process.env.YIGUOCHU_PRODUCT_FOCUS === 'string'
  && process.env.YIGUOCHU_PRODUCT_FOCUS.trim()
  ? process.env.YIGUOCHU_PRODUCT_FOCUS.trim()
  : 'legacy';
const GENERATION_MODE = PRODUCT_FOCUS === 'rice-meal-v1'
  ? 'deterministic'
  : (['deterministic', 'llm'].includes(process.env.YIGUOCHU_GENERATION_MODE)
    ? process.env.YIGUOCHU_GENERATION_MODE
    : 'deterministic');
const RICE_CATALOG_SCOPE = ['ready', 'calibration'].includes(process.env.YIGUOCHU_RICE_CATALOG_SCOPE)
  ? process.env.YIGUOCHU_RICE_CATALOG_SCOPE
  : 'ready';
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const hostedMode = value => ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
const explicitLoopbackDev = PRODUCT_FOCUS === 'rice-meal-v1'
  && process.env.YIGUOCHU_LOCAL_DEV === '1'
  && LOOPBACK_HOSTS.has(String(process.env.HOST || '').trim().toLowerCase())
  && !hostedMode(process.env.YIGUOCHU_HOSTED_MODE);
const configuredRiceMealPlanSecret = typeof process.env.RICE_MEAL_PLAN_SECRET === 'string'
  && process.env.RICE_MEAL_PLAN_SECRET.trim()
  ? process.env.RICE_MEAL_PLAN_SECRET.trim()
  : '';
const RICE_MEAL_PLAN_SECRET = configuredRiceMealPlanSecret
  || (explicitLoopbackDev ? 'local-rice-meal-development-secret' : '');
const ASSET_DIRECTORY = typeof process.env.YIGUOCHU_PLANNER_ASSET_DIR === 'string'
  && process.env.YIGUOCHU_PLANNER_ASSET_DIR.trim()
  ? path.resolve(process.env.YIGUOCHU_PLANNER_ASSET_DIR.trim())
  : null;
const assetUrl = name => ASSET_DIRECTORY
  ? pathToFileURL(path.join(ASSET_DIRECTORY, name))
  : new URL(`./data/${name}`, import.meta.url);
const ASSET_FILES = new Map([
  ['/ingredient-taxonomy.v1.json', assetUrl('ingredient-taxonomy.v1.json')],
  ['/meal-templates.v2.json', assetUrl('meal-templates.v2.json')],
  ['/ratio-rules.v1.json', assetUrl('ratio-rules.v1.json')],
  ['/recipe-library.json', assetUrl('recipe-library.json')],
  ['/recipe-runtime.v1.json', assetUrl('recipe-runtime.v1.json')],
  ['/recipe-action-profiles.v1.json', assetUrl('recipe-action-profiles.v1.json')],
  ['/rice-meal-catalog.v1.json', assetUrl('rice-meal-catalog.v1.json')],
  ['/rice-meal-collection.v1.json', assetUrl('rice-meal-collection.v1.json')],
  ['/rice-cooker-source-evidence.v1.json', assetUrl('rice-cooker-source-evidence.v1.json')],
  ['/foods-tw.json', assetUrl('foods-tw.json')],
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
      let sourceEvidenceMetadata = {};
      if (PRODUCT_FOCUS === 'rice-meal-v1') {
        try {
          const sourceEvidence = JSON.parse(await fs.readFile(
            ASSET_FILES.get('/rice-cooker-source-evidence.v1.json'),
            'utf8',
          ));
          sourceEvidenceMetadata = {
            riceCookerSourceEvidenceVersion: sourceEvidence.ledger_version,
            riceCookerSourceEvidenceSha256: sha256Hex(canonicalJson(sourceEvidence)),
          };
        } catch (_error) {
          // A rice-focused source build without its evidence ledger must expose
          // invalid metadata, not silently fall back to the legacy product.
        }
      }
      return new Response(JSON.stringify({
        buildId: 'local-planner',
        plannerRollout: 'direct-recommend',
        generationMode: GENERATION_MODE,
        productFocus: PRODUCT_FOCUS,
        riceCatalogScope: RICE_CATALOG_SCOPE,
        ...sourceEvidenceMetadata,
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
  if (RICE_MEAL_PLAN_SECRET) env.RICE_MEAL_PLAN_SECRET = RICE_MEAL_PLAN_SECRET;
  if (PRODUCT_FOCUS !== 'rice-meal-v1') {
    for (const key of ['DEEPSEEK_API_KEY', 'API_URL', 'MODEL_NAME', 'DAILY_BUDGET']) {
      if (typeof process.env[key] === 'string' && process.env[key]) env[key] = process.env[key];
    }
  }
  return env;
}

async function main() {
  const endpoint = process.argv[2];
  if (!ALLOWED_ENDPOINTS.has(endpoint) || process.argv.length !== 3) {
    machineFailure('invalid_bridge_endpoint');
    return;
  }
  let body = null;
  if (endpoint !== '/health') {
    try {
      body = await readStdin();
    } catch (_error) {
      machineFailure('invalid_bridge_input');
      return;
    }
  }

  try {
    const response = await worker.fetch(new Request(`http://localhost:8765${endpoint}`, {
      method: endpoint === '/health' ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Origin: 'http://localhost:8081',
        'X-Forwarded-For': '127.0.0.1',
      },
      ...(body == null ? {} : { body: JSON.stringify(body) }),
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
