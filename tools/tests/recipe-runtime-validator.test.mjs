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
const context = {
  recipes: readJson('recipe-library.json'),
  taxonomy: readJson('ingredient-taxonomy.v1.json'),
  templates: readJson('meal-templates.v2.json'),
  ratios: readJson('ratio-rules.v1.json'),
};

const INITIAL_RECIPE_IDS = new Set([
  'shanghai-salted-pork-vegetable-rice',
  'xinjiang-lamb-pilaf',
  'taiwan-cabbage-mushroom-rice',
  'quanzhou-oil-rice',
  'cantonese-mushroom-chicken-claypot-rice',
  'north-china-green-bean-braised-noodles',
]);

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
  entry.safety_endpoints = ['unknown-safety-endpoint'];

  const errors = validateRecipeRuntimeCatalog(invalid, context);
  for (const expected of ['independent HTTPS identity evidence', 'unknown canonical_id', 'unknown template_id', 'unknown ratio_rule_id', 'unknown safety endpoint']) {
    assert.ok(errors.some(error => error.includes(expected)), expected);
  }
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
