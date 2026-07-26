import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildQinghaiTibetOnePotResearchReport } from '../lib/qinghai-tibet-one-pot-research-builder.mjs';
import {
  buildQinghaiTibetOnePotResearchArtifacts,
  renderQinghaiTibetOnePotResearchJson,
  renderQinghaiTibetOnePotResearchMarkdown,
  renderQinghaiTibetOnePotJourneyReviewMarkdown,
} from '../lib/qinghai-tibet-one-pot-research-renderer.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUILD = fileURLToPath(new URL('../build-qinghai-tibet-one-pot-research.mjs', import.meta.url));
const BUILD_DIST = fileURLToPath(new URL('../build-dist.mjs', import.meta.url));
const CHECK_RECIPES = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
const DATA_FILES = [
  'qinghai-tibet-one-pot-research.v1.json',
  'recipe-library.json',
  'regional-menu-research.v1.json',
  'regional-atlas.v2.json',
  'regional-menu-mappings.v1.json',
];
const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const RESEARCH_ONLY_SENTINELS = [
  'qinghai-tibet-one-pot-research-v1-20260726',
  'tibetan-patu-one-pot',
  '青藏一锅主餐研究覆盖层',
];

function fixedReport() {
  return buildQinghaiTibetOnePotResearchReport({
    assessment: readJson('qinghai-tibet-one-pot-research.v1.json'),
    recipeLibrary: readJson('recipe-library.json'),
    regionalResearch: readJson('regional-menu-research.v1.json'),
    regionalAtlas: readJson('regional-atlas.v2.json'),
    regionalMappings: readJson('regional-menu-mappings.v1.json'),
  });
}

function makeTempBuildRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'qinghai-tibet-one-pot-build-'));
  fs.mkdirSync(path.join(tempRoot, 'tools', 'data'), { recursive: true });
  fs.copyFileSync(BUILD, path.join(tempRoot, 'tools', 'build-qinghai-tibet-one-pot-research.mjs'));
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

test('artifact map deterministically renders the five Qinghai Tibet evidence and safety boundaries', () => {
  const report = fixedReport();
  const artifacts = buildQinghaiTibetOnePotResearchArtifacts(report);
  assert.deepEqual([...artifacts.keys()], [
    'tools/generated/qinghai-tibet-one-pot-research.v1.json',
    'docs/qinghai-tibet-one-pot-research.md',
    'docs/qinghai-tibet-one-pot-journey-review.md',
  ]);

  const json = renderQinghaiTibetOnePotResearchJson(report);
  assert.equal(json, renderQinghaiTibetOnePotResearchJson(report));
  assert.ok(json.endsWith('\n'));

  const markdown = renderQinghaiTibetOnePotResearchMarkdown(report);
  assert.equal(markdown, renderQinghaiTibetOnePotResearchMarkdown(report));
  assert.match(markdown, /研究覆盖层，不是生产菜谱/);
  assert.match(markdown, /熬饭.*项目原创.*家庭适配|项目原创.*家庭适配.*熬饭/);
  assert.match(markdown, /小米.*土豆.*熟鹰嘴豆.*不得.*传统|不得.*传统.*小米.*土豆.*熟鹰嘴豆/);
  assert.match(markdown, /古突.*硬币.*羊毛.*木炭.*纸条.*不得进入.*食材/);
  assert.match(markdown, /人参果饭.*藏历新年.*节庆边界|藏历新年.*人参果饭.*节庆边界/);
  assert.match(markdown, /帕图.*最高优先级.*研究线索/);
  assert.match(markdown, /土巴.*待证.*藏面|藏面.*待证.*土巴/);
  assert.match(markdown, /research_in_progress/);

  const generated = JSON.parse(json);
  assert.equal(generated.critical_boundaries.length, 5);
  for (const finding of generated.critical_boundaries) assert.ok(markdown.includes(finding.statement), finding.finding_id);
  const rewritten = structuredClone(report);
  rewritten.critical_boundaries[0].statement = '结构化边界渲染探针';
  assert.match(renderQinghaiTibetOnePotResearchJson(rewritten), /结构化边界渲染探针/);
  assert.match(renderQinghaiTibetOnePotResearchMarkdown(rewritten), /结构化边界渲染探针/);

  const review = renderQinghaiTibetOnePotJourneyReviewMarkdown(report);
  assert.match(review, /12 条家庭食材旅程/);
  assert.equal((review.match(/待人工评审/g) || []).length, 12);
});

test('checked-in Qinghai Tibet research artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /4 Qinghai Tibet production audits/);
  assert.match(result.stdout, /0 candidates/);
  assert.match(result.stdout, /5 research leads/);
  assert.match(result.stdout, /12 journeys/);
  assert.match(result.stdout, /Qinghai Tibet research in progress/);
});

test('build CLI writes all artifacts and fails closed when one becomes stale', () => {
  const tempRoot = makeTempBuildRoot();
  try {
    const script = path.join(tempRoot, 'tools', 'build-qinghai-tibet-one-pot-research.mjs');
    const write = spawnSync(process.execPath, [script, '--write'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(write.status, 0, `${write.stdout}\n${write.stderr}`);
    const markdown = path.join(tempRoot, 'docs', 'qinghai-tibet-one-pot-research.md');
    fs.appendFileSync(markdown, '\nstale\n');
    const check = spawnSync(process.execPath, [script, '--check'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(check.status, 1);
    assert.match(check.stderr, /Missing or stale: docs\/qinghai-tibet-one-pot-research\.md/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('build CLI rejects invalid invocation without writing', () => {
  const result = spawnSync(process.execPath, [BUILD, '--unknown'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage: node tools\/build-qinghai-tibet-one-pot-research\.mjs --write\|--check/);
});

test('aggregate recipe gate includes Qinghai Tibet research freshness after established gates', () => {
  const result = spawnSync(process.execPath, [CHECK_RECIPES], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /4 Qinghai Tibet production audits · 0 candidates · 5 research leads · 12 journeys · Qinghai Tibet research in progress/);
});

test('distribution build excludes Qinghai Tibet research source and generated assets', () => {
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  const output = fs.mkdtempSync(path.join(ROOT, 'dist', '.qinghai-tibet-research-isolation-'));
  try {
    const result = spawnSync(process.execPath, [BUILD_DIST, '--out-dir', output, '--build-id', 'qinghai-tibet-research-isolation-test'], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const { files, buffers } = readBuildFilesAsBuffers(output);
    assert.ok(files.length > 0);
    assert.equal(files.some(file => /qinghai-tibet-one-pot-research|qinghai-tibet-one-pot-journey-review/.test(file)), false, files.join('\n'));
    assertNoResearchOnlyContent(buffers);
    assert.throws(
      () => assertNoResearchOnlyContent([...buffers, Buffer.from(RESEARCH_ONLY_SENTINELS[1], 'utf8')]),
      /research-only content leaked into distribution build: tibetan-patu-one-pot/,
    );
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
    assert.equal(fs.existsSync(output), false, 'temporary distribution build must be removed');
  }
});
