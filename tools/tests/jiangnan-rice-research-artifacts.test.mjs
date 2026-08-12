import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildJiangnanRiceResearchReport } from '../lib/jiangnan-rice-research-builder.mjs';
import {
  renderJiangnanRiceResearchJson,
  renderJiangnanRiceResearchMarkdown,
  renderJiangnanRiceJourneyReviewMarkdown,
} from '../lib/jiangnan-rice-research-renderer.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUILD = fileURLToPath(new URL('../build-jiangnan-rice-research.mjs', import.meta.url));
const BUILD_DIST = fileURLToPath(new URL('../build-dist.mjs', import.meta.url));
const CHECK_RECIPES = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
const DATA_FILES = [
  'jiangnan-rice-research.v1.json',
  'recipe-library.json',
  'recipe-candidates.json',
  'regional-atlas.v2.json',
  'regional-menu-mappings.v1.json',
];
const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));

function fixedReport() {
  return buildJiangnanRiceResearchReport({
    assessment: readJson('jiangnan-rice-research.v1.json'),
    recipeLibrary: readJson('recipe-library.json'),
    recipeCandidates: readJson('recipe-candidates.json'),
    regionalAtlas: readJson('regional-atlas.v2.json'),
    regionalMappings: readJson('regional-menu-mappings.v1.json'),
  });
}

function makeTempBuildRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jiangnan-rice-build-'));
  const tempTools = path.join(tempRoot, 'tools');
  fs.mkdirSync(path.join(tempTools, 'data'), { recursive: true });
  fs.copyFileSync(BUILD, path.join(tempTools, 'build-jiangnan-rice-research.mjs'));
  fs.cpSync(new URL('../lib/', import.meta.url), path.join(tempTools, 'lib'), { recursive: true });
  for (const name of DATA_FILES) fs.copyFileSync(new URL(`../data/${name}`, import.meta.url), path.join(tempTools, 'data', name));
  return tempRoot;
}

test('renderers are deterministic and preserve production versus research boundaries', () => {
  const report = fixedReport();
  assert.equal(renderJiangnanRiceResearchJson(report), renderJiangnanRiceResearchJson(report));
  const markdown = renderJiangnanRiceResearchMarkdown(report);
  assert.equal(markdown, renderJiangnanRiceResearchMarkdown(report));
  assert.match(markdown, /研究资料，不是生产菜谱批准/);
  assert.match(markdown, /糯米.*普通大米.*未证明/);
  assert.match(markdown, /半山.*平菇.*未证明/);
  assert.match(markdown, /安徽.*研究线索/);
  assert.match(markdown, /0 道生产.*2 条研究线索/);
  assert.match(markdown, /research_in_progress/);

  const review = renderJiangnanRiceJourneyReviewMarkdown(report);
  assert.equal(review, renderJiangnanRiceJourneyReviewMarkdown(report));
  assert.match(review, /12 条家庭食材旅程/);
  assert.match(review, /家庭直觉/);
  assert.match(review, /可操作性/);
  assert.match(review, /味型判断/);
  assert.equal((review.match(/待人工评审/g) || []).length, 12);
  assert.doesNotMatch(review, /自动通过|人工批准完成/);
});

test('checked-in Jiangnan research artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /8 recipe audits/);
  assert.match(result.stdout, /8 sources/);
  assert.match(result.stdout, /2 Anhui leads/);
  assert.match(result.stdout, /12 journeys/);
  assert.match(result.stdout, /research_in_progress/);
});

test('build CLI writes fixed artifacts and fails closed when one becomes stale', () => {
  const tempRoot = makeTempBuildRoot();
  try {
    const script = path.join(tempRoot, 'tools', 'build-jiangnan-rice-research.mjs');
    const write = spawnSync(process.execPath, [script, '--write'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(write.status, 0, `${write.stdout}\n${write.stderr}`);
    const expected = [
      'tools/generated/jiangnan-rice-research.v1.json',
      'docs/jiangnan-rice-research.md',
      'docs/jiangnan-rice-journey-review.md',
    ];
    for (const name of expected) assert.ok(fs.existsSync(path.join(tempRoot, name)), name);
    fs.appendFileSync(path.join(tempRoot, expected[1]), '\nstale\n');
    const check = spawnSync(process.execPath, [script, '--check'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(check.status, 1, `${check.stdout}\n${check.stderr}`);
    assert.match(check.stderr, /Missing or stale: docs\/jiangnan-rice-research\.md/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('build CLI rejects invalid invocation without writing', () => {
  const result = spawnSync(process.execPath, [BUILD, '--unknown'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage: node tools\/build-jiangnan-rice-research\.mjs --write\|--check/);
});

test('aggregate recipe gate includes Jiangnan research freshness', () => {
  const result = spawnSync(process.execPath, [CHECK_RECIPES], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /8 Jiangnan recipe audits/);
  assert.match(result.stdout, /8 sources/);
  assert.match(result.stdout, /12 journeys/);
  assert.match(result.stdout, /Jiangnan research ok/);
});

test('distribution build excludes Jiangnan research source and generated assets', () => {
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  const output = fs.mkdtempSync(path.join(ROOT, 'dist', '.jiangnan-research-isolation-'));
  try {
    const result = spawnSync(process.execPath, [
      BUILD_DIST,
      '--out-dir', output,
      '--build-id', 'jiangnan-research-isolation-test',
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
    assert.equal(relativeFiles.some(file => file.includes('jiangnan-rice-research')), false, relativeFiles.join('\n'));
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
