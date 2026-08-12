#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function option(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const root = fileURLToPath(new URL('..', import.meta.url));
const library = JSON.parse(fs.readFileSync(path.join(root, 'tools/data/recipe-library.json'), 'utf8'));
const requestedIds = new Set(option('--only').split(',').map(value => value.trim()).filter(Boolean));
const recipes = (Array.isArray(library.recipes) ? library.recipes : [])
  .filter(recipe => requestedIds.size === 0 || requestedIds.has(recipe.id));
const baseUrl = option('--base-url', 'http://localhost:8765').replace(/\/$/, '');
const purpose = option('--purpose', 'normal');
const concurrency = Math.max(1, Math.min(6, Number.parseInt(option('--concurrency', '2'), 10) || 2));
const reportPath = option('--report');
const dryRun = process.argv.includes('--dry-run');

if (requestedIds.size && recipes.length !== requestedIds.size) {
  const found = new Set(recipes.map(recipe => recipe.id));
  const missing = [...requestedIds].filter(id => !found.has(id));
  console.error(`Unknown recipe ids: ${missing.join(', ')}`);
  process.exit(2);
}
if (dryRun) {
  console.log(`${recipes.length} recipes queued · 0 DeepSeek calls`);
  process.exit(0);
}

async function scan(recipe) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 65000);
  let response;
  let body = {};
  try {
    response = await fetch(`${baseUrl}/generate-meal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meal_name: '这次的一锅主餐',
        targets: { kcal: 1400, p: 60, fb: 20 },
        constraints: {
          purpose,
          servings: 2,
          pantry: recipe.core_ingredients || [],
          dislikes: [],
          selected_base_recipe_id: recipe.id,
          recent_dishes: [],
          recent_base_recipes: [],
          recent_families: [],
        },
      }),
      signal: controller.signal,
      cache: 'no-store',
    });
    body = await response.json().catch(() => ({}));
  } catch (error) {
    return {
      recipe_id: recipe.id,
      ok: false,
      status: 0,
      code: error?.name === 'AbortError' ? 'timeout' : 'network_error',
      elapsed_ms: Date.now() - started,
    };
  } finally {
    clearTimeout(timer);
  }
  const exactBase = body?.base_recipe_id === recipe.id;
  const flags = Array.isArray(body?.validation_flags) ? body.validation_flags : [];
  const flagTypes = Array.isArray(body?.validation_flag_types) ? body.validation_flag_types : [];
  return {
    recipe_id: recipe.id,
    ok: response.ok && exactBase && flags.length === 0,
    status: response.status,
    code: body?.code || '',
    returned_base_recipe_id: body?.base_recipe_id || '',
    validation_flags: flags,
    validation_flag_types: flagTypes,
    elapsed_ms: Date.now() - started,
  };
}

const results = new Array(recipes.length);
let cursor = 0;
async function worker() {
  while (cursor < recipes.length) {
    const index = cursor++;
    const result = await scan(recipes[index]);
    results[index] = result;
    console.log(`${result.ok ? '✅' : '❌'} ${result.recipe_id} · ${result.status || result.code} · ${result.elapsed_ms}ms`);
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, recipes.length) }, () => worker()));

const failed = results.filter(result => !result.ok);
const report = {
  schema_version: 1,
  scanned_at: new Date().toISOString(),
  base_url: baseUrl,
  purpose,
  recipe_count: recipes.length,
  passed: results.length - failed.length,
  failed: failed.length,
  results,
};
if (reportPath) fs.writeFileSync(path.resolve(root, reportPath), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${report.recipe_count} live recipes passed · ${report.failed} failed · no automatic retries`);
process.exit(failed.length ? 1 : 0);
