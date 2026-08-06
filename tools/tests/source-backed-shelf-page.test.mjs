import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../..', import.meta.url);
const buildSource = fs.readFileSync(new URL('../../tools/build-dist.mjs', import.meta.url), 'utf8');

test('build includes the read-only source-backed shelf page and generated shelf asset', () => {
  assert.match(buildSource, /['"]source-recipes\.html['"]/);
  assert.match(buildSource, /source-backed-one-pot-shelf\.v1\.json/);
});

test('source-backed shelf page is read-only and does not call generation endpoints', () => {
  const page = fs.readFileSync(new URL('../../source-recipes.html', import.meta.url), 'utf8');
  assert.match(page, /真实菜饭资料库/);
  assert.match(page, /source-backed-one-pot-shelf\.v1\.json/);
  assert.doesNotMatch(page, /generate-meal|plan-meal|DeepSeek/i);
  assert.match(page, /试做记录/);
});

test('existing recipe page links to the source-backed shelf without changing its recipe contract', () => {
  const page = fs.readFileSync(new URL('../../recipes.html', import.meta.url), 'utf8');
  assert.match(page, /source-recipes\.html/);
});
