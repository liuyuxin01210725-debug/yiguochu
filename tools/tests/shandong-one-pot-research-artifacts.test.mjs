import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildShandongOnePotResearchReport } from '../lib/shandong-one-pot-research-builder.mjs';
import {
  renderShandongOnePotResearchJson,
  renderShandongOnePotResearchMarkdown,
  renderShandongOnePotJourneyReviewMarkdown,
} from '../lib/shandong-one-pot-research-renderer.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUILD = fileURLToPath(new URL('../build-shandong-one-pot-research.mjs', import.meta.url));
const BUILD_DIST = fileURLToPath(new URL('../build-dist.mjs', import.meta.url));
const CHECK_RECIPES = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
const DATA_FILES = [
  'shandong-one-pot-research.v1.json', 'recipe-library.json', 'regional-menu-research.v1.json',
  'regional-atlas.v2.json', 'regional-menu-mappings.v1.json',
];
const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));

function fixedReport() {
  return buildShandongOnePotResearchReport({
    assessment: readJson('shandong-one-pot-research.v1.json'),
    recipeLibrary: readJson('recipe-library.json'),
    regionalResearch: readJson('regional-menu-research.v1.json'),
    regionalAtlas: readJson('regional-atlas.v2.json'),
    regionalMappings: readJson('regional-menu-mappings.v1.json'),
  });
}

function makeTempBuildRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'shandong-one-pot-build-'));
  fs.mkdirSync(path.join(tempRoot, 'tools', 'data'), { recursive: true });
  fs.copyFileSync(BUILD, path.join(tempRoot, 'tools', 'build-shandong-one-pot-research.mjs'));
  fs.cpSync(new URL('../lib/', import.meta.url), path.join(tempRoot, 'tools', 'lib'), { recursive: true });
  for (const name of DATA_FILES) fs.copyFileSync(new URL(`../data/${name}`, import.meta.url), path.join(tempRoot, 'tools', 'data', name));
  return tempRoot;
}

test('renderers are deterministic and preserve evidence versus production boundaries', () => {
  const report = fixedReport();
  assert.equal(renderShandongOnePotResearchJson(report), renderShandongOnePotResearchJson(report));
  const markdown = renderShandongOnePotResearchMarkdown(report);
  assert.equal(markdown, renderShandongOnePotResearchMarkdown(report));
  assert.match(markdown, /研究资料，不是生产菜谱批准/);
  assert.match(markdown, /跨北方.*不.*山东起源|山东起源.*未证明/);
  assert.match(markdown, /粉条.*未证明/);
  assert.match(markdown, /锅外.*现成主食/);
  assert.match(markdown, /research_in_progress/);
  const review = renderShandongOnePotJourneyReviewMarkdown(report);
  assert.equal(review, renderShandongOnePotJourneyReviewMarkdown(report));
  assert.match(review, /12 条家庭食材旅程/);
  assert.equal((review.match(/待人工评审/g) || []).length, 12);
  assert.doesNotMatch(review, /自动通过|人工批准完成/);
});

test('checked-in Shandong research artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /1 Shandong production audit/);
  assert.match(result.stdout, /4 candidates/);
  assert.match(result.stdout, /12 journeys/);
});

test('build CLI writes fixed artifacts and fails closed when one becomes stale', () => {
  const tempRoot = makeTempBuildRoot();
  try {
    const script = path.join(tempRoot, 'tools', 'build-shandong-one-pot-research.mjs');
    const write = spawnSync(process.execPath, [script, '--write'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(write.status, 0, `${write.stdout}\n${write.stderr}`);
    const expected = [
      'tools/generated/shandong-one-pot-research.v1.json',
      'docs/shandong-one-pot-research.md',
      'docs/shandong-one-pot-journey-review.md',
    ];
    for (const name of expected) assert.ok(fs.existsSync(path.join(tempRoot, name)), name);
    fs.appendFileSync(path.join(tempRoot, expected[1]), '\nstale\n');
    const check = spawnSync(process.execPath, [script, '--check'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(check.status, 1, `${check.stdout}\n${check.stderr}`);
    assert.match(check.stderr, /Missing or stale: docs\/shandong-one-pot-research\.md/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('build CLI rejects invalid invocation without writing', () => {
  const result = spawnSync(process.execPath, [BUILD, '--unknown'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage: node tools\/build-shandong-one-pot-research\.mjs --write\|--check/);
});

test('aggregate recipe gate includes Shandong research freshness', () => {
  const result = spawnSync(process.execPath, [CHECK_RECIPES], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /1 Shandong production audit · 4 candidates · 12 journeys · Shandong research ok/);
});

test('distribution build excludes Shandong research source and generated assets', () => {
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  const output = fs.mkdtempSync(path.join(ROOT, 'dist', '.shandong-research-isolation-'));
  try {
    const result = spawnSync(process.execPath, [
      BUILD_DIST, '--out-dir', output, '--build-id', 'shandong-research-isolation-test',
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
    assert.equal(relativeFiles.some(file => file.includes('shandong-one-pot-research')), false, relativeFiles.join('\n'));
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
