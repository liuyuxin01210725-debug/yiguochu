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
  'data/northeast-stew-numeric-evidence.v1.json',
  'lib/northeast-stew-numeric-evidence-validator.mjs',
  'lib/northeast-stew-numeric-evidence-builder.mjs',
  'lib/northeast-stew-numeric-evidence-renderer.mjs',
  'build-northeast-stew-numeric-evidence.mjs',
  'generated/northeast-stew-numeric-evidence.v1.json',
  '../docs/northeast-stew-numeric-evidence.md',
  '../docs/northeast-stew-calibration-runbook.md',
];

function makeTempBuildRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'northeast-numeric-build-'));
  const tempTools = path.join(tempRoot, 'tools');
  fs.mkdirSync(path.join(tempTools, 'data'), { recursive: true });
  fs.copyFileSync(relative('build-northeast-stew-numeric-evidence.mjs'), path.join(tempTools, 'build-northeast-stew-numeric-evidence.mjs'));
  fs.cpSync(relative('lib/'), path.join(tempTools, 'lib'), { recursive: true });
  for (const name of ['northeast-stew-numeric-evidence.v1.json', 'northeast-stew-research.v1.json']) {
    fs.copyFileSync(relative(`data/${name}`), path.join(tempTools, 'data', name));
  }
  return tempRoot;
}

function makeTempAggregateRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'northeast-numeric-gate-'));
  fs.cpSync(path.join(ROOT, 'tools'), path.join(tempRoot, 'tools'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'docs'), path.join(tempRoot, 'docs'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'worker'), path.join(tempRoot, 'worker'), { recursive: true });
  return tempRoot;
}

test('numeric evidence ledger has its required source validator and generated artifacts', () => {
  for (const name of requiredArtifacts) {
    assert.equal(fs.existsSync(relative(name)), true, `missing numeric-evidence artifact: ${name}`);
  }
});

test('numeric evidence source facts remain blocked without qualified same-state evidence', async () => {
  const ledger = readJson('data/northeast-stew-numeric-evidence.v1.json');
  const research = readJson('data/northeast-stew-research.v1.json');
  const { validateNortheastStewNumericEvidence } = await import(
    pathToFileURL(fileURLToPath(relative('lib/northeast-stew-numeric-evidence-validator.mjs'))).href,
  );

  assert.equal(ledger.ledger_version, 'northeast-stew-numeric-evidence-v1-20260727-m2');
  assert.deepEqual(validateNortheastStewNumericEvidence(ledger, research.calibration_cases), []);
  assert.deepEqual(
    ledger.rules.map(rule => [rule.rule_id, rule.decision_status, rule.qualified_source_ids]),
    [
      ['cornmeal-flour-to-dough-v1', 'blocked', []],
      ['stew-with-corn-cake-liquid-v1', 'blocked', []],
    ],
  );
  assert.ok(ledger.sources.every(source => source.classification !== 'qualified_same_state'));
  assert.ok(ledger.sources.every(source => source.source_type !== 'paper' || source.classification === 'calibration_start_only'));
});

test('numeric source candidates preserve state blending fermentation method values and limits', async () => {
  const ledger = readJson('data/northeast-stew-numeric-evidence.v1.json');
  const paper = ledger.sources.find(source => source.source_id === 'jiang-2025-whole-cornmeal-paper');
  assert.deepEqual(paper.ingredient_state, {
    cornmeal: '100-mesh whole corn flour',
    wheat_flour: 'none',
    fermentation: 'none',
    cooking_method: 'molded_and_steamed',
  });
  assert.deepEqual(paper.numeric_observations, [
    { metric: 'water_per_100g_cornmeal_ml', value: 120, min: 120, max: 120, unit: 'mL water per 100 g cornmeal', basis: '200 g 100-mesh whole corn flour plus 240 mL water; no density conversion claimed' },
    { metric: 'water_temperature_c', value: null, min: 80, max: 100, unit: 'C', basis: '80-100 C groups had the better reported handling and sensory results' },
  ]);
  for (const source of ledger.sources) {
    for (const field of ['publisher', 'author', 'published_at', 'retrieved_at', 'rights_or_license']) assert.ok(source[field], `${source.source_id}.${field}`);
    assert.ok(source.numeric_observations.every(observation => ['value', 'min', 'max', 'unit', 'basis'].every(field => field in observation)));
  }
  assert.match(paper.cannot_prove.join(' '), /锅边/);
  assert.ok(ledger.sources.every(source => source.independence_group));
  assert.deepEqual(ledger.sources.map(source => source.source_id), [
    'jiang-2025-whole-cornmeal-paper', 'jessica-hot-water-cornbread-2024', 'xiachufang-pot-edge-2021', 'xiachufang-ribs-beans-2020', 'meishichina-ribs-beans-2016',
  ]);
  assert.equal(ledger.sources[2].independence_group, 'xiachufang');
  assert.equal(ledger.sources[3].independence_group, 'xiachufang');
});

test('validator fails closed for fabricated qualification insufficient independence and cross-source defaults', async () => {
  const ledger = readJson('data/northeast-stew-numeric-evidence.v1.json');
  const research = readJson('data/northeast-stew-research.v1.json');
  const { validateNortheastStewNumericEvidence } = await import(
    pathToFileURL(fileURLToPath(relative('lib/northeast-stew-numeric-evidence-validator.mjs'))).href,
  );

  const qualified = structuredClone(ledger);
  qualified.sources[0].classification = 'qualified_same_state';
  assert.match(validateNortheastStewNumericEvidence(qualified, research.calibration_cases).join('\n'), /qualified_same_state is not permitted/);

  const insufficient = structuredClone(ledger);
  insufficient.rules[0].decision_status = 'ready_for_calibration';
  insufficient.rules[0].qualified_source_ids = ['jiang-2025-whole-cornmeal-paper'];
  assert.match(validateNortheastStewNumericEvidence(insufficient, research.calibration_cases).join('\n'), /requires two independent qualified_same_state sources/);

  const combined = structuredClone(ledger);
  combined.rules[1].proposed_default = {
    dough_water_source_id: 'xiachufang-pot-edge-2021',
    stew_water_source_id: 'xiachufang-ribs-beans-2020',
    liquid_level_source_id: 'meishichina-ribs-beans-2016',
    time_source_id: 'xiachufang-pot-edge-2021',
  };
  assert.match(validateNortheastStewNumericEvidence(combined, research.calibration_cases).join('\n'), /production defaults are forbidden|cross-source/);
});

test('ledger references the authoritative M1 calibration cases without cloning their facts', async () => {
  const ledger = readJson('data/northeast-stew-numeric-evidence.v1.json');
  const research = readJson('data/northeast-stew-research.v1.json');
  const { validateNortheastStewNumericEvidence } = await import(
    pathToFileURL(fileURLToPath(relative('lib/northeast-stew-numeric-evidence-validator.mjs'))).href,
  );
  assert.deepEqual(ledger.calibration_case_ids, ['ne-cal-2', 'ne-cal-3', 'ne-cal-4']);
  assert.equal('calibration_cases' in ledger, false);
  assert.deepEqual(research.calibration_cases.map(row => [row.calibration_id, row.servings, row.status]), [
    ['ne-cal-2', 2, 'pending'], ['ne-cal-3', 3, 'pending'], ['ne-cal-4', 4, 'pending'],
  ]);
  assert.ok(research.calibration_cases.every(row => row.measurements.preparation_water_grams === null && row.acceptance_checks.cake_holds_together === null));

  const extraSourceField = structuredClone(ledger);
  extraSourceField.sources[0].unexpected = true;
  assert.match(validateNortheastStewNumericEvidence(extraSourceField, research.calibration_cases).join('\n'), /unexpected fields/);
  const duplicateCandidate = structuredClone(ledger);
  duplicateCandidate.rules[1].candidate_source_ids = ['xiachufang-pot-edge-2021', 'xiachufang-pot-edge-2021', 'meishichina-ribs-beans-2016'];
  assert.match(validateNortheastStewNumericEvidence(duplicateCandidate, research.calibration_cases).join('\n'), /exact candidate_source_ids/);
  const fabricatedPendingNote = structuredClone(research.calibration_cases);
  fabricatedPendingNote[0].notes = 'filled by code';
  assert.match(validateNortheastStewNumericEvidence(ledger, fabricatedPendingNote).join('\n'), /pending calibration notes must be empty/);
});

test('validator rejects every reviewed schema or pending-state bypass', async () => {
  const ledger = readJson('data/northeast-stew-numeric-evidence.v1.json');
  const research = readJson('data/northeast-stew-research.v1.json');
  const { validateNortheastStewNumericEvidence } = await import(
    pathToFileURL(fileURLToPath(relative('lib/northeast-stew-numeric-evidence-validator.mjs'))).href,
  );
  const cases = [
    ['wrong ledger version', value => { value.ledger_version = 'forged'; }, () => {}],
    ['root production default', value => { value.production_default = 1; }, () => {}],
    ['source unexpected field', value => { value.sources[0].unexpected = true; }, () => {}],
    ['ingredient state key removed', value => { delete value.sources[0].ingredient_state.cornmeal; }, () => {}],
    ['observation key added', value => { value.sources[0].numeric_observations[0].derived_default = 1; }, () => {}],
    ['wrong candidate mapping', value => { value.rules[0].candidate_source_ids = ['jessica-hot-water-cornbread-2024']; }, () => {}],
    ['duplicate candidate', value => { value.rules[1].candidate_source_ids = ['xiachufang-pot-edge-2021', 'xiachufang-pot-edge-2021', 'meishichina-ribs-beans-2016']; }, () => {}],
    ['pending notes filled', () => {}, value => { value[0].notes = 'fabricated'; }],
    ['equipment key removed', () => {}, value => { delete value[0].equipment.pot_depth_cm; }],
    ['measurement key added', () => {}, value => { value[0].measurements.dough_water_grams = null; }],
    ['acceptance key removed', () => {}, value => { delete value[0].acceptance_checks.cake_holds_together; }],
  ];
  for (const [name, mutateLedger, mutateCases] of cases) {
    const forgedLedger = structuredClone(ledger);
    const forgedCases = structuredClone(research.calibration_cases);
    mutateLedger(forgedLedger);
    mutateCases(forgedCases);
    assert.notDeepEqual(validateNortheastStewNumericEvidence(forgedLedger, forgedCases), [], name);
  }
});

test('validator reports malformed source fields instead of throwing', async () => {
  const ledger = readJson('data/northeast-stew-numeric-evidence.v1.json');
  const research = readJson('data/northeast-stew-research.v1.json');
  const { validateNortheastStewNumericEvidence } = await import(
    pathToFileURL(fileURLToPath(relative('lib/northeast-stew-numeric-evidence-validator.mjs'))).href,
  );

  const malformedUrl = structuredClone(ledger);
  malformedUrl.sources[0].url = 42;
  assert.doesNotThrow(() => validateNortheastStewNumericEvidence(malformedUrl, research.calibration_cases));
  assert.match(validateNortheastStewNumericEvidence(malformedUrl, research.calibration_cases).join('\n'), /url must be a non-empty string|official article URL/);

  const malformedObservation = structuredClone(ledger);
  malformedObservation.sources[0].numeric_observations = [null];
  assert.doesNotThrow(() => validateNortheastStewNumericEvidence(malformedObservation, research.calibration_cases));
  assert.match(validateNortheastStewNumericEvidence(malformedObservation, research.calibration_cases).join('\n'), /numeric_observations\[0\].*invalid|unexpected fields/);
});

test('validator rejects non-HTTPS URLs impossible ranges and mismatched units', async () => {
  const ledger = readJson('data/northeast-stew-numeric-evidence.v1.json');
  const research = readJson('data/northeast-stew-research.v1.json');
  const { validateNortheastStewNumericEvidence } = await import(
    pathToFileURL(fileURLToPath(relative('lib/northeast-stew-numeric-evidence-validator.mjs'))).href,
  );

  const badUrl = structuredClone(ledger);
  badUrl.sources[1].url = 'not-a-url';
  assert.match(validateNortheastStewNumericEvidence(badUrl, research.calibration_cases).join('\n'), /valid HTTPS URL/);

  const forgedPaperHost = structuredClone(ledger);
  forgedPaperHost.sources[0].url = 'https://evil.example/?spgykj.com';
  assert.match(validateNortheastStewNumericEvidence(forgedPaperHost, research.calibration_cases).join('\n'), /official article URL and DOI/);

  const forgedPaperDoi = structuredClone(ledger);
  forgedPaperDoi.sources[0].doi = '10.0000/forged';
  assert.match(validateNortheastStewNumericEvidence(forgedPaperDoi, research.calibration_cases).join('\n'), /official article URL and DOI/);

  const outsideRange = structuredClone(ledger);
  outsideRange.sources[0].numeric_observations[0].value = 999;
  assert.match(validateNortheastStewNumericEvidence(outsideRange, research.calibration_cases).join('\n'), /value must fall within min and max/);

  const mismatchedUnit = structuredClone(ledger);
  mismatchedUnit.sources[0].numeric_observations[0].unit = 'kg';
  assert.match(validateNortheastStewNumericEvidence(mismatchedUnit, research.calibration_cases).join('\n'), /unit does not match metric/);
});

test('pot-edge source records both pre-paste braise stages without inventing post-paste time', () => {
  const ledger = readJson('data/northeast-stew-numeric-evidence.v1.json');
  const source = ledger.sources.find(item => item.source_id === 'xiachufang-pot-edge-2021');
  assert.deepEqual(source.numeric_observations.slice(1), [
    { metric: 'main_braise_minutes', value: null, min: 20, max: 25, unit: 'min', basis: 'covered braise before opening the pot and adding corn' },
    { metric: 'pre_paste_additional_braise_minutes', value: 5, min: 5, max: 5, unit: 'min', basis: 'additional boil after adding corn and before preparing to paste the cakes' },
  ]);
  assert.match(source.cannot_prove.join(' '), /贴饼后蒸制分钟数/);
});

test('calibration report and runbook are deterministic checked-in derivatives of M1 records', async () => {
  const ledger = readJson('data/northeast-stew-numeric-evidence.v1.json');
  const research = readJson('data/northeast-stew-research.v1.json');
  const { buildNortheastStewNumericEvidenceReport } = await import(
    pathToFileURL(fileURLToPath(relative('lib/northeast-stew-numeric-evidence-builder.mjs'))).href,
  );
  const { buildNortheastStewNumericEvidenceArtifacts } = await import(
    pathToFileURL(fileURLToPath(relative('lib/northeast-stew-numeric-evidence-renderer.mjs'))).href,
  );

  const report = buildNortheastStewNumericEvidenceReport(ledger, research.calibration_cases);
  const secondReport = buildNortheastStewNumericEvidenceReport(ledger, research.calibration_cases);
  assert.deepEqual(report, secondReport);
  assert.deepEqual(report.rules.map(rule => [rule.decision_status, rule.qualified_source_ids]), [['blocked', []], ['blocked', []]]);
  const artifacts = buildNortheastStewNumericEvidenceArtifacts(report);
  const secondArtifacts = buildNortheastStewNumericEvidenceArtifacts(secondReport);
  assert.deepEqual([...artifacts], [...secondArtifacts]);
  for (const [relativePath, content] of artifacts) assert.deepEqual(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'), content, relativePath);
  assert.match(artifacts.get('docs/northeast-stew-numeric-evidence.md'), /不能解除 M2 阻塞/);
  assert.match(artifacts.get('docs/northeast-stew-numeric-evidence.md'), /安全终点获批前不得执行实厨校准/);
  assert.doesNotMatch(artifacts.get('docs/northeast-stew-numeric-evidence.md'), /可指导第一次实厨试验/);
  assert.match(artifacts.get('docs/northeast-stew-numeric-evidence.md'), /受版权保护/);
  assert.match(artifacts.get('docs/northeast-stew-numeric-evidence.md'), /区间 \[80-100\] C/);
  assert.match(artifacts.get('docs/northeast-stew-calibration-runbook.md'), /2 人份/);
  assert.match(artifacts.get('docs/northeast-stew-calibration-runbook.md'), /不得填写生产默认值/);
  assert.match(artifacts.get('docs/northeast-stew-calibration-runbook.md'), /玉米面品牌/);
  assert.match(artifacts.get('docs/northeast-stew-calibration-runbook.md'), /一次只改变一个变量/);
  assert.match(artifacts.get('docs/northeast-stew-calibration-runbook.md'), /排骨.*熟制终点/);
  assert.match(artifacts.get('docs/northeast-stew-calibration-runbook.md'), /blocked_by_safety_endpoints/);
  assert.match(artifacts.get('docs/northeast-stew-calibration-runbook.md'), /禁止开始实厨校准/);
  assert.match(artifacts.get('docs/northeast-stew-calibration-runbook.md'), /preparation_water_grams/);
  assert.match(artifacts.get('docs/northeast-stew-calibration-runbook.md'), /cake_holds_together/);
  for (const field of ['cornmeal_brand', 'preparation_water_temperature_c', 'wheat_flour_added', 'fermentation_used', 'stew_liquid_level_at_paste']) {
    assert.match(artifacts.get('docs/northeast-stew-calibration-runbook.md'), new RegExp(field));
  }
});

test('build CLI writes fixed artifacts rejects invalid invocation and fails closed when stale', () => {
  const tempRoot = makeTempBuildRoot();
  try {
    const script = path.join(tempRoot, 'tools', 'build-northeast-stew-numeric-evidence.mjs');
    const write = spawnSync(process.execPath, [script, '--write'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(write.status, 0, `${write.stdout}\n${write.stderr}`);
    const markdown = path.join(tempRoot, 'docs', 'northeast-stew-numeric-evidence.md');
    assert.equal(fs.existsSync(markdown), true);
    fs.appendFileSync(markdown, '\nstale\n');
    const check = spawnSync(process.execPath, [script, '--check'], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(check.status, 1, `${check.stdout}\n${check.stderr}`);
    assert.match(check.stderr, /Missing or stale: docs\/northeast-stew-numeric-evidence\.md/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }

  const invalid = spawnSync(process.execPath, [fileURLToPath(relative('build-northeast-stew-numeric-evidence.mjs')), '--unknown'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /Usage: node tools\/build-northeast-stew-numeric-evidence\.mjs --write\|--check/);
});

test('aggregate recipe gate validates numeric evidence and generated artifact freshness', () => {
  const checker = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [checker], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /5 numeric sources; 2 blocked rules; 3 pending calibrations; no production defaults/);
  assert.match(result.stdout, /northeast numeric evidence ok/);
});

test('aggregate recipe gate fails closed when numeric evidence output is stale', () => {
  const tempRoot = makeTempAggregateRoot();
  try {
    const artifact = path.join(tempRoot, 'docs', 'northeast-stew-numeric-evidence.md');
    fs.appendFileSync(artifact, '\nstale\n');
    const checker = path.join(tempRoot, 'tools', 'check-recipes.mjs');
    const result = spawnSync(process.execPath, [checker], { cwd: tempRoot, encoding: 'utf8' });
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(`${result.stdout}\n${result.stderr}`, /northeast-stew-numeric-evidence\.md is missing or stale/);
    assert.doesNotMatch(result.stdout, /northeast numeric evidence ok/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
