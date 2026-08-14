import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const RECIPES_PAGE = fs.readFileSync(path.join(ROOT, 'runtime-recipes.html'), 'utf8');
const COOK_PAGE = fs.readFileSync(path.join(ROOT, 'runtime-cook.html'), 'utf8');

const CATALOG = {
  runtime_catalog_version: 'runtime-test',
  entries: [
    {
      recipe_id: 'production-dish',
      canonical_name: 'Production Dish',
      planner_runtime_eligible: true,
      production_approved: true,
      source_summary: { canonical_name: 'Production Dish' },
    },
    {
      recipe_id: 'preview-dish',
      canonical_name: 'Preview Dish',
      planner_runtime_eligible: true,
      production_approved: false,
      source_summary: { canonical_name: 'Preview Dish' },
    },
    {
      recipe_id: 'unclassified-dish',
      canonical_name: 'Unclassified Dish',
      planner_runtime_eligible: true,
      source_summary: { canonical_name: 'Unclassified Dish' },
    },
  ],
};

function extractScript(page) {
  const match = page.match(/<script>([\s\S]*?)<\/script>/u);
  assert.ok(match, 'runtime page must contain an inline script');
  return match[1];
}

async function render(page, search) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { id, textContent: '', innerHTML: '' });
    return elements.get(id);
  };
  vm.runInNewContext(extractScript(page), {
    URLSearchParams,
    location: { search, reload() {} },
    document: { getElementById: element },
    fetch: async () => ({ ok: true, json: async () => structuredClone(CATALOG) }),
    console,
  });
  await new Promise(resolve => setImmediate(resolve));
  return {
    meta: element('meta').textContent,
    content: element('content').innerHTML,
  };
}

test('runtime recipes page keeps production and preview entries in separate explicit views', async () => {
  const production = await render(RECIPES_PAGE, '?mode=production');
  assert.match(production.meta, /生产/u);
  assert.match(production.content, /Production Dish/u);
  assert.doesNotMatch(production.content, /Preview Dish|Unclassified Dish/u);

  const preview = await render(RECIPES_PAGE, '?mode=preview');
  assert.match(preview.meta, /预览/u);
  assert.match(preview.content, /尚未 Production Approved/u);
  assert.match(preview.content, /Preview Dish/u);
  assert.doesNotMatch(preview.content, /Production Dish|Unclassified Dish/u);
});

test('runtime cook page applies the same production/preview filter and stays on runtime routes when empty', async () => {
  const production = await render(COOK_PAGE, '?mode=production&id=production-dish');
  assert.match(production.content, /Production Dish/u);
  assert.doesNotMatch(production.content, /尚未|没有正式执行合同/u);

  const preview = await render(COOK_PAGE, '?mode=preview&id=production-dish');
  assert.match(preview.content, /没有预览执行合同/u);
  assert.doesNotMatch(preview.content, /Production Dish/u);

  const previewEntry = await render(COOK_PAGE, '?mode=preview&id=preview-dish');
  assert.match(previewEntry.content, /尚未 Production Approved/u);

  for (const page of [RECIPES_PAGE, COOK_PAGE]) {
    assert.doesNotMatch(page, /href=["']\/source-recipes\//u, 'runtime empty states must not link to research pages');
  }
});
