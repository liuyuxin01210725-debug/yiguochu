import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');

test('product principles keep personalization honest and architecture focused', () => {
  const principlesPath = path.join(ROOT, 'docs', 'PRODUCT_PRINCIPLES.md');
  assert.equal(fs.existsSync(principlesPath), true, 'docs/PRODUCT_PRINCIPLES.md must exist');
  const text = read('docs/PRODUCT_PRINCIPLES.md');
  for (const principle of [
    '个性化不是迎合，而是推荐用户真正需要和适合的方案。',
    '尊重显性约束，优化隐性需求。',
    '长期目标可以宏大，但当前架构只服务当前目标。',
    '预期基础模型持续进化，不提前建设复杂推荐平台、用户画像或多 Agent。',
    '只积累真实需求、决策理由和真实结果，不用点击行为冒充做饭结果。',
  ]) assert.match(text, new RegExp(principle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('start.command starts both local services and opens the localhost page', () => {
  const script = read('start.command');
  assert.match(script, /python3\s+ai_proxy\.py/);
  assert.match(script, /python3\s+-m\s+http\.server\s+8081/);
  assert.match(script, /open\s+["']http:\/\/localhost:8081[\/]?["']/);
  assert.doesNotMatch(script, /open\s+["']index\.html["']/);
});

test('deployment documentation uses the canonical build script without manual copy steps', () => {
  const docs = read('部署说明.md');
  assert.match(docs, /node tools\/build-dist\.mjs\s+--out-dir\s+dist/);
  assert.doesNotMatch(docs, /(?:^|\n)\s*(?:rm -rf dist|mkdir -p dist|cp .*dist\/|SWVER=.*python3)/);
});

test('frontend result keeps only whole-pot serving controls, not per-ingredient editing', () => {
  const html = read('index.html');
  assert.match(html, /seg\('servings'/);
  assert.doesNotMatch(html, /data-bump=/);
  assert.doesNotMatch(html, /data-delta=/);
  assert.doesNotMatch(html, /data-del=/);
  assert.doesNotMatch(html, /data-act="toggle-edit"/);
});

test('generation animation names the actual three checks', () => {
  const html = read('index.html');
  for (const label of ['选基础菜', '检查份量时间', '检查步骤安全']) assert.match(html, new RegExp(label));
  assert.doesNotMatch(html, /正在看是不是 40 分钟内能做|第一版有点麻烦，换一版更顺手的/);
});
