import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { buildRiceMealCollectionArtifacts } from '../lib/rice-meal-collection-renderer.mjs';

const collection = JSON.parse(await fs.readFile(
  new URL('../data/rice-meal-collection.v1.json', import.meta.url),
  'utf8',
));

test('rice meal collection review artifacts expose candidate decisions and explicit regional gaps in stable order', () => {
  const artifacts = new Map(buildRiceMealCollectionArtifacts(collection));
  const markdown = artifacts.get('docs/rice-meal-collection.md');
  const csv = artifacts.get('docs/rice-meal-collection.csv');

  assert.equal(artifacts.size, 2);
  assert.ok(markdown.includes('# 全国咸味菜饭/焖饭：菜单与食材构成审阅表'));
  assert.ok(markdown.includes('## 上海（CN-SH）'));
  assert.ok(markdown.includes('### household-reviewed-rice'));
  assert.ok(markdown.includes('鸡腿土豆焖饭'));
  assert.ok(markdown.includes('| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |'));
  assert.ok(markdown.includes('| 鸡腿土豆焖饭 | 米、鸡腿、土豆 | B | raw-rice | 项目家庭标准闭盖烹调 | identity、quantity、liquid、appliance、safety、nutrition | complete | 无 | runtime_ready |'));
  assert.ok(markdown.includes('## 海南（CN-HI）'));
  assert.ok(markdown.includes('显式空白地域：定安菜包饭为熟饭翻炒包裹，排除原米菜饭候选。'));
  assert.ok(markdown.indexOf('## 上海（CN-SH）') < markdown.indexOf('## 江苏（CN-JS）'));

  const [header, firstRow] = csv.split('\n');
  assert.equal(header, 'candidate_id,name,regions,family,core_ingredients,nutrition_grade,rice_state,traditional_appliance_and_steps,evidence_status,quantity_liquid_completeness,blockers,runtime_status');
  assert.equal(firstRow, 'household-chicken-leg-potato-rice,鸡腿土豆焖饭,上海 (CN-SH),household-reviewed-rice,米 / 鸡腿 / 土豆,B,raw-rice,项目家庭标准闭盖烹调,identity / quantity / liquid / appliance / safety / nutrition,complete,无,runtime_ready');
  assert.equal(csv.trimEnd().split('\n').length - 1, collection.candidates.length);
});
