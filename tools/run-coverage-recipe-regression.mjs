#!/usr/bin/env node
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  pickRecipeSelection,
  selectRecipeCandidates,
} from '../worker/src/worker.js';

const CORPUS_URL = new URL('./data/coverage-recipe-regression.json', import.meta.url);
const LIBRARY_URL = new URL('./data/recipe-library.json', import.meta.url);

export function loadCoverageRegression() {
  return JSON.parse(fs.readFileSync(CORPUS_URL, 'utf8'));
}

function loadRecipeLibrary() {
  return JSON.parse(fs.readFileSync(LIBRARY_URL, 'utf8'));
}

function orderedDifference(all, used) {
  const usedSet = new Set(used);
  return all.filter(item => !usedSet.has(item));
}

function selectionSafetyFlags(selection) {
  const flags = [];
  const used = selection.usedPantry.join('、');
  const safety = selection.recipe.safety_rules.join('；');
  const require = (active, satisfied, code) => {
    if (active && !satisfied) flags.push(code);
  };

  require(/牛肉/u.test(used), /牛肉.*74摄氏度/u.test(safety), 'beef_endpoint_missing');
  require(/鸡腿肉|鸡肉/u.test(used), /鸡腿肉?.*74摄氏度/u.test(safety), 'chicken_endpoint_missing');
  require(/排骨/u.test(used), /排骨.*74摄氏度/u.test(safety), 'rib_endpoint_missing');
  require(/虾仁/u.test(used), /虾仁.*(?:74摄氏度|完全熟透)/u.test(safety), 'shrimp_endpoint_missing');
  require(/鸡蛋/u.test(used), /鸡蛋.*凝固/u.test(safety), 'egg_endpoint_missing');
  require(/豆角/u.test(used), /豆角.*熟透/u.test(safety), 'green_bean_endpoint_missing');
  require(/剩米饭|隔夜米饭/u.test(used), /冷藏/u.test(safety) && /充分复热/u.test(safety), 'leftover_rice_storage_or_reheat_missing');
  return flags;
}

function validateCorpus(corpus) {
  const errors = [];
  if (!Array.isArray(corpus) || corpus.length !== 7) return ['coverage corpus must contain exactly 7 journeys'];
  const ids = new Set();
  for (const item of corpus) {
    const label = item?.id || 'unknown';
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`${label} must be an object`);
      continue;
    }
    if (typeof item.id !== 'string' || !/^[a-z0-9-]+$/.test(item.id)) errors.push(`${label} has invalid id`);
    if (ids.has(item.id)) errors.push(`${label} is duplicated`);
    ids.add(item.id);
    if (!Array.isArray(item.pantry) || item.pantry.length === 0 || item.pantry.some(value => typeof value !== 'string' || !value)) {
      errors.push(`${label} has invalid pantry`);
    }
    if (!Array.isArray(item.dislikes)) errors.push(`${label} has invalid dislikes`);
    if (item.rounds !== 5) errors.push(`${label} must run exactly 5 rounds`);
    if (item.min_families !== 4) errors.push(`${label} must require 4 families`);
  }
  return errors;
}

export function runCoverageRegression({ corpus = loadCoverageRegression(), library = loadRecipeLibrary() } = {}) {
  const errors = validateCorpus(corpus);
  const journeys = [];
  let roundsPassed = 0;
  let coveragePassed = 0;

  if (errors.length) return { errors, journeys, journeysPassed: 0, roundsPassed, coveragePassed };

  for (const testCase of corpus) {
    const initialConstraints = {
      purpose: testCase.purpose,
      servings: testCase.servings,
      pantry: testCase.pantry,
      dislikes: testCase.dislikes,
      recent_base_recipes: [],
    };
    const initialCandidates = selectRecipeCandidates(library, initialConstraints);
    const theoreticalMaximum = Math.max(0, ...initialCandidates.map(item => item.usedPantry.length));
    const recent = [];
    const selections = [];

    for (let round = 0; round < testCase.rounds; round += 1) {
      const constraints = { ...initialConstraints, recent_base_recipes: [...recent] };
      const selection = pickRecipeSelection(selectRecipeCandidates(library, constraints), constraints);
      if (!selection) {
        errors.push(`${testCase.id} round ${round + 1} has no eligible selection`);
        break;
      }
      const unusedExpected = orderedDifference(testCase.pantry, selection.usedPantry);
      const safetyFlags = selectionSafetyFlags(selection);
      const row = {
        recipeId: selection.recipe.id,
        familyId: selection.recipe.family_id,
        usedPantry: selection.usedPantry,
        unusedPantry: selection.unusedPantry,
        coverage: selection.usedPantry.length,
        safetyFlags,
      };
      selections.push(row);
      recent.push(selection.recipe.id);

      if (row.coverage !== theoreticalMaximum) {
        errors.push(`${testCase.id} round ${round + 1} coverage ${row.coverage} is below maximum ${theoreticalMaximum}`);
      } else {
        coveragePassed += 1;
      }
      if (JSON.stringify(row.unusedPantry) !== JSON.stringify(unusedExpected)) {
        errors.push(`${testCase.id} round ${round + 1} unused pantry mismatch`);
      }
      if (safetyFlags.length) errors.push(`${testCase.id} round ${round + 1} safety: ${safetyFlags.join(',')}`);
      roundsPassed += 1;
    }

    const recipeCount = new Set(selections.map(item => item.recipeId)).size;
    const familyCount = new Set(selections.map(item => item.familyId)).size;
    if (recipeCount !== testCase.rounds) errors.push(`${testCase.id} produced only ${recipeCount}/${testCase.rounds} distinct recipes`);
    if (familyCount < testCase.min_families) errors.push(`${testCase.id} covered only ${familyCount}/${testCase.min_families} families`);
    journeys.push({ id: testCase.id, theoreticalMaximum, selections });
  }

  const failedJourneys = new Set(errors.map(error => error.split(' ')[0]));
  const journeysPassed = journeys.filter(item => !failedJourneys.has(item.id)).length;
  return { errors, journeys, journeysPassed, roundsPassed, coveragePassed };
}

function main() {
  const result = runCoverageRegression();
  for (const error of result.errors) console.error(`❌ ${error}`);
  console.log(`覆盖旅程 ${result.journeysPassed}/7 · 五连换 ${result.roundsPassed}/35 · 食材覆盖不退步 ${result.coveragePassed}/35`);
  console.log(result.errors.length ? `❌ 覆盖旅程回归不通过: ${result.errors.length} 项` : '✅ 覆盖旅程回归通过');
  process.exitCode = result.errors.length ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) main();
