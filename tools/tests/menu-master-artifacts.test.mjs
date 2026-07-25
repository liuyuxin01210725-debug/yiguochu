import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  renderMenuMasterCsv,
  renderMenuMasterJson,
  renderMenuMasterMarkdown,
} from '../lib/menu-master-renderer.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUILD = fileURLToPath(new URL('../build-menu-master.mjs', import.meta.url));

const sample = {
  schema_version: 1,
  summary: { production_count: 1, research_count: 0, approved_count: 1, auto_approved_count: 0 },
  production_menus: [{
    library_index: 1,
    id: 'sample', name: '含逗号,菜单', status: 'approved',
    identity: { cuisine: '中式', family_id: 'family-test', form: '焖饭' },
    ingredients: { staples: ['大米'], core: ['鸡肉'], optional: ['胡萝卜'], generation_optional: [], liquids: ['水'], substitutions: [], discouraged: [] },
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
});

test('checked-in menu master artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /72 production menus/);
  assert.match(result.stdout, /24 research candidates/);
});

test('aggregate recipe gate includes menu master integrity', () => {
  const checker = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [checker], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /menu master ok/);
  assert.match(result.stdout, /72 production menus/);
  assert.match(result.stdout, /24 research candidates/);
});
