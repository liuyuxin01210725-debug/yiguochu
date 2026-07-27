#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTwNutritionIndex, twLookup } from '../worker/src/worker.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const recipes = JSON.parse(fs.readFileSync(path.join(root, 'tools/data/recipe-library.json'), 'utf8'));
const foodsTw = JSON.parse(fs.readFileSync(path.join(root, 'tools/data/foods-tw.json'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const start = html.indexOf('// ===== 精度层');
const end = html.indexOf('// ---- 无感记忆层');
if (start < 0 || end < 0) throw new Error('frontend nutrition layer markers are missing');
const { lookupFoodNutrition } = new Function(
  `${html.slice(start, end)}\nreturn {lookupFoodNutrition};`,
)();

const library = buildTwNutritionIndex(foodsTw);
const recipeList = Array.isArray(recipes.recipes) ? recipes.recipes : [];
const coreNames = [...new Set(recipeList.flatMap(recipe => (
  Array.isArray(recipe?.core_ingredients) ? recipe.core_ingredients : []
)))].sort((a, b) => String(a).localeCompare(String(b), 'zh-CN'));
const required = new Map([
  ['土豆', { code: 'B0700201', name: '马铃薯' }],
  ['粉丝', { code: 'R4600201', name: '冬粉' }],
  ['牛奶', { code: 'L01021', name: '全脂鲜乳平均值' }],
]);
const errors = [];
const rows = coreNames.map(raw => {
  const tw = twLookup(library, raw);
  const local = lookupFoodNutrition(raw);
  if (tw && local && Number(tw.kcal) > 0 && Number(local.kcal) > 0) {
    const ratio = Number(tw.kcal) / Number(local.kcal);
    if (ratio > 3 || ratio < 1 / 3) {
      errors.push(`${raw} nutrition identity mismatch: worker ${tw.n} ${tw.code} ${tw.kcal} kcal vs frontend ${local.name} ${local.kcal} kcal`);
    }
  }
  const expected = required.get(raw);
  if (expected && (!tw || tw.code !== expected.code || tw.n !== expected.name)) {
    errors.push(`${raw} must resolve to ${expected.name} ${expected.code}, got ${tw ? `${tw.n} ${tw.code}` : 'unmatched'}`);
  }
  return { raw, tw, local };
});

for (const row of rows) {
  if (row.tw) console.log(`${row.raw} → ${row.tw.n} ${row.tw.code} ${row.tw.kcal} kcal`);
  else if (row.local) console.log(`${row.raw} → frontend ${row.local.name} ${row.local.kcal} kcal`);
  else console.log(`${row.raw} → estimated (no authoritative exact match)`);
}
for (const error of errors) console.error(`❌ ${error}`);
console.log(`${recipeList.length} recipes · ${coreNames.length} unique core ingredients`);
console.log(errors.length ? `❌ nutrition identity audit failed: ${errors.length}` : '✅ nutrition identity audit ok');
process.exit(errors.length ? 1 : 0);
