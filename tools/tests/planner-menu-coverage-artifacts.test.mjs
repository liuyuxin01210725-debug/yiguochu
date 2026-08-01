import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  buildPlannerMenuCoverageArtifacts,
  renderPlannerMenuCoverageJson,
  renderPlannerMenuCoverageMarkdown,
} from '../lib/planner-menu-coverage-renderer.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUILD = fileURLToPath(new URL('../build-planner-menu-coverage.mjs', import.meta.url));
const CHECK_RECIPES = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));

const sampleReport = {
  schema_version: 1,
  planner_version: 'pantry-planner-v2',
  template_catalog_version: 'templates-test',
  taxonomy_version: 'taxonomy-test',
  ratio_catalog_version: 'ratios-test',
  source_hashes: {},
  summary: {
    recipe_count: 2,
    approved_count: 1,
    auto_approved_count: 1,
    status_counts: { taxonomy_gap: 1, full_single_pot_evidence_aligned: 1 },
    priority_counts: { P0: 0, P1: 1, P2: 0, P3: 0, covered: 1 },
  },
  by_region: [{ region_id:'jiangnan', recipe_count:1, single_pot_full_count:1, taxonomy_gap_count:0, planner_gap_count:0 }],
  by_technique_family: [{ technique_family_id:'raw-rice-braise', recipe_count:1, single_pot_full_count:1, taxonomy_gap_count:0, planner_gap_count:0 }],
  by_template: [{ template_id:'savory-mixed-rice-pot', selected_recipe_count:1, direct_evidence_recipe_count:1 }],
  unclassified_items: [{ raw:'小白菜', recipe_count:1, recipe_ids:['gap'] }],
  recipes: [
    {
      recipe_id:'covered', recipe_name:'已覆盖菜饭', recipe_status:'approved', regional_scope:'province_specific',
      region_ids:['jiangnan'], technique_family_id:'raw-rice-braise', raw_core_items:['大米','青菜'],
      identity_recognition_ratio:1, audit_status:'full_single_pot_evidence_aligned', priority_band:'covered', gap_codes:[],
      recognized_only_scenario:{ recognized_planner_coverage_ratio:1, selected_template_ids:['savory-mixed-rice-pot'] },
      raw_core_scenario:{ end_to_end_core_coverage_ratio:1, plan_kind:'single_pot', pot_count:1 },
    },
    {
      recipe_id:'gap', recipe_name:'待识别菜饭', recipe_status:'auto_approved', regional_scope:'province_specific',
      region_ids:['jiangnan'], technique_family_id:'raw-rice-braise', raw_core_items:['大米','小白菜'],
      identity_recognition_ratio:0.5, audit_status:'taxonomy_gap', priority_band:'P1', gap_codes:['taxonomy_gap'],
      recognized_only_scenario:{ recognized_planner_coverage_ratio:1, selected_template_ids:['savory-mixed-rice-pot'] },
      raw_core_scenario:{ end_to_end_core_coverage_ratio:0.5, plan_kind:'single_pot', pot_count:1 },
    },
  ],
};

test('renderers are deterministic and state the evidence boundary', () => {
  assert.equal(renderPlannerMenuCoverageJson(sampleReport), renderPlannerMenuCoverageJson(sampleReport));
  const markdown = renderPlannerMenuCoverageMarkdown(sampleReport);
  assert.equal(markdown, renderPlannerMenuCoverageMarkdown(sampleReport));
  assert.match(markdown, /Planner 覆盖审计不等于菜谱复刻、口味验证或人工试做批准/);
  assert.match(markdown, /P0\/P1\/P2/);
  assert.match(markdown, /小白菜/);
  assert.doesNotMatch(markdown, /建议激活/);
});

test('artifact map has exactly the two fixed repository paths', () => {
  const artifacts = buildPlannerMenuCoverageArtifacts(sampleReport);
  assert.deepEqual([...artifacts.keys()], [
    'tools/generated/planner-menu-coverage.v1.json',
    'docs/planner-menu-coverage.md',
  ]);
});

test('CLI only accepts --write or --check', () => {
  const result = spawnSync(process.execPath, [BUILD], { cwd:ROOT, encoding:'utf8' });
  assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /--write\|--check/);
});

test('checked-in planner menu coverage artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd:ROOT, encoding:'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /72 recipes/);
  for (const relativePath of [
    'tools/generated/planner-menu-coverage.v1.json',
    'docs/planner-menu-coverage.md',
  ]) assert.equal(fs.existsSync(path.join(ROOT, relativePath)), true);
});

test('CLI detects source hash drift without rewriting checked-in artifacts', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'planner-menu-coverage-'));
  try {
    fs.mkdirSync(path.join(tempRoot, 'tools', 'data'), { recursive:true });
    fs.copyFileSync(BUILD, path.join(tempRoot, 'tools', 'build-planner-menu-coverage.mjs'));
    fs.cpSync(path.join(ROOT, 'tools', 'lib'), path.join(tempRoot, 'tools', 'lib'), { recursive:true });
    fs.cpSync(path.join(ROOT, 'worker', 'src'), path.join(tempRoot, 'worker', 'src'), { recursive:true });
    for (const name of [
      'recipe-library.json',
      'ingredient-taxonomy.v1.json',
      'meal-templates.v2.json',
      'ratio-rules.v1.json',
      'rice-meal-catalog.v1.json',
      'regional-menu-mappings.v1.json',
      'menu-master-baseline.v1.json',
    ]) fs.copyFileSync(path.join(ROOT, 'tools', 'data', name), path.join(tempRoot, 'tools', 'data', name));

    const write = spawnSync(process.execPath, [path.join(tempRoot, 'tools', 'build-planner-menu-coverage.mjs'), '--write'], {
      cwd:tempRoot, encoding:'utf8',
    });
    assert.equal(write.status, 0, `${write.stdout}\n${write.stderr}`);

    fs.appendFileSync(path.join(tempRoot, 'tools', 'data', 'recipe-library.json'), '\n');
    const check = spawnSync(process.execPath, [path.join(tempRoot, 'tools', 'build-planner-menu-coverage.mjs'), '--check'], {
      cwd:tempRoot, encoding:'utf8',
    });
    assert.equal(check.status, 1, `${check.stdout}\n${check.stderr}`);
    assert.match(check.stderr, /Missing or stale: tools\/generated\/planner-menu-coverage\.v1\.json/);
    assert.match(check.stderr, /Missing or stale: docs\/planner-menu-coverage\.md/);
  } finally {
    fs.rmSync(tempRoot, { recursive:true, force:true });
  }
});

test('aggregate recipe gate verifies planner menu coverage freshness', () => {
  const result = spawnSync(process.execPath, [CHECK_RECIPES], { cwd:ROOT, encoding:'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /planner menu coverage ok/);
  assert.match(result.stdout, /72 recipes/);
});
