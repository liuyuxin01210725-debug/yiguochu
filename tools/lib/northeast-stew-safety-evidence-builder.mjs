import { assertNortheastStewSafetyEvidence } from './northeast-stew-safety-evidence-validator.mjs';

const clone = value => structuredClone(value);

export function buildNortheastStewSafetyEvidenceReport({ ledger, research, taxonomy, numericEvidence }) {
  assertNortheastStewSafetyEvidence({ ledger, research, taxonomy });
  const numericRulesBlocked = Array.isArray(numericEvidence?.rules)
    && numericEvidence.rules.length === 2
    && numericEvidence.rules.every(rule => rule?.decision_status === 'blocked');
  if (!numericRulesBlocked) throw new Error('Northeast safety report requires both numeric ratio rules to remain blocked');
  const calibrationCases = clone(research.calibration_cases);
  return {
    schema_version: 1,
    ledger_version: ledger.ledger_version,
    scope: 'research_only',
    conclusion: '排骨、普通豆角和油豆角已有受控熟制终点，可开始填写 2/3/4 人份实厨校准；这不解除数值比例、校准结果或运行模板的阻塞。',
    sources: clone(ledger.sources),
    rules: clone(ledger.rules),
    safety_branches: clone(research.family_model.safety_branches),
    calibration_admission: {
      ...clone(ledger.calibration_admission),
      calibration_cases: calibrationCases,
    },
    summary: {
      official_source_count: ledger.sources.length,
      calibration_ready_rule_count: ledger.rules.filter(rule => rule.decision_status === 'calibration_ready').length,
      calibration_ready_branch_count: research.family_model.safety_branches.filter(branch => branch.evidence_status === 'calibration_ready').length,
      pending_calibration_count: calibrationCases.filter(row => row.status === 'pending').length,
      blocked_numeric_rule_count: numericEvidence.rules.filter(rule => rule.decision_status === 'blocked').length,
      production_rules_activated: 0,
    },
  };
}

export function validateNortheastStewSafetyEvidenceReport(report) {
  if (!report || typeof report !== 'object') return ['safety evidence report must be an object'];
  const errors = [];
  if (report.scope !== 'research_only') errors.push('report scope must remain research_only');
  if (report.summary?.official_source_count !== 3) errors.push('report must contain three official sources');
  if (report.summary?.calibration_ready_rule_count !== 3) errors.push('report must contain three calibration-ready safety rules');
  if (report.summary?.calibration_ready_branch_count !== 2) errors.push('report must contain two calibration-ready safety branches');
  if (report.summary?.pending_calibration_count !== 3) errors.push('report must retain three pending calibration cases');
  if (report.summary?.blocked_numeric_rule_count !== 2) errors.push('report must retain two blocked numeric rules');
  if (report.summary?.production_rules_activated !== 0) errors.push('report must not activate production rules');
  if (report.calibration_admission?.status !== 'ready_for_kitchen_calibration') errors.push('report calibration admission must be ready_for_kitchen_calibration');
  if (report.calibration_admission?.production_activation_allowed !== false) errors.push('report production activation must remain false');
  if (!Array.isArray(report.rules) || report.rules.some(rule => rule.decision_status !== 'calibration_ready')) errors.push('report safety rules must remain calibration_ready only');
  if (!Array.isArray(report.calibration_admission?.calibration_cases)
    || report.calibration_admission.calibration_cases.some(row => row.status !== 'pending')) errors.push('report calibration cases must remain pending');
  return errors;
}

export function formatNortheastStewSafetyEvidenceSummary(report) {
  return `${report.summary.official_source_count} official safety sources; ${report.summary.calibration_ready_branch_count} calibration-ready branches; ${report.summary.pending_calibration_count} pending calibrations; no production activation`;
}
