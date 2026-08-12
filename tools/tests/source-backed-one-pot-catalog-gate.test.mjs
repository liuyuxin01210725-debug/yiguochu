import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  validateSourceBackedCatalogFiles,
} from '../check-source-backed-one-pot-catalog.mjs';

const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));

test('reports self-citations and stale generated artifacts together', () => {
  // Removing either catalog validation or exact artifact comparison must fail this test.
  const catalog = readJson('source-backed-one-pot-recipes.v1.json');
  catalog.recipes[0].source_refs[0].url = 'https://yiguochu.pages.dev/recipes.html?id=self';
  const errors = validateSourceBackedCatalogFiles({
    catalog,
    migration: readJson('source-backed-catalog-migration.v1.json'),
    artifactContents: new Map([['docs/source-backed-one-pot-recipes.md', 'stale']]),
  });

  assert.ok(errors.some(error => error.includes('project self-citation')));
  assert.ok(errors.some(error => error.includes('stale')));
});

test('returns validation errors instead of throwing for malformed aggregate arguments', () => {
  // Replacing the defensive boundary with direct property access must fail this test.
  assert.doesNotThrow(() => validateSourceBackedCatalogFiles());
  const errors = validateSourceBackedCatalogFiles({
    catalog: null,
    migration: null,
    artifactContents: null,
  });

  assert.ok(Array.isArray(errors));
  assert.ok(errors.length >= 3);
  assert.match(errors.join('\n'), /catalog|migration|artifact/iu);
});
