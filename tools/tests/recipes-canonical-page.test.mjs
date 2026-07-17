import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../../recipes.html', import.meta.url), 'utf8');

test('canonical recipe page loads the approved recipe library by query id', () => {
  assert.match(html, /URLSearchParams/);
  assert.match(html, /recipe-library\.json/);
  assert.match(html, /recipe\.id\s*===\s*recipeId/);
  assert.match(html, /recipe\.status\s*===\s*['"]approved['"]/);
});

test('canonical recipe page renders the required provenance fields safely', () => {
  assert.match(html, /origin_candidate_id/);
  assert.match(html, /一锅出项目/);
  assert.match(html, /textContent/);
  assert.match(html, /未找到可公开的菜谱/);
});
