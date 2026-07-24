import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const BUILD_SCRIPT = path.join(ROOT, 'tools', 'build-dist.mjs');
const LIBRARY_PATH = path.join(ROOT, 'tools', 'data', 'recipe-library.json');
const CHROME = process.env.YIGUOCHU_CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const REQUIRED_ASSETS = [
  'index.html',
  'recipes.html',
  'manifest.json',
  'sw.js',
  'icon.svg',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
  'foods-tw.json',
  'recipe-library.json',
  '_worker.js',
  'planner-v2.js',
  'ratio-dsl.js',
  'taxonomy-identity.js',
  'allergen-semantics.js',
  'ingredient-taxonomy.v1.json',
  'meal-templates.v2.json',
  'ratio-rules.v1.json',
];
const BYTE_IDENTICAL_ASSETS = new Map([
  ['_worker.js', path.join(ROOT, 'worker', 'src', 'worker.js')],
  ['planner-v2.js', path.join(ROOT, 'worker', 'src', 'planner-v2.js')],
  ['ratio-dsl.js', path.join(ROOT, 'worker', 'src', 'ratio-dsl.js')],
  ['taxonomy-identity.js', path.join(ROOT, 'worker', 'src', 'taxonomy-identity.js')],
  ['allergen-semantics.js', path.join(ROOT, 'worker', 'src', 'allergen-semantics.js')],
  ['ingredient-taxonomy.v1.json', path.join(ROOT, 'tools', 'data', 'ingredient-taxonomy.v1.json')],
  ['meal-templates.v2.json', path.join(ROOT, 'tools', 'data', 'meal-templates.v2.json')],
  ['ratio-rules.v1.json', path.join(ROOT, 'tools', 'data', 'ratio-rules.v1.json')],
]);

function makeOutputDir() {
  return fs.mkdtempSync(path.join(ROOT, 'dist', '.build-test-'));
}

function runBuild(outputDir) {
  return spawnSync(process.execPath, [
    BUILD_SCRIPT,
    '--out-dir', outputDir,
    '--build-id', 'canonical-test',
  ], { cwd: ROOT, encoding: 'utf8' });
}

function build(outputDir) {
  const result = runBuild(outputDir);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return result;
}

function dumpDom(url, profileDir) {
  return new Promise((resolve, reject) => {
    const child = spawn(CHROME, [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${profileDir}`,
      '--virtual-time-budget=1500',
      '--dump-dom',
      url,
    ], { cwd: ROOT });
    let stdout = '';
    let stderr = '';
    let rendered = false;
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, 15000);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      stdout += chunk;
      if (!rendered && stdout.includes('</html>')) {
        rendered = true;
        child.kill('SIGTERM');
      }
    });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', error => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', code => {
      clearTimeout(timeout);
      if (rendered) resolve(stdout);
      else if (timedOut) reject(new Error(`Chrome did not render before the timeout: ${stderr}`));
      else reject(new Error(`Chrome exited ${code}: ${stderr}`));
    });
  });
}

function serveStatic(outputDir) {
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    const fileName = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!REQUIRED_ASSETS.includes(fileName)) {
      response.writeHead(404).end('not found');
      return;
    }
    response.writeHead(200).end(fs.readFileSync(path.join(outputDir, fileName)));
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function relativeImports(source) {
  return [...source.matchAll(/(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"](\.[^'"]+)['"]/g)]
    .map(match => match[1]);
}

function assertBuiltImportGraph(outputDir, entry = '_worker.js') {
  const pending = [path.join(outputDir, entry)];
  const visited = new Set();
  while (pending.length) {
    const current = pending.pop();
    const resolvedCurrent = fs.realpathSync(current);
    assert.equal(resolvedCurrent.startsWith(`${fs.realpathSync(outputDir)}${path.sep}`), true, `${current} escapes build output`);
    if (visited.has(resolvedCurrent)) continue;
    visited.add(resolvedCurrent);
    const source = fs.readFileSync(resolvedCurrent, 'utf8');
    for (const specifier of relativeImports(source)) {
      const target = path.resolve(path.dirname(resolvedCurrent), specifier);
      assert.equal(target.startsWith(`${path.resolve(outputDir)}${path.sep}`), true, `${specifier} escapes build output`);
      assert.equal(fs.existsSync(target), true, `${path.relative(outputDir, resolvedCurrent)} imports missing ${specifier}`);
      pending.push(target);
    }
  }
  return visited;
}

function builtAssetBinding(outputDir) {
  return {
    async fetch(request) {
      const pathname = new URL(request.url).pathname;
      const target = path.join(outputDir, pathname.slice(1));
      if (!target.startsWith(`${outputDir}${path.sep}`) || !fs.existsSync(target)) {
        return new Response('missing', { status: 404 });
      }
      return new Response(fs.readFileSync(target), { status: 200 });
    },
  };
}

test('distribution build removes stale files before recreating the output', () => {
  const outputDir = makeOutputDir();
  try {
    fs.writeFileSync(path.join(outputDir, 'stale-deployment-asset.txt'), 'must not survive rebuild');
    build(outputDir);

    assert.equal(fs.existsSync(path.join(outputDir, 'stale-deployment-asset.txt')), false);

    for (const asset of REQUIRED_ASSETS) {
      assert.equal(fs.existsSync(path.join(outputDir, asset)), true, `${asset} must be built`);
    }
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

test('distribution build includes canonical recipe assets and refreshes its service worker cache key', () => {
  const outputDir = makeOutputDir();
  try {
    const buildResult = build(outputDir);

    for (const asset of REQUIRED_ASSETS) {
      assert.equal(fs.existsSync(path.join(outputDir, asset)), true, `${asset} must be built`);
    }
    assert.equal(
      fs.readFileSync(path.join(outputDir, 'recipes.html'), 'utf8'),
      fs.readFileSync(path.join(ROOT, 'recipes.html'), 'utf8'),
    );
    assert.equal(
      fs.readFileSync(path.join(outputDir, 'recipe-library.json'), 'utf8'),
      fs.readFileSync(LIBRARY_PATH, 'utf8'),
    );
    const builtLibrary = JSON.parse(fs.readFileSync(path.join(outputDir, 'recipe-library.json'), 'utf8'));
    assert.equal(builtLibrary.families.length, 21);
    assert.equal(builtLibrary.recipes.length, 72);
    assert.equal(builtLibrary.recipes.filter(recipe => recipe.status === 'approved').length, 12);
    assert.equal(builtLibrary.recipes.filter(recipe => recipe.status === 'auto_approved').length, 60);
    for (const [target, source] of BYTE_IDENTICAL_ASSETS) {
      assert.deepEqual(fs.readFileSync(path.join(outputDir, target)), fs.readFileSync(source), `${target} must be byte-identical`);
    }
    const buildRecord = JSON.parse(buildResult.stdout.trim());
    assert.equal(buildRecord.files, 18);
    assert.match(
      fs.readFileSync(path.join(outputDir, 'sw.js'), 'utf8'),
      /const C = 'yiguochu-shell-v4-canonical-test';/,
    );
    const builtIndex = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8');
    assert.doesNotMatch(builtIndex, /__YIGUOCHU_BUILD_ID__/);
    assert.match(builtIndex, /serviceWorker\.register\('sw\.js\?v=canonical-test', \{ updateViaCache:'none' \}\)/);
    assert.match(builtIndex, /serviceWorker\.addEventListener\('controllerchange'/);
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

test('built Worker contains its complete relative module graph and executes planning using only built assets', async () => {
  const outputDir = makeOutputDir();
  try {
    build(outputDir);
    const graph = assertBuiltImportGraph(outputDir);
    assert.equal(graph.size, 5);
    const { default: builtWorker } = await import(`${pathToFileURL(path.join(outputDir, '_worker.js')).href}?built=${Date.now()}`);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error('built planner must not use upstream fetch'); };
    try {
      const response = await builtWorker.fetch(new Request('https://built.example/plan-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema_version: 2,
          planner_version: 'pantry-planner-v2',
          constraints: {
            mode: 'pantry', intent: 'normal', servings: 2,
            must_use: ['番茄', '鸡蛋'], prefer_use: [], dislikes: [],
            current_plan_id: null, recent_plan_ids: [], decision: null,
          },
        }),
      }), { ASSETS: builtAssetBinding(outputDir) });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.status, 'complete');
      assert.match(body.plan.plan_id, /^pln_v2_[A-Za-z0-9_-]{43}$/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

test('distribution build refuses an output path outside its safe dist directory', () => {
  const unsafeOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yiguochu-unsafe-build-'));
  fs.rmSync(unsafeOutputDir, { recursive: true, force: true });
  try {
    const result = runBuild(unsafeOutputDir);
    assert.notEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(fs.existsSync(unsafeOutputDir), false);
  } finally {
    fs.rmSync(unsafeOutputDir, { recursive: true, force: true });
  }
});

test('generated canonical page executes and renders approved title and provenance in Chrome', async () => {
  const outputDir = makeOutputDir();
  let server;
  let browserProfile;
  try {
    assert.equal(fs.existsSync(CHROME), true, `Chrome executable is required: ${CHROME}`);
    build(outputDir);
    server = await serveStatic(outputDir);
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;
    const recipeId = 'shanghai-salted-pork-vegetable-rice';

    browserProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'yiguochu-chrome-profile-'));
    const dom = await dumpDom(`${baseUrl}/recipes.html?id=${recipeId}`, browserProfile);

    assert.match(dom, /<h2 id="name">上海奉贤咸肉菜饭<\/h2>/);
    assert.match(dom, /文化来源候选编号<\/h3><p id="origin">shanghai-salted-pork-vegetable-rice<\/p>/);
    assert.match(dom, /一锅出原创标准配方：上海奉贤咸肉菜饭/);
    assert.match(dom, /一锅出项目原创标准配方，保留所有权利/);
    assert.match(dom, /一锅出项目/);
    assert.doesNotMatch(dom, /id="unavailable" class="unavailable" aria-live="polite">未找到可公开的菜谱<\/section>/);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    fs.rmSync(outputDir, { recursive: true, force: true });
    if (browserProfile) fs.rmSync(browserProfile, { recursive: true, force: true });
  }
});
