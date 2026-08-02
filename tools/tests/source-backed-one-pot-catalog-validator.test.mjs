import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSourceBackedOnePotCatalog,
} from '../lib/source-backed-one-pot-catalog-validator.mjs';

const validCatalog = () => ({
  schema_version: 1,
  catalog_version: 'source-backed-one-pot-v1-test',
  scope: 'savory-rice-main-meal',
  reviewed_regions: ['CN-SH'],
  regional_blanks: [],
  recipes: [{
    recipe_id: 'shanghai-salted-pork-rice',
    canonical_name: '上海咸肉菜饭',
    aliases: [],
    region_codes: ['CN-SH'],
    cuisine_family: 'jiangnan-vegetable-rice',
    identity_status: 'verified',
    traditional_vessels: ['铁锅'],
    core_ingredients: ['米', '青菜', '咸肉'],
    fixed_batch: null,
    liquid_contract: null,
    cooking_sequence: [],
    time_contract: null,
    safety_endpoints: [],
    allergen_labels: [],
    nutrition_structure: { grade: 'A', roles: ['carbohydrate', 'protein', 'fiber'] },
    cooker_adaptation: { status: 'not_assessed', notes: '' },
    source_refs: [{
      source_id: 'shanghai-fengxian-salted-pork-rice',
      title: '大雪节气村民做咸肉菜饭',
      publisher: '上海市奉贤区人民政府',
      url: 'https://www.fengxian.gov.cn/example.html',
      retrieved_at: '2026-08-02',
      source_kind: 'government',
      claim_scopes: ['identity', 'ingredients', 'process'],
      attribution: '上海市奉贤区人民政府',
      license: 'facts-only-review',
    }],
    status: 'identity_verified',
    evidence_notes: '来源只支持身份、核心食材和高层流程。',
  }],
});

const executableCatalog = () => {
  const catalog = validCatalog();
  const recipe = catalog.recipes[0];
  recipe.status = 'preview_ready';
  recipe.fixed_batch = { servings: 2, ingredients: [] };
  recipe.liquid_contract = { kind: 'added_water', amount: { value: 260, unit: 'ml' } };
  recipe.cooking_sequence = [{ step: 1, instruction: '煮熟后食用。' }];
  recipe.time_contract = { total_minutes: 40 };
  recipe.safety_endpoints = [{ code: 'rice_tender' }];
  recipe.allergen_labels = [];
  recipe.source_refs[0].claim_scopes = [
    'identity', 'ingredients', 'quantity', 'liquid', 'process', 'time',
  ];
  return catalog;
};

const errorsFor = catalog => validateSourceBackedOnePotCatalog(catalog);

test('accepts an identity-verified recipe without pretending it is executable', () => {
  assert.deepEqual(validateSourceBackedOnePotCatalog(validCatalog()), []);
});

test('rejects project self-citations', () => {
  // Removing the project-self-citation validator branch would make this fail.
  const catalog = validCatalog();
  catalog.recipes[0].source_refs[0].url = 'https://yiguochu.pages.dev/recipes/shanghai-salted-pork-rice';
  assert.match(errorsFor(catalog).join('\n'), /project self-citation/i);
});

test('rejects a public recipe without identity support', () => {
  // Removing the public-identity-support validator branch would make this fail.
  const catalog = executableCatalog();
  catalog.recipes[0].source_refs[0].claim_scopes = [
    'ingredients', 'quantity', 'liquid', 'process', 'time',
  ];
  assert.match(errorsFor(catalog).join('\n'), /identity support/i);
});

test('rejects a public recipe without fixed batch and liquid contract', () => {
  // Removing the executable-contract validator branch would make this fail.
  const catalog = executableCatalog();
  catalog.recipes[0].fixed_batch = null;
  catalog.recipes[0].liquid_contract = null;
  assert.match(errorsFor(catalog).join('\n'), /fixed_batch.*liquid_contract/i);
});

test('rejects unsupported claim scopes', () => {
  // Removing the claim-scope validator branch would make this fail.
  const catalog = validCatalog();
  catalog.recipes[0].source_refs[0].claim_scopes = ['taste_is_good'];
  assert.match(errorsFor(catalog).join('\n'), /unsupported scope/i);
});

test('rejects C-grade public recommendations', () => {
  // Removing the public-nutrition-grade validator branch would make this fail.
  const catalog = executableCatalog();
  catalog.recipes[0].nutrition_structure.grade = 'C';
  assert.match(errorsFor(catalog).join('\n'), /grade A or B/i);
});

test('rejects an invented adaptation presented as the canonical regional name', () => {
  // Removing the adapted-name validator branch would make this fail.
  const catalog = validCatalog();
  catalog.recipes[0].cooker_adaptation = {
    status: 'adapted',
    adapted_name: catalog.recipes[0].canonical_name,
    notes: '电饭煲版本。',
  };
  assert.match(errorsFor(catalog).join('\n'), /adapted_name.*canonical_name/i);
});

test('returns errors instead of throwing for malformed public source references', () => {
  // Removing the malformed-source guard would make this fail.
  const catalog = executableCatalog();
  catalog.recipes[0].source_refs = null;
  assert.doesNotThrow(() => validateSourceBackedOnePotCatalog(catalog));
  assert.match(errorsFor(catalog).join('\n'), /source_refs/i);
});
