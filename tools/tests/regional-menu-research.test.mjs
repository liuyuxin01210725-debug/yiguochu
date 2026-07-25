import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateRegionalMenuResearch } from '../lib/regional-menu-research-validator.mjs';

const library = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
const research = JSON.parse(fs.readFileSync(new URL('../data/regional-menu-research.v1.json', import.meta.url), 'utf8'));

test('regional research ledger contains 24 non-production entries', () => {
  assert.equal(research.entries.length, 24);
  assert.deepEqual(
    validateRegionalMenuResearch(research, new Set(library.recipes.map(recipe => recipe.id))),
    [],
  );
  assert.ok(research.entries.every(entry => entry.status === 'research_queue'));
  assert.ok(research.entries.every(entry => entry.source_confidence === 'discovery_only'));
  assert.ok(research.entries.every(entry => entry.product_destination === 'undecided'));
});

test('research entries cannot masquerade as production recipes', () => {
  const broken = structuredClone(research);
  broken.entries[0].atlas_id = library.recipes[0].id;
  assert.match(
    validateRegionalMenuResearch(broken, new Set(library.recipes.map(recipe => recipe.id))).join('\n'),
    /overlaps production recipe/,
  );
});

test('unverified research requires explicit hypotheses and questions', () => {
  const broken = structuredClone(research);
  broken.entries[0].ingredient_hypothesis = [];
  broken.entries[0].research_questions = [];
  const message = validateRegionalMenuResearch(broken).join('\n');
  assert.match(message, /ingredient_hypothesis/);
  assert.match(message, /research_questions/);
});

test('research entries reject nutrition and production-only generation fields', () => {
  const broken = structuredClone(research);
  broken.entries[0].nutrition = { kcal: 500 };
  broken.entries[0].generation_liquid_ingredients = ['水'];
  const message = validateRegionalMenuResearch(broken).join('\n');
  assert.match(message, /northeast-ribs-beans-corn-cake: nutrition is not allowed in research entries/);
  assert.match(message, /northeast-ribs-beans-corn-cake: generation_liquid_ingredients is not allowed in research entries/);
});

test('research questions require five non-empty strings and hypotheses require non-empty string items', () => {
  const broken = structuredClone(research);
  broken.entries[0].research_questions = [null, ' ', '问题三', '问题四'];
  broken.entries[0].ingredient_hypothesis = ['排骨', null];
  broken.entries[0].pantry_gap_items = [' '];
  const message = validateRegionalMenuResearch(broken).join('\n');
  assert.match(message, /research_questions must contain exactly 5 items/);
  assert.match(message, /research_questions items must be non-empty strings/);
  assert.match(message, /ingredient_hypothesis items must be non-empty strings/);
  assert.match(message, /pantry_gap_items items must be non-empty strings/);
});
