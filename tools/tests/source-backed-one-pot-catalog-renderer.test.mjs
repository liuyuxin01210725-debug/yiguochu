import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSourceBackedOnePotArtifacts,
  csvEscape,
  promotionBlockerScopes,
  recipeRegionLabel,
  requiredPromotionScopes,
  supportedClaimScopes,
} from '../lib/source-backed-one-pot-catalog-renderer.mjs';
import {
  findStaleArtifactPaths,
  validateSourceBackedOnePotCatalogInputs,
} from '../build-source-backed-one-pot-catalog.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const toolsDirectory = path.dirname(directory);
const rootDirectory = path.dirname(toolsDirectory);
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(rootDirectory, relativePath), 'utf8'));
const catalog = () => readJson('tools/data/source-backed-one-pot-recipes.v1.json');
const migration = () => readJson('tools/data/source-backed-catalog-migration.v1.json');
const legacyVariants = () => readJson('tools/data/rice-meal-catalog.v1.json')
  .families.flatMap(family => family.variants);

test('renders sorted recipes with visible evidence fields and direct source links', () => {
  const artifacts = buildSourceBackedOnePotArtifacts(catalog(), migration());
  const markdown = artifacts.get('docs/source-backed-one-pot-recipes.md');

  assert.match(markdown, /## 厂商电饭煲食谱/u);
  assert.match(markdown, /上海咸肉菜饭/u);
  assert.match(markdown, /别名/u);
  assert.match(markdown, /地区/u);
  assert.match(markdown, /菜系/u);
  assert.match(markdown, /状态/u);
  assert.match(markdown, /核心食材/u);
  assert.match(markdown, /已支持证据范围/u);
  assert.match(markdown, /当前晋升阻塞/u);
  assert.match(markdown, /\[大雪节气村民做咸肉菜饭，青菜甜糯咸肉清香\]\(https:\/\//u);
  assert.ok(markdown.indexOf('咖喱鸡肉饭') < markdown.indexOf('牛肉什锦饭'));
});

test('labels empty manufacturer regions explicitly and keeps research rows non-public', () => {
  const artifacts = buildSourceBackedOnePotArtifacts(catalog(), migration());
  const markdown = artifacts.get('docs/source-backed-one-pot-recipes.md');

  assert.equal(recipeRegionLabel({ region_codes: [], cuisine_family: 'manufacturer-rice-cooker-recipes' }), '非地域·厂商食谱');
  assert.match(markdown, /非地域·厂商食谱/u);
  assert.match(markdown, /研究记录（非公开可执行）/u);
  assert.doesNotMatch(markdown, /recipe_fact_checked[\s\S]*公开可执行/u);
});

test('quotes CSV commas, quotes, and line breaks while retaining raw URLs and semicolon scopes', () => {
  const fixture = {
    schema_version: 1,
    catalog_version: 'test',
    scope: 'savory-rice-main-meal',
    reviewed_regions: ['CN-T'],
    regional_blanks: [],
    recipes: [{
      recipe_id: 'quoted-recipe',
      canonical_name: '逗号, "引号"\n换行',
      aliases: ['别名,甲'],
      region_codes: ['CN-T'],
      cuisine_family: 'test-family',
      status: 'discovered',
      core_ingredients: ['米', '菜'],
      source_refs: [{
        source_id: 'quoted-source',
        title: '来源, "题"\n名',
        url: 'https://example.test/a,b',
        claim_scopes: ['identity', 'ingredients'],
      }],
    }],
  };
  const csv = buildSourceBackedOnePotArtifacts(fixture, { items: [] })
    .get('docs/source-backed-one-pot-recipes.csv');

  assert.match(csv, /"逗号, ""引号""\n换行"/u);
  assert.match(csv, /"来源, ""题""\n名"/u);
  assert.match(csv, /https:\/\/example\.test\/a,b/u);
  assert.match(csv, /identity;ingredients/u);
  assert.equal(csvEscape('plain'), 'plain');
});

test('derives status-aware promotion blockers, regional blanks, and excluded combinations', () => {
  const fixture = catalog();
  fixture.regional_blanks = [{ region_code: 'CN-TEST', reason: 'No qualifying source', searched_at: '2026-08-02' }];
  const artifacts = buildSourceBackedOnePotArtifacts(fixture, migration());
  const gaps = artifacts.get('docs/source-backed-one-pot-recipe-gaps.md');

  for (const scope of ['identity', 'ingredients', 'quantity', 'liquid', 'process', 'appliance', 'time', 'safety']) {
    assert.match(gaps, new RegExp(`## ${scope === 'identity' ? '1' : ['identity', 'ingredients', 'quantity', 'liquid', 'process', 'appliance', 'time', 'safety'].indexOf(scope) + 1}\\. Missing ${scope}`, 'u'));
  }
  assert.match(gaps, /## 9\. Regional blanks/u);
  assert.match(gaps, /CN-TEST/u);
  assert.match(gaps, /## 10\. Excluded project-original combinations/u);
  assert.match(gaps, /西兰花牛肉焖饭/u);
  assert.match(gaps, /当前状态的晋升阻塞/u);
});

test('keeps discovered recipes focused on identity instead of all generic claim gaps', () => {
  const discovered = {
    status: 'discovered',
    source_refs: [],
  };

  assert.deepEqual(supportedClaimScopes(discovered), []);
  assert.deepEqual(requiredPromotionScopes(discovered), ['identity']);
  assert.deepEqual(promotionBlockerScopes(discovered), ['identity']);
});

test('uses ingredients and process as the identity-verified fact-check requirements', () => {
  const verified = {
    status: 'identity_verified',
    source_refs: [{ claim_scopes: ['identity', 'ingredients'] }],
  };

  assert.deepEqual(requiredPromotionScopes(verified), ['ingredients', 'process']);
  assert.deepEqual(promotionBlockerScopes(verified), ['process']);
});

test('adds conditional appliance and safety blockers to a high-risk fact-checked recipe', () => {
  const checked = {
    status: 'recipe_fact_checked',
    core_ingredients: ['鸡肉', '米'],
    cooker_adaptation: { appliance: 'rice cooker' },
    source_refs: [{ claim_scopes: ['identity', 'ingredients', 'quantity', 'liquid', 'process'] }],
  };

  assert.deepEqual(promotionBlockerScopes(checked), ['appliance', 'time', 'safety']);
});

test('has no evidence-scope promotion blockers for a public candidate with its required support', () => {
  const publicRecipe = {
    status: 'preview_ready',
    core_ingredients: ['米', '蔬菜'],
    source_refs: [{ claim_scopes: ['identity', 'ingredients', 'quantity', 'liquid', 'process', 'time'] }],
  };

  assert.deepEqual(promotionBlockerScopes(publicRecipe), []);
});

test('reports only byte-different or missing generated paths as stale', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'source-backed-catalog-'));
  try {
    const artifacts = new Map([
      ['docs/a.txt', 'exact'],
      ['docs/b.txt', 'expected'],
      ['docs/c.txt', 'missing'],
    ]);
    fs.mkdirSync(path.join(temporaryRoot, 'docs'));
    fs.writeFileSync(path.join(temporaryRoot, 'docs/a.txt'), 'exact', 'utf8');
    fs.writeFileSync(path.join(temporaryRoot, 'docs/b.txt'), 'stale', 'utf8');

    assert.deepEqual(findStaleArtifactPaths(artifacts, temporaryRoot), ['docs/b.txt', 'docs/c.txt']);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('passes the catalog as the third migration-validator argument', () => {
  const errors = validateSourceBackedOnePotCatalogInputs(catalog(), migration(), legacyVariants());
  assert.deepEqual(errors, []);
});
