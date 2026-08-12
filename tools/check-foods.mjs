#!/usr/bin/env node
// 食物库体检 + 关键匹配回归自测。
// 【加新食材后必跑】: node tools/check-foods.mjs
// 规则见 CLAUDE.md「营养数据红线」。本脚本不联网、不调用 API、秒回。
// 退出码非 0 = 体检不通过，禁止提交/部署。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(HTML, 'utf8');

// 抽取「精度层」(FOODS / alias / lookupFoodNutrition 等) 用真实代码自测
const a = html.indexOf('// ===== 精度层');
const b = html.indexOf('// ---- 无感记忆层');
if (a < 0 || b < 0) { console.error('❌ 找不到精度层边界标记'); process.exit(1); }
let mod;
try {
  mod = (new Function(html.slice(a, b) +
    '\nreturn {lookupFoodNutrition, FOODS, NUTRIENTS, FOOD_ALIAS};'))();
} catch (e) { console.error('❌ 精度层语法错误: ' + e.message); process.exit(1); }
const { lookupFoodNutrition, FOODS, NUTRIENTS, FOOD_ALIAS } = mod;

let errs = 0;
const KEYS = NUTRIENTS.map(n => n.key);
const ids = new Map();

// 1. 重复 id
FOODS.forEach(f => {
  if (ids.has(f.id)) { console.error(`❌ 重复 id: ${f.id} (${f.name} ↔ ${ids.get(f.id)})`); errs++; }
  ids.set(f.id, f.name);
});

// 2. 字段完整 / 数值合理
FOODS.forEach(f => {
  if (!f.name || !f.category) { console.error(`❌ ${f.id} 缺 name/category`); errs++; }
  KEYS.forEach(k => {
    const v = f[k];
    if (typeof v !== 'number' || Number.isNaN(v)) { console.error(`❌ ${f.id} ${f.name} 字段 ${k} 缺失或非数字: ${v}`); errs++; }
    else if (v < 0) { console.error(`❌ ${f.id} ${f.name} 负值 ${k}=${v}`); errs++; }
  });
  if (typeof f.kcal === 'number' && f.kcal > 902) { console.error(`❌ ${f.id} ${f.name} kcal=${f.kcal} 异常(纯油脂上限≈884)`); errs++; }
});

// 3. alias 必须指向真实存在的 id
Object.entries(FOOD_ALIAS).forEach(([k, id]) => {
  if (!ids.has(id)) { console.error(`❌ alias '${k}' → 不存在的 id '${id}'`); errs++; }
});

// 4. 匹配回归(生/熟、变体、新增) —— 改动后这些必须仍然命中预期
const HIT_CASES = [
  ['大米(生)', 'g-17'], ['糙米(熟)', 'g-2'], ['糙米(生)', 'g-18'],
  ['虾仁(鲜)', 'f-18'], ['鸡腿肉', 'm-4'], ['洋葱丁', 's-50'],
  ['玉米粒(罐装)', 's-42'], ['辣白菜', 's-52'], ['鲜香菇', 's-15'], ['油', 'v-23'],
  ['干粉丝', 'g-20'], ['冬粉', 'g-20'], ['土豆', 's-13'],
];
HIT_CASES.forEach(([name, want]) => {
  const f = lookupFoodNutrition(name);
  if (!f || f.id !== want) { console.error(`❌ 匹配回归失败: "${name}" 期望 ${want}, 实得 ${f ? f.id : '未命中'}`); errs++; }
});

// 5. 小用量香辛料可归零；油糖盐/酱料不能被当成零贡献。
['姜末', '蒜蓉', '料酒'].forEach(n => {
  const f = lookupFoodNutrition(n);
  if (!f || !f.seasoning) { console.error(`❌ 调味料未归零: "${n}" 实得 ${f ? f.id : '未命中'}`); errs++; }
});
['盐', '生抽', '白糖', '香油', '豆瓣酱'].forEach(n => {
  const f = lookupFoodNutrition(n);
  if (f && f.seasoning) { console.error(`❌ 重要调味品被错误归零: "${n}"`); errs++; }
});

console.log(`\nFOODS ${FOODS.length} 条 · alias ${Object.keys(FOOD_ALIAS).length} 条 · 营养素 ${KEYS.length} 项`);
console.log(errs ? `❌ 体检不通过: ${errs} 个错误（修掉再提交）` : '✅ 体检通过（0 错误）');
process.exit(errs ? 1 : 0);
