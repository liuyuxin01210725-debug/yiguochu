import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  loadCoverageRegression,
  runCoverageRegression,
} from '../run-coverage-recipe-regression.mjs';

test('coverage regression locks seven real five-round journeys', () => {
  const corpus = loadCoverageRegression();
  assert.equal(corpus.length, 7);
  assert.deepEqual(corpus.map(item => item.id), [
    'broccoli-beef',
    'chicken-leg-potato',
    'household-leafy-greens',
    'leftover-rice-egg',
    'ribs-green-bean',
    'ribs-potato',
    'tofu-greens',
  ]);
  assert.ok(corpus.every(item => item.rounds === 5 && item.min_families === 4));
});

test('all seven production journeys keep maximum coverage and zero hard safety flags', () => {
  const result = runCoverageRegression();
  assert.deepEqual(result.errors, []);
  assert.equal(result.journeysPassed, 7);
  assert.equal(result.roundsPassed, 35);
  assert.equal(result.coveragePassed, 35);
  for (const journey of result.journeys) {
    assert.equal(new Set(journey.selections.map(item => item.recipeId)).size, 5, journey.id);
    assert.ok(new Set(journey.selections.map(item => item.familyId)).size >= 4, journey.id);
    assert.ok(journey.selections.every(item => item.safetyFlags.length === 0), journey.id);
  }
});

test('coverage regression CLI reports the complete release summary', () => {
  const runner = new URL('../run-coverage-recipe-regression.mjs', import.meta.url);
  assert.equal(fs.existsSync(runner), true);
  const run = spawnSync(process.execPath, [fileURLToPath(runner)], { encoding: 'utf8' });
  assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
  assert.match(run.stdout, /覆盖旅程 7\/7 · 五连换 35\/35 · 食材覆盖不退步 35\/35/);
});
