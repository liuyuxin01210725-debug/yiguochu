import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('source execution cook mode is shipped as a static route for all source cards', () => {
  const pagePath = path.join(ROOT, 'cook.html');
  assert.equal(fs.existsSync(pagePath), true, 'cook.html must exist');
  const page = fs.readFileSync(pagePath, 'utf8');
  assert.match(page, /source-backed-execution-library\.v1\.json/u);
  assert.match(page, /data-action[\s\S]{0,80}toggle-step|toggle-step[\s\S]{0,80}data-action/u);
  assert.match(page, /localStorage/u);
  assert.match(page, /来源事实|研究起步/u);
  assert.match(fs.readFileSync(path.join(ROOT, 'tools/build-dist.mjs'), 'utf8'), /'cook\.html'/u);
  assert.match(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), /cook\/?\?id=/u);
  assert.match(fs.readFileSync(path.join(ROOT, 'tools/build-dist.mjs'), 'utf8'), /path\.join\(outputDir, 'cook', 'index\.html'\)/u);
  assert.match(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'), /'\.\/cook\.html'/u);
});

test('every source execution card has a cook-mode addressable id and ordered steps', () => {
  const library = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/data/source-backed-execution-library.v1.json'), 'utf8'));
  assert.equal(library.entries.length, 923);
  for (const entry of library.entries) {
    assert.match(entry.recipe_id, /^[a-z0-9][a-z0-9-]+$/u);
    assert.ok(Array.isArray(entry.execution_card?.ingredients) && entry.execution_card.ingredients.length > 0, entry.recipe_id);
    assert.ok(Array.isArray(entry.execution_card?.steps) && entry.execution_card.steps.length >= 3, entry.recipe_id);
  }
});
