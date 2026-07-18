import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const BUILD_SCRIPT = path.join(ROOT, 'tools', 'build-dist.mjs');
const LIBRARY_PATH = path.join(ROOT, 'tools', 'data', 'recipe-library.json');
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
];

function makeOutputDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'yiguochu-dist-test-'));
}

function build(outputDir) {
  const result = spawnSync(process.execPath, [
    BUILD_SCRIPT,
    '--out-dir', outputDir,
    '--build-id', 'canonical-test',
  ], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
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

test('distribution build includes canonical recipe assets and refreshes its service worker cache key', () => {
  const outputDir = makeOutputDir();
  try {
    build(outputDir);

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
    assert.equal(
      fs.readFileSync(path.join(outputDir, '_worker.js'), 'utf8'),
      fs.readFileSync(path.join(ROOT, 'worker', 'src', 'worker.js'), 'utf8'),
    );
    assert.match(
      fs.readFileSync(path.join(outputDir, 'sw.js'), 'utf8'),
      /const C = 'yiguochu-shell-v4-canonical-test';/,
    );
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

test('generated distribution statically serves the canonical page and its approved recipe data', async () => {
  const outputDir = makeOutputDir();
  let server;
  try {
    build(outputDir);
    server = await serveStatic(outputDir);
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;
    const recipeId = 'shanghai-salted-pork-vegetable-rice';

    const pageResponse = await fetch(`${baseUrl}/recipes.html?id=${recipeId}`);
    assert.equal(pageResponse.status, 200);
    const page = await pageResponse.text();
    assert.match(page, /recipe-library\.json/);
    assert.match(page, /recipe\.id\s*===\s*recipeId/);

    const libraryResponse = await fetch(`${baseUrl}/recipe-library.json`);
    assert.equal(libraryResponse.status, 200);
    const library = await libraryResponse.json();
    assert.deepEqual(
      library.recipes.find(recipe => recipe.id === recipeId),
      JSON.parse(fs.readFileSync(LIBRARY_PATH, 'utf8')).recipes.find(recipe => recipe.id === recipeId),
    );

    assert.equal((await fetch(`${baseUrl}/foods-tw.json`)).status, 200);
    assert.equal((await fetch(`${baseUrl}/_worker.js`)).status, 200);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});
