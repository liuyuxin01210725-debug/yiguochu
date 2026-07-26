import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildNortheastStewResearchReport } from '../lib/northeast-stew-research-builder.mjs';
import {
  renderNortheastStewResearchJson,
  renderNortheastStewResearchMarkdown,
  renderNortheastStewJourneyReviewMarkdown,
} from '../lib/northeast-stew-research-renderer.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUILD = fileURLToPath(new URL('../build-northeast-stew-research.mjs', import.meta.url));
const BUILD_DIST = fileURLToPath(new URL('../build-dist.mjs', import.meta.url));
const DATA_FILES = [
  'northeast-stew-research.v1.json',
  'regional-atlas.v2.json',
  'regional-menu-research.v1.json',
];
const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));

function fixedReport() {
  return buildNortheastStewResearchReport({
    assessment: readJson('northeast-stew-research.v1.json'),
    regionalAtlas: readJson('regional-atlas.v2.json'),
    regionalResearch: readJson('regional-menu-research.v1.json'),
  });
}

function makeTempBuildRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'northeast-stew-build-'));
  const tempTools = path.join(tempRoot, 'tools');
  fs.mkdirSync(path.join(tempTools, 'data'), { recursive: true });
  fs.copyFileSync(BUILD, path.join(tempTools, 'build-northeast-stew-research.mjs'));
  fs.cpSync(new URL('../lib/', import.meta.url), path.join(tempTools, 'lib'), { recursive: true });
  for (const name of DATA_FILES) {
    fs.copyFileSync(new URL(`../data/${name}`, import.meta.url), path.join(tempTools, 'data', name));
  }
  return tempRoot;
}

test('renderers are deterministic and preserve the research boundary', () => {
  const report = fixedReport();
  assert.equal(renderNortheastStewResearchJson(report), renderNortheastStewResearchJson(report));
  const markdown = renderNortheastStewResearchMarkdown(report);
  assert.equal(markdown, renderNortheastStewResearchMarkdown(report));
  assert.match(markdown, /研究资料，不是生产菜谱批准/);
  assert.match(markdown, /四项固定组合.*未证明/);
  assert.match(markdown, /粘卷子.*北京平谷.*东北关联.*未核实/);
  assert.match(markdown, /research_in_progress/);

  const review = renderNortheastStewJourneyReviewMarkdown(report);
  assert.equal(review, renderNortheastStewJourneyReviewMarkdown(report));
  assert.match(review, /10 条家庭食材旅程/);
  assert.match(review, /家庭直觉/);
  assert.match(review, /可操作性/);
  assert.match(review, /味型判断/);
  assert.equal((review.match(/待人工评审/g) || []).length, 10);
  assert.doesNotMatch(review, /自动通过|人工批准完成/);
});

test('checked-in northeast research artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /4 prototypes/);
  assert.match(result.stdout, /7 sources/);
  assert.match(result.stdout, /10 journeys/);
  assert.match(result.stdout, /research_in_progress/);
});

test('build CLI writes fixed artifacts and fails closed when one becomes stale', () => {
  const tempRoot = makeTempBuildRoot();
  try {
    const script = path.join(tempRoot, 'tools', 'build-northeast-stew-research.mjs');
    const write = spawnSync(process.execPath, [script, '--write'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(write.status, 0, `${write.stdout}\n${write.stderr}`);
    const expected = [
      'tools/generated/northeast-stew-research.v1.json',
      'docs/northeast-stew-research.md',
      'docs/northeast-stew-journey-review.md',
    ];
    for (const name of expected) assert.ok(fs.existsSync(path.join(tempRoot, name)), name);
    fs.appendFileSync(path.join(tempRoot, expected[1]), '\nstale\n');
    const check = spawnSync(process.execPath, [script, '--check'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(check.status, 1, `${check.stdout}\n${check.stderr}`);
    assert.match(check.stderr, /Missing or stale: docs\/northeast-stew-research\.md/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('build CLI rejects invalid invocation without writing', () => {
  const result = spawnSync(process.execPath, [BUILD, '--unknown'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage: node tools\/build-northeast-stew-research\.mjs --write\|--check/);
});

test('aggregate recipe gate includes northeast research freshness', () => {
  const checker = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [checker], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /4 northeast prototypes/);
  assert.match(result.stdout, /7 sources/);
  assert.match(result.stdout, /10 journeys/);
  assert.match(result.stdout, /northeast research ok/);
});

test('distribution build excludes northeast research source and generated assets', () => {
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  const output = fs.mkdtempSync(path.join(ROOT, 'dist', '.northeast-research-isolation-'));
  try {
    const result = spawnSync(process.execPath, [
      BUILD_DIST,
      '--out-dir', output,
      '--build-id', 'northeast-research-isolation-test',
    ], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const relativeFiles = [];
    const visit = directory => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(fullPath);
        else relativeFiles.push(path.relative(output, fullPath));
      }
    };
    visit(output);
    assert.equal(relativeFiles.some(name => /northeast-stew-research|northeast-stew-journey-review/.test(name)), false);
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
