import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

test('rice product boots into a source-backed rotation instead of the ingredient form', () => {
  assert.match(page, /source-rotation-loading/);
  assert.match(page, /source-backed-one-pot-shelf\.v1\.json/);
  assert.match(page, /initSourceRotation\(\)/);
});

test('source-backed rotation has one recipe and one swap action, with no candidate-selection action', () => {
  assert.match(page, /data-act="rotate-source-recipe"/);
  assert.match(page, /source-rotation-card/);
  assert.doesNotMatch(page, /sourceRotationScreen[\s\S]{0,12000}choose-rice-meal/);
});

test('source-backed rotation does not call planner or generation endpoints', () => {
  const start = page.indexOf('function initSourceRotation');
  const end = page.indexOf('function profileScreen', start);
  const sourceFlow = page.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.doesNotMatch(sourceFlow, /plan-meal|generate-plan|fetchRealDish|DeepSeek/i);
});
