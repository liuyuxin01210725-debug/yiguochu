import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertRecipeRuntimeCatalog,
  validateRecipeRuntimeCatalog,
} from '../lib/recipe-runtime-validator.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const readJson = name => JSON.parse(fs.readFileSync(path.join(here, '../data', name), 'utf8'));
const catalog = readJson('recipe-runtime.v1.json');
const productionRatios = readJson('ratio-rules.v1.json');
const SYNTHETIC_RECIPE_RATIOS = [
  {
    rule_id: 'synthetic-shanghai-recipe-executable-v1',
    evidence_recipe_ids: ['shanghai-salted-pork-vegetable-rice'],
    execution_mode: 'executable',
    when: { recipe_id: 'shanghai-salted-pork-vegetable-rice' },
  },
  {
    rule_id: 'synthetic-north-china-recipe-executable-v1',
    evidence_recipe_ids: ['north-china-green-bean-braised-noodles'],
    execution_mode: 'executable',
    when: { recipe_id: 'north-china-green-bean-braised-noodles' },
  },
];
const context = {
  recipes: readJson('recipe-library.json'),
  taxonomy: readJson('ingredient-taxonomy.v1.json'),
  templates: readJson('meal-templates.v2.json'),
  ratios: { ...productionRatios, rules: [...productionRatios.rules, ...SYNTHETIC_RECIPE_RATIOS] },
};

const INITIAL_RECIPE_IDS = new Set([
  'shanghai-salted-pork-vegetable-rice',
  'xinjiang-lamb-pilaf',
  'taiwan-cabbage-mushroom-rice',
  'quanzhou-oil-rice',
  'cantonese-cured-meat-claypot-rice',
  'north-china-green-bean-braised-noodles',
]);

const COMPLETE_SOURCE_CLAIMS = ['identity', 'technique', 'ratio', 'seasoning', 'safety']
  .map(claim_type => ({ claim_type, evidence_index: 0 }));

function completeSyntheticPreview() {
  const preview = structuredClone(catalog);
  const entry = preview.entries.find(candidate => candidate.recipe_id === 'shanghai-salted-pork-vegetable-rice');
  entry.activation_status = 'preview_enabled';
  entry.identity_signature.required_states_or_cuts = [
    { canonical_id: 'salted-pork-belly', value: 'cured_slice' },
  ];
  entry.slot_assignment = {
    staple: ['raw-rice'],
    protein: ['salted-pork-belly'],
    fast_vegetable: ['small-bok-choy'],
  };
  entry.ratio_rule_ids = ['synthetic-shanghai-recipe-executable-v1'];
  entry.ratio_default_rule_id = 'synthetic-shanghai-recipe-executable-v1';
  entry.technique_graph = [
    { phase: 2, action_code: 'protein_pretreat', slot_ids: ['protein'] },
    { phase: 6, action_code: 'add_pork', slot_ids: ['protein'] },
    { phase: 8, action_code: 'add_staple_and_liquid', slot_ids: ['staple'] },
    { phase: 12, action_code: 'add_fast_cooking_items', slot_ids: ['fast_vegetable'] },
    { phase: 13, action_code: 'reach_safety_endpoints', slot_ids: ['protein'] },
  ];
  entry.seasoning_actions = [{ action_code: 'add_measured_seasoning', amount_source: 'ratio_default' }];
  entry.safety_endpoints = [{ endpoint_code: 'pork_fully_cooked', canonical_ids: ['salted-pork-belly'] }];
  entry.source_claims = structuredClone(COMPLETE_SOURCE_CLAIMS);
  entry.household_trial = {
    status: 'completed',
    trial_date: '2026-07-30',
    reviewer: 'synthetic-test-fixture',
    outcome: 'passed',
  };
  return preview;
}

function completeSyntheticNorthChinaPreview() {
  const preview = structuredClone(catalog);
  const entry = preview.entries.find(candidate => candidate.recipe_id === 'north-china-green-bean-braised-noodles');
  entry.activation_status = 'preview_enabled';
  entry.identity_signature.required_states_or_cuts = [
    { canonical_id: 'ground-pork', value: 'ground' },
  ];
  entry.slot_assignment = {
    staple: ['fresh-wheat-noodle'],
    vegetable: ['green-beans'],
    liquid: ['water'],
    protein: ['ground-pork'],
  };
  entry.ratio_rule_ids = ['synthetic-north-china-recipe-executable-v1'];
  entry.ratio_default_rule_id = 'synthetic-north-china-recipe-executable-v1';
  entry.technique_graph = [
    { phase: 1, action_code: 'protein_pretreat', slot_ids: ['protein'] },
    { phase: 2, action_code: 'add_liquid', slot_ids: ['liquid'] },
    { phase: 3, action_code: 'simmer_until_tender', slot_ids: ['protein', 'vegetable'] },
    { phase: 4, action_code: 'add_noodle', slot_ids: ['staple'] },
    { phase: 5, action_code: 'reach_safety_endpoints', slot_ids: ['staple', 'protein', 'vegetable'] },
  ];
  entry.seasoning_actions = [{ action_code: 'add_measured_seasoning', amount_source: 'ratio_default' }];
  entry.safety_endpoints = [
    { endpoint_code: 'pork_fully_cooked', canonical_ids: ['ground-pork'] },
    { endpoint_code: 'bean_fully_cooked', canonical_ids: ['green-beans'] },
    { endpoint_code: 'noodle_tender', canonical_ids: ['fresh-wheat-noodle'] },
  ];
  entry.source_claims = structuredClone(COMPLETE_SOURCE_CLAIMS);
  entry.household_trial = {
    status: 'completed',
    trial_date: '2026-07-30',
    reviewer: 'synthetic-test-fixture',
    outcome: 'passed',
  };
  return preview;
}

test('a fully coherent synthetic preview fixture satisfies every runtime relationship', () => {
  assert.deepEqual(validateRecipeRuntimeCatalog(completeSyntheticPreview(), context), []);
});

test('a coherent North-China preview permits water only as the required basic-extra liquid dependency', () => {
  assert.deepEqual(validateRecipeRuntimeCatalog(completeSyntheticNorthChinaPreview(), context), []);
});

test('preview source claims must cover every activation-contract claim type', () => {
  const invalid = completeSyntheticPreview();
  invalid.entries[0].source_claims = [{ claim_type: 'identity', evidence_index: 0 }];
  const errors = validateRecipeRuntimeCatalog(invalid, context);
  for (const claimType of ['technique', 'ratio', 'seasoning', 'safety']) {
    assert.ok(errors.some(error => error.includes(`source_claims missing required claim_type ${claimType}`)), claimType);
  }
});

test('runtime catalog keeps the six independently reviewed identities planned', () => {
  assert.equal(catalog.recipe_runtime_catalog_version, 'recipe-runtime-v1-20260730-r1');
  assert.equal(catalog.entries.length, 6);
  assert.deepEqual(new Set(catalog.entries.map(entry => entry.recipe_id)), INITIAL_RECIPE_IDS);
  assert.equal(new Set(catalog.entries.map(entry => entry.recipe_id)).size, 6);
  assert.ok(catalog.entries.every(entry => entry.activation_status === 'planned'));
  assert.ok(catalog.entries.every(entry => entry.activation_status !== 'preview_enabled'));
  assert.deepEqual(validateRecipeRuntimeCatalog(catalog, context), []);
  assert.doesNotThrow(() => assertRecipeRuntimeCatalog(catalog, context));
});

test('canonical identities require non-project HTTPS evidence and resolve every authoritative reference', () => {
  const invalid = structuredClone(catalog);
  const entry = invalid.entries[0];
  entry.identity_evidence[0].url = 'https://yiguochu.pages.dev/recipes.html?id=not-independent';
  entry.identity_signature.required_canonical_ids = ['unknown-canonical-id'];
  entry.template_id = 'unknown-template-id';
  entry.ratio_rule_ids = ['unknown-ratio-id'];
  entry.safety_endpoints = [{ endpoint_code: 'unknown-safety-endpoint', canonical_ids: [] }];

  const errors = validateRecipeRuntimeCatalog(invalid, context);
  for (const expected of ['independent HTTPS identity evidence', 'unknown canonical_id', 'unknown template_id', 'unknown ratio_rule_id', 'safety endpoint unknown-safety-endpoint']) {
    assert.ok(errors.some(error => error.includes(expected)), expected);
  }
});

test('all project-controlled pages.dev subdomains are invalid canonical identity evidence', () => {
  const invalid = structuredClone(catalog);
  invalid.entries[0].identity_evidence[0].url = 'https://preview.yiguochu.pages.dev/recipes.html?id=not-independent';
  assert.match(validateRecipeRuntimeCatalog(invalid, context).join('\n'), /independent HTTPS identity evidence/);
});

test('preview activation fails closed without a single ratio default or structured household trial', () => {
  const noDefault = structuredClone(catalog);
  noDefault.entries[0].activation_status = 'preview_enabled';
  const noTrial = structuredClone(catalog);
  noTrial.entries[0].activation_status = 'preview_enabled';
  noTrial.entries[0].ratio_default_rule_id = noTrial.entries[0].ratio_rule_ids[0];

  assert.match(validateRecipeRuntimeCatalog(noDefault, context).join('\n'), /exactly one ratio default/);
  assert.match(validateRecipeRuntimeCatalog(noTrial, context).join('\n'), /structured household_trial/);
});

test('auto-approved recipes do not auto-promote runtime activation', () => {
  const autoApproved = context.recipes.recipes.find(recipe => recipe.id === 'shanghai-salted-pork-vegetable-rice');
  assert.equal(autoApproved.status, 'auto_approved');
  const entry = catalog.entries.find(candidate => candidate.recipe_id === autoApproved.id);
  assert.equal(entry.activation_status, 'planned');
});

test('validator rejects schema bypasses, unknown recipes and free-text substitutions', () => {
  const invalid = structuredClone(catalog);
  invalid.extra = true;
  invalid.entries[0].recipe_id = 'unknown-recipe-id';
  invalid.entries[0].naming.extra = true;
  invalid.entries[0].approved_variants = ['把小白菜换成菜心'];

  const errors = validateRecipeRuntimeCatalog(invalid, context);
  for (const expected of ['catalog unknown key', 'unknown recipe_id', 'naming unknown key', 'approved_variants[0] must be an object']) {
    assert.ok(errors.some(error => error.includes(expected)), expected);
  }
});

test('preview activation rejects every missing or malformed executable binding', () => {
  const invalid = completeSyntheticPreview();
  const entry = invalid.entries[0];
  entry.identity_signature = {
    required_canonical_ids: [],
    required_states_or_cuts: [],
    forbidden_canonical_ids: [],
  };
  entry.slot_assignment = { invented_slot: ['free text replacement'] };
  entry.technique_graph = [{ arbitrary_instruction: '随便炒一下' }];
  entry.seasoning_actions = [{ note: '按口味加盐' }];
  entry.safety_endpoints = [];
  entry.source_claims = [{ url: 'https://example.com/free-text-source' }];
  entry.household_trial.trial_date = 'not-a-date';
  entry.household_trial.outcome = 'failed';

  const errors = validateRecipeRuntimeCatalog(invalid, context);
  for (const expected of [
    'identity_signature.required_canonical_ids must not be empty',
    'slot_assignment unknown slot invented_slot',
    'technique_graph[0] unknown key arbitrary_instruction',
    'seasoning_actions[0] unknown key note',
    'preview_enabled requires at least one safety endpoint',
    'source_claims[0] unknown key url',
    'household_trial.trial_date must use YYYY-MM-DD',
    'household_trial.outcome must be passed',
  ]) assert.ok(errors.some(error => error.includes(expected)), expected);
});

test('preview activation enforces recipe, template, ratio, slot and safety relationships', () => {
  const invalid = completeSyntheticPreview();
  const entry = invalid.entries[0];
  entry.identity_signature.required_canonical_ids = ['tomato'];
  entry.slot_assignment = { invented_slot: ['tomato'] };
  entry.ratio_rule_ids = ['acid-staple-raw-rice-liquid-v1'];
  entry.ratio_default_rule_id = 'acid-staple-raw-rice-liquid-v1';
  entry.safety_endpoints = [{ endpoint_code: 'bean_fully_cooked', canonical_ids: ['salted-pork-belly'] }];

  const errors = validateRecipeRuntimeCatalog(invalid, context);
  for (const expected of [
    'canonical_id tomato is not a recipe core identity',
    'slot_assignment unknown slot invented_slot',
    'ratio_rule_id acid-staple-raw-rice-liquid-v1 must be recipe-scoped',
    'safety endpoint bean_fully_cooked does not belong to template',
  ]) assert.ok(errors.some(error => error.includes(expected)), expected);
});

test('validator locks the r1 catalog to exactly the six approved pilot recipe IDs', () => {
  const missing = structuredClone(catalog);
  missing.entries.pop();
  const extra = structuredClone(catalog);
  extra.entries.push(structuredClone(extra.entries[0]));
  extra.entries[6].recipe_id = 'simple-chicken-biryani';

  assert.match(validateRecipeRuntimeCatalog(missing, context).join('\n'), /r1 recipe IDs must exactly match/);
  assert.match(validateRecipeRuntimeCatalog(extra, context).join('\n'), /r1 recipe IDs must exactly match/);
});

test('preview rejects the review adversary with individually valid but unrelated bindings', () => {
  const invalid = completeSyntheticPreview();
  const entry = invalid.entries[0];
  entry.identity_signature.required_states_or_cuts = ['invented-free-text-state'];
  entry.slot_assignment = { protein: ['salted-pork-belly'] };
  entry.technique_graph = [{ phase: 2, action_code: 'protein_pretreat', slot_ids: ['protein'] }];
  entry.safety_endpoints = [{ endpoint_code: 'lamb_fully_cooked', canonical_ids: ['lamb-leg'] }];
  entry.household_trial.trial_date = '2026-99-99';

  const errors = validateRecipeRuntimeCatalog(invalid, context);
  for (const expected of [
    'slot_assignment required slot staple must be assigned',
    'required canonical_id raw-rice must be assigned exactly once',
    'required_states_or_cuts[0] must be an object',
    'technique_graph missing required template step',
    'safety endpoint lamb_fully_cooked canonical_id lamb-leg is not assigned',
    'missing required safety endpoint pork_fully_cooked for canonical_id salted-pork-belly',
    'household_trial.trial_date must be a real calendar date',
  ]) assert.ok(errors.some(error => error.includes(expected)), expected);
});

test('preview rejects duplicate, incompatible and unrelated canonical slot assignments', () => {
  const invalid = completeSyntheticPreview();
  const entry = invalid.entries[0];
  entry.slot_assignment.staple = ['raw-rice', 'raw-rice'];
  entry.slot_assignment.fast_vegetable = ['small-bok-choy', 'tomato'];

  const errors = validateRecipeRuntimeCatalog(invalid, context);
  for (const expected of [
    'slot_assignment.staple exceeds max_items',
    'required canonical_id raw-rice must be assigned exactly once',
    'canonical_id tomato is not a required recipe identity',
  ]) assert.ok(errors.some(error => error.includes(expected)), expected);
});

test('planned runtime entries reference only their own bounds-only recipe evidence rules', () => {
  const expected = new Map([
    ['shanghai-salted-pork-vegetable-rice', ['shanghai-salted-pork-liquid-evidence-v1']],
    ['xinjiang-lamb-pilaf', ['xinjiang-lamb-pilaf-liquid-evidence-v1']],
    ['taiwan-cabbage-mushroom-rice', [
      'taiwan-cabbage-mushroom-liquid-evidence-v1',
      'taiwan-tomato-shrimp-rice-evidence-v1',
    ]],
    ['quanzhou-oil-rice', ['quanzhou-soaked-rice-liquid-evidence-v1']],
    ['cantonese-cured-meat-claypot-rice', []],
    ['north-china-green-bean-braised-noodles', []],
  ]);
  for (const entry of catalog.entries) {
    assert.deepEqual(entry.ratio_rule_ids, expected.get(entry.recipe_id), entry.recipe_id);
    assert.equal(entry.ratio_default_rule_id, null, entry.recipe_id);
  }
  assert.deepEqual(validateRecipeRuntimeCatalog(catalog, context), []);

  const wrong = structuredClone(catalog);
  wrong.entries.find(entry => entry.recipe_id === 'shanghai-salted-pork-vegetable-rice')
    .ratio_rule_ids = ['xinjiang-lamb-pilaf-liquid-evidence-v1'];
  assert.match(validateRecipeRuntimeCatalog(wrong, context).join('\n'), /must be recipe-scoped/);
});

test('bounds-only recipe evidence can never satisfy a preview ratio default', () => {
  const invalid = completeSyntheticPreview();
  const entry = invalid.entries.find(candidate => candidate.recipe_id === 'shanghai-salted-pork-vegetable-rice');
  entry.ratio_rule_ids = ['shanghai-salted-pork-liquid-evidence-v1'];
  entry.ratio_default_rule_id = 'shanghai-salted-pork-liquid-evidence-v1';
  assert.match(validateRecipeRuntimeCatalog(invalid, context).join('\n'), /ratio default must be executable/);
});

test('named runtime entries reject generic template ratio references and defaults', () => {
  const planned = structuredClone(catalog);
  const entry = planned.entries.find(candidate => candidate.recipe_id === 'shanghai-salted-pork-vegetable-rice');
  entry.ratio_rule_ids = ['savory-mixed-rice-liquid-v1'];
  assert.match(
    validateRecipeRuntimeCatalog(planned, context).join('\n'),
    /must be recipe-scoped to shanghai-salted-pork-vegetable-rice/,
  );

  const preview = completeSyntheticPreview();
  const previewEntry = preview.entries.find(candidate => candidate.recipe_id === 'shanghai-salted-pork-vegetable-rice');
  previewEntry.ratio_rule_ids = ['savory-mixed-rice-liquid-v1'];
  previewEntry.ratio_default_rule_id = 'savory-mixed-rice-liquid-v1';
  assert.match(
    validateRecipeRuntimeCatalog(preview, context).join('\n'),
    /must be recipe-scoped to shanghai-salted-pork-vegetable-rice/,
  );
});
