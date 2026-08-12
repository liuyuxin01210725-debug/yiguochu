import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildShelfCatalog } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const shelf = buildShelfCatalog(catalog);

const ids = [
  'dai-fragrant-bamboo-rice',
  'xiangxi-miao-bamboo-rice',
  'hunan-mayang-steamed-glutinous-rice',
  'zhengning-braised-rice',
  'changning-kas-dai-bamboo-rice',
  'wulong-dingpot-sticky-rice-kongfan',
  'yuping-dong-sticky-rice',
  'pingjiang-red-army-guerrilla-bamboo-rice',
  'r103-cn-zhejiang-longwan-sanjie-nuomi-fan',
];

test('r296 replaces invented-looking generic add-ins with an explicit source-only warning', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  for (const recipeId of ids) {
    const record = shelf.records.find(item => item.recipe_id === recipeId);
    assert.ok(record, recipeId);
    const method = record.research_method;
    const names = method.ingredients.map(item => item.name);
    assert.ok(names.length > 0, recipeId);
    assert.ok(names.every(name => !/竹筒饭配料|粉蒸配料|菜\/肉配料|配料（种类待来源确认）|按来源选取/u.test(name)), `${recipeId}: ${names.join('、')}`);
    assert.ok(method.assumptions.some(note => /来源未展开|不要自行添加|来源只确认|不能从菜名反推/u.test(note)), recipeId);
  }
});

test('r296 keeps every source-only card executable as a research starting point', () => {
  for (const recipeId of ids) {
    const record = shelf.records.find(item => item.recipe_id === recipeId);
    const method = record.research_method;
    assert.ok(method.ingredients.every(item => item.amount && Number.isFinite(item.amount.value) && item.amount.unit), recipeId);
    assert.ok(method.liquid?.amount || method.liquid?.research_starting_point || method.liquid?.waterline, recipeId);
    assert.ok(method.time?.total_minutes || method.time?.range, recipeId);
    assert.ok(method.steps.length >= 3, recipeId);
  }
});

test('r296 marks every unresolved ingredient label across the full 923-card library', () => {
  const unresolved = /待来源确认|按来源选取|按来源选定|未展开|具体构成待补|种类待来源确认|物种待来源确认|待核/u;
  let marked = 0;
  for (const record of shelf.records) {
    for (const item of record.research_method.ingredients) {
      if (!unresolved.test(item.name)) continue;
      marked += 1;
      assert.match(item.note || '', /来源未展开|不能从菜名反推|不要自行添加|按来源确认/u, `${record.recipe_id}: ${item.name}`);
    }
  }
  assert.ok(marked >= 20, `expected unresolved ingredient labels, got ${marked}`);
});

test('r296 keeps removed generic add-ins out of the corresponding research steps', () => {
  const generic = /竹筒饭配料|竹筒饭用米与配料|粉蒸配料|菜\/肉配料|配料（种类待来源确认）|配料（当季肉\/菜待来源确认）|蒸米配菜（当季菜待来源确认）/u;
  for (const recipeId of ids) {
    const record = shelf.records.find(item => item.recipe_id === recipeId);
    assert.ok(record, recipeId);
    const leaked = record.research_method.steps.filter(step => generic.test(step.instruction));
    assert.deepEqual(leaked, [], `${recipeId} still leaks a removed generic add-in into steps`);
  }
});
