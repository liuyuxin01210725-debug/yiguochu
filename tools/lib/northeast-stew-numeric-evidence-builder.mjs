import { assertNortheastStewNumericEvidence } from './northeast-stew-numeric-evidence-validator.mjs';

export function buildNortheastStewNumericEvidenceReport(ledger, calibrationCases) {
  assertNortheastStewNumericEvidence(ledger, calibrationCases);
  return {
    schema_version: 1,
    ledger_version: ledger.ledger_version,
    scope: 'research_only',
    conclusion: '公开证据只用于界定后续记录字段与证据缺口，不能解除 M2 阻塞，也不能转写为生产参数；安全终点获批前不得执行实厨校准。',
    sources: ledger.sources.map(source => ({
      source_id: source.source_id,
      title: source.title,
      url: source.url,
      doi: source.doi,
      publisher: source.publisher,
      author: source.author,
      published_at: source.published_at,
      retrieved_at: source.retrieved_at,
      rights_or_license: source.rights_or_license,
      source_type: source.source_type,
      classification: source.classification,
      independence_group: source.independence_group,
      ingredient_state: source.ingredient_state,
      numeric_observations: source.numeric_observations,
      cannot_prove: source.cannot_prove,
    })),
    rules: ledger.rules.map(rule => ({
      rule_id: rule.rule_id,
      decision_status: rule.decision_status,
      candidate_source_ids: rule.candidate_source_ids,
      qualified_source_ids: rule.qualified_source_ids,
      blocking_reasons: rule.blocking_reasons,
    })),
    calibration_case_ids: ledger.calibration_case_ids,
    calibration_cases: calibrationCases.map(row => ({
      ...row,
      equipment: { ...row.equipment },
      measurements: { ...row.measurements },
      acceptance_checks: { ...row.acceptance_checks },
    })),
    summary: {
      source_count: ledger.sources.length,
      qualified_source_count: 0,
      blocked_rule_count: ledger.rules.filter(rule => rule.decision_status === 'blocked').length,
      pending_calibration_count: calibrationCases.filter(row => row.status === 'pending').length,
      production_defaults_written: 0,
    },
  };
}

export function validateNortheastStewNumericEvidenceReport(report) {
  if (!report || typeof report !== 'object') return ['numeric evidence report must be an object'];
  const errors = [];
  if (report.scope !== 'research_only') errors.push('report scope must be research_only');
  if (report.summary?.qualified_source_count !== 0) errors.push('report qualified_source_count must be 0');
  if (report.summary?.blocked_rule_count !== 2) errors.push('report blocked_rule_count must be 2');
  if (report.summary?.pending_calibration_count !== 3) errors.push('report pending_calibration_count must be 3');
  if (report.summary?.production_defaults_written !== 0) errors.push('report production_defaults_written must be 0');
  if (!Array.isArray(report.rules) || report.rules.some(rule => rule.decision_status !== 'blocked' || rule.qualified_source_ids?.length)) errors.push('report rules must remain blocked with no qualified sources');
  return errors;
}

export function formatNortheastStewNumericEvidenceSummary(report) {
  return `${report.summary.source_count} numeric sources; ${report.summary.blocked_rule_count} blocked rules; ${report.summary.pending_calibration_count} pending calibrations; no production defaults`;
}
