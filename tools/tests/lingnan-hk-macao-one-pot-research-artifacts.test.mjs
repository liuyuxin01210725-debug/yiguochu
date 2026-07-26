import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildLingnanHkMacaoOnePotResearchReport } from '../lib/lingnan-hk-macao-one-pot-research-builder.mjs';
import {
  buildLingnanHkMacaoOnePotResearchArtifacts,
  renderLingnanHkMacaoOnePotResearchJson,
  renderLingnanHkMacaoOnePotResearchMarkdown,
  renderLingnanHkMacaoOnePotJourneyReviewMarkdown,
} from '../lib/lingnan-hk-macao-one-pot-research-renderer.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUILD = fileURLToPath(new URL('../build-lingnan-hk-macao-one-pot-research.mjs', import.meta.url));
const BUILD_DIST = fileURLToPath(new URL('../build-dist.mjs', import.meta.url));
const CHECK_RECIPES = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
const DATA_FILES = [
  'lingnan-hk-macao-one-pot-research.v1.json',
  'recipe-library.json',
  'regional-menu-research.v1.json',
  'regional-atlas.v2.json',
  'regional-menu-mappings.v1.json',
];
const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));

function fixedReport() {
  return buildLingnanHkMacaoOnePotResearchReport({
    assessment: readJson('lingnan-hk-macao-one-pot-research.v1.json'),
    recipeLibrary: readJson('recipe-library.json'),
    regionalResearch: readJson('regional-menu-research.v1.json'),
    regionalAtlas: readJson('regional-atlas.v2.json'),
    regionalMappings: readJson('regional-menu-mappings.v1.json'),
  });
}

function makeTempBuildRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lingnan-hk-macao-one-pot-build-'));
  fs.mkdirSync(path.join(tempRoot, 'tools', 'data'), { recursive: true });
  fs.copyFileSync(BUILD, path.join(tempRoot, 'tools', 'build-lingnan-hk-macao-one-pot-research.mjs'));
  fs.cpSync(new URL('../lib/', import.meta.url), path.join(tempRoot, 'tools', 'lib'), { recursive: true });
  for (const name of DATA_FILES) fs.copyFileSync(new URL(`../data/${name}`, import.meta.url), path.join(tempRoot, 'tools', 'data', name));
  return tempRoot;
}

test('artifact map renders Lingnan evidence boundaries and fifteen pending journeys deterministically', () => {
  const report = fixedReport();
  const artifacts = buildLingnanHkMacaoOnePotResearchArtifacts(report);
  assert.deepEqual([...artifacts.keys()], [
    'tools/generated/lingnan-hk-macao-one-pot-research.v1.json',
    'docs/lingnan-hk-macao-one-pot-research.md',
    'docs/lingnan-hk-macao-one-pot-journey-review.md',
  ]);
  const json = renderLingnanHkMacaoOnePotResearchJson(report);
  assert.equal(json, renderLingnanHkMacaoOnePotResearchJson(report));
  assert.ok(json.endsWith('\n'));
  const markdown = renderLingnanHkMacaoOnePotResearchMarkdown(report);
  assert.equal(markdown, renderLingnanHkMacaoOnePotResearchMarkdown(report));
  assert.match(markdown, /研究覆盖层，不是生产菜谱/);
  assert.match(markdown, /瓦煲|煲仔锅/);
  assert.match(markdown, /普通锅|电饭煲/);
  assert.match(markdown, /具名分支/);
  assert.match(markdown, /香港.*不等于.*独创|不等于.*香港.*独创/);
  assert.match(markdown, /天然植物.*食品粉|食品粉.*天然植物/);
  assert.match(markdown, /菠萝饭.*未证实|未证实.*菠萝饭/);
  assert.match(markdown, /多阶段/);
  assert.match(markdown, /主食.*不足|不足.*主食/);
  assert.match(markdown, /澳门葡式海鲜饭.*研究线索|研究线索.*澳门葡式海鲜饭/);
  assert.match(markdown, /research_in_progress/);
  const review = renderLingnanHkMacaoOnePotJourneyReviewMarkdown(report);
  assert.match(review, /15 条家庭食材旅程/);
  assert.equal((review.match(/待人工评审/g) || []).length, 15);
});

test('checked-in Lingnan Hong Kong Macao research artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /5 Lingnan production audits/);
  assert.match(result.stdout, /0 candidates/);
  assert.match(result.stdout, /5 research leads/);
  assert.match(result.stdout, /15 journeys/);
});

test('build CLI writes fixed artifacts and fails closed when one becomes stale', () => {
  const tempRoot = makeTempBuildRoot();
  try {
    const script = path.join(tempRoot, 'tools', 'build-lingnan-hk-macao-one-pot-research.mjs');
    const write = spawnSync(process.execPath, [script, '--write'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(write.status, 0, `${write.stdout}\n${write.stderr}`);
    const markdown = path.join(tempRoot, 'docs', 'lingnan-hk-macao-one-pot-research.md');
    fs.appendFileSync(markdown, '\nstale\n');
    const check = spawnSync(process.execPath, [script, '--check'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(check.status, 1);
    assert.match(check.stderr, /Missing or stale: docs\/lingnan-hk-macao-one-pot-research\.md/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('aggregate recipe gate includes Lingnan Hong Kong Macao research freshness', () => {
  const result = spawnSync(process.execPath, [CHECK_RECIPES], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /5 Lingnan production audits · 0 candidates · 5 research leads · 15 journeys · Lingnan research in progress/);
});

test('distribution build excludes Lingnan Hong Kong Macao research assets without polluting repository dist', () => {
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  const output = fs.mkdtempSync(path.join(ROOT, 'dist', '.lingnan-hk-macao-research-isolation-'));
  try {
    const result = spawnSync(process.execPath, [BUILD_DIST, '--out-dir', output, '--build-id', 'lingnan-hk-macao-research-isolation-test'], { cwd: ROOT, encoding: 'utf8' });
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
    assert.equal(files.some(file => file.includes('lingnan-hk-macao-one-pot-research')), false, files.join('\n'));
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
