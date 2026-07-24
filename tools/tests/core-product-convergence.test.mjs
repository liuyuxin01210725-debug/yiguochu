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

function startFixture({ bridge = true, planExit = 0 } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yiguochu-start-'));
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin);
  fs.copyFileSync(path.join(ROOT, 'start.command'), path.join(dir, 'start.command'));
  fs.writeFileSync(path.join(dir, 'ai_proxy.py'), '# fixture\n');
  if (bridge) {
    fs.mkdirSync(path.join(dir, 'tools'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'tools', 'planner-v2-local-bridge.mjs'), '// fixture\n');
  }
  const log = path.join(dir, 'commands.log');
  const node = path.join(bin, 'node');
  executable(node, 'exit 0');
  executable(path.join(bin, 'python3'), `echo "python3 $*" >> "$LOG_FILE"\ncase " $* " in *" --plan-meal "*) exit ${planExit};; esac\nexit 0`);
  for (const name of ['lsof', 'xargs', 'nohup', 'curl', 'sleep', 'open']) {
    executable(path.join(bin, name), `echo "${name} $*" >> "$LOG_FILE"\nexit 0`);
  }
  return { dir, bin, log, node, script: path.join(dir, 'start.command') };
}

function runStart(fixture, extraEnv = {}) {
  return spawnSync('/bin/bash', [fixture.script], {
    cwd: fixture.dir,
    encoding: 'utf8',
    timeout: 15000,
    env: {
      PATH: `${fixture.bin}:/usr/bin:/bin`,
      LOG_FILE: fixture.log,
      PLANNER_NODE_EXECUTABLE: fixture.node,
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

test('start.command starts both local services and opens the localhost page', () => {
  const script = read('start.command');
  assert.match(script, /python3\s+ai_proxy\.py/);
  assert.match(script, /python3\s+-m\s+http\.server\s+8081/);
  assert.match(script, /open\s+["']http:\/\/localhost:8081[\/]?["']/);
  assert.doesNotMatch(script, /open\s+["']index\.html["']/);
});

test('start.command validates Node, bridge and a real keyless planner CLI before touching old services', () => {
  const script = read('start.command');
  assert.match(script, /PLANNER_NODE_EXECUTABLE/);
  assert.match(script, /planner-v2-local-bridge\.mjs/);
  assert.match(script, /--plan-meal/);
  assert.ok(script.indexOf('--plan-meal') < script.indexOf('lsof -ti :8765'));
});

test('start.command fails closed before kill/open when Node, bridge or planner CLI is unavailable', async t => {
  const cases = [
    ['missing Node', { bridge: true, planExit: 0 }, { PLANNER_NODE_EXECUTABLE: '/missing/node' }],
    ['missing bridge', { bridge: false, planExit: 0 }, {}],
    ['planner CLI failure', { bridge: true, planExit: 3 }, {}],
  ];
  for (const [name, options, env] of cases) {
    await t.test(name, () => {
      const fixture = startFixture(options);
      try {
        const result = runStart(fixture, env);
        assert.notEqual(result.status, 0);
        assert.match(`${result.stdout}${result.stderr}`, /本地规划组件未就绪|需要\s*Node\.js/);
        const commands = fs.existsSync(fixture.log) ? fs.readFileSync(fixture.log, 'utf8') : '';
        assert.doesNotMatch(commands, /lsof|nohup|open/);
      } finally {
        fs.rmSync(fixture.dir, { recursive: true, force: true });
      }
    });
  }
});

test('start.command keeps the normal launch path after successful planner preflight', () => {
  const fixture = startFixture();
  try {
    const result = runStart(fixture);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const commands = fs.readFileSync(fixture.log, 'utf8');
    assert.match(commands, /python3 ai_proxy\.py --plan-meal/);
    assert.match(commands, /lsof -ti :8765/);
    assert.match(commands, /nohup python3 ai_proxy\.py/);
    assert.match(commands, /nohup python3 -m http\.server 8081/);
    assert.match(commands, /open http:\/\/localhost:8081/);
    assert.ok(commands.indexOf('--plan-meal') < commands.indexOf('lsof -ti :8765'));
  } finally {
    fs.rmSync(fixture.dir, { recursive: true, force: true });
  }
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
