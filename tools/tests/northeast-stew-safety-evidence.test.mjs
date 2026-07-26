import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const relative = name => new URL(`../${name}`, import.meta.url);
const readJson = name => JSON.parse(fs.readFileSync(relative(name), 'utf8'));
const requiredArtifacts = [
  'data/northeast-stew-safety-evidence.v1.json',
  'lib/northeast-stew-safety-evidence-validator.mjs',
  'lib/northeast-stew-safety-evidence-builder.mjs',
  'lib/northeast-stew-safety-evidence-renderer.mjs',
  'build-northeast-stew-safety-evidence.mjs',
  'generated/northeast-stew-safety-evidence.v1.json',
  '../docs/northeast-stew-safety-evidence.md',
  '../docs/northeast-stew-calibration-runbook.md',
];

function makeTempBuildRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'northeast-safety-build-'));
  const tempTools = path.join(tempRoot, 'tools');
  fs.mkdirSync(path.join(tempTools, 'data'), { recursive: true });
  fs.copyFileSync(relative('build-northeast-stew-safety-evidence.mjs'), path.join(tempTools, 'build-northeast-stew-safety-evidence.mjs'));
  fs.cpSync(relative('lib/'), path.join(tempTools, 'lib'), { recursive: true });
  for (const name of [
    'northeast-stew-safety-evidence.v1.json', 'northeast-stew-numeric-evidence.v1.json',
    'northeast-stew-research.v1.json', 'ingredient-taxonomy.v1.json',
  ]) fs.copyFileSync(relative(`data/${name}`), path.join(tempTools, 'data', name));
  return tempRoot;
}

function makeTempAggregateRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'northeast-safety-gate-'));
  fs.cpSync(path.join(ROOT, 'tools'), path.join(tempRoot, 'tools'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'docs'), path.join(tempRoot, 'docs'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'worker'), path.join(tempRoot, 'worker'), { recursive: true });
  return tempRoot;
}

test('safety evidence layer has source validator and generated artifacts', () => {
  for (const name of requiredArtifacts) assert.equal(fs.existsSync(relative(name)), true, `missing safety-evidence artifact: ${name}`);
});

test('official evidence defines direct pork-rib and separate bean endpoints', async () => {
  const ledger = readJson('data/northeast-stew-safety-evidence.v1.json');
  const research = readJson('data/northeast-stew-research.v1.json');
  const taxonomy = readJson('data/ingredient-taxonomy.v1.json');
  const { validateNortheastStewSafetyEvidence } = await import(pathToFileURL(fileURLToPath(relative('lib/northeast-stew-safety-evidence-validator.mjs'))).href);

  assert.equal(ledger.ledger_version, 'northeast-stew-safety-evidence-v1-20260727-m3');
  assert.deepEqual(validateNortheastStewSafetyEvidence({ ledger, research, taxonomy }), []);
  assert.deepEqual(ledger.sources.map(source => source.source_id), [
    'foodsafety-gov-pork-ribs-2023',
    'hubei-wjw-green-beans-2021',
    'hainan-amr-oil-beans-2017',
  ]);
  assert.deepEqual(ledger.rules.map(rule => [rule.rule_id, rule.decision_status, rule.applies_to_canonical_ids]), [
    ['pork-ribs-safe-endpoint-v1', 'calibration_ready', ['pork-ribs']],
    ['green-beans-fully-cooked-v1', 'calibration_ready', ['green-beans']],
    ['oil-beans-fully-cooked-v1', 'calibration_ready', ['oil-beans']],
  ]);

  const pork = ledger.rules[0];
  assert.deepEqual(pork.all_of.map(item => [item.metric, item.operator, item.value, item.unit]), [
    ['internal_temperature_c', '>=', 63, 'C'],
    ['rest_time_minutes', '>=', 3, 'min'],
  ]);
  assert.match(pork.all_of[0].measurement, /away from bone/);

  const greenBeans = ledger.rules[1];
  assert.deepEqual(greenBeans.all_of.map(item => item.metric), [
    'covered_simmer_temperature_c', 'covered_simmer_minutes', 'even_heating_confirmed',
    'raw_green_absent', 'bean_smell_absent',
  ]);
  assert.equal(greenBeans.all_of[1].operator, '>');
  assert.equal(greenBeans.all_of[1].value, 10);

  const oilBeans = ledger.rules[2];
  assert.deepEqual(oilBeans.all_of.map(item => item.metric), [
    'pod_limp', 'dark_green_reached', 'bean_smell_absent', 'fully_cooked_confirmed',
  ]);
  assert.equal(oilBeans.all_of.some(item => item.metric.includes('minutes')), false);
});

test('scope is fail closed and cannot be widened or turned into production defaults', async () => {
  const ledger = readJson('data/northeast-stew-safety-evidence.v1.json');
  const research = readJson('data/northeast-stew-research.v1.json');
  const taxonomy = readJson('data/ingredient-taxonomy.v1.json');
  const { validateNortheastStewSafetyEvidence } = await import(pathToFileURL(fileURLToPath(relative('lib/northeast-stew-safety-evidence-validator.mjs'))).href);
  const validate = value => validateNortheastStewSafetyEvidence({ ledger: value, research, taxonomy }).join('\n');

  const wrongPorkTemperature = structuredClone(ledger);
  wrongPorkTemperature.rules[0].all_of[0].value = 60;
  assert.match(validate(wrongPorkTemperature), /pork-ribs.*63 C|exact approved endpoints/);

  const wrongBeanTime = structuredClone(ledger);
  wrongBeanTime.rules[1].all_of[1].operator = '>=';
  assert.match(validate(wrongBeanTime), /green-beans.*more than 10 minutes|exact approved endpoints/);

  const expandedOilBeanNumber = structuredClone(ledger);
  expandedOilBeanNumber.rules[2].all_of.push({ metric: 'covered_simmer_minutes', operator: '>=', value: 10, unit: 'min', measurement: 'invented' });
  assert.match(validate(expandedOilBeanNumber), /oil-beans.*exact approved endpoints|unexpected/);

  const widenedScope = structuredClone(ledger);
  widenedScope.rules[1].applies_to_canonical_ids.push('soybean');
  assert.match(validate(widenedScope), /exact canonical scope/);

  const productionDefault = structuredClone(ledger);
  productionDefault.rules[0].production_default = true;
  assert.match(validate(productionDefault), /unexpected fields|production/);

  const badSourceUrl = structuredClone(ledger);
  badSourceUrl.sources[0].url = 'https://example.com/ribs';
  assert.match(validate(badSourceUrl), /official source URL/);
});

test('M1 branches reference the controlled rules while calibration values remain blank', async () => {
  const ledger = readJson('data/northeast-stew-safety-evidence.v1.json');
  const research = readJson('data/northeast-stew-research.v1.json');
  const taxonomy = readJson('data/ingredient-taxonomy.v1.json');
  const { validateNortheastStewSafetyEvidence } = await import(pathToFileURL(fileURLToPath(relative('lib/northeast-stew-safety-evidence-validator.mjs'))).href);
  assert.deepEqual(validateNortheastStewSafetyEvidence({ ledger, research, taxonomy }), []);

  const branches = new Map(research.family_model.safety_branches.map(row => [row.branch_id, row]));
  assert.equal(branches.get('chicken').evidence_status, 'unresearched');
  assert.equal(branches.get('fish').evidence_status, 'unresearched');
  assert.deepEqual(branches.get('pork_ribs').safety_rule_ids, ['pork-ribs-safe-endpoint-v1']);
  assert.deepEqual(branches.get('green_beans').safety_rule_ids, ['green-beans-fully-cooked-v1', 'oil-beans-fully-cooked-v1']);
  assert.equal(branches.get('pork_ribs').evidence_status, 'calibration_ready');
  assert.equal(branches.get('green_beans').evidence_status, 'calibration_ready');
  assert.ok(research.calibration_cases.every(row => row.status === 'pending'));
  assert.ok(research.calibration_cases.every(row => Object.values(row.measurements).every(value => value === null)));
  assert.ok(research.calibration_cases.every(row => Object.values(row.acceptance_checks).every(value => value === null)));
});

test('builder and renderer create deterministic research-only audit artifacts', async () => {
  const ledger = readJson('data/northeast-stew-safety-evidence.v1.json');
  const research = readJson('data/northeast-stew-research.v1.json');
  const taxonomy = readJson('data/ingredient-taxonomy.v1.json');
  const numericEvidence = readJson('data/northeast-stew-numeric-evidence.v1.json');
  const { buildNortheastStewSafetyEvidenceReport, validateNortheastStewSafetyEvidenceReport } = await import(pathToFileURL(fileURLToPath(relative('lib/northeast-stew-safety-evidence-builder.mjs'))).href);
  const { buildNortheastStewSafetyEvidenceArtifacts } = await import(pathToFileURL(fileURLToPath(relative('lib/northeast-stew-safety-evidence-renderer.mjs'))).href);

  const inputs = { ledger, research, taxonomy, numericEvidence };
  const report = buildNortheastStewSafetyEvidenceReport(inputs);
  assert.deepEqual(validateNortheastStewSafetyEvidenceReport(report), []);
  assert.equal(report.summary.calibration_ready_branch_count, 2);
  assert.equal(report.summary.production_rules_activated, 0);
  assert.equal(report.calibration_admission.status, 'ready_for_kitchen_calibration');
  assert.deepEqual(report.calibration_admission.remaining_blockers, [
    'numeric_ratio_rules_blocked', 'calibration_2_3_4_servings_pending', 'template_not_runtime_eligible',
  ]);

  const artifacts = buildNortheastStewSafetyEvidenceArtifacts(report);
  const second = buildNortheastStewSafetyEvidenceArtifacts(buildNortheastStewSafetyEvidenceReport(inputs));
  assert.deepEqual([...artifacts], [...second]);
  for (const [relativePath, content] of artifacts) assert.deepEqual(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'), content, relativePath);
  assert.match(artifacts.get('docs/northeast-stew-safety-evidence.md'), /63 C/);
  assert.match(artifacts.get('docs/northeast-stew-safety-evidence.md'), /10 分钟/);
  assert.match(artifacts.get('docs/northeast-stew-safety-evidence.md'), /不能证明/);
  assert.match(artifacts.get('docs/northeast-stew-calibration-runbook.md'), /ready_for_kitchen_calibration/);
  assert.match(artifacts.get('docs/northeast-stew-calibration-runbook.md'), /仍未完成比例规则与 2\/3\/4 人份实厨校准/);
  assert.doesNotMatch(artifacts.get('docs/northeast-stew-calibration-runbook.md'), /blocked_by_safety_endpoints/);
  assert.doesNotMatch(artifacts.get('docs/northeast-stew-calibration-runbook.md'), /可以上线|已激活生产规则/);
});

test('fixed-input CLI writes and checks artifacts then rejects stale output', () => {
  const tempRoot = makeTempBuildRoot();
  try {
    const script = path.join(tempRoot, 'tools', 'build-northeast-stew-safety-evidence.mjs');
    const write = spawnSync(process.execPath, [script, '--write'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(write.status, 0, `${write.stdout}\n${write.stderr}`);
    const markdown = path.join(tempRoot, 'docs', 'northeast-stew-safety-evidence.md');
    assert.equal(fs.existsSync(markdown), true);
    fs.appendFileSync(markdown, '\nstale\n');
    const check = spawnSync(process.execPath, [script, '--check'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(check.status, 1, `${check.stdout}\n${check.stderr}`);
    assert.match(check.stderr, /Missing or stale: docs\/northeast-stew-safety-evidence\.md/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('aggregate gate validates safety evidence and fails closed on stale output', () => {
  const checker = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
  const pass = spawnSync(process.execPath, [checker], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(pass.status, 0, `${pass.stdout}\n${pass.stderr}`);
  assert.match(pass.stdout, /northeast safety evidence ok/);

  const tempRoot = makeTempAggregateRoot();
  try {
    fs.appendFileSync(path.join(tempRoot, 'docs', 'northeast-stew-safety-evidence.md'), '\nstale\n');
    const fail = spawnSync(process.execPath, [path.join(tempRoot, 'tools', 'check-recipes.mjs')], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(fail.status, 1, `${fail.stdout}\n${fail.stderr}`);
    assert.match(`${fail.stdout}\n${fail.stderr}`, /northeast-stew-safety-evidence\.md is missing or stale/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
