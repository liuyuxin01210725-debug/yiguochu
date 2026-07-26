import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildNorthwestOnePotResearchReport } from '../lib/northwest-one-pot-research-builder.mjs';
import {
  buildNorthwestOnePotResearchArtifacts,
  renderNorthwestOnePotResearchJson,
  renderNorthwestOnePotResearchMarkdown,
  renderNorthwestOnePotJourneyReviewMarkdown,
} from '../lib/northwest-one-pot-research-renderer.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUILD = fileURLToPath(new URL('../build-northwest-one-pot-research.mjs', import.meta.url));
const BUILD_DIST = fileURLToPath(new URL('../build-dist.mjs', import.meta.url));
const CHECK_RECIPES = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
const DATA_FILES = [
  'northwest-one-pot-research.v1.json',
  'recipe-library.json',
  'regional-menu-research.v1.json',
  'regional-atlas.v2.json',
  'regional-menu-mappings.v1.json',
];
const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const RESEARCH_ONLY_SENTINELS = [
  'northwest-one-pot-research-v1-20260726',
  '宁夏肉粘饭炒后同蒸',
  '西北一锅主餐研究覆盖层',
];

function fixedReport() {
  return buildNorthwestOnePotResearchReport({
    assessment: readJson('northwest-one-pot-research.v1.json'),
    recipeLibrary: readJson('recipe-library.json'),
    regionalResearch: readJson('regional-menu-research.v1.json'),
    regionalAtlas: readJson('regional-atlas.v2.json'),
    regionalMappings: readJson('regional-menu-mappings.v1.json'),
  });
}

function makeTempBuildRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'northwest-one-pot-build-'));
  fs.mkdirSync(path.join(tempRoot, 'tools', 'data'), { recursive: true });
  fs.copyFileSync(BUILD, path.join(tempRoot, 'tools', 'build-northwest-one-pot-research.mjs'));
  fs.cpSync(new URL('../lib/', import.meta.url), path.join(tempRoot, 'tools', 'lib'), { recursive: true });
  for (const name of DATA_FILES) fs.copyFileSync(new URL(`../data/${name}`, import.meta.url), path.join(tempRoot, 'tools', 'data', name));
  return tempRoot;
}

function readBuildFilesAsBuffers(output) {
  const files = [];
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else files.push(path.relative(output, full));
    }
  };
  visit(output);
  return { files, buffers: files.map(file => fs.readFileSync(path.join(output, file))) };
}

function assertNoResearchOnlyContent(buffers) {
  for (const sentinel of RESEARCH_ONLY_SENTINELS) {
    assert.equal(buffers.some(content => content.includes(Buffer.from(sentinel, 'utf8'))), false, `research-only content leaked into distribution build: ${sentinel}`);
  }
}

test('artifact map renders Northwest evidence boundaries and sixteen pending journeys deterministically', () => {
  const report = fixedReport();
  const artifacts = buildNorthwestOnePotResearchArtifacts(report);
  assert.deepEqual([...artifacts.keys()], [
    'tools/generated/northwest-one-pot-research.v1.json',
    'docs/northwest-one-pot-research.md',
    'docs/northwest-one-pot-journey-review.md',
  ]);
  const json = renderNorthwestOnePotResearchJson(report);
  assert.equal(json, renderNorthwestOnePotResearchJson(report));
  assert.ok(json.endsWith('\n'));
  const markdown = renderNorthwestOnePotResearchMarkdown(report);
  assert.equal(markdown, renderNorthwestOnePotResearchMarkdown(report));
  assert.match(markdown, /研究覆盖层，不是生产菜谱/);
  assert.match(markdown, /软粮|软谷物/);
  assert.match(markdown, /普通大米|白米/);
  assert.match(markdown, /羊肉抓饭.*素抓饭|素抓饭.*羊肉抓饭/);
  assert.match(markdown, /甘肃.*宁夏.*新疆.*面片|面片.*甘肃.*宁夏.*新疆/);
  assert.match(markdown, /持续搅拌|手工搅制/);
  assert.match(markdown, /先炒后蒸/);
  assert.match(markdown, /烩小吃/);
  assert.match(markdown, /馓饭|糁饭/);
  assert.match(markdown, /八宝茶/);
  assert.match(markdown, /research_in_progress/);
  const review = renderNorthwestOnePotJourneyReviewMarkdown(report);
  assert.match(review, /16 条家庭食材旅程/);
  assert.equal((review.match(/待人工评审/g) || []).length, 16);
});

test('checked-in Northwest research artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /3 Northwest production audits/);
  assert.match(result.stdout, /0 candidates/);
  assert.match(result.stdout, /8 research leads/);
  assert.match(result.stdout, /16 journeys/);
  assert.match(result.stdout, /Northwest research in progress/);
});

test('build CLI writes fixed artifacts and fails closed when one becomes stale', () => {
  const tempRoot = makeTempBuildRoot();
  try {
    const script = path.join(tempRoot, 'tools', 'build-northwest-one-pot-research.mjs');
    const write = spawnSync(process.execPath, [script, '--write'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(write.status, 0, `${write.stdout}\n${write.stderr}`);
    const markdown = path.join(tempRoot, 'docs', 'northwest-one-pot-research.md');
    fs.appendFileSync(markdown, '\nstale\n');
    const check = spawnSync(process.execPath, [script, '--check'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(check.status, 1);
    assert.match(check.stderr, /Missing or stale: docs\/northwest-one-pot-research\.md/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('build CLI rejects invalid invocation without writing', () => {
  const result = spawnSync(process.execPath, [BUILD, '--unknown'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage: node tools\/build-northwest-one-pot-research\.mjs --write\|--check/);
});

test('aggregate recipe gate includes Northwest research freshness', () => {
  const result = spawnSync(process.execPath, [CHECK_RECIPES], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /3 Northwest production audits · 0 candidates · 8 research leads · 16 journeys · Northwest research in progress/);
});

test('distribution build excludes Northwest research source and generated assets', () => {
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  const output = fs.mkdtempSync(path.join(ROOT, 'dist', '.northwest-research-isolation-'));
  try {
    const result = spawnSync(process.execPath, [BUILD_DIST, '--out-dir', output, '--build-id', 'northwest-research-isolation-test'], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const { files, buffers } = readBuildFilesAsBuffers(output);
    assert.equal(files.some(name => /northwest-one-pot-research|northwest-one-pot-journey-review/.test(name)), false);
    assertNoResearchOnlyContent(buffers);
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
