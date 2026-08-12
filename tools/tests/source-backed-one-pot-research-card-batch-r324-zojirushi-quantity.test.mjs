import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildShelfCatalog } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find(item => item.recipe_id === 'zojirushi-china-tomato-seafood-rice');

test('r324 exposes the opened Zojirushi China tomato-seafood quantity block without using mismatched steps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'identity_verified');
  assert.equal(recipe.cooking_sequence.length, 2);
  assert.ok(recipe.cooking_sequence.every(step => step.source_ids?.includes('S-R72-ZOJIRUSHI-CHINA-TOMATO-SEAFOOD')));
  const source = recipe.source_refs.find(item => item.source_id === 'S-R72-ZOJIRUSHI-CHINA-TOMATO-SEAFOOD');
  assert.ok(source);
  assert.equal(source.access_status, 'opened');
  assert.ok(source.claim_scopes.includes('quantity'));
  assert.match(source.evidence_locator, /大米3杯.*鱿鱼圈40g.*虾仁40g.*洋葱30g.*什锦蔬菜40g.*番茄.*80g/u);
  assert.match(recipe.evidence_notes, /定量/u);
  assert.match(recipe.evidence_notes, /步骤.*错配|错配.*步骤/u);
  const method = buildShelfCatalog(catalog).records.find(item => item.recipe_id === recipe.recipe_id).research_method;
  assert.ok(method.source_quantity_hints.some(hint => /大米3杯.*鱿鱼圈40g.*虾仁40g/u.test(hint.text)));
  assert.equal(method.steps.filter(step => step.provenance === 'source').length, 2);
  assert.ok(method.steps.length >= 4);
  assert.equal(method.research_profile, null);
  assert.deepEqual(method.liquid.amount, { value: 450, unit: 'mL' });
  assert.equal(method.time.total_minutes, 45);
  assert.ok(method.steps.filter(step => step.provenance === 'estimated').every(step => !/粥|900mL/u.test(step.instruction)));
});
