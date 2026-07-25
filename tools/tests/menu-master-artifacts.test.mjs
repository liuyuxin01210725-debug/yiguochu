import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  renderMenuMasterCsv,
  renderMenuMasterJson,
  renderMenuMasterMarkdown,
} from '../lib/menu-master-renderer.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUILD = fileURLToPath(new URL('../build-menu-master.mjs', import.meta.url));

function runBuildWithAssetMutation(mutate) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'menu-master-build-'));
  const tempTools = path.join(tempRoot, 'tools');
  fs.mkdirSync(path.join(tempTools, 'data'), { recursive: true });
  fs.copyFileSync(BUILD, path.join(tempTools, 'build-menu-master.mjs'));
  fs.cpSync(new URL('../lib/', import.meta.url), path.join(tempTools, 'lib'), { recursive: true });
  fs.cpSync(new URL('../../worker/src/', import.meta.url), path.join(tempRoot, 'worker', 'src'), { recursive: true });
  for (const name of [
    'recipe-library.json', 'ingredient-taxonomy.v1.json', 'regional-menu-research.v1.json',
    'menu-verification-cases.v1.json', 'menu-master-baseline.v1.json',
  ]) fs.copyFileSync(new URL(`../data/${name}`, import.meta.url), path.join(tempTools, 'data', name));
  mutate(path.join(tempTools, 'data'));
  try {
    return spawnSync(process.execPath, [path.join(tempTools, 'build-menu-master.mjs'), '--write'], { encoding: 'utf8' });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

const sample = {
  schema_version: 1,
  summary: { production_count: 1, research_count: 0, approved_count: 1, auto_approved_count: 0 },
  production_menus: [{
    library_index: 1,
    id: 'sample', name: '含逗号,菜单', status: 'approved',
    identity: { cuisine: '中式', family_id: 'family-test', form: '焖饭' },
    ingredients: { staples: ['大米'], core: ['鸡肉'], unknown_role: ['鸡肉'], optional: ['胡萝卜'], generation_optional: [], liquids: ['水'], substitutions: [], discouraged: [] },
    execution: { total_time_minutes: 30, purposes: ['quick'], technique: [], ratio_rules: [], safety_rules: [] },
    evidence: { source_count: 1, source_refs: [] },
    audit: { static_status: 'complete', verification_status: 'pending', missing_fields: [] },
  }],
  research_candidates: [],
};

test('renderers are deterministic and CSV quotes commas', () => {
  assert.equal(renderMenuMasterJson(sample), renderMenuMasterJson(sample));
  assert.match(renderMenuMasterMarkdown(sample), /含逗号,菜单/);
  assert.match(renderMenuMasterMarkdown(sample), /鸡肉/);
  assert.match(renderMenuMasterCsv(sample), /"含逗号,菜单"/);
  assert.match(renderMenuMasterMarkdown(sample), /待核实角色/);
  assert.match(renderMenuMasterCsv(sample), /unknown_role/);
  assert.match(renderMenuMasterMarkdown(sample), /仅表示正反案例已登记，不代表通过/);
});

test('generated RFC4180 CSV treats CR as a valid RFC4180 line ending', () => {
  const result = spawnSync('git', ['check-attr', 'whitespace', '--', 'docs/menu-master.csv'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /docs\/menu-master\.csv: whitespace: cr-at-eol/);
});

test('checked-in menu master artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /72 production menus/);
  assert.match(result.stdout, /24 research candidates/);
});

test('build CLI refuses an intentionally deleted Phase Zero baseline recipe', () => {
  const result = runBuildWithAssetMutation(dataDirectory => {
    const file = path.join(dataDirectory, 'recipe-library.json');
    const library = JSON.parse(fs.readFileSync(file, 'utf8'));
    library.recipes.pop();
    fs.writeFileSync(file, JSON.stringify(library));
  });
  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /versioned Phase Zero baseline/);
  assert.match(result.stderr, /intentionally update tools\/data\/menu-master-baseline\.v1\.json/);
});

test('build CLI rejects null research and verification entries as structured source errors', () => {
  const result = runBuildWithAssetMutation(dataDirectory => {
    for (const name of ['regional-menu-research.v1.json', 'menu-verification-cases.v1.json']) {
      const file = path.join(dataDirectory, name);
      const ledger = JSON.parse(fs.readFileSync(file, 'utf8'));
      ledger.entries = [null];
      fs.writeFileSync(file, JSON.stringify(ledger));
    }
  });
  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /entry must be an object/);
  assert.match(result.stderr, /verification entry 0 must be an object/);
  assert.doesNotMatch(result.stderr, /TypeError/);
});

test('build CLI lets the recipe source validator report a null recipe entry', () => {
  const result = runBuildWithAssetMutation(dataDirectory => {
    const file = path.join(dataDirectory, 'recipe-library.json');
    const library = JSON.parse(fs.readFileSync(file, 'utf8'));
    library.recipes = [null];
    fs.writeFileSync(file, JSON.stringify(library));
  });
  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /recipe at index 0 must be an object/);
  assert.doesNotMatch(result.stderr, /TypeError/);
});

test('aggregate recipe gate includes menu master integrity', () => {
  const checker = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [checker], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /menu master ok/);
  assert.match(result.stdout, /72 production menus/);
  assert.match(result.stdout, /24 research candidates/);
});
