import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildShelfCatalog } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const shelf = buildShelfCatalog(catalog);

test('r306 closes the public-standard formula for Luling dingpot rice', () => {
  const record = shelf.records.find(item => item.recipe_id === 'luling-dingpot-rice');
  assert.ok(record);
  assert.deepEqual(record.core_ingredients, ['井岗软粘5S大米', '腊肉', '香肠', '本地萝卜干']);
  assert.equal(record.fixed_batch.servings, 4);
  assert.deepEqual(record.liquid_contract, {
    kind: 'added_liquid',
    amount: { value: 400, unit: 'g' },
    source_ids: ['S-JX-LULING-DINGPOT-FORMULA-1'],
  });
  assert.ok(record.fixed_batch.ingredients.some(item => item.name === '井岗软粘5S大米' && item.amount.value === 600));
  assert.ok(record.cooking_sequence.length >= 4);
  assert.match(record.cooking_sequence[0].instruction, /浸泡20分钟/);
  assert.match(record.cooking_sequence.at(-1).instruction, /焖10分钟|文火/);
  const source = record.source_refs.find(item => item.source_id === 'S-JX-LULING-DINGPOT-FORMULA-1');
  assert.equal(source.access_status, 'opened');
  assert.deepEqual(source.claim_scopes, ['identity', 'ingredients', 'quantity', 'liquid', 'process', 'appliance']);
  assert.equal(record.research_method.status, 'source_partial_with_draft');
});

test('r306 adds the opened public-government process for Tacheng air-dried-meat pilaf', () => {
  const record = shelf.records.find(item => item.recipe_id === 'tacheng-air-dried-meat-pilaf');
  assert.ok(record);
  assert.ok(record.cooking_sequence.length >= 4);
  assert.match(record.cooking_sequence[0].instruction, /羊肉|切块|煸炒/);
  assert.match(record.cooking_sequence[1].instruction, /胡萝卜|洋葱/);
  assert.match(record.cooking_sequence[2].instruction, /泡好|长粒米|羊油|植物油/);
  assert.match(record.cooking_sequence[3].instruction, /焖煮|葡萄干/);
  assert.equal(record.research_method.status, 'source_partial_with_draft');
});

test('r306 exposes the official Nowruz ingredient categories without inventing a formula', () => {
  const record = shelf.records.find(item => item.recipe_id === 'kashgar-nowruz-rice');
  assert.ok(record);
  assert.deepEqual(record.core_ingredients, [
    '七种谷物（小麦/大麦/玉米/黄米/高粱/豌豆等）',
    '七种蔬菜（萝卜/胡萝卜/番茄/洋葱等）',
    '七种畜禽肉',
    '干果',
  ]);
  assert.equal(record.fixed_batch, null);
  assert.equal(record.liquid_contract, null);
  assert.equal(record.time_contract, null);
  assert.match(record.evidence_notes, /没有具体必用食材、比例、液体、器具、时间/u);
});

test('r306 records Lisu hand-grab rice as a staged meal rather than a fake one-pot recipe', () => {
  const record = shelf.records.find(item => item.recipe_id === 'nujiang-lisu-hand-grab-rice');
  assert.ok(record);
  assert.deepEqual(record.core_ingredients, ['苞谷面', '大米', '肉类（家禽或野兽肉）', '核桃粉', '辣椒', '蒜粉', '食盐']);
  assert.deepEqual(record.traditional_vessels, ['竹编大簸箕', '火塘/铁三脚架', '锅']);
  assert.ok(record.cooking_sequence.length >= 4);
  assert.match(record.cooking_sequence[0].instruction, /苞谷面|大米/);
  assert.match(record.cooking_sequence[1].instruction, /其他锅|肉类/);
  assert.match(record.cooking_sequence[2].instruction, /簸箕|熟肉|核桃粉/);
  assert.match(record.cooking_sequence[3].instruction, /搅拌均匀|手抓/);
  assert.equal(record.fixed_batch, null);
  assert.equal(record.liquid_contract, null);
  const source = record.source_refs.find(item => item.source_id === 'S-YN-LISU-HAND-GRAB-CHINAGEO-1');
  assert.ok(source);
  assert.deepEqual(source.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.equal(record.cooker_adaptation.status, 'not_adapted');
});

test('r306 turns the Kaiping crucian-carp baked rice identity page into a source-limited process card', () => {
  const record = shelf.records.find(item => item.recipe_id === 'r97-kaiping-crucian-carp-baked-rice');
  assert.ok(record);
  assert.deepEqual(record.core_ingredients, ['米饭', '鲫鱼']);
  assert.ok(record.cooking_sequence.length >= 2);
  assert.match(record.cooking_sequence[0].instruction, /腌制|鲫鱼/);
  assert.match(record.cooking_sequence[1].instruction, /米饭|盖/);
  const source = record.source_refs.find(item => item.source_id === 'S-R97-GD-KAIPING-CRUCIAN-CARP-RICE-1');
  assert.deepEqual(source.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.equal(record.fixed_batch, null);
  assert.equal(record.liquid_contract, null);
  assert.equal(record.time_contract, null);
});
