import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { buildResearchMethod } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('r301 identity cards retain official ingredient and vessel clues without inventing canonical quantities', () => {
  const hainan = catalog.recipes.find(item => item.recipe_id === 'cn-hainan-sanya-miao-three-color-rice');
  const lingchuan = catalog.recipes.find(item => item.recipe_id === 'shanxi-lingchuan-firewood-rice');
  assert.ok(hainan && lingchuan);

  assert.ok(hainan.core_ingredients.includes('山兰糯米'));
  assert.ok(hainan.core_ingredients.includes('红蓝藤叶'));
  assert.ok(hainan.traditional_vessels.includes('独木蒸笼'));
  assert.ok(hainan.source_refs.some(source => source.source_id === 'S-CN-HI-MIAO-THREE-COLOR-GZCPP-1'));

  const hainanMethod = buildResearchMethod(hainan);
  assert.ok(hainanMethod.ingredients.some(item => item.name === '山兰糯米' && item.amount));
  assert.ok(hainanMethod.source_process_hints.some(hint => /浸泡|蒸制|独木蒸笼/iu.test(hint.text)));
  assert.ok(hainanMethod.steps.length >= 4);

  assert.ok(lingchuan.core_ingredients.includes('蔬菜副食（种类多样）'));
  assert.ok(lingchuan.source_refs.some(source => source.source_id === 'S-SX-LINGCHUAN-FIREWOOD-RICE-2'));
  const lingchuanMethod = buildResearchMethod(lingchuan);
  assert.ok(lingchuanMethod.ingredients.some(item => /当季蔬菜或副食（按来源选取）/iu.test(item.name) && item.amount));
  assert.ok(lingchuanMethod.steps.some(step => step.provenance === 'source' && /一锅出|柴火大米|蔬菜副食/iu.test(step.instruction)));
  assert.ok(lingchuanMethod.steps.length >= 4);
});
