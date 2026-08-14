import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../..', import.meta.url);
const buildSource = fs.readFileSync(new URL('../../tools/build-dist.mjs', import.meta.url), 'utf8');

test('build includes the read-only source-backed shelf page and generated shelf asset', () => {
  assert.match(buildSource, /['"]source-recipes\.html['"]/);
  assert.match(buildSource, /path\.join\(outputDir, 'source-recipes', 'index\.html'\)/u);
  assert.match(buildSource, /source-backed-one-pot-shelf\.v1\.json/);
});

test('the source catalog exposes a stable trailing-slash share route', () => {
  const page = fs.readFileSync(new URL('../../source-recipes.html', import.meta.url), 'utf8');
  const home = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const recipes = fs.readFileSync(new URL('../../recipes.html', import.meta.url), 'utf8');
  assert.match(home, /href="\/source-recipes\//u);
  assert.match(recipes, /href="\/source-recipes\//u);
});

test('source-backed shelf page is read-only and does not call generation endpoints', () => {
  const page = fs.readFileSync(new URL('../../source-recipes.html', import.meta.url), 'utf8');
  assert.match(page, /真实菜饭资料库/);
  assert.match(page, /923 张执行卡/);
  assert.match(page, /首页现在会轮换全部 923 张卡/);
  assert.match(page, /source-backed-one-pot-shelf\.v1\.json/);
  assert.doesNotMatch(page, /generate-meal|plan-meal|DeepSeek/i);
  assert.match(page, /试做记录/);
  assert.match(page, /record\.shelf === 'C'/u);
  assert.match(page, /记录研究起步试做/u);
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
  assert.match(page, /研究做法卡/);
  assert.match(page, /执行字段完整（用量\/液体\/步骤\/时长）/u);
  assert.match(page, /无安全阻断且字段完整/u);
  assert.match(page, /安全阻断/u);
  assert.match(page, /原文量\/流程\/时间线索/u);
  assert.match(page, /原文完整/);
  assert.match(page, /来源\+研究补全/);
  assert.match(page, /估算\/身份稿/);
  assert.match(page, /逐条正式化审查/);
  assert.match(page, /可直接升 Planner/);
  assert.match(page, /appendResearchMethod\(article, record\)/);
  assert.match(page, /source-backed-formal-candidate-review\.v1\.json/u);
  assert.match(page, /source-backed-formal-staging\.v1\.json/u);
  assert.match(page, /来源合同完整待试做/u);
  assert.match(page, /正式化队列/u);
  assert.match(page, /执行字段：/u);
  assert.match(page, /试做包待记录/u);
  assert.match(page, /实际称量食材/u);
  assert.match(page, /锅具\/机型\/程序/u);
  assert.match(page, /成品质地与安全终点/u);
  assert.match(page, /Planner旅程\/过敏\/禁忌\/替换回归/u);
  assert.match(page, /queue\.priority/u);
  assert.match(page, /appendFormalCandidateReview\(article, record\)/u);
  assert.match(page, /details\.open = true/);
  assert.match(page, /研究草案（估算起步量）/);
  assert.match(page, /研究份数/);
  assert.match(page, /食材与用量/);
  assert.match(page, /record\.cooking_sequence/);
  assert.match(page, /record\.fixed_batch/);
  assert.match(page, /function regionPriority\(record\)/);
  assert.match(page, /filtered\.sort\(\(a, b\) => regionPriority\(a\)/);
  assert.match(page, /typeof target\.scrollIntoView === 'function'/);
  assert.match(page, /无法展示这条记录/);
});

test('existing recipe page links to the source-backed shelf without changing its recipe contract', () => {
  const page = fs.readFileSync(new URL('../../recipes.html', import.meta.url), 'utf8');
  assert.match(page, /href="\/source-recipes\//u);
  assert.match(page, /72 道/);
  assert.match(page, /来源执行卡 923 道/);
});

test('every source-backed card exposes the shared execution-card detail route', () => {
  const page = fs.readFileSync(new URL('../../source-recipes.html', import.meta.url), 'utf8');
  assert.match(page, /recipes\/\?id=/u);
  assert.doesNotMatch(page, /recipes\.html\?id=/u);
  assert.match(page, /打开执行卡/u);
  assert.match(page, /cook\/?\?id=/u);
});

test('step-by-step execution page returns through the stable source catalog route', () => {
  const page = fs.readFileSync(new URL('../../cook.html', import.meta.url), 'utf8');
  assert.match(page, /href="\/source-recipes\//u);
  assert.doesNotMatch(page, /href="\/source-recipes"/u);
});
