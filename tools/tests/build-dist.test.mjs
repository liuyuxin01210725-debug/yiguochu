import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { canonicalJson } from '../../worker/src/rice-meal-selector.js';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const BUILD_SCRIPT = path.join(ROOT, 'tools', 'build-dist.mjs');
const LIBRARY_PATH = path.join(ROOT, 'tools', 'data', 'recipe-library.json');
const SOURCE_EVIDENCE_PATH = path.join(ROOT, 'tools', 'data', 'rice-cooker-source-evidence.v1.json');
const SOURCE_EVIDENCE = JSON.parse(fs.readFileSync(SOURCE_EVIDENCE_PATH, 'utf8'));
const SOURCE_EVIDENCE_SHA256 = crypto.createHash('sha256')
  .update(canonicalJson(SOURCE_EVIDENCE))
  .digest('hex');
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
  'planner-coverage.js',
  'ratio-dsl.js',
  'taxonomy-identity.js',
  'allergen-semantics.js',
  'plan-presentation.js',
  'generated-plan-contract.js',
  'recipe-runtime-matcher.js',
  'recipe-runtime-compiler.js',
  'recipe-runtime-validator.js',
  'recipe-action-registry.js',
  'recipe-action-profile-validator.js',
  'ingredient-taxonomy-validator.js',
  'meal-template-validator.js',
  'recipe-library-validator.js',
  'ingredient-taxonomy.v1.json',
  'meal-templates.v2.json',
  'ratio-rules.v1.json',
  'recipe-runtime.v1.json',
  'recipe-action-profiles.v1.json',
  'rice-meal-catalog.v1.json',
  'rice-meal-collection.v1.json',
  'rice-cooker-source-evidence.v1.json',
  'rice-meal-selector.js',
  'rice-meal-compiler.js',
  'rice-meal-catalog-validator.js',
  'rice-cooker-source-evidence-validator.js',
  'build-meta.json',
];
const BYTE_IDENTICAL_ASSETS = new Map([
  ['planner-v2.js', path.join(ROOT, 'worker', 'src', 'planner-v2.js')],
  ['planner-coverage.js', path.join(ROOT, 'worker', 'src', 'planner-coverage.js')],
  ['ratio-dsl.js', path.join(ROOT, 'worker', 'src', 'ratio-dsl.js')],
  ['taxonomy-identity.js', path.join(ROOT, 'worker', 'src', 'taxonomy-identity.js')],
  ['allergen-semantics.js', path.join(ROOT, 'worker', 'src', 'allergen-semantics.js')],
  ['plan-presentation.js', path.join(ROOT, 'worker', 'src', 'plan-presentation.js')],
  ['generated-plan-contract.js', path.join(ROOT, 'worker', 'src', 'generated-plan-contract.js')],
  ['recipe-runtime-matcher.js', path.join(ROOT, 'worker', 'src', 'recipe-runtime-matcher.js')],
  ['recipe-runtime-compiler.js', path.join(ROOT, 'worker', 'src', 'recipe-runtime-compiler.js')],
  ['recipe-runtime-validator.js', path.join(ROOT, 'worker', 'src', 'recipe-runtime-validator.js')],
  ['recipe-action-registry.js', path.join(ROOT, 'worker', 'src', 'recipe-action-registry.js')],
  ['recipe-action-profile-validator.js', path.join(ROOT, 'worker', 'src', 'recipe-action-profile-validator.js')],
  ['rice-meal-selector.js', path.join(ROOT, 'worker', 'src', 'rice-meal-selector.js')],
  ['rice-meal-compiler.js', path.join(ROOT, 'worker', 'src', 'rice-meal-compiler.js')],
  ['rice-meal-catalog-validator.js', path.join(ROOT, 'worker', 'src', 'rice-meal-catalog-validator.js')],
  ['rice-cooker-source-evidence-validator.js', path.join(ROOT, 'worker', 'src', 'rice-cooker-source-evidence-validator.js')],
  ['ingredient-taxonomy-validator.js', path.join(ROOT, 'worker', 'src', 'ingredient-taxonomy-validator.js')],
  ['meal-template-validator.js', path.join(ROOT, 'worker', 'src', 'meal-template-validator.js')],
  ['recipe-library-validator.js', path.join(ROOT, 'worker', 'src', 'recipe-library-validator.js')],
  ['ingredient-taxonomy.v1.json', path.join(ROOT, 'tools', 'data', 'ingredient-taxonomy.v1.json')],
  ['meal-templates.v2.json', path.join(ROOT, 'tools', 'data', 'meal-templates.v2.json')],
  ['ratio-rules.v1.json', path.join(ROOT, 'tools', 'data', 'ratio-rules.v1.json')],
  ['recipe-runtime.v1.json', path.join(ROOT, 'tools', 'data', 'recipe-runtime.v1.json')],
  ['recipe-action-profiles.v1.json', path.join(ROOT, 'tools', 'data', 'recipe-action-profiles.v1.json')],
  ['rice-meal-catalog.v1.json', path.join(ROOT, 'tools', 'data', 'rice-meal-catalog.v1.json')],
  ['rice-meal-collection.v1.json', path.join(ROOT, 'tools', 'data', 'rice-meal-collection.v1.json')],
  ['rice-cooker-source-evidence.v1.json', path.join(ROOT, 'tools', 'data', 'rice-cooker-source-evidence.v1.json')],
]);

function makeOutputDir() {
  return fs.mkdtempSync(path.join(ROOT, 'dist', '.build-test-'));
}

function runBuild(outputDir, {
  plannerRollout = 'direct-recommend',
  generationMode = 'deterministic',
  productFocus = 'legacy',
} = {}) {
  const args = [
    BUILD_SCRIPT,
    '--out-dir', outputDir,
    '--build-id', 'canonical-test',
  ];
  if (plannerRollout != null) args.push('--planner-rollout', plannerRollout);
  if (generationMode != null) args.push('--generation-mode', generationMode);
  if (productFocus != null) args.push('--product-focus', productFocus);
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });
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
    assert.equal(buildRecord.files, 39);
    assert.equal(buildRecord.productFocus, 'legacy');
    assert.match(
      fs.readFileSync(path.join(outputDir, 'sw.js'), 'utf8'),
      /const C = 'yiguochu-shell-v4-canonical-test';/,
    );
    const builtIndex = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8');
    assert.doesNotMatch(builtIndex, /__YIGUOCHU_(?:BUILD_ID|PLANNER_ROLLOUT|GENERATION_MODE)__/);
    assert.match(builtIndex, /const BUILD_ID = 'canonical-test';/);
    assert.match(builtIndex, /const PLANNER_ROLLOUT = 'direct-recommend';/);
    assert.match(builtIndex, /const GENERATION_MODE = 'deterministic';/);
    assert.match(builtIndex, /serviceWorker\.register\('sw\.js\?v=canonical-test', \{ updateViaCache:'none' \}\)/);
    assert.doesNotMatch(
      builtIndex,
      /serviceWorker\.addEventListener\('controllerchange'[\s\S]{0,240}location\.reload\(\)/,
      'a service-worker update must not reload an active cooking journey',
    );
    assert.deepEqual(
      JSON.parse(fs.readFileSync(path.join(outputDir, 'build-meta.json'), 'utf8')),
      {
        buildId:'canonical-test',
        plannerRollout:'direct-recommend',
        generationMode:'deterministic',
        productFocus:'legacy',
        riceCookerSourceEvidenceVersion:'rice-cooker-source-evidence-v1-20260802',
        riceCookerSourceEvidenceSha256:SOURCE_EVIDENCE_SHA256,
      },
    );
    const builtWorker = fs.readFileSync(path.join(outputDir, '_worker.js'), 'utf8');
    assert.doesNotMatch(
      builtWorker,
      /__YIGUOCHU_COMPILED_(?:BUILD_METADATA|PLANNER_ASSETS)_JSON__/,
    );
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

test('distribution build defaults rollout off and rejects unsupported rollout values', () => {
  const outputDir = makeOutputDir();
  try {
    const defaultBuild = runBuild(outputDir, { plannerRollout:null, generationMode:null });
    assert.equal(defaultBuild.status, 0, `${defaultBuild.stdout}\n${defaultBuild.stderr}`);
    assert.deepEqual(
      JSON.parse(fs.readFileSync(path.join(outputDir, 'build-meta.json'), 'utf8')),
      {
        buildId:'canonical-test',
        plannerRollout:'off',
        generationMode:'llm',
        productFocus:'legacy',
        riceCookerSourceEvidenceVersion:'rice-cooker-source-evidence-v1-20260802',
        riceCookerSourceEvidenceSha256:SOURCE_EVIDENCE_SHA256,
      },
    );
    assert.match(
      fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8'),
      /const PLANNER_ROLLOUT = 'off';/,
    );

    const rejected = runBuild(outputDir, { plannerRollout:'everyone' });
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /planner rollout/i);

    const rejectedGenerationMode = runBuild(outputDir, { generationMode:'hybrid' });
    assert.notEqual(rejectedGenerationMode.status, 0);
    assert.match(rejectedGenerationMode.stderr, /generation mode/i);

    const rejectedFocus = runBuild(outputDir, { productFocus:'all-products' });
    assert.notEqual(rejectedFocus.status, 0);
    assert.match(rejectedFocus.stderr, /product focus/i);
  } finally {
    fs.rmSync(outputDir, { recursive:true, force:true });
  }
});

test('distribution build excludes research-only and planner coverage audit artifacts', () => {
  const outputDir = makeOutputDir();
  try {
    build(outputDir);
    const buffers = [];
    const relativeFiles = [];
    const visit = directory => {
      for (const entry of fs.readdirSync(directory, { withFileTypes:true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(fullPath);
        else {
          relativeFiles.push(path.relative(outputDir, fullPath));
          buffers.push(fs.readFileSync(fullPath));
        }
      }
    };
    visit(outputDir);
    for (const forbiddenName of [
      'northeast-stew-numeric-evidence.v1.json',
      'northeast-stew-numeric-evidence.md',
      'northeast-stew-safety-evidence.v1.json',
      'northeast-stew-safety-evidence.md',
      'northeast-stew-calibration-runbook.md',
      'planner-menu-coverage.v1.json',
      'planner-menu-coverage.md',
    ]) assert.equal(relativeFiles.some(name => path.basename(name) === forbiddenName), false, `research-only file leaked by name: ${forbiddenName}`);
    for (const sentinel of [
      'northeast-stew-research',
      'northeast-stew-journey-review',
      'northeast-stew-numeric-evidence',
      'northeast-stew-safety-evidence',
      'northeast-stew-calibration-runbook',
      'preparation-rule.synthetic',
      'ne-cal-2',
      'synthetic-source-a',
      'planner-menu-coverage-builder',
      'Planner 覆盖审计不等于菜谱复刻',
    ]) {
      assert.equal(
        buffers.some(content => content.includes(Buffer.from(sentinel, 'utf8'))),
        false,
        `research-only sentinel leaked into canonical build: ${sentinel}`,
      );
    }
    const ratios = JSON.parse(fs.readFileSync(path.join(outputDir, 'ratio-rules.v1.json'), 'utf8'));
    assert.equal(ratios.rules.some(row => [
      'cornmeal-flour-to-dough-v1',
      'stew-with-corn-cake-liquid-v1',
    ].includes(row.rule_id)), false);
    const templates = JSON.parse(fs.readFileSync(path.join(outputDir, 'meal-templates.v2.json'), 'utf8'));
    assert.equal(templates.templates.filter(row => row.activation_status === 'active').length, 11);
    assert.equal(templates.templates.filter(row => row.activation_status === 'planned').length, 5);
  } finally {
    fs.rmSync(outputDir, { recursive:true, force:true });
  }
});

test('built Worker contains its complete relative module graph and plans from embedded validated assets', async () => {
  const outputDir = makeOutputDir();
  try {
    build(outputDir);
    const graph = assertBuiltImportGraph(outputDir);
    assert.equal(graph.size, 20);
    const { default: builtWorker } = await import(`${pathToFileURL(path.join(outputDir, '_worker.js')).href}?built=${Date.now()}`);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error('built planner must not use upstream fetch'); };
    try {
      const unavailableAssets = {
        async fetch() {
          throw new Error('built planner must not fetch deployed planner metadata or JSON assets');
        },
      };
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
      }), { ASSETS: unavailableAssets });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.status, 'complete');
      assert.match(body.plan.plan_id, /^pln_v2_[A-Za-z0-9_-]{43}$/);

      const healthResponse = await builtWorker.fetch(
        new Request('https://built.example/health'),
        { ASSETS: unavailableAssets },
      );
      assert.equal(healthResponse.status, 200);
      const health = await healthResponse.json();
      assert.equal(health.buildId, 'canonical-test');
      assert.equal(health.plannerRollout, 'direct-recommend');
      assert.equal(health.generationMode, 'deterministic');
      assert.equal(health.productFocus, 'legacy');
      assert.equal(health.plannerAssets, 'ok');
      assert.equal(health.recipeRuntime, 'ok');
      assert.equal(health.recipeRuntimeCatalogVersion, 'recipe-runtime-v1-20260730-r1');
      assert.equal(health.recipeRuntimeEntries, 6);
      assert.equal(health.recipeRuntimePreviewEnabled, 0);
      assert.equal(health.actionProfiles, 'ok');
      assert.equal(health.actionProfileCatalogVersion, 'recipe-action-profiles-v1-20260731-r1');
      assert.equal(health.actionProfileCount, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

test('rice-meal distribution embeds the catalog and focus metadata without a legacy fallback', async () => {
  const outputDir = makeOutputDir();
  try {
    const buildResult = runBuild(outputDir, { productFocus:'rice-meal-v1' });
    assert.equal(buildResult.status, 0, `${buildResult.stdout}\n${buildResult.stderr}`);
    assert.equal(JSON.parse(buildResult.stdout).productFocus, 'rice-meal-v1');
    assert.deepEqual(
      JSON.parse(fs.readFileSync(path.join(outputDir, 'build-meta.json'), 'utf8')),
      {
        buildId:'canonical-test',
        plannerRollout:'direct-recommend',
        generationMode:'deterministic',
        productFocus:'rice-meal-v1',
        riceCookerSourceEvidenceVersion:'rice-cooker-source-evidence-v1-20260802',
        riceCookerSourceEvidenceSha256:SOURCE_EVIDENCE_SHA256,
      },
    );
    for (const asset of [
      'rice-meal-catalog.v1.json',
      'rice-meal-selector.js',
      'rice-meal-compiler.js',
      'rice-meal-catalog-validator.js',
    ]) assert.equal(fs.existsSync(path.join(outputDir, asset)), true, `${asset} must be built`);

    const unavailableAssets = {
      async fetch() { throw new Error('rice build must use embedded assets'); },
    };
    const { default: riceWorker } = await import(`${pathToFileURL(path.join(outputDir, '_worker.js')).href}?rice=${Date.now()}`);
    const plannedResponse = await riceWorker.fetch(new Request('https://built.example/plan-meal', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        schema_version: 3,
        product_focus: 'rice_meal',
        servings: 2,
        pantry: ['鸡腿', '土豆'],
        dislikes: [],
      }),
    }), {
      ASSETS: unavailableAssets,
      RICE_MEAL_PLAN_SECRET: 'build-rice-meal-secret',
    });
    const planned = await plannedResponse.json();
    assert.equal(plannedResponse.status, 200);
    assert.equal(planned.candidates[0].variant_id, 'home-chicken-leg-potato-rice');
    assert.match(planned.candidates[0].plan_token, /^rm1\./u);

    const healthResponse = await riceWorker.fetch(new Request('https://built.example/health'), {
      ASSETS: unavailableAssets,
      RICE_MEAL_PLAN_SECRET: 'build-rice-meal-secret',
    });
    const health = await healthResponse.json();
    assert.equal(health.productFocus, 'rice-meal-v1');
    assert.equal(health.riceMealCatalog, 'ok');
    assert.equal(health.riceMealCatalogVersion, 'rice-meal-catalog-v1-20260801-r6');
    assert.equal(health.riceMealFamilies, 3);
    assert.equal(health.riceMealVariants, 11);
    assert.equal(health.riceMealPreviewReady, 8);
    assert.equal(health.riceMealPlanned, 3);
    assert.equal(health.riceCookerSourceEvidence, 'ok');
    assert.equal(health.riceCookerSourceEvidenceVersion, 'rice-cooker-source-evidence-v1-20260802');
    assert.equal(health.riceCookerSourceEvidenceSha256, SOURCE_EVIDENCE_SHA256);
    assert.equal(health.riceMealPlanSigner, 'ok');
    assert.equal(health.riceMealRuntime, 'ok');

    const workerPath = path.join(outputDir, '_worker.js');
    const builtSource = fs.readFileSync(workerPath, 'utf8');
    fs.writeFileSync(workerPath, builtSource.replace(
      SOURCE_EVIDENCE_SHA256,
      '0000000000000000000000000000000000000000000000000000000000000000',
    ));
    const { default: mismatchedEvidenceWorker } = await import(`${pathToFileURL(workerPath).href}?evidence-mismatch=${Date.now()}`);
    const mismatchedHealth = await mismatchedEvidenceWorker.fetch(
      new Request('https://built.example/health'),
      { ASSETS: unavailableAssets, RICE_MEAL_PLAN_SECRET: 'build-rice-meal-secret' },
    );
    const mismatchedHealthBody = await mismatchedHealth.json();
    assert.equal(mismatchedHealthBody.riceCookerSourceEvidence, 'unavailable');
    assert.equal(mismatchedHealthBody.riceCookerSourceEvidenceVersion, null);
    assert.equal(mismatchedHealthBody.riceCookerSourceEvidenceSha256, null);
    assert.equal(mismatchedHealthBody.riceMealCatalog, 'unavailable');

    fs.writeFileSync(workerPath, builtSource.replace(
      /const COMPILED_BUILD_METADATA_JSON = [^;]+;/u,
      "const COMPILED_BUILD_METADATA_JSON = 'not-valid-json';",
    ));
    const { default: brokenWorker } = await import(`${pathToFileURL(workerPath).href}?broken=${Date.now()}`);
    const brokenResponse = await brokenWorker.fetch(new Request('https://built.example/plan-meal', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        schema_version: 3,
        product_focus: 'rice_meal',
        servings: 2,
        pantry: ['鸡腿', '土豆'],
        dislikes: [],
      }),
    }), {
      ASSETS: unavailableAssets,
      RICE_MEAL_PLAN_SECRET: 'build-rice-meal-secret',
    });
    assert.equal(brokenResponse.status, 503);
    assert.equal((await brokenResponse.json()).code, 'build_metadata_unavailable');
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
