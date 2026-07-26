import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildSichuanChongqingRiceResearchReport } from '../lib/sichuan-chongqing-rice-research-builder.mjs';
import {
  buildSichuanChongqingRiceResearchArtifacts,
  renderSichuanChongqingRiceJourneyReviewMarkdown,
  renderSichuanChongqingRiceResearchJson,
  renderSichuanChongqingRiceResearchMarkdown,
} from '../lib/sichuan-chongqing-rice-research-renderer.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUILD = fileURLToPath(new URL('../build-sichuan-chongqing-rice-research.mjs', import.meta.url));
const BUILD_DIST = fileURLToPath(new URL('../build-dist.mjs', import.meta.url));
const CHECK_RECIPES = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
const DATA_FILES = ['sichuan-chongqing-rice-research.v1.json', 'recipe-library.json', 'regional-menu-research.v1.json', 'regional-atlas.v2.json', 'regional-menu-mappings.v1.json'];
const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));

function fixedReport() {
  return buildSichuanChongqingRiceResearchReport({
    assessment: readJson('sichuan-chongqing-rice-research.v1.json'),
    recipeLibrary: readJson('recipe-library.json'),
    regionalResearch: readJson('regional-menu-research.v1.json'),
    regionalAtlas: readJson('regional-atlas.v2.json'),
    regionalMappings: readJson('regional-menu-mappings.v1.json'),
  });
}

function makeTempBuildRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sichuan-chongqing-rice-build-'));
  fs.mkdirSync(path.join(tempRoot, 'tools', 'data'), { recursive: true });
  fs.copyFileSync(BUILD, path.join(tempRoot, 'tools', 'build-sichuan-chongqing-rice-research.mjs'));
  fs.cpSync(new URL('../lib/', import.meta.url), path.join(tempRoot, 'tools', 'lib'), { recursive: true });
  for (const name of DATA_FILES) fs.copyFileSync(new URL(`../data/${name}`, import.meta.url), path.join(tempRoot, 'tools', 'data', name));
  return tempRoot;
}

test('artifact map renders evidence boundaries and twelve pending journeys deterministically', () => {
  const report = fixedReport();
  const artifacts = buildSichuanChongqingRiceResearchArtifacts(report);
  assert.deepEqual([...artifacts.keys()], [
    'tools/generated/sichuan-chongqing-rice-research.v1.json',
    'docs/sichuan-chongqing-rice-research.md',
    'docs/sichuan-chongqing-rice-journey-review.md',
  ]);
  const json = renderSichuanChongqingRiceResearchJson(report);
  assert.equal(json, renderSichuanChongqingRiceResearchJson(report));
  assert.ok(json.endsWith('\n'));
  const markdown = renderSichuanChongqingRiceResearchMarkdown(report);
  assert.equal(markdown, renderSichuanChongqingRiceResearchMarkdown(report));
  assert.match(markdown, /研究覆盖层，不是生产菜谱/);
  assert.match(markdown, /半熟.*沥.*不等于.*生米|生米.*不等于.*半熟/);
  assert.match(markdown, /并列可选.*不等于.*固定共现|固定共现.*不等于.*并列可选/);
  assert.match(markdown, /柴火.*不等于.*电饭煲|电饭煲.*不等于.*柴火/);
  assert.match(markdown, /research_in_progress/);
  const review = renderSichuanChongqingRiceJourneyReviewMarkdown(report);
  assert.match(review, /12 条家庭食材旅程/);
  assert.equal((review.match(/待人工评审/g) || []).length, 12);
});

test('checked-in Sichuan-Chongqing research artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /0 Sichuan-Chongqing production audits/);
  assert.match(result.stdout, /4 candidates/);
  assert.match(result.stdout, /3 research leads/);
  assert.match(result.stdout, /12 journeys/);
});

test('build CLI writes fixed artifacts and fails closed when one becomes stale', () => {
  const tempRoot = makeTempBuildRoot();
  try {
    const script = path.join(tempRoot, 'tools', 'build-sichuan-chongqing-rice-research.mjs');
    const write = spawnSync(process.execPath, [script, '--write'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(write.status, 0, `${write.stdout}\n${write.stderr}`);
    const markdown = path.join(tempRoot, 'docs', 'sichuan-chongqing-rice-research.md');
    fs.appendFileSync(markdown, '\nstale\n');
    const check = spawnSync(process.execPath, [script, '--check'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(check.status, 1);
    assert.match(check.stderr, /Missing or stale: docs\/sichuan-chongqing-rice-research\.md/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('aggregate recipe gate includes Sichuan-Chongqing research freshness', () => {
  const result = spawnSync(process.execPath, [CHECK_RECIPES], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /0 Sichuan-Chongqing production audits · 4 candidates · 3 research leads · 12 journeys · Sichuan-Chongqing research ok/);
});

test('distribution build excludes Sichuan-Chongqing research assets', () => {
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  const output = fs.mkdtempSync(path.join(ROOT, 'dist', '.sichuan-chongqing-research-isolation-'));
  try {
    const result = spawnSync(process.execPath, [BUILD_DIST, '--out-dir', output, '--build-id', 'sichuan-chongqing-research-isolation-test'], { cwd: ROOT, encoding: 'utf8' });
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
    assert.equal(files.some(file => file.includes('sichuan-chongqing-rice-research')), false, files.join('\n'));
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
