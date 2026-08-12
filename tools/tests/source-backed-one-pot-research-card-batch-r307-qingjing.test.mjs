import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildShelfCatalog } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const shelf = buildShelfCatalog(catalog);

test('r307 turns Maoshan Qingjing rice identity into a source-limited method card', () => {
  const record = shelf.records.find(item => item.recipe_id === 'cn-jiangsu-jintan-maoshan-qingjing-rice-technique');
  assert.ok(record);
  assert.deepEqual(record.core_ingredients, ['白粳米', '南烛叶/枝汁']);
  assert.deepEqual(record.traditional_vessels, ['石臼/榨汁器', '蒸锅']);
  assert.ok(record.cooking_sequence.length >= 3);
  assert.match(record.cooking_sequence[0].instruction, /南烛|捣|烧开|放凉/);
  assert.match(record.cooking_sequence[1].instruction, /白粳米|浸泡|墨绿色/);
  assert.match(record.cooking_sequence[2].instruction, /蒸锅|蒸熟/);
  assert.equal(record.fixed_batch, null);
  assert.equal(record.liquid_contract, null);
  assert.equal(record.time_contract, null);
  assert.equal(record.research_method.status, 'source_partial_with_draft');
  const source = record.source_refs.find(item => item.source_id === 'S-R158-CN-JINTAN-QINGJING-SECONDARY-1');
  assert.ok(source);
  assert.equal(source.access_status, 'search_extract_opened');
  assert.deepEqual(source.claim_scopes, ['ingredients', 'process', 'appliance']);
});

