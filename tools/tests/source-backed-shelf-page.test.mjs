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
  assert.match(page, /PAGE_SIZE/);
  assert.match(page, /上一页/);
  assert.match(page, /下一页/);
  assert.doesNotMatch(page, /executable · 已签署|recipe_fact_checked · 来源事实已记录|identity_verified · 身份已核对|discovered · 待补证/);
  assert.match(page, /recipe_id/);
  assert.match(page, /const statusLabels =/);
  assert.match(page, /function displayName\(record\)/);
  assert.match(page, /title\.textContent = displayName\(record\)/);
  assert.match(page, /来源已记录的做法片段/);
  assert.match(page, /function sourceFragmentSummary\(record\)/);
  assert.match(page, /sourceFragmentSummary\(record\)/);
  assert.match(page, /record\.cooking_sequence/);
  assert.match(page, /record\.fixed_batch/);
  assert.match(page, /function regionPriority\(record\)/);
  assert.match(page, /filtered\.sort\(\(a, b\) => regionPriority\(a\)/);
  assert.match(page, /typeof target\.scrollIntoView === 'function'/);
  assert.match(page, /无法展示这条记录/);
});

test('existing recipe page links to the source-backed shelf without changing its recipe contract', () => {
  const page = fs.readFileSync(new URL('../../recipes.html', import.meta.url), 'utf8');
  assert.match(page, /source-recipes\.html/);
});
