import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');

function executable(file, body) {
  fs.writeFileSync(file, `#!/bin/sh\n${body}\n`);
  fs.chmodSync(file, 0o700);
}

function startFixture({ library = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yiguochu-start-'));
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin);
  fs.copyFileSync(path.join(ROOT, 'start.command'), path.join(dir, 'start.command'));
  if (library) {
    const lib = path.join(dir, 'recipe-library');
    fs.mkdirSync(lib);
    fs.writeFileSync(path.join(lib, 'browse.html'), '<!doctype html><title>browse</title>\n');
    fs.writeFileSync(path.join(lib, 'index.json'), '{"cards":[]}\n');
  }
  const log = path.join(dir, 'commands.log');
  executable(path.join(bin, 'python3'), `echo "python3 $*" >> "$LOG_FILE"\nexit 0`);
  for (const name of ['lsof', 'xargs', 'nohup', 'curl', 'sleep', 'open']) {
    executable(path.join(bin, name), `echo "${name} $*" >> "$LOG_FILE"\nexit 0`);
  }
  return { dir, bin, log, script: path.join(dir, 'start.command') };
}

function runStart(fixture, extraEnv = {}) {
  return spawnSync('/bin/bash', [fixture.script], {
    cwd: fixture.dir,
    encoding: 'utf8',
    timeout: 15000,
    env: {
      PATH: `${fixture.bin}:/usr/bin:/bin`,
      LOG_FILE: fixture.log,
      ...extraEnv,
    },
  });
}

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

test('start.command serves the recipe library browse on the LAN and skips the rice-meal UI', () => {
  const script = read('start.command');
  assert.match(script, /python3\s+-m\s+http\.server/);
  assert.match(script, /--bind\s+0\.0\.0\.0/);
  assert.match(script, /--directory\s+"\$LIB"/);
  assert.match(script, /recipe-library\/browse\.html/);
  assert.doesNotMatch(script, /build-dist\.mjs|rice-meal-v1|ai_proxy\.py|planner-v2-local-bridge|--plan-meal|generate-plan/);
  assert.doesNotMatch(script, /--directory\s+dist/);
  assert.doesNotMatch(script, /open\s+["']index\.html["']/);
});

test('start.command fails closed before serving when the recipe library page is missing', () => {
  const fixture = startFixture({ library: false });
  try {
    const result = runStart(fixture);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /找不到菜谱库/);
    const commands = fs.existsSync(fixture.log) ? fs.readFileSync(fixture.log, 'utf8') : '';
    assert.doesNotMatch(commands, /lsof|nohup|open/);
  } finally {
    fs.rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('start.command opens browse.html without plan-meal or the legacy proxy', () => {
  const fixture = startFixture();
  try {
    const result = runStart(fixture);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const commands = fs.readFileSync(fixture.log, 'utf8');
    assert.match(commands, /nohup python3 -m http\.server 8081 --bind 0\.0\.0\.0 --directory .*recipe-library/);
    assert.match(commands, /open http:\/\/127\.0\.0\.1:8081\/browse\.html/);
    assert.doesNotMatch(commands, /ai_proxy|build-dist|plan-meal|generate-plan|rice-meal/);
  } finally {
    fs.rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test('phone browse pins this week and does not call the planner', () => {
  const html = read('recipe-library/browse.html');
  assert.match(html, /本周待试/);
  assert.match(html, /ingredients/);
  assert.match(html, /steps_now/);
  assert.match(html, /yiguochu-recipe-library-feedback-v1/);
  assert.doesNotMatch(html, /plan-meal|generate-plan|ai_proxy/);
  const index = JSON.parse(read('recipe-library/index.json'));
  assert.deepEqual(index.weekly_pins.map((pin) => pin.id), ['baicai-doufu-menfan', 'roumi-qingcai-fan']);
  assert.equal(index.weekly_pins.every((pin) => pin.label === '本周待试'), true);
  assert.equal(index.cards.length, 106);
  assert.equal(index.cards.every((card) => card.keywords), true);
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
  assert.doesNotMatch(html, /data-del-myfood/);
  assert.doesNotMatch(html, /data-act="toggle-edit"/);
});

test('generation animation names the actual three checks', () => {
  const html = read('index.html');
  for (const label of ['选基础菜', '检查份量时间', '检查步骤安全']) assert.match(html, new RegExp(label));
  assert.doesNotMatch(html, /正在看是不是 40 分钟内能做|第一版有点麻烦，换一版更顺手的/);
});

test('preview planner rollout is explicit, candidate-first, and keeps pantry mode unavailable', () => {
  const html = read('index.html');
  assert.match(html, /function plannerDirectRecommendEnabled\(\)/);
  assert.match(html, /runPlannerFlow\(\{ autoGenerate:false, showCandidates:true \}\)/);
  assert.match(html, /data-act="choose-plan"/);
  assert.match(html, /清库存正在做，先来解决今晚吃什么/);
  assert.doesNotMatch(html, /data-act="use-leftovers"|用剩下的食材再来一锅/);
});
