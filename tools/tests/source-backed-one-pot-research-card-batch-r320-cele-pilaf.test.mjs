import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildResearchMethod } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('r320 closes the directly opened Cele government pilaf process without inventing contracts', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  const recipe = catalog.recipes.find(item => item.recipe_id === 'cn-xj-qiele-pilaf');
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.fixed_batch, null);
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.deepEqual(recipe.cooking_sequence.map(step => step.instruction), [
    '将羊肉切成4厘米方块并洗净；胡萝卜切条，皮芽子切块。',
    '锅烧热放清油，油温七成热时把羊肉炒至金黄色；加入胡萝卜和皮芽子炒干，加水、料酒、精盐、胡椒、花椒和姜皮，烧开后转小火煮1.5小时。',
    '烧旺火下米，边开边下；下完米时让汤水刚能盖住米面，再撒葡萄干和杏干并盖锅。',
    '压大火转微火，保持锅冒气，焖30分钟后上桌。',
  ]);
  const source = recipe.source_refs.find(item => item.source_id === 'S-R108-CN-XJ-CELE-PILAF-1');
  assert.ok(source);
  assert.equal(source.access_status, 'opened');
  assert.ok(source.claim_scopes.includes('process'));
  assert.match(source.evidence_locator, /4厘米|1\.5小时|汤水刚能盖住|焖30分钟/u);
});

test('r320 keeps the official process ahead of estimated research supplements', () => {
  const recipe = catalog.recipes.find(item => item.recipe_id === 'cn-xj-qiele-pilaf');
  const method = buildResearchMethod(recipe);
  assert.equal(method.steps.filter(step => step.provenance === 'source').length, 4);
  assert.ok(method.steps.length >= 4);
  assert.equal(method.liquid.provenance, 'estimated');
  assert.equal(method.time.provenance, 'estimated');
  assert.ok(method.assumptions.some(note => /米水|份数|来源|水位/iu.test(note)));
});
