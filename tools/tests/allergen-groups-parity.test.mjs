import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { matchAllergy } from '../../worker/src/worker.js';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

// 从 JS 源文本提取 ALLERGEN_GROUPS 对象字面量并求值(键为无引号中文字面量, JSON 无法直接解析)。
function extractJsAllergenGroups(source, label) {
  const match = source.match(/const ALLERGEN_GROUPS = (\{[\s\S]*?\});/);
  assert.ok(match, `${label} 缺少 ALLERGEN_GROUPS 定义`);
  return Function(`"use strict"; return (${match[1]});`)();
}

// Python 侧直接 import ai_proxy 取同一张表, 与 JS 文本提取结果深比较。
function extractPythonAllergenGroups() {
  const result = spawnSync('python3', [
    '-c',
    'import json, ai_proxy; print(json.dumps(ai_proxy.ALLERGEN_GROUPS, ensure_ascii=False))',
  ], { cwd: repoRoot, encoding: 'utf8', timeout: 15000 });
  assert.equal(result.status, 0, `ai_proxy.ALLERGEN_GROUPS 提取失败: ${result.stderr}`);
  return JSON.parse(result.stdout.trim());
}

function runPythonMatchAllergy(cases) {
  const harness = [
    'import json, sys, ai_proxy',
    'cases = json.load(sys.stdin)',
    'out = [ai_proxy.match_allergy(d, i, a) for d, i, a in cases]',
    'json.dump(out, sys.stdout)',
  ].join('\n');
  const result = spawnSync('python3', ['-c', harness], {
    cwd: repoRoot,
    encoding: 'utf8',
    input: JSON.stringify(cases),
    timeout: 15000,
  });
  assert.equal(result.status, 0, `ai_proxy.match_allergy 调用失败: ${result.stderr}`);
  return JSON.parse(result.stdout);
}

test('ALLERGEN_GROUPS is identical across index.html, worker, and ai_proxy', () => {
  const frontend = extractJsAllergenGroups(
    fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8'),
    'index.html',
  );
  const worker = extractJsAllergenGroups(
    fs.readFileSync(new URL('../../worker/src/worker.js', import.meta.url), 'utf8'),
    'worker/src/worker.js',
  );
  const proxy = extractPythonAllergenGroups();
  assert.deepEqual(worker, frontend);
  assert.deepEqual(proxy, frontend);
});

test('matchAllergy and ai_proxy.match_allergy agree on category cases', () => {
  const cases = [
    // [dislikeTerm, ingredientName, aliases] — 类别名按组扩展
    ['海鲜', '虾仁', {}],
    ['海鲜', '带鱼', {}],
    ['海鲜', '蛤蜊', {}],
    ['鸡肉', '鸡腿肉', {}],
    ['鸡肉', '鸡胸肉', {}],
    ['蛋', '鸡蛋', {}],
    ['奶', '酸奶', {}],
    ['奶', '椰奶', {}],
    ['花生', '花生酱', {}],
    ['坚果', '核桃', {}],
    // 不误伤: 鸡肉↛鸡蛋, 组成员虾仁↛鱼/鲈鱼
    ['鸡肉', '鸡蛋', {}],
    ['虾仁', '鱼', {}],
    ['虾仁', '鲈鱼', {}],
    // 归一化与 alias
    [' 海鲜（不吃） ', '虾仁', {}],
    ['鸡腿肉过敏', '鸡肉', { 鸡腿肉: '鸡肉' }],
    // 空串与无关项
    ['', '虾仁', {}],
    ['海鲜', '', {}],
    ['黄瓜', '虾仁', {}],
    // alias 不许收窄保护面: 归一到 老豆腐/鲜香菇 后, 原词形态仍要命中 豆腐干/干香菇
    ['豆腐', '豆腐干', { 豆腐: '老豆腐' }],
    ['豆腐', '冻豆腐', { 豆腐: '老豆腐' }],
    ['豆腐', '老豆腐', { 豆腐: '老豆腐' }],
    ['豆腐', '鸡蛋干', { 豆腐: '老豆腐' }],
    ['香菇', '干香菇', { 香菇: '鲜香菇' }],
    ['香菇', '香菇酱', { 香菇: '鲜香菇' }],
  ];
  const expected = cases.map(([d, i, aliases]) => matchAllergy(d, i, aliases));
  const actual = runPythonMatchAllergy(cases);
  assert.deepEqual(actual, expected);
  // 锁定关键语义预期, 防两端同错
  assert.deepEqual(expected, [
    true, true, true,
    true, true,
    true, true, false, true, true,
    false, false, false,
    true, true,
    false, false, false,
    true, true, true, false, true, true,
  ]);
});
