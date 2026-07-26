import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildCentralPlainsNoodleResearchReport } from '../lib/central-plains-noodle-research-builder.mjs';
import {
  buildCentralPlainsNoodleResearchArtifacts,
  renderCentralPlainsNoodleJourneyReviewMarkdown,
  renderCentralPlainsNoodleResearchJson,
  renderCentralPlainsNoodleResearchMarkdown,
} from '../lib/central-plains-noodle-research-renderer.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUILD = fileURLToPath(new URL('../build-central-plains-noodle-research.mjs', import.meta.url));
const BUILD_DIST = fileURLToPath(new URL('../build-dist.mjs', import.meta.url));
const CHECK_RECIPES = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
const DATA_FILES = [
  'central-plains-noodle-research.v1.json', 'recipe-library.json', 'regional-menu-research.v1.json',
  'regional-atlas.v2.json', 'regional-menu-mappings.v1.json',
];
const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));

function fixedReport() {
  return buildCentralPlainsNoodleResearchReport({
    assessment: readJson('central-plains-noodle-research.v1.json'),
    recipeLibrary: readJson('recipe-library.json'),
    regionalResearch: readJson('regional-menu-research.v1.json'),
    regionalAtlas: readJson('regional-atlas.v2.json'),
    regionalMappings: readJson('regional-menu-mappings.v1.json'),
  });
}

function makeTempBuildRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'central-plains-noodle-build-'));
  fs.mkdirSync(path.join(tempRoot, 'tools', 'data'), { recursive: true });
  fs.copyFileSync(BUILD, path.join(tempRoot, 'tools', 'build-central-plains-noodle-research.mjs'));
  fs.cpSync(new URL('../lib/', import.meta.url), path.join(tempRoot, 'tools', 'lib'), { recursive: true });
  for (const name of DATA_FILES) fs.copyFileSync(new URL(`../data/${name}`, import.meta.url), path.join(tempRoot, 'tools', 'data', name));
  return tempRoot;
}

test('artifact map uses three fixed paths and renderers are deterministic', () => {
  const report = fixedReport();
  const artifacts = buildCentralPlainsNoodleResearchArtifacts(report);
  assert.deepEqual([...artifacts.keys()], [
    'tools/generated/central-plains-noodle-research.v1.json',
    'docs/central-plains-noodle-research.md',
    'docs/central-plains-noodle-journey-review.md',
  ]);
  const json = renderCentralPlainsNoodleResearchJson(report);
  assert.equal(json, renderCentralPlainsNoodleResearchJson(report));
  assert.ok(json.endsWith('\n'));
  const markdown = renderCentralPlainsNoodleResearchMarkdown(report);
  assert.equal(markdown, renderCentralPlainsNoodleResearchMarkdown(report));
  assert.match(markdown, /研究覆盖层，不是生产菜谱/);
  assert.match(markdown, /跨地域.*不.*河南起源|河南起源.*未证明/);
  assert.match(markdown, /芹菜.*固定.*未证明/);
  assert.match(markdown, /发酵酸浆.*普通豆浆/);
  assert.match(markdown, /research_in_progress/);
  const review = renderCentralPlainsNoodleJourneyReviewMarkdown(report);
  assert.equal(review, renderCentralPlainsNoodleJourneyReviewMarkdown(report));
  assert.match(review, /12 条家庭食材旅程/);
  assert.equal((review.match(/待人工评审/g) || []).length, 12);
  assert.doesNotMatch(review, /自动通过|人工批准完成/);
});

test('checked-in Central Plains research artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /1 Central Plains production audit/);
  assert.match(result.stdout, /4 candidates/);
  assert.match(result.stdout, /12 journeys/);
});

test('build CLI writes fixed artifacts and fails closed when one becomes stale', () => {
  const tempRoot = makeTempBuildRoot();
  try {
    const script = path.join(tempRoot, 'tools', 'build-central-plains-noodle-research.mjs');
    const write = spawnSync(process.execPath, [script, '--write'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(write.status, 0, `${write.stdout}\n${write.stderr}`);
    const expected = [
      'tools/generated/central-plains-noodle-research.v1.json',
      'docs/central-plains-noodle-research.md',
      'docs/central-plains-noodle-journey-review.md',
    ];
    for (const name of expected) assert.ok(fs.existsSync(path.join(tempRoot, name)), name);
    fs.appendFileSync(path.join(tempRoot, expected[1]), '\nstale\n');
    const check = spawnSync(process.execPath, [script, '--check'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(check.status, 1, `${check.stdout}\n${check.stderr}`);
    assert.match(check.stderr, /Missing or stale: docs\/central-plains-noodle-research\.md/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('build CLI supports summary mode and rejects ambiguous or unknown invocation', () => {
  const summary = spawnSync(process.execPath, [BUILD], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(summary.status, 0, `${summary.stdout}\n${summary.stderr}`);
  assert.match(summary.stdout, /Central Plains research ok/);
  for (const args of [['--unknown'], ['--write', '--check']]) {
    const result = spawnSync(process.execPath, [BUILD, ...args], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Usage: node tools\/build-central-plains-noodle-research\.mjs \[--write\|--check\]/);
  }
});

test('aggregate recipe gate includes Central Plains research freshness', () => {
  const result = spawnSync(process.execPath, [CHECK_RECIPES], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /1 Central Plains production audit · 4 candidates · 12 journeys · Central Plains research ok/);
});

test('distribution build excludes Central Plains research source and generated assets', () => {
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  const output = fs.mkdtempSync(path.join(ROOT, 'dist', '.central-plains-research-isolation-'));
  try {
    const result = spawnSync(process.execPath, [
      BUILD_DIST, '--out-dir', output, '--build-id', 'central-plains-research-isolation-test',
    ], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const relativeFiles = [];
    const visit = directory => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const full = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(full);
        else relativeFiles.push(path.relative(output, full));
      }
    };
    visit(output);
    assert.ok(relativeFiles.length > 0);
    assert.equal(relativeFiles.some(file => file.includes('central-plains-noodle-research')), false, relativeFiles.join('\n'));
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
