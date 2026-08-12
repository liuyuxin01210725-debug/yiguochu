import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildSourceBackedExecutionLibrary, validateSourceBackedExecutionLibrary } from '../lib/source-backed-execution-library.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formalization-ledger.v1.json', import.meta.url), 'utf8'));

test('execution library emits one auditable execution card for every source-backed recipe', () => {
  const library = buildSourceBackedExecutionLibrary(catalog);

  assert.equal(library.entries.length, 923);
  assert.equal(library.counts.total, 923);
  assert.equal(library.counts.source_complete, 138);
  assert.equal(library.counts.source_partial_with_draft, 738);
  assert.equal(library.counts.draft_estimated, 36);
  assert.equal(library.counts.identity_only_draft, 11);

  const ids = new Set();
  for (const entry of library.entries) {
    assert.equal(ids.has(entry.recipe_id), false, `duplicate execution entry ${entry.recipe_id}`);
    ids.add(entry.recipe_id);
    assert.ok(entry.canonical_name);
    assert.ok(entry.source_contract);
    assert.ok(Array.isArray(entry.execution_card.ingredients));
    assert.ok(entry.execution_card.ingredients.length > 0, `${entry.recipe_id} must expose ingredients`);
    assert.ok(Array.isArray(entry.execution_card.steps));
    assert.ok(entry.execution_card.steps.length > 0, `${entry.recipe_id} must expose steps`);
    assert.ok(entry.execution_card.steps.every(step => step.provenance === 'source' || step.provenance === 'estimated' || step.provenance === 'source_hint'));
    assert.ok(Array.isArray(entry.formal_blocker_codes));
    assert.ok(entry.formal_blocker_codes.includes('not_in_formal_72'));
    assert.equal(entry.run_scope, entry.method_card_status === 'source_complete' ? 'source_bounded_preview' : 'research_only');
  }
  const blocked = library.entries.find(entry => entry.recipe_id === 'yangzhong-pufferfish-eight-pot-rice');
  assert.match(blocked.execution_card.blocked_reason, /禁止据此采购、处理或烹调/u);
});

test('execution library validator rejects a missing source record and accepts the generated artifact', () => {
  const library = buildSourceBackedExecutionLibrary(catalog);
  assert.deepEqual(validateSourceBackedExecutionLibrary(library, catalog), []);

  const broken = structuredClone(library);
  broken.entries.pop();
  assert.match(validateSourceBackedExecutionLibrary(broken, catalog).join('\n'), /entries must cover every source recipe/u);
});

test('execution library remains aligned with the formalization ledger', () => {
  const library = buildSourceBackedExecutionLibrary(catalog);
  const ledgerById = new Map(ledger.records.map(row => [row.recipe_id, row]));
  for (const entry of library.entries) {
    const row = ledgerById.get(entry.recipe_id);
    assert.ok(row, entry.recipe_id);
    assert.equal(entry.formalization_status, row.formalization_status);
    assert.deepEqual(entry.formal_blocker_codes, row.formal_planner_blocker_codes);
  }
});
