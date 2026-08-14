# C30/C31 runtime candidate authority and kitchen-trial eligibility

## Runtime candidate authority

Every named Planner candidate and every rice-meal catalog candidate carries
`runtime_candidate_authority` with a deterministic `candidate_id`, recipe and
variant identity, catalog version, and SHA-256 contract hash.  The hash covers
the exact runtime entry/variant contract and is checked when candidates are
materialized, selected for hybrid navigation, restored from the initial
recommend cache, swapped, and handed to `generate-plan`.  Rice-meal plan tokens
also include the authority in their signed facts, so a stale or edited variant
cannot be restored or compiled under an old token.

Candidate authority is an identity binding only.  The current build remains
`shadow` (`authorized: false`); a valid candidate hash never promotes a
research, trial, or preview record to production runtime authority.

## Kitchen-trial eligibility

The trial catalog now recomputes eligibility from structured contracts rather
than treating a versioned join as executable.  A candidate must have:

- a fixed-batch serving count and a positive amount for every ingredient;
- a liquid amount or an explicit waterline contract;
- a non-empty structured cooking sequence and time contract;
- safety endpoint data, or an explicit formal-review `not_applicable` result;
- an explicit `equipment_contract` with brand, model, program, and capacity;
- versioned source, execution, formalization, and formal-review joins with
  reproducible SHA-256 hashes.

The current 34 source-backed records have no structured equipment contract, so
the deterministic catalog reports `trial_eligible: false` for all 34 and lists
`equipment_contract_missing` in each `eligibility_reasons`.  They remain
shadow-only research candidates; no trial observation may reference one until
the catalog is rebuilt with closed contracts.

## Observation contract

When a kitchen observation references a trial candidate it must record the
trial catalog version, canonical trial candidate/variant identity, and all four
`trial_contract_hashes` (source, execution, formalization, formal review).
Reference validation compares these values to the catalog entry and fails
closed on missing, stale, or forged hashes.  The promotion gate additionally
requires deterministic trial eligibility and never treats an observation as
production approval by itself.
