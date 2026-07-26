import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  renderRegionalAtlasJson,
  renderRegionalAtlasMarkdown,
} from '../lib/regional-atlas-renderer.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUILD = fileURLToPath(new URL('../build-regional-atlas.mjs', import.meta.url));
const BUILD_DIST = fileURLToPath(new URL('../build-dist.mjs', import.meta.url));
const DATA_FILES = [
  'regional-atlas.v2.json',
  'regional-menu-mappings.v1.json',
  'recipe-library.json',
  'regional-menu-research.v1.json',
];

function makeTempBuildRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'regional-atlas-build-'));
  const tempTools = path.join(tempRoot, 'tools');
  fs.mkdirSync(path.join(tempTools, 'data'), { recursive: true });
  fs.copyFileSync(BUILD, path.join(tempTools, 'build-regional-atlas.mjs'));
  fs.cpSync(new URL('../lib/', import.meta.url), path.join(tempTools, 'lib'), { recursive: true });
  for (const name of DATA_FILES) {
    fs.copyFileSync(new URL(`../data/${name}`, import.meta.url), path.join(tempTools, 'data', name));
  }
  return tempRoot;
}

const sample = {
  schema_version: 2,
  atlas_version: 'sample-atlas',
  mapping_version: 'sample-mapping',
  summary: {
    region_count: 1,
    province_count: 1,
    technique_family_count: 1,
    production_audit_count: 1,
    research_audit_count: 0,
    province_specific_count: 0,
    cross_regional_chinese_count: 0,
    national_household_count: 1,
    outside_cn_atlas_count: 0,
    blank_province_count: 1,
  },
  regions: [{ region_id: 'r1', name: '测试地域', province_codes: ['P1'], production_recipe_ids: [], research_candidate_ids: [], coverage_status: 'skeleton_only' }],
  province_coverage: [{ atlas_code: 'P1', name: '测试省份', region_id: 'r1', research_question: '测试问题', production_recipe_ids: [], research_candidate_ids: [], coverage_status: 'skeleton_only' }],
  technique_coverage: [{ family_id: 'f1', name: '测试技法', staple_states: ['生米'], research_question: '测试技法问题', production_recipe_ids: [], research_candidate_ids: [], coverage_status: 'skeleton_only' }],
  cultural_overlays: [],
  production_audit: [{ source_id: 'm1', name: '测试菜单', regional_scope: 'national_household', region_ids: [], province_codes: [], primary_family_id: 'f1', source_count: 1 }],
  research_audit: [],
  pantry_gap_coverage: [],
  source_status: { production: { with_sources: 1, without_sources: 0 }, research: { discovery_only: 0, fact_checked: 0, other: 0 } },
};

test('renderers are deterministic and state the audit boundary', () => {
  assert.equal(renderRegionalAtlasJson(sample), renderRegionalAtlasJson(sample));
  const markdown = renderRegionalAtlasMarkdown(sample);
  assert.equal(markdown, renderRegionalAtlasMarkdown(sample));
  assert.match(markdown, /地域地图完成不等于地方菜谱均已验证/);
  assert.match(markdown, /测试地域/);
  assert.match(markdown, /national_household/);
});

test('checked-in regional atlas artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /13 regions/);
  assert.match(result.stdout, /72 production audits/);
  assert.match(result.stdout, /24 research audits/);
});

test('build CLI writes fixed artifacts and fails closed when one becomes stale', () => {
  const tempRoot = makeTempBuildRoot();
  try {
    const write = spawnSync(process.execPath, [path.join(tempRoot, 'tools', 'build-regional-atlas.mjs'), '--write'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(write.status, 0, `${write.stdout}\n${write.stderr}`);
    const markdown = path.join(tempRoot, 'docs', 'regional-atlas.md');
    assert.ok(fs.existsSync(markdown));
    fs.rmSync(markdown);
    const check = spawnSync(process.execPath, [path.join(tempRoot, 'tools', 'build-regional-atlas.mjs'), '--check'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(check.status, 1, `${check.stdout}\n${check.stderr}`);
    assert.match(check.stderr, /Missing or stale: docs\/regional-atlas\.md/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('build CLI rejects invalid invocation without writing', () => {
  const result = spawnSync(process.execPath, [BUILD, '--unknown'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage: node tools\/build-regional-atlas\.mjs --write\|--check/);
});

test('aggregate recipe gate includes regional atlas integrity', () => {
  const checker = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [checker], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /regional atlas ok/);
  assert.match(result.stdout, /34 provinces/);
  assert.match(result.stdout, /72 production audits/);
  assert.match(result.stdout, /24 research audits/);
});

test('distribution build excludes regional audit source and generated assets', () => {
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  const output = fs.mkdtempSync(path.join(ROOT, 'dist', '.regional-atlas-isolation-'));
  try {
    const result = spawnSync(process.execPath, [
      BUILD_DIST,
      '--out-dir', output,
      '--build-id', 'regional-atlas-isolation-test',
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
    assert.equal(relativeFiles.some(name => /regional-atlas|regional-menu-mappings/.test(name)), false);
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
