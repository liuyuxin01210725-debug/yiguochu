import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildMiddleYangtzeMainMealResearchReport } from '../lib/middle-yangtze-main-meal-research-builder.mjs';
import {
  buildMiddleYangtzeMainMealResearchArtifacts,
  renderMiddleYangtzeMainMealJourneyReviewMarkdown,
  renderMiddleYangtzeMainMealResearchJson,
  renderMiddleYangtzeMainMealResearchMarkdown,
} from '../lib/middle-yangtze-main-meal-research-renderer.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUILD = fileURLToPath(new URL('../build-middle-yangtze-main-meal-research.mjs', import.meta.url));
const BUILD_DIST = fileURLToPath(new URL('../build-dist.mjs', import.meta.url));
const CHECK_RECIPES = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
const DATA_FILES = [
  'middle-yangtze-main-meal-research.v1.json', 'recipe-library.json', 'regional-menu-research.v1.json',
  'regional-atlas.v2.json', 'regional-menu-mappings.v1.json',
];
const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));

function fixedReport() {
  return buildMiddleYangtzeMainMealResearchReport({
    assessment: readJson('middle-yangtze-main-meal-research.v1.json'),
    recipeLibrary: readJson('recipe-library.json'),
    regionalResearch: readJson('regional-menu-research.v1.json'),
    regionalAtlas: readJson('regional-atlas.v2.json'),
    regionalMappings: readJson('regional-menu-mappings.v1.json'),
  });
}

function makeTempBuildRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'middle-yangtze-main-meal-build-'));
  fs.mkdirSync(path.join(tempRoot, 'tools', 'data'), { recursive: true });
  fs.copyFileSync(BUILD, path.join(tempRoot, 'tools', 'build-middle-yangtze-main-meal-research.mjs'));
  fs.cpSync(new URL('../lib/', import.meta.url), path.join(tempRoot, 'tools', 'lib'), { recursive: true });
  for (const name of DATA_FILES) fs.copyFileSync(new URL(`../data/${name}`, import.meta.url), path.join(tempRoot, 'tools', 'data', name));
  return tempRoot;
}

test('artifact map uses fixed paths and renders the anti-misleading boundaries deterministically', () => {
  const report = fixedReport();
  const artifacts = buildMiddleYangtzeMainMealResearchArtifacts(report);
  assert.deepEqual([...artifacts.keys()], [
    'tools/generated/middle-yangtze-main-meal-research.v1.json',
    'docs/middle-yangtze-main-meal-research.md',
    'docs/middle-yangtze-main-meal-journey-review.md',
  ]);
  const json = renderMiddleYangtzeMainMealResearchJson(report);
  assert.equal(json, renderMiddleYangtzeMainMealResearchJson(report));
  assert.ok(json.endsWith('\n'));
  const markdown = renderMiddleYangtzeMainMealResearchMarkdown(report);
  assert.equal(markdown, renderMiddleYangtzeMainMealResearchMarkdown(report));
  assert.match(markdown, /研究覆盖层，不是生产菜谱/);
  assert.match(markdown, /现成.*豆皮.*原米|原米.*不能.*豆皮/);
  assert.match(markdown, /比例.*矛盾.*Ratio DSL/);
  assert.match(markdown, /瓦罐汤.*两容器/);
  assert.match(markdown, /加热.*不能.*米酵菌酸/);
  assert.match(markdown, /research_in_progress/);
  const review = renderMiddleYangtzeMainMealJourneyReviewMarkdown(report);
  assert.equal(review, renderMiddleYangtzeMainMealJourneyReviewMarkdown(report));
  assert.match(review, /15 条家庭食材旅程/);
  assert.equal((review.match(/待人工评审/g) || []).length, 15);
  assert.doesNotMatch(review, /人工批准完成|自动通过/);
});

test('checked-in Middle Yangtze research artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /3 Middle Yangtze province gaps/);
  assert.match(result.stdout, /8 research leads/);
  assert.match(result.stdout, /15 journeys/);
});

test('build CLI writes fixed artifacts and fails closed when one becomes stale', () => {
  const tempRoot = makeTempBuildRoot();
  try {
    const script = path.join(tempRoot, 'tools', 'build-middle-yangtze-main-meal-research.mjs');
    const write = spawnSync(process.execPath, [script, '--write'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(write.status, 0, `${write.stdout}\n${write.stderr}`);
    const expected = [
      'tools/generated/middle-yangtze-main-meal-research.v1.json',
      'docs/middle-yangtze-main-meal-research.md',
      'docs/middle-yangtze-main-meal-journey-review.md',
    ];
    for (const name of expected) assert.ok(fs.existsSync(path.join(tempRoot, name)), name);
    fs.appendFileSync(path.join(tempRoot, expected[1]), '\nstale\n');
    const check = spawnSync(process.execPath, [script, '--check'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(check.status, 1, `${check.stdout}\n${check.stderr}`);
    assert.match(check.stderr, /Missing or stale: docs\/middle-yangtze-main-meal-research\.md/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('build CLI supports summary mode and rejects ambiguous invocation', () => {
  const summary = spawnSync(process.execPath, [BUILD], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(summary.status, 0, `${summary.stdout}\n${summary.stderr}`);
  assert.match(summary.stdout, /Middle Yangtze research ok/);
  for (const args of [['--unknown'], ['--write', '--check']]) {
    const result = spawnSync(process.execPath, [BUILD, ...args], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Usage: node tools\/build-middle-yangtze-main-meal-research\.mjs \[--write\|--check\]/);
  }
});

test('aggregate recipe gate includes Middle Yangtze research freshness', () => {
  const result = spawnSync(process.execPath, [CHECK_RECIPES], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /3 Middle Yangtze province gaps · 8 research leads · 15 journeys · Middle Yangtze research ok/);
});

test('distribution build excludes Middle Yangtze research assets', () => {
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  const output = fs.mkdtempSync(path.join(ROOT, 'dist', '.middle-yangtze-research-isolation-'));
  try {
    const result = spawnSync(process.execPath, [
      BUILD_DIST, '--out-dir', output, '--build-id', 'middle-yangtze-research-isolation-test',
    ], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const files = [];
    const visit = directory => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const full = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(full);
        else files.push(path.relative(output, full));
      }
    };
    visit(output);
    assert.ok(files.length > 0);
    assert.equal(files.some(file => file.includes('middle-yangtze-main-meal-research')), false, files.join('\n'));
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
