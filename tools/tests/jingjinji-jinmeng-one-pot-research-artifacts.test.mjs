import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildJingjinjiJinmengOnePotResearchReport } from '../lib/jingjinji-jinmeng-one-pot-research-builder.mjs';
import { buildJingjinjiJinmengOnePotResearchArtifacts, renderJingjinjiJinmengOnePotResearchMarkdown, renderJingjinjiJinmengOnePotJourneyReviewMarkdown } from '../lib/jingjinji-jinmeng-one-pot-research-renderer.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUILD = fileURLToPath(new URL('../build-jingjinji-jinmeng-one-pot-research.mjs', import.meta.url));
const BUILD_DIST = fileURLToPath(new URL('../build-dist.mjs', import.meta.url));
const CHECK_RECIPES = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
const DATA_FILES = ['jingjinji-jinmeng-one-pot-research.v1.json', 'recipe-library.json', 'regional-menu-research.v1.json', 'regional-atlas.v2.json', 'regional-menu-mappings.v1.json'];
const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const fixedReport = () => buildJingjinjiJinmengOnePotResearchReport({ assessment: readJson(DATA_FILES[0]), recipeLibrary: readJson(DATA_FILES[1]), regionalResearch: readJson(DATA_FILES[2]), regionalAtlas: readJson(DATA_FILES[3]), regionalMappings: readJson(DATA_FILES[4]) });

function makeTempBuildRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'north-china-research-'));
  fs.mkdirSync(path.join(root, 'tools', 'data'), { recursive: true });
  fs.copyFileSync(BUILD, path.join(root, 'tools', 'build-jingjinji-jinmeng-one-pot-research.mjs'));
  fs.cpSync(new URL('../lib/', import.meta.url), path.join(root, 'tools', 'lib'), { recursive: true });
  for (const name of DATA_FILES) fs.copyFileSync(new URL(`../data/${name}`, import.meta.url), path.join(root, 'tools', 'data', name));
  return root;
}

test('artifact map explains five distinct staple shapes and fifteen pending journeys', () => {
  const report = fixedReport();
  const artifacts = buildJingjinjiJinmengOnePotResearchArtifacts(report);
  assert.deepEqual([...artifacts.keys()], ['tools/generated/jingjinji-jinmeng-one-pot-research.v1.json', 'docs/jingjinji-jinmeng-one-pot-research.md', 'docs/jingjinji-jinmeng-one-pot-journey-review.md']);
  const markdown = renderJingjinjiJinmengOnePotResearchMarkdown(report);
  assert.match(markdown, /研究覆盖层，不是生产菜谱/);
  assert.match(markdown, /熟饼丝.*不能.*生面条|生面条.*不能.*熟饼丝/);
  assert.match(markdown, /跨华北.*不能.*单省独占|单省独占.*不能.*跨华北/);
  assert.match(markdown, /research_in_progress/);
  const review = renderJingjinjiJinmengOnePotJourneyReviewMarkdown(report);
  assert.match(review, /15 条家庭食材旅程/);
  assert.equal((review.match(/待人工评审/g) || []).length, 15);
});

test('checked-in artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /3 North-China recipe audits/);
});

test('build CLI writes fixed artifacts and fails closed when stale', () => {
  const root = makeTempBuildRoot();
  try {
    const script = path.join(root, 'tools', 'build-jingjinji-jinmeng-one-pot-research.mjs');
    const write = spawnSync(process.execPath, [script, '--write'], { cwd: root, encoding: 'utf8' });
    assert.equal(write.status, 0, `${write.stdout}\n${write.stderr}`);
    const target = path.join(root, 'docs', 'jingjinji-jinmeng-one-pot-research.md');
    fs.appendFileSync(target, '\nstale\n');
    const check = spawnSync(process.execPath, [script, '--check'], { cwd: root, encoding: 'utf8' });
    assert.equal(check.status, 1);
    assert.match(check.stderr, /Missing or stale/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('aggregate gate includes this research layer', () => {
  const result = spawnSync(process.execPath, [CHECK_RECIPES], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /3 North-China recipe audits · 4 candidate audits · 4 research leads · 15 journeys · North-China research ok/);
});

test('distribution build excludes research assets', () => {
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  const output = fs.mkdtempSync(path.join(ROOT, 'dist', '.north-china-research-isolation-'));
  try {
    const result = spawnSync(process.execPath, [BUILD_DIST, '--out-dir', output, '--build-id', 'north-china-research-isolation-test'], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const files = [];
    const visit = dir => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); entry.isDirectory() ? visit(full) : files.push(path.relative(output, full)); } };
    visit(output);
    assert.ok(files.length > 0);
    assert.equal(files.some(file => file.includes('jingjinji-jinmeng-one-pot-research')), false, files.join('\n'));
  } finally { fs.rmSync(output, { recursive: true, force: true }); }
});
