import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('r185 records four existing model-scoped waterline contracts', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r212');
  assert.equal(catalog.recipes.length, 923);
  const byId = new Map(catalog.recipes.map(item => [item.recipe_id, item]));
  const executableIds = new Set(['tatung-paella-style-seafood-rice']);
  const expected = [
    ['tatung-hainan-chicken-rice', { kind: 'waterline', waterline: { appliance_model: '大同電鍋', scale: '内锅水位线', mark: 2 }, source_ids: ['S-TATUNG-HAINAN-CHICKEN-RICE-1'] }, /水位线2|保存鸡汤/u],
    ['tatung-paella-style-seafood-rice', { kind: 'waterline', waterline: { appliance_model: '大同電鍋', scale: '内锅水位线', mark: '2至3' }, source_ids: ['S-TATUNG-PAELLA-SEAFOOD-RICE-1'] }, /水位线2至3|贝类先蒸/u],
    ['tatung-cajun-chicken-rice', { kind: 'waterline', waterline: { appliance_model: '大同電鍋', scale: '内锅米水位线', mark: '2刻度略下' }, source_ids: ['S-TATUNG-CAJUN-CHICKEN-RICE-1'] }, /水位线2刻度略下|铝箔托盘/u],
    ['tiger-bubur-ayam-indonesian-chicken-porridge', { kind: 'waterline', waterline: { appliance_model: 'Tiger 5.5杯电饭煲（10杯机型按来源加倍）', scale: 'porridge', mark: 'Porridge 0.5水位线' }, source_ids: ['S-R102-TIGER-BUBUR-AYAM-1'] }, /Porridge 0\.5水位线|鸡高汤2杯/u],
  ];
  for (const [id, contract, locator] of expected) {
    const recipe = byId.get(id);
    assert.ok(recipe, id);
    assert.equal(recipe.status, executableIds.has(id) ? 'executable' : 'recipe_fact_checked', id);
    assert.deepEqual(recipe.liquid_contract, contract, id);
    const source = recipe.source_refs?.find(item => item.source_id === contract.source_ids[0]);
    assert.ok(source, id);
    assert.ok(source.claim_scopes.includes('liquid'), id);
    assert.match(source.evidence_locator ?? '', locator, id);
    if (!executableIds.has(id)) assert.notEqual(recipe.status, 'executable', id);
  }
});

test('r185 keeps staged, shellfish, and separate-chicken boundaries visible', () => {
  const byId = new Map(catalog.recipes.map(item => [item.recipe_id, item]));
  assert.equal(byId.get('tatung-hainan-chicken-rice')?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId.get('tatung-paella-style-seafood-rice')?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId.get('tatung-cajun-chicken-rice')?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId.get('tiger-bubur-ayam-indonesian-chicken-porridge')?.cooker_adaptation?.status, 'source_limited');
  assert.match(byId.get('tatung-paella-style-seafood-rice')?.evidence_notes ?? '', /贝类|回锅|风/u);
  assert.match(byId.get('tatung-cajun-chicken-rice')?.evidence_notes ?? '', /3至4|铝箔|水位/u);
  assert.match(byId.get('tiger-bubur-ayam-indonesian-chicken-porridge')?.evidence_notes ?? '', /另锅|范围|高汤/u);
});
