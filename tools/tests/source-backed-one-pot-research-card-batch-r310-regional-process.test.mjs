import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildShelfCatalog } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const shelf = buildShelfCatalog(catalog);

function get(id) {
  const record = shelf.records.find(item => item.recipe_id === id);
  assert.ok(record, `missing ${id}`);
  return record;
}

test('Yecheng Jiucun pilaf surfaces the official brand/process boundary', () => {
  const record = get('yecheng-jiucun-pilaf');
  assert.equal(record.research_method.status, 'source_partial_with_draft');
  assert.ok(record.research_method.steps.some(step => /培训|焖制/u.test(step.instruction) && step.provenance === 'source'));
  assert.equal(record.research_method.servings.provenance, 'estimated');
  assert.equal(record.research_method.liquid.provenance, 'estimated');
});

test('Yining caipulao and Asimantu preserve the topping/filled-bun branches', () => {
  const caipulao = get('yining-caipulao-pilaf');
  const asimantu = get('yining-asimantu-pilaf');
  assert.equal(caipulao.research_method.status, 'source_partial_with_draft');
  assert.ok(caipulao.research_method.steps.some(step => /白菜|番茄|辣椒|粉条/u.test(step.instruction) && step.provenance === 'source'));
  assert.equal(asimantu.research_method.status, 'source_partial_with_draft');
  assert.ok(asimantu.research_method.steps.some(step => /五、六|5、6|薄皮.*肉馅.*包子/u.test(step.instruction) && step.provenance === 'source'));
  assert.ok(asimantu.research_method.source_quantity_hints.length > 0);
});

test('Buyi flower rice and northern coarse-grain rice expose source process without fake contracts', () => {
  const buyi = get('guizhou-buyi-flower-glutinous-rice');
  const weihai = get('weihai-baomi-chazi-dry-rice');
  const kuancheng = get('kuancheng-manchu-sorghum-rice');
  for (const record of [buyi, weihai, kuancheng]) {
    assert.equal(record.research_method.status, 'source_partial_with_draft');
    assert.ok(record.research_method.steps.some(step => step.provenance === 'source'));
    assert.equal(record.research_method.liquid.provenance, 'estimated');
    assert.equal(record.research_method.time.provenance, 'estimated');
  }
  assert.match(buyi.research_method.steps.find(step => step.provenance === 'source').instruction, /染成五颜六色|花糯米饭/u);
  assert.match(weihai.research_method.steps.find(step => step.provenance === 'source').instruction, /玉米.*碴子|苞米碴子|干饭/u);
  assert.match(kuancheng.research_method.steps.find(step => step.provenance === 'source').instruction, /高粱|捞干饭/u);
});
