import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildFujianTaiwanRiceNoodleResearchReport } from '../lib/fujian-taiwan-rice-noodle-research-builder.mjs';
import {
  buildFujianTaiwanRiceNoodleResearchArtifacts,
  renderFujianTaiwanRiceNoodleJourneyReviewMarkdown,
  renderFujianTaiwanRiceNoodleResearchJson,
  renderFujianTaiwanRiceNoodleResearchMarkdown,
} from '../lib/fujian-taiwan-rice-noodle-research-renderer.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUILD = fileURLToPath(new URL('../build-fujian-taiwan-rice-noodle-research.mjs', import.meta.url));
const BUILD_DIST = fileURLToPath(new URL('../build-dist.mjs', import.meta.url));
const CHECK_RECIPES = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
const DATA_FILES = [
  'fujian-taiwan-rice-noodle-research.v1.json', 'recipe-library.json',
  'regional-menu-research.v1.json', 'regional-atlas.v2.json', 'regional-menu-mappings.v1.json',
];
const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));

function fixedReport() {
  return buildFujianTaiwanRiceNoodleResearchReport({
    assessment: readJson('fujian-taiwan-rice-noodle-research.v1.json'),
    recipeLibrary: readJson('recipe-library.json'),
    regionalResearch: readJson('regional-menu-research.v1.json'),
    regionalAtlas: readJson('regional-atlas.v2.json'),
    regionalMappings: readJson('regional-menu-mappings.v1.json'),
  });
}

function makeTempBuildRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fujian-taiwan-rice-noodle-build-'));
  fs.mkdirSync(path.join(tempRoot, 'tools', 'data'), { recursive: true });
  fs.copyFileSync(BUILD, path.join(tempRoot, 'tools', 'build-fujian-taiwan-rice-noodle-research.mjs'));
  fs.cpSync(new URL('../lib/', import.meta.url), path.join(tempRoot, 'tools', 'lib'), { recursive: true });
  for (const name of DATA_FILES) fs.copyFileSync(new URL(`../data/${name}`, import.meta.url), path.join(tempRoot, 'tools', 'data', name));
  return tempRoot;
}

test('artifact map renders evidence boundaries and twelve pending journeys deterministically', () => {
  const report = fixedReport();
  const artifacts = buildFujianTaiwanRiceNoodleResearchArtifacts(report);
  assert.deepEqual([...artifacts.keys()], [
    'tools/generated/fujian-taiwan-rice-noodle-research.v1.json',
    'docs/fujian-taiwan-rice-noodle-research.md',
    'docs/fujian-taiwan-rice-noodle-journey-review.md',
  ]);
  const json = renderFujianTaiwanRiceNoodleResearchJson(report);
  assert.equal(json, renderFujianTaiwanRiceNoodleResearchJson(report));
  assert.ok(json.endsWith('\n'));
  const markdown = renderFujianTaiwanRiceNoodleResearchMarkdown(report);
  assert.equal(markdown, renderFujianTaiwanRiceNoodleResearchMarkdown(report));
  assert.match(markdown, /研究覆盖层，不是生产菜谱/);
  assert.match(markdown, /0\.8.*不能.*总保留液体|总保留液体.*不能.*0\.8/);
  assert.match(markdown, /泉州.*大米.*海味.*不等于.*糯米|糯米.*不等于.*泉州/);
  assert.match(markdown, /学生餐.*不能证明.*传统/);
  assert.match(markdown, /店家历史.*不等于.*配方/);
  assert.match(markdown, /research_in_progress/);
  const review = renderFujianTaiwanRiceNoodleJourneyReviewMarkdown(report);
  assert.match(review, /12 条家庭食材旅程/);
  assert.equal((review.match(/待人工评审/g) || []).length, 12);
  assert.doesNotMatch(review, /人工批准完成|自动通过/);
});

test('checked-in Fujian-Taiwan research artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /6 Fujian-Taiwan recipe audits/);
  assert.match(result.stdout, /3 research leads/);
  assert.match(result.stdout, /12 journeys/);
});

test('build CLI writes fixed artifacts and fails closed when one becomes stale', () => {
  const tempRoot = makeTempBuildRoot();
  try {
    const script = path.join(tempRoot, 'tools', 'build-fujian-taiwan-rice-noodle-research.mjs');
    const write = spawnSync(process.execPath, [script, '--write'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(write.status, 0, `${write.stdout}\n${write.stderr}`);
    const expected = [
      'tools/generated/fujian-taiwan-rice-noodle-research.v1.json',
      'docs/fujian-taiwan-rice-noodle-research.md',
      'docs/fujian-taiwan-rice-noodle-journey-review.md',
    ];
    for (const name of expected) assert.ok(fs.existsSync(path.join(tempRoot, name)), name);
    fs.appendFileSync(path.join(tempRoot, expected[1]), '\nstale\n');
    const check = spawnSync(process.execPath, [script, '--check'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(check.status, 1, `${check.stdout}\n${check.stderr}`);
    assert.match(check.stderr, /Missing or stale: docs\/fujian-taiwan-rice-noodle-research\.md/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('build CLI supports summary mode and rejects ambiguous invocation', () => {
  const summary = spawnSync(process.execPath, [BUILD], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(summary.status, 0, `${summary.stdout}\n${summary.stderr}`);
  assert.match(summary.stdout, /Fujian-Taiwan research ok/);
  for (const args of [['--unknown'], ['--write', '--check']]) {
    const result = spawnSync(process.execPath, [BUILD, ...args], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Usage: node tools\/build-fujian-taiwan-rice-noodle-research\.mjs \[--write\|--check\]/);
  }
});

test('aggregate recipe gate includes Fujian-Taiwan research freshness', () => {
  const result = spawnSync(process.execPath, [CHECK_RECIPES], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /6 Fujian-Taiwan recipe audits · 3 research leads · 12 journeys · Fujian-Taiwan research ok/);
});

test('distribution build excludes Fujian-Taiwan research assets', () => {
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  const output = fs.mkdtempSync(path.join(ROOT, 'dist', '.fujian-taiwan-research-isolation-'));
  try {
    const result = spawnSync(process.execPath, [BUILD_DIST, '--out-dir', output, '--build-id', 'fujian-taiwan-research-isolation-test'], { cwd: ROOT, encoding: 'utf8' });
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
    assert.equal(files.some(file => file.includes('fujian-taiwan-rice-noodle-research')), false, files.join('\n'));
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
